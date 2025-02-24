import { retrieveAgentKit } from "./ai";

export async function createDriftAccount({
    amount,
    symbol,
  }: {
    amount: number;
    symbol: string;
  }) {
    try {
      const agent = (await retrieveAgentKit(undefined))?.data?.data?.agent;
      if (!agent) {
        return {
          success: false,
          error: 'Failed to retrieve agent',
          step: 'failed' as const,
        };
      }
      const result = await agent.createDriftUserAccount(amount, symbol);
      return { success: true, result, step: 'completed' as const };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create drift account',
        step: 'failed' as const,
      };
    }
  }

export async function getDriftAccountInfo() {
  try {
    const agent = (await retrieveAgentKit(undefined))?.data?.data?.agent;
    
    if (!agent) {
      return {
        success: false,
        error: 'Failed to retrieve agent',
        step: 'failed' as const,
      };
    }

    const result = await agent.driftUserAccountInfo();
    
    const accountInfo = {
      ...result,
      authority: result.authority.toBase58(),
      name: String.fromCharCode(...result.name).trim(),
    };

    return { success: true, result: accountInfo };
  } catch (error) {
    
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get drift account info',
    };
  }
}


