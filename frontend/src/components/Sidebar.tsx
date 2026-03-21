import { useAuthStore } from "../store/useAuthStore";
import { useAiModelStore } from "../store/useChooseAi";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  User,
  PlusSquare,
  MessageCircle,
  Shuffle,
} from "lucide-react";

export default function Sidebar() {
  const { user } = useAuthStore();
  const { myAiModel, firstAIModel } = useAiModelStore();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path
      ? "bg-neutral-900 text-white"
      : "text-neutral-400 hover:text-white hover:bg-neutral-900";

  return (
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
          {myAiModel ? (
            <NavItem
              to="/chat"
              label="Chat"
              icon={<MessageCircle size={18} />}
              active={isActive("/chat")}
              highlight
            />
          ) : (
            <button
              onClick={firstAIModel}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
            >
              <Shuffle size={18} />
              <span>Random</span>
            </button>
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
  );
}

function NavItem({
  to,
  label,
  icon,
  active,
  highlight,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  active?: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
        highlight
          ? "text-white"
          : active
      }`}
    >
      <div className={`${highlight ? "scale-105" : ""}`}>
        {icon}
      </div>
      <span className="text-sm tracking-tight">{label}</span>
    </Link>
  );
}