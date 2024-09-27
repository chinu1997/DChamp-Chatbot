import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../button";
import ChatActions from "./chat-actions";
import ChatMessage from "./chat-message";
import { ChatHandler } from "./chat.interface";
import { useClientConfig } from "./hooks/use-config";
import PptxGenJS from "pptxgenjs"; // Import the PPT library

export default function ChatMessages(
  props: Pick<ChatHandler, "messages" | "isLoading" | "reload" | "stop" | "append">
) {
  const { backend } = useClientConfig();
  const [starterQuestions, setStarterQuestions] = useState<string[] | null>(null); // Ensure initial state is null to avoid undefined checks
  const scrollableChatContainerRef = useRef<HTMLDivElement>(null);
  const messageLength = props.messages.length;
  const lastMessage = props.messages[messageLength - 1];

  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    if (scrollableChatContainerRef.current) {
      scrollableChatContainerRef.current.scrollTop =
        scrollableChatContainerRef.current.scrollHeight;
    }
  };

  const isLastMessageFromAssistant = messageLength > 0 && lastMessage?.role !== "user";
  const showReload = props.reload && !props.isLoading && isLastMessageFromAssistant;
  const showStop = props.stop && props.isLoading;
  const isPending = props.isLoading && !isLastMessageFromAssistant;

  useEffect(() => {
    scrollToBottom();
  }, [messageLength, lastMessage]);

  // Fetch starter questions with proper dependency handling
  useEffect(() => {
    if (!starterQuestions) {  // Only fetch if not already set
      fetch(`${backend}/api/chat/config`)
        .then((response) => response.json())
        .then((data) => {
          if (data?.starterQuestions) {
            setStarterQuestions(data.starterQuestions); // Only set state if it's different
          }
        })
        .catch((error) => console.error("Error fetching config", error));
    }
  }, [backend, starterQuestions]); // Ensure correct dependencies

  // Function to split long text into chunks for better slide presentation
  const splitTextIntoChunks = (text: string, chunkSize: number) => {
    const words = text.split(" ");
    const chunks: string[] = [];
    let currentChunk: string[] = [];

    words.forEach((word) => {
      const currentLength = currentChunk.join(" ").length;
      if (currentLength + word.length <= chunkSize) {
        currentChunk.push(word);
      } else {
        chunks.push(currentChunk.join(" "));
        currentChunk = [word];
      }
    });

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
    }

    return chunks;
  };

  // Function to generate PPT based on the conversation messages
  const generatePpt = () => {
    const pptx = new PptxGenJS();
  
    // Add title slide with background color
    const titleSlide = pptx.addSlide();
    titleSlide.background = { fill: "0088CC" }; // Blue background
    titleSlide.addText("Chat Response Presentation", {
      x: 0.5,
      y: 1,
      fontSize: 36,
      bold: true,
      color: "FFFFFF", // White text
      align: "center",
    });
  
    // Define max characters per slide to ensure content isn't overcrowded
    const maxCharsPerSlide = 500;
  
    // Function to split long text into smaller chunks that fit well on a slide
    const splitTextIntoChunks = (text: string, maxChars: number) => {
      const words = text.split(" ");
      const chunks: string[] = [];
      let currentChunk: string[] = [];
  
      words.forEach((word) => {
        const currentLength = currentChunk.join(" ").length;
        if (currentLength + word.length <= maxChars) {
          currentChunk.push(word);
        } else {
          chunks.push(currentChunk.join(" "));
          currentChunk = [word];
        }
      });
  
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
      }
  
      return chunks;
    };
  
    // Iterate over the messages and create slides
    props.messages.forEach((message, index) => {
      // Split the message content into chunks based on the max allowed characters
      const chunks = splitTextIntoChunks(message.content, maxCharsPerSlide);
  
      chunks.forEach((chunk, chunkIndex) => {
        const slide = pptx.addSlide();
        slide.background = { fill: "F1F1F1" }; // Light grey background for better readability
  
        // Add title for each message
        slide.addText(`Message ${index + 1} - Part ${chunkIndex + 1}`, {
          x: 0.5,
          y: 0.5,
          fontSize: 24,
          bold: true,
          color: "333333", // Dark grey text
        });
  
        // Add the chunked text to the slide with proper formatting
        slide.addText(chunk, {
          x: 0.5,
          y: 1.5,
          fontSize: 18,
          color: "000000", // Black text
          w: "90%",
          h: "70%", // Ensure it doesn’t overflow the slide
        });
      });
    });
  
    // Add a final slide for summary or conclusion
    const summarySlide = pptx.addSlide();
    summarySlide.background = { fill: "0088CC" }; // Blue background matching the title slide
    summarySlide.addText("Summary", {
      x: 0.5,
      y: 1,
      fontSize: 36,
      bold: true,
      color: "FFFFFF", // White text
      align: "center",
    });
    summarySlide.addText(
      "This presentation provides key information and insights based on the chat responses.",
      {
        x: 1,
        y: 2.5,
        fontSize: 18,
        color: "FFFFFF", // White text
        align: "center",
      }
    );
  
    // Download the generated PPT file
    pptx.writeFile({ fileName: "Chat_Response_Presentation.pptx" });
  };
  


  return (
    <div
      className="flex-1 w-full rounded-xl bg-white p-4 shadow-xl relative overflow-y-auto"
      ref={scrollableChatContainerRef}
    >
      <div className="flex flex-col gap-5 divide-y">
        {props.messages.map((m, i) => {
          const isLoadingMessage = i === messageLength - 1 && props.isLoading;
          return (
            <ChatMessage
              key={m.id}
              chatMessage={m}
              isLoading={isLoadingMessage}
              append={props.append!}
              isLastMessage={i === messageLength - 1}
            />
          );
        })}
        {isPending && (
          <div className="flex justify-center items-center pt-10">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>
      {(showReload || showStop || props.messages.length > 0) && (
        <div className="flex justify-end py-4">
          <ChatActions
            reload={props.reload}
            stop={props.stop}
            showReload={showReload}
            showStop={showStop}
            showGeneratePpt={props.messages.length > 0} // Show PPT button if there are messages
            onGeneratePpt={generatePpt} // Pass the PPT generation function
          />
        </div>
      )}
      {!messageLength && starterQuestions?.length && props.append && (
        <div className="absolute bottom-6 left-0 w-full">
          <div className="grid grid-cols-2 gap-2 mx-20">
            {starterQuestions.map((question, i) => (
              <Button
                variant="outline"
                key={i}
                onClick={() =>
                  props.append!({ role: "user", content: question })
                }
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
