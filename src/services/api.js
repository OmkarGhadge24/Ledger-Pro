import axios from "axios";

const api = axios.create({
    baseURL: (
        import.meta.env.VITE_API_BASE_URL ||
        "https://banking-system-9uo7.onrender.com"
    ).replace(/\/+$/, ""),
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("ledgerpro_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});


export function getApiError(error) {
    if (error.response) {
        return (
            error.response.data?.Message ||
            error.response.data?.message ||
            `Request failed with status ${error.response.status}.`
        );
    }

    if (error.code === "ECONNABORTED") {
        return "The server took too long to respond. Please try again.";
    }

    if (error.request) {
        return "No response received. Check backend availability and CORS configuration.";
    }

    return error.message || "Unable to send the request.";
}

export default api;
