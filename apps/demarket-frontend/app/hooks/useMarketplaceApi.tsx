import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useApi } from "../hooks/useApi";
import { WithdrawResponse } from "../types/withdraw";

export function useMarketplaceApi() {
  const { callApi } = useApi();
  const queryClient = useQueryClient();

  // Query to get listed items
  const getItems = async () => {
    return await callApi("/items");
  };

  // Mutation to list an item
  const listItemMutation = useMutation({
    mutationFn: async (data: {
      tokenAddress: string;
      name: string;
      price: string;
      quantity: string;
    }) => {
      console.log("data ", data);
      return await callApi("/items/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast.success(
        `Item listed successfully! Transaction hash: ${data.transactionHash}`
      );
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (error) => {
      toast.error(`Error listing item: ${error.message}`);
    },
  });

  // Mutation to purchase an item
  const purchaseMutation = useMutation({
    mutationFn: async (data: { itemId: number; quantity: number }) => {
      return await callApi("/transactions/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onError: (error) => {
      toast.error(`Purchase failed: ${error.message}`);
    },
  });

  // Mutation to withdraw funds
  const withdrawMutation = useMutation<WithdrawResponse, Error, void>({
    mutationFn: async () => {
      return await callApi("/transactions/withdraw", {
        method: "POST",
      });
    },
  });

  return {
    getItems,
    listItemMutation,
    purchaseMutation,
    withdrawFunds: withdrawMutation.mutateAsync,
  };
}
