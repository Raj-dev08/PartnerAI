import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useAiModelStore } from "../store/useChooseAi";
import { useChatStore } from "../store/useChatStore";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  User,
  PlusSquare,
  MessageCircle,
  Shuffle,
  BadgeDollarSign,
} from "lucide-react";

export default function Sidebar() {
  const { user, checkAuth } = useAuthStore();
  const { firstAIModel, switchAIModel } = useAiModelStore();
  const { seeBadge, setBadgeToFalse } = useChatStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const [showRandom, setShowRandom] = useState(false);
  const [randomScope, setRandomScope] = useState<"verified" | "all">("verified");

  const isActive = (path: string) =>
    location.pathname === path
      ? "bg-neutral-900 text-white"
      : "text-neutral-400 hover:text-white hover:bg-neutral-900";

  return (
    <>
      <div className="hidden md:flex w-64 h-screen border-r border-neutral-900 flex-col justify-between px-5 py-6 bg-neutral-950">
        
        {/* TOP */}
        <div className="space-y-8">

          {/* LOGO */}
          <div className="text-lg font-semibold tracking-tight">
            partner<span className="text-neutral-500">.ai</span>
          </div>

          {/* NAV */}
          <div className="space-y-1 text-sm font-body">

            <NavItem
              to="/"
              label="Home"
              icon={<Home size={18} />}
              active={isActive("/")}
            />

            <NavItem
              to="/create"
              label="Create"
              icon={<PlusSquare size={18} />}
              active={isActive("/create")}
            />

            <NavItem
              to="/my-ai"
              label="My AI"
              icon={<User size={18} />}
              active={isActive("/my-ai")}
            />

            {/* CHAT OR RANDOM */}
            {user?.AiModel ? (
              <NavItem
                to="/chat"
                label="Chat"
                icon={<MessageCircle size={18} />}
                active={isActive("/chat")}
                showBadge={location.pathname !== "/chat" && seeBadge}
                onClick={setBadgeToFalse}
              />
            ) : (
              <button
                onClick={() => setShowRandom(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
              >
                <Shuffle size={18} />
                <span>Random</span>
              </button>
            )}

            {user?.isOwner && <NavItem
              to="/create-plans"
              label="Plans"
              icon={<BadgeDollarSign  size={18} />}
              active={isActive("/create-plans")}
            />}

            {/* RANDOM MODAL */}
            {showRandom && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg transition ">

                {/* BACKDROP */}
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setShowRandom(false)}
                />

                {/* PANEL */}
                <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-4 w-56 shadow-xl">

                  <div className="text-xs text-neutral-400 mb-3">
                    Random Mode
                  </div>

                  <div className="flex flex-col gap-2 mb-4">
                    <button
                      onClick={() => setRandomScope("verified")}
                      className={`px-3 py-1.5 rounded-md text-xs ${
                        randomScope === "verified"
                          ? "bg-white text-black"
                          : "bg-neutral-800"
                      }`}
                    >
                      Verified Only
                    </button>

                    <button
                      onClick={() => setRandomScope("all")}
                      className={`px-3 py-1.5 rounded-md text-xs ${
                        randomScope === "all"
                          ? "bg-white text-black"
                          : "bg-neutral-800"
                      }`}
                    >
                      All Models
                    </button>
                  </div>

                  <button
                    onClick={async () => {
                      let suc = false;
                      if (randomScope === "verified") {
                        suc = await firstAIModel();
                      } else {
                        suc = await switchAIModel();
                      }
                      if (!suc) return;
                      setShowRandom(false);
                      await checkAuth()
                    }}
                    className="w-full text-xs bg-neutral-700 py-1.5 rounded-md active:scale-95"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* USER */}
        <div className="pt-4 border-t border-neutral-900">
          <Link
            to="/account"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-900 transition"
          >
            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm">
              {user?.name?.charAt(0)}
            </div>

            <div className="text-sm">
              <p className="text-white leading-none">{user?.name}</p>
              <p className="text-xs text-neutral-500 truncate max-w-[140px]">
                {user?.email}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}

/* ================= NAV ITEM ================= */

function NavItem({
  to,
  label,
  icon,
  active,
  highlight,
  showBadge,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  active?: string;
  highlight?: boolean;
  showBadge?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition ${
        highlight ? "text-white" : active
      }`}
    >
      <div className={`relative ${highlight ? "scale-105" : ""}`}>
        {icon}

        {showBadge && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </div>

      <span className="text-sm tracking-tight">{label}</span>
    </Link>
  );
}