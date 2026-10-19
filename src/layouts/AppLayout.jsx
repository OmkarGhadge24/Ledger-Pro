import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f7f8fa]">
            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed((value) => !value)}
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            <div
                className={[
                    "min-h-screen transition-[padding] duration-200",
                    collapsed ? "lg:pl-[84px]" : "lg:pl-[264px]",
                ].join(" ")}
            >
                <Topbar onMenuClick={() => setMobileOpen(true)} />

                <main className="min-h-[calc(100vh-76px)]">
                    <div className="page-container">
                        <Outlet />
                    </div>
                </main>

                <footer className="border-t border-[#e8ebf0] bg-white px-6 py-5 text-center text-xs text-slate-400">
                    LedgerPro · Banking Ledger Management
                </footer>
            </div>
        </div>
    );
}
