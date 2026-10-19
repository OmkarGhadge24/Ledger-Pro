import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    ArrowDownLeft,
    ArrowRight,
    CircleAlert,
    Copy,
    RefreshCw,
    ShieldCheck,
    Wallet,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import transactionService from "../../services/transaction.service";
import { getApiError } from "../../services/api";

function formatCurrency(value, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);
}

function createIdempotencyKey() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getMode(pathname) {
    if (pathname.startsWith("/accounts")) return "accounts";
    if (pathname.startsWith("/transactions")) return "fund";
    if (pathname.startsWith("/ledger")) return "ledger";
    return "overview";
}

function AccountList({ accounts }) {
    if (!accounts.length) {
        return (
            <div className="rounded-2xl border border-[#e8ebf0] bg-white p-8 text-center">
                <Wallet size={24} className="mx-auto text-slate-400" />
                <h2 className="mt-3 font-semibold text-slate-800">
                    No customer accounts yet
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    Accounts appear here as soon as customers create them.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-[#e8ebf0] bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#fafbfc] text-xs text-slate-500">
                    <tr>
                        <th className="px-5 py-4 font-medium">Customer</th>
                        <th className="px-5 py-4 font-medium">Account ID</th>
                        <th className="px-5 py-4 font-medium">Currency</th>
                        <th className="px-5 py-4 font-medium">Status</th>
                        <th className="px-5 py-4 text-right font-medium">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0f4]">
                    {accounts.map((account) => (
                        <tr key={account._id}>
                            <td className="px-5 py-4 font-medium text-slate-800">
                                {account.user?.name || "Customer"}
                            </td>
                            <td className="px-5 py-4">
                                <code className="select-all break-all text-xs text-slate-600">
                                    {account._id}
                                </code>
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                                {account.currency}
                            </td>
                            <td className="px-5 py-4">
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                    {account.status}
                                </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                                <Link
                                    to="/transactions"
                                    state={{ accountId: account._id }}
                                    className="inline-flex items-center gap-1 font-medium text-[#354c9b] hover:underline"
                                >
                                    Fund <ArrowRight size={14} />
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function SystemConsole() {
    const location = useLocation();
    const mode = getMode(location.pathname);
    const [accounts, setAccounts] = useState([]);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [accountChoice, setAccountChoice] = useState("listed");
    const [creditAccount, setCreditAccount] = useState(
        location.state?.accountId || ""
    );
    const [amount, setAmount] = useState("");
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [result, setResult] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            if (mode === "ledger") {
                const data = await transactionService.getSystemLedgerEntries();
                setEntries(Array.isArray(data) ? data : []);
            } else {
                const data = await transactionService.getSystemCustomerAccounts();
                setAccounts(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    }, [mode]);

    useEffect(() => {
        // Start the data request when the selected system view changes.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData, refreshKey]);

    useEffect(() => {
        if (location.state?.accountId) {
            // Carry the selected customer account into the funding form.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAccountChoice("listed");
            setCreditAccount(location.state.accountId);
        }
    }, [location.state]);

    const activeAccounts = accounts.filter(
        (account) => account.status === "ACTIVE"
    );
    const selectedAccount = accounts.find(
        (account) => account._id === creditAccount
    );

    function validateFunding() {
        if (!/^[a-fA-F0-9]{24}$/.test(creditAccount.trim())) {
            return "Select a customer account or enter its valid 24-character account ID.";
        }

        if (
            !amount.trim() ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0 ||
            Math.abs(Number(amount) * 100 - Math.round(Number(amount) * 100)) > 1e-8
        ) {
            return "Enter a positive amount with no more than two decimal places.";
        }

        if (selectedAccount && selectedAccount.status !== "ACTIVE") {
            return "Initial funding is only available for ACTIVE accounts.";
        }

        return "";
    }

    function handleReview(event) {
        event.preventDefault();
        setFormError("");
        setResult(null);

        const validationError = validateFunding();
        if (validationError) {
            setFormError(validationError);
            return;
        }

        setConfirming(true);
    }

    async function handleFunding() {
        if (submitting) return;

        setSubmitting(true);
        setFormError("");

        try {
            const response = await transactionService.fundCustomerAccount({
                creditAccount: creditAccount.trim(),
                amount: Number(amount),
                idempotencyKey: createIdempotencyKey(),
            });

            setResult({
                message: response.Message || "Initial funding completed.",
                transaction: response.Transaction,
            });
            setConfirming(false);
            setAmount("");
            setRefreshKey((value) => value + 1);
        } catch (err) {
            setFormError(getApiError(err));
        } finally {
            setSubmitting(false);
        }
    }

    const titles = {
        overview: ["System workspace", "System overview"],
        accounts: ["Customer accounts", "Customer accounts"],
        fund: ["Initial funding", "Fund a customer account"],
        ledger: ["Funding records", "System funding ledger"],
    };
    const descriptions = {
        overview: "Find customer account IDs and review the system funding workflow.",
        accounts: "Customer account IDs are shown here as soon as an account is created.",
        fund: "Credit any active customer account using its account ID.",
        ledger: "Review the debit and credit entries created by system funding.",
    };

    return (
        <>
            <PageHeader
                eyebrow={titles[mode][0]}
                title={titles[mode][1]}
                description={descriptions[mode]}
                actions={
                    <button
                        type="button"
                        onClick={() => setRefreshKey((value) => value + 1)}
                        disabled={loading}
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#e4e8ef] bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
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
                <LoadingState label="Loading system workspace..." />
            ) : mode === "ledger" ? (
                entries.length === 0 ? (
                    <div className="rounded-2xl border border-[#e8ebf0] bg-white p-8 text-center">
                        <ArrowDownLeft size={24} className="mx-auto text-slate-400" />
                        <h2 className="mt-3 font-semibold text-slate-800">
                            No funding entries yet
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Completed system funding will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-[#e8ebf0] bg-white">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-[#fafbfc] text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-medium">Entry</th>
                                    <th className="px-5 py-4 font-medium">Type</th>
                                    <th className="px-5 py-4 font-medium">Account ID</th>
                                    <th className="px-5 py-4 font-medium">Transaction</th>
                                    <th className="px-5 py-4 font-medium">Date</th>
                                    <th className="px-5 py-4 text-right font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#edf0f4]">
                                {entries.map((entry) => (
                                    <tr key={entry._id}>
                                        <td className="px-5 py-4">
                                            <code className="select-all text-xs text-slate-600">
                                                {entry._id}
                                            </code>
                                        </td>
                                        <td className="px-5 py-4 font-medium text-slate-700">
                                            {entry.type}
                                        </td>
                                        <td className="px-5 py-4">
                                            <code className="select-all text-xs text-slate-600">
                                                {entry.account?._id || "—"}
                                            </code>
                                        </td>
                                        <td className="px-5 py-4">
                                            <code className="select-all text-xs text-slate-600">
                                                {entry.transaction?._id || "—"}
                                            </code>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {entry.createdAt
                                                ? new Date(entry.createdAt).toLocaleString()
                                                : "—"}
                                        </td>
                                        <td className="px-5 py-4 text-right font-semibold text-slate-800">
                                            {formatCurrency(
                                                entry.amount,
                                                entry.account?.currency || "INR"
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : mode === "fund" ? (
                <section className="mx-auto max-w-2xl rounded-2xl border border-[#e8ebf0] bg-white p-6 sm:p-8">
                    {result ? (
                        <div role="status" className="text-center">
                            <ShieldCheck size={32} className="mx-auto text-emerald-600" />
                            <h2 className="mt-4 text-xl font-semibold text-slate-800">
                                Funding completed
                            </h2>
                            <p className="mt-2 text-sm text-slate-600">{result.message}</p>
                            <p className="mt-3 break-all text-xs text-slate-500">
                                Transaction ID: {result.transaction?._id || "Unavailable"}
                            </p>
                            <button
                                type="button"
                                onClick={() => setResult(null)}
                                className="mt-6 rounded-xl bg-[#1d2b46] px-5 py-3 text-sm font-medium text-white"
                            >
                                Fund another account
                            </button>
                        </div>
                    ) : activeAccounts.length === 0 ? (
                        <div className="text-center">
                            <Wallet size={28} className="mx-auto text-slate-400" />
                            <h2 className="mt-4 font-semibold text-slate-800">
                                No active customer accounts
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Funding becomes available when a customer creates an active account.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleReview} className="space-y-5">
                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                                <p className="font-semibold">System-user funding</p>
                                <p className="mt-1 leading-6">
                                    Choose an account below or paste its 24-character ID. Confirm the details before funds are recorded.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="customer-account"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Customer account
                                </label>
                                <select
                                    id="customer-account"
                                    value={accountChoice === "listed" ? creditAccount : ""}
                                    onChange={(event) => {
                                        setAccountChoice("listed");
                                        setCreditAccount(event.target.value);
                                        setFormError("");
                                    }}
                                    className="h-12 w-full rounded-xl border border-[#e4e8ef] bg-white px-4 text-sm"
                                >
                                    <option value="">Select an active customer account</option>
                                    {activeAccounts.map((account) => (
                                        <option key={account._id} value={account._id}>
                                            {account.user?.name || "Customer"} — {account._id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="customer-account-id"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Or enter account ID
                                </label>
                                <input
                                    id="customer-account-id"
                                    value={accountChoice === "manual" ? creditAccount : ""}
                                    onFocus={() => setAccountChoice("manual")}
                                    onChange={(event) => {
                                        setCreditAccount(event.target.value.trim());
                                        setFormError("");
                                    }}
                                    placeholder="24-character MongoDB account ID"
                                    className="h-12 w-full rounded-xl border border-[#e4e8ef] px-4 text-sm"
                                    autoComplete="off"
                                />
                            </div>

                            {selectedAccount && accountChoice === "listed" && (
                                <p className="break-all text-xs text-slate-500">
                                    Selected ID: <code className="select-all">{selectedAccount._id}</code>
                                </p>
                            )}

                            <div>
                                <label
                                    htmlFor="funding-amount"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Amount ({selectedAccount?.currency || "INR"})
                                </label>
                                <input
                                    id="funding-amount"
                                    type="number"
                                    inputMode="decimal"
                                    min="0.01"
                                    step="0.01"
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    placeholder="0.00"
                                    className="h-12 w-full rounded-xl border border-[#e4e8ef] px-4 text-sm"
                                />
                            </div>

                            {formError && (
                                <p role="alert" className="flex items-start gap-2 text-sm text-red-700">
                                    <CircleAlert size={17} className="mt-0.5 shrink-0" />
                                    {formError}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="h-12 w-full rounded-xl bg-[#1d2b46] px-5 text-sm font-semibold text-white hover:bg-[#293d63]"
                            >
                                Review funding
                            </button>
                        </form>
                    )}
                </section>
            ) : mode === "accounts" ? (
                <AccountList accounts={accounts} />
            ) : (
                <>
                    <section className="mb-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[#e8ebf0] bg-white p-5">
                            <p className="text-sm text-slate-500">Customer accounts</p>
                            <p className="mt-3 text-3xl font-semibold text-slate-800">
                                {accounts.length}
                            </p>
                        </div>
                        <Link
                            to="/ledger"
                            className="rounded-2xl border border-[#e8ebf0] bg-white p-5 transition hover:border-slate-300"
                        >
                            <p className="text-sm text-slate-500">Funding records</p>
                            <p className="mt-3 inline-flex items-center gap-2 font-semibold text-[#354c9b]">
                                View system ledger <ArrowRight size={16} />
                            </p>
                        </Link>
                    </section>
                    <AccountList accounts={accounts} />
                </>
            )}

            {confirming && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="funding-confirm-title"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <Copy size={20} className="text-[#354c9b]" />
                            <h2
                                id="funding-confirm-title"
                                className="text-lg font-semibold text-slate-800"
                            >
                                Confirm initial funding
                            </h2>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-600">
                            Credit <strong>{formatCurrency(Number(amount), selectedAccount?.currency || "INR")}</strong> to account{" "}
                            <code className="break-all">{creditAccount}</code>?
                        </p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                            This will create a transaction and immutable debit/credit ledger entries.
                        </p>
                        {formError && (
                            <p role="alert" className="mt-4 text-sm text-red-700">
                                {formError}
                            </p>
                        )}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setConfirming(false)}
                                className="h-11 rounded-xl border border-[#e4e8ef] px-4 text-sm text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={handleFunding}
                                className="h-11 rounded-xl bg-[#1d2b46] px-4 text-sm font-medium text-white disabled:opacity-60"
                            >
                                {submitting ? "Processing..." : "Confirm funding"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
