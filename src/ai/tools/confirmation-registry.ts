import { performSwap } from '@/server/actions/swap';

import { swapTokens } from './swap';

/**
 * Maps a tool name to a function that handles the tool's confirmation
 */
const toolConfirmationRegistry: Record<string, Function> = {
  [swapTokens.name]: performSwap,
};

export default toolConfirmationRegistry;
