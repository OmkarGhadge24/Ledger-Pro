import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    CircleAlert,
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
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);
}

function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "Not available"
        : date.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
}

export default function AccountDetails() {
    const { accountId } = useParams();
    const location = useLocation();

    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [balanceError, setBalanceError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const loadAccount = useCallback(async () => {
        setLoading(true);
        setError("");
        setBalanceError("");
        setBalance(null);

        try {
            const accounts = await accountService.getAccounts();
            const found = accounts.find((item) => item._id === accountId);

            if (!found) {
                setError("This account was not found in your account list.");
                return;
            }

            setAccount(found);

            try {
                const currentBalance = await accountService.getBalance(accountId);
                setBalance(currentBalance);
            } catch (err) {
                setBalanceError(getApiError(err));
            }
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    useEffect(() => {
        loadAccount();
    }, [loadAccount, refreshKey]);

    if (loading) {
        return <LoadingState label="Loading account details..." />;
    }

    if (error || !account) {
        return (
            <ErrorState
                message={error || "Account details are unavailable."}
                onRetry={() => setRefreshKey((value) => value + 1)}
            />
        );
    }

    const currency = account.currency || "INR";

    return (
        <>
            <PageHeader
                eyebrow="Account management"
                title="Account details"
                description="Review your account information and current ledger balance."
                actions={
                    <>
                        <button
                            type="button"
                            onClick={() => setRefreshKey((value) => value + 1)}
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#e4e8ef] bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                        <Link
                            to="/accounts"
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1d2b46] px-4 text-sm font-medium text-white hover:bg-[#293d63]"
                        >
                            <ArrowLeft size={16} />
                            All accounts
                        </Link>
                    </>
                }
            />

            {location.state?.created && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <ShieldCheck size={18} />
                    Your account was created successfully.
                </div>
            )}

            <section className="rounded-2xl border border-[#e8ebf0] bg-white p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f3ff] text-[#354c9b]">
                            <Wallet size={26} />
                        </div>

                        <div>
                            <h2 className="font-semibold text-[#172033]">
                                Account overview
                            </h2>
                            <p className="mt-1 break-all text-xs text-slate-400">
                                {account._id}
                            </p>
                        </div>
                    </div>

                    <span
                        className={[
                            "w-fit rounded-full px-3 py-1.5 text-xs font-semibold",
                            account.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : account.status === "FROZEN"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600",
                        ].join(" ")}
                    >
                        {account.status}
                    </span>
                </div>

                <div className="mt-8 rounded-2xl bg-[#111d35] p-6 text-white sm:p-8">
                    <p className="text-sm text-slate-300">Current ledger balance</p>

                    {balanceError ? (
                        <div className="mt-4 flex items-start gap-2 text-sm text-amber-200">
                            <CircleAlert size={17} className="mt-0.5 shrink-0" />
                            <div>
                                <p>Balance unavailable</p>
                                <p className="mt-1 text-xs leading-5 text-slate-300">
                                    {balanceError}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-3 break-words text-3xl font-semibold tracking-tight sm:text-4xl">
                            {balance === null
                                ? "—"
                                : formatCurrency(balance, currency)}
                        </p>
                    )}

                    <p className="mt-3 text-xs text-slate-400">
                        Calculated by your backend from ledger entries.
                    </p>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#e8ebf0] p-5">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Wallet size={17} />
                            <p className="text-xs">Currency</p>
                        </div>
                        <p className="mt-3 text-base font-semibold text-slate-800">
                            {currency}
                        </p>
                    </div>

                    <div className="rounded-xl border border-[#e8ebf0] p-5">
                        <div className="flex items-center gap-2 text-slate-400">
                            <ShieldCheck size={17} />
                            <p className="text-xs">Account status</p>
                        </div>
                        <p className="mt-3 text-base font-semibold text-slate-800">
                            {account.status}
                        </p>
                    </div>

                    <div className="rounded-xl border border-[#e8ebf0] p-5 sm:col-span-2">
                        <div className="flex items-center gap-2 text-slate-400">
                            <CalendarDays size={17} />
                            <p className="text-xs">Created on</p>
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-800">
                            {formatDate(account.createdAt)}
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
