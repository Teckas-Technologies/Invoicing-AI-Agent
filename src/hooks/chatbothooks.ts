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
  const [isPaymentRequired, setIsPaymentRequired] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]); // Store messages
  const [isloading, setIsLoading] = useState<boolean>(false);
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
  const sendRequest = async (query: string, isWalletConnected: string, agentId: string,address:any) => {
    if (!sessionId) return;
    setIsLoading(true);

    const payload = {
      id: sessionId, // Using the session ID here
      prompt: JSON.stringify({ query, isWalletConnected }),
      agentId: agentId,
    };
    console.log(payload)

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
      console.log(response);
      const res = await response.json();
      console.log(res)
      console.log(res);
      const data = res.data;
      console.log(data);
      // console.log(data.meta_data.isFetchPaymentRequest);

     if(data.meta_data.isFetchPaymentRequest){
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: data.text },
      ]);
      if (address) {
        const res = await fetchRequests(address);
        console.log("RES:", res);
        if (res) {
          if (Array.isArray(res)) {
            setIsPaymentRequired(true);
            const formattedResponses = res.map((item: any, index: number) => {
              const reason = item.contentData?.reason || "N/A";
              const dueDate = item.contentData?.dueDate || "N/A";
              const builderId = item.contentData?.builderId || "N/A";
              const state = item.state || "N/A";
              const currency = item.currency || "N/A";
              const status = item.balance?.balance === item.expectedAmount ? "Paid" : "Unpaid";
              const requestId = item.requestId || "N/A";
            
              return `
                Request ${index + 1}\n,
                Reason: ${reason}\n
                Due Date: ${dueDate}\n
                Builder ID: ${builderId}\n
                State: ${state}\n
                Currency: ${currency}\n
                Status: ${status}\n
                RequestId: ${requestId}\n
              `;
            });
            
        
            // Add each formatted response to the chatbot messages
            formattedResponses.forEach((responseText: any) => {
              setMessages((prevMessages) => [
                ...prevMessages,
                { sender: "bot", text: responseText },
              ]);
            });
          }else{
            setMessages((prevMessages) => [
              ...prevMessages,
              { sender: "bot", text: "Unable to fetch your invoice" },
            ]);
          }
        }        
}

      }
      else if(data.intent=="finalJson"){
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
                        data.meta_data.amount                          ,
                        7,
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
              const requestId = confirmedRequestData.requestId
              setMessages((prevMessages) => [
                ...prevMessages,
                { sender: "bot", text: data.text },
              ]);
              setMessages((prevMessages) => [
                ...prevMessages,
                { sender: "bot", text: `https://scan.request.network/request/${requestId}` },
              ]);              
          } catch (error:any) {
              console.error('Error creating request:', error);
              setError('Failed to create request');
              setMessages((prevMessages) => [
                ...prevMessages,
                { sender: "bot", text: "Unable to create your invoice" },
              ]);
              setStatus(APP_STATUS.ERROR_OCCURRED);
              console.log("Error:", error)
              // alert(error.message);
          } finally {
              setLoading(false);
          }
      }else{
      // Extract the text from the response and store it in the messages state
      const botMessage = data.text || "No response from bot";
      
      // Add the bot's response to the state
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: botMessage },
      ]);
    }
    } catch (error:any) {
      console.error("Error during request:", error.message);
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
    isPaymentRequired,
    sendRequest,
  };
};

export default useVoiceBackend;
