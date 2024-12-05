import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { useState } from "react";

export const useFetchRequests = () => {
    const [requests, setRequests] = useState<Types.IRequestDataWithEvents[]>([]);
    const [totalPage, setTotalPage] = useState<any>();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const requestClient = new RequestNetwork({
        nodeConnectionConfig: {
            baseURL: "https://sepolia.gateway.request.network/",
        },
    });

    const fetchRequests = async (address: `0x${string}`) => {
        setLoading(true);
        setError(null);
        try {
            const identityAddress = address;
            const requests = await requestClient.fromIdentity({
                type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
                value: identityAddress as string,
            });
            const requestDatas = requests.map((request) => request.getData());
            setRequests(requestDatas)
            return requestDatas;
        } catch (err) {
            setError("Error loading arts");
        } finally {
            setLoading(false);
        }
    };

    const fetchSingleRequest = async (requestId: string) => {
        setLoading(true);
        setError(null);
        try {
            const request = await requestClient.fromRequestId(
                requestId,
            );
            const requestData = request.getData();
            return requestData;
        } catch (err) {
            setError("Error loading arts");
        } finally {
            setLoading(false);
        }
    };


    return { requests, totalPage, loading, error, fetchRequests, fetchSingleRequest };
}