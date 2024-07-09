'use client';

import { useState } from 'react';
import { ClientMessage, ServerMessage, TextPart, ImagePart } from './actions';
import { useActions, useUIState } from 'ai/rsc';
import { generateId } from 'ai';

export default function Home() {
  const [input, setInput] = useState<string>('');
  const [image, setImage] = useState<string | null>(null);
  const [conversation, setConversation] = useUIState();
  const { continueConversation } = useActions();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div>
        {conversation.map((message: ClientMessage) => (
          <div key={message.id}>
            <strong>{message.role}:</strong> 
            {message.display}
            {Array.isArray(message.content) && message.content.map((part, index) => {
              if (part.type === 'image') {
                return <img key={index} src={part.image} alt="Message content" style={{maxWidth: '200px'}} />;
              }
              return null;
            })}
          </div>
        ))}
      </div>

      <div>
        <input
          type="text"
          value={input}
          onChange={event => setInput(event.target.value)}
          placeholder="Type your message..."
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
        {image && <img src={image} alt="Uploaded" style={{maxWidth: '200px'}} />}
        <button
          onClick={async () => {
            if (!input && !image) {
              alert("Please enter a message or upload an image.");
              return;
            }

            const newUserMessage: ClientMessage = {
              id: generateId(),
              role: 'user',
              display: (
                <div>
                  {input && <p>{input}</p>}
                  {image && <img src={image} alt="User uploaded" style={{maxWidth: '200px'}} />}
                </div>
              ),
              content: []
            };

            if (input) {
              (newUserMessage.content as Array<TextPart | ImagePart>).push({ type: 'text', text: input });
            }
            if (image) {
              (newUserMessage.content as Array<TextPart | ImagePart>).push({ type: 'image', image: image });
            }

            setConversation(currentConversation => [...currentConversation, newUserMessage]);

            try {
              const message = await continueConversation(input, image);
              setConversation(currentConversation => [...currentConversation, message]);
            } catch (error) {
              console.error("Error in conversation:", error);
              alert("An error occurred. Please try again.");
            }

            setInput('');
            setImage(null);
          }}
        >
          Send Message
        </button>
      </div>
    </div>
  );
}