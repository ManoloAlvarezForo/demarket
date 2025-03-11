// app/profile/page.tsx
"use client";

import { useAccount } from "wagmi";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-5xl font-bold mb-8 text-center">Profile</h1>
      {isConnected ? (
        <p className="text-gray-300 text-center">Your address: {address}</p>
      ) : (
        <p className="text-gray-300 text-center">Connect your wallet to view your profile.</p>
      )}
    </div>
  );
}