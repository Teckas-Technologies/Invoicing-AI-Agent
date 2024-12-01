"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import './Header.css'

const navs = [
    { id: "discover", label: "Discover", path: "#discover" },
    { id: "build", label: "Build", path: "#build" },
    { id: "join", label: "Join", path: "#join" },
    { id: "contactus", label: "Contact Us", path: "#contact-us" },
];

export const Header: React.FC = () => {
    const { isConnected } = useAppKitAccount();
    const { address } = useAccount();
    const { open } = useAppKit();
    const { disconnect } = useDisconnect();

    const handleConnectWallet = () => {
        open({ view: 'Connect' });
    }

    const handleDisconnect = () => {
        // disconnect();
        open({ view: 'Account' });
    }


    return (
        <div className="w-full h-auto">
            <div className="header fixed z-50 top-0 w-full h-[7rem] flex md:gap-0 gap-2 md:justify-start justify-center items-center xl:px-[12rem] lg:px-[10rem] md:px-[8rem] px-3 py-2">
                <div className="logo rounded-full hidden md:block w-[5rem] h-[5rem]">
                    <img src="/images/teckas-logo.jpg" alt="myid" className="w-full h-full object-cover rounded-full" />
                </div>
                {/* Mobile logo */}
                <div className="w-[5rem] h-auto flex justify-center items-center">
                    <div className="logo md:hidden rounded-full w-[4rem] h-[4rem]">
                        <img src="/images/teckas-logo.jpg" alt="myid" className="w-full h-full object-cover rounded-full" />
                    </div>
                </div>
                {/* <div className="nav-links">
                    <h2 className="md:text-5xl text-3xl font-bold text-cente">AirDrop Claim Tool</h2>
                </div> */}
                <div className="right-header md:flex hidden flex justify-center items-center md:gap-[5rem] gap-[3rem]">
                    {!isConnected && !address ? <div className="connect-wallet-btn mt-6 rounded-sm cursor-pointer" onClick={handleConnectWallet}>
                        <h2 className="text-black text-lg font-bold px-20 py-4">Connect Wallet</h2>
                    </div> : <div className="">
                        <h4 className="md:text-md text-sm font-semibold text-center leading-[1.5rem]">Connected Address: <span className="address rounded-lg" onClick={handleDisconnect}>{address}</span></h4>
                    </div>
                    }
                </div>
            </div>
        </div>
    )
}