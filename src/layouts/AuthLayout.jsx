import { Link } from "react-router-dom";
import {
    ArrowUpRight,
    Check,
    ShieldCheck,
    Wallet,
} from "lucide-react";

const features = [
    "A clear view of every account",
    "Ledger-based balance tracking",
    "Secure, verified transactions",
];

export default function AuthLayout({ children, mode = "login" }) {
    const isLogin = mode === "login";

    return (
        <main className="min-h-screen bg-white lg:grid lg:grid-cols-[0.92fr_1.08fr]">
            <aside className="relative hidden min-h-screen overflow-hidden bg-[#111d35] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
                <div className="absolute -right-36 top-1/4 h-96 w-96 rounded-full border border-white/10" />
                <div className="absolute -right-20 top-[32%] h-80 w-80 rounded-full border border-white/10" />
                <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

                <Link to="/login" className="relative flex items-center gap-3">
                    <img
                        src="/logo.png"
                        alt="LedgerPro"
                        className="h-11 w-11 rounded-full object-cover"
                    />
                    <span className="text-xl font-semibold tracking-tight">
                        Ledger<span className="text-blue-400">Pro</span>
                    </span>
                </Link>

                <div className="relative max-w-lg">
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
                        <ShieldCheck size={15} className="text-blue-400" />
                        A more considered way to manage your money
                    </div>

                    <h1 className="text-5xl font-semibold leading-[1.12] tracking-tight xl:text-6xl">
                        Your finances,
                        <br />
                        <span className="text-blue-300">in better order.</span>
                    </h1>

                    <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
                        A clear, ledger-based view of your accounts, balances,
                        and financial activity.
                    </p>

                    <div className="mt-10 space-y-4">
                        {features.map((feature) => (
                            <div key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                                    <Check size={14} className="text-blue-300" />
                                </span>
                                {feature}
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 flex max-w-sm items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                            <Wallet size={23} />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Everything in one place</p>
                            <p className="mt-1 text-xs text-slate-400">
                                Simple. Structured. Transparent.
                            </p>
                        </div>
                        <ArrowUpRight className="ml-auto text-slate-500" size={19} />
                    </div>
                </div>

                <p className="relative text-xs text-slate-500">
                    LedgerPro · Banking Ledger Management
                </p>
            </aside>

            <section className="flex min-h-screen flex-col">
                <header className="flex items-center justify-between px-6 py-5 lg:hidden">
                    <Link to="/login" className="flex items-center gap-2 font-semibold">
                        <img
                            src="/logo.png"
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                        />
                        LedgerPro
                    </Link>
                    <span className="text-xs text-slate-500">Secure access</span>
                </header>

                <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
                    <div className="w-full max-w-[410px]">
                        <div className="mb-8">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#526a9d]">
                                {isLogin ? "Welcome back" : "Get started"}
                            </p>
                            <h2 className="text-3xl font-semibold tracking-tight text-[#172033]">
                                {isLogin ? "Sign in to LedgerPro" : "Create your account"}
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                {isLogin
                                    ? "Enter your details to access your financial workspace."
                                    : "Set up your account to start managing your finances."}
                            </p>
                        </div>

                        {children}
                    </div>
                </div>

                <footer className="px-6 py-5 text-center text-xs text-slate-400">
                    © {new Date().getFullYear()} LedgerPro
                </footer>
            </section>
        </main>
    );
}
