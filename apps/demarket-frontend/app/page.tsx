"use client";

import { Navbar } from "./components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <Navbar />
      <main className="flex-grow flex items-center justify-center">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 className="text-5xl font-bold mb-4">
      Welcome to the Decentralized Marketplace
    </h1>
    <p className="text-lg text-gray-300 mb-8">
      Buy, sell, and trade tokens securely on the blockchain.
    </p>
  </div>
</main>
      <footer className="bg-gray-900/80 backdrop-blur-md border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-gray-300">
            &copy; {new Date().getFullYear()} DeMarketX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
