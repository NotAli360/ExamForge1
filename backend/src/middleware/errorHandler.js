export function notFound(req, res) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error("[error]", err);

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  // Never expose arbitrary server/provider/DB error messages on 5xx responses,
  // even in development. This prevents accidental leakage when a new service
  // throws an internal error containing credentials or connection details.
  const message = status >= 500
    ? "Something went wrong. Please try again."
    : err.message || "Request failed";

  res.status(status).json({ error: message });
}
