"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import Modal from "./Modal";
import { Item } from "../types/item";
import { useMarketplaceApi } from "../hooks/useMarketplaceApi"; // Importamos el hook
import { toast } from "react-toastify";

interface MarketplaceItemProps {
  item: Item;
}

export default function MarketplaceItem({ item }: MarketplaceItemProps) {
  const { isConnected, address } = useAccount();
  const { purchaseMutation } = useMarketplaceApi(); // Usamos la mutación de compra
  const [modalOpen, setModalOpen] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(1);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handlePurchase = () => {
    if (!address) {
      alert("Please connect your wallet first.");
      return;
    }

    if (purchaseQuantity < 1 || purchaseQuantity > item.quantity) {
      alert("Invalid quantity selected.");
      return;
    }

    purchaseMutation.mutate(
      { itemId: item.id, quantity: purchaseQuantity },
      {
        onSuccess: () => {
          toast.success(
            `Successfully purchased ${purchaseQuantity} ${item.name}(s)!`
          );
          setModalOpen(false);
          setPurchaseQuantity(1);
        },
      }
    );
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
      <p className="text-gray-300 mb-4">
        <span className="font-mono">{item.price} ETH</span>
      </p>
      <p className="text-gray-300 mb-4">
        Available: <span className="font-mono">{item.quantity} units</span>
      </p>
      {isConnected ? (
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 w-full"
        >
          Buy Now
        </button>
      ) : (
        <button
          onClick={() => alert("Please connect your wallet first.")}
          className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 w-full"
        >
          Connect Wallet
        </button>
      )}

      {modalOpen && (
        <Modal onClose={closeModal}>
          <div>
            <h2 className="text-2xl font-bold mb-4">Purchase {item.name}</h2>
            <p className="mb-4">
              Price: {item.price} ETH | Available: {item.quantity} units
            </p>
            <input
              type="number"
              min="1"
              max={item.quantity}
              value={purchaseQuantity}
              onChange={(e) => setPurchaseQuantity(Number(e.target.value))}
              placeholder="Enter quantity"
              className="w-full p-2 mb-4 bg-gray-700 text-white rounded-lg"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                disabled={purchaseMutation.isPending}
              >
                {purchaseMutation.isPending
                  ? "Processing..."
                  : "Confirm Purchase"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
