import useVoiceBackend from "@/hooks/chatbothooks";
import { useEthersV5Provider } from "@/hooks/use-ethers-v5-provider";
import { useEthersV5Signer } from "@/hooks/use-ethers-v5-signer";
import { useFetchRequests } from "@/hooks/useFetchrequest";
import { usePayRequest } from "@/hooks/usePayRequest";
import { getPaymentNetworkExtension } from "@requestnetwork/payment-detection";
import { approveErc20, hasErc20Approval, hasSufficientFunds } from "@requestnetwork/payment-processor";
import { Types } from "@requestnetwork/request-client.js";
import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";

export default function ChatBot({ agentId ,accountId}: { agentId: any, accountId: any }) {
  const { sessionId, messages, isloading, isPaymentRequired, sendRequest } = useVoiceBackend();
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");  // Added error state
  const [successMessage, setSuccessMessage] = useState<string>("");  // Added error state
  const provider = useEthersV5Provider();
  const signer = useEthersV5Signer();
  // const { address } = useAccount();
  const { payTheRequest } = usePayRequest();
  const { fetchSingleRequest } = useFetchRequests();
  const [ error,setError] = useState(false);
  const [ success,setSuccess] = useState(false);


  const extractStatus = (message: string): string | null => {
    const match = message.match(/Status:\s*(\w+)/);
    return match ? match[1] : null;
  };

  const extractRequestId = (message: string): string | null => {
    const match = message.match(/RequestId:\s*(\w+)/);
    return match ? match[1] : null;
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (query.trim() !== "") {
      if (accountId && accountId.trim() !== "") {
        sendRequest(query, "true", agentId, accountId);
        setQuery("");
      } else {
        sendRequest(query, "false", agentId, accountId);
        setQuery("");
      }
    }
  };

  const handleApprove = async (requestData: Types.IRequestData) => {
    try {
      const _hasSufficientFunds = await hasSufficientFunds({
        request: requestData,
        address: accountId as string,
        providerOptions: { provider },
      });

      if (!_hasSufficientFunds) {
        setError(true);
        setErrorMessage("Insufficient balance for this transaction.");
        return;
      }

      if (getPaymentNetworkExtension(requestData)?.id === Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT) {
        try {
          const _hasErc20Approval = await hasErc20Approval(requestData, accountId as string, provider);
          if (!_hasErc20Approval) {
            const approvalTx = await approveErc20(requestData, signer);
            await approvalTx.wait(2);
          }
        } catch (approvalError) {
          setError(true);
          setErrorMessage("ERC20 approval failed!");
          console.error("Error during ERC20 approval:", approvalError);
          return;
        }
      }
    } catch (error) {
      setError(true);
      setErrorMessage("Error occurred during approval process.");
      console.error("Error in handleApprove:", error);
    }
  };

  const handlePay = async (requestId: string) => {
    try {
      const requestData = await fetchSingleRequest(requestId);
      if (!requestData) {
        setError(true);
        setErrorMessage("Invalid payment request ID.");
        return;
      }
      
      try {
        await handleApprove(requestData);
      } catch (approveError) {
        setError(true);
        setErrorMessage("Payment approval failed.");
        return;
      }
      try {
        const res = await payTheRequest({ requestId });
        if (res?.success) {
          setSuccess(true);
          setSuccessMessage("Payment Successfull");
          setError(false);
          setErrorMessage(""); 
        } else {
          setError(true);
          setErrorMessage("Payment failed.");
        }
      } catch (paymentError) {
        setError(true);
        setErrorMessage("Payment failed.");
        console.error("Error in payment:", paymentError);
      }
    } catch (error) {
      setError(true);
      setErrorMessage("Something went wrong while processing payment.");
      console.error("Error in handlePay:", error);
    }
  };

  // Scroll to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isloading]);

  return (
    <div className="flex flex-col rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-xl h-screen bg-[#f5f5f5] text-gray-800">
      <header className="flex-shrink-0 w-full rounded-tl-xl rounded-tr-xl flex justify-between items-center bg-gradient-to-r from-[#0BB489] to-[#0AA178] text-white py-4 px-6 shadow-md">
        <h1 className="text-xl font-bold">Chatbot</h1>
      </header>
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
        <div className="w-full space-y-4">
        {error&&(
          <>
                <div className={`flex justify-start`}>
                  <div
                    className={`p-3 rounded-lg max-w-[330px] break-words shadow-md bg-gray-200 text-gray-800`}
                    dangerouslySetInnerHTML={{ __html: errorMessage }} >
                    
                  </div>
                </div>
                </>
              )}

               {success&&(
                <>
                <div className={`flex justify-start`}>
                  <div
                    className={`p-3 rounded-lg max-w-[330px] break-words shadow-md bg-gray-200 text-gray-800`}
                    dangerouslySetInnerHTML={{ __html: successMessage }} >
                    
                  </div>
                </div>
                </>
              )}
          {isPaymentRequired ? (
            <>
              {messages.map((message, index) => {
                const status = extractStatus(message.text);
                const requestId = extractRequestId(message.text);

                return (
                  <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`p-3 rounded-lg max-w-[330px] break-words shadow-md ${
                        message.sender === "user" ? "bg-[#0BB489] text-white" : "bg-gray-200 text-gray-800"
                      }`}
                      dangerouslySetInnerHTML={{ __html: message.text }}>
                      {status === "Unpaid" && message.sender !== "user" ? (
                        <button
                          onClick={() => handlePay(requestId as string)}
                          className="ml-2 p-2 text-sm bg-gradient-to-r from-[#0BB489] to-[#0AA178] text-white rounded-lg shadow hover:opacity-90"
                        >
                          Pay
                        </button>
                      ):(
                        <a href={`https://scan.request.network/request/${requestId}`}
                        className="ml-2 p-2 text-sm bg-gradient-to-r from-[#0BB489] to-[#0AA178] text-white rounded-lg shadow hover:opacity-90"
                      >
                        View
                      </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`p-3 rounded-lg max-w-[330px] break-words shadow-md ${
                      message.sender === "user" ? "bg-[#0BB489] text-white" : "bg-gray-200 text-gray-800"
                    }`}
                    dangerouslySetInnerHTML={{ __html: message.text }} >
                    
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Typing Indicator */}
          {isloading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-lg max-w-[330px] break-words shadow-md bg-gray-200 text-gray-800">
                <span className="flex items-center gap-1">
                  <div className="animate-pulse">•</div>
                  <div className="animate-pulse delay-100">•</div>
                  <div className="animate-pulse delay-200">•</div>
                  <span className="ml-2">Bot is typing...</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer (Input Area) */}
      <footer className="flex-shrink-0 w-full rounded-bl-xl rounded-br-xl flex items-center gap-4 p-4 bg-white shadow-md">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 text-black border border-gray-300 rounded-lg p-3 shadow-sm"
          placeholder="Type your message..."
        />
        <button
          onClick={handleSendMessage}
          className={`p-3 w-[100px] text-center rounded-lg shadow-md text-white bg-gradient-to-r from-[#0BB489] to-[#0AA178] hover:opacity-90 transition-all ${isloading ? "cursor-not-allowed" : ""}`}
          disabled={isloading}
        >
          Send
        </button>
      </footer>
    </div>
  );
}
