
export interface PaymentRequestProvider {
    createPayment(data: any, requestId: string, accessToken: string, metaData: any): Promise<any>;
}