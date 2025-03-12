/**
 * Represents an item for sale in a readable format for the frontend.
 * The price and quantity are formatted as strings (e.g. "1.0" for 1 Ether/token).
 */
export type Item = {
  id: number; // Unique identifier for the item (local index)
  seller: string; // Address of the seller
  token: string; // Address of the ERC-20 token being listed
  name: string; // Name of the item
  price: string; // Price per token in Ether (formatted as string)
  quantity: string; // Available quantity (formatted as string in tokens)
};

/**
 * Represents the raw item data directly returned by the smart contract.
 * The price and quantity are returned as bigints (in Wei or token base units).
 */
export type RawItem = {
  seller: string; // Seller's address from the contract
  token: string; // Token contract address
  name: string; // Name of the item (as stored in the contract)
  price: bigint; // Price per token (in Wei, if using 18 decimals)
  quantity: bigint; // Available quantity (in base units, e.g., Wei)
};

/**
 * Represents the parsed event data from the ItemListed event emitted by the contract.
 */
export type ItemListedEvent = {
  itemId: bigint; // The item ID (uint256) as a bigint
  seller: string; // Seller's address
  token: string; // ERC-20 token address
  name: string; // Name of the item
  price: bigint; // Price per token (in Wei)
  quantity: bigint; // Available quantity (in Wei)
};
