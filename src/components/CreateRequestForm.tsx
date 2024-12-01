import { useState } from 'react';
import { storageChains } from "@/config/storage-chain";
import { currencies } from "@/config/currencies";
import { useAccount, useWalletClient } from 'wagmi';
import { APP_STATUS, useCreateRequest } from '@/hooks/useCreateRequests';


const CreateRequestForm = () => {

    const [payerIdentity, setPayerIdentity] = useState("");
    const [paymentRecipient, setPaymentRecipient] = useState("");
    const [expectedAmount, setExpectedAmount] = useState("");
    const [reason, setReason] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [storageChain, setStorageChain] = useState(storageChains.keys().next().value);
    const [currency, setCurrency] = useState(currencies.keys().next().value);

    const { data: walletClient, isError, isLoading } = useWalletClient();
    const { address, isConnecting, isDisconnected } = useAccount();
    const { createRequest, status, setStatus } = useCreateRequest();

    function canSubmit() {
        return (
            status !== APP_STATUS.SUBMITTING &&
            !isDisconnected &&
            !isConnecting &&
            !isError &&
            !isLoading &&
            storageChain &&
            storageChain.length > 0 &&
            // Payment Recipient is empty || isAddress
            (paymentRecipient.length === 0 ||
                (paymentRecipient.startsWith("0x") &&
                    paymentRecipient.length === 42)) &&
            // Payer is empty || isAddress
            (payerIdentity.length === 0 ||
                (payerIdentity.startsWith("0x") && payerIdentity.length === 42)) &&
            expectedAmount.length > 0 &&
            currency &&
            currency.length > 0
        );
    }

    const handleCreate = async () => {
        console.log("Creating...")
        if (!canSubmit()) {
            console.log("Not Can Submit")
            return;
        }

        setStatus(APP_STATUS.SUBMITTING);
        if (!currency || !storageChain) {
            return;
        }
        createRequest({ recipientAddress: paymentRecipient, currency: currency, payerAddress: payerIdentity, amount: expectedAmount, storageChain: storageChain, dueDate: dueDate, reason: reason })
    }

    return (
        <div className="create-request-form w-auto h-auto flex flex-col gap-3 p-5 mt-10 bg-red-500">
            <div className="form-items flex gap-[2rem]">
                <label className='flex flex-col'>
                    Storage Chain:
                    <select
                        name="storage-chain"
                        onChange={(e) => setStorageChain(e.target.value)}
                        defaultValue={storageChain}
                        className="h-9 w-[14rem]"
                    >
                        {Array.from(storageChains.entries()).map(([key, value]) => (
                            <option key={key} value={key}>
                                {value.name} ({value.type})
                            </option>
                        ))}
                    </select>
                </label>
                <label className='flex flex-col'>
                    Currency:
                    <div>
                        <select
                            name="currency"
                            onChange={(e) => setCurrency(e.target.value)}
                            defaultValue={currency}
                            className="h-9 w-[14rem]"
                        >
                            {Array.from(currencies.entries()).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value.symbol} ({value.network})
                                </option>
                            ))}
                        </select>
                    </div>
                </label>
            </div>
            <div className="form-items flex gap-[2rem]">
                <label className='flex flex-col'>
                    <h3>Payer Address:</h3>
                    <input type="text" className='h-9 w-[14rem]' value={payerIdentity} onChange={(e) => setPayerIdentity(e.target.value)} required />
                </label>
                <label className='flex flex-col'>
                    <h3> Recipient Address:</h3>
                    <input type="text" className='h-9 w-[14rem]' value={paymentRecipient} onChange={(e) => setPaymentRecipient(e.target.value)} required />
                </label>
            </div>
            <div className="form-items flex gap-[2rem]">
                <label className='flex flex-col'>
                    <h3>Amount:</h3>
                    <input type="text" className='h-9 w-[14rem]' value={expectedAmount} onChange={(e) => setExpectedAmount(e.target.value)} required />
                </label>
                <label className='flex flex-col'>
                    <h3>Due Date:</h3>
                    <input
                        type="date"
                        name="due-date"
                        onChange={(e) => setDueDate(e.target.value)}
                        className="h-9 w-[14rem]"
                    />
                </label>
            </div>
            <div className="form-items flex">
                <label className='flex flex-col'>
                    <h3>Reason:</h3>
                    <input type="text" className='h-9 w-[30rem]' value={reason} onChange={(e) => setReason(e.target.value)} required />
                </label>
            </div>
            <div className="btn-holder w-full flex justify-center items-center pt-5">
                <button type="submit" className='w-[15rem] text-center py-3 bg-green-500' onClick={handleCreate}>Create Request</button>
            </div>
        </div>
    );
};

export default CreateRequestForm;
