import { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Bot, X, Send, Mic, Loader2, MessageSquare, ChevronDown } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Halo! Saya Duitku AI. Kamu bisa mencatat transaksi atau tanya soal anggaranmu ke saya.' }
  ]);
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
  }, [messages, isTyping]);

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
        toast.success('Transaksi berhasil dicatat oleh AI!');
      }

    } catch (err) {
      console.error(err);
      const fallbackReply = err.response?.data?.reply || 'Maaf, saya sedang mengalami gangguan sistem. Coba lagi nanti ya!';
      setMessages(prev => [...prev, { role: 'ai', text: fallbackReply }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Browser Anda tidak mendukung fitur suara.');
      return;
    }

    if (isListening) return; // Wait to finish

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
      toast.error('Gagal mengenali suara.');
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 animate-bounce"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Duitku AI</h3>
                <p className="text-[10px] text-indigo-100 flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 h-80 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-2xl rounded-tl-sm flex items-center space-x-1.5 shadow-sm">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
            <button 
              onClick={toggleListen}
              className={`p-2.5 rounded-full transition-colors ${
                isListening ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder={isListening ? 'Mendengarkan...' : 'Ketik pesan...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-sm py-2.5 px-4 rounded-full outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all dark:text-white"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="p-2.5 bg-indigo-600 text-white rounded-full disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
