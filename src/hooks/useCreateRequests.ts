import { useState } from "react";
import { parseUnits, zeroAddress } from "viem";
import { useWalletClient, useAccount } from "wagmi";
import { currencies } from "@/config/currencies";
import { storageChains } from "@/config/storage-chain";
import {
    RequestNetwork,
    Types,
    Utils,
} from "@requestnetwork/request-client.js";
import { Web3SignatureProvider } from "@requestnetwork/web3-signature";
import { useProvider } from "@/contexts/ContractProvider";

interface Data {
    recipientAddress: string;
    currency: string;
    payerAddress: string;
    amount: string;
    storageChain: string;
    dueDate: string;
    reason: string;
}

export enum APP_STATUS {
    AWAITING_INPUT = "awaiting input",
    SUBMITTING = "submitting",
    PERSISTING_TO_IPFS = "persisting to ipfs",
    PERSISTING_ON_CHAIN = "persisting on-chain",
    REQUEST_CONFIRMED = "request confirmed", //=
    APPROVING = "approving",
    APPROVED = "approved",
    PAYING = "paying",
    REQUEST_PAID = "request paid",
    ERROR_OCCURRED = "error occurred",//=
}

export const useCreateRequest = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean | null>(null);
    const { data: walletClient, isError, isLoading } = useWalletClient();
    const { address, isConnecting, isDisconnected } = useAccount();
    const [status, setStatus] = useState(APP_STATUS.AWAITING_INPUT);
    const [requestData, setRequestData] = useState<Types.IRequestDataWithEvents>();
    const { provider } = useProvider();

    const createRequest = async (data: Data) => {
        if (!provider) {
            setError("No wallet client available.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const signatureProvider = new Web3SignatureProvider(walletClient);
            const requestClient = new RequestNetwork({
                nodeConnectionConfig: {
                    baseURL: storageChains.get(data.storageChain)!.gateway,
                },
                signatureProvider,
            });

            const requestCreateParameters: Types.ICreateRequestParameters = {
                requestInfo: {
                    currency: {
                        type: currencies.get(data.currency)!.type,
                        value: currencies.get(data.currency)!.value,
                        network: currencies.get(data.currency)!.network,
                    },
                    expectedAmount: parseUnits(
                        data.amount,
                        currencies.get(data.currency)!.decimals,
                    ).toString(),
                    payee: {
                        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
                        value: address as string,
                    },
                    timestamp: Utils.getCurrentTimestampInSecond(),
                },
                paymentNetwork: {
                    id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
                    parameters: {
                        paymentNetworkName: currencies.get(data.currency)!.network,
                        paymentAddress: data.recipientAddress || address,
                        feeAddress: zeroAddress,
                        feeAmount: "0",
                    },
                },
                contentData: {
                    reason: data.reason,
                    dueDate: data.dueDate,
                    builderId: "request-network",
                    createdWith: "CodeSandbox",
                },
                signer: {
                    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
                    value: address as string,
                },
            };

            if (data.payerAddress) {
                requestCreateParameters.requestInfo.payer = {
                    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
                    value: data.payerAddress,
                };
            }

            setStatus(APP_STATUS.PERSISTING_TO_IPFS);
            const request = await requestClient.createRequest(requestCreateParameters);
            setStatus(APP_STATUS.PERSISTING_ON_CHAIN);
            setRequestData(request.getData());
            const confirmedRequestData = await request.waitForConfirmation();

            setStatus(APP_STATUS.REQUEST_CONFIRMED);
            setRequestData(confirmedRequestData);
            setSuccess(true);
        } catch (error) {
            console.error('Error creating request:', error);
            setError('Failed to create request');
            setStatus(APP_STATUS.ERROR_OCCURRED);
            console.log("Error:", error)
            alert(error);
        } finally {
            setLoading(false);
        }
    };

    return { createRequest, requestData, status, setStatus, loading, error, success };
};