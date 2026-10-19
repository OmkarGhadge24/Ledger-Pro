import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    ChevronDown,
    Menu,
    Search,
    UserRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({ onMenuClick }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    const displayName = user?.name || user?.email || "User";
    const initials = displayName
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    function handleSearch(event) {
        event.preventDefault();

        const query = search.trim();
        if (!query) return;

        navigate(`/accounts?search=${encodeURIComponent(query)}`);
    }

    return (
        <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-[#e8ebf0] bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <button
                type="button"
                onClick={onMenuClick}
                aria-label="Open navigation"
                className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
                <Menu size={21} />
            </button>

            <form
                onSubmit={handleSearch}
                className="relative w-full max-w-[390px]"
                role="search"
            >
                <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search accounts..."
                    aria-label="Search accounts"
                    className="h-10 w-full rounded-xl border border-transparent bg-[#f5f6f8] pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-900/[0.04]"
                />
            </form>

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
                <button
                    type="button"
                    aria-label="Notifications"
                    title="Notifications"
                    className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                    <Bell size={19} strokeWidth={1.8} />
                </button>

                <div className="hidden h-8 w-px bg-slate-200 sm:block" />

                <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="flex items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-slate-50"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9edff] text-xs font-semibold text-[#354c9b]">
                        {initials || <UserRound size={17} />}
                    </span>

                    <span className="hidden min-w-0 sm:block">
                        <span className="block max-w-32 truncate text-xs font-semibold text-slate-800">
                            {displayName}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-400">
                            Account
                        </span>
                    </span>

                    <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
                </button>
            </div>
        </header>
    );
}
