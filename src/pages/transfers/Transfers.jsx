import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowDown,
    ArrowLeftRight,
    ArrowRight,
    CheckCircle2,
    CircleAlert,
    LoaderCircle,
    RefreshCw,
    ShieldCheck,
    Wallet,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import LoadingState from "../../components/ui/LoadingState";
import accountService from "../../services/account.service";
import transactionService from "../../services/transaction.service";
import { getApiError } from "../../services/api";

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
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

function accountLabel(account) {
    return `Account …${account._id.slice(-6).toUpperCase()}`;
}

export default function Transfers() {
    const [accounts, setAccounts] = useState([]);
    const [balances, setBalances] = useState({});
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [pageError, setPageError] = useState("");
    const [balanceError, setBalanceError] = useState("");

    const [debitAccount, setDebitAccount] = useState("");
    const [creditAccount, setCreditAccount] = useState("");
    const [recipientType, setRecipientType] = useState("own");
    const [recipientAccountId, setRecipientAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [reviewing, setReviewing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [result, setResult] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const loadAccounts = useCallback(async () => {
        setLoadingAccounts(true);
        setPageError("");

        try {
            const data = await accountService.getAccounts();
            const list = Array.isArray(data) ? data : [];
            setAccounts(list);
        } catch (error) {
            setPageError(getApiError(error));
        } finally {
            setLoadingAccounts(false);
        }
    }, []);

    useEffect(() => {
        // The request owns loading state until the account list is returned.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAccounts();
    }, [loadAccounts, refreshKey]);

    useEffect(() => {
        if (!debitAccount) return undefined;

        let isCurrentRequest = true;
        // Keep balance loading state synchronized with the selected source account.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoadingBalance(true);
        setBalanceError("");

        accountService.getBalance(debitAccount)
            .then((balance) => {
                if (isCurrentRequest) {
                    setBalances((current) => ({
                        ...current,
                        [debitAccount]: Number(balance),
                    }));
                }
            })
            .catch((error) => {
                if (isCurrentRequest) {
                    setBalanceError(getApiError(error));
                }
            })
            .finally(() => {
                if (isCurrentRequest) setLoadingBalance(false);
            });

        return () => {
            isCurrentRequest = false;
        };
    }, [debitAccount, refreshKey]);

    const activeAccounts = useMemo(
        () => accounts.filter((account) => account.status === "ACTIVE"),
        [accounts]
    );

    const source = accounts.find((account) => account._id === debitAccount);
    const targetAccountId = recipientType === "own"
        ? creditAccount
        : recipientAccountId.trim();
    const destination = accounts.find(
        (account) => account._id === targetAccountId
    );

    const sourceBalance = source ? balances[source._id] : undefined;
    const parsedAmount = Number(amount);

    function validateTransfer() {
        if (!debitAccount || !targetAccountId) {
            return "Select a source account and choose or enter a destination account ID.";
        }

        if (!/^[a-fA-F0-9]{24}$/.test(targetAccountId)) {
            return "Enter a valid 24-character destination account ID.";
        }

        if (debitAccount.toLowerCase() === targetAccountId.toLowerCase()) {
            return "Source and destination accounts must be different.";
        }

        if (
            !amount.trim() ||
            !Number.isFinite(parsedAmount) ||
            parsedAmount <= 0 ||
            Math.abs(parsedAmount * 100 - Math.round(parsedAmount * 100)) > 1e-8
        ) {
            return "Enter a positive amount with no more than two decimal places.";
        }

        if (loadingBalance) {
            return "Please wait while the source balance loads.";
        }

        if (sourceBalance === undefined || !Number.isFinite(sourceBalance)) {
            return "The source balance is unavailable. Refresh your accounts and try again.";
        }

        if (parsedAmount > sourceBalance) {
            return "The transfer amount exceeds the available balance.";
        }

        if (destination && source?.currency !== destination.currency) {
            return "Transfers between different currencies are not supported.";
        }

        return "";
    }

    function handleReview(event) {
        event.preventDefault();
        setFormError("");
        setResult(null);

        const validationError = validateTransfer();

        if (validationError) {
            setFormError(validationError);
            return;
        }

        setReviewing(true);
    }

    async function handleTransfer() {
        if (submitting) return;

        setSubmitting(true);
        setFormError("");
        setResult(null);

        try {
            // Generate once for this transfer attempt.
            const idempotencyKey = createIdempotencyKey();

            const response = await transactionService.transfer({
                debitAccount,
                creditAccount: targetAccountId,
                amount: parsedAmount,
                idempotencyKey,
            });

            setResult({
                success: response.Transaction?.status === "SUCCESS",
                message:
                    response.Message ||
                    "The server accepted the transfer request.",
                transaction: response.Transaction || response.transaction || null,
            });

            setReviewing(false);
            setAmount("");
            setDebitAccount("");
            setCreditAccount("");
            setRecipientAccountId("");
            setRecipientType("own");
            setRefreshKey((value) => value + 1);
        } catch (error) {
            setFormError(getApiError(error));
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingAccounts) {
        return <LoadingState label="Loading accounts and balances..." />;
    }

    return (
        <>
            <PageHeader
                eyebrow="Money movement"
                title="Transfer funds"
                description="Move funds between eligible active accounts."
                actions={
                    <button
                        type="button"
                        onClick={() => setRefreshKey((value) => value + 1)}
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#e4e8ef] bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        <RefreshCw size={16} />
                        Refresh balances
                    </button>
                }
            />

            {pageError ? (
                <div className="rounded-2xl border border-[#e8ebf0] bg-white p-6">
                    <div className="flex items-start gap-3 text-sm text-red-700">
                        <CircleAlert size={19} className="mt-0.5 shrink-0" />
                        <p>{pageError}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setRefreshKey((value) => value + 1)}
                        className="mt-5 rounded-xl bg-[#1d2b46] px-4 py-2.5 text-sm font-medium text-white"
                    >
                        Try again
                    </button>
                </div>
            ) : activeAccounts.length === 0 ? (
                <section className="rounded-2xl border border-[#e8ebf0] bg-white p-8 sm:p-10">
                    <Wallet size={28} className="text-[#354c9b]" />
                    <h2 className="mt-5 text-xl font-semibold text-[#172033]">
                        An active source account is required
                    </h2>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                        Create an active account before initiating a transfer. You can
                        send to one of your other accounts or enter another customer's
                        account ID.
                    </p>
                </section>
            ) : result ? (
                <section className="mx-auto max-w-2xl rounded-2xl border border-[#e8ebf0] bg-white p-7 text-center sm:p-10">
                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${result.success ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {result.success ? <CheckCircle2 size={28} /> : <CircleAlert size={28} />}
                    </div>

                    <p className={`mt-5 text-xs font-semibold uppercase tracking-[0.16em] ${result.success ? "text-emerald-700" : "text-amber-700"}`}>
                        {result.success ? "Transfer completed" : "Transfer status"}
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#172033]">
                        {result.success ? "Money transferred" : "Transfer is processing"}
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                        {result.message}
                    </p>

                    {result.transaction && (
                        <div className="mt-6 rounded-xl bg-[#f7f8fa] p-4 text-left">
                            <p className="text-xs text-slate-500">Transaction reference</p>
                            <p className="mt-1 break-all text-sm font-medium text-slate-800">
                                {result.transaction._id || "Reference unavailable"}
                            </p>
                            {result.transaction.status && (
                                <p className="mt-2 text-sm text-slate-600">
                                    Status: {result.transaction.status}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => {
                                setResult(null);
                                setReviewing(false);
                            }}
                            className="rounded-xl bg-[#1d2b46] px-5 py-3 text-sm font-medium text-white hover:bg-[#293d63]"
                        >
                            Make another transfer
                        </button>
                        <button
                            type="button"
                            onClick={() => setRefreshKey((value) => value + 1)}
                            className="rounded-xl border border-[#e4e8ef] px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                            Refresh balances
                        </button>
                    </div>
                </section>
            ) : (
                <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_300px]">
                    <section className="rounded-2xl border border-[#e8ebf0] bg-white p-6 sm:p-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f3ff] text-[#354c9b]">
                                <ArrowLeftRight size={21} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-[#172033]">
                                    Transfer details
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Choose accounts and enter the amount.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleReview} className="mt-8 space-y-6">
                            <div>
                                <label
                                    htmlFor="debitAccount"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    From account
                                </label>
                                <select
                                    id="debitAccount"
                                    value={debitAccount}
                                    onChange={(event) => {
                                        setDebitAccount(event.target.value);
                                        setFormError("");
                                    }}
                                    className="h-12 w-full rounded-xl border border-[#e4e8ef] bg-white px-4 text-sm outline-none focus:border-[#526a9d]"
                                    required
                                >
                                    <option value="">Select source account</option>
                                    {activeAccounts.map((account) => (
                                        <option key={account._id} value={account._id}>
                                            {accountLabel(account)}
                                        </option>
                                    ))}
                                </select>

                                {source && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Available balance:{" "}
                                        {loadingBalance
                                            ? "Loading..."
                                            : balances[source._id] === undefined
                                                ? "Unavailable"
                                            : formatCurrency(balances[source._id])}
                                    </p>
                                )}
                                {balanceError && (
                                    <p role="alert" className="mt-2 text-xs text-red-600">
                                        {balanceError}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-center">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e8ef] bg-[#f7f8fa] text-slate-500">
                                    <ArrowDown size={17} />
                                </span>
                            </div>

                            <div>
                                <p className="mb-2 block text-sm font-medium text-slate-700">
                                    To account
                                </p>
                                <div className="mb-3 grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        aria-pressed={recipientType === "own"}
                                        onClick={() => {
                                            setRecipientType("own");
                                            setFormError("");
                                        }}
                                        className={`rounded-xl border px-3 py-2.5 text-sm ${recipientType === "own" ? "border-[#526a9d] bg-blue-50 text-[#263b70]" : "border-[#e4e8ef] text-slate-600"}`}
                                    >
                                        My account
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={recipientType === "other"}
                                        onClick={() => {
                                            setRecipientType("other");
                                            setFormError("");
                                        }}
                                        className={`rounded-xl border px-3 py-2.5 text-sm ${recipientType === "other" ? "border-[#526a9d] bg-blue-50 text-[#263b70]" : "border-[#e4e8ef] text-slate-600"}`}
                                    >
                                        Another person's account
                                    </button>
                                </div>

                                {recipientType === "own" ? (
                                    <select
                                        id="creditAccount"
                                        value={creditAccount}
                                        onChange={(event) => {
                                            setCreditAccount(event.target.value);
                                            setFormError("");
                                        }}
                                        className="h-12 w-full rounded-xl border border-[#e4e8ef] bg-white px-4 text-sm outline-none focus:border-[#526a9d]"
                                        required
                                    >
                                        <option value="">Select your other account</option>
                                        {activeAccounts
                                            .filter((account) => account._id !== debitAccount)
                                            .map((account) => (
                                                <option key={account._id} value={account._id}>
                                                    {accountLabel(account)} — {account._id}
                                                </option>
                                            ))}
                                    </select>
                                ) : (
                                    <>
                                        <input
                                            id="creditAccount"
                                            value={recipientAccountId}
                                            onChange={(event) => {
                                                setRecipientAccountId(event.target.value.trim());
                                                setFormError("");
                                            }}
                                            placeholder="Enter recipient's 24-character account ID"
                                            autoComplete="off"
                                            className="h-12 w-full rounded-xl border border-[#e4e8ef] px-4 text-sm outline-none focus:border-[#526a9d]"
                                            required
                                        />
                                        <p className="mt-2 text-xs text-slate-500">
                                            Ask the recipient for the full account ID shown on their Accounts page.
                                            The server verifies the account, status, and currency.
                                        </p>
                                    </>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="amount"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Transfer amount (INR)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                        ₹
                                    </span>
                                    <input
                                        id="amount"
                                        type="number"
                                        inputMode="decimal"
                                        min="0.01"
                                        step="0.01"
                                        value={amount}
                                        onChange={(event) => {
                                            setAmount(event.target.value);
                                            setFormError("");
                                        }}
                                        placeholder="0.00"
                                        className="h-12 w-full rounded-xl border border-[#e4e8ef] pl-9 pr-4 text-sm outline-none focus:border-[#526a9d]"
                                        required
                                    />
                                </div>
                                <p className="mt-2 text-xs text-slate-400">
                                    Enter a positive amount with up to two decimal places.
                                </p>
                            </div>

                            {formError && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
                                >
                                    <CircleAlert size={17} className="mt-0.5 shrink-0" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1d2b46] px-5 text-sm font-medium text-white transition hover:bg-[#293d63]"
                            >
                                Review transfer <ArrowRight size={17} />
                            </button>
                        </form>
                    </section>

                    <aside className="h-fit rounded-2xl border border-[#e8ebf0] bg-white p-5">
                        <ShieldCheck size={22} className="text-[#354c9b]" />

                        <h3 className="mt-4 text-sm font-semibold text-slate-800">
                            Transfer security
                        </h3>

                        <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-500">
                            <li>Only active accounts are selectable.</li>
                            <li>Choose another one of your accounts or enter another customer's account ID.</li>
                            <li>The backend verifies recipient status, currency, source ownership, and available funds.</li>
                            <li>Each submission uses an idempotency key.</li>
                            <li>Successful transfers create ledger entries on the backend.</li>
                        </ul>

                        <div className="mt-5 rounded-xl bg-[#f7f8fa] p-4">
                            <p className="text-xs text-slate-500">Transfer amount</p>
                            <p className="mt-2 text-xl font-semibold text-[#172033]">
                                {amount && Number.isFinite(parsedAmount)
                                    ? formatCurrency(parsedAmount)
                                    : formatCurrency(0)}
                            </p>
                        </div>
                    </aside>
                </div>
            )}

            {reviewing && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="transfer-review-title"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f3ff] text-[#354c9b]">
                            <ArrowLeftRight size={21} />
                        </div>

                        <h2
                            id="transfer-review-title"
                            className="mt-5 text-xl font-semibold text-[#172033]"
                        >
                            Review your transfer
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Verify the accounts and amount before submitting this request.
                        </p>

                        <div className="mt-6 space-y-4 rounded-xl border border-[#e8ebf0] p-4">
                            <div>
                                <p className="text-xs text-slate-400">From</p>
                                <p className="mt-1 break-all text-sm font-medium text-slate-800">
                                    {source ? source._id : "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-400">To</p>
                                <p className="mt-1 break-all text-sm font-medium text-slate-800">
                                    {targetAccountId || "—"}
                                </p>
                            </div>

                            <div className="border-t border-[#edf0f4] pt-4">
                                <p className="text-xs text-slate-400">Amount</p>
                                <p className="mt-1 text-2xl font-semibold text-[#172033]">
                                    {formatCurrency(parsedAmount)}
                                </p>
                            </div>
                        </div>

                        {formError && (
                            <p role="alert" className="mt-4 text-sm text-red-600">
                                {formError}
                            </p>
                        )}

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setReviewing(false)}
                                className="h-11 rounded-xl border border-[#e4e8ef] px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Go back
                            </button>

                            <button
                                type="button"
                                disabled={submitting}
                                onClick={handleTransfer}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1d2b46] px-4 text-sm font-medium text-white hover:bg-[#293d63] disabled:opacity-60"
                            >
                                {submitting && (
                                    <LoaderCircle size={16} className="animate-spin" />
                                )}
                                {submitting ? "Submitting..." : "Confirm transfer"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
