import { useState, useCallback, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createChannel } from "bidc";

interface Message {
  id: number;
  text: string;
  from: "me" | "main";
}

function Dialog() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const channelRef = useRef<ReturnType<typeof createChannel> | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (!window.opener) return;

    const channel = createChannel(window.opener);
    channelRef.current = channel;

    channel.receive((payload: { type: string; message?: string }) => {
      if (payload.type === "message" && payload.message) {
        setMessages((m) => [
          ...m,
          { id: idRef.current++, text: payload.message!, from: "main" },
        ]);
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
    <div
      style={{
        fontFamily: "system-ui",
        padding: 24,
        maxWidth: 360,
        margin: "0 auto",
      }}
    >
      <h2 style={{ marginBottom: 4 }}>Dialog Window</h2>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: connected ? "#22c55e" : "#ccc",
          }}
        />
        <span style={{ fontSize: 14, color: "#666" }}>
          {connected ? "Connected" : "Connecting..."}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type message..."
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        <button
          onClick={send}
          style={{
            background: "#22c55e",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>

      <div
        style={{
          background: "#f5f5f5",
          borderRadius: 8,
          padding: 12,
          minHeight: 200,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#666",
            marginBottom: 8,
          }}
        >
          Messages
        </div>
        {messages.length === 0 ? (
          <p style={{ color: "#999", fontSize: 13 }}>No messages yet</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                padding: "6px 10px",
                background: "white",
                borderRadius: 6,
                marginBottom: 6,
                borderLeft: `3px solid ${
                  m.from === "me" ? "#22c55e" : "#3b82f6"
                }`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: m.from === "me" ? "#22c55e" : "#3b82f6",
                  marginBottom: 2,
                }}
              >
                {m.from === "me" ? "You" : "Main"}
              </div>
              <div style={{ fontSize: 14 }}>{m.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Dialog />);
