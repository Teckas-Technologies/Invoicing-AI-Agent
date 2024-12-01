import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { APP_STATUS } from "./useCreateRequests";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { approveErc20, hasErc20Approval, hasSufficientFunds, payRequest } from "@requestnetwork/payment-processor";
import { useProvider } from "@/contexts/ContractProvider";
import { providers, ethers } from 'ethers';
import { useEthersV5Provider } from "@/hooks/use-ethers-v5-provider";
import { useEthersV5Signer } from "@/hooks/use-ethers-v5-signer";
import { getPaymentNetworkExtension } from "@requestnetwork/payment-detection";

interface Data {
    requestId: string;
}

export const useApprove = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean | null>(null);
    const { data: walletClient, isError, isLoading } = useWalletClient();
    const { address, isConnecting, isDisconnected, isConnected } = useAccount();
    const [status, setStatus] = useState(APP_STATUS.AWAITING_INPUT);
    const [requestData, setRequestData] = useState<Types.IRequestDataWithEvents>();
    const provider = useEthersV5Provider();
    const signer = useEthersV5Signer();

    const approveRequest = async (data: Data) => {
        if (!address) {
            console.error("No address found!");
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);

        const requestClient = new RequestNetwork({
            nodeConnectionConfig: {
                // baseURL: storageChains.get(storageChain)!.gateway,
                baseURL: 'https://sepolia.gateway.request.network/'
            },
        });

        try {
            const _request = await requestClient.fromRequestId(
                data.requestId,
            );
            const _requestData = _request.getData();
            alert(`Checking if payer has sufficient funds...`);
            const _hasSufficientFunds = await hasSufficientFunds(
                {
                    request: _requestData,
                    address: address as string,
                    providerOptions: {
                        provider: provider,
                    }
                }
            );
            alert(`_hasSufficientFunds = ${_hasSufficientFunds}`);
            if (!_hasSufficientFunds) {
                // setStatus(APP_STATUS.REQUEST_CONFIRMED);
                console.log("Insufficient:", _hasSufficientFunds);
                return;
            }
            if (
                getPaymentNetworkExtension(_requestData)?.id ===
                Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
            ) {
                alert(`ERC20 Request detected. Checking approval...`);
                const _hasErc20Approval = await hasErc20Approval(
                    _requestData,
                    address as string,
                    provider,
                );
                alert(`_hasErc20Approval = ${_hasErc20Approval}`);
                if (!_hasErc20Approval) {
                    const approvalTx = await approveErc20(_requestData, signer);
                    await approvalTx.wait(2);
                }
            }

            setSuccess(true);
        } catch (error) {
            console.error('Error creating request:', error);
            setError('Failed to create request');
            console.log("Error:", error)
            alert(error);
        } finally {
            setLoading(false);
        }
    };

    return { approveRequest, requestData, status, setStatus, loading, error, success };
};