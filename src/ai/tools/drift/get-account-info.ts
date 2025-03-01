import { generateObject, tool } from 'ai';
import { z } from 'zod';

import { streamUpdate } from '@/lib/utils';
import { ToolConfig, WrappedToolProps } from '..';
import { getDriftAccountInfo as getDriftAccountInfoAction, getMainnetDriftMarkets, tradeDriftPerpAccountAction } from '@/server/actions/drift';
import { DriftAccountInfoType, perpPosition } from '@/types/stream';
import { openai } from '@/ai/providers';
import { fetchPriceByPyth } from '@/server/actions/pyth';

export const getDriftAccountInfo = (): ToolConfig => {

  const metadata = {
    description: 'Get drift account info (no parameters required)',
    parameters: z.object({
      message: z
        .string()
        .optional()
        .or(z.literal(''))
        .describe('Message that the user sent'),
      }),
    updateParameters: z.object({
      info: z.object({
        name: z.string(),
        accountAddress: z.string(),
        authority: z.string(),
        overallBalance: z.number(),
        settledPerpPnl: z.string(),
        lastActiveSlot: z.number(),
        perpPositions: z.array(z.object({
          market: z.string(),
          baseAssetAmount: z.number(),
          quoteAssetAmount: z.number(),
          quoteEntryAmount: z.number(),
          quoteBreakEvenAmount: z.number(),
          settledPnl: z.number(),
          openAsks: z.number(),
          openBids: z.number(),
          openOrders: z.number(),
          positionType: z.string(),
        })),
        spotPositions: z.array(z.object({
          availableBalance: z.number(),
          symbol: z.string(),
          openAsks: z.number(),
          openBids: z.number(),
          openOrders: z.number(),
          type: z.string(),
        })),
      }),
      selectedPrepPositon: z.object({
        market: z.string(),
        baseAssetAmount: z.number(),
        quoteAssetAmount: z.number(),
        quoteEntryAmount: z.number(),
        quoteBreakEvenAmount: z.number(),
        settledPnl: z.number(),
        openAsks: z.number(),
        openBids: z.number(),
        openOrders: z.number(),
        positionType: z.string(),
      })
    }),
  };

  const buildTool = ({ 
    dataStream = undefined,
    abortData,
    extraData: {  },
  }: WrappedToolProps) =>
    
    tool({
      ...metadata,
      execute: async ( message, { toolCallId }) => {
        let updatedToolCall: {
          toolCallId: string;
          status: 'streaming' | 'idle';
          step: string;
          info?: DriftAccountInfoType;
          selectedPrepPositon? : perpPosition;
        } = {
          toolCallId,
          status: 'streaming',
          step: 'get-info',
        };

        const result = await getDriftAccountInfoAction();
        console.log(result);
        streamUpdate({
          stream: dataStream,
          update: {
            type: 'stream-result-data',
            toolCallId: toolCallId,
            status: 'streaming',
            content: {
              step: 'awaiting-confirmation',
              info: result.result ? result.result : undefined,
            },
          },
        });

        const { object: originalToolCall } = await generateObject({
          model: openai('gpt-4o-mini', { structuredOutputs: true }),
          schema: z.object({
            info: z.object({
              name: z.string(),
              accountAddress: z.string(),
              authority: z.string(),
              overallBalance: z.number(),
              settledPerpPnl: z.string(),
              lastActiveSlot: z.number(),
              perpPositions: z.array(z.object({
                market: z.string(),
                baseAssetAmount: z.number(),
                quoteAssetAmount: z.number(),
                quoteEntryAmount: z.number(),
                quoteBreakEvenAmount: z.number(),
                settledPnl: z.number(),
                openAsks: z.number(),
                openBids: z.number(),
                openOrders: z.number(),
                positionType: z.string(),
              })),
              spotPositions: z.array(z.object({
                availableBalance: z.number(),
                symbol: z.string(),
                openAsks: z.number(),
                openBids: z.number(),
                openOrders: z.number(),
                type: z.string(),
              })),
            }),
            selectedPrepPositon: z.object({
              market: z.string(),
              baseAssetAmount: z.number(),
              quoteAssetAmount: z.number(),
              quoteEntryAmount: z.number(),
              quoteBreakEvenAmount: z.number(),
              settledPnl: z.number(),
              openAsks: z.number(),
              openBids: z.number(),
              openOrders: z.number(),
              positionType: z.string(),
            })
          }),
          prompt: `The user sent the following message: ${message}`,
        });

        if (originalToolCall) {
          updatedToolCall = {
            ...updatedToolCall,
            info: originalToolCall.info ?? updatedToolCall.info,
            selectedPrepPositon: originalToolCall.selectedPrepPositon
          };
          streamUpdate({
            stream: dataStream,
            update: {
              type: 'stream-result-data',
              status: 'idle',
              toolCallId,
              content: {
                ...updatedToolCall,
                step: 'awaiting-confirmation',
                selectedPrepPositon: updatedToolCall.selectedPrepPositon
              },
            },
          });
        }

        return {
          success: true,
          noFollowUp: true,
          result: {
            step: 'awaiting-confirmation',
            info: updatedToolCall.info,
            selectedPrepPositon: updatedToolCall.selectedPrepPositon
          },
        };
      },
    });

  return {
    metadata,
    buildTool,
    confirm: async (toolResults: any, extraData: any) => {
      const { selectedPrepPositon }:{selectedPrepPositon: perpPosition} = toolResults;
      console.log("starting to confirm", selectedPrepPositon);
      if (!selectedPrepPositon) {
        return {
          success: false,
          error: 'Missing Prep Position or Info about account',
        };
      }
      try {
        const markets = await getMainnetDriftMarkets(extraData);
        const baseAsset = markets.result?.PrepMarkets.filter((market) => market.symbol === selectedPrepPositon.market)[0];
        if (!baseAsset || !baseAsset.pythFeedId) {
          console.log("market not found!");
          return {
            success: false,
            error: 'Market not found',
          };
        }
        const price = await fetchPriceByPyth({ priceFeedID: baseAsset.pythFeedId }, extraData);
        if (!price.success || !price.data) {
          console.log("failed to get price!");
          return {
            success: false,
            error: 'Failed to get price',
          };
        }
        const amount = Math.ceil(selectedPrepPositon.baseAssetAmount * Number(price.data) * 100) / 100;
        const result = await tradeDriftPerpAccountAction({
          amount: amount,
          symbol: baseAsset.baseAssetSymbol,
          action: selectedPrepPositon.positionType === "long" ? 'short' : 'long',
          type: 'market',
          price: selectedPrepPositon.quoteEntryAmount,
        }, extraData);
        
        return {
          success: true,
          noFollowUp: true,
          result: {
            ...result,
            signature: result.result?.signature,
            step: 'completed',
          },
        };
      } catch (error) {
        console.log('Error closing perp trade:', error);
        return{
          success: false,
          error: error instanceof Error ? error.message : 'Failed to close trade',
        }
      }
    },
  };
}; 
