import { Suspense } from 'react';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DataStreamHandler } from '@/components/data-stream-handler';
import { verifyUser } from '@/server/actions/user';
import {
  dbGetConversation,
  dbGetConversationMessages,
} from '@/server/db/queries';

import ChatInterface from './chat-interface';
import { ChatSkeleton } from './chat-skeleton';

/**
 * Component responsible for fetching and validating chat data
 * Handles authentication, data loading, and access control
 */
async function ChatData({ params }: { params: Promise<{ id: string }> }) {
  // Verify user authentication and access rights
  const authResponse = await verifyUser();
  const userId = authResponse?.data?.data?.id;
  if (!userId) {
    return notFound();
  }
  const { id } = await params;
  const conversation = await dbGetConversation({ conversationId: id, userId });

  if (!conversation) {
    return notFound();
  }

  // Check if user has access to private conversation
  if (conversation.visibility === 'PRIVATE' && conversation.userId !== userId) {
    return notFound();
  }

  // Load conversation messages
  const messagesFromDB = await dbGetConversationMessages({
    conversationId: id,
  });

  if (!messagesFromDB) {
    return notFound();
  }

  return (
    <>
      <ChatInterface id={id} initialMessages={messagesFromDB} />
      <DataStreamHandler key={`data-stream-${id}-chat`} id={id} />
    </>
  );
}

/**
 * Main chat page component with loading state handling
 */
export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatData params={params} />
    </Suspense>
  );
}
