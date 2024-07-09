'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { openai } from '@ai-sdk/openai';
import { ReactNode } from 'react';
import { generateId } from 'ai';

// Define a type for the AI model
type AIModel = ReturnType<typeof bedrock> | ReturnType<typeof openai>;

export interface ServerMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<TextPart | ImagePart>;
}

export interface ClientMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  display: ReactNode;
  content: string | Array<TextPart | ImagePart>;
}

export interface TextPart {
  type: 'text';
  text: string;
}

export interface ImagePart {
  type: 'image';
  image: string; // Base64 encoded image or URL
}

// You can easily switch between models by changing this line
const MODEL: AIModel = bedrock('anthropic.claude-3-5-sonnet-20240620-v1:0');

export async function continueConversation(
  input?: string,
  image?: string
): Promise<ClientMessage> {
  'use server';

  const newUserContent: Array<TextPart | ImagePart> = [];

  if (input) {
    newUserContent.push({ type: 'text', text: input });
  }

  if (image) {
    newUserContent.push({ type: 'image', image: image });
  }

  if (newUserContent.length === 0) {
    throw new Error('At least one of text input or image must be provided');
  }

  const newUserMessage: ServerMessage = {
    role: 'user',
    content: newUserContent
  };

  const history = getMutableAIState();
  let currentHistory = history.get();

  const apiMessages = currentHistory.filter(msg => msg.role !== 'system');
  const systemMessage = currentHistory.find(msg => msg.role === 'system');

  apiMessages.push(newUserMessage);

  try {
    const result = await streamUI({
      model: MODEL,
      messages: apiMessages,
      system: systemMessage ? systemMessage.content : undefined,
      text: ({ content, done }) => {
        if (done) {
          history.done((messages: ServerMessage[]) => [
            ...messages,
            newUserMessage,
            { role: 'assistant', content: [{ type: 'text', text: content }] },
          ]);
        }
        return <div>{content}</div>;
      },
    });

    return {
      id: generateId(),
      role: 'assistant',
      display: result.value,
      content: [{ type: 'text', text: result.value }]
    };
  } catch (error) {
    console.error("Error in continueConversation:", error);
    // Return a user-friendly error message
    return {
      id: generateId(),
      role: 'assistant',
      display: <div>I'm sorry, but I encountered an error. Please try again.</div>,
      content: [{ type: 'text', text: "Error: Unable to process the request." }]
    };
  }
}

export const AI = createAI<ServerMessage[], ClientMessage[]>({
  actions: {
    continueConversation,
  },
  initialAIState: [{ 
    role: 'system', 
    content: 'You are a helpful assistant.'
  }],
  initialUIState: [],
});