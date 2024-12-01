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

export default function Home() {
  const [requestData, setRequestData] = useState(null);

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

  return (
    <main className="relative flex flex-col w-full items-center overflow-x-hidden min-h-[100vh] overflow-x-hidden">
      <Header />
      {/* <CreateRequestForm /> */}
      <RequestTabs />
      {/* <SampleCode /> */}
    </main>
  );
}
