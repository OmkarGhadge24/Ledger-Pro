import api from "./api";

const accountService = {
    async getAccounts() {
        const response = await api.get("/api/accounts/");
        return response.data.accounts;
    },

    async createAccount() {
        const response = await api.post("/api/accounts/", {});
        return response.data.account;
    },

    async getBalance(accountId) {
        const response = await api.get(
            `/api/accounts/balance/${encodeURIComponent(accountId)}`
        );

        return response.data.balance;
    },
};

export default accountService;
