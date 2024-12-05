import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { APP_STATUS } from "./useCreateRequests";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { approveErc20, hasErc20Approval, hasSufficientFunds, payRequest } from "@requestnetwork/payment-processor";
// import { useProvider } from "@/contexts/ContractProvider";
import { providers, ethers } from 'ethers';
import { useEthersV5Provider } from "@/hooks/use-ethers-v5-provider";
import { useEthersV5Signer } from "@/hooks/use-ethers-v5-signer";
import { storageChains } from "@/config/storage-chain";

interface Data {
    requestId: string;
}

export const usePayRequest = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean | null>(null);
    const { data: walletClient, isError, isLoading } = useWalletClient();
    const { address, isConnecting, isDisconnected, isConnected } = useAccount();
    const [status, setStatus] = useState(APP_STATUS.AWAITING_INPUT);
    const [requestData, setRequestData] = useState<Types.IRequestDataWithEvents>();
    // const { provider } = useProvider();
    const provider = useEthersV5Provider();
    const signer = useEthersV5Signer();

    const payTheRequest = async (data: Data) => {
        if (!address) {
            console.error("No address found!");
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const requestClient = new RequestNetwork({
                nodeConnectionConfig: {
                    baseURL: 'https://sepolia.gateway.request.network/'
                },
            });
            const _request = await requestClient.fromRequestId(
                data.requestId,
            );
            let _requestData = _request.getData();
            const paymentTx = await payRequest(_requestData, signer);
            await paymentTx.wait(2);

            // Poll the request balance once every second until payment is detected
            // TODO Add a timeout
            while (_requestData.balance?.balance! < _requestData.expectedAmount) {
                _requestData = await _request.refresh();
                // alert(`balance = ${_requestData.balance?.balance}`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            // alert(`payment detected!`);
            setRequestData(_requestData);
            setStatus(APP_STATUS.REQUEST_PAID);
            setSuccess(true);
            return { success: true }
        } catch (error) {
            console.error('Error creating request:', error);
            setError('Failed to create request');
            console.log("Error:", error)
            return { success: false }
            // alert(error);
        } finally {
            setLoading(false);
        }
    };

    return { payTheRequest, requestData, status, setStatus, loading, error, success };
};