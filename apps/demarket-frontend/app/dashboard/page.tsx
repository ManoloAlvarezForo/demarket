"use client";

import { useState } from "react";
import { ListItemForm } from "../components/ListItemForm";
import { WithdrawSection } from "../components/WithdrawSection";

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState<"list" | "withdraw">("list");

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-900 text-white p-4 pt-24">
      <h1 className="text-3xl font-bold mb-8 text-center">Seller Dashboard</h1>
      <div className="w-full max-w-4xl">
        <div className="flex border-b border-gray-700">
          <button
            className={`flex-1 py-2 text-center ${
              activeTab === "list"
                ? "border-b-2 border-blue-500 font-bold"
                : "text-gray-400"
            }`}
            onClick={() => setActiveTab("list")}
          >
            List Items
          </button>
          <button
            className={`flex-1 py-2 text-center ${
              activeTab === "withdraw"
                ? "border-b-2 border-blue-500 font-bold"
                : "text-gray-400"
            }`}
            onClick={() => setActiveTab("withdraw")}
          >
            Withdraw Funds
          </button>
        </div>
        {/* Contenido de la pestaña */}
        <div className="mt-8">
          {activeTab === "list" && <ListItemForm />}
          {activeTab === "withdraw" && <WithdrawSection />}
        </div>
      </div>
    </div>
  );
}
