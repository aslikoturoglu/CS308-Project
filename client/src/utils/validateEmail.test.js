import { describe, expect, test } from "vitest";
import { validateEmail } from "./validateEmail";

describe("validateEmail", () => {
  test("valid suhome email should pass", () => {
    expect(validateEmail("asli@suhome.com")).toBe(true);
  });

  test("gmail should fail", () => {
    expect(validateEmail("asli@gmail.com")).toBe(false);
  });

  test("missing domain should fail", () => {
    expect(validateEmail("as@su")).toBe(false);
  });

  test("empty string should fail", () => {
    expect(validateEmail("")).toBe(false);
  });

  test("non-string input should fail", () => {
    expect(validateEmail(123)).toBe(false);
  });
});
