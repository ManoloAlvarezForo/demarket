"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { WithdrawResponse } from "../types/withdraw";
import { useMarketplaceApi } from "../hooks/useMarketplaceApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const WithdrawSection = () => {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const { withdrawFunds } = useMarketplaceApi();

  const withdrawfunc = useMutation<WithdrawResponse>({
    mutationFn: withdrawFunds,
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ["items", address] });
        toast.success(`✅ Withdrawal successful! Tx hash: ${data.txHash}`);
      }
    },
    onError: (error) => {
      console.error("Error withdrawing funds:", error);
      toast.error("❌ Withdrawal failed. Please try again.");
    },
  });

  const handleWithdraw = () => {
    if (!isConnected) {
      toast.warn("⚠️ Please connect your wallet first.");
      return;
    }
    withdrawfunc.mutate();
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Withdraw Funds</h2>
      <p className="text-gray-300 mb-4 text-center">
        Withdraw your earned Ether from sales.
      </p>
      <button
        onClick={handleWithdraw}
        disabled={withdrawfunc.isPending}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
      >
        {withdrawfunc.isPending ? "Withdrawing..." : "Withdraw Funds"}
      </button>
    </div>
  );
};