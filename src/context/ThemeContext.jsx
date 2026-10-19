import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import ThemeContext from "./ThemeContextValue";

const STORAGE_KEY = "ledgerpro_appearance";
const THEMES = ["light", "dark", "system"];

function getInitialTheme() {
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(storedTheme) ? storedTheme : "light";
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const applyTheme = () => {
            const isDark =
                theme === "dark" || (theme === "system" && mediaQuery.matches);

            document.documentElement.dataset.theme = isDark ? "dark" : "light";
            document.documentElement.style.colorScheme = isDark ? "dark" : "light";
        };

        applyTheme();
        mediaQuery.addEventListener("change", applyTheme);

        return () => mediaQuery.removeEventListener("change", applyTheme);
    }, [theme]);

    const changeTheme = useCallback((nextTheme) => {
        if (!THEMES.includes(nextTheme)) {
            throw new Error(`Unsupported appearance setting: ${nextTheme}`);
        }

        localStorage.setItem(STORAGE_KEY, nextTheme);
        setTheme(nextTheme);
    }, []);

    const value = useMemo(
        () => ({ theme, setTheme: changeTheme }),
        [theme, changeTheme]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
