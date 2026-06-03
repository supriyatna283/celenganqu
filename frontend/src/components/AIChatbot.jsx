import { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Bot, X, Send, Mic, Trash2, ChevronDown, Sparkles } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  "Catat pengeluaran makan 50.000",
  "Berapa total saldoku sekarang?",
  "Berapa sisa budget bulan ini?"
];

const INITIAL_MSG = { role: 'ai', text: 'Halo! 👋 Saya **CelenganQu Assistant**.\n\nMau catat transaksi atau nanya soal uangmu? Pilih saran di bawah atau ketik langsung ya!' };

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const { fetchTransactions, fetchAccounts, fetchBudgets } = useFinanceStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, []);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await api.post('/chat/message', { message: text });
      const { reply, intent, transaction_data } = response.data;

      setMessages(prev => [...prev, { role: 'ai', text: reply }]);

      if (intent === 'log_transaction') {
        fetchTransactions();
        fetchAccounts();
        fetchBudgets();
        toast.success('Transaksi berhasil dicatat oleh AI!');
      }

    } catch (err) {
      console.error(err);
      const fallbackReply = err.response?.data?.reply || 'Maaf, sistem sedang mengalami gangguan. 😵‍💫 Coba lagi beberapa saat ya!';
      setMessages(prev => [...prev, { role: 'ai', text: fallbackReply }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_MSG]);
  };

  const toggleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Browser Anda tidak mendukung fitur suara.');
      return;
    }

    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };
    recognition.onerror = (event) => {
      console.error('Speech error', event.error);
      setIsListening(false);
      if (event.error === 'network') toast.error('Gagal mengenali suara: Cek koneksi internet Anda.');
      else if (event.error === 'not-allowed') toast.error('Akses mikrofon ditolak.');
      else toast.error('Gagal mengenali suara.');
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="hidden md:flex fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(79,70,229,0.5)] items-center justify-center hover:scale-110 transition-transform z-50 group"
          >
            <Bot className="w-6 h-6 group-hover:animate-bounce" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-[340px] md:w-[400px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-white dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2.5 rounded-2xl shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white font-outfit text-sm">CelenganQu AI</h3>
                  <p className="text-[10px] text-slate-500 flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                    Online & Siap Membantu
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={handleClearChat}
                  title="Bersihkan Obrolan"
                  className="text-slate-400 hover:text-rose-500 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 h-[450px] p-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'ai' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mr-2 mt-auto shrink-0 shadow-sm border border-white/20">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] p-3.5 text-[13px] leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm'
                    }`}>
                      {msg.role === 'ai' ? (
                        <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none text-[13px]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Suggestions Chips */}
              {messages.length === 1 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 0.3 }}
                  className="flex flex-col gap-2 mt-4 ml-9"
                >
                  {SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(sug)}
                      className="text-left text-xs bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-2.5 px-3.5 rounded-[1rem] rounded-bl-sm transition-colors shadow-sm self-start max-w-[85%] font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 text-amber-500" />
                      {sug}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                   <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mr-2 mt-auto shrink-0 shadow-sm border border-white/20">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl rounded-bl-sm flex items-center space-x-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] relative z-20">
              <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] p-1.5 border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all shadow-inner">
                <button
                  onClick={toggleListen}
                  className={`p-3 rounded-xl transition-all ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30' 
                      : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  title="Voice Input"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <textarea
                  rows={1}
                  placeholder={isListening ? 'Mendengarkan suara...' : 'Tanya sesuatu ke AI...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 bg-transparent text-[13px] py-3 px-2 outline-none dark:text-white resize-none max-h-24 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700"
                  style={{ minHeight: '44px' }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="p-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
                CelenganQu AI mungkin menampilkan informasi yang tidak akurat.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
