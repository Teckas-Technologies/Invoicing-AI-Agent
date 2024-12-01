import { storageChains } from "@/config/storage-chain";
import { useEthersV5Provider } from "@/hooks/use-ethers-v5-provider";
import { useEthersV5Signer } from "@/hooks/use-ethers-v5-signer";
import { APP_STATUS } from "@/hooks/useCreateRequests";
import { useFetchRequests } from "@/hooks/useFetchrequest";
import { usePayRequest } from "@/hooks/usePayRequest";
import { approveErc20, hasErc20Approval, hasSufficientFunds } from "@requestnetwork/payment-processor";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { getPaymentNetworkExtension } from "@requestnetwork/payment-detection";
import { useApprove } from "@/hooks/useApprove";
// import { useNetwork, useSwitchNetwork } from "wagmi";

const ListRequests = () => {
    const { fetchRequests, requests } = useFetchRequests();
    const { payTheRequest } = usePayRequest();
    const { data: walletClient, isError, isLoading } = useWalletClient();
    const { address, isConnecting, isDisconnected } = useAccount();
    const provider = useEthersV5Provider();
    const signer = useEthersV5Signer();
    const { approveRequest } = useApprove();
    // const { chain } = useNetwork();
    // const { chains, error, isLoading: isSwitchNetworkLoading, switchNetwork } = useSwitchNetwork();

    useEffect(() => {
        const getRequests = async () => {
            if (address) {
                const res = await fetchRequests(address);
                console.log("RES:", res);
            }
        }
        getRequests();

    }, [address])

    const truncateAddress = (address: string) => {
        if (!address) return "";
        if (address.length <= 8) return address; // If too short, no truncation needed
        return `${address.slice(0, 8)}...${address.slice(-3)}`;
    };

    function canPay() {
        return (
            //   status === APP_STATUS.APPROVED &&
            !isDisconnected &&
            !isConnecting &&
            !isError &&
            !isLoading
            //   &&
            //   !isSwitchNetworkLoading &&
            //   requestData?.currencyInfo.network === chain?.network
        );
    }

    const handlePay = async (requestId: string) => {
        if (!canPay()) {
            return;
        }
        // setStatus(APP_STATUS.PAYING);
        payTheRequest({ requestId });
    }

    function canApprove() {
        return (
            // status === APP_STATUS.REQUEST_CONFIRMED &&
            !isDisconnected &&
            !isConnecting &&
            !isError &&
            !isLoading
            // &&
            // !isSwitchNetworkLoading &&
            // requestData?.currencyInfo.network === chain?.network
        );
    }

    const handleApprove = (requestId: string) => {
        if (!canApprove()) {
            return;
        }
        // setStatus(APP_STATUS.APPROVING);
        approveRequest({ requestId });
    }

    return (
        <div className="mt-10">
            {!requests || requests.length === 0 ? (
                <h2>No Requests Found!</h2>
            ) : (
                <div className="requests">
                    <table>
                        <thead>
                            <tr>
                                <th className="px-3 py-2">S/No</th>
                                <th className="px-3 py-2">Payer</th>
                                <th className="px-3 py-2">Payee</th>
                                <th className="px-3 py-2">Amount</th>
                                <th className="px-3 py-2">Currency</th>
                                <th className="px-3 py-2">Due Date</th>
                                <th className="px-3 py-2">Reason</th>
                                <th className="px-3 py-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request, index) => (
                                <tr key={index}>
                                    <td className="px-3 py-2">{index + 1}</td>
                                    <td className="px-3 py-2">{truncateAddress(request.payer?.value as string)}</td>
                                    <td className="px-3 py-2">{truncateAddress(request.payee?.value as string)}</td>
                                    <td className="px-3 py-2">{request.expectedAmount}</td>
                                    <td className="px-3 py-2">{request.currency}</td>
                                    <td className="px-3 py-2">{new Date(request.contentData.dueDate).toLocaleDateString()}</td>
                                    <td className="px-3 py-2">{request.contentData.reason}</td>
                                    <td className="px-3 py-2">
                                        {/* <button className="px-6 py-3 bg-green-500" onClick={() => handlePay(request.requestId, request.payer?.value as string)}>Pay</button> */}
                                        <button className="px-6 py-3 bg-green-500" onClick={() => handleApprove(request.requestId as string)}>Pay</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default ListRequests;