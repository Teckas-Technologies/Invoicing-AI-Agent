import { useState } from "react";
import CreateRequestForm from "../CreateRequestForm";
import ListRequests from "../ListRequests";

const RequestTabs = () => {
    const [activeTab, setActiveTab] = useState("create");
    return (
        <div className="mt-20">
            <div className="tabs mt-20 flex items-center">
                <div className="tab px-6 py-3 bg-orange-500" onClick={() => setActiveTab("create")}>
                    <h2>Create Request</h2>
                </div>
                <div className="tab px-6 py-3 bg-green-500" onClick={() => setActiveTab("list")}>
                    <h2>List Request</h2>
                </div>
                {/* <div className="tab px-6 py-3 bg-sky-500" onClick={() => setActiveTab("pay")}>
                    <h2>Pay Request</h2>
                </div> */}
            </div>

            {activeTab === "create" && <CreateRequestForm />}
            {activeTab === "list" && <ListRequests />}
        </div>
    )
}

export default RequestTabs;