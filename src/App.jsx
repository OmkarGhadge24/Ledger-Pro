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
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected application routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Accounts */}
          <Route
            path="/accounts"
            element={<Accounts />}
          />

          <Route
            path="/accounts/new"
            element={<CreateAccount />}
          />

          <Route
            path="/accounts/:accountId"
            element={<AccountDetails />}
          />

          {/* Transactions */}
          <Route
            path="/transactions"
            element={<Transfers />}
          />
          <Route
            path="/transactions/history"
            element={<TransactionHistory />}
          />

          {/* Ledger */}
          <Route
            path="/ledger"
            element={<Ledger />}
          />

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
