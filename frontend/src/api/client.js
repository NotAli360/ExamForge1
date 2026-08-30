import axios from "axios";

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

const client = axios.create({
  baseURL: `${BASE_URL}/api`,
});

function getGuestId() {
  let guestId = localStorage.getItem("examforge_guest_id");
  if (!guestId) {
    guestId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("examforge_guest_id", guestId);
  }
  return guestId;
}

client.interceptors.request.use((config) => {
  config.headers["X-Guest-ID"] = getGuestId();

  const token = localStorage.getItem("examforge_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

export default client;
