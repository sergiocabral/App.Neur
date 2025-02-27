import { SolanaAgentKit } from "solana-agent-kit";
import { retrieveAgentKit } from "./ai";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export type PerpMarketType = {
    fullName?: string;
    category?: string[];
    symbol: string;
    baseAssetSymbol: string;
    marketIndex: number;
    launchTs?: number;
    oracle: PublicKey;
    pythFeedId?: string;
    pythLazerId?: number;
};

export type SpotMarketType = {
    symbol: string;
    marketIndex: number;
    poolId: number;
    oracle: PublicKey;
    mint: PublicKey;
    serumMarket?: PublicKey;
    phoenixMarket?: PublicKey;
    openbookMarket?: PublicKey;
    launchTs?: number;
    pythFeedId?: string;
    pythLazerId?: number;
};

export const MainnetPerpMarketsList: PerpMarketType[] = [
  {
      fullName: 'Solana',
      category: ['L1', 'Infra', 'Solana'],
      symbol: 'SOL-PERP',
      baseAssetSymbol: 'SOL',
      marketIndex: 0,
      oracle: new PublicKey('BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF'),
      pythFeedId: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
      pythLazerId: 6,
  },
  {
      fullName: 'Bitcoin',
      category: ['L1', 'Payment'],
      symbol: 'BTC-PERP',
      baseAssetSymbol: 'BTC',
      marketIndex: 1,
      oracle: new PublicKey('486kr3pmFPfTsS4aZgcsQ7kS4i9rjMsYYZup6HQNSTT4'),
      launchTs: 1670347281000,
      pythFeedId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      pythLazerId: 1,
  },
  {
      fullName: 'Ethereum',
      category: ['L1', 'Infra'],
      symbol: 'ETH-PERP',
      baseAssetSymbol: 'ETH',
      marketIndex: 2,
      oracle: new PublicKey('6bEp2MiyoiiiDxcVqE8rUHQWwHirXUXtKfAEATTVqNzT'),
      launchTs: 1670347281000,
      pythFeedId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      pythLazerId: 2,
  },
  {
      fullName: 'Aptos',
      category: ['L1', 'Infra'],
      symbol: 'APT-PERP',
      baseAssetSymbol: 'APT',
      marketIndex: 3,
      oracle: new PublicKey('79EWaCYU9jiQN8SbvVzGFAhAncUZYp3PjNg7KxmN5cLE'),
      launchTs: 1675802661000,
      pythFeedId: '0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5',
      pythLazerId: 28,
  },
  {
      fullName: 'Bonk',
      category: ['Meme', 'Solana'],
      symbol: '1MBONK-PERP',
      baseAssetSymbol: '1MBONK',
      marketIndex: 4,
      oracle: new PublicKey('GojbSnJuPdKDT1ZuHuAM5t9oz6bxTo1xhUKpTua2F72p'),
      launchTs: 1677690149000,
      pythFeedId: '0x72b021217ca3fe68922a19aaf990109cb9d84e9ad004b4d2025ad6f529314419',
      pythLazerId: 9,
  },
  {
      fullName: 'Polygon',
      category: ['L2', 'Infra'],
      symbol: 'POL-PERP',
      baseAssetSymbol: 'POL',
      marketIndex: 5,
      oracle: new PublicKey('BrzyDgwELy4jjjsqLQpBeUxzrsueYyMhuWpYBaUYcXvi'),
      launchTs: 1677690149000,
      
      pythFeedId: '0xffd11c5a1cfd42f80afb2df4d9f264c15f956d68153335374ec10722edd70472',
      pythLazerId: 32,
  },
  {
      fullName: 'Arbitrum',
      category: ['L2', 'Infra'],
      symbol: 'ARB-PERP',
      baseAssetSymbol: 'ARB',
      marketIndex: 6,
      oracle: new PublicKey('8ocfAdqVRnzvfdubQaTxar4Kz5HJhNbPNmkLxswqiHUD'),
      launchTs: 1679501812000,
      
      pythFeedId: '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5',
      pythLazerId: 37,
  },
  {
      fullName: 'Doge',
      category: ['Meme', 'Dog'],
      symbol: 'DOGE-PERP',
      baseAssetSymbol: 'DOGE',
      marketIndex: 7,
      oracle: new PublicKey('23y63pHVwKfYSCDFdiGRaGbTYWoyr8UzhUE7zukyf6gK'),
      launchTs: 1680808053000,
      
      pythFeedId: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
      pythLazerId: 13,
  },
  {
      fullName: 'Binance Coin',
      category: ['Exchange'],
      symbol: 'BNB-PERP',
      baseAssetSymbol: 'BNB',
      marketIndex: 8,
      oracle: new PublicKey('Dk8eWjuQHMbxJAwB9Sg7pXQPH4kgbg8qZGcUrWcD9gTm'),
      launchTs: 1680808053000,
      
      pythFeedId: '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
      pythLazerId: 15,
  },
  {
      fullName: 'Sui',
      category: ['L1'],
      symbol: 'SUI-PERP',
      baseAssetSymbol: 'SUI',
      marketIndex: 9,
      oracle: new PublicKey('HBordkz5YxjzNURmKUY4vfEYFG9fZyZNeNF1VDLMoemT'),
      launchTs: 1683125906000,
      
      pythFeedId: '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
      pythLazerId: 11,
  },
  {
      fullName: 'Pepe',
      category: ['Meme'],
      symbol: '1MPEPE-PERP',
      baseAssetSymbol: '1MPEPE',
      marketIndex: 10,
      oracle: new PublicKey('CLxofhtzvLiErpn25wvUzpZXEqBhuZ6WMEckEraxyuGt'),
      launchTs: 1683781239000,
      pythFeedId: '0xd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4',
      pythLazerId: 4,
  },
  {
      fullName: 'OP',
      category: ['L2', 'Infra'],
      symbol: 'OP-PERP',
      baseAssetSymbol: 'OP',
      marketIndex: 11,
      oracle: new PublicKey('C9Zi2Y3Mt6Zt6pcFvobN3N29HcrzKujPAPBDDTDRcUa2'),
      launchTs: 1686091480000,
      
      pythFeedId: '0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf',
      pythLazerId: 41,
  },
  {
      fullName: 'RENDER',
      category: ['Infra', 'Solana'],
      symbol: 'RENDER-PERP',
      baseAssetSymbol: 'RENDER',
      marketIndex: 12,
      oracle: new PublicKey('8TQztfGcNjHGRusX4ejQQtPZs3Ypczt9jWF6pkgQMqUX'),
      launchTs: 1687201081000,
      
      pythFeedId: '0x3d4a2bd9535be6ce8059d75eadeba507b043257321aa544717c56fa19b49e35d',
      pythLazerId: 34,
  },
  {
      fullName: 'XRP',
      category: ['Payments'],
      symbol: 'XRP-PERP',
      baseAssetSymbol: 'XRP',
      marketIndex: 13,
      oracle: new PublicKey('9757epAjXWCWQH98kyK9vzgehd1XDVEf7joNHUaKk3iV'),
      launchTs: 1689270550000,
      
      pythFeedId: '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8',
      pythLazerId: 14,
  },
  {
      fullName: 'HNT',
      category: ['IoT', 'Solana'],
      symbol: 'HNT-PERP',
      baseAssetSymbol: 'HNT',
      marketIndex: 14,
      oracle: new PublicKey('9b1rcK9RUPK2vAqwNYCYEG34gUVpS2WGs2YCZZy2X5Tb'),
      launchTs: 1692294955000,
      
      pythFeedId: '0x649fdd7ec08e8e2a20f425729854e90293dcbe2376abc47197a14da6ff339756',
  },
  {
      fullName: 'INJ',
      category: ['L1', 'Exchange'],
      symbol: 'INJ-PERP',
      baseAssetSymbol: 'INJ',
      marketIndex: 15,
      oracle: new PublicKey('BfXcyDWJmYADa5eZD7gySSDd6giqgjvm7xsAhQ239SUD'),
      launchTs: 1698074659000,
      
      pythFeedId: '0x7a5bc1d2b56ad029048cd63964b3ad2776eadf812edc1a43a31406cb54bff592',
      pythLazerId: 46,
  },
  {
      fullName: 'LINK',
      category: ['Oracle'],
      symbol: 'LINK-PERP',
      baseAssetSymbol: 'LINK',
      marketIndex: 16,
      oracle: new PublicKey('Gwvob7yoLMgQRVWjScCRyQFMsgpRKrSAYisYEyjDJwEp'),
      launchTs: 1698074659000,
      
      pythFeedId: '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
      pythLazerId: 19,
  },
  {
      fullName: 'Rollbit',
      category: ['Exchange'],
      symbol: 'RLB-PERP',
      baseAssetSymbol: 'RLB',
      marketIndex: 17,
      oracle: new PublicKey('4CyhPqyVK3UQHFWhEpk91Aw4WbBsN3JtyosXH6zjoRqG'),
      launchTs: 1699265968000,
      
      pythFeedId: '0x2f2d17abbc1e781bd87b4a5d52c8b2856886f5c482fa3593cebf6795040ab0b6',
  },
  {
      fullName: 'Pyth',
      category: ['Oracle', 'Solana'],
      symbol: 'PYTH-PERP',
      baseAssetSymbol: 'PYTH',
      marketIndex: 18,
      oracle: new PublicKey('GqkCu7CbsPVz1H6W6AAHuReqbJckYG59TXz7Y5HDV7hr'),
      launchTs: 1700542800000,
      
      pythFeedId: '0x0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff',
      pythLazerId: 3,
  },
  {
      fullName: 'Celestia',
      category: ['Data'],
      symbol: 'TIA-PERP',
      baseAssetSymbol: 'TIA',
      marketIndex: 19,
      oracle: new PublicKey('C6LHPUrgjrgo5eNUitC8raNEdEttfoRhmqdJ3BHVBJhi'),
      launchTs: 1701880540000,
      
      pythFeedId: '0x09f7c1d7dfbb7df2b8fe3d3d87ee94a2259d212da4f30c1f0540d066dfa44723',
      pythLazerId: 48,
  },
  {
      fullName: 'Jito',
      category: ['MEV', 'Solana'],
      symbol: 'JTO-PERP',
      baseAssetSymbol: 'JTO',
      marketIndex: 20,
      oracle: new PublicKey('Ffq6ACJ17NAgaxC6ocfMzVXL3K61qxB2xHg6WUawWPfP'),
      launchTs: 1701967240000,
      
      pythFeedId: '0xb43660a5f790c69354b0729a5ef9d50d68f1df92107540210b9cccba1f947cc2',
      pythLazerId: 91,
  },
  {
      fullName: 'SEI',
      category: ['L1'],
      symbol: 'SEI-PERP',
      baseAssetSymbol: 'SEI',
      marketIndex: 21,
      oracle: new PublicKey('EVyoxFo5jWpv1vV7p6KVjDWwVqtTqvrZ4JMFkieVkVsD'),
      launchTs: 1703173331000,
      
      pythFeedId: '0x53614f1cb0c031d4af66c04cb9c756234adad0e1cee85303795091499a4084eb',
      pythLazerId: 51,
  },
  {
      fullName: 'AVAX',
      category: ['Rollup', 'Infra'],
      symbol: 'AVAX-PERP',
      baseAssetSymbol: 'AVAX',
      marketIndex: 22,
      oracle: new PublicKey('FgBGHNex4urrBmNbSj8ntNQDGqeHcWewKtkvL6JE6dEX'),
      launchTs: 1704209558000,
      
      pythFeedId: '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
      pythLazerId: 18,
  },
  {
      fullName: 'WIF',
      category: ['Meme', 'Dog', 'Solana'],
      symbol: 'WIF-PERP',
      baseAssetSymbol: 'WIF',
      marketIndex: 23,
      oracle: new PublicKey('6x6KfE7nY2xoLCRSMPT1u83wQ5fpGXoKNBqFjrCwzsCQ'),
      launchTs: 1706219971000,
      
      pythFeedId: '0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc',
      pythLazerId: 10,
  },
  {
      fullName: 'JUP',
      category: ['Exchange', 'Infra', 'Solana'],
      symbol: 'JUP-PERP',
      baseAssetSymbol: 'JUP',
      marketIndex: 24,
      oracle: new PublicKey('AwqRpfJ36jnSZQykyL1jYY35mhMteeEAjh7o8LveRQin'),
      launchTs: 1706713201000,
      
      pythFeedId: '0x0a0408d619e9380abad35060f9192039ed5042fa6f82301d0e48bb52be830996',
      pythLazerId: 92,
  },
  {
      fullName: 'Dymension',
      category: ['Rollup', 'Infra'],
      symbol: 'DYM-PERP',
      baseAssetSymbol: 'DYM',
      marketIndex: 25,
      oracle: new PublicKey('hnefGsC8hJi8MBajpRSkUY97wJmLoBQYXaHkz3nmw1z'),
      launchTs: 1708448765000,
      
      pythFeedId: '0xa9f3b2a89c6f85a6c20a9518abde39b944e839ca49a0c92307c65974d3f14a57',
      pythLazerId: 83,
  },
  {
      fullName: 'BITTENSOR',
      category: ['AI', 'Infra'],
      symbol: 'TAO-PERP',
      baseAssetSymbol: 'TAO',
      marketIndex: 26,
      oracle: new PublicKey('5ZPtwR9QpBLcZQVMnVURuYBmZMu1qQrBcA9Gutc5eKN3'),
      launchTs: 1709136669000,
      
      pythFeedId: '0x410f41de235f2db824e562ea7ab2d3d3d4ff048316c61d629c0b93f58584e1af',
      pythLazerId: 36,
  },
  {
      fullName: 'Wormhole',
      category: ['Bridge'],
      symbol: 'W-PERP',
      baseAssetSymbol: 'W',
      marketIndex: 27,
      oracle: new PublicKey('4HbitGsdcFbtFotmYscikQFAAKJ3nYx4t7sV7fTvsk8U'),
      launchTs: 1710418343000,
      
      pythFeedId: '0xeff7446475e218517566ea99e72a4abec2e1bd8498b43b7d8331e29dcb059389',
      pythLazerId: 102,
  },
  {
      fullName: 'Kamino',
      category: ['Lending', 'Solana'],
      symbol: 'KMNO-PERP',
      baseAssetSymbol: 'KMNO',
      marketIndex: 28,
      oracle: new PublicKey('7aqj2wH1BH8XT3QQ3MWtvt3My7RAGf5Stm3vx5fiysJz'),
      launchTs: 1712240681000,
      
      pythFeedId: '0xb17e5bc5de742a8a378b54c9c75442b7d51e30ada63f28d9bd28d3c0e26511a0',
  },
  {
      fullName: 'Tensor',
      category: ['NFT', 'Solana'],
      symbol: 'TNSR-PERP',
      baseAssetSymbol: 'TNSR',
      marketIndex: 29,
      oracle: new PublicKey('13jpjpVyU5hGpjsZ4HzCcmBo85wze4N8Au7U6cC3GMip'),
      launchTs: 1712593532000,
      
      pythFeedId: '0x05ecd4597cd48fe13d6cc3596c62af4f9675aee06e2e0b94c06d8bee2b659e05',
      pythLazerId: 99,
  },
  {
      fullName: 'Drift',
      category: ['DEX', 'Solana'],
      symbol: 'DRIFT-PERP',
      baseAssetSymbol: 'DRIFT',
      marketIndex: 30,
      oracle: new PublicKey('23KmX7SNikmUr2axSCy6Zer7XPBnvmVcASALnDGqBVRR'),
      launchTs: 1716595200000,
      
      pythFeedId: '0x5c1690b27bb02446db17cdda13ccc2c1d609ad6d2ef5bf4983a85ea8b6f19d07',
  },
  {
      fullName: 'Sanctum',
      category: ['LST', 'Solana'],
      symbol: 'CLOUD-PERP',
      baseAssetSymbol: 'CLOUD',
      marketIndex: 31,
      oracle: new PublicKey('FNFejcXENaPgKaCTfstew9vSSvdQPnXjGTkJjUnnYvHU'),
      launchTs: 1717597648000,
      
  },
  {
      fullName: 'IO',
      category: ['DePIN', 'Solana'],
      symbol: 'IO-PERP',
      baseAssetSymbol: 'IO',
      marketIndex: 32,
      oracle: new PublicKey('HxM66CFwGwrvfTFFkvvA8N3CnKX6m2obzameYWDaSSdA'),
      launchTs: 1718021389000,
      
      pythFeedId: '0x82595d1509b770fa52681e260af4dda9752b87316d7c048535d8ead3fa856eb1',
      pythLazerId: 90,
  },
  {
      fullName: 'ZEX',
      category: ['DEX', 'Solana'],
      symbol: 'ZEX-PERP',
      baseAssetSymbol: 'ZEX',
      marketIndex: 33,
      oracle: new PublicKey('HVwBCaR4GEB1fHrp7xCTzbYoZXL3V8b1aek2swPrmGx3'),
      launchTs: 1719415157000,
      
      pythFeedId: '0x3d63be09d1b88f6dffe6585d0170670592124fd9fa4e0fe8a09ff18464f05e3a',
  },
  {
      fullName: 'POPCAT',
      category: ['Meme', 'Solana'],
      symbol: 'POPCAT-PERP',
      baseAssetSymbol: 'POPCAT',
      marketIndex: 34,
      oracle: new PublicKey('H3pn43tkNvsG5z3qzmERguSvKoyHZvvY6VPmNrJqiW5X'),
      launchTs: 1720013054000,
      
      pythFeedId: '0xb9312a7ee50e189ef045aa3c7842e099b061bd9bdc99ac645956c3b660dc8cce',
  },
  {
      fullName: 'Wen',
      category: ['Solana', 'Meme'],
      symbol: '1KWEN-PERP',
      baseAssetSymbol: '1KWEN',
      marketIndex: 35,
      oracle: new PublicKey('F47c7aJgYkfKXQ9gzrJaEpsNwUKHprysregTWXrtYLFp'),
      launchTs: 1720633344000,
      
      pythFeedId: '0x5169491cd7e2a44c98353b779d5eb612e4ac32e073f5cc534303d86307c2f1bc',
  },
  {
      fullName: 'TRUMP-WIN-2024-BET',
      category: ['Prediction', 'Election'],
      symbol: 'TRUMP-WIN-2024-BET',
      baseAssetSymbol: 'TRUMP-WIN-2024',
      marketIndex: 36,
      oracle: new PublicKey('7YrQUxmxGdbk8pvns9KcL5ojbZSL2eHj62hxRqggtEUR'),
      launchTs: 1723996800000,
      
  },
  {
      fullName: 'KAMALA-POPULAR-VOTE-2024-BET',
      category: ['Prediction', 'Election'],
      symbol: 'KAMALA-POPULAR-VOTE-2024-BET',
      baseAssetSymbol: 'KAMALA-POPULAR-VOTE-2024',
      marketIndex: 37,
      oracle: new PublicKey('AowFw1dCVjS8kngvTCoT3oshiUyL69k7P1uxqXwteWH4'),
      launchTs: 1723996800000,
      
  },
  {
      fullName: 'FED-CUT-50-SEPT-2024-BET',
      category: ['Prediction', 'Election'],
      symbol: 'FED-CUT-50-SEPT-2024-BET',
      baseAssetSymbol: 'FED-CUT-50-SEPT-2024',
      marketIndex: 38,
      oracle: new PublicKey('5QzgqAbEhJ1cPnLX4tSZEXezmW7sz7PPVVg2VanGi8QQ'),
      launchTs: 1724250126000,
      
  },
  {
      fullName: 'REPUBLICAN-POPULAR-AND-WIN-BET',
      category: ['Prediction', 'Election'],
      symbol: 'REPUBLICAN-POPULAR-AND-WIN-BET',
      baseAssetSymbol: 'REPUBLICAN-POPULAR-AND-WIN',
      marketIndex: 39,
      oracle: new PublicKey('BtUUSUc9rZSzBmmKhQq4no65zHQTzMFeVYss7xcMRD53'),
      launchTs: 1724250126000,
      
  },
  {
      fullName: 'BREAKPOINT-IGGYERIC-BET',
      category: ['Prediction', 'Solana'],
      symbol: 'BREAKPOINT-IGGYERIC-BET',
      baseAssetSymbol: 'BREAKPOINT-IGGYERIC',
      marketIndex: 40,
      oracle: new PublicKey('2ftYxoSupperd4ULxy9xyS2Az38wfAe7Lm8FCAPwjjVV'),
      launchTs: 1724250126000,
      
  },
  {
      fullName: 'DEMOCRATS-WIN-MICHIGAN-BET',
      category: ['Prediction', 'Election'],
      symbol: 'DEMOCRATS-WIN-MICHIGAN-BET',
      baseAssetSymbol: 'DEMOCRATS-WIN-MICHIGAN',
      marketIndex: 41,
      oracle: new PublicKey('8HTDLjhb2esGU5mu11v3pq3eWeFqmvKPkQNCnTTwKAyB'),
      launchTs: 1725551484000,
      
  },
  {
      fullName: 'TON',
      category: ['L1'],
      symbol: 'TON-PERP',
      baseAssetSymbol: 'TON',
      marketIndex: 42,
      oracle: new PublicKey('BNjCXrpEqjdBnuRy2SAUgm5Pq8B73wGFwsf6RYFJiLPY'),
      launchTs: 1725551484000,
      
      pythFeedId: '0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026',
      pythLazerId: 12,
  },
  {
      fullName: 'LANDO-F1-SGP-WIN-BET',
      category: ['Prediction', 'Sports'],
      symbol: 'LANDO-F1-SGP-WIN-BET',
      baseAssetSymbol: 'LANDO-F1-SGP-WIN',
      marketIndex: 43,
      oracle: new PublicKey('DpJz7rjTJLxxnuqrqZTUjMWtnaMFAEfZUv5ATdb9HTh1'),
      launchTs: 1726646453000,
      
  },
  {
      fullName: 'MOTHER',
      category: ['Solana', 'Meme'],
      symbol: 'MOTHER-PERP',
      baseAssetSymbol: 'MOTHER',
      marketIndex: 44,
      oracle: new PublicKey('56ap2coZG7FPWUigVm9XrpQs3xuCwnwQaWtjWZcffEUG'),
      launchTs: 1727291859000,
      
      pythFeedId: '0x62742a997d01f7524f791fdb2dd43aaf0e567d765ebf8fd0406a994239e874d4',
  },
  {
      fullName: 'MOODENG',
      category: ['Solana', 'Meme'],
      symbol: 'MOODENG-PERP',
      baseAssetSymbol: 'MOODENG',
      marketIndex: 45,
      oracle: new PublicKey('21gjgEcuDppthwV16J1QpFzje3vmgMp2uSzh7pJsG7ob'),
      launchTs: 1727965864000,
      
      pythFeedId: '0xffff73128917a90950cd0473fd2551d7cd274fd5a6cc45641881bbcc6ee73417',
  },
  {
      fullName: 'WARWICK-FIGHT-WIN-BET',
      category: ['Prediction', 'Sport'],
      symbol: 'WARWICK-FIGHT-WIN-BET',
      baseAssetSymbol: 'WARWICK-FIGHT-WIN',
      marketIndex: 46,
      oracle: new PublicKey('Dz5Nvxo1hv7Zfyu11hy8e97twLMRKk6heTWCDGXytj7N'),
      launchTs: 1727965864000,
      
  },
  {
      fullName: 'DeBridge',
      category: ['Bridge'],
      symbol: 'DBR-PERP',
      baseAssetSymbol: 'DBR',
      marketIndex: 47,
      oracle: new PublicKey('53j4mz7cQV7mAZekKbV3n2L4bY7jY6eXdgaTkWDLYxq4'),
      launchTs: 1728574493000,
      
      pythFeedId: '0xf788488fe2df341b10a498e0a789f03209c0938d9ed04bc521f8224748d6d236',
  },
  {
      fullName: 'WLF-5B-1W',
      category: ['Prediction'],
      symbol: 'WLF-5B-1W-BET',
      baseAssetSymbol: 'WLF-5B-1W',
      marketIndex: 48,
      oracle: new PublicKey('7LpRfPaWR7cQqN7CMkCmZjEQpWyqso5LGuKCvDXH5ZAr'),
      launchTs: 1728574493000,
      
  },
  {
      fullName: 'VRSTPN-WIN-F1-24-DRVRS-CHMP',
      category: ['Prediction', 'Sport'],
      symbol: 'VRSTPN-WIN-F1-24-DRVRS-CHMP-BET',
      baseAssetSymbol: 'VRSTPN-WIN-F1-24-DRVRS-CHMP',
      marketIndex: 49,
      oracle: new PublicKey('E36rvXEwysWeiToXCpWfHVADd8bzzyR4w83ZSSwxAxqG'),
      launchTs: 1729209600000,
      
  },
  {
      fullName: 'LNDO-WIN-F1-24-US-GP',
      category: ['Prediction', 'Sport'],
      symbol: 'LNDO-WIN-F1-24-US-GP-BET',
      baseAssetSymbol: 'LNDO-WIN-F1-24-US-GP',
      marketIndex: 50,
      oracle: new PublicKey('6AVy1y9SnJECnosQaiK2uY1kcT4ZEBf1F4DMvhxgvhUo'),
      launchTs: 1729209600000,
      
  },
  {
      fullName: '1KMEW',
      category: ['Meme'],
      symbol: '1KMEW-PERP',
      baseAssetSymbol: '1KMEW',
      marketIndex: 51,
      oracle: new PublicKey('DKGwCUcwngwmgifGxnme7zVR695LCBGk2pnuksRnbhfD'),
      launchTs: 1729702915000,
      
      pythFeedId: '0x514aed52ca5294177f20187ae883cec4a018619772ddce41efcc36a6448f5d5d',
  },
  {
      fullName: 'MICHI',
      category: ['Meme'],
      symbol: 'MICHI-PERP',
      baseAssetSymbol: 'MICHI',
      marketIndex: 52,
      oracle: new PublicKey('GHzvsMDMSiuyZoWhEAuM27MKFdN2Y4fA4wSDuSd6dLMA'),
      launchTs: 1730402722000,
      
      pythFeedId: '0x63a45218d6b13ffd28ca04748615511bf70eff80a3411c97d96b8ed74a6decab',
  },
  {
      fullName: 'GOAT',
      category: ['Meme'],
      symbol: 'GOAT-PERP',
      baseAssetSymbol: 'GOAT',
      marketIndex: 53,
      oracle: new PublicKey('5RgXW13Kq1RgCLEsJhhchWt3W4R2XLJnd6KqgZk6dSY7'),
      launchTs: 1731443152000,
      
      pythFeedId: '0xf7731dc812590214d3eb4343bfb13d1b4cfa9b1d4e020644b5d5d8e07d60c66c',
  },
  {
      fullName: 'FWOG',
      category: ['Meme'],
      symbol: 'FWOG-PERP',
      baseAssetSymbol: 'FWOG',
      marketIndex: 54,
      oracle: new PublicKey('5Z7uvkAsHNN6qqkQkwcKcEPYZqiMbFE9E24p7SpvfSrv'),
      launchTs: 1731443152000,
      
      pythFeedId: '0x656cc2a39dd795bdecb59de810d4f4d1e74c25fe4c42d0bf1c65a38d74df48e9',
  },
  {
      fullName: 'PNUT',
      category: ['Meme'],
      symbol: 'PNUT-PERP',
      baseAssetSymbol: 'PNUT',
      marketIndex: 55,
      oracle: new PublicKey('5AcetMtdRHxkse2ny44NcRdsysnXu9deW7Yy5Y63qAHE'),
      launchTs: 1731443152000,
      
      pythFeedId: '0x116da895807f81f6b5c5f01b109376e7f6834dc8b51365ab7cdfa66634340e54',
      pythLazerId: 77,
  },
  {
      fullName: 'RAY',
      category: ['DEX'],
      symbol: 'RAY-PERP',
      baseAssetSymbol: 'RAY',
      marketIndex: 56,
      oracle: new PublicKey('DPvPBacXhEyA1VXF4E3EYH3h83Bynh5uP3JLeN25TWzm'),
      launchTs: 1732721897000,
      
      pythFeedId: '0x91568baa8beb53db23eb3fb7f22c6e8bd303d103919e19733f2bb642d3e7987a',
      pythLazerId: 54,
  },
  {
      fullName: 'SUPERBOWL-LIX-LIONS',
      category: ['Prediction', 'Sport'],
      symbol: 'SUPERBOWL-LIX-LIONS-BET',
      baseAssetSymbol: 'SUPERBOWL-LIX-LIONS',
      marketIndex: 57,
      oracle: new PublicKey('GfTeKKnBxeLSB1Hm24ArjduQM4yqaAgoGgiC99gq5E2P'),
      launchTs: 1732721897000,
      
  },
  {
      fullName: 'SUPERBOWL-LIX-CHIEFS',
      category: ['Prediction', 'Sport'],
      symbol: 'SUPERBOWL-LIX-CHIEFS-BET',
      baseAssetSymbol: 'SUPERBOWL-LIX-CHIEFS',
      marketIndex: 58,
      oracle: new PublicKey('EdB17Nyu4bnEBiSEfFrwvp4VCUvtq9eDJHc6Ujys3Jwd'),
      launchTs: 1732721897000,
      
  },
  {
      fullName: 'Hyperliquid',
      category: ['DEX'],
      symbol: 'HYPE-PERP',
      baseAssetSymbol: 'HYPE',
      marketIndex: 59,
      oracle: new PublicKey('Hn9JHQHKSvtnZ2xTWCgRGVNmav2TPffH7T72T6WoJ1cw'),
      launchTs: 1733374800000,
      
      pythFeedId: '0x4279e31cc369bbcc2faf022b382b080e32a8e689ff20fbc530d2a603eb6cd98b',
  },
  {
      fullName: 'LiteCoin',
      category: ['Payment'],
      symbol: 'LTC-PERP',
      baseAssetSymbol: 'LTC',
      marketIndex: 60,
      oracle: new PublicKey('AmjHowvVkVJApCPUiwV9CdHVFn29LiBYZQqtZQ3xMqdg'),
      launchTs: 1733374800000,
      
      pythFeedId: '0x6e3f3fa8253588df9326580180233eb791e03b443a3ba7a1d892e73874e19a54',
  },
  {
      fullName: 'Magic Eden',
      category: ['DEX'],
      symbol: 'ME-PERP',
      baseAssetSymbol: 'ME',
      marketIndex: 61,
      oracle: new PublicKey('FLQjrmEPGwbCKRYZ1eYM5FPccHBrCv2cN4GBu3mWfmPH'),
      launchTs: 1733839936000,
      
      pythFeedId: '0x91519e3e48571e1232a85a938e714da19fe5ce05107f3eebb8a870b2e8020169',
      pythLazerId: 93,
  },
  {
      fullName: 'PENGU',
      category: ['Meme'],
      symbol: 'PENGU-PERP',
      baseAssetSymbol: 'PENGU',
      marketIndex: 62,
      oracle: new PublicKey('7vGHChuBJyFMYBqMLXRzBmRxWdSuwEmg8RvRm3RWQsxi'),
      launchTs: 1734444000000,
      
      pythFeedId: '0xbed3097008b9b5e3c93bec20be79cb43986b85a996475589351a21e67bae9b61',
      pythLazerId: 97,
  },
  {
      fullName: 'AI16Z',
      category: ['AI'],
      symbol: 'AI16Z-PERP',
      baseAssetSymbol: 'AI16Z',
      marketIndex: 63,
      oracle: new PublicKey('3gdGkrmBdYR7B1MRRdRVysqhZCvYvLGHonr9b7o9WVki'),
      launchTs: 1736384970000,
      
      pythFeedId: '0x2551eca7784671173def2c41e6f3e51e11cd87494863f1d208fdd8c64a1f85ae',
  },
  {
      fullName: 'TRUMP',
      category: ['Meme'],
      symbol: 'TRUMP-PERP',
      baseAssetSymbol: 'TRUMP',
      marketIndex: 64,
      oracle: new PublicKey('AmSLxftd19EPDR9NnZDxvdStqtRW7k9zWto7FfGaz24K'),
      launchTs: 1737219250000,
      
      pythFeedId: '0x879551021853eec7a7dc827578e8e69da7e4fa8148339aa0d3d5296405be4b1a',
  },
  {
      fullName: 'MELANIA',
      category: ['Meme'],
      symbol: 'MELANIA-PERP',
      baseAssetSymbol: 'MELANIA',
      marketIndex: 65,
      oracle: new PublicKey('28Zk42cxbg4MxiTewSwoedvW6MUgjoVHSTvTW7zQ7ESi'),
      launchTs: 1737360280000,
      
      pythFeedId: '0x8fef7d52c7f4e3a6258d663f9d27e64a1b6fd95ab5f7d545dbf9a515353d0064',
  },
];

export const MainnetSpotMarketsList: SpotMarketType[] = [
    {
        symbol: 'USDC',
        marketIndex: 0,
        poolId: 0,
        oracle: new PublicKey('En8hkHLkRe9d9DraYmBTrus518BvmVH448YcvmrFM6Ce'),
        mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        pythFeedId: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
        pythLazerId: 7,
    },
    {
        symbol: 'SOL',
        marketIndex: 1,
        poolId: 0,
        oracle: new PublicKey('BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF'),
        mint: new PublicKey('So11111111111111111111111111111111111111112'),
        serumMarket: new PublicKey('8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6'),
        phoenixMarket: new PublicKey('4DoNfFBfF7UokCC2FQzriy7yHK6DY6NVdYpuekQ5pRgg'),
        openbookMarket: new PublicKey('AFgkED1FUVfBe2trPUDqSqK9QKd4stJrfzq5q1RwAFTa'),
        pythFeedId: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
        pythLazerId: 6,
    },
    {
        symbol: 'mSOL',
        marketIndex: 2,
        poolId: 0,
        oracle: new PublicKey('FAq7hqjn7FWGXKDwJHzsXGgBcydGTcK4kziJpAGWXjDb'),
        mint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
        serumMarket: new PublicKey('9Lyhks5bQQxb9EyyX55NtgKQzpM4WK7JCmeaWuQ5MoXD'),
        pythFeedId: '0xc2289a6a43d2ce91c6f55caec370f4acc38a2ed477f58813334c6d03749ff2a4',
    },
    {
        symbol: 'wBTC',
        marketIndex: 3,
        poolId: 0,
        oracle: new PublicKey('9Tq8iN5WnMX2PcZGj4iSFEAgHCi8cM6x8LsDUbuzq8uw'),
        mint: new PublicKey('3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh'),
        serumMarket: new PublicKey('3BAKsQd3RuhZKES2DGysMhjBdwjZYKYmxRqnSMtZ4KSN'),
        pythFeedId: '0xc9d8b075a5c69303365ae23633d4e085199bf5c520a3b90fed1322a0342ffc33',
        pythLazerId: 103,
    },
    {
        symbol: 'wETH',
        marketIndex: 4,
        poolId: 0,
        oracle: new PublicKey('6bEp2MiyoiiiDxcVqE8rUHQWwHirXUXtKfAEATTVqNzT'),
        
        mint: new PublicKey('7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs'),
        
        
        serumMarket: new PublicKey('BbJgE7HZMaDp5NTYvRh5jZSkQPVDTU8ubPFtpogUkEj4'),
        phoenixMarket: new PublicKey('Ew3vFDdtdGrknJAVVfraxCA37uNJtimXYPY4QjnfhFHH'),
        openbookMarket: new PublicKey('AT1R2jUNb9iTo4EaRfKSTPiNTX4Jb64KSwnVmig6Hu4t'),
        pythFeedId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    },
    {
        symbol: 'USDT',
        marketIndex: 5,
        poolId: 0,
        oracle: new PublicKey('BekJ3P5G3iFeC97sXHuKnUHofCFj9Sbo7uyF2fkKwvit'),
        
        mint: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
        
        serumMarket: new PublicKey('B2na8Awyd7cpC59iEU43FagJAPLigr3AP3s38KM982bu'),
        pythFeedId: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
        pythLazerId: 8,
    },
    {
        symbol: 'jitoSOL',
        marketIndex: 6,
        poolId: 0,
        oracle: new PublicKey('9QE1P5EfzthYDgoQ9oPeTByCEKaRJeZbVVqKJfgU9iau'),
        
        mint: new PublicKey('J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn'),
        
        
        serumMarket: new PublicKey('DkbVbMhFxswS32xnn1K2UY4aoBugXooBTxdzkWWDWRkH'),
        phoenixMarket: new PublicKey('5LQLfGtqcC5rm2WuGxJf4tjqYmDjsQAbKo2AMLQ8KB7p'),
        pythFeedId: '0x67be9f519b95cf24338801051f9a808eff0a578ccb388db73b7f6fe1de019ffb',
    },
    {
        symbol: 'PYTH',
        marketIndex: 7,
        poolId: 0,
        oracle: new PublicKey('GqkCu7CbsPVz1H6W6AAHuReqbJckYG59TXz7Y5HDV7hr'),
        
        mint: new PublicKey('HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3'),
        
        
        serumMarket: new PublicKey('4E17F3BxtNVqzVsirxguuqkpYLtFgCR6NfTpccPh82WE'),
        phoenixMarket: new PublicKey('2sTMN9A1D1qeZLF95XQgJCUPiKe5DiV52jLfZGqMP46m'),
        pythFeedId: '0x0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff',
        pythLazerId: 3,
    },
    {
        symbol: 'bSOL',
        marketIndex: 8,
        poolId: 0,
        oracle: new PublicKey('BmDWPMsytWmYkh9n6o7m79eVshVYf2B5GVaqQ2EWKnGH'),
        
        mint: new PublicKey('bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1'),
        
        
        serumMarket: new PublicKey('ARjaHVxGCQfTvvKjLd7U7srvk6orthZSE6uqWchCczZc'),
        pythFeedId: '0x89875379e70f8fbadc17aef315adf3a8d5d160b811435537e03c97e8aac97d9c',
    },
    {
        symbol: 'JTO',
        marketIndex: 9,
        poolId: 0,
        oracle: new PublicKey('Ffq6ACJ17NAgaxC6ocfMzVXL3K61qxB2xHg6WUawWPfP'),
        
        mint: new PublicKey('jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL'),
        
        
        serumMarket: new PublicKey('H87FfmHABiZLRGrDsXRZtqq25YpARzaokCzL1vMYGiep'),
        phoenixMarket: new PublicKey('BRLLmdtPGuuFn3BU6orYw4KHaohAEptBToi3dwRUnHQZ'),
        pythFeedId: '0xb43660a5f790c69354b0729a5ef9d50d68f1df92107540210b9cccba1f947cc2',
        pythLazerId: 91,
    },
    {
        symbol: 'WIF',
        marketIndex: 10,
        poolId: 0,
        oracle: new PublicKey('6x6KfE7nY2xoLCRSMPT1u83wQ5fpGXoKNBqFjrCwzsCQ'),
        
        mint: new PublicKey('EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'),
        
        
        serumMarket: new PublicKey('2BtDHBTCTUxvdur498ZEcMgimasaFrY5GzLv8wS8XgCb'),
        phoenixMarket: new PublicKey('6ojSigXF7nDPyhFRgmn3V9ywhYseKF9J32ZrranMGVSX'),
        openbookMarket: new PublicKey('CwGmEwYFo7u5D7vghGwtcCbRToWosytaZa3Ys3JAto6J'),
        pythFeedId: '0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc',
        pythLazerId: 10,
    },
    {
        symbol: 'JUP',
        marketIndex: 11,
        poolId: 0,
        oracle: new PublicKey('AwqRpfJ36jnSZQykyL1jYY35mhMteeEAjh7o8LveRQin'),
        
        mint: new PublicKey('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
        
        
        phoenixMarket: new PublicKey('2pspvjWWaf3dNgt3jsgSzFCNvMGPb7t8FrEYvLGjvcCe'),
        launchTs: 1706731200000,
        pythFeedId: '0x0a0408d619e9380abad35060f9192039ed5042fa6f82301d0e48bb52be830996',
        pythLazerId: 92,
    },
    {
        symbol: 'RENDER',
        marketIndex: 12,
        poolId: 0,
        oracle: new PublicKey('8TQztfGcNjHGRusX4ejQQtPZs3Ypczt9jWF6pkgQMqUX'),
        
        mint: new PublicKey('rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof'),
        
        
        serumMarket: new PublicKey('2m7ZLEKtxWF29727DSb5D91erpXPUY1bqhRWRC3wQX7u'),
        launchTs: 1708964021000,
        pythFeedId: '0x3d4a2bd9535be6ce8059d75eadeba507b043257321aa544717c56fa19b49e35d',
        pythLazerId: 34,
    },
    {
        symbol: 'W',
        marketIndex: 13,
        poolId: 0,
        oracle: new PublicKey('4HbitGsdcFbtFotmYscikQFAAKJ3nYx4t7sV7fTvsk8U'),
        
        mint: new PublicKey('85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ'),
        
        
        phoenixMarket: new PublicKey('8dFTCTAbtGuHsdDL8WEPrTU6pXFDrU1QSjBTutw8fwZk'),
        launchTs: 1712149014000,
        pythFeedId: '0xeff7446475e218517566ea99e72a4abec2e1bd8498b43b7d8331e29dcb059389',
        pythLazerId: 102,
    },
    {
        symbol: 'TNSR',
        marketIndex: 14,
        poolId: 0,
        oracle: new PublicKey('13jpjpVyU5hGpjsZ4HzCcmBo85wze4N8Au7U6cC3GMip'),
        
        mint: new PublicKey('TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6'),
        
        
        phoenixMarket: new PublicKey('AbJCZ9TAJiby5AY3cHcXS2gUdENC6mtsm6m7XpC2ZMvE'),
        launchTs: 1712593532000,
        pythFeedId: '0x05ecd4597cd48fe13d6cc3596c62af4f9675aee06e2e0b94c06d8bee2b659e05',
        pythLazerId: 99,
    },
    {
        symbol: 'DRIFT',
        marketIndex: 15,
        poolId: 0,
        oracle: new PublicKey('23KmX7SNikmUr2axSCy6Zer7XPBnvmVcASALnDGqBVRR'),
        
        mint: new PublicKey('DriFtupJYLTosbwoN8koMbEYSx54aFAVLddWsbksjwg7'),
        
        
        phoenixMarket: new PublicKey('8BV6rrWsUabnTDA3dE6A69oUDJAj3hMhtBHTJyXB7czp'),
        launchTs: 1715860800000,
        pythFeedId: '0x5c1690b27bb02446db17cdda13ccc2c1d609ad6d2ef5bf4983a85ea8b6f19d07',
    },
    {
        symbol: 'INF',
        marketIndex: 16,
        poolId: 0,
        oracle: new PublicKey('B7RUYg2zF6UdUSHv2RmpnriPVJccYWojgFydNS1NY5F8'),
        
        mint: new PublicKey('5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm'),
        
        
        launchTs: 1716595200000,
        pythFeedId: '0xf51570985c642c49c2d6e50156390fdba80bb6d5f7fa389d2f012ced4f7d208f',
    },
    {
        symbol: 'dSOL',
        marketIndex: 17,
        poolId: 0,
        oracle: new PublicKey('4YstsHafLyDbYFxmJbgoEr33iJJEp6rNPgLTQRgXDkG2'),
        
        mint: new PublicKey('Dso1bDeDjCQxTrWHqUUi63oBvV7Mdm6WaobLbQ7gnPQ'),
        
        
        launchTs: 1716595200000,
        pythFeedId: '0x41f858bae36e7ee3f4a3a6d4f176f0893d4a261460a52763350d00f8648195ee',
    },
    {
        symbol: 'USDY',
        marketIndex: 18,
        poolId: 0,
        oracle: new PublicKey('BPTQgHV4y2x4jvKPPkkd9aS8jY7L3DGZBwjEZC8Vm27o'),
        
        mint: new PublicKey('A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6'),
        
        
        launchTs: 1718811089000,
        pythFeedId: '0xe393449f6aff8a4b6d3e1165a7c9ebec103685f3b41e60db4277b5b6d10e7326',
    },
    {
        symbol: 'JLP',
        marketIndex: 19,
        poolId: 0,
        oracle: new PublicKey('5Mb11e5rt1Sp6A286B145E4TmgMzsM2UX9nCF2vas5bs'),
        
        mint: new PublicKey('27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4'),
        
        
        launchTs: 1719415157000,
        pythFeedId: '0xc811abc82b4bad1f9bd711a2773ccaa935b03ecef974236942cec5e0eb845a3a',
    },
    {
        symbol: 'POPCAT',
        marketIndex: 20,
        poolId: 0,
        oracle: new PublicKey('H3pn43tkNvsG5z3qzmERguSvKoyHZvvY6VPmNrJqiW5X'),
        
        mint: new PublicKey('7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr'),
        
        
        launchTs: 1720013054000,
        phoenixMarket: new PublicKey('31XgvAQ1HgFQEk31KdszbPkVXKaQqB1bgYZPoDrFpSR2'),
        pythFeedId: '0xb9312a7ee50e189ef045aa3c7842e099b061bd9bdc99ac645956c3b660dc8cce',
    },
    {
        symbol: 'CLOUD',
        marketIndex: 21,
        poolId: 0,
        oracle: new PublicKey('FNFejcXENaPgKaCTfstew9vSSvdQPnXjGTkJjUnnYvHU'),
        
        mint: new PublicKey('CLoUDKc4Ane7HeQcPpE3YHnznRxhMimJ4MyaUqyHFzAu'),
        
        
        launchTs: 1721316817000,
    },
    {
        symbol: 'PYUSD',
        marketIndex: 22,
        poolId: 0,
        oracle: new PublicKey('HpMoKp3TCd3QT4MWYUKk2zCBwmhr5Df45fB6wdxYqEeh'),
        
        mint: new PublicKey('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo'),
        
        
        pythFeedId: '0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692',
    },
    {
        symbol: 'USDe',
        marketIndex: 23,
        poolId: 0,
        oracle: new PublicKey('BXej5boX2nWudwAfZQedo212B9XJxhjTeeF3GbCwXmYa'),
        
        mint: new PublicKey('DEkqHyPN7GMRJ5cArtQFAWefqbZb33Hyf6s5iCwjEonT'),
        
        
        pythFeedId: '0x6ec879b1e9963de5ee97e9c8710b742d6228252a5e2ca12d4ae81d7fe5ee8c5d',
    },
    {
        symbol: 'sUSDe',
        marketIndex: 24,
        poolId: 0,
        oracle: new PublicKey('BRuNuzLAPHHGSSVAJPKMcmJMdgDfrekvnSxkxPDGdeqp'),
        
        mint: new PublicKey('Eh6XEPhSwoLv5wFApukmnaVSHQ6sAnoD9BmgmwQoN2sN'),
        
        
        pythFeedId: '0xca3ba9a619a4b3755c10ac7d5e760275aa95e9823d38a84fedd416856cdba37c',
    },
    {
        symbol: 'BNSOL',
        marketIndex: 25,
        poolId: 0,
        oracle: new PublicKey('8DmXTfhhtb9kTcpTVfb6Ygx8WhZ8wexGqcpxfn23zooe'),
        
        mint: new PublicKey('BNso1VUJnh4zcfpZa6986Ea66P6TCp59hvtNJ8b1X85'),
        
        
        pythFeedId: '0x55f8289be7450f1ae564dd9798e49e7d797d89adbc54fe4f8c906b1fcb94b0c3',
    },
    {
        symbol: 'MOTHER',
        marketIndex: 26,
        poolId: 0,
        oracle: new PublicKey('56ap2coZG7FPWUigVm9XrpQs3xuCwnwQaWtjWZcffEUG'),
        
        mint: new PublicKey('3S8qX1MsMqRbiwKg2cQyx7nis1oHMgaCuc9c4VfvVdPN'),
        
        
        pythFeedId: '0x62742a997d01f7524f791fdb2dd43aaf0e567d765ebf8fd0406a994239e874d4',
    },
    {
        symbol: 'cbBTC',
        marketIndex: 27,
        poolId: 0,
        oracle: new PublicKey('486kr3pmFPfTsS4aZgcsQ7kS4i9rjMsYYZup6HQNSTT4'),
        
        mint: new PublicKey('cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij'),
        
        
        openbookMarket: new PublicKey('2HXgKaXKsMUEzQaSBZiXSd54eMHaS3roiefyGWtkW97W'),
        pythFeedId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    },
    {
        symbol: 'USDS',
        marketIndex: 28,
        poolId: 0,
        oracle: new PublicKey('7pT9mxKXyvfaZKeKy1oe2oV2K1RFtF7tPEJHUY3h2vVV'),
        
        mint: new PublicKey('USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA'),
        
        
        pythFeedId: '0x77f0971af11cc8bac224917275c1bf55f2319ed5c654a1ca955c82fa2d297ea1',
    },
    {
        symbol: 'META',
        marketIndex: 29,
        poolId: 0,
        oracle: new PublicKey('DwYF1yveo8XTF1oqfsqykj332rjSxAd7bR6Gu6i4iUET'),
        
        mint: new PublicKey('METADDFL6wWMWEoKTFJwcThTbUmtarRJZjRpzUvkxhr'),
        
        
    },
    {
        symbol: 'ME',
        marketIndex: 30,
        poolId: 0,
        oracle: new PublicKey('FLQjrmEPGwbCKRYZ1eYM5FPccHBrCv2cN4GBu3mWfmPH'),
        
        mint: new PublicKey('MEFNBXixkEbait3xn9bkm8WsJzXtVsaJEn4c8Sam21u'),
        
        
        pythFeedId: '0x91519e3e48571e1232a85a938e714da19fe5ce05107f3eebb8a870b2e8020169',
        pythLazerId: 93,
    },
    {
        symbol: 'PENGU',
        marketIndex: 31,
        poolId: 0,
        oracle: new PublicKey('7vGHChuBJyFMYBqMLXRzBmRxWdSuwEmg8RvRm3RWQsxi'),
        
        mint: new PublicKey('2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv'),
        
        
        pythFeedId: '0xbed3097008b9b5e3c93bec20be79cb43986b85a996475589351a21e67bae9b61',
        pythLazerId: 97,
    },
    {
        symbol: 'BONK',
        marketIndex: 32,
        poolId: 0,
        oracle: new PublicKey('GojbSnJuPdKDT1ZuHuAM5t9oz6bxTo1xhUKpTua2F72p'),
        mint: new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'),
        pythFeedId: '0x72b021217ca3fe68922a19aaf990109cb9d84e9ad004b4d2025ad6f529314419',
        openbookMarket: new PublicKey('D3gZwng2MgZGjktYcKpbR8Bz8653i4qCgzHCf5E4TcZb'),
        launchTs: 1734717937000,
        pythLazerId: 9,
    },
    {
        symbol: 'JLP-1',
        marketIndex: 33,
        poolId: 1,
        oracle: new PublicKey('5Mb11e5rt1Sp6A286B145E4TmgMzsM2UX9nCF2vas5bs'),
        
        mint: new PublicKey('27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4'),
        
        
        pythFeedId: '0xc811abc82b4bad1f9bd711a2773ccaa935b03ecef974236942cec5e0eb845a3a',
        launchTs: 1735255852000,
    },
    {
        symbol: 'USDC-1',
        marketIndex: 34,
        poolId: 1,
        oracle: new PublicKey('En8hkHLkRe9d9DraYmBTrus518BvmVH448YcvmrFM6Ce'),
        
        mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        
        
        pythFeedId: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
        launchTs: 1735255852000,
        pythLazerId: 7,
    },
    {
        symbol: 'AI16Z',
        marketIndex: 35,
        poolId: 0,
        oracle: new PublicKey('3gdGkrmBdYR7B1MRRdRVysqhZCvYvLGHonr9b7o9WVki'),
        
        mint: new PublicKey('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'),
        
        
        pythFeedId: '0x2551eca7784671173def2c41e6f3e51e11cd87494863f1d208fdd8c64a1f85ae',
        launchTs: 1736384970000,
    },
    {
        symbol: 'TRUMP',
        marketIndex: 36,
        poolId: 0,
        oracle: new PublicKey('AmSLxftd19EPDR9NnZDxvdStqtRW7k9zWto7FfGaz24K'),
        
        mint: new PublicKey('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'),
        
        
        pythFeedId: '0x879551021853eec7a7dc827578e8e69da7e4fa8148339aa0d3d5296405be4b1a',
        launchTs: 1737219250000,
    },
    {
        symbol: 'MELANIA',
        marketIndex: 37,
        poolId: 0,
        oracle: new PublicKey('28Zk42cxbg4MxiTewSwoedvW6MUgjoVHSTvTW7zQ7ESi'),
        
        mint: new PublicKey('FUAfBo2jgks6gB4Z4LfZkqSZgzNucisEHqnNebaRxM1P'),
        
        
        pythFeedId: '0x8fef7d52c7f4e3a6258d663f9d27e64a1b6fd95ab5f7d545dbf9a515353d0064',
        launchTs: 1737360280000,
    },
    {
        symbol: 'AUSD',
        marketIndex: 38,
        poolId: 0,
        oracle: new PublicKey('8FZhpiM8n3mpgvENWLcEvHsKB1bBhYBAyL4Ypr4gptLZ'),
        
        mint: new PublicKey('AUSD1jCcCyPLybk1YnvPWsHQSrZ46dxwoMniN4N2UEB9'),
        
        
        pythFeedId: '0xd9912df360b5b7f21a122f15bdd5e27f62ce5e72bd316c291f7c86620e07fb2a',
        launchTs: 1738255943000,
    },
];

export const tradeDriftPerpAccountAction = async (
  {
    amount,
    symbol,
    action,
    type,
    price,
  }: {
    amount: number;
    symbol: string;
    action: 'long' | 'short';
    type: 'market' | 'limit';
    price: number;
  },
  extraData: {
    agentKit?: SolanaAgentKit;
  },
) => {
  const agent =
    extraData.agentKit ??
    (await retrieveAgentKit(undefined))?.data?.data?.agent;

  if (!agent) {
    return {
      success: false,
      error: 'Failed to retrieve agent',
    };
  }
  try {
    console.log('tradeDriftPerpAccountAction', amount, symbol, action, type, price);
    const signature = await agent.tradeUsingDriftPerpAccount(
        amount,
        symbol,
        action,
        type,
        price,
    );
    console.log('tradeDriftPerpAccountAction', signature);
    return {
      success: true,
      result: {
        signature,
      },
    };
  } catch (error) {
    console.error('Error opening Meteora position:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open position',
    };
  }
}

export const SpotTokenSwapDriftAction = async (
    {
      fromSymbol,
      toSymbol,
      fromAmount,
      toAmount,
      slippage,
    }: {
      fromSymbol: string;
      toSymbol: string;
      fromAmount?: number;
      toAmount?: number;
      slippage?: number;
    },
    extraData: {
      agentKit?: SolanaAgentKit;
    },
  ) => {
    const agent =
      extraData.agentKit ??
      (await retrieveAgentKit(undefined))?.data?.data?.agent;
  
    if (!agent) {
      return {
        success: false,
        error: 'Failed to retrieve agent',
      };
    }
    if(fromAmount === undefined && toAmount === undefined) {
        throw new Error('fromAmount or toAmount must be provided');
    }
    if(fromAmount && toAmount && fromAmount <=0 && toAmount <= 0) {
        throw new Error('fromAmount or toAmount must be greater than 0');
    }
    if(fromAmount && toAmount && fromAmount > 0 && toAmount > 0) {
        throw new Error('fromAmount and toAmount cannot both be provided');
    }
    try {
      let signature;
      if(toAmount && toAmount > 0) {
        signature = await agent.driftSpotTokenSwap({
            fromSymbol,
            toSymbol,
            toAmount,
            slippage,
        });
     } else if(fromAmount && fromAmount > 0) {
        signature = await agent.driftSpotTokenSwap({
            fromSymbol,
            toSymbol,
            fromAmount,
            slippage,
        });
     }

      return {
        success: true,
        result: {
          signature,
        },
      };
    } catch (error) {
      console.error('Error opening Meteora position:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open position',
      };
    }
  }

export const createDriftVault = async ({
    name,
    marketName,
    redeemPeriod,
    maxTokens,
    minDepositAmount,
    managementFee,
    profitShare,
    hurdleRate,
    permissioned,
}:{
    name: string;
    marketName: `${string}-${string}`;
    redeemPeriod: number;
    maxTokens: number;
    minDepositAmount: number;
    managementFee: number;
    profitShare: number;
    hurdleRate: number;
    permissioned: boolean;
}) => {
  try {
    const agent = (await retrieveAgentKit(undefined))?.data?.data?.agent;

    if (!agent) {
        return { success: false, error: 'Failed to retrieve agent' };
    }

    const signature = await agent.createDriftVault({
        name,
        marketName,
        redeemPeriod,
        maxTokens,
        minDepositAmount,
        managementFee,
        profitShare,
        hurdleRate,
        permissioned,
    });

    return { 
        success: true, 
        result: {
            signature,
        }
    };
  } catch (error) {
    console.error('Error creating drift vault:', error);
    return {
        success: false,
        error:
            error instanceof Error
                ? error.message
                : 'Failed to create drift vault',
    };
  }
}

