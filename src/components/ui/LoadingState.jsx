import { LoaderCircle } from "lucide-react";

export default function LoadingState({ label = "Loading your accounts..." }) {
    return (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-slate-500">
            <LoaderCircle size={25} className="animate-spin text-[#354c9b]" />
            <p className="text-sm">{label}</p>
        </div>
    );
}
