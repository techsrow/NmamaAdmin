export function getAuthUser() {
  try {
    const raw = localStorage.getItem("adminUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  return localStorage.getItem("adminToken");
}

export function isLoggedIn() {
  return !!getAuthToken();
}

export function isAdmin() {
  const user = getAuthUser();
  return user?.role === "Admin";
}

export function logout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  window.location.href = "/login";
}
