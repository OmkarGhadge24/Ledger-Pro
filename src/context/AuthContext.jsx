import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

function getStoredUser() {
    try {
        if (!localStorage.getItem("ledgerpro_token")) return null;
        const user = localStorage.getItem("ledgerpro_user");
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getStoredUser);
    const [isInitializing, setIsInitializing] = useState(
        () => Boolean(localStorage.getItem("ledgerpro_token"))
    );
    const [authError, setAuthError] = useState("");

    const saveSession = useCallback((data) => {
        if (!data?.token || !data?.user) {
            throw new Error("The server returned an invalid authentication response.");
        }

        localStorage.setItem("ledgerpro_token", data.token);
        localStorage.setItem("ledgerpro_user", JSON.stringify(data.user));
        setUser(data.user);
        setAuthError("");
        setIsInitializing(false);
    }, []);

    const verifySession = useCallback(async () => {
        const token = localStorage.getItem("ledgerpro_token");

        if (!token) return;

        try {
            const response = await api.get("/api/auth/me");
            const currentUser = response.data?.user;

            if (!currentUser || typeof currentUser.systemUser !== "boolean") {
                throw new Error("The server returned an invalid session response.");
            }

            localStorage.setItem("ledgerpro_user", JSON.stringify(currentUser));
            setUser(currentUser);
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem("ledgerpro_token");
                localStorage.removeItem("ledgerpro_user");
                setUser(null);
                setAuthError("");
            } else {
                setAuthError(
                    "Unable to verify your session with the server. Check your connection and try again."
                );
            }
        } finally {
            setIsInitializing(false);
        }
    }, []);

    useEffect(() => {
        // The initializer sets the loading state before session verification starts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        verifySession();
    }, [verifySession]);

    const retrySession = useCallback(() => {
        setIsInitializing(true);
        setAuthError("");
        return verifySession();
    }, [verifySession]);

    const login = useCallback(async (credentials) => {
        const response = await api.post("/api/auth/login", credentials);
        saveSession(response.data);
        return response.data.user;
    }, [saveSession]);

    const register = useCallback(async (details) => {
        const response = await api.post("/api/auth/register", details);
        saveSession(response.data);
        return response.data.user;
    }, [saveSession]);

    const logout = useCallback(async () => {
        try {
            await api.post("/api/auth/logout");
        } finally {
            localStorage.removeItem("ledgerpro_token");
            localStorage.removeItem("ledgerpro_user");
            setUser(null);
            setAuthError("");
            setIsInitializing(false);
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            isInitializing,
            authError,
            retrySession,
            login,
            register,
            logout,
        }),
        [user, isInitializing, authError, retrySession, login, register, logout]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// This context hook is intentionally colocated with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}