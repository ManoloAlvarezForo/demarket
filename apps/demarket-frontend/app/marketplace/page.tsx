"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

interface Item {
  id: number;
  name: string;
  price: string;
  quantity: number;
}

export default function MarketplacePage() {
  const { address, isConnected } = useAccount();
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const queryClient = useQueryClient();

  const {
    data: items,
    isLoading,
    error,
  } = useQuery<Item[]>({
    queryKey: ["items", address],
    queryFn: async () => {
      const response = await fetch("http://localhost:3000/items");
      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }
      return response.json();
    },
    enabled: isConnected,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (data: { itemId: number; quantity: number }) => {
      const response = await fetch(
        "http://localhost:3000/transactions/purchase",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Purchase failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["items", address] });
      alert(`Purchase successful: ${data.message}`);
    },
    onError: (error) => {
      console.error("Error purchasing item:", error);
      alert("Purchase failed. Please try again.");
    },
  });

  const handlePurchase = (itemId: number) => {
    if (!address) {
      alert("Please connect your wallet first.");
      return;
    }

    const quantity = quantities[itemId] || 1;
    if (quantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    purchaseMutation.mutate({ itemId, quantity });
  };

  const handleQuantityChange = (itemId: number, value: string) => {
    const quantity = parseInt(value, 10);
    setQuantities((prev) => ({ ...prev, [itemId]: quantity }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div
        id="marketplace"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        {!isConnected ? (
          <p className="text-gray-300 text-center">
            Please connect your wallet to view the listed tokens.
          </p>
        ) : isLoading ? (
          <p className="text-gray-300 text-center">Loading items...</p>
        ) : error ? (
          <p className="text-red-500 text-center">Error: {error.message}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Listed Tokens
            </h2>
            {items?.length === 0 ? (
              <p className="text-gray-300 text-center">No items listed</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items?.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-800 p-6 rounded-lg shadow-lg"
                  >
                    <h3 className="text-xl font-semibold mb-2">
                      {item.name}
                    </h3>
                    <p className="text-gray-300 mb-4">
                      <span className="font-mono">{item.price} ETH</span>
                    </p>
                    <p className="text-gray-300 mb-4">
                      Available:{" "}
                      <span className="font-mono">{item.quantity} units</span>
                    </p>
                    <input
                      type="number"
                      min="1"
                      max={item.quantity}
                      placeholder="Quantity"
                      className="w-full p-2 mb-4 bg-gray-700 text-white rounded-lg"
                      onChange={(e) =>
                        handleQuantityChange(item.id, e.target.value)
                      }
                    />
                    <button
                      onClick={() => handlePurchase(item.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 w-full"
                    >
                      Buy Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
