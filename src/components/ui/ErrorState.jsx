import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorState({ message, onRetry }) {
    return (
        <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertCircle size={21} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-800">
                Couldn't load your data
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {message}
            </p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
                <RefreshCw size={15} />
                Try again
            </button>
        </div>
    );
}
