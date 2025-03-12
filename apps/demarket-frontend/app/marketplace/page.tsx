"use client";

import { useMarketplaceApi } from "../hooks/useMarketplaceApi";
import { useAccount } from "wagmi";
import MarketplaceItem from "../components/MarketplaceItem";
import { useQuery } from "@tanstack/react-query";
import { Item } from "../types/item";

export default function MarketplacePage() {
  const { address } = useAccount();
  const { getItems } = useMarketplaceApi();

  const {
    data: items,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["items", address],
    queryFn: getItems,
  });

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-900 text-white pt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">Marketplace</h2>
        {isLoading ? (
          <p className="text-gray-300 text-center">Loading items...</p>
        ) : error ? (
          <p className="text-red-500 text-center">Error: {error.message}</p>
        ) : items && items.length === 0 ? (
          <p className="text-gray-300 text-center">No items listed</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items?.map((item: Item) => (
              <MarketplaceItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
