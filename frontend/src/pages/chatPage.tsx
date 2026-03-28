import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAiModelStore } from "../store/useChooseAi";
import { useAuthStore } from "../store/useAuthStore";
import {
  Smile,
  Send,
  MoreVertical,
  Reply,
  CircleUserRound,
  Clock,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ChatPage() {
  const {
    messages,
    getMessages,
    sendMessage,
    hasMore,
    subscribeToSocket,
    typingAi
  } = useChatStore();

  const navigate = useNavigate();


  const { myAiModel, getMyAIModel, removeAIModel } = useAiModelStore();
  const { user, checkAuth } = useAuthStore();

  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔥 NEW REFS
  const shouldAutoScrollRef = useRef(true);
  const prevScrollHeightRef = useRef(0);
  const loadingRef = useRef(false);

  useEffect(() => {
    checkAuth();
    getMyAIModel();
    subscribeToSocket();
  }, []);

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  useEffect(() => {
    if (!user?.AiModel) return;
    getMessages(user.AiModel);
  }, [user]);

  // ✅ Detect if user is near bottom
  const isNearBottom = () => {
    const el = containerRef.current;
    if (!el) return false;

    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };


  // ✅ Handle scroll
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    shouldAutoScrollRef.current = isNearBottom();

    // 🔥 PRELOAD EARLY (no lag feel)
    if (
      el.scrollTop < el.clientHeight * 0.5 &&
      hasMore &&
      !loadingRef.current
    ) {
      const first = messages[0];
      if (first?.createdAt) {
        loadingRef.current = true;
        prevScrollHeightRef.current = el.scrollHeight;

        Promise.resolve(
          getMessages(user?.AiModel || "", first.createdAt)
        ).finally(() => {
          loadingRef.current = false;
        });
      }
    }
  };

  // ✅ Scroll handling after messages update
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // 🔥 Preserve scroll when loading older messages
    if (prevScrollHeightRef.current) {
      const newScrollTop =
        el.scrollHeight - prevScrollHeightRef.current;

      el.scrollTop = newScrollTop;
      prevScrollHeightRef.current = 0;
      return;
    }

    // 🔥 Only scroll if user was near bottom
    if (shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView();
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    sendMessage(input, replyingTo?._id);
    setInput("");
    setReplyingTo(null);
  };

  const getAiName = () => {
    if (!myAiModel) return "";

    if (user?.gender === "male") return myAiModel.femaleName;
    if (user?.gender === "female") return myAiModel.maleName;
    return myAiModel.otherName;
  };

  // ✅ DATE HELPERS
  const isSameDay = (d1: string | Date, d2: string | Date) => {
    const a = new Date(d1);
    const b = new Date(d2);

    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const formatDateLabel = (date: string | Date) => {
    const d = new Date(date);
    const today = new Date();

    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return d.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen bg-neutral-950 text-white">
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-950 z-10">
        <div className="flex items-center gap-3">
          <CircleUserRound className="text-neutral-400" size={28} />
          <div>
            <h2 className="text-sm font-semibold">{getAiName()}</h2>
          </div>
        </div>

        <MoreVertical
          size={18}
          className="text-neutral-400 cursor-pointer"
          onClick={() => setMenuOpen((prev) => !prev)}
        />

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-neutral-900 border border-neutral-800 rounded-lg shadow-lg z-50">
            <button
              onClick={async () => {
                const ok = confirm("Remove this AI? This will delete chats.");
                if (!ok) return;

                const success = await removeAIModel();
                if (success) {
                  navigate("/");
                  await checkAuth()
                }
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 text-red-400"
            >
              Remove AI
            </button>
          </div>
        )}
      </div>

      {/* CHAT */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scrollbar-hide"
      >
        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1];
          const showDate =
            !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);

          let startX = 0;
          const isUser = msg.sentBy === "user";

          return (
            <div key={msg._id || i}>
              {/* DATE */}
              {showDate && (
                <div className="flex justify-center my-3">
                  <div className="text-xs bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full">
                    {formatDateLabel(msg.createdAt)}
                  </div>
                </div>
              )}

              {/* MESSAGE */}
              <div
                className={`flex ${
                  isUser ? "justify-end" : "justify-start"
                }`}
                onTouchStart={(e) => (startX = e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  const diff = e.changedTouches[0].clientX - startX;
                  if (diff > 60) setReplyingTo(msg);
                }}
              >
                <div
                  className={`group relative px-3 py-2 rounded-2xl text-sm max-w-[75%] shadow-md overflow-hidden ${
                    isUser
                      ? "bg-green-600 text-white rounded-br-sm"
                      : "bg-neutral-800 text-white rounded-bl-sm"
                  }`}
                >
                  {msg.replyingTo && (
                    <div className="mb-1 px-2 py-1 bg-black/20 rounded-md text-xs opacity-80 border-l-2 border-white/40">
                      {msg.replyingTo.message}
                    </div>
                  )}

                  <div>{msg.message}</div>

                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>

                    {isUser && msg.status === "pending" && (
                      <Clock size={12} />
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setReplyingTo(msg)
                      inputRef.current?.focus();
                    }}
                    className={`absolute ${
                      isUser ? "left-0" : "right-0"
                    } top-1 opacity-0 group-hover:opacity-100 transition`}
                  >
                    <Reply size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* TYPING */}
        {typingAi && typingAi === user?.AiModel && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl bg-neutral-800 text-white rounded-bl-sm shadow-md">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* REPLY BAR */}
      {replyingTo && (
        <div className="px-3 py-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-xs">
          <div className="truncate text-neutral-300">
            Replying: {replyingTo.message}
          </div>

          <button onClick={() => setReplyingTo(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* INPUT */}
      <div className="px-3 py-2 border-t border-neutral-800 bg-neutral-950 flex items-center gap-2">
        <button className="p-2 text-neutral-400 hover:text-white">
          <Smile size={20} />
        </button>

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          className="flex-1 bg-neutral-900 px-4 py-2 rounded-full text-sm outline-none focus:ring-1 focus:ring-neutral-700"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <button
          onClick={handleSend}
          className="p-2 bg-green-600 rounded-full hover:bg-green-500 transition active:scale-95"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}