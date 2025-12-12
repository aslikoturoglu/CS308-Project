import { render, screen, fireEvent } from "@testing-library/react";
import { test, expect, vi } from "vitest";
import CartItem from "./CartItem";

const mockItem = {
  id: 10,
  name: "Velvet Chair",
  price: 1299,
  image: "/test.jpg",
  quantity: 2,
};

test("renders item name, price and quantity", () => {
  render(
    <CartItem
      item={mockItem}
      onIncrease={() => {}}
      onDecrease={() => {}}
      onRemove={() => {}}
    />
  );

  expect(screen.getByText("Velvet Chair")).toBeInTheDocument();
  expect(screen.getByText("₺1.299")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
});

test("calls onIncrease with correct ID when + button is clicked", () => {
  const onIncrease = vi.fn();

  render(
    <CartItem
      item={mockItem}
      onIncrease={onIncrease}
      onDecrease={() => {}}
      onRemove={() => {}}
    />
  );

  fireEvent.click(screen.getByLabelText("Increase quantity for Velvet Chair"));

  expect(onIncrease).toHaveBeenCalledWith(10);
});

test("calls onDecrease with correct ID when – button is clicked", () => {
  const onDecrease = vi.fn();

  render(
    <CartItem
      item={mockItem}
      onIncrease={() => {}}
      onDecrease={onDecrease}
      onRemove={() => {}}
    />
  );

  fireEvent.click(screen.getByLabelText("Decrease quantity for Velvet Chair"));

  expect(onDecrease).toHaveBeenCalledWith(10);
});

test("calls onRemove with correct ID when Remove button is clicked", () => {
  const onRemove = vi.fn();

  render(
    <CartItem
      item={mockItem}
      onIncrease={() => {}}
      onDecrease={() => {}}
      onRemove={onRemove}
    />
  );

  fireEvent.click(screen.getByText("Remove"));

  expect(onRemove).toHaveBeenCalledWith(10);
});
