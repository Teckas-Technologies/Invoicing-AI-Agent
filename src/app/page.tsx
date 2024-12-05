"use client"

import { Hero } from "@/components/Body/Hero";
import CreateRequestForm from "@/components/CreateRequestForm";
import { Header } from "@/components/Header/Header";
import SampleCode from "@/components/SampleCode";
import { useEffect, useState } from "react";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { useAccount } from "wagmi";
import { useFetchRequests } from "@/hooks/useFetchrequest";
import RequestTabs from "@/components/RequestTabs/RequestTabs";
import ChatBot from "@/components/ChatBot";
import Script from "next/script";
import ChatAccessDenied from "@/components/Access";

export default function Home() {
  const [requestData, setRequestData] = useState(null);
  const[show,setShow] = useState(true);
  const [agent,setAgent] = useState("6751bbe4b078ade1be331d7b");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [walletClient,setWalletClient]= useState("");
  const handleCreateRequest = async (data: any) => {
    const response = await fetch('/api/createRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    setRequestData(result);
  };

  const { address, isConnecting, isDisconnected } = useAccount();
  const { fetchRequests } = useFetchRequests();


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parse query parameters
        const params = new URLSearchParams(window.location.search);
        const agentId = params.get("agentId");
        if (agentId) {
          // alert(`agent${agentId}`)
          setShow(true);
          setAgent(agentId);
        }else{
          setShow(false);
        }
      } catch (err:any) {
        console.log(err.message);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="relative flex flex-col w-full items-center overflow-x-hidden min-h-[100vh] overflow-x-hidden">
      {/* <Header /> */}
      {/* <ChatBot agentId={agent} accountId={address}/> */}
      {/* <Script id="chatbot" data-agent-id="67500d5fd8f7b664f8bc39e8" data-account-id={"0xFf43E33C40276FEEff426C5448cF3AD9df6b5741"} src="https://chatbot-teckas.netlify.app/ChatBot.js"></Script> */}
      {/* <CreateRequestForm /> */}
      {/* <RequestTabs /> */}
      {show?( 
       <ChatBot agentId={agent}/>
      ):(
        <ChatAccessDenied/>
      )}  
      {/* <SampleCode /> */}
    </main>
  );
}
