import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import ErrorBoundary from "./ErrorBoundary";

// Hata fırlatan sahte component
function Boom() {
  throw new Error("Boom!");
}

test("renders children when no error occurs", () => {
  render(
    <ErrorBoundary>
      <p>Normal content</p>
    </ErrorBoundary>
  );

  expect(screen.getByText("Normal content")).toBeInTheDocument();
});

test("renders fallback UI when an error is thrown", () => {
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>
  );

  expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  expect(
    screen.getByText("Please refresh the page or try again later.")
  ).toBeInTheDocument();
});
