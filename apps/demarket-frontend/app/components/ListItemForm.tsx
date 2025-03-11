"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { SUPPORTED_TOKENS } from "../config/tokens";

export const ListItemForm = () => {
  const { isConnected } = useAccount(); // Obtener la dirección del usuario
  const [tokenAddress, setTokenAddress] = useState(SUPPORTED_TOKENS[0].address); // Default al primer token
  const [price, setPrice] = useState(""); // Precio por unidad
  const [quantity, setQuantity] = useState(""); // Cantidad disponible
  const [isLoading, setIsLoading] = useState(false); // Estado de carga
  const [error, setError] = useState(""); // Mensaje de error

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!tokenAddress || !price || !quantity) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const bodyBefore = {
        tokenAddress,
        price: price.toString(),
        quantity: quantity.toString(),
      };
      const body = JSON.stringify(bodyBefore);
      const response = await fetch("http://localhost:3000/items/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to list item");
      }

      const result = await response.json();
      alert(
        `Item listed successfully! Transaction hash: ${result.transactionHash}`
      );
    } catch (error) {
      const err = error as Error;
      console.error("Error listing item:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-900 text-white pt-15">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-center">List an Item</h2>
        {!isConnected ? (
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              Please connect your wallet using the button in the navbar to list an item.
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
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {isLoading ? "Listing..." : "List Item"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
