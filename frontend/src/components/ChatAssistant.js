import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, MessageCircle } from "lucide-react";
import { chatApi } from "../api";

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Namaste! I am your Exam Forge AI Study Assistant. Ask me anything about CBSE Class 6-12 syllabus, ask for tricky questions, or request instant chapter summaries!",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setThinking(true);
    try {
      const { reply } = await chatApi.send(text);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I couldn't reach the server just now." }]);
    } finally {
      setThinking(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg"
      >
        <MessageCircle size={22} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 flex h-[480px] w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Bot size={16} /> AI Study Assistant
        </span>
        <button onClick={() => setOpen(false)}>
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && <div className="text-xs text-slate-400">Assistant is typing...</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
        />
        <button type="submit" className="rounded-lg bg-blue-600 p-2 text-white">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
