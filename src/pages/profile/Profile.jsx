import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/layout/PageHeader";
import {
    UserRound,
    Mail,
    ShieldCheck,
    CalendarDays,
} from "lucide-react";

function getInitials(name) {
    if (!name) return "U";

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function formatDate(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function ProfileInfoCard({ icon: Icon, label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon size={19} />
                </div>

                <div className="min-w-0">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-1 break-words font-medium text-slate-900">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function Profile() {
    const { user } = useAuth();

    const name = user?.name || user?.fullName || "User";
    const email = user?.email || "Email not available";
    const joinedAt = formatDate(user?.createdAt);

    return (
        <div className="space-y-6">
            <PageHeader
                title="My profile"
                description="View your LedgerPro account information."
            />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Banner */}
                <div className="h-28 bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800" />

                <div className="px-5 pb-6 sm:px-8">
                    {/* Profile header */}
                    <div className="relative flex flex-col gap-4 pt-5 sm:min-h-[104px] sm:flex-row sm:items-center sm:pl-28">
                        {/* Avatar overlaps the banner independently */}
                        <div className="absolute left-0 top-[-52px] flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 text-2xl font-bold text-slate-800 shadow-sm">
                            {getInitials(name)}
                        </div>

                        {/* Name and email remain on the white background */}
                        <div className="min-w-0 flex-1 pt-8 sm:pt-0">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {name}
                            </h2>

                            <p className="mt-1 break-all text-sm text-slate-500">
                                {email}
                            </p>
                        </div>

                        {/* Session status */}
                        <div className="sm:ml-auto">
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                <ShieldCheck size={15} />
                                Authenticated session
                            </span>
                        </div>
                    </div>

                    {/* Profile information cards */}
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <ProfileInfoCard
                            icon={UserRound}
                            label="Full name"
                            value={name}
                        />

                        <ProfileInfoCard
                            icon={Mail}
                            label="Email address"
                            value={email}
                        />

                        {joinedAt && (
                            <ProfileInfoCard
                                icon={CalendarDays}
                                label="Member since"
                                value={joinedAt}
                            />
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
