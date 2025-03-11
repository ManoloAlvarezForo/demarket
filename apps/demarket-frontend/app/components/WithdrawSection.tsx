"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export const WithdrawSection = () => {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        "http://localhost:3000/transactions/withdraw",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Withdrawal failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (!data.success) {
        alert(data.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ["items", address] });
        alert(`Withdrawal successful! Tx hash: ${data.txHash}`);
      }
    },
    onError: (error) => {
      console.error("Error withdrawing funds:", error);
      alert("Withdrawal failed. Please try again.");
    },
  });

  const handleWithdraw = () => {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }
    withdrawMutation.mutate();
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Withdraw Funds</h2>
      <p className="text-gray-300 mb-4 text-center">
        Withdraw your earned Ether from sales.
      </p>
      <button
        onClick={handleWithdraw}
        disabled={withdrawMutation.status === "pending"}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
      >
        {withdrawMutation.status === "pending"
          ? "Withdrawing..."
          : "Withdraw Funds"}
      </button>
    </div>
  );
};
