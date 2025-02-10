import { tool } from 'ai';
import { z } from 'zod';

import { telegramTools } from '@/ai/generic/telegram';
import {
  sendTelegramNotification as sendTelegramNotificationAction,
  verifyTelegramSetupAction,
} from '@/server/actions/telegram';

import { WrappedToolProps } from '.';

export const sendTelegramNotification = () => {
  const metadata = {
    description: telegramTools.sendTelegramNotification.description,
    parameters: telegramTools.sendTelegramNotification.parameters,
    requiredEnvVars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_USERNAME'],
  };
  const buildTool = ({ extraData: { userId } }: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({ username, message }) => {
        try {
          const response = await sendTelegramNotificationAction({
            username,
            userId,
            text: message,
          });
          if (!response?.data?.data) {
            return {
              success: false,
              error: 'No response from Telegram action',
            };
          }
          const { success, error, botId } = response.data.data;
          if (!success) {
            return { success, error, botId };
          }
          return {
            success: true,
            data: 'Notification sent successfully',
            noFollowUp: true,
            botId,
          };
        } catch (err) {
          return {
            success: false,
            error:
              err instanceof Error
                ? err.message
                : 'Failed to send notification',
          };
        }
      },
    });

  return {
    metadata,
    buildTool,
  };
};

export const veryfyTelegramSetup = () => {
  const metadata = {
    description: telegramTools.verifyTelegramSetup.description,
    parameters: telegramTools.verifyTelegramSetup.parameters,
    requiredEnvVars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_USERNAME'],
  };
  const buildTool = ({ extraData: { userId } }: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({ username }: { username?: string }) => {
        try {
          const response = await verifyTelegramSetupAction({
            username,
            userId,
          });
          if (!response?.data?.data) {
            return {
              success: false,
              error: 'No response from Telegram action',
            };
          }
          if (!response.data.success) {
            return {
              success: false,
              error: response.data.error,
              botId: response.data.data?.botId,
            };
          }
          return { success: true, data: 'Telegram setup verified' };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Verification failed',
          };
        }
      },
    });
  return {
    metadata,
    buildTool,
  };
};

export const allTelegramTools = {
  sendTelegramNotification: sendTelegramNotification(),
  verifyTelegramSetup: veryfyTelegramSetup(),
};
