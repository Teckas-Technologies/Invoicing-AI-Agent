import { useAccount } from "wagmi";

export default function ChatAccessDenied() {
  const { address, isConnecting, isConnected, isDisconnected } = useAccount();

  return (
    <div className="flex flex-col rounded-tl-xl min-w-[370px] rounded-tr-xl rounded-bl-xl rounded-br-xl h-[90vh] bg-[#f5f5f5] mt-10 mb-10 text-gray-800">
      {/* Header */}
      <header className="flex-shrink-0 w-full rounded-tl-xl rounded-tr-xl flex justify-between items-center bg-gradient-to-r from-[#0BB489] to-[#0AA178] text-white py-4 px-6 shadow-md">
      <h1 className="text-xl font-bold">Invoicing Agent</h1>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <div className="w-full text-center">
          <p className="text-2xl font-bold text-gray-700">
            You don't have access to chat.
          </p>
          <p className="text-gray-500 mt-2">
            Please contact support to gain access.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 w-full rounded-bl-xl rounded-br-xl flex items-center justify-center p-4 bg-white shadow-md">
        <p className="text-gray-500 text-sm">
          Access restricted. Contact support if you believe this is an error.
        </p>
      </footer>
    </div>
  );
}
