import api from "./api";

const historyService = {
    async getTransactions() {
        const response = await api.get("/api/transactions/history");
        return response.data.transactions ?? [];
    },

    async getLedgerEntries() {
        const response = await api.get("/api/transactions/ledger");
        return response.data.entries ?? [];
    },
};

export default historyService;
