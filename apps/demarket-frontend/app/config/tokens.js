export const SUPPORTED_TOKENS = [
  { symbol: "DMX", address: process.env.NEXT_PUBLIC_DMX_ADDRESS || "0x1" },
  { symbol: "USDC", address: process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x2" },
  { symbol: "ETH", address: "0x0000000000000000000000000000000000000000" }, // ETH native
];
