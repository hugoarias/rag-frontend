import { useState } from 'react';
import { useChat } from './hooks/useChat';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { IngestPage } from './components/IngestPage';

type Tab = 'chat' | 'ingest';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const { messages, sendMessage, streamingEnabled, toggleStreaming, isLoading } =
    useChat();

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <header className="shrink-0 border-b border-gray-700 px-6 py-0 flex items-center gap-6">
        <div className="flex items-center gap-3 py-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <h1 className="text-base font-semibold tracking-tight">RAG Chat</h1>
        </div>

        <nav className="flex gap-1">
          {(['chat', 'ingest'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab === 'chat' ? 'Chat' : 'Ingest'}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === 'chat' ? (
        <>
          <ChatWindow messages={messages} />
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            streamingEnabled={streamingEnabled}
            onToggleStreaming={toggleStreaming}
          />
        </>
      ) : (
        <IngestPage />
      )}
    </div>
  );
}

export default App;
