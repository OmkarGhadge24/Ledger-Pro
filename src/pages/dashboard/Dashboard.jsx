import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  CirclePlus,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import PageHeader from "../../components/layout/PageHeader";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import accountService from "../../services/account.service";
import { getApiError } from "../../services/api";

function formatCurrency(value, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);
}

function accountLabel(account) {
    return `Account …${account._id.slice(-6).toUpperCase()}`;
}

function StatCard({ label, value, detail, icon: Icon, tone = "blue" }) {
    const tones = {
        blue: "bg-[#f0f3ff] text-[#354c9b]",
        green: "bg-emerald-50 text-emerald-700",
        navy: "bg-slate-100 text-slate-700",
    };

    return (
        <section className="rounded-2xl border border-[#e8ebf0] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{label}</p>
                <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
                >
                    <Icon size={19} strokeWidth={1.8} />
                </span>
            </div>

            <p className="mt-5 break-words text-2xl font-semibold tracking-tight text-[#172033]">
                {value}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
        </section>
    );
}

export default function Dashboard() {
    const [accounts, setAccounts] = useState([]);
    const [balances, setBalances] = useState({});
    const [balanceErrors, setBalanceErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError("");
        setBalanceErrors([]);

        try {
            const data = await accountService.getAccounts();
            const list = Array.isArray(data) ? data : [];

            setAccounts(list);

            const results = await Promise.allSettled(
                list.map(async (account) => ({
                    id: account._id,
                    currency: account.currency || "INR",
                    balance: await accountService.getBalance(account._id),
                }))
            );

            const nextBalances = {};
            const failedBalances = [];

            results.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    const rawBalance = result.value.balance;

                    // Support either a numeric balance or a response object.
                    const amount =
                        typeof rawBalance === "number"
                            ? rawBalance
                            : Number(
                                rawBalance?.balance ??
                                rawBalance?.currentBalance ??
                                rawBalance?.amount
                            );

                    if (Number.isFinite(amount)) {
                        nextBalances[result.value.id] = {
                            amount,
                            currency: result.value.currency,
                        };
                    } else {
                        failedBalances.push(list[index]._id);
                    }
                } else {
                    failedBalances.push(list[index]._id);
                }
            });

            setBalances(nextBalances);
            setBalanceErrors(failedBalances);
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard, refreshKey]);

    const activeAccounts = useMemo(
        () => accounts.filter((account) => account.status === "ACTIVE"),
        [accounts]
    );

    const totalBalances = useMemo(() => {
        const totals = {};

        Object.values(balances).forEach(({ amount, currency }) => {
            totals[currency] = (totals[currency] || 0) + amount;
        });

        return totals;
    }, [balances]);

    const balanceCurrencies = Object.keys(totalBalances);
    const balanceCount = Object.keys(balances).length;

    function renderCombinedBalance() {
        if (accounts.length === 0) return formatCurrency(0);

        if (balanceCount === 0) return "Unavailable";

        if (balanceCurrencies.length === 1) {
            const currency = balanceCurrencies[0];
            return formatCurrency(totalBalances[currency], currency);
        }

        return (
            <div className="space-y-1">
                {balanceCurrencies.map((currency) => (
                    <p key={currency} className="text-lg">
                        {formatCurrency(totalBalances[currency], currency)}
                    </p>
                ))}
            </div>
        );
    }

    return (
        <>
            <PageHeader
                eyebrow="Financial overview"
                title="Dashboard"
                description="A clear view of your accounts and current balances."
                actions={
                    <button
                        type="button"
                        onClick={() => setRefreshKey((value) => value + 1)}
                        disabled={loading}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e4e8ef] bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                }
            />

            {error ? (
                <ErrorState
                    message={error}
                    onRetry={() => setRefreshKey((value) => value + 1)}
                />
            ) : loading ? (
                <LoadingState label="Loading your financial overview..." />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <StatCard
                            label="Total accounts"
                            value={accounts.length}
                            detail="Accounts linked to your profile"
                            icon={Wallet}
                            tone="blue"
                        />

                        <StatCard
                            label="Combined balances"
                            value={renderCombinedBalance()}
                            detail={
                                balanceErrors.length
                                    ? `${balanceErrors.length} account balance(s) unavailable`
                                    : "Calculated from account balance endpoints"
                            }
                            icon={ArrowUpRight}
                            tone="green"
                        />

                        <StatCard
                            label="Active accounts"
                            value={activeAccounts.length}
                            detail="Accounts currently marked ACTIVE"
                            icon={ArrowDownLeft}
                            tone="navy"
                        />
                    </section>

                    <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
                        <div className="overflow-hidden rounded-2xl border border-[#e8ebf0] bg-white">
                            <div className="flex items-center justify-between gap-4 border-b border-[#edf0f4] px-5 py-5 sm:px-6">
                                <div>
                                    <h2 className="font-semibold text-[#172033]">
                                        Your accounts
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Account balances and status
                                    </p>
                                </div>

                                <Link
                                    to="/accounts"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-[#354c9b] hover:underline"
                                >
                                    View all <ArrowRight size={15} />
                                </Link>
                            </div>

                            {accounts.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f3ff] text-[#354c9b]">
                                        <Wallet size={22} />
                                    </div>
                                    <h3 className="mt-4 font-semibold text-slate-800">
                                        No accounts yet
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Create your first account to get started.
                                    </p>
                                    <Link
                                        to="/accounts/new"
                                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1d2b46] px-4 py-3 text-sm font-medium text-white hover:bg-[#293d63]"
                                    >
                                        <CirclePlus size={16} />
                                        Create account
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#edf0f4]">
                                    {accounts.slice(0, 5).map((account) => {
                                        const balance = balances[account._id];

                                        return (
                                            <Link
                                                key={account._id}
                                                to={`/accounts/${account._id}`}
                                                className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#fafbfc] sm:px-6"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f3ff] text-[#354c9b]">
                                                    <Wallet size={18} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-slate-800">
                                                        {accountLabel(account)}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {account.currency || "INR"} · {account.status || "Unknown"}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {balance
                                                            ? formatCurrency(
                                                                balance.amount,
                                                                balance.currency
                                                            )
                                                            : "Unavailable"}
                                                    </p>
                                                    <p className="mt-1 text-[11px] text-slate-400">
                                                        Current balance
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {accounts.length > 5 && (
                                <div className="border-t border-[#edf0f4] px-6 py-4 text-xs text-slate-400">
                                    Showing 5 of {accounts.length} accounts
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <section className="rounded-2xl border border-[#e8ebf0] bg-white p-5 sm:p-6">
                                <h2 className="font-semibold text-[#172033]">
                                    Quick actions
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Common account operations
                                </p>

                                <div className="mt-5 space-y-3">
                                    <Link
                                        to="/accounts/new"
                                        className="group flex items-center gap-3 rounded-xl border border-[#e8ebf0] p-4 transition hover:border-slate-300 hover:bg-[#fafbfc]"
                                    >
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f3ff] text-[#354c9b]">
                                            <CirclePlus size={19} />
                                        </span>
                                        <span className="flex-1">
                                            <span className="block text-sm font-medium text-slate-800">
                                                Create account
                                            </span>
                                            <span className="mt-1 block text-xs text-slate-400">
                                                Add a ledger account
                                            </span>
                                        </span>
                                        <ArrowRight
                                            size={16}
                                            className="text-slate-400 transition group-hover:translate-x-0.5"
                                        />
                                    </Link>

                                    <Link
                                        to="/transactions"
                                        className="group flex items-center gap-3 rounded-xl border border-[#e8ebf0] p-4 transition hover:border-slate-300 hover:bg-[#fafbfc]"
                                    >
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                            <ArrowLeftRight size={19} />
                                        </span>
                                        <span className="flex-1">
                                            <span className="block text-sm font-medium text-slate-800">
                                                Transfer funds
                                            </span>
                                            <span className="mt-1 block text-xs text-slate-400">
                                                Move funds between accounts
                                            </span>
                                        </span>
                                        <ArrowRight
                                            size={16}
                                            className="text-slate-400 transition group-hover:translate-x-0.5"
                                        />
                                    </Link>

                                    <Link
                                        to="/accounts"
                                        className="group flex items-center gap-3 rounded-xl border border-[#e8ebf0] p-4 transition hover:border-slate-300 hover:bg-[#fafbfc]"
                                    >
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                            <Wallet size={19} />
                                        </span>
                                        <span className="flex-1">
                                            <span className="block text-sm font-medium text-slate-800">
                                                Manage accounts
                                            </span>
                                            <span className="mt-1 block text-xs text-slate-400">
                                                Review balances and account status
                                            </span>
                                        </span>
                                        <ArrowRight
                                            size={16}
                                            className="text-slate-400 transition group-hover:translate-x-0.5"
                                        />
                                    </Link>
                                </div>
                            </section>

                            <section className="rounded-2xl bg-[#111d35] p-6 text-white">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-blue-300">
                                    <ShieldCheck size={20} />
                                </div>

                                <h2 className="mt-4 font-semibold">
                                    Ledger-based accounting
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-300">
                                    Account balances are retrieved from your backend. Transfers
                                    are processed by the server rather than calculated locally.
                                </p>
                            </section>
                        </div>
                    </section>

                    {balanceErrors.length > 0 && (
                        <p className="mt-5 text-xs leading-5 text-amber-700">
                            Some balances could not be retrieved. Refresh the dashboard to
                            retry those requests.
                        </p>
                    )}
                </>
            )}
        </>
    );
}
