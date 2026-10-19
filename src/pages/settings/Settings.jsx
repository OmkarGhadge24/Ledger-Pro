import { useState } from "react";
import {
    Settings2,
    UserRound,
    Palette,
    ShieldCheck,
    LogOut,
    Sun,
    Moon,
    Monitor,
    Check,
    Info,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../context/AuthContext";
import useTheme from "../../context/useTheme";

const APPEARANCE_OPTIONS = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
];

export default function Settings() {
    const { user, logout } = useAuth();
    const { theme: appearance, setTheme } = useTheme();

    const [message, setMessage] = useState("");

    const handleAppearanceChange = (value) => {
        setTheme(value);
        setMessage("Appearance preference saved on this device.");
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch {
            setMessage("Unable to sign out. Please try again.");
        }
    };

    const name = user?.name || user?.fullName || "User";
    const email = user?.email || "Email not available";

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                description="Manage your LedgerPro preferences and account session."
            />

            {message && (
                <div
                    role="status"
                    className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
                >
                    <Info size={18} className="mt-0.5 shrink-0" />
                    {message}
                </div>
            )}

            {/* Account */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <UserRound size={20} />
                    </div>

                    <div>
                        <h2 className="font-semibold text-slate-900">Account</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Your currently authenticated account information.
                        </p>
                    </div>
                </div>

                <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
                    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-slate-500">Full name</span>
                        <span className="text-sm font-medium text-slate-900">
                            {name}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-slate-500">Email address</span>
                        <span className="break-all text-sm font-medium text-slate-900">
                            {email}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-slate-500">Account status</span>
                        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <ShieldCheck size={14} />
                            Signed in
                        </span>
                    </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                    Editing your name or email requires a supported backend endpoint.
                </p>
            </section>

            {/* Appearance */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                        <Palette size={20} />
                    </div>

                    <div>
                        <h2 className="font-semibold text-slate-900">Appearance</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Choose your preferred appearance setting.
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {APPEARANCE_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const selected = appearance === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleAppearanceChange(option.value)}
                                aria-pressed={selected}
                                className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${selected
                                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                <span className="flex items-center gap-3">
                                    <Icon size={19} className="text-slate-600" />
                                    <span className="text-sm font-medium text-slate-800">
                                        {option.label}
                                    </span>
                                </span>

                                {selected && (
                                    <Check size={17} className="text-blue-700" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                    Your selection is saved locally and applied throughout the
                    application. System follows your device appearance setting.
                </p>
            </section>

            {/* Security */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <ShieldCheck size={20} />
                    </div>

                    <div>
                        <h2 className="font-semibold text-slate-900">Security</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage your current application session.
                        </p>
                    </div>
                </div>

                <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-900">
                            Sign out of LedgerPro
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            End your current session on this device.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                    Password changes and active-session management are not available
                    here unless the backend explicitly supports them.
                </p>
            </section>

            {/* About */}
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Settings2 size={19} className="mt-0.5 shrink-0 text-slate-500" />
                <div>
                    <p className="text-sm font-medium text-slate-800">
                        LedgerPro preferences
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        Appearance preferences are stored in this browser. Your account,
                        balances, and transactions remain managed by the connected backend.
                    </p>
                </div>
            </div>
        </div>
    );
}
