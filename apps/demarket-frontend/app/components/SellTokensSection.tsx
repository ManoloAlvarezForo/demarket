"use client";

import { useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useMarketplaceApi } from "../hooks/useMarketplaceApi";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import "react-toastify/dist/ReactToastify.css";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address recipient, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)", // Agrega esta línea
];

export const SellTokensSection = () => {
  const { address, isConnected } = useAccount();
  const { sellMutation } = useMarketplaceApi();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    token: "",
    amount: "",
    price: "",
    buyerAddress: "",
  });

  const { signTypedDataAsync } = useSignTypedData();

  // Función para aprobar tokens
  const handleApprove = async () => {
    if (!isConnected || !address) {
      toast.warn("⚠️ Please connect your wallet first.");
      return;
    }

    if (!formData.token || !ethers.isAddress(formData.token)) {
      toast.error("❌ Invalid token address");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(
        formData.token,
        ERC20_ABI,
        signer
      );

      const tx = await tokenContract.approve(
        "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        ethers.MaxUint256
      );

      await tx.wait();
      toast.success("✅ Tokens approved successfully!");
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("❌ Failed to approve tokens");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const isValidAddress = (address: string) => ethers.isAddress(address);

  const generateSignature = async () => {
    if (!isConnected || !address) {
      toast.warn("⚠️ Please connect your wallet first.");
      return null;
    }

    if (!isValidAddress(formData.token)) {
      toast.error("❌ Invalid token address");
      return null;
    }

    if (!isValidAddress(formData.buyerAddress)) {
      toast.error("❌ Invalid buyer address");
      return null;
    }

    const domain = {
      name: "DeMarket",
      version: "1",
      chainId: 31337,
      verifyingContract:
        "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" as `0x${string}`,
    };

    const types = {
      SellOrder: [
        { name: "seller", type: "address" },
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "buyer", type: "address" },
      ],
    };

    try {
      const amountWei = ethers.parseUnits(formData.amount, 18).toString();
      const priceWei = ethers.parseUnits(formData.price, 18).toString();

      const message = {
        seller: address,
        token: formData.token,
        amount: amountWei,
        price: priceWei,
        buyer: formData.buyerAddress,
      };

      return await signTypedDataAsync({
        domain,
        types,
        primaryType: "SellOrder",
        message,
      });
    } catch (error) {
      console.error("Error signing:", error);
      toast.error("❌ Error generating signature");
      return null;
    }
  };

  const handleSellTokens = async () => {
    if (!address) {
      toast.error("❌ Connect your wallet first");
      return;
    }

    try {
      const sellerSignature = await generateSignature();
      if (!sellerSignature) return;

      const amountWei = ethers.parseUnits(formData.amount, 18).toString();
      const priceWei = ethers.parseUnits(formData.price, 18).toString();

      await sellMutation.mutateAsync({
        seller: address,
        token: formData.token,
        amount: amountWei,
        price: priceWei,
        buyerAddress: formData.buyerAddress,
        sellerSignature,
      });

      queryClient.invalidateQueries({
        queryKey: ["items", address],
        exact: true,
      });

      setFormData({
        token: "",
        amount: "",
        price: "",
        buyerAddress: "",
      });

      toast.success("✅ Tokens sale initiated!");
    } catch (error) {
      const err = error as Error;
      console.error("Transaction failed:", err);
      toast.error(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Sell Tokens</h2>

      <div className="space-y-4">
        <input
          name="token"
          placeholder="Token Contract Address (0x...)"
          value={formData.token}
          onChange={handleInputChange}
          className="w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400"
        />
        <input
          name="amount"
          type="number"
          placeholder="Amount (e.g., 10)"
          value={formData.amount}
          onChange={handleInputChange}
          className="w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400"
        />
        <input
          name="price"
          type="number"
          step="0.0001"
          placeholder="Price per token (e.g., 1.0)"
          value={formData.price}
          onChange={handleInputChange}
          className="w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400"
        />
        <input
          name="buyerAddress"
          placeholder="Buyer's Wallet Address (0x...)"
          value={formData.buyerAddress}
          onChange={handleInputChange}
          className="w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400"
        />

        <button
          onClick={handleApprove}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
          disabled={!formData.token || !ethers.isAddress(formData.token)}
        >
          Approve Tokens
        </button>

        <button
          onClick={handleSellTokens}
          disabled={sellMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
        >
          {sellMutation.isPending ? "Processing..." : "Sell Tokens"}
        </button>
      </div>
    </div>
  );
};
