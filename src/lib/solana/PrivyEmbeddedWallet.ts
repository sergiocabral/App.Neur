import {
  PrivyClient,
  type SolanaSignTransactionRpcInputType,
} from '@privy-io/server-auth';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { BaseWallet } from 'solana-agent-kit/dist/types/wallet';

export class PrivyEmbeddedWallet implements BaseWallet {
  private privyClient: PrivyClient;
  publicKey: PublicKey;
  constructor(privyClient: PrivyClient, publicKey: PublicKey) {
    try {
      this.privyClient = privyClient;
      this.publicKey = publicKey;
    } catch (error) {
      throw new Error(
        `Failed to initialize wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T> {
    try {
      const request: SolanaSignTransactionRpcInputType<T> = {
        address: this.publicKey.toBase58(),
        chainType: 'solana',
        method: 'signTransaction',
        params: {
          transaction,
        },
      };
      const { data } = await this.privyClient.walletApi.rpc(request);
      return data.signedTransaction as T;
    } catch (error) {
      throw new Error(
        `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]> {
    try {
      return await Promise.all(
        transactions.map(async (tx) => {
          const request: SolanaSignTransactionRpcInputType<T> = {
            address: this.publicKey.toBase58(),
            chainType: 'solana',
            method: 'signTransaction',
            params: {
              transaction: tx,
            },
          };
          const { data } = await this.privyClient.walletApi.rpc(request);
          return data.signedTransaction as T;
        }),
      );
    } catch (error) {
      throw new Error(
        `Failed to sign transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
