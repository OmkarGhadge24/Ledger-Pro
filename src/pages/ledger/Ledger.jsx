import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    RefreshCw,
    Search,
    ArrowDownLeft,
    ArrowUpRight,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import historyService from "../../services/history.service";
import { getApiError } from "../../services/api";

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
}

function formatMoney(value, currency = "INR") {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";

    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
}

function getAccountLabel(account) {
    if (!account) return "—";
    if (typeof account === "string") return account;
    return account.accountNumber || account._id || account.id || "—";
}

function getEntryType(entry) {
    return String(
        entry.entryType ||
        entry.type ||
        entry.direction ||
        entry.transactionType ||
        "ENTRY"
    ).toUpperCase();
}

export default function Ledger() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const loadEntries = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await historyService.getLedgerEntries();
            setEntries(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const filteredEntries = useMemo(() => {
        const query = search.toLowerCase();

        return entries.filter((entry) => {
            const account = getAccountLabel(entry.account);
            const transaction =
                typeof entry.transaction === "object"
                    ? entry.transaction?._id || ""
                    : entry.transaction || "";
            const type = getEntryType(entry);
            const id = entry._id || entry.id || "";

            return `${account} ${transaction} ${type} ${id}`
                .toLowerCase()
                .includes(query);
        });
    }, [entries, search]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Ledger entries"
                description="Review the recorded debit and credit entries for your accounts."
            />

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <BookOpen size={21} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Recorded entries</p>
                            <p className="text-2xl font-semibold text-slate-900">
                                {entries.length}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={loadEntries}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                <div className="relative mt-6">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by entry, account, or transaction ID"
                        className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                {loading ? (
                    <div className="py-8"><LoadingState /></div>
                ) : error ? (
                    <div className="py-6">
                        <ErrorState message={error} />
                        <button
                            onClick={loadEntries}
                            className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-800"
                        >
                            Try again
                        </button>
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <BookOpen size={22} />
                        </div>
                        <h3 className="mt-4 font-semibold text-slate-900">
                            No ledger entries found
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {entries.length
                                ? "Try a different search."
                                : "Ledger records will appear here when available."}
                        </p>
                    </div>
                ) : (
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-3 font-medium">Entry</th>
                                    <th className="px-3 py-3 font-medium">Account</th>
                                    <th className="px-3 py-3 font-medium">Transaction</th>
                                    <th className="px-3 py-3 font-medium">Date</th>
                                    <th className="px-3 py-3 text-right font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEntries.map((entry) => {
                                    const id = entry._id || entry.id;
                                    const type = getEntryType(entry);
                                    const isDebit = type.includes("DEBIT");
                                    const currency =
                                        entry.currency || entry.account?.currency || "INR";
                                    const transactionId =
                                        typeof entry.transaction === "object"
                                            ? entry.transaction?._id
                                            : entry.transaction;

                                    return (
                                        <tr key={id} className="transition hover:bg-slate-50">
                                            <td className="px-3 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDebit
                                                                ? "bg-rose-50 text-rose-700"
                                                                : "bg-emerald-50 text-emerald-700"
                                                            }`}
                                                    >
                                                        {isDebit ? (
                                                            <ArrowUpRight size={17} />
                                                        ) : (
                                                            <ArrowDownLeft size={17} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {type}
                                                        </p>
                                                        <p className="max-w-32 truncate text-xs text-slate-500">
                                                            {id || "Ledger entry"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-slate-600">
                                                {getAccountLabel(entry.account)}
                                            </td>
                                            <td className="px-3 py-4 text-slate-600">
                                                {transactionId || "—"}
                                            </td>
                                            <td className="px-3 py-4 text-slate-600">
                                                {formatDate(entry.createdAt)}
                                            </td>
                                            <td className="px-3 py-4 text-right font-semibold text-slate-900">
                                                {formatMoney(entry.amount, currency)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
