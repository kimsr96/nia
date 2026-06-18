import { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './lib/firebase';
import { Message } from './types';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { Scale, LogIn, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  // Default session ID for this proof of concept
  const [sessionId, setSessionId] = useState('default-session');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setSessionId(`session-${currentUser.uid}`);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      // Local state only if not logged in
      return;
    }

    // Subscribe to Firestore messages
    const messagesRef = collection(db, 'users', user.uid, 'sessions', sessionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [user, sessionId]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMessages([]);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    // Optimistic UI updates
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    if (user) {
      const messagesRef = collection(db, 'users', user.uid, 'sessions', sessionId, 'messages');
      await addDoc(messagesRef, {
        role: 'user',
        content,
        timestamp: serverTimestamp()
      });
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages
        })
      });

      const data = await res.json();
      setIsFallback(data.fallbackUsed || false);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || '오류가 발생했습니다.',
        timestamp: new Date()
      };

      if (!user) {
         setMessages(prev => [...prev, assistantMessage]);
      }

      if (user) {
         const messagesRef = collection(db, 'users', user.uid, 'sessions', sessionId, 'messages');
         await addDoc(messagesRef, {
           role: 'assistant',
           content: assistantMessage.content,
           timestamp: serverTimestamp()
         });
      }

    } catch (error) {
      console.error('Chat API Error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '앗, 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date()
      };
      if (!user) setMessages(prev => [...prev, errorMsg]);
      // Should handle DB error state gracefully in production
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex justify-center">
      <main className="w-full max-w-5xl h-[100dvh] flex flex-col relative bg-slate-900 shadow-2xl overflow-hidden border-x border-slate-800">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/80 backdrop-blur-md z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/20">K</div>
              <h1 className="text-lg font-bold tracking-tight">K-Law Intelligence</h1>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="h-4 w-px bg-slate-800 mx-2"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-slate-400">OpenAPI Connected</span>
              </div>
              <div className="h-4 w-px bg-slate-800 mx-2"></div>
              <span className="text-xs text-slate-400">Model: <span className="text-slate-200">Gemini 2.5 Flash</span></span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-slate-800 rounded-full px-3 py-1 gap-2 mr-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Security</span>
              <span className="text-[10px] font-bold text-emerald-400">K-LAW SAFE</span>
            </div>
            {user ? (
               <button
                 onClick={handleLogout}
                 className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-700"
               >
                 <LogOut size={16} />
                 <span className="hidden sm:inline">로그아웃</span>
               </button>
            ) : (
               <button
                 onClick={handleLogin}
                 className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm transition-colors shadow-lg shadow-red-600/20 font-medium"
               >
                 <LogIn size={16} />
                 <span>구글 로그인</span>
               </button>
            )}
          </div>
        </header>

        {/* Guest Warning */}
        <AnimatePresence>
          {!user && messages.length > 0 && (
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-fit whitespace-nowrap"
            >
               <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
                 <span className="text-xs text-slate-300">현재 비로그인 상태로, 새로고침 시 대화가 사라집니다.</span>
                 <button onClick={handleLogin} className="text-xs text-red-400 hover:text-red-300 font-medium underline underline-offset-2">
                   로그인하기
                 </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <MessageList messages={messages} isLoading={isLoading} isFallback={isFallback} />

        {/* Input Area */}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        
      </main>
    </div>
  );
}
