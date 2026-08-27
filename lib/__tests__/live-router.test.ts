import { describe, expect, it, vi, beforeEach } from "vitest";
import { emptyState, type ConversationState } from "../live/cart";
import { handleInbound, parseShopCommand, parseStoreCode, type LiveData, type LiveProduct, type LiveStore } from "../live/router";

/**
 * The conversation itself, driven the way a customer drives it.
 *
 * No WhatsApp and no database: a fake LiveData stands in, which is the point of
 * keeping the router pure. These walk the real journey (find shop, browse, add,
 * check out, pay) and the ways a customer can go sideways.
 */

const STORE: LiveStore = {
  siteId: "site-1", storeCode: "ADEBAYO", name: "Adebayo Fashion", greeting: null, paused: false,
};
const OTHER: LiveStore = {
  siteId: "site-2", storeCode: "KITCHEN", name: "Kitchen One", greeting: null, paused: false,
};

const PRODUCTS: LiveProduct[] = [
  { id: "p1", name: "Ankara Shirt", price: 12000, stock: 5, category: "Shirts" },
  { id: "p2", name: "Lace Gown", price: 30000, stock: 0, category: "Dresses" },
];

let checkoutCalls: any[] = [];
let checkoutResult: any = { ok: true, reference: "tomwa_1", payUrl: "https://pay.test/1", total: 12000 };

const data: LiveData = {
  async findStoreByCode(code) {
    if (code === "ADEBAYO") return STORE;
    if (code === "KITCHEN") return OTHER;
    return null;
  },
  async getStore(siteId) {
    return siteId === "site-1" ? STORE : siteId === "site-2" ? OTHER : null;
  },
  async listCategories() { return ["Shirts", "Dresses"]; },
  async listProducts(_site, { category, offset, limit }) {
    const filtered = category ? PRODUCTS.filter((p) => p.category === category) : PRODUCTS;
    return filtered.slice(offset, offset + limit);
  },
  async getProduct(_site, id) { return PRODUCTS.find((p) => p.id === id) || null; },
  async startCheckout(input) { checkoutCalls.push(input); return checkoutResult; },
  async recentOrders() {
    return [{ reference: "tomwa_9", status: "shipped", total: 12000, placedAt: "3 Aug" }];
  },
};

beforeEach(() => {
  checkoutCalls = [];
  checkoutResult = { ok: true, reference: "tomwa_1", payUrl: "https://pay.test/1", total: 12000 };
});

/** Everything a message body might be, flattened so tests can search it. */
function said(replies: any[]): string {
  return JSON.stringify(replies);
}

const bound = (): ConversationState => ({ screen: "home", siteId: "site-1", storeCode: "ADEBAYO", cart: [] });

describe("store codes", () => {
  it("reads the explicit shop command in any case", () => {
    expect(parseShopCommand("SHOP ADEBAYO")).toBe("ADEBAYO");
    expect(parseShopCommand("shop adebayo")).toBe("ADEBAYO");
    expect(parseShopCommand("Shop:adebayo")).toBe("ADEBAYO");
  });

  it("does not read a bare word as a shop command", () => {
    expect(parseShopCommand("hello")).toBeNull();
    expect(parseShopCommand("ADEBAYO")).toBeNull();
  });

  it("accepts a bare code only in the loose form used before a store is bound", () => {
    expect(parseStoreCode("ADEBAYO")).toBe("ADEBAYO");
    expect(parseStoreCode("hi")).toBeNull();
  });
});

describe("finding a store", () => {
  it("asks for a code when it has none", async () => {
    const { state, replies } = await handleInbound({ waId: "234800", text: "hi" }, emptyState(), data);
    expect(state.siteId).toBeUndefined();
    expect(said(replies)).toMatch(/store's code/i);
  });

  it("binds the store and welcomes the customer", async () => {
    const { state, replies } = await handleInbound({ waId: "234800", text: "SHOP ADEBAYO" }, emptyState(), data);
    expect(state.siteId).toBe("site-1");
    expect(state.screen).toBe("home");
    expect(said(replies)).toContain("Adebayo Fashion");
  });

  it("says so when the code is wrong, and stays unbound", async () => {
    const { state, replies } = await handleInbound({ waId: "234800", text: "SHOP NOPE" }, emptyState(), data);
    expect(state.siteId).toBeUndefined();
    expect(said(replies)).toMatch(/couldn't find/i);
  });

  it("turns a paused store away instead of taking an order", async () => {
    const paused = { ...data, findStoreByCode: async () => ({ ...STORE, paused: true }) };
    const { state, replies } = await handleInbound({ waId: "234800", text: "SHOP ADEBAYO" }, emptyState(), paused);
    expect(state.siteId).toBeUndefined();
    expect(said(replies)).toMatch(/not taking orders/i);
  });
});

describe("browsing", () => {
  it("offers categories when the store has more than one", async () => {
    const { state, replies } = await handleInbound({ waId: "1", replyId: "shop" }, bound(), data);
    expect(state.screen).toBe("categories");
    expect(said(replies)).toContain("Shirts");
  });

  it("lists the products in a chosen category", async () => {
    const { state, replies } = await handleInbound({ waId: "1", replyId: "cat:Shirts" }, bound(), data);
    expect(state.category).toBe("Shirts");
    expect(state.screen).toBe("products");
    expect(said(replies)).toContain("Ankara Shirt");
    expect(said(replies)).not.toContain("Lace Gown");
  });

  it("shows a product with its price", async () => {
    const { state, replies } = await handleInbound({ waId: "1", replyId: "p:p1" }, bound(), data);
    expect(state.viewing).toBe("p1");
    expect(said(replies)).toContain("Ankara Shirt");
  });

  it("says an item is gone rather than crashing", async () => {
    const { replies } = await handleInbound({ waId: "1", replyId: "p:ghost" }, bound(), data);
    expect(said(replies)).toMatch(/no longer available/i);
  });
});

describe("the cart", () => {
  it("adds an item and reports the running total", async () => {
    const { state, replies } = await handleInbound({ waId: "1", replyId: "add:p1" }, bound(), data);
    expect(state.cart).toHaveLength(1);
    expect(said(replies)).toContain("Ankara Shirt");
  });

  it("refuses to add something out of stock", async () => {
    const { state, replies } = await handleInbound({ waId: "1", replyId: "add:p2" }, bound(), data);
    expect(state.cart).toHaveLength(0);
    expect(said(replies)).toMatch(/out of stock/i);
  });

  it("increases quantity from the edit list", async () => {
    let s = bound();
    ({ state: s } = await handleInbound({ waId: "1", replyId: "add:p1" }, s, data));
    ({ state: s } = await handleInbound({ waId: "1", replyId: "inc:p1" }, s, data));
    expect(s.cart[0].qty).toBe(2);
  });

  it("removes a line", async () => {
    let s = bound();
    ({ state: s } = await handleInbound({ waId: "1", replyId: "add:p1" }, s, data));
    ({ state: s } = await handleInbound({ waId: "1", replyId: "rm:p1" }, s, data));
    expect(s.cart).toHaveLength(0);
  });

  it("clears the whole cart on request", async () => {
    let s = bound();
    ({ state: s } = await handleInbound({ waId: "1", replyId: "add:p1" }, s, data));
    ({ state: s } = await handleInbound({ waId: "1", replyId: "clear" }, s, data));
    expect(s.cart).toHaveLength(0);
    expect(s.screen).toBe("home");
  });
});

describe("checkout", () => {
  async function reachConfirm() {
    let s = bound();
    ({ state: s } = await handleInbound({ waId: "1", replyId: "add:p1" }, s, data));
    ({ state: s } = await handleInbound({ waId: "1", replyId: "checkout" }, s, data));
    ({ state: s } = await handleInbound({ waId: "1", text: "Ada Obi" }, s, data));
    ({ state: s } = await handleInbound({ waId: "1", text: "12 Allen Avenue, Ikeja" }, s, data));
    return s;
  }

  it("will not start with an empty cart", async () => {
    const { state, replies } = await handleInbound({ waId: "1", replyId: "checkout" }, bound(), data);
    expect(state.screen).toBe("home");
    expect(said(replies)).toMatch(/cart is empty/i);
  });

  it("collects name then address, then shows the order back", async () => {
    const s = await reachConfirm();
    expect(s.screen).toBe("confirm");
    expect(s.buyer).toEqual({ name: "Ada Obi", address: "12 Allen Avenue, Ikeja" });
  });

  it("sends the cart to checkout and returns a payment link", async () => {
    const s = await reachConfirm();
    const { state, replies } = await handleInbound({ waId: "1", replyId: "pay" }, s, data);
    expect(checkoutCalls).toHaveLength(1);
    expect(checkoutCalls[0].cart).toEqual([{ productId: "p1", qty: 1 }]);
    expect(checkoutCalls[0].buyerName).toBe("Ada Obi");
    expect(state.screen).toBe("paying");
    expect(state.pendingReference).toBe("tomwa_1");
    expect(said(replies)).toContain("https://pay.test/1");
  });

  it("keeps the cart while payment is pending, so it can be resumed", async () => {
    const s = await reachConfirm();
    const { state } = await handleInbound({ waId: "1", replyId: "pay" }, s, data);
    expect(state.cart).toHaveLength(1);
  });

  it("explains itself when checkout fails, without losing the cart", async () => {
    checkoutResult = { ok: false, error: "Nothing in your cart is available to order any more." };
    const s = await reachConfirm();
    const { state, replies } = await handleInbound({ waId: "1", replyId: "pay" }, s, data);
    expect(state.cart).toHaveLength(1);
    expect(said(replies)).toMatch(/no longer|not available|available to order/i);
  });
});

describe("moving between stores", () => {
  it("switches shop and abandons the other shop's cart", async () => {
    let s = bound();
    ({ state: s } = await handleInbound({ waId: "1", replyId: "add:p1" }, s, data));
    expect(s.cart).toHaveLength(1);

    const { state, replies } = await handleInbound({ waId: "1", text: "SHOP KITCHEN" }, s, data);
    expect(state.siteId).toBe("site-2");
    expect(state.cart).toHaveLength(0);
    expect(said(replies)).toContain("Kitchen One");
  });

  it("does not switch when a customer just types a word", async () => {
    let s = bound();
    ({ state: s } = await handleInbound({ waId: "1", replyId: "add:p1" }, s, data));
    const { state } = await handleInbound({ waId: "1", text: "kitchen" }, s, data);
    expect(state.siteId).toBe("site-1");
    expect(state.cart).toHaveLength(1);
  });
});

describe("tracking", () => {
  it("reads back recent orders in plain words", async () => {
    const { replies } = await handleInbound({ waId: "1", text: "track" }, bound(), data);
    expect(said(replies)).toContain("tomwa_9");
    expect(said(replies)).toMatch(/on the way/i);
  });
});

describe("recovering", () => {
  it("drops the customer if the store disappears mid-conversation", async () => {
    const gone = { ...data, getStore: async () => null };
    const { state, replies } = await handleInbound({ waId: "1", replyId: "shop" }, bound(), gone);
    expect(state.siteId).toBeUndefined();
    expect(said(replies)).toMatch(/no longer available/i);
  });

  it("falls back to the menu for anything it does not understand", async () => {
    const { replies } = await handleInbound({ waId: "1", text: "do you deliver to Abuja?" }, bound(), data);
    expect(said(replies)).toContain("Adebayo Fashion");
  });
});
