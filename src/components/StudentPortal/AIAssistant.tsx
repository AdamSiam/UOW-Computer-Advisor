import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeFetchJson } from '../../lib/apiUtils';
import { Bot, Send, Sparkles, User, RefreshCw, MessageSquareCode, ShieldAlert } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

const QUICK_PROMPTS = [
  '⚡ 16GB vs 8GB RAM',
  '🎮 Game Dev GPU advice',
  '💻 MacBook vs Windows',
  '💰 Student budget ranges',
  '🛡️ Cybersecurity VM requirements',
  '📊 Data Science & AI specs',
];

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: '👋 Hello! I am your UOW Computing Hardware Bot. Ask me any question about laptop specifications, GPU needs, RAM requirements, or Mac vs Windows for UOW Malaysia computing courses!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await safeFetchJson('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });

      if (res.ok && res.data?.reply) {
        setMessages((prev) => [...prev, { sender: 'bot', text: res.data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: res.error || 'I am temporarily unable to respond. Please try again.' },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Network connection issue. Please try sending again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="max-w-[1550px] w-full mx-auto space-y-4 pb-12">
      {/* Header Banner */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60">
              <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">UOW Computing Hardware Advisor Bot</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Interactive Bot
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Instant rule-based Q&A regarding hardware specs & guidelines for UOW Malaysia courses.
              </p>
            </div>
          </div>
          <div className="text-[11px] bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Gemini AI handles tailored wizard summaries</span>
          </div>
        </div>
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => sendMessage(prompt.replace(/^[^\s]+\s/, ''))}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium whitespace-nowrap transition-all shadow-2xs cursor-pointer flex-shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Main Chat Box Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs h-[620px] flex flex-col justify-between p-4 sm:p-5">
        {/* Messages list */}
        <div className="overflow-y-auto space-y-3 p-2 flex-1 min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`flex items-start space-x-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[92%] sm:max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-xs font-medium'
                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                  }`}
                >
                  {m.sender === 'bot' ? (
                    <div className="space-y-2 [&_h3]:text-xs [&_h3]:font-extrabold [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_h3]:mt-2 [&_h3]:mb-1 [&_h4]:text-[11px] [&_h4]:font-bold [&_h4]:mt-2 [&_h4]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-0.5">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-2 rounded-xl border border-slate-200 dark:border-slate-700 max-w-full shadow-2xs">
                              <table className="min-w-full text-left text-[11px] border-collapse" {...props} />
                            </div>
                          ),
                          th: ({ node, ...props }) => (
                            <th className="bg-blue-100/60 dark:bg-slate-700/80 text-blue-900 dark:text-blue-200 p-2 font-bold border-b border-r last:border-r-0 border-slate-300 dark:border-slate-600 whitespace-nowrap" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="p-2 border-b border-r last:border-r-0 border-slate-200 dark:border-slate-700 whitespace-nowrap" {...props} />
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

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2 text-xs text-slate-400 p-2"
            >
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span>Checking UOW Computing knowledge base...</span>
            </motion.div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="pt-3 shrink-0 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question (e.g. Is 16GB RAM mandatory for Software Engineering?)..."
            className="flex-1 py-2.5 px-4 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
