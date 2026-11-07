type PaymentErrorResponse = {
    detail?: unknown;
};

export const getPaymentErrorMessage = (
    data: PaymentErrorResponse | undefined,
    fallback: string
) => {
    return typeof data?.detail === "string" && data.detail.trim()
        ? data.detail.trim()
        : fallback;
};
