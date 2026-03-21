import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">

      {/* Sidebar (desktop) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </div>

      {/* Bottom nav (mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0">
        <BottomNav />
      </div>
    </div>
  );
}