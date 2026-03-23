import { useAuthStore } from "../store/useAuthStore";
import { useAiModelStore } from "../store/useChooseAi";
import { Link, useLocation } from "react-router-dom";
import { User, PlusSquare, MessageCircle, Shuffle, HomeIcon, Warehouse } from "lucide-react";

export default function BottomNav() {
  const { user } = useAuthStore();
  const { myAiModel, firstAIModel } = useAiModelStore();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ? "text-white" : "text-neutral-500";

  return (
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
          highlight
        />
      ) : (
        <ActionItem
          label="Random"
          icon={<Shuffle size={18} />}
          onClick={firstAIModel}
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
      className={`flex flex-col items-center justify-center flex-1 py-2 text-[11px] transition ${
        highlight
          ? "text-white"
          : active
      }`}
    >
      <div
        className={`mb-0.5 transition ${
          highlight ? "scale-110 text-white" : ""
        }`}
      >
        {icon}
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