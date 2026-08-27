import { describe, expect, it } from "vitest";
import {
  addToCart, cartCount, cartTotal, clampQty, emptyState, readState, removeFromCart, stepQty,
  type CartLine,
} from "../live/cart";

/**
 * The cart a WhatsApp customer builds up.
 *
 * It is held server-side and survives across messages, so the interesting
 * cases are the ones a customer can reach by tapping the same button twice or
 * coming back a week later to a state written by an older version.
 */

const line = (id: string, qty = 1, price = 1000): CartLine =>
  ({ productId: id, name: `Item ${id}`, price, qty });

describe("addToCart", () => {
  it("adds a new item", () => {
    const cart = addToCart([], { productId: "a", name: "Shirt", price: 5000 });
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(1);
  });

  it("raises the quantity instead of duplicating the line", () => {
    const cart = addToCart(addToCart([], { productId: "a", name: "Shirt", price: 5000 }), {
      productId: "a", name: "Shirt", price: 5000,
    });
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(2);
  });

  it("does not mutate the cart it was given", () => {
    const before: CartLine[] = [line("a")];
    addToCart(before, { productId: "b", name: "B", price: 100 });
    expect(before).toHaveLength(1);
  });

  it("refuses a negative price", () => {
    const cart = addToCart([], { productId: "a", name: "Odd", price: -500 });
    expect(cart[0].price).toBe(0);
  });
});

describe("stepQty", () => {
  it("increases and decreases", () => {
    let cart = [line("a", 2)];
    cart = stepQty(cart, "a", 1);
    expect(cart[0].qty).toBe(3);
    cart = stepQty(cart, "a", -1);
    expect(cart[0].qty).toBe(2);
  });

  it("removes the line when it reaches zero", () => {
    const cart = stepQty([line("a", 1)], "a", -1);
    expect(cart).toHaveLength(0);
  });

  it("never goes above the WhatsApp-safe ceiling", () => {
    const cart = stepQty([line("a", 99)], "a", 1);
    expect(cart[0].qty).toBe(99);
  });

  it("ignores an item that is not in the cart", () => {
    const cart = stepQty([line("a", 1)], "zzz", 1);
    expect(cart).toEqual([line("a", 1)]);
  });
});

describe("removeFromCart", () => {
  it("removes only the named line", () => {
    const cart = removeFromCart([line("a"), line("b")], "a");
    expect(cart.map((l) => l.productId)).toEqual(["b"]);
  });
});

describe("totals", () => {
  it("multiplies price by quantity across lines", () => {
    const cart = [line("a", 2, 1500), line("b", 3, 1000)];
    expect(cartTotal(cart)).toBe(6000);
    expect(cartCount(cart)).toBe(5);
  });

  it("is zero for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
    expect(cartCount([])).toBe(0);
  });
});

describe("clampQty", () => {
  it("keeps quantities inside 1..99", () => {
    expect(clampQty(0)).toBe(1);
    expect(clampQty(-5)).toBe(1);
    expect(clampQty(500)).toBe(99);
    expect(clampQty(2.4)).toBe(2);
  });

  it("falls back to 1 for nonsense", () => {
    expect(clampQty(NaN)).toBe(1);
  });
});

describe("readState", () => {
  it("returns a usable state for nothing at all", () => {
    const fresh = readState(undefined);
    expect(fresh.screen).toBe(emptyState().screen);
    expect(fresh.cart).toEqual([]);
    expect(fresh.siteId).toBeUndefined();
    expect(readState(null).cart).toEqual([]);
  });

  it("drops cart lines that lost their product id", () => {
    const state = readState({ screen: "cart", cart: [{ name: "orphan", price: 10, qty: 1 }] });
    expect(state.cart).toEqual([]);
  });

  it("repairs a quantity stored out of range", () => {
    const state = readState({ cart: [{ productId: "a", name: "A", price: 10, qty: 9999 }] });
    expect(state.cart[0].qty).toBe(99);
  });

  it("survives a cart that is not an array", () => {
    expect(readState({ cart: "nope" }).cart).toEqual([]);
  });
});
