import { test, expect, beforeEach, vi } from "vitest";

import {
  getOrders,
  getOrderById,
  addOrder,
  advanceOrderStatus,
} from "./orderService";

// JSDOM localStorage her testten önce temizlensin
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// --- TEST 1: getOrders başlangıç seed verisini döndürür ---
test("getOrders returns seeded orders when localStorage is empty", () => {
  const orders = getOrders();

  // Varsayılan 3 seed order olduğunu biliyoruz
  expect(orders.length).toBe(3);
  expect(orders[0]).toHaveProperty("id");
  expect(orders[0]).toHaveProperty("items");
});

// --- TEST 2: getOrderById doğru siparişi döndürür ---
test("getOrderById returns correct order by ID", () => {
  const all = getOrders();
  const target = all[1];

  const found = getOrderById(target.id);

  expect(found).toBeTruthy();
  expect(found.id).toBe(target.id);
});

// --- TEST 3: addOrder yeni bir sipariş oluşturur ---
test("addOrder creates a new order and stores it", () => {
  const initialCount = getOrders().length;

  const newOrder = addOrder({
    items: [
      { id: 99, name: "Test Item", price: 100, quantity: 2 }
    ],
    total: 200,
  });

  expect(newOrder).toHaveProperty("id");
  expect(newOrder.items.length).toBe(1);
  expect(newOrder.total).toBe(200);

  const ordersAfter = getOrders();
  expect(ordersAfter.length).toBe(initialCount + 1);
});

// --- TEST 4: advanceOrderStatus sipariş durumunu ilerletir ---
test("advanceOrderStatus moves status forward", () => {
  const orders = getOrders();
  const id = orders[0].id;

  const after1 = advanceOrderStatus(id);
  expect(after1[0].status).toBe("In-transit");

  const after2 = advanceOrderStatus(id);
  expect(after2[0].status).toBe("Delivered");
});

// --- TEST 5: advanceOrderStatus delivered durumunda daha ileri gitmez ---
test("advanceOrderStatus does not progress beyond Delivered", () => {
  const orders = getOrders();
  const id = orders[1].id; // Zaten Delivered olan sipariş

  const updated = advanceOrderStatus(id);

  expect(updated[1].status).toBe("Delivered");
});

// --- TEST 6: getOrderById geçersiz ID için null döndürür ---
test("getOrderById returns null when ID is missing", () => {
  expect(getOrderById(null)).toBeNull();
  expect(getOrderById(undefined)).toBeNull();
});
