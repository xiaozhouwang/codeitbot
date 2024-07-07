'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { ReactNode } from 'react';
import { generateId } from 'ai';

export interface ServerMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClientMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  display: ReactNode;
}

export async function continueConversation(
  input: string,
): Promise<ClientMessage> {
  'use server';

  const history = getMutableAIState();
  let currentHistory = history.get();

  console.log("Initial history:", JSON.stringify(currentHistory, null, 2));

  // Prepare the messages for the Bedrock API
  const apiMessages = currentHistory.filter(msg => msg.role !== 'system');
  const systemMessage = currentHistory.find(msg => msg.role === 'system');

  // Add the new user message
  apiMessages.push({ role: 'user', content: input });

  console.log("Messages for API:", JSON.stringify(apiMessages, null, 2));

  try {
    const result = await streamUI({
      model: bedrock('anthropic.claude-3-5-sonnet-20240620-v1:0'),
      messages: apiMessages,
      system: systemMessage ? systemMessage.content : undefined,
      text: ({ content, done }) => {
        if (done) {
          history.done((messages: ServerMessage[]) => [
            ...messages,
            { role: 'user', content: input },
            { role: 'assistant', content },
          ]);
        }
        return <div>{content}</div>;
      },
    });

    console.log("AI response received");

    return {
      id: generateId(),
      role: 'assistant',
      display: result.value,
    };
  } catch (error) {
    console.error("Error in continueConversation:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
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