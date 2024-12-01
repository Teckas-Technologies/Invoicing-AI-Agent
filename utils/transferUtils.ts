'use server';

import { Account, KeyPair, InMemorySigner } from "near-api-js";
import { InMemoryKeyStore } from "near-api-js/lib/key_stores";
import { JsonRpcProvider } from "near-api-js/lib/providers";
export const transferNear = async (receiverId: string, amount: string): Promise<any> => {
    try {
        const account = await connectAccount();
        const yoctoNearAmount = BigInt(parseFloat(amount) * 10 ** 24);
        const transactionResult = await account.sendMoney(receiverId, yoctoNearAmount);
        return transactionResult;
    } catch (error:any) {
        console.error("Error transferring NEAR:", error.message);
        throw new Error("Failed to transfer NEAR");
    }
};

const USDT_CONTRACT = "usdt.fakes.testnet"; 
export const transferUSDT = async (receiverId: string,amount: string): Promise<any> => {
    try {
        const account = await connectAccount();
        const yoctoAmount = BigInt(parseFloat(amount) * 10 ** 6);
        const isRegistered = await checkAccountRegistration(receiverId, USDT_CONTRACT);
        if (!isRegistered) {
            await account.functionCall({
                contractId: USDT_CONTRACT,
                methodName: "storage_deposit",
                args: { account_id: receiverId },
                gas: "30000000000000",
                attachedDeposit: BigInt(1250000000000000000000), // 0.00125 NEAR
            });
        }
        const transactionResult = await account.functionCall({
            contractId: USDT_CONTRACT,
            methodName: "ft_transfer",
            args: {
                receiver_id: receiverId,
                amount: yoctoAmount.toString(),
            },
            gas: "30000000000000",
            attachedDeposit: BigInt(1),
        });

        return transactionResult;
    } catch (error: any) {
        console.error("Error transferring USDC:", error.message);
        throw new Error("Failed to transfer USDC");
    }
};

export const connectAccount = async (): Promise<Account> => {
    if (!process.env.SERVER_WALLET_ID || !process.env.SERVER_WALLET_PK || !process.env.NEXT_PUBLIC_NETWORK) {
        throw new Error("Environment variables SERVER_WALLET_ID, SERVER_WALLET_PK, or NEXT_PUBLIC_NETWORK are missing");
    }

    const keyStore = new InMemoryKeyStore();
    await keyStore.setKey(
        process.env.NEXT_PUBLIC_NETWORK as string,
        process.env.SERVER_WALLET_ID,
        KeyPair.fromString(process.env.SERVER_WALLET_PK)
    );

    const provider = new JsonRpcProvider({
        url: `https://rpc.${process.env.NEXT_PUBLIC_NETWORK}.near.org`,
    });

    const signer = new InMemorySigner(keyStore);

    const connection = {
        networkId: process.env.NEXT_PUBLIC_NETWORK as string,
        provider,
        signer,
        jsvmAccountId: "",
    };

    const account = new Account(connection, process.env.SERVER_WALLET_ID);
    return account;
};

const checkAccountRegistration = async (accountId: string, contractId: string): Promise<boolean> => {
    try {
        const account = await connectAccount();

        const result = await account.viewFunction({
            contractId,
            methodName: "storage_balance_of",
            args: { account_id: accountId },
            blockQuery: { finality: "final" }, // Query the most recent block
        });

        return !!result; // Returns true if the account is registered, false otherwise
    } catch (error:any) {
        console.error("Error checking account registration:", error.message);
        throw error;
    }
};