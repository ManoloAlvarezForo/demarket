import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class EIP712Service {
  private domain = {
    name: 'DeMarket',
    version: '1',
    chainId: 1, // Reemplaza con el chainId de la red que uses
    verifyingContract: '0x...', // Dirección del contrato DeMarket
  };

  private types = {
    Item: [
      { name: 'token', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'quantity', type: 'uint256' },
    ],
  };

  async signItem(
    signer: ethers.Wallet,
    token: string,
    price: string,
    quantity: string,
  ): Promise<string> {
    const value = {
      token,
      price: ethers.parseEther(price),
      quantity: ethers.parseEther(quantity),
    };
    const signature = await signer.signTypedData(
      this.domain,
      this.types,
      value,
    );
    return signature;
  }

  verifySignature(
    signature: string,
    token: string,
    price: string,
    quantity: string,
    signerAddress: string,
  ): boolean {
    const value = {
      token,
      price: ethers.parseEther(price),
      quantity: ethers.parseEther(quantity),
    };
    const recoveredAddress = ethers.verifyTypedData(
      this.domain,
      this.types,
      value,
      signature,
    );

    return recoveredAddress === signerAddress;
  }
}
