import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeFetchJson } from '../lib/apiUtils';
import {
  Bot,
  X,
  Send,
  MessageSquare,
  Sparkles,
  Minimize2,
  Maximize2,
  RefreshCw,
  HelpCircle,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface FloatingChatBotProps {
  activeTab: string;
  activeRole: string;
  onNavigateTab?: (tab: string) => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

export const FloatingChatBot: React.FC<FloatingChatBotProps> = ({
  activeTab,
  activeRole,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chipsContainerRef = useRef<HTMLDivElement>(null);

  const handleChipsScroll = (direction: 'left' | 'right') => {
    if (chipsContainerRef.current) {
      const scrollAmount = 140;
      chipsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Tab-specific initial greeting messages
  const getTabGreeting = (tab: string, role: string): string => {
    if (role === 'administrator') {
      switch (tab) {
        case 'dashboard':
          return `👋 **Admin Assistant:** Welcome to the Management Dashboard! Need help updating academic hardware standards or monitoring student usage stats?`;
        case 'programmes':
          return `📚 **Programme Manager Helper:** Configuring UOW degrees? Ask me about baseline hardware profiles for CS, Software Engineering, or Game Dev!`;
        case 'devices':
          return `💻 **Device Catalogue Helper:** Need help adding new laptop models or organizing RAM/GPU specs?`;
        default:
          return `⚙️ **Administrator Assistant:** Need assistance configuring UOW hardware decision rules or student accounts?`;
      }
    }

    switch (tab) {
      case 'wizard':
        return `🔮 **Recommendation Wizard Assistant:**\n\nNot sure which degree options or budget to pick? Ask me any quick questions about course requirements or specs!`;
      case 'catalogue':
        return `💻 **Catalogue Helper:**\n\nBrowsing laptops? I can summarize specs for RTX GPUs, RAM upgradeability, or student budget ranges!`;
      case 'compare':
        return `⚖️ **Comparison Assistant:**\n\nComparing two devices? Ask me about CPU vs GPU trade-offs, RAM bottlenecks, or weight/battery life differences.`;
      case 'saved':
        return `🔖 **Saved Recommendations Helper:**\n\nReviewing your saved lists? Ask about advisor accuracy, student feedback, or specs verification.`;
      case 'ai-assistant':
      case 'ai-chat':
        return `💬 **UOW Hardware Bot:** You are currently on the full Hardware Advisor Bot page! Ask any hardware questions here or in the main panel.`;
      default:
        return `👋 **UOW Computing Helper:** Ask me any quick questions about laptop specs, course requirements, or student budget guidelines!`;
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: getTabGreeting(activeTab, activeRole),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Update greeting when tab changes if user hasn't sent custom messages yet
  useEffect(() => {
    if (messages.length <= 1) {
      setMessages([
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: getTabGreeting(activeTab, activeRole),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [activeTab, activeRole]);

  // Contextual quick suggestions per tab
  const getTabQuickPrompts = (tab: string): string[] => {
    switch (tab) {
      case 'wizard':
        return ['⚡ 16GB vs 8GB RAM', '🎮 Game Dev GPU needs', '💰 Student budget guide'];
      case 'catalogue':
        return ['💻 Best laptops under RM4000', '🚀 RTX 4050 vs RTX 4060', '🔋 Battery life tips'];
      case 'compare':
        return ['⚖️ How to compare CPUs', '🧠 Is soldered RAM bad?', '🎮 Dedicated GPU vs iGPU'];
      case 'saved':
        return ['📌 How accuracy score is computed', '💬 Submitting feedback'];
      default:
        return ['⚡ 16GB RAM mandatory?', '💻 MacBook vs Windows', '🎮 Unreal Engine 5 specs'];
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend.trim();
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await safeFetchJson('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, activeTab }),
      });

      if (res.ok && res.data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: res.data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: res.error || 'Sorry, I encountered an issue processing your request.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Network error. Please try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTabBadge = (tab: string) => {
    switch (tab) {
      case 'wizard':
        return 'Wizard Helper';
      case 'catalogue':
        return 'Catalogue Helper';
      case 'compare':
        return 'Compare Helper';
      case 'saved':
        return 'Saved List Helper';
      case 'dashboard':
        return 'Admin Dashboard';
      case 'programmes':
        return 'Programme Helper';
      case 'devices':
        return 'Device Mgmt Helper';
      default:
        return 'UOW Hardware Bot';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 md:right-10 z-50 flex flex-col items-end">
      {/* Expanded Popup Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`w-[320px] sm:w-[380px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col mb-3 ${
              isMinimized ? 'h-14' : 'h-[480px]'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 p-3.5 text-white flex items-center justify-between shadow-xs select-none">
              <div className="flex items-center space-x-2.5">
                <div className="relative">
                  <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md block">
                    <Bot className="w-4 h-4 text-white" />
                  </span>
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse border border-blue-900" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-bold text-xs text-white">Bot Assistant</h3>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-white/20 text-blue-100 uppercase tracking-wider">
                      {getTabBadge(activeTab)}
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-100/80">Online • Context Aware</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Body (When not minimized) */}
            {!isMinimized && (
              <>
                {/* Messages List */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                          m.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs font-medium'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200 dark:border-slate-700 shadow-2xs'
                        }`}
                      >
                        {m.sender === 'bot' ? (
                          <div className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200 [&_h3]:text-[11px] [&_h3]:font-bold [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_h3]:mt-1.5 [&_h3]:mb-0.5 [&_h4]:text-[10px] [&_h4]:font-semibold [&_ul]:list-disc [&_ul]:pl-3.5 [&_li]:my-0.5">
                            <Markdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                table: ({ node, ...props }) => (
                                  <div className="overflow-x-auto my-2 rounded-lg border border-slate-200 dark:border-slate-700 max-w-full shadow-2xs">
                                    <table className="min-w-full text-left text-[10px] border-collapse" {...props} />
                                  </div>
                                ),
                                th: ({ node, ...props }) => (
                                  <th className="bg-blue-50 dark:bg-slate-700/80 text-blue-900 dark:text-blue-200 p-1.5 font-bold border-b border-r last:border-r-0 border-slate-200 dark:border-slate-600 whitespace-nowrap" {...props} />
                                ),
                                td: ({ node, ...props }) => (
                                  <td className="p-1.5 border-b border-r last:border-r-0 border-slate-200 dark:border-slate-700 whitespace-nowrap" {...props} />
                                ),
                              }}
                            >
                              {m.text}
                            </Markdown>
                          </div>
                        ) : (
                          <div>{m.text}</div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.time}</span>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-center space-x-2 text-xs text-slate-400 p-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      <span className="text-[11px]">Thinking...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts Chips with Smooth Horizontal Scrolling */}
                <div className="relative px-2 py-1.5 shrink-0 bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200/60 dark:border-slate-800 flex items-center group">
                  <button
                    type="button"
                    onClick={() => handleChipsScroll('left')}
                    className="p-1 rounded-md bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 shadow-2xs mr-1 cursor-pointer shrink-0 transition-opacity"
                    title="Scroll left"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  <div
                    ref={chipsContainerRef}
                    onWheel={(e) => {
                      if (e.deltaY !== 0 && chipsContainerRef.current) {
                        chipsContainerRef.current.scrollLeft += e.deltaY;
                      }
                    }}
                    className="flex-1 flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 px-0.5 [scrollbar-width:thin] scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
                  >
                    {getTabQuickPrompts(activeTab).map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(prompt.replace(/^[^\s]+\s/, ''))}
                        title={`Send prompt: ${prompt.replace(/^[^\s]+\s/, '')}`}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-all shadow-2xs cursor-pointer shrink-0"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleChipsScroll('right')}
                    className="p-1 rounded-md bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 shadow-2xs ml-1 cursor-pointer shrink-0 transition-opacity"
                    title="Scroll right"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Input Area */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(input);
                  }}
                  className="p-2.5 shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask mini assistant..."
                    className="flex-1 py-2 px-3 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    title="Send message to UOW Hardware Bot"
                    className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-xs flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Button - Compact Logo Icon */}
      {!isOpen && (
        <motion.button
          id="tour-floating-chatbot"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          title={`Bot Assistant (${getTabBadge(activeTab)}) • Instant Hardware Guidance`}
          className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 hover:from-blue-700 hover:to-violet-800 text-white rounded-full shadow-2xl shadow-indigo-600/40 border border-white/20 flex items-center justify-center cursor-pointer transition-all shrink-0"
        >
          <Bot className="w-6 h-6 text-white group-hover:scale-110 group-hover:rotate-6 transition-transform" />
          <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-xs" />
          <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping opacity-75" />
        </motion.button>
      )}
    </div>
  );
};
