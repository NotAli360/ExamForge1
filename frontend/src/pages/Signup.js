import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrainCircuit } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", class: "9", roll: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.error || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
            <BrainCircuit size={24} />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Create your Exam Forge AI account</h1>
          <p className="text-xs text-slate-500">CBSE Exam Preparation Suite</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Full Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => setForm((f) => ({ ...f, password: v }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Class</label>
              <select
                className="ff-select"
                value={form.class}
                onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
              >
                {["6", "7", "8", "9", "10", "11", "12"].map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Roll No." value={form.roll} onChange={(v) => setForm((f) => ({ ...f, roll: v }))} />
          </div>

          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-600">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ff-select"
      />
    </div>
  );
}
