import { render, screen, fireEvent } from "@testing-library/react";
import { test, expect, vi } from "vitest";
import CartSummary from "./CartSummary";

test("renders subtotal, shipping, discount, and total correctly", () => {
  render(
    <CartSummary
      subtotal={1500}
      shipping={50}
      discount={100}
      total={1450}
      onCheckout={() => {}}
    />
  );

  expect(screen.getByText("₺1.500")).toBeInTheDocument();
  expect(screen.getByText("₺50")).toBeInTheDocument();
  expect(screen.getByText("-₺100")).toBeInTheDocument();
  expect(screen.getByText("₺1.450")).toBeInTheDocument();
});

test("shows 'Free' when shipping is 0", () => {
  render(
    <CartSummary
      subtotal={1200}
      shipping={0}
      discount={0}
      total={1200}
      onCheckout={() => {}}
    />
  );

  expect(screen.getByText("Free")).toBeInTheDocument();
});

test("calls onCheckout when button is clicked", () => {
  const onCheckout = vi.fn();

  render(
    <CartSummary
      subtotal={1200}
      shipping={0}
      discount={0}
      total={1200}
      onCheckout={onCheckout}
    />
  );

  fireEvent.click(screen.getByText("Proceed to Checkout"));

  expect(onCheckout).toHaveBeenCalled();
});
