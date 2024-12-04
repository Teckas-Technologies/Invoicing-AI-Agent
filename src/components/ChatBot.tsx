import useVoiceBackend from "@/hooks/chatbothooks";
import { useState } from "react";
import { useAccount } from "wagmi";

export default function ChatBot() {
  const { sessionId, messages, isloading, sendRequest } = useVoiceBackend();
  const [query, setQuery] = useState("");
  const { address, isConnecting,isConnected, isDisconnected } = useAccount();

  const handleSendMessage = () => {
    if (query.trim() !== "") {
      sendRequest(query, "true", "884429"); 
      setQuery(""); 
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex-shrink-0 w-full flex justify-between items-center bg-blue-600 text-white py-4 px-6">
        <h1 className="text-xl font-bold">Chatbot</h1>
      </header>

      {/* Chat Area */}
      <main className="flex-1 bg-gray-100 overflow-y-auto p-4">
        <div className="w-full mb-4">
          {/* Displaying chat messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} mt-2`}
            >
              <div
                className={`${
                  message.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-black"
                } p-3 rounded-lg max-w-[80%]`}
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
          className="flex-1 text-black border rounded-lg p-3 shadow-sm"
          placeholder="Type your message..."
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 text-white p-3 rounded-lg shadow-md"
        >
          {isloading ? "Sending..." : "Send"}
        </button>
      </footer>
    </div>
  );
}
