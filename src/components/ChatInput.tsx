import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { SendHorizonal } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <footer className="p-8 pt-0 flex-shrink-0">
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl focus-within:border-red-900/50 transition-all max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative flex flex-col">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="법률과 관련된 질문을 입력하세요 (예: 전세금 반환 거절 대응 방법...)"
            className="w-full bg-transparent border-none focus:ring-0 text-sm px-4 py-3 max-h-[200px] resize-none placeholder-slate-600 text-slate-200 outline-none leading-relaxed"
            style={{ minHeight: '96px' }}
            disabled={isLoading}
          />
          <div className="flex items-center justify-between px-4 pb-2 mt-2">
            <div className="flex gap-4">
              {/* Optional actions could go here */}
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SendHorizonal size={16} strokeWidth={2.5} />
              질문하기
            </button>
          </div>
        </form>
      </div>
      <p className="text-[10px] text-center text-slate-600 mt-4 max-w-4xl mx-auto">
        K-Law Intelligence는 법률적 조언을 대신할 수 없으며, 참고용으로만 활용하시기 바랍니다.
      </p>
    </footer>
  );
}
