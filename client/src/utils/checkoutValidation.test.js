import { describe, expect, test } from "vitest";
import {
  validateFullName,
  validateCardName,
  validateCardNumber,
  validateCVC
} from "./checkoutValidation";

// Full Name
describe("validateFullName", () => {
  test("valid full name with space", () => {
    expect(validateFullName("Asli Koturoglu")).toBe(true);
  });

  test("invalid without space", () => {
    expect(validateFullName("Asli")).toBe(false);
  });
});

// Name on Card
describe("validateCardName", () => {
  test("valid name with space", () => {
    expect(validateCardName("ALEX MORGAN")).toBe(true);
  });

  test("invalid without space", () => {
    expect(validateCardName("ALEX")).toBe(false);
  });
});

// Card Number
describe("validateCardNumber", () => {
  test("valid with spaces", () => {
    expect(validateCardNumber("4242 4242 4242 4242")).toBe(true);
  });

  test("valid without spaces", () => {
    expect(validateCardNumber("42424242424242")).toBe(true);
  });

  test("invalid non-numeric", () => {
    expect(validateCardNumber("4242abcd4242")).toBe(false);
  });

  test("invalid too short", () => {
    expect(validateCardNumber("1234567")).toBe(false);
  });
});

// CVC
describe("validateCVC", () => {
  test("valid 3 digit", () => {
    expect(validateCVC("123")).toBe(true);
  });

  test("valid 4 digit", () => {
    expect(validateCVC("1234")).toBe(true);
  });

  test("invalid letter inside", () => {
    expect(validateCVC("12a")).toBe(false);
  });

  test("invalid too short", () => {
    expect(validateCVC("12")).toBe(false);
  });
});
