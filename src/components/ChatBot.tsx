import useVoiceBackend from "@/hooks/chatbothooks";
import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";

export default function ChatBot({ agentId ,accountId}: { agentId: any,accountId:any }) {
  const { sessionId, messages, isloading, sendRequest } = useVoiceBackend();
  const [query, setQuery] = useState("");
  const [wallet,setWallet] = useState("false");
  // Ref for the chat area with proper typing

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const handleSendMessage = () => {
    if (query.trim() !== "") {
      if(accountId){
        alert(accountId);
        setWallet("true");
        alert(wallet);

      }
      sendRequest(query,wallet, agentId,accountId);
      setQuery("");
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
      {/* Header */}
      <header className="flex-shrink-0 w-full rounded-tl-xl rounded-tr-xl flex justify-between items-center bg-gradient-to-r from-[#0BB489] to-[#0AA178] text-white py-4 px-6 shadow-md">
        <h1 className="text-xl font-bold">Chatbot</h1>
      </header>

      {/* Chat Area */}
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4"
      >
        <div className="w-full space-y-4">
          {/* Displaying chat messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-lg max-w-[330px] break-words shadow-md ${
                  message.sender === "user"
                    ? "bg-[#0BB489] text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          
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
          className={`p-3 w-[100px] text-center rounded-lg shadow-md text-white bg-gradient-to-r from-[#0BB489] to-[#0AA178] hover:opacity-90 transition-all ${
            isloading ? "cursor-not-allowed" : ""
          }`}
          disabled={isloading}
        >
          Send
        </button>
      </footer>
    </div>
  );
}
