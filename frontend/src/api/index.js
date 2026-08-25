import client from "./client";

export const authApi = {
  signup: (data) => client.post("/auth/signup", data).then((r) => r.data),
  login: (data) => client.post("/auth/login", data).then((r) => r.data),
  me: () => client.get("/auth/me").then((r) => r.data),
};

export const metaApi = {
  get: () => client.get("/meta").then((r) => r.data),
};

export const examApi = {
  generate: (payload) => client.post("/exams", payload).then((r) => r.data),
  list: () => client.get("/exams").then((r) => r.data),
  get: (id) => client.get(`/exams/${id}`).then((r) => r.data),
  regenerateQuestion: (id, localId) =>
    client.post(`/exams/${id}/regenerate-question`, { localId }).then((r) => r.data),
  submit: (id, answers) => client.post(`/exams/${id}/submit`, { answers }).then((r) => r.data),
};

export const analyticsApi = {
  history: () => client.get("/analytics/history").then((r) => r.data),
  summary: () => client.get("/analytics/summary").then((r) => r.data),
};

export const chatApi = {
  send: (text) => client.post("/chat", { text }).then((r) => r.data),
  history: () => client.get("/chat").then((r) => r.data),
};

export const questionApi = {
  searchBank: (params) => client.get("/questions/bank", { params }).then((r) => r.data),
};
