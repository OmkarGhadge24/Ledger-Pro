import api from "./api";

const transactionService = {
    async transfer({ debitAccount, creditAccount, amount, idempotencyKey }) {
        const response = await api.post("/api/transactions/", {
            debitAccount,
            creditAccount,
            amount,
            idempotencyKey,
        });

        return response.data;
    },

    async getSystemCustomerAccounts() {
        const response = await api.get("/api/transactions/system/accounts");
        return response.data.accounts;
    },

    async fundCustomerAccount({ creditAccount, amount, idempotencyKey }) {
        const response = await api.post("/api/transactions/system/initial", {
            creditAccount,
            amount,
            idempotencyKey,
        });

        return response.data;
    },

    async getSystemLedgerEntries() {
        const response = await api.get("/api/transactions/system/ledger");
        return response.data.entries;
    },
};

export default transactionService;
