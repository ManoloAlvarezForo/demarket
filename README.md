# DeMarketX

DeMarket is a decentralized marketplace dApp that enables users to list, buy, and sell digital assets securely on the blockchain.  
It leverages **Next.js**, **NestJS**, and **Hardhat** to provide a seamless experience for both on-chain and off-chain interactions.

## 📂 Project Structure

The repository is organized into three main folders:

- **`demarket-frontend/`** - The front-end application built with **Next.js**.
- **`demarket-backend/`** - The back-end API powered by **NestJS**.
- **`demarket-contracts/`** - The smart contracts implemented using **Hardhat** and **Solidity**.

## 🛠 Tech Stack

| Component    | Technology      |
|-------------|----------------|
| **Frontend**  | Next.js, TypeScript, TailwindCSS |
| **Backend**   | NestJS, TypeScript, Ethers.js, Web3.js |
| **Blockchain** | Solidity, Hardhat, Ethers.js |
| **Monorepo**  | Turborepo |

## 🚀 Installation & Setup

### Turborepo & Dependency Management
This project is structured as a monorepo using **Turborepo** to efficiently manage dependencies and build processes. 
Turborepo helps optimize workflows by sharing dependencies across packages and caching builds to speed up development.

#### Installing Dependencies
To install dependencies across all packages, run the following command at the root of the project:

```bash
pnpm install
```

If using npm or yarn:

```bash
yarn install
# or
npm install
```

Turborepo ensures that dependencies are linked properly between packages, avoiding duplication and improving consistency across the monorepo.

### Running the Project
You can start the development environment using Turborepo with:

```bash
pnpm dev
```

or for specific packages:

```bash
pnpm --filter demarket-frontend dev
pnpm --filter demarket-backend dev
pnpm --filter demarket-contracts dev
```

## 🌍 Environment Variables Setup
To properly configure the project, you need to create a `.env` file inside each module (`demarket-frontend`, `demarket-backend`, `demarket-contracts`) and add the required environment variables.

#### Example `.env` file for `demarket-contracts`

```bash
ALCHEMY_API_KEY=your-alchemy-key
WALLET_PRIVATE_KEY=your-private-key
```

#### Local Development Configuration (Hardhat)
For local testing with Hardhat, add the following variables to your `.env` file:

```bash
# Local (Hardhat)
LOCAL_RPC_URL=http://localhost:8545
LOCAL_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
LOCAL_DEMARKET_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
LOCAL_DMX_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## 📜 License
This project is open-source and available under the MIT License.

