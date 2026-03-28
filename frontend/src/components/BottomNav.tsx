import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  User,
  PlusSquare,
  MessageCircle,
  Shuffle,
  HomeIcon,
  Warehouse,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useAiModelStore } from "../store/useChooseAi";
import { useChatStore } from "../store/useChatStore";

export default function BottomNav() {
  const { user, checkAuth } = useAuthStore();
  const { seeBadge , setBadgeToFalse} = useChatStore()
  const { firstAIModel, switchAIModel } = useAiModelStore();
  const location = useLocation();

  const [showRandom, setShowRandom] = useState(false);
  const [randomScope, setRandomScope] = useState<"verified" | "all">(
    "verified"
  );

  const isActive = (path: string) =>
    location.pathname === path ? "text-white" : "text-neutral-500";

  const handleRandomConfirm = async () => {
    let suc = false
    if (randomScope === "verified") {
      suc = await firstAIModel();
    } else {
      suc= await switchAIModel();
    }
    
    if(!suc) return
    setShowRandom(false);
    await checkAuth()

  };

  return (
    <>
      <div className="font-body bg-neutral-950/90 backdrop-blur-xl border-t border-neutral-900 px-2 py-1.5 flex items-center">
        <NavItem
          to="/"
          label="Home"
          icon={<HomeIcon size={18} />}
          active={isActive("/")}
        />

        {user?.AiModel ? (
          <NavItem
            to="/chat"
            label="Chat"
            icon={<MessageCircle size={20} />}
            active={isActive("/chat")}
            showBadge={seeBadge}
            onClick={setBadgeToFalse}
          />
        ) : (
          <ActionItem
            label="Random"
            icon={<Shuffle size={18} />}
            onClick={() => setShowRandom(true)}
          />
        )}

        <NavItem
          to="/create"
          label="Create"
          icon={<PlusSquare size={18} />}
          active={isActive("/create")}
        />

        <NavItem
          to="/my-ai"
          label="My-ai"
          icon={<Warehouse size={18} />}
          active={isActive("/my-ai")}
        />

        <NavItem
          to="/account"
          label="Account"
          icon={<User size={18} />}
          active={isActive("/account")}
        />
      </div>

      {showRandom && (
        <div className="fixed bottom-20 right-4 z-50">
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setShowRandom(false)}
          />

          {/* panel */}
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-4 w-44 shadow-xl">
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
              onClick={handleRandomConfirm}
              className="w-full text-xs bg-neutral-700 py-1.5 rounded-md active:scale-95"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function NavItem({
  to,
  label,
  icon,
  active,
  showBadge,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  active?: string;
  showBadge?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 py-2 text-[11px] transition ${active}`}
    >
      <div className="mb-0.5 relative">
        {icon}

        {showBadge && (
          <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </div>
      <span className="tracking-tight">{label}</span>
    </Link>
  );
}

function ActionItem({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center flex-1 py-2 text-[11px] text-neutral-400 active:text-white transition"
    >
      <div className="mb-0.5">{icon}</div>
      <span className="tracking-tight">{label}</span>
    </button>
  );
}