import { useChat } from './hooks/useChat';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';

function App() {
  const { messages, sendMessage, streamingEnabled, toggleStreaming, isLoading } =
    useChat();

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <header className="shrink-0 border-b border-gray-700 px-6 py-3 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-indigo-500" />
        <h1 className="text-base font-semibold tracking-tight">RAG Chat</h1>
      </header>

      <ChatWindow messages={messages} />

      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        streamingEnabled={streamingEnabled}
        onToggleStreaming={toggleStreaming}
      />
    </div>
  );
}

export default App;
