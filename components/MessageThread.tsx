"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Msg = { id: string; body: string; senderId: string; createdAt: string };

export default function MessageThread({ clientId }: { clientId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [me, setMe] = useState<string>("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages?clientId=${clientId}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages);
    setMe(data.me);
  }, [clientId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // lightweight polling
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setText("");
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, body }),
    });
    setSending(false);
    load();
  }

  return (
    <div className="flex h-80 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">No messages yet. Say hello 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-brand text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                <div>{m.body}</div>
                <div className={`mt-0.5 text-[10px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                  {new Date(m.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
        />
        <button className="btn-primary" disabled={sending || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
