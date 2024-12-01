"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import "./Hero.css"
import { useState } from "react";
import Toast from "../Toast";

export const Hero: React.FC = () => {

    const { isConnected } = useAppKitAccount();
    const { address } = useAccount();
    const { open } = useAppKit();
    const { disconnect } = useDisconnect();
    const [toastMessage, setToastMessage] = useState("");
    const [success, setSuccess] = useState(false);

    const handleConnectWallet = () => {
        open({ view: 'Connect' });
    }

    const handleDisconnect = () => {
        disconnect();
        // open({ view: 'Account' });
    }

    return (
        <div className="hero w-full h-auto flex items-center justify-center pt-[7rem] pb-5 px-3">
            <div className="center-box flex flex-col justify-center items-center md:mt-[7rem] mt-[5rem]">
                <h2 className="claim-text md:text-[47px] text-[47px] text-center leading-[4rem] px-3">Claim your AirDrop NOW!</h2>
                <h3 className="text-2xl text-center font-bold py-6 my-2 px-3">Find out if you are eligible to participate.</h3>
                <p className="text-xl text-center font-medium pb-5 px-3 md:px-[5rem] lg:px-[10rem] xl:px-[15rem] 2xl:px-[25rem]">Connect your metamask wallet to see if you are eligible to claim tokens. Available tokens are only available to eligible participants at this stage.</p>
                {!isConnected && !address ? <div className="connect-wallet-btn mt-6 rounded-sm cursor-pointer" onClick={handleConnectWallet}>
                    <h2 className="text-black text-lg font-bold px-20 py-4">Connect Wallet</h2>
                </div> : <div className="">
                    <h4 className="md:text-md text-sm font-semibold text-center leading-[1.5rem]">Connected Address: <span className="address rounded-lg" onClick={handleDisconnect}>{address}</span></h4>
                </div>
                }
            </div>

            {toastMessage && <Toast success={success} message={toastMessage} onClose={() => setToastMessage("")} />}
        </div>
    )
}