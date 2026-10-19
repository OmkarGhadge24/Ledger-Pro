import { NavLink, useNavigate } from "react-router-dom";
import {
    ArrowLeftRight,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    Settings,
    ShieldCheck,
    UserRound,
    Wallet,
    X,
    RotateCcwClock
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navigation = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Accounts", path: "/accounts", icon: Wallet },
    { label: "Transactions", path: "/transactions", icon: ArrowLeftRight },
    { label: "Ledger entries", path: "/ledger", icon: BookOpen },
    { label: "Profile", path: "/profile", icon: UserRound },
    { label: "Settings", path: "/settings", icon: Settings },
    { label: "Transaction History", path: "/transactions/history", icon: RotateCcwClock, }
];

export default function Sidebar({
    collapsed,
    onToggle,
    mobileOpen,
    onClose,
}) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        onClose?.();
        navigate("/login", { replace: true });
    }

    return (
        <>
            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
                />
            )}

            <aside
                className={[
                    "fixed inset-y-0 left-0 z-50 flex w-66 flex-col",
                    "border-r border-white/5 bg-[#111d35] text-slate-300",
                    "transition-[width,transform] duration-200",
                    collapsed ? "lg:w-21" : "lg:w-66",
                    mobileOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0",
                ].join(" ")}
            >
                <div className="flex h-19 items-center justify-between border-b border-white/[0.07] px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="LedgerPro"
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />

                        {(!collapsed || mobileOpen) && (
                            <span className="text-lg font-semibold tracking-tight text-white">
                                Ledger<span className="text-blue-400">Pro</span>
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close sidebar"
                        className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-3 pt-7">
                    {(!collapsed || mobileOpen) && (
                        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Workspace
                        </p>
                    )}

                    <nav className="space-y-1">
                        {navigation.map(({ label, path, icon: Icon }) => (
                            <NavLink
                                key={path}
                                to={path}
                                end
                                onClick={onClose}
                                title={collapsed && !mobileOpen ? label : undefined}
                                className={({ isActive }) =>
                                    [
                                        "group flex min-h-11 items-center gap-3 rounded-xl px-3",
                                        "text-[13px] font-medium transition-colors",
                                        collapsed && !mobileOpen ? "lg:justify-center lg:px-0" : "",
                                        isActive
                                            ? "bg-white text-[#172033] shadow-sm"
                                            : "text-slate-400 hover:bg-white/[0.07] hover:text-white",
                                    ].join(" ")
                                }
                            >
                                <Icon size={18} strokeWidth={1.8} className="shrink-0" />
                                {(!collapsed || mobileOpen) && <span>{label}</span>}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto space-y-3 p-3">
                    <div
                        className={[
                            "rounded-xl border border-white/8 bg-white/[0.035] p-3",
                            collapsed && !mobileOpen ? "lg:hidden" : "",
                        ].join(" ")}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={17} className="shrink-0 text-blue-300" />
                            <p className="text-xs font-medium text-slate-300">
                                Your workspace
                            </p>
                        </div>
                        <p className="mt-2 text-[11px] leading-5 text-slate-500">
                            Your account data is managed by the connected backend.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        title={collapsed && !mobileOpen ? "Sign out" : undefined}
                        className={[
                            "flex h-11 w-full items-center gap-3 rounded-xl px-3",
                            "text-[13px] font-medium text-slate-400 transition",
                            "hover:bg-red-400/10 hover:text-red-300",
                            collapsed && !mobileOpen ? "lg:justify-center lg:px-0" : "",
                        ].join(" ")}
                    >
                        <LogOut size={18} className="shrink-0" />
                        {(!collapsed || mobileOpen) && "Sign out"}
                    </button>

                    <button
                        type="button"
                        onClick={onToggle}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="hidden h-10 w-full items-center justify-center rounded-xl text-slate-500 hover:bg-white/[0.07] hover:text-white lg:flex"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>
            </aside>
        </>
    );
}
