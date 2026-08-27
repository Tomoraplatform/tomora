import { formatNaira } from "@/lib/utils";
import { LIMITS } from "./config";
import { addToCart, cartCount, cartTotal, removeFromCart, stepQty, type ConversationState } from "./cart";
import { buttons, linkButton, list, text, type OutboundMessage } from "./messages";

/**
 * The conversation, as a state machine.
 *
 * No database and no network: everything it needs arrives through `LiveData`,
 * and everything it decides comes back as a new state plus the messages to
 * send. That is what makes the whole shopping flow testable without WhatsApp
 * credentials, a Meta app, or a seller.
 */

export interface LiveProduct {
  id: string;
  name: string;
  description?: string | null;
  /** The price a customer actually pays, offers already applied. */
  price: number;
  stock: number;
  category?: string | null;
}

export interface LiveStore {
  siteId: string;
  storeCode: string;
  name: string;
  greeting?: string | null;
  paused: boolean;
}

export interface TrackedOrder {
  reference: string;
  status: string;
  total: number;
  placedAt: string;
}

export interface LiveData {
  findStoreByCode(code: string): Promise<LiveStore | null>;
  getStore(siteId: string): Promise<LiveStore | null>;
  listCategories(siteId: string): Promise<string[]>;
  listProducts(siteId: string, opts: { category?: string; offset: number; limit: number }): Promise<LiveProduct[]>;
  getProduct(siteId: string, productId: string): Promise<LiveProduct | null>;
  /** Writes the order rows and returns a link the customer can pay at. */
  startCheckout(input: {
    siteId: string;
    waId: string;
    buyerName: string;
    address: string;
    cart: { productId: string; qty: number }[];
  }): Promise<{ ok: boolean; reference?: string; payUrl?: string; total?: number; error?: string }>;
  recentOrders(siteId: string, waId: string): Promise<TrackedOrder[]>;
}

export interface Inbound {
  waId: string;
  /** Free text the customer typed. */
  text?: string;
  /** The id of a button or list row they tapped. */
  replyId?: string;
  /** Their WhatsApp profile name, used to prefill checkout. */
  profileName?: string;
}

export interface Handled {
  state: ConversationState;
  replies: OutboundMessage[];
}

const PAGE_SIZE = 8;

const STATUS_WORDS: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid, being prepared",
  packed: "Packed, awaiting dispatch",
  shipped: "On the way",
  delivered: "Delivered",
};

/**
 * "SHOP ADEBAYO" and nothing else.
 *
 * Only the explicit form counts, because this is also what lets a customer
 * move from one store to another. A bare word would mean someone typing
 * "hello" gets yanked out of the shop they are in.
 */
export function parseShopCommand(raw: string): string | null {
  const m = (raw || "").trim().toUpperCase().match(/^SHOP[\s:_-]+([A-Z0-9]{2,12})$/);
  return m ? m[1] : null;
}

/**
 * The looser reading, used only before a store is bound: at that point the
 * customer has nothing to lose, so a bare code is worth trying.
 */
export function parseStoreCode(raw: string): string | null {
  const explicit = parseShopCommand(raw);
  if (explicit) return explicit;
  const s = (raw || "").trim().toUpperCase();
  return /^[A-Z0-9]{3,12}$/.test(s) ? s : null;
}

/** The main entry point: one inbound message in, a new state and replies out. */
export async function handleInbound(
  input: Inbound,
  prev: ConversationState,
  data: LiveData
): Promise<Handled> {
  const state: ConversationState = { ...prev, cart: [...prev.cart] };
  const tapped = input.replyId || "";
  const typed = (input.text || "").trim();
  const lower = typed.toLowerCase();

  // ---- binding a store ----------------------------------------------------
  // On one shared number, nothing can happen until we know whose shop this is.
  if (!state.siteId) {
    const code = parseStoreCode(typed);
    if (!code) return { state, replies: [needStoreCode()] };
    const store = await data.findStoreByCode(code);
    if (!store) {
      return { state, replies: [text(`I couldn't find a store with the code *${code}*. Check the code and send it again, or use the link the seller gave you.`)] };
    }
    if (store.paused) {
      return { state, replies: [text(`*${store.name}* is not taking orders on WhatsApp right now. Please try again later.`)] };
    }
    state.siteId = store.siteId;
    state.storeCode = store.storeCode;
    state.screen = "home";
    return { state, replies: [welcome(store)] };
  }

  // Switching shops. On one shared number this is the only way out of a store,
  // and it has to work from any screen, so it is checked before anything else.
  const switchTo = parseShopCommand(typed);
  if (switchTo && switchTo !== state.storeCode) {
    const next = await data.findStoreByCode(switchTo);
    if (next && !next.paused) {
      // A cart belongs to one seller, so it does not travel.
      const fresh: ConversationState = {
        screen: "home", siteId: next.siteId, storeCode: next.storeCode, cart: [],
      };
      return { state: fresh, replies: [welcome(next)] };
    }
    if (!next) return { state, replies: [text(`I couldn't find a store with the code *${switchTo}*.`)] };
  }

  const store = await data.getStore(state.siteId);
  if (!store) {
    // The seller turned Live off or the site went away mid-conversation.
    return { state: { screen: "start", cart: [] }, replies: [text("That store is no longer available on WhatsApp.")] };
  }

  // ---- global escapes, available from any screen ---------------------------
  if (tapped === "home" || ["menu", "hi", "hello", "start", "home"].includes(lower)) {
    state.screen = "home";
    return { state, replies: [homeMenu(store, state)] };
  }
  if (tapped === "cart" || lower === "cart") {
    state.screen = "cart";
    return { state, replies: cartScreen(state) };
  }
  if (tapped === "track" || lower === "track") {
    state.screen = "track";
    const orders = await data.recentOrders(store.siteId, input.waId);
    return { state, replies: [trackScreen(orders)] };
  }

  // ---- typed answers the current screen is waiting for ---------------------
  if (state.screen === "ask_name" && typed && !tapped) {
    state.buyer = { ...(state.buyer || {}), name: typed.slice(0, 80) };
    state.screen = "ask_address";
    return { state, replies: [text("Thanks. What address should we deliver to?\n\nInclude the street, area and city.")] };
  }
  if (state.screen === "ask_address" && typed && !tapped) {
    state.buyer = { ...(state.buyer || {}), address: typed.slice(0, 200) };
    state.screen = "confirm";
    return { state, replies: [confirmScreen(state)] };
  }

  // ---- taps ---------------------------------------------------------------
  if (tapped === "shop" || tapped === "cats" || lower === "shop") {
    const categories = await data.listCategories(store.siteId);
    if (categories.length <= 1) {
      state.category = undefined;
      state.page = 0;
      state.screen = "products";
      return { state, replies: await productList(store, state, data) };
    }
    state.screen = "categories";
    return {
      state,
      replies: [list("What are you looking for?", "Categories",
        categories.slice(0, LIMITS.listRows).map((c) => ({ id: `cat:${c}`, title: c })),
        { header: store.name, sectionTitle: "Categories" })],
    };
  }

  if (tapped.startsWith("cat:")) {
    state.category = tapped.slice(4);
    state.page = 0;
    state.screen = "products";
    return { state, replies: await productList(store, state, data) };
  }

  if (tapped === "more") {
    state.page = (state.page || 0) + 1;
    return { state, replies: await productList(store, state, data) };
  }

  if (tapped.startsWith("p:")) {
    const product = await data.getProduct(store.siteId, tapped.slice(2));
    if (!product) return { state, replies: [text("That item is no longer available.")] };
    state.viewing = product.id;
    state.screen = "product";
    return { state, replies: [productScreen(product)] };
  }

  if (tapped.startsWith("add:")) {
    const product = await data.getProduct(store.siteId, tapped.slice(4));
    if (!product) return { state, replies: [text("That item is no longer available.")] };
    if (product.stock <= 0) {
      return { state, replies: [text(`*${product.name}* is out of stock right now.`)] };
    }
    state.cart = addToCart(state.cart, { productId: product.id, name: product.name, price: product.price });
    state.screen = "cart";
    return {
      state,
      replies: [buttons(
        `Added *${product.name}*.\n\nYour cart: ${cartCount(state.cart)} item${cartCount(state.cart) === 1 ? "" : "s"}, ${formatNaira(cartTotal(state.cart))}.`,
        [
          { id: "shop", title: "Keep shopping" },
          { id: "cart", title: "View cart" },
          { id: "checkout", title: "Checkout" },
        ]
      )],
    };
  }

  const cartEdit = tapped.match(/^(inc|dec|rm):(.+)$/);
  if (cartEdit) {
    const [, action, id] = cartEdit;
    state.cart = action === "rm"
      ? removeFromCart(state.cart, id)
      : stepQty(state.cart, id, action === "inc" ? 1 : -1);
    state.screen = "cart";
    return { state, replies: cartScreen(state) };
  }

  if (tapped === "clear") {
    state.cart = [];
    state.screen = "home";
    return { state, replies: [text("Cart cleared."), homeMenu(store, state)] };
  }

  if (tapped === "checkout") {
    if (!state.cart.length) {
      state.screen = "home";
      return { state, replies: [text("Your cart is empty."), homeMenu(store, state)] };
    }
    // The WhatsApp profile name is a sensible default, but it is often a
    // nickname, so it is offered rather than assumed.
    state.screen = "ask_name";
    const suggestion = input.profileName ? `\n\nReply *${input.profileName}* if that's right.` : "";
    return { state, replies: [text(`Almost there. What name should the order be under?${suggestion}`)] };
  }

  if (tapped === "edit") {
    state.screen = "ask_name";
    return { state, replies: [text("No problem. What name should the order be under?")] };
  }

  if (tapped === "pay") {
    if (!state.cart.length) {
      state.screen = "home";
      return { state, replies: [text("Your cart is empty."), homeMenu(store, state)] };
    }
    const res = await data.startCheckout({
      siteId: store.siteId,
      waId: input.waId,
      buyerName: state.buyer?.name || input.profileName || "WhatsApp customer",
      address: state.buyer?.address || "",
      cart: state.cart.map((l) => ({ productId: l.productId, qty: l.qty })),
    });
    if (!res.ok || !res.payUrl) {
      return { state, replies: [text(res.error || "Something went wrong starting your payment. Please try again.")] };
    }
    state.screen = "paying";
    state.pendingReference = res.reference;
    // The cart is kept until payment is confirmed, so an abandoned payment can
    // be resumed instead of rebuilt from nothing.
    return {
      state,
      replies: [linkButton(
        `Your order comes to *${formatNaira(res.total || cartTotal(state.cart))}*.\n\nTap below to pay securely. Come back here afterwards and I'll confirm it.`,
        res.payUrl,
        "Pay now"
      )],
    };
  }

  // ---- anything else ------------------------------------------------------
  return { state, replies: [homeMenu(store, state)] };
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

function needStoreCode(): OutboundMessage {
  return text(
    "Hi! 👋 This is *Tomora Live*, where you can shop from a store right here in WhatsApp.\n\n" +
    "To start, send the store's code, like *SHOP ADEBAYO*, or tap the link the seller gave you."
  );
}

function welcome(store: LiveStore): OutboundMessage {
  const greeting = store.greeting?.trim() || `Welcome to *${store.name}* 👋`;
  return buttons(`${greeting}\n\nWhat would you like to do?`, [
    { id: "shop", title: "Shop" },
    { id: "track", title: "Track order" },
    { id: "cart", title: "View cart" },
  ]);
}

function homeMenu(store: LiveStore, state: ConversationState): OutboundMessage {
  const count = cartCount(state.cart);
  const line = count
    ? `You have ${count} item${count === 1 ? "" : "s"} in your cart (${formatNaira(cartTotal(state.cart))}).`
    : "What would you like to do?";
  return buttons(`*${store.name}*\n\n${line}`, [
    { id: "shop", title: "Shop" },
    { id: "cart", title: count ? "View cart" : "Track order" },
    { id: count ? "checkout" : "track", title: count ? "Checkout" : "Contact" },
  ]);
}

async function productList(store: LiveStore, state: ConversationState, data: LiveData): Promise<OutboundMessage[]> {
  const page = state.page || 0;
  // One extra row tells us whether a "Show more" is worth offering.
  const items = await data.listProducts(store.siteId, {
    category: state.category,
    offset: page * PAGE_SIZE,
    limit: PAGE_SIZE + 1,
  });
  const hasMore = items.length > PAGE_SIZE;
  const shown = items.slice(0, PAGE_SIZE);

  if (!shown.length) {
    return [text(page > 0 ? "That's everything." : "This store has no products listed yet.")];
  }

  const rows = shown.map((p) => ({
    id: `p:${p.id}`,
    title: p.name,
    description: `${formatNaira(p.price)}${p.stock <= 0 ? " · out of stock" : ""}`,
  }));
  if (hasMore) rows.push({ id: "more", title: "Show more", description: "See the next items" });

  const heading = state.category ? `${store.name} · ${state.category}` : store.name;
  return [list("Tap an item to see it.", "See items", rows, { header: heading, sectionTitle: "Items" })];
}

function productScreen(p: LiveProduct): OutboundMessage {
  const body = [
    `*${p.name}*`,
    formatNaira(p.price),
    p.description ? `\n${p.description}` : "",
    p.stock <= 0 ? "\n_Out of stock_" : "",
  ].filter(Boolean).join("\n");

  return buttons(body, [
    ...(p.stock > 0 ? [{ id: `add:${p.id}`, title: "Add to cart" }] : []),
    { id: "shop", title: "Keep shopping" },
    { id: "cart", title: "View cart" },
  ]);
}

function cartScreen(state: ConversationState): OutboundMessage[] {
  if (!state.cart.length) {
    return [buttons("Your cart is empty.", [
      { id: "shop", title: "Start shopping" },
      { id: "home", title: "Main menu" },
    ])];
  }

  const lines = state.cart
    .map((l) => `• ${l.name} ×${l.qty} — ${formatNaira(l.price * l.qty)}`)
    .join("\n");
  const body = `*Your cart*\n\n${lines}\n\n*Total: ${formatNaira(cartTotal(state.cart))}*`;

  const messages: OutboundMessage[] = [
    buttons(body, [
      { id: "checkout", title: "Checkout" },
      { id: "shop", title: "Keep shopping" },
      { id: "clear", title: "Clear cart" },
    ]),
  ];

  // Adjusting quantities needs one row per line, which only a list can carry.
  if (state.cart.length) {
    const rows = state.cart.flatMap((l) => [
      { id: `inc:${l.productId}`, title: `＋ ${l.name}`, description: `Now ${l.qty}` },
      { id: `rm:${l.productId}`, title: `✕ ${l.name}`, description: "Remove from cart" },
    ]);
    messages.push(list("Need to change quantities?", "Edit cart", rows, { sectionTitle: "Edit items" }));
  }

  return messages;
}

function confirmScreen(state: ConversationState): OutboundMessage {
  const lines = state.cart.map((l) => `• ${l.name} ×${l.qty} — ${formatNaira(l.price * l.qty)}`).join("\n");
  const body = [
    "*Please check your order*",
    "",
    lines,
    "",
    `*Total: ${formatNaira(cartTotal(state.cart))}*`,
    "",
    `Name: ${state.buyer?.name || "-"}`,
    `Deliver to: ${state.buyer?.address || "-"}`,
  ].join("\n");

  return buttons(body, [
    { id: "pay", title: "Confirm & pay" },
    { id: "edit", title: "Change details" },
    { id: "cart", title: "Edit cart" },
  ]);
}

function trackScreen(orders: TrackedOrder[]): OutboundMessage {
  if (!orders.length) {
    return buttons("You have no orders with this store yet.", [
      { id: "shop", title: "Start shopping" },
      { id: "home", title: "Main menu" },
    ]);
  }
  const lines = orders
    .map((o) => `• *${o.reference}* — ${STATUS_WORDS[o.status] || o.status}\n  ${formatNaira(o.total)} · ${o.placedAt}`)
    .join("\n\n");
  return buttons(`*Your recent orders*\n\n${lines}`, [
    { id: "shop", title: "Shop again" },
    { id: "home", title: "Main menu" },
  ]);
}
