import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isFallback: boolean;
}

export function MessageList({ messages, isLoading, isFallback }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      {isFallback && (
        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm p-3 rounded-lg flex items-center justify-center text-center">
          현재 정부 OpenAPI 서버 접속 장애로 인해 안전 모드(오프라인 핵심 DB)로 가동 중입니다.
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 py-12">
          <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-500/20">
            <Bot size={32} className="text-red-500" />
          </div>
          <p className="text-[32px] font-bold tracking-tight text-slate-300">국가법령 Q&A에 오신 것을 환영합니다.</p>
          <p className="text-sm text-center max-w-md leading-relaxed">
            부동산 임대차, 손해배상 등 일상적인 법률 문제에 대해 질문해주세요. <br />
            국가법령정보센터 데이터를 기반으로 답변해 드립니다.
          </p>
        </div>
      )}

      {messages.map((msg) => {
        if (msg.role === 'user') {
          return (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[70%] bg-slate-800 rounded-2xl rounded-tr-none px-5 py-4 shadow-lg border border-slate-700 text-slate-200">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                <span className="text-[10px] text-slate-500 mt-2 block text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        } else {
          return (
            <div key={msg.id} className="flex justify-start">
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-8 h-8 shrink-0 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-none px-6 py-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-red-500 uppercase tracking-tighter">AI Legal Analysis</span>
                    <span className="text-[10px] text-slate-500">|</span>
                    <span className="text-[10px] text-slate-400 font-mono">Ref: 국가법령정보센터</span>
                  </div>
                  <div className="markdown-body prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 text-sm max-w-none text-slate-200">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-4 block">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        }
      })}

      {isLoading && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full text-[11px] font-medium text-slate-400 uppercase tracking-widest shadow-xl">
            <svg className="animate-pulse text-red-500" width="8" height="8" viewBox="0 0 6 6">
              <circle cx="3" cy="3" r="3" fill="currentColor"/>
            </svg>
            Loading Legal Context...
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
