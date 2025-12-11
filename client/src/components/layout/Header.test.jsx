import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthContext } from "../../src/context/AuthContext";
import Header from "./Header";

describe("Header after login", () => {
  it("shows user's name when logged in", () => {
    const mockUser = { name: "Aslı" };

    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <Header />
      </AuthContext.Provider>
    );

    const welcome = screen.getByText(/welcome, asli/i);
    expect(welcome).toBeInTheDocument();
  });
});
