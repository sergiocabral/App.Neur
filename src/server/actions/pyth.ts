import { SolanaAgentKit } from "solana-agent-kit";
import { retrieveAgentKit } from "./ai";

export const fetchPriceByPyth = async({
    priceFeedID
  }:{
    priceFeedID: string;
  },
  extraData: {
    agentKit?: SolanaAgentKit;
  }) => {
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
      console.log('fetchPriceByPyth', priceFeedID);
      const price = await agent.getPythPrice(priceFeedID);
      console.log('fetchPriceByPyth', price);
      return {
        success: true,
        data: price,
      };
    } catch (error) {
      console.error('fetchPriceByPyth', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get the price',
      };
    }
  }