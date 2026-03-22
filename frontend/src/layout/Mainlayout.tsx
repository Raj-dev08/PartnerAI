import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">

      {/* Sidebar (desktop) */}
      <div className="hidden md:block md:w-64 md:fixed md:inset-y-0 md:left-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64 pb-16 md:pb-0">
        <Outlet />
      </div>

      {/* Bottom nav (mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0">
        <BottomNav />
      </div>
    </div>
  );
}