"use client";

import Link from "next/link";
import { ConnectButton } from "./ConnectButton";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-800 z-50 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <span className="text-3xl font-bold text-white">DeMarketX</span>
          <Link href="/" className="text-white hover:text-gray-300">
            Home
          </Link>
          <Link href="/marketplace" className="text-white hover:text-gray-300">
            Marketplace
          </Link>
          <Link href="/dashboard" className="text-white hover:text-gray-300">
            Dashboard
          </Link>
        </div>
        <ConnectButton />
      </div>
    </nav>
  );
};
