// app/components/ConnectButton.tsx
"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export const ConnectButton = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div>
      {isConnected ? (
        <button
          onClick={() => disconnect()}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          Disconnect {address?.slice(0, 6)}...{address?.slice(-4)}
        </button>
      ) : (
        <button
          onClick={() => connect({ connector: connectors[0] })}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};
