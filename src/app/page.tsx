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
  const [agent,setAgent] = useState("");


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
    const getRequests = async () => {
      if (address) {
        const res = await fetchRequests(address);
        console.log("RES:", res);
      }
    }
    getRequests();

  }, [address])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parse query parameters
        const params = new URLSearchParams(window.location.search);
        const agentId = params.get("agentId");
        if (agentId) {
          // alert(`agent${agentId}`)
          setShow(false);
          setAgent(agentId);
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
      {/* <Script id="chatbot" data-agent-id="12345" src="https://chatbot-teckas.netlify.app/ChatBot.js"></Script> */}
      {/* <CreateRequestForm /> */}
      {/* <RequestTabs /> */}
      {!show?(
        <ChatAccessDenied/>
      ):(
        <ChatBot agentId={agent}/>
      )}
      {/* <SampleCode /> */}
    </main>
  );
}
