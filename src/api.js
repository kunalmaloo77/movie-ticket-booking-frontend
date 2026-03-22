const BASE = "http://localhost:3000/api";

function headers() {
  const h = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    throw new Error(data.message || data.error || "Request failed");
  }
  return data;
}

export async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    throw new Error(data.message || data.error || "Request failed");
  }
  return data;
}

export async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    throw new Error(data.message || data.error || "Request failed");
  }
  return data;
}

export async function del(path) {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: headers(),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    throw new Error(data.message || data.error || "Request failed");
  }
  return data;
}
