import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import ProtectedRoute from "./routes/ProtectedRoute";
import AuthLayout from "./layouts/AuthLayout";
import AppLayout from "./layouts/AppLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";

import Accounts from "./pages/accounts/Accounts";
import CreateAccount from "./pages/accounts/CreateAccount";
import AccountDetails from "./pages/accounts/AccountDetails";

import Transfers from "./pages/transfers/Transfers";
import TransactionHistory from "./pages/transactions/TransactionHistory";

import Ledger from "./pages/ledger/Ledger";
import Profile from "./pages/profile/Profile";
import Settings from "./pages/settings/Settings";
import SystemConsole from "./pages/system/SystemConsole";
import LoadingState from "./components/ui/LoadingState";

function RootRedirect() {
  const { isAuthenticated } = useAuth();

  return (
    <Navigate
      to={isAuthenticated ? "/dashboard" : "/login"}
      replace
    />
  );
}

function AppRoutes() {
  const { user, isInitializing, authError, retrySession } = useAuth();
  const isSystemUser = user?.systemUser === true;

  if (isInitializing) {
    return <LoadingState label="Verifying your session..." />;
  }

  if (authError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-6">
        <section className="max-w-md rounded-2xl border border-[#e8ebf0] bg-white p-7 text-center">
          <h1 className="text-lg font-semibold text-[#172033]">
            Session verification failed
          </h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-slate-600">
            {authError}
          </p>
          <button
            type="button"
            onClick={retrySession}
            className="mt-5 rounded-xl bg-[#1d2b46] px-5 py-3 text-sm font-medium text-white"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected application routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {isSystemUser ? (
            <>
              <Route path="/dashboard" element={<SystemConsole />} />
              <Route path="/accounts" element={<SystemConsole />} />
              <Route path="/accounts/*" element={<SystemConsole />} />
              <Route path="/transactions" element={<SystemConsole />} />
              <Route path="/transactions/*" element={<SystemConsole />} />
              <Route path="/ledger" element={<SystemConsole />} />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/accounts/new" element={<CreateAccount />} />
              <Route path="/accounts/:accountId" element={<AccountDetails />} />
              <Route path="/transactions" element={<Transfers />} />
              <Route
                path="/transactions/history"
                element={<TransactionHistory />}
              />
              <Route path="/ledger" element={<Ledger />} />
            </>
          )}

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />

          {/* Settings */}
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Not found */}
      <Route
        path="*"
        element={
          <AuthLayout>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-[#172033]">
                Page not found
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                The page you're looking for doesn't exist.
              </p>
            </div>
          </AuthLayout>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
