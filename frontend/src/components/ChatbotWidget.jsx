import React, { useState, useRef, useEffect } from 'react';
import { MessageOutlined, CloseOutlined, SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import api from '../utils/api';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Xin chào! 👋 Tôi là **VLU Assistant** – trợ lý AI của hệ thống quản lý liên kết doanh nghiệp. Bạn có thể hỏi tôi về doanh nghiệp, sinh viên, hoạt động hoặc thống kê nhé!' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed || loading) return;

        const userMsg = { role: 'user', content: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setLoading(true);

        try {
            const res = await api.post('/chatbot', {
                message: trimmed,
                history: messages.filter(m => m.role !== 'system').slice(-10)
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: '❌ Không thể kết nối tới server. Vui lòng kiểm tra backend đang chạy.' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickQuestions = [
        'Thống kê tổng quan hệ thống?',
        'Danh sách doanh nghiệp đang triển khai?',
        'Sinh viên đang thực tập?',
        'Hoạt động sắp diễn ra?',
        'Danh sách MOU đã ký?',
        'Doanh nghiệp được đánh giá cao nhất?',
    ];

    const handleQuickQuestion = (q) => {
        setInputValue(q);
        setTimeout(() => {
            handleSend();
        }, 100);
    };

    // Render markdown: bold + newlines
    const renderContent = (text) => {
        return text.split('\n').map((line, lineIdx) => (
            <span key={lineIdx}>
                {lineIdx > 0 && <br />}
                {line.split('**').map((part, i) =>
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                )}
            </span>
        ));
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110 focus:outline-none"
                    style={{ boxShadow: '0 4px 20px rgba(218, 37, 29, 0.4)' }}
                >
                    <MessageOutlined style={{ fontSize: 24 }} />
                </button>
            )}

            {/* Chat Popup */}
            {isOpen && (
                <div 
                    className="fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl overflow-hidden"
                    style={{ 
                        width: 400, 
                        height: 560, 
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)', 
                        border: '1px solid rgba(0,0,0,0.06)' 
                    }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                                <RobotOutlined className="text-white text-lg" />
                            </div>
                            <div>
                                <div className="text-white font-semibold text-sm flex items-center gap-2">
                                    VLU Assistant
                                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full font-normal">Gemini AI</span>
                                </div>
                                <div className="text-white/70 text-xs">Trợ lý AI thông minh · Gemini 2.0 Flash</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="text-white/80 hover:text-white transition-colors focus:outline-none"
                        >
                            <CloseOutlined style={{ fontSize: 16 }} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ backgroundColor: '#f8f9fb' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                        <RobotOutlined className="text-red-500 text-xs" />
                                    </div>
                                )}
                                <div 
                                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white rounded-br-md' 
                                            : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-md'
                                    }`}
                                >
                                    {renderContent(msg.content)}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center ml-2 flex-shrink-0 mt-1">
                                        <UserOutlined className="text-gray-500 text-xs" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                    <RobotOutlined className="text-red-500 text-xs" />
                                </div>
                                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions (only show if few messages) */}
                    {messages.length <= 2 && (
                        <div className="px-4 py-2 flex gap-2 flex-wrap flex-shrink-0 bg-white border-t border-gray-100">
                            {quickQuestions.map((q, i) => (
                                <button 
                                    key={i}
                                    onClick={() => { setInputValue(q); }}
                                    className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all focus:outline-none"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 bg-white">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập câu hỏi..."
                                disabled={loading}
                                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all placeholder-gray-400"
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !inputValue.trim()}
                                className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl flex items-center justify-center hover:shadow-md disabled:opacity-40 transition-all focus:outline-none"
                            >
                                <SendOutlined style={{ fontSize: 16 }} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatbotWidget;
