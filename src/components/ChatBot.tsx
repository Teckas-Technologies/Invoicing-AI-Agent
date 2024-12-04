import useVoiceBackend from "@/hooks/chatbothooks";
import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";

export default function ChatBot() {
  const { sessionId, messages, isloading, sendRequest } = useVoiceBackend();
  const [query, setQuery] = useState("");
  const { address, isConnecting, isConnected, isDisconnected } = useAccount();

  // Ref for the chat area with proper typing
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (query.trim() !== "") {
      sendRequest(query, "true", "884429");
      setQuery("");
    }
  };

  // Scroll to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-[#f5f5f5] text-gray-800">
      {/* Header */}
      <header className="flex-shrink-0 w-full flex justify-between items-center bg-gradient-to-r from-[#0BB489] to-[#0AA178] text-white py-4 px-6 shadow-md">
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
        </div>
      </main>

      {/* Footer (Input Area) */}
      <footer className="flex-shrink-0 w-full flex items-center gap-4 p-4 bg-white shadow-md">
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
            isloading ? "cursor-not-allowed animate-pulse" : ""
          }`}
        >
          {isloading ? "Sending..." : "Send"}
        </button>
      </footer>
    </div>
  );
}
