import axios from "axios";

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

const client = axios.create({
  baseURL: `${BASE_URL}/api`,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("examforge_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("examforge_token");
      localStorage.removeItem("examforge_user");
      if (!window.location.pathname.includes("login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default client;
