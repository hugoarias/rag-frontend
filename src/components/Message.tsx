import type { Message as MessageType } from '../types/chat';
import { SourceList } from './SourceList';

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
          {message.streaming && <span className="cursor-blink" />}
        </p>

        {!isUser && <SourceList sources={message.sources} />}
      </div>
    </div>
  );
}
