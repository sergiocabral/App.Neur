import { zodSchema } from '@ai-sdk/ui-utils';
import { DataStreamWriter } from 'ai';
import { ZodType, ZodTypeAny, ZodTypeDef } from 'zod';

import { launchPumpFun } from './launch-pump';
import { searchTokenByName } from './search-token';
import { swapTokens } from './swap';

interface ToolMetadata {
  description: string;
  parameters: ZodTypeAny;
  requiredEnvVars?: string[];
}
export interface ToolConfig {
  metadata: ToolMetadata;
  buildTool: (props: WrappedToolProps) => any;
  confirm?: (props: any) => Promise<{ success: boolean; result?: any }>;
}

export interface WrappedToolProps {
  dataStream?: DataStreamWriter;
  abortData?: {
    aborted: boolean;
    abortController: AbortController;
    shouldAbort?: boolean;
  };
  extraData?: any;
}

export const allTools: Record<string, ToolConfig> = {
  swapTokens: swapTokens(),
  searchTokenByName: searchTokenByName(),
  launchPumpFun: launchPumpFun(),
};

export const wrapTools = (
  props: WrappedToolProps,
  toolsRequired?: string[],
) => {
  const toolNames = toolsRequired ? toolsRequired : Object.keys(allTools);
  return toolNames.reduce(
    (acc, toolName) => {
      if (allTools[toolName]) {
        acc[toolName] = allTools[toolName].buildTool(props);
      }
      return acc;
    },
    {} as Record<string, any>,
  );
};

export function getAllToolMetadata() {
  const filteredTools = filterTools(allTools);
  return Object.entries(filteredTools)
    .map(([name, { metadata }]) => {
      const { description, parameters } = metadata;
      const stringifiedMetadata = JSON.stringify({
        name,
        description,
        parameters: zodSchema(parameters).jsonSchema,
      });
      return stringifiedMetadata;
    })
    .join('\n');
}

export function getToolParameters(toolName: string) {
  const tool = allTools[toolName];
  if (!tool) {
    return undefined;
  }
  return tool.metadata.parameters;
}

export function filterTools(
  tools: Record<string, ToolConfig>,
): Record<string, ToolConfig> {
  const disabledTools = process.env.NEXT_PUBLIC_DISABLED_TOOLS
    ? JSON.parse(process.env.NEXT_PUBLIC_DISABLED_TOOLS)
    : [];

  return Object.fromEntries(
    Object.entries(tools).filter(([toolName, toolConfig]) => {
      if (disabledTools.includes(toolName)) {
        return false;
      }
      if (toolConfig.metadata.requiredEnvVars) {
        for (const envVar of toolConfig.metadata.requiredEnvVars) {
          if (!process.env[envVar] || process.env[envVar] == '') {
            return false;
          }
        }
      }
      return true;
    }),
  );
}
