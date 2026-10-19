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
};

export default transactionService;
