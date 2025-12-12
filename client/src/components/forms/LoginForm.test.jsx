import { render, screen, fireEvent } from "@testing-library/react";
import { test, expect, vi, beforeEach } from "vitest";
import LoginForm from "./LoginForm";

// ---- MOCKLAR ----
vi.mock("../../utils/validateEmail", () => ({
  validateEmail: vi.fn(),
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

vi.mock("../../context/ToastContext", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

// navigate mock
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

import { validateEmail } from "../../utils/validateEmail";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});


// --- TEST 1: Geçersiz email hataya düşürür ---
test("shows error when email is invalid", () => {
  validateEmail.mockReturnValue(false);

  render(<LoginForm />);

  fireEvent.change(screen.getByPlaceholderText("test@suhome.com"), {
    target: { value: "invalid-email" },
  });

  fireEvent.change(screen.getByPlaceholderText("••••"), {
    target: { value: "1234" },
  });

  fireEvent.click(screen.getByText("Sign In"));

  expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
});


// --- TEST 2: Şifre boşsa hata gösterilir ---
test("shows error when password is empty", () => {
  validateEmail.mockReturnValue(true);

  render(<LoginForm />);

  fireEvent.change(screen.getByPlaceholderText("test@suhome.com"), {
    target: { value: "test@suhome.com" },
  });

  fireEvent.change(screen.getByPlaceholderText("••••"), {
    target: { value: " " },
  });

  fireEvent.click(screen.getByText("Sign In"));

  expect(screen.getByText("Email and password are required.")).toBeInTheDocument();
});


// --- TEST 3: Demo kullanıcı başarıyla giriş yapar ---
test("logs in demo user with correct credentials", () => {
  validateEmail.mockReturnValue(true);

  const { login } = useAuth();
  const { addToast } = useToast();

  render(<LoginForm />);

  fireEvent.change(screen.getByPlaceholderText("test@suhome.com"), {
    target: { value: "test@suhome.com" },
  });

  fireEvent.change(screen.getByPlaceholderText("••••"), {
    target: { value: "1234" },
  });

  fireEvent.click(screen.getByText("Sign In"));

  expect(login).toHaveBeenCalled();
  expect(addToast).not.toHaveBeenCalled(); // success toast yok
});


// --- TEST 4: Yanlış bilgiler hataya götürür ---
test("shows error on invalid credentials", () => {
  validateEmail.mockReturnValue(true);

  render(<LoginForm />);

  // localStorage'da kullanıcı olmadığından yanlış giriş
  fireEvent.change(screen.getByPlaceholderText("test@suhome.com"), {
    target: { value: "wrong@suhome.com" },
  });

  fireEvent.change(screen.getByPlaceholderText("••••"), {
    target: { value: "wrongpass" },
  });

  fireEvent.click(screen.getByText("Sign In"));

  expect(
    screen.getByText(/Invalid credentials/i)
  ).toBeInTheDocument();
});
