"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { constant } from "@/utils/constants";

// Correctly extend the Window interface
declare global {
    interface Window {
        ethereum?: Record<string, unknown> | undefined; // ethers.providers.ExternalProvider
    }
}

// Create the context
const ProviderContext = createContext<{
    provider: ethers.providers.Web3Provider | null;
} | undefined>(undefined);

// ProviderProvider component
export const EthProvider = ({ children }: { children: ReactNode }) => {
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const { isConnected, address } = useAccount();

    useEffect(() => {
        const initializeProvider = async () => {
            if (isConnected && address) {
                if (window.ethereum && typeof window !== "undefined") {
                    try {
                        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                        // const signer = web3Provider.getSigner();
                        // const address = await signer.getAddress(); // This should give the wallet address connected to WalletConnect
                        // console.log("Connected Address:", address);
                        setProvider(web3Provider);
                    } catch (error) {
                        console.log("Error initializing provider with MetaMask", error);
                    }
                } else {
                    // Fallback to WalletConnect when MetaMask is not detected
                    try {
                        const walletConnectProvider = await EthereumProvider.init({
                            projectId: constant.projectId,
                            chains: [constant.chainId as number], // Mainnet
                            showQrModal: true,
                        });

                        const web3Provider = new ethers.providers.Web3Provider(walletConnectProvider);
                        // const signer = web3Provider.getSigner();
                        // const address = await signer.getAddress(); // This should give the wallet address connected to WalletConnect
                        // console.log("Connected Address:", address);
                        setProvider(web3Provider);
                    } catch (error) {
                        console.log("Error initializing WalletConnect", error);
                        alert("No Ethereum provider available. Please install MetaMask.");
                    }
                }
            }
        };

        initializeProvider();
    }, [isConnected, address]);

    return (
        <ProviderContext.Provider value={{ provider }}>
            {children}
        </ProviderContext.Provider>
    );
};

// Custom hook to use the provider
export const useProvider = () => {
    const context = useContext(ProviderContext);
    if (context === undefined) {
        throw new Error("useProvider must be used within a ProviderProvider");
    }
    return context;
};
