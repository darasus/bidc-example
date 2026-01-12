import { useState, useCallback, useRef, useEffect } from "react";
import { createChannel } from "bidc";
import "./index.css";

interface Message {
  id: number;
  text: string;
  from: "me" | "other";
}

export function App() {
  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", position: "fixed", top: 0, left: 0 }}>
      <IframeDemo />
      <DialogDemo />
    </div>
  );
}

function IframeDemo() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const channel = useRef<ReturnType<typeof createChannel> | null>(null);
  const ref = useRef<HTMLIFrameElement>(null);
  const id = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const onLoad = () => {
      const win = el.contentWindow;
      if (!win) return;
      const ch = createChannel(win);
      channel.current = ch;

      ch.receive((p: { type: string; message?: string }) => {
        if (p.type === "connected") setConnected(true);
        else if (p.type === "message" && p.message) {
          setMessages((m) => [...m, { id: id.current++, text: p.message!, from: "other" }]);
        }
        return { ok: true };
      });
    };

    el.addEventListener("load", onLoad);
    return () => el.removeEventListener("load", onLoad);
  }, []);

  const send = useCallback(() => {
    if (!input.trim() || !channel.current) return;
    setMessages((m) => [...m, { id: id.current++, text: input.trim(), from: "me" }]);
    channel.current.send({ type: "message", message: input.trim() });
    setInput("");
  }, [input]);

  return (
    <div style={panel}>
      <h2 style={{ margin: 0, marginBottom: 16 }}>Iframe</h2>
      <Status connected={connected} />
      <Input value={input} onChange={setInput} onSend={send} />
      <Messages list={messages} />
      <iframe ref={ref} src="/iframe" style={{ width: "100%", flex: 1, border: "1px solid #ddd", borderRadius: 8, marginTop: 16, minHeight: 200 }} />
    </div>
  );
}

function DialogDemo() {
  const [win, setWin] = useState<Window | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const channel = useRef<ReturnType<typeof createChannel> | null>(null);
  const id = useRef(0);

  const open = useCallback(() => {
    const w = window.open("/dialog", "dialog", "width=500,height=400");
    if (!w) return;
    setWin(w);
    const ch = createChannel(w);
    channel.current = ch;

    ch.receive((p: { type: string; message?: string }) => {
      if (p.type === "connected") setConnected(true);
      else if (p.type === "message" && p.message) {
        setMessages((m) => [...m, { id: id.current++, text: p.message!, from: "other" }]);
      }
      return { ok: true };
    });

    const check = setInterval(() => {
      if (w.closed) {
        clearInterval(check);
        setWin(null);
        setConnected(false);
        channel.current = null;
      }
    }, 500);
  }, []);

  const send = useCallback(() => {
    if (!input.trim() || !channel.current) return;
    setMessages((m) => [...m, { id: id.current++, text: input.trim(), from: "me" }]);
    channel.current.send({ type: "message", message: input.trim() });
    setInput("");
  }, [input]);

  return (
    <div style={{ ...panel, borderLeft: "1px solid #e0e0e0" }}>
      <h2 style={{ margin: 0, marginBottom: 16 }}>Dialog</h2>
      {!win ? (
        <button onClick={open} style={btn}>Open Dialog</button>
      ) : (
        <>
          <Status connected={connected} />
          <Input value={input} onChange={setInput} onSend={send} />
        </>
      )}
      <Messages list={messages} />
    </div>
  );
}

const Status = ({ connected }: { connected: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 14 }}>
    <span style={{ width: 10, height: 10, borderRadius: "50%", background: connected ? "#22c55e" : "#ccc" }} />
    {connected ? "Connected" : "Waiting..."}
  </div>
);

const Input = ({ value, onChange, onSend }: { value: string; onChange: (v: string) => void; onSend: () => void }) => (
  <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onSend()}
      placeholder="Type a message..."
      style={{ flex: 1, padding: "12px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}
    />
    <button onClick={onSend} style={btn}>Send</button>
  </div>
);

const Messages = ({ list }: { list: Message[] }) => (
  <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 12, flex: 1, overflow: "auto", minHeight: 150 }}>
    {list.length === 0 ? (
      <p style={{ color: "#999", fontSize: 14, margin: 0 }}>No messages yet</p>
    ) : (
      list.map((m) => (
        <div key={m.id} style={{ fontSize: 14, padding: "8px 12px", background: "white", borderRadius: 6, marginBottom: 8, borderLeft: `4px solid ${m.from === "me" ? "#3b82f6" : "#22c55e"}` }}>
          <b style={{ color: m.from === "me" ? "#3b82f6" : "#22c55e" }}>{m.from === "me" ? "You" : "Other"}:</b> {m.text}
        </div>
      ))
    )}
  </div>
);

const panel: React.CSSProperties = {
  flex: 1,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  background: "white",
};

const btn: React.CSSProperties = {
  background: "#3b82f6",
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: 8,
  fontSize: 14,
  cursor: "pointer",
};

export default App;
