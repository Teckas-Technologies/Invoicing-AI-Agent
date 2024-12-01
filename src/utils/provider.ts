import { providers } from 'ethers';

export const getProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
        // Connect to Metamask or browser wallet
        return new providers.Web3Provider(window.ethereum);
    }
    if (process.env.WEB3_PROVIDER_URL) {
        // Use the provided RPC URL
        return new providers.JsonRpcProvider(process.env.WEB3_PROVIDER_URL);
    }
    throw new Error('No provider available.');
};
