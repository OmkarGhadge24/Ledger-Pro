import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    CircleAlert,
    LoaderCircle,
    ShieldCheck,
    Wallet,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import accountService from "../../services/account.service";
import { getApiError } from "../../services/api";

export default function CreateAccount() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleCreate() {
        setLoading(true);
        setError("");

        try {
            const account = await accountService.createAccount();

            if (!account?._id) {
                throw new Error("The server did not return an account ID.");
            }

            navigate(`/accounts/${account._id}`, {
                replace: true,
                state: { created: true },
            });
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <PageHeader
                eyebrow="Account management"
                title="Create account"
                description="Create a new ledger account linked to your profile."
                actions={
                    <Link
                        to="/accounts"
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#e4e8ef] bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        <ArrowLeft size={16} />
                        Back to accounts
                    </Link>
                }
            />

            <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-[1fr_300px]">
                <section className="rounded-2xl border border-[#e8ebf0] bg-white p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f0f3ff] text-[#354c9b]">
                            <Wallet size={23} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[#172033]">
                                New ledger account
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Review the account settings before creating it.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="rounded-xl border border-[#e8ebf0] p-4">
                            <p className="text-xs text-slate-400">Account currency</p>
                            <p className="mt-2 text-sm font-semibold text-slate-800">
                                INR — Indian Rupee
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Assigned automatically by the backend.
                            </p>
                        </div>

                        <div className="rounded-xl border border-[#e8ebf0] p-4">
                            <p className="text-xs text-slate-400">Initial status</p>
                            <p className="mt-2">
                                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                    Active
                                </span>
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                New accounts are created with ACTIVE status.
                            </p>
                        </div>

                        <div className="rounded-xl border border-[#e8ebf0] p-4">
                            <p className="text-xs text-slate-400">Initial balance</p>
                            <p className="mt-2 text-sm font-semibold text-slate-800">
                                ₹0.00
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                The balance is calculated from ledger entries.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
                        >
                            <CircleAlert size={17} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link
                            to="/accounts"
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#e4e8ef] px-5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </Link>

                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={loading}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1d2b46] px-5 text-sm font-medium text-white transition hover:bg-[#293d63] disabled:opacity-60"
                        >
                            {loading ? (
                                <LoaderCircle size={17} className="animate-spin" />
                            ) : (
                                <CheckCircle2 size={17} />
                            )}
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </div>
                </section>

                <aside className="h-fit rounded-2xl border border-[#e8ebf0] bg-white p-5">
                    <ShieldCheck size={21} className="text-[#354c9b]" />
                    <h3 className="mt-4 text-sm font-semibold text-slate-800">
                        Before you continue
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        This creates an account record. It does not deposit money or
                        create a custom account name.
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                        Only use the separate privileged funding workflow if you are
                        authorized to perform it.
                    </p>
                </aside>
            </div>
        </>
    );
}
