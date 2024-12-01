// Copied from https://wagmi.sh/react/ethers-adapters
import { useMemo } from "react";
import { providers } from "ethers";
import { type HttpTransport } from "viem";
import { usePublicClient } from "wagmi";
import { PublicClient } from "viem";

export function publicClientToProvider(publicClient: PublicClient) {
  const { chain, transport } = publicClient;
  if (!chain || !chain.id) {
    throw new Error("Chain information is missing or invalid.");
  }
  const network = {
    chainId: chain?.id,
    name: chain?.name,
    ensAddress: chain?.contracts?.ensRegistry?.address,
  };
  if (transport.type === "fallback")
    return new providers.FallbackProvider(
      (transport.transports as ReturnType<HttpTransport>[]).map(
        ({ value }) => new providers.JsonRpcProvider(value?.url, network)
      )
    );

  return new providers.JsonRpcProvider(transport.url as string, network);
}

/** Hook to convert a viem Public Client to an ethers.js Provider. */
export function useEthersV5Provider({ chainId }: { chainId?: number } = {}) {
  const publicClient = usePublicClient({ chainId });
  if (!publicClient) {
    throw new Error("Public client is missing or invalid.");
  }
  return useMemo(() => publicClientToProvider(publicClient), [publicClient]);
}
