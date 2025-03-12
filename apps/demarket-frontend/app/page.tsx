"use client";

import Head from "next/head";
import Link from "next/link";
import { Navbar } from "./components/Navbar";

export default function Home() {
  return (
    <>
      <Head>
        <title>DeMarketX - Decentralized Marketplace</title>
        <meta
          name="description"
          content="Buy, sell, and trade tokens securely on the blockchain."
        />
      </Head>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <header>
          <Navbar />
        </header>
        <main className="flex-grow flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-4">
              Welcome to the Decentralized Marketplace
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Buy, sell, and trade tokens securely on the blockchain.
            </p>
            {/* Extra section for navigation */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Get Started</h2>
              <p className="mb-4">
                You can list an item for sale or withdraw your earned funds from
                sales. Manage your assets in your dashboard.
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/marketplace"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  Explore Marketplace
                </Link>
                <Link
                  href="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
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
    </>
  );
}
