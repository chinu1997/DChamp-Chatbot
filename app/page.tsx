"use client";

import React, { useState } from 'react';
import Header from './components/header';
import ChatSection from './components/chat-section';

export default function Home() {
  const [messages, setMessages] = useState<{ content: string }[]>([]);

  const addMessage = (message: string) => {
    setMessages([...messages, { content: message }]);
  };

  // Add logging to ensure the component is rendering
  console.log("Home component rendering", messages);

  return (
    <main className="h-screen w-screen flex justify-center items-center background-gradient">
      <div className="space-y-2 lg:space-y-10 w-[90%] lg:w-[60rem]">

        <Header messages={messages} />
        <div className="h-[65vh] flex">
          <ChatSection />
        </div>
      </div>
    </main>
  );
}
