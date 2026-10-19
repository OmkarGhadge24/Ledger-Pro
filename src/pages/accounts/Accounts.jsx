import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    ArrowDownLeft,
    ArrowUpRight,
    ChevronRight,
    CirclePlus,
    RefreshCw,
    Search,
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

function shortId(id) {
    return id ? `...${id.slice(-6).toUpperCase()}` : "—";
}

export default function Accounts() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [accounts, setAccounts] = useState([]);
    const [balances, setBalances] = useState({});
    const search = searchParams.get("search") || "";
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const loadAccounts = useCallback(async () => {
        try {
            const result = await accountService.getAccounts();
            const safeAccounts = Array.isArray(result) ? result : [];

            setAccounts(safeAccounts);

            const balanceResults = await Promise.allSettled(
                safeAccounts.map(async (account) => ({
                    id: account._id,
                    balance: await accountService.getBalance(account._id),
                }))
            );

            const nextBalances = {};

            balanceResults.forEach((result) => {
                if (result.status === "fulfilled") {
                    nextBalances[result.value.id] = result.value.balance;
                }
            });

            setBalances(nextBalances);
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // The loader updates state after the asynchronous request completes.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAccounts();
    }, [loadAccounts, refreshKey]);

    const filteredAccounts = useMemo(() => {
        const query = search.trim().toLowerCase();

        return accounts.filter((account) => {
            const id = account._id?.toLowerCase() || "";
            const currency = account.currency?.toLowerCase() || "";
            const status = account.status?.toUpperCase() || "";

            const matchesSearch =
                !query || id.includes(query) || currency.includes(query);

            const matchesStatus =
                statusFilter === "ALL" || status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [accounts, search, statusFilter]);

    const totalBalance = accounts.reduce(
        (sum, account) => sum + (Number(balances[account._id]) || 0),
        0
    );

    const activeCount = accounts.filter(
        (account) => account.status === "ACTIVE"
    ).length;

    const handleRefresh = () => {
        setLoading(true);
        setError("");
        setRefreshKey((value) => value + 1);
    };

    return (
        <>
            <PageHeader
                eyebrow="Your finances"
                title="Accounts"
                description="View your accounts, balances, and account status in one place."
                actions={
                    <>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={loading}
                            aria-label="Refresh accounts"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e4e8ef] bg-white px-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={loading ? "animate-spin" : ""}
                            />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>

                        <Link
                            to="/accounts/new"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1d2b46] px-4 text-sm font-medium text-white transition hover:bg-[#293d63]"
                        >
                            <CirclePlus size={17} />
                            Add account
                        </Link>
                    </>
                }
            />

            {error ? (
                <ErrorState
                    message={error}
                    onRetry={handleRefresh}
                />
            ) : (
                <>
                    <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl border border-[#e8ebf0] bg-white p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500">Total accounts</p>
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0f3ff] text-[#354c9b]">
                                    <Wallet size={18} />
                                </span>
                            </div>
                            <p className="mt-4 text-3xl font-semibold tracking-tight text-[#172033]">
                                {accounts.length}
                            </p>
                            <p className="mt-2 text-xs text-slate-400">
                                Accounts linked to your profile
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#e8ebf0] bg-white p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500">Combined balance</p>
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <ArrowUpRight size={18} />
                                </span>
                            </div>
                            <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-[#172033]">
                                {formatCurrency(totalBalance)}
                            </p>
                            <p className="mt-2 text-xs text-slate-400">
                                Sum of successfully retrieved account balances
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#e8ebf0] bg-white p-5 sm:col-span-2 xl:col-span-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500">Active accounts</p>
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                    <ArrowDownLeft size={18} />
                                </span>
                            </div>
                            <p className="mt-4 text-3xl font-semibold tracking-tight text-[#172033]">
                                {activeCount}
                            </p>
                            <p className="mt-2 text-xs text-slate-400">
                                Accounts with ACTIVE status
                            </p>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-[#e8ebf0] bg-white">
                        <div className="flex flex-col gap-4 border-b border-[#edf0f4] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div>
                                <h2 className="font-semibold text-[#172033]">
                                    All accounts
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Your account records and available balances
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="relative">
                                    <Search
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setSearchParams((params) => {
                                                if (value) {
                                                    params.set("search", value);
                                                } else {
                                                    params.delete("search");
                                                }

                                                return params;
                                            }, { replace: true });
                                        }}
                                        placeholder="Search account ID..."
                                        aria-label="Search accounts"
                                        className="h-10 w-full rounded-xl border border-[#e4e8ef] pl-9 pr-3 text-sm outline-none focus:border-[#526a9d] sm:w-52"
                                    />
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    aria-label="Filter by status"
                                    className="h-10 rounded-xl border border-[#e4e8ef] bg-white px-3 text-sm text-slate-600 outline-none focus:border-[#526a9d]"
                                >
                                    <option value="ALL">All statuses</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="FROZEN">Frozen</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <LoadingState label="Loading accounts and balances..." />
                        ) : filteredAccounts.length === 0 ? (
                            <div className="px-6 py-16 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                                    <Wallet size={22} />
                                </div>
                                <h3 className="mt-4 font-semibold text-slate-800">
                                    {accounts.length === 0
                                        ? "No accounts yet"
                                        : "No matching accounts"}
                                </h3>
                                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                    {accounts.length === 0
                                        ? "Create an account to start organizing your ledger."
                                        : "Try another search or change the status filter."}
                                </p>

                                {accounts.length === 0 && (
                                    <Link
                                        to="/accounts/new"
                                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1d2b46] px-4 py-3 text-sm font-medium text-white hover:bg-[#293d63]"
                                    >
                                        <CirclePlus size={16} />
                                        Create account
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px] text-left">
                                        <thead>
                                            <tr className="border-b border-[#edf0f4] bg-[#fafbfc]">
                                                <th className="px-6 py-3.5 text-xs font-medium text-slate-500">
                                                    Account
                                                </th>
                                                <th className="px-6 py-3.5 text-xs font-medium text-slate-500">
                                                    Currency
                                                </th>
                                                <th className="px-6 py-3.5 text-xs font-medium text-slate-500">
                                                    Balance
                                                </th>
                                                <th className="px-6 py-3.5 text-xs font-medium text-slate-500">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3.5 text-right text-xs font-medium text-slate-500">
                                                    Details
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-[#edf0f4]">
                                            {filteredAccounts.map((account) => (
                                                <tr
                                                    key={account._id}
                                                    className="transition hover:bg-[#fafbfc]"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f3ff] text-[#354c9b]">
                                                                <Wallet size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">
                                                                    Account {shortId(account._id)}
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-400">
                                                                    ID: {account._id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {account.currency || "INR"}
                                                    </td>

                                                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                                                        {Object.prototype.hasOwnProperty.call(
                                                            balances,
                                                            account._id
                                                        )
                                                            ? formatCurrency(
                                                                balances[account._id],
                                                                account.currency || "INR"
                                                            )
                                                            : loading
                                                                ? "Loading..."
                                                                : "Unavailable"}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={[
                                                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                                                account.status === "ACTIVE"
                                                                    ? "bg-emerald-50 text-emerald-700"
                                                                    : account.status === "FROZEN"
                                                                        ? "bg-amber-50 text-amber-700"
                                                                        : "bg-slate-100 text-slate-600",
                                                            ].join(" ")}
                                                        >
                                                            {account.status || "UNKNOWN"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 text-right">
                                                        <Link
                                                            to={`/accounts/${account._id}`}
                                                            aria-label={`View account ${shortId(account._id)}`}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                                        >
                                                            <ChevronRight size={18} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="border-t border-[#edf0f4] px-6 py-4 text-xs text-slate-400">
                                    Showing {filteredAccounts.length} of {accounts.length} accounts
                                </div>
                            </>
                        )}
                    </section>
                </>
            )}
        </>
    );
}
