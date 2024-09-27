"use client";

import { useChat } from "ai/react";
import { useState, useEffect } from "react";
import { ChatInput, ChatMessages } from "./ui/chat";
import { useClientConfig } from "./ui/chat/hooks/use-config";
import PptxGenJS from "pptxgenjs";

// Function to split long text into multiple slides with a max character limit
const splitTextIntoChunks = (text: string, chunkSize: number) => {
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  words.forEach((word) => {
    const currentLength = currentChunk.join(' ').length;
    if (currentLength + word.length <= chunkSize) {
      currentChunk.push(word);
    } else {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
    }
  });

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
};

export default function ChatSection() {
  const { backend } = useClientConfig();
  const [requestData, setRequestData] = useState<any>();
  const [messagesForPpt, setMessagesForPpt] = useState<{ content: string }[]>([]);

  const {
    messages,
    input,
    isLoading,
    handleSubmit,
    handleInputChange,
    reload,
    stop,
    append,
    setInput,
  } = useChat({
    body: { data: requestData },
    api: `${backend}/api/chat`,
    headers: {
      "Content-Type": "application/json",
    },
    onError: (error: unknown) => {
      if (!(error instanceof Error)) throw error;
      const message = JSON.parse(error.message);
      alert(message.detail);
    },
    sendExtraMessageFields: true,
  });

  useEffect(() => {
    if (messages.length) {
      const updatedMessages = messages.map((msg) => ({
        content: msg.content,
      }));
      setMessagesForPpt(updatedMessages);
    }
  }, [messages]);

  // Function to generate the PowerPoint based on chat messages
  const generatePpt = () => {
    const pptx = new PptxGenJS();

    // Add title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText("Chat Response Presentation", { x: 1, y: 1, fontSize: 30, bold: true });

    // Iterate through the messages and create slides with sections
    messagesForPpt.forEach((message, index) => {
      const chunks = splitTextIntoChunks(message.content, 600); // Smaller chunk size for better layout

      chunks.forEach((chunk, chunkIndex) => {
        const slide = pptx.addSlide();

        // Add a header with clear separation
        slide.addText(`Message ${index + 1} - Part ${chunkIndex + 1}`, {
          x: 0.5, y: 0.5, fontSize: 24, bold: true,
        });

        // Adjust text placement and ensure no overlap by setting a proper area
        slide.addText(chunk, { x: 0.5, y: 1.5, fontSize: 18, w: 8.5, h: 4.5 });

        // Example of adding a horizontal line to improve section separation
        slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 6.5, w: 8.5, h: 0.1, });
      });
    });

    // Add a final slide for summary or conclusion
    const summarySlide = pptx.addSlide();
    summarySlide.addText("Summary", { x: 1, y: 1, fontSize: 30, bold: true });
    summarySlide.addText(
      "This presentation provides key information and insights based on the chat responses.",
      { x: 1, y: 2, fontSize: 18 }
    );

    // Download the generated PPT file
    pptx.writeFile({ fileName: "Chat_Response_Presentation.pptx" });
  };

  return (
    <div className="space-y-4 w-full h-full flex flex-col">
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        reload={reload}
        stop={stop}
        append={append}
        
      />
      <ChatInput
        input={input}
        handleSubmit={handleSubmit}
        handleInputChange={handleInputChange}
        isLoading={isLoading}
        messages={messages}
        append={append}
        setInput={setInput}
        requestParams={{ params: requestData }}
        setRequestData={setRequestData}

        
      />
      
      {/* Button to trigger PPT generation */}
      
    </div>
  );
}
