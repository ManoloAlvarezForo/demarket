// app/providers.tsx
"use client";

import { WagmiProvider, createConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { http } from "viem";

// Configuración de la red local de Hardhat
const hardhatChain = {
  id: 31337, // Chain ID de Hardhat
  name: "Hardhat",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://localhost:8545"], // URL de tu nodo local
    },
  },
};

// Configuración de wagmi
const config = createConfig(
  getDefaultConfig({
    appName: "Marketplace DApp",
    walletConnectProjectId: "YOUR_WALLETCONNECT_PROJECT_ID", // Opcional para redes locales
    chains: [hardhatChain], // Usa la red local de Hardhat
    transports: {
      [hardhatChain.id]: http(), // Configura el transporte para la red local
    },
  })
);

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}