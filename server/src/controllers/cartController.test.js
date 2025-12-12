import { test, expect, vi, beforeEach } from "vitest";
import { getCart, addToCart, deleteCartItem } from "./cartController.js";
import db from "../db.js";

vi.mock("../db.js");

let req, res;

beforeEach(() => {
  req = { body: {}, params: {} };
  res = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  };
  vi.clearAllMocks();
});


// -------------------------
// 1) getCart başarı testi
// -------------------------
test("getCart returns database rows", () => {
  const fakeRows = [{ id: 1, product_id: 10, quantity: 2 }];

  db.query.mockImplementation((sql, callback) => callback(null, fakeRows));

  getCart(req, res);

  expect(res.json).toHaveBeenCalledWith(fakeRows);
});


// -------------------------
// 2) getCart hata testi
// -------------------------
test("getCart returns 500 on DB error", () => {
  db.query.mockImplementation((sql, callback) => callback(new Error("DB error")));

  getCart(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({ error: "Veri alınamadı" });
});


// -------------------------
// 3) addToCart başarı testi
// -------------------------
test("addToCart inserts item and returns insertId", () => {
  req.body = { product_id: 5, quantity: 3 };

  db.query.mockImplementation((sql, params, callback) =>
    callback(null, { insertId: 99 })
  );

  addToCart(req, res);

  expect(res.json).toHaveBeenCalledWith({
    message: "Ürün eklendi",
    id: 99
  });
});


// -------------------------
// 4) addToCart hata testi
// -------------------------
test("addToCart returns 500 on DB error", () => {
  req.body = { product_id: 1, quantity: 2 };

  db.query.mockImplementation((sql, params, callback) =>
    callback(new Error("Insert error"))
  );

  addToCart(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({ error: "Ekleme başarısız" });
});


// -------------------------
// 5) deleteCartItem başarı testi
// -------------------------
test("deleteCartItem deletes item successfully", () => {
  req.params.id = 10;

  db.query.mockImplementation((sql, params, callback) => callback(null));

  deleteCartItem(req, res);

  expect(res.json).toHaveBeenCalledWith({
    message: "Silindi"
  });
});
