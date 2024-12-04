import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useFetchRequests } from "./useFetchrequest";
import { parseUnits, zeroAddress } from "viem";
import { useWalletClient } from "wagmi";
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


const useVoiceBackend = () => {
  // State to hold the session ID, messages, and API response
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]); // Store messages
  const [isloading, setIsLoading] = useState<boolean>(false);
  const { address, isConnecting,isConnected, isDisconnected } = useAccount();
  const { fetchRequests } = useFetchRequests();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const { data: walletClient, isError, isLoading } = useWalletClient();
  const [status, setStatus] = useState(APP_STATUS.AWAITING_INPUT);
  const [requestData, setRequestData] = useState<Types.IRequestDataWithEvents>();
  const { provider } = useProvider();
  // Function to generate a unique session ID
  const generateSessionId = () => {
    return `session-${Math.random().toString(36).substring(2, 15)}`;
  };

  // Hook to initialize session ID when the chat is opened
  useEffect(() => {
    const session = generateSessionId(); // Generate a new session ID
    setSessionId(session);
  }, []);

  // Function to make the API call
  const sendRequest = async (query: string, isWalletConnected: string, agentId: string) => {
    if (!sessionId) return;

    setIsLoading(true);

    const payload = {
      id: sessionId, // Using the session ID here
      prompt: JSON.stringify({ query, isWalletConnected }),
      agentId: agentId,
    };

    // Add the user's message to the state before sending the request
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "user", text: query },
    ]);

    try {
      const response = await fetch(
        "https://rnp-master-agent-d2b5etd8cwgzcaer.canadacentral-01.azurewebsites.net/voice-backend", 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const res = await response.json();
      const data = res.data;
      console.log(data);
      console.log(data.meta_data.isFetchPaymentRequest);

     if(data.meta_data.isFetchPaymentRequest){
      if (!address) {
        const res = await fetchRequests("0xFf43E33C40276FEEff426C5448cF3AD9df6b5741");
        console.log("RES:", res);
        if (res) {
          if (Array.isArray(res)) {
            const formattedResponses = res.map((item: any, index: number) => {
              return `Request ${index + 1}:\n` +
                     `Reason: ${item.contentData?.reason || "N/A"}\n` +
                     `Due Date: ${item.contentData?.dueDate || "N/A"}\n` +
                     `Builder ID: ${item.contentData?.builderId || "N/A"}\n` +
                     `State: ${item.state || "N/A"}\n` +
                     `Currency: ${item.currency || "N/A"}`;
            });
        
            // Add each formatted response to the chatbot messages
            formattedResponses.forEach((responseText: any) => {
              setMessages((prevMessages) => [
                ...prevMessages,
                { sender: "bot", text: responseText },
              ]);
            });
          }
        }        
}

      }
      if(data.intent=="finalJson"){
        const extraData = data.meta_data?.extra || {};
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
                      baseURL: "https://sepolia.gateway.request.network/",
                  },
                  signatureProvider,
              });
  
              const requestCreateParameters: Types.ICreateRequestParameters = {
                  requestInfo: {
                      currency: {
                          type: Types.RequestLogic.CURRENCY.ERC20,
                          value: "0x0EC435037161ACd3bB94eb8DF5BC269f17A4E1b9",
                          network: "sepolia",
                      },
                      expectedAmount: parseUnits(
                          data.amount,
                          Number(6),
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
                          paymentNetworkName: "sepolia",
                          paymentAddress: data.recipientAddress || address,
                          feeAddress: zeroAddress,
                          feeAmount: "0",
                      },
                  },
                  contentData: {
                      reason: data.reason,
                      ...extraData
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
          } catch (error:any) {
              console.error('Error creating request:', error);
              setError('Failed to create request');
              setStatus(APP_STATUS.ERROR_OCCURRED);
              console.log("Error:", error)
              alert(error.message);
          } finally {
              setLoading(false);
          }
      }
    //   if(data.data. )
      // Extract the text from the response and store it in the messages state
      const botMessage = data.text || "No response from bot";
      
      // Add the bot's response to the state
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: botMessage },
      ]);
    } catch (error) {
      console.error("Error during request:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: "Something went wrong!" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sessionId,
    messages,
    isloading,
    sendRequest,
  };
};

export default useVoiceBackend;
