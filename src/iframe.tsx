import { useState, useCallback, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createChannel } from "bidc";

interface Message {
  id: number;
  text: string;
  from: "me" | "parent";
}

function IframeContent() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const channelRef = useRef<ReturnType<typeof createChannel> | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (!window.parent || window.parent === window) return;

    const channel = createChannel(window.parent);
    channelRef.current = channel;

    channel.receive((payload: { type: string; message?: string }) => {
      if (payload.type === "message" && payload.message) {
        setMessages((m) => [...m, { id: idRef.current++, text: payload.message!, from: "parent" }]);
      }
      return { ok: true };
    });

    channel.send({ type: "connected" }).then(() => setConnected(true));
  }, []);

  const send = useCallback(() => {
    if (!input.trim() || !channelRef.current) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { id: idRef.current++, text, from: "me" }]);
    channelRef.current.send({ type: "message", message: text });
  }, [input]);

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#22c55e" : "#ccc" }} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>Iframe</span>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message..."
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #ddd", borderRadius: 4, fontSize: 13 }}
        />
        <button onClick={send} style={{ background: "#22c55e", color: "white", border: "none", padding: "6px 12px", borderRadius: 4, fontSize: 13, cursor: "pointer" }}>
          Send
        </button>
      </div>

      <div style={{ background: "#f5f5f5", borderRadius: 6, padding: 8, minHeight: 80, overflow: "auto" }}>
        {messages.length === 0 ? (
          <p style={{ color: "#999", fontSize: 12, margin: 0 }}>No messages</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ fontSize: 12, padding: "3px 0", borderBottom: "1px solid #eee" }}>
              <span style={{ color: m.from === "me" ? "#22c55e" : "#3b82f6", fontWeight: 600 }}>
                {m.from === "me" ? "Me: " : "Parent: "}
              </span>
              {m.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<IframeContent />);
