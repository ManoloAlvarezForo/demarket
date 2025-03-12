"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { SUPPORTED_TOKENS } from "../config/tokens";
import { useMarketplaceApi } from "../hooks/useMarketplaceApi";

export const ListItemForm = () => {
  const { isConnected } = useAccount();
  const { listItemMutation } = useMarketplaceApi();

  const [tokenAddress, setTokenAddress] = useState(SUPPORTED_TOKENS[0].address);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isConnected) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!tokenAddress || !name || !price || !quantity) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");

    listItemMutation.mutate(
      { tokenAddress, name, price, quantity },
      {
        onError: (err) => setError(err.message),
      }
    );
  };

  return (
    <div className="flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-center">List an Item</h2>
        {!isConnected ? (
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              Please connect your wallet using the button in the navbar to list
              an item.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1">Select Token</label>
              <select
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded-lg"
              >
                {SUPPORTED_TOKENS.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Item Name</label>
              <input
                type="text"
                placeholder="Item name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Price per Unit</label>
              <input
                type="text"
                placeholder="0.1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Quantity</label>
              <input
                type="text"
                placeholder="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded-lg"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={listItemMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {listItemMutation.isPending ? "Listing..." : "List Item"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
