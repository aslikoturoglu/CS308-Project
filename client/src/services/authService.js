async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export async function registerUser({ fullName, email, password, address }) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password, address }),
  });
  return handle(res);
}

export async function loginUser({ email, password }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handle(res);
}
