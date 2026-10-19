import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

function getStoredUser() {
    try {
        const user = localStorage.getItem("ledgerpro_user");
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getStoredUser);

    const saveSession = useCallback((data) => {
        if (!data?.token || !data?.user) {
            throw new Error("The server returned an invalid authentication response.");
        }

        localStorage.setItem("ledgerpro_token", data.token);
        localStorage.setItem("ledgerpro_user", JSON.stringify(data.user));
        setUser(data.user);
    }, []);

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
        }
    }, []);

    const value = useMemo(
        () => ({ user, isAuthenticated: Boolean(user), login, register, logout }),
        [user, login, register, logout]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}