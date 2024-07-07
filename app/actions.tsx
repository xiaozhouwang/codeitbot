'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { ReactNode } from 'react';
import { generateId } from 'ai';

export interface ServerMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClientMessage {
  id: string;
  role: 'user' | 'assistant';
  display: ReactNode;
}

export async function continueConversation(
  input: string,
): Promise<ClientMessage> {
  'use server';

  const history = getMutableAIState();
  const currentHistory = history.get();

  console.log("Current history before update:", currentHistory);

  // Update the history using the update method
  history.update((messages: ServerMessage[]) => [
    ...messages,
    { role: 'user', content: input }
  ]);

  const updatedHistory = history.get();
  console.log("Updated history:", updatedHistory);

  try {
    const result = await streamUI({
      model: bedrock('anthropic.claude-3-5-sonnet-20240620-v1:0'),
      messages: updatedHistory,
      text: ({ content, done }) => {
        if (done) {
          history.done((messages: ServerMessage[]) => [
            ...messages,
            { role: 'assistant', content },
          ]);
        }

        return <div>{content}</div>;
      },
    });

    return {
      id: generateId(),
      role: 'assistant',
      display: result.value,
    };
  } catch (error) {
    console.error("Error in continueConversation:", error);
    throw error;
  }
}

export const AI = createAI<ServerMessage[], ClientMessage[]>({
  actions: {
    continueConversation,
  },
  initialAIState: [{ role: 'system', content: 'You are a helpful assistant.' }],
  initialUIState: [],
});