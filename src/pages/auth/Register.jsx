import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import { useAuth } from "../../context/AuthContext";
import { getApiError } from "../../services/api";

const inputClass =
    "w-full rounded-xl border border-[#e4e8ef] bg-white py-3 pl-11 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#526a9d] focus:ring-4 focus:ring-blue-900/[0.06]";

function Field({ id, label, icon: Icon, children }) {
    return (
        <div>
            <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
                {label}
            </label>
            <div className="relative">
                <Icon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                {children}
            </div>
        </div>
    );
}

export default function Register() {
    const { register, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (isAuthenticated) return <Navigate to="/dashboard" replace />;

    function updateField(event) {
        setForm({ ...form, [event.target.name]: event.target.value });
        setError("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const name = form.name.trim();
        const email = form.email.trim().toLowerCase();

        if (!name) {
            setError("Enter your full name.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Enter a valid email address.");
            return;
        }

        if (form.password.length < 8) {
            setError("Use a password with at least 8 characters.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Your passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await register({ name, email, password: form.password });
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout mode="register">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Field id="name" label="Full name" icon={UserRound}>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Your full name"
                        value={form.name}
                        onChange={updateField}
                        className={inputClass}
                        required
                    />
                </Field>

                <Field id="email" label="Email address" icon={Mail}>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={updateField}
                        className={inputClass}
                        required
                    />
                </Field>

                <Field id="password" label="Password" icon={LockKeyhole}>
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        value={form.password}
                        onChange={updateField}
                        className={`${inputClass} pr-12`}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
                    >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                </Field>

                <Field id="confirmPassword" label="Confirm password" icon={LockKeyhole}>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        value={form.confirmPassword}
                        onChange={updateField}
                        className={inputClass}
                        required
                    />
                </Field>

                {error && (
                    <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d2b46] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#293d63] focus:outline-none focus:ring-4 focus:ring-slate-900/10 disabled:opacity-60"
                >
                    {loading && <LoaderCircle size={17} className="animate-spin" />}
                    {loading ? "Creating account..." : "Create account"}
                </button>

                <p className="pt-1 text-center text-sm text-slate-500">
                    Already registered?{" "}
                    <Link to="/login" className="font-semibold text-[#263b70] hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}