import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowUpRight,
    RefreshCw,
    Search,
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

function accountLabel(account) {
    if (!account) return "—";
    if (typeof account === "string") return account;
    return account.accountNumber || account._id || account.id || "—";
}

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");

    const loadTransactions = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await historyService.getTransactions();
            setTransactions(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter((transaction) => {
            const debit = accountLabel(transaction.debitAccount);
            const credit = accountLabel(transaction.creditAccount);
            const status = String(transaction.status || "UNKNOWN").toUpperCase();
            const id = String(transaction._id || transaction.id || "");
            const text = `${id} ${debit} ${credit} ${status}`.toLowerCase();

            const matchesSearch = text.includes(search.toLowerCase());
            const matchesFilter =
                filter === "ALL" || status === filter;

            return matchesSearch && matchesFilter;
        });
    }, [transactions, search, filter]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Transaction history"
                description="Review transfers involving your accounts."
            />

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-slate-500">Transactions found</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">
                            {transactions.length}
                        </p>
                    </div>

                    <button
                        onClick={loadTransactions}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by transaction or account ID"
                            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                        <option value="ALL">All statuses</option>
                        <option value="SUCCESS">Success</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Failed</option>
                    </select>
                </div>

                {loading ? (
                    <div className="py-8"><LoadingState /></div>
                ) : error ? (
                    <div className="py-6">
                        <ErrorState message={error} />
                        <button
                            onClick={loadTransactions}
                            className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-800"
                        >
                            Try again
                        </button>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <ArrowLeftRight size={22} />
                        </div>
                        <h3 className="mt-4 font-semibold text-slate-900">
                            No transactions found
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {transactions.length
                                ? "Try changing your search or status filter."
                                : "Transfers involving your accounts will appear here."}
                        </p>
                    </div>
                ) : (
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-3 font-medium">Transaction</th>
                                    <th className="px-3 py-3 font-medium">From account</th>
                                    <th className="px-3 py-3 font-medium">To account</th>
                                    <th className="px-3 py-3 font-medium">Date</th>
                                    <th className="px-3 py-3 font-medium">Status</th>
                                    <th className="px-3 py-3 text-right font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.map((transaction) => {
                                    const status = String(
                                        transaction.status || "UNKNOWN"
                                    ).toUpperCase();
                                    const id = transaction._id || transaction.id;
                                    const currency =
                                        transaction.currency ||
                                        transaction.debitAccount?.currency ||
                                        transaction.creditAccount?.currency ||
                                        "INR";

                                    return (
                                        <tr key={id} className="transition hover:bg-slate-50">
                                            <td className="px-3 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                                        <ArrowLeftRight size={17} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            Transfer
                                                        </p>
                                                        <p className="max-w-32 truncate text-xs text-slate-500">
                                                            {id || "Transaction"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-slate-600">
                                                {accountLabel(transaction.debitAccount)}
                                            </td>
                                            <td className="px-3 py-4 text-slate-600">
                                                {accountLabel(transaction.creditAccount)}
                                            </td>
                                            <td className="px-3 py-4 text-slate-600">
                                                {formatDate(transaction.createdAt)}
                                            </td>
                                            <td className="px-3 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${["SUCCESS", "COMPLETED"].includes(status)
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : status === "PENDING"
                                                                ? "bg-amber-50 text-amber-700"
                                                                : status === "FAILED"
                                                                    ? "bg-red-50 text-red-700"
                                                                    : "bg-slate-100 text-slate-600"
                                                        }`}
                                                >
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-right font-semibold text-slate-900">
                                                {formatMoney(transaction.amount, currency)}
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
