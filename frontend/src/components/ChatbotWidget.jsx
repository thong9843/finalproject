import React, { useState, useRef, useEffect } from 'react';
import { MessageOutlined, CloseOutlined, SendOutlined, RobotOutlined, UserOutlined, PictureOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import api from '../utils/api';

const SLASH_COMMANDS = [
    { cmd: '/help', label: 'Xem hướng dẫn và cách sử dụng trợ lý ảo', desc: 'Trợ giúp' },
    { cmd: '/stats', label: 'Thống kê tổng quan hệ thống (Doanh nghiệp, Sinh viên, GPA)', desc: 'Thống kê' },
    { cmd: '/mous', label: 'Thống kê chi tiết các bản MOU đã ký (quốc gia, năm, đơn vị)', desc: 'Thống kê MOU' },
    { cmd: '/ratings', label: 'Danh sách top doanh nghiệp được đánh giá cao nhất', desc: 'Đánh giá' },
    { cmd: '/upcoming', label: 'Xem các hoạt động liên kết sắp diễn ra trong 7 ngày tới', desc: 'Hoạt động mới' },
    { cmd: '/rules', label: 'Báo cáo quy tắc bảo mật & quy định nghiệp vụ thực tập', desc: 'Quy tắc' },
    { cmd: '/clear', label: 'Dọn sạch lịch sử chat hiện tại để bắt đầu cuộc hội thoại mới', desc: 'Xóa lịch sử' }
];

const ChatbotWidget = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Xin chào! 👋 Tôi là **VLU Assistant** – trợ lý AI của hệ thống quản lý liên kết doanh nghiệp. Bạn có thể hỏi tôi về doanh nghiệp, sinh viên, hoạt động hoặc thống kê nhé!' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null); // { base64: '...', previewUrl: '...', mimeType: '...' }
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

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

    // Listen to custom event to pre-populate text from a Note card
    useEffect(() => {
        const handleOpenChat = (e) => {
            if (e.detail && e.detail.prompt) {
                setInputValue(e.detail.prompt);
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }
        };
        window.addEventListener('open-chatbot', handleOpenChat);
        return () => window.removeEventListener('open-chatbot', handleOpenChat);
    }, []);

    const handleSend = async () => {
        const trimmed = inputValue.trim();
        if ((!trimmed && !selectedImage) || loading) return;

        const imagePayload = selectedImage ? {
            data: selectedImage.base64,
            mimeType: selectedImage.mimeType
        } : null;

        const userMsg = { 
            role: 'user', 
            content: trimmed,
            image: selectedImage?.previewUrl || null 
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setSelectedImage(null);
        setShowSlashMenu(false);
        setLoading(true);

        try {
            const res = await api.post('/chatbot', {
                message: trimmed || 'Hãy phân tích hình ảnh này',
                image: imagePayload,
                history: messages.filter(m => msg => msg.role !== 'system').slice(-10)
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);

            // Action triggers from AI
            if (res.data.action) {
                const action = res.data.action;
                if (action.actionType === 'create_enterprise') {
                    navigate('/enterprises', { state: { openModalWithData: action } });
                } else if (action.actionType === 'create_student') {
                    navigate('/students', { state: { openModalWithData: action } });
                } else if (action.actionType === 'create_activity') {
                    navigate('/activities', { state: { openModalWithData: action } });
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: '❌ Không thể kết nối tới server hoặc xảy ra lỗi phân tích AI.' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMessageAsNote = async (text) => {
        try {
            await api.post('/notes', {
                title: 'Trích xuất từ Chatbot AI',
                content: text,
                color: '#fef08a' // default yellow
            });
            message.success('Đã lưu tin nhắn thành Ghi chú thành công!');
            // Notify Kanban page notes tab to reload notes
            window.dispatchEvent(new CustomEvent('refresh-notes'));
        } catch (error) {
            message.error('Lỗi khi lưu ghi chú: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val);
        if (val === '/') {
            setShowSlashMenu(true);
        } else if (!val.startsWith('/')) {
            setShowSlashMenu(false);
        }
    };

    const handleSelectCommand = (cmd) => {
        if (cmd === '/clear') {
            setMessages([
                { role: 'assistant', content: '🧹 Lịch sử trò chuyện đã được dọn sạch. Bạn cần tôi trợ giúp thêm gì?' }
            ]);
            setInputValue('');
        } else {
            setInputValue(cmd);
        }
        setShowSlashMenu(false);
        inputRef.current?.focus();
    };

    const processImageFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage({
                base64: reader.result.split(',')[1],
                previewUrl: reader.result,
                mimeType: file.type
            });
        };
        reader.readAsDataURL(file);
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            processImageFile(file);
            e.target.value = '';
        }
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    processImageFile(file);
                    e.preventDefault();
                    break;
                }
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                processImageFile(file);
            }
        }
    };

    const quickQuestions = [
        'Thống kê tổng quan hệ thống?',
        'Doanh nghiệp ngành Công nghệ thông tin?',
        'Sinh viên đang thực tập?',
        'Chi tiết công ty FPT?',
        'Danh sách MOU đã ký?',
        'Doanh nghiệp được đánh giá cao nhất?',
    ];

    const handleQuickQuestion = (q) => {
        setInputValue(q);
        setTimeout(() => {
            handleSend();
        }, 100);
    };

    const renderContent = (text) => {
        return text.split('\n').map((line, lineIdx) => (
            <span key={lineIdx}>
                {lineIdx > 0 && <br />}
                {line.split('**').map((part, i) =>
                    i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900 dark:text-white">{part}</strong> : part
                )}
            </span>
        ));
    };

    return (
        <div 
            className={`fixed right-0 top-0 h-screen bg-white dark:bg-gray-800 shadow-2xl z-[10000] flex flex-col transition-all duration-300 transform border-l border-gray-200 dark:border-gray-700/50 ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{ 
                width: '100%',
                maxWidth: 400,
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
                    onClick={onClose} 
                    className="text-white/80 hover:text-white transition-colors focus:outline-none"
                >
                    <CloseOutlined style={{ fontSize: 16 }} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                <RobotOutlined className="text-red-500 text-xs" />
                            </div>
                        )}
                        <div 
                            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed flex flex-col ${
                                msg.role === 'user' 
                                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white rounded-br-md' 
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700 rounded-bl-md'
                            }`}
                        >
                            {msg.image && (
                                <img 
                                    src={msg.image} 
                                    alt="Sent attachment" 
                                    className="max-w-[200px] max-h-[150px] object-cover rounded-lg mb-2 shadow-sm border border-black/10 dark:border-white/10" 
                                />
                            )}
                            {msg.content && renderContent(msg.content)}

                            {/* Save message as note option */}
                            {msg.role === 'assistant' && msg.content && (
                                <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-gray-700/60 flex justify-end">
                                    <button
                                        onClick={() => handleSaveMessageAsNote(msg.content)}
                                        className="text-[10px] text-red-600 dark:text-red-400 font-medium hover:underline flex items-center gap-1.5 focus:outline-none"
                                        title="Lưu tin nhắn này làm Ghi chú"
                                    >
                                        <FileTextOutlined style={{ fontSize: 10 }} />
                                        Lưu làm Ghi chú
                                    </button>
                                </div>
                            )}
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
                        <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700">
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

            {/* Quick Questions */}
            {messages.length <= 2 && (
                <div className="px-4 py-2 flex gap-2 flex-wrap flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                    {quickQuestions.map((q, i) => (
                        <button 
                            key={i}
                            onClick={() => handleQuickQuestion(q)}
                            className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all focus:outline-none"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Image Preview Area */}
            {selectedImage && (
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-3 relative flex-shrink-0">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img src={selectedImage.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black/90 focus:outline-none transition-colors"
                        >
                            <CloseOutlined style={{ fontSize: 10 }} />
                        </button>
                    </div>
                    <div className="text-xs text-gray-500">Hình ảnh sẵn sàng đính kèm để phân tích</div>
                </div>
            )}

            {/* Input Bar with Slash Menu */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 relative">
                {/* Slash Commands Menu */}
                {showSlashMenu && (
                    <div className="absolute bottom-full mb-2 left-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-60 overflow-y-auto">
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                            Lệnh nhanh (Slash Commands)
                        </div>
                        {SLASH_COMMANDS.map((sc, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelectCommand(sc.cmd)}
                                className="px-4 py-3 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition-colors focus:outline-none border-b border-gray-50 dark:border-gray-800/50 last:border-b-0"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-sm text-red-600 dark:text-red-500">{sc.cmd}</span>
                                    <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{sc.label}</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full font-semibold">{sc.desc}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSlashMenu(prev => !prev)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all focus:outline-none border ${
                            showSlashMenu 
                                ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/30' 
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-gray-700/50 dark:border-gray-700 dark:text-gray-400'
                        }`}
                        title="Lệnh nhanh"
                    >
                        <span className="font-bold text-base">/</span>
                    </button>

                    <label
                        htmlFor="chatbot-image-upload"
                        className="w-10 h-10 bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-gray-700/50 dark:border-gray-700 dark:text-gray-400 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                        title="Đính kèm ảnh"
                    >
                        <PictureOutlined style={{ fontSize: 16 }} />
                    </label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="chatbot-image-upload"
                        onChange={handleImageChange}
                    />

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder="Nhập câu hỏi hoặc gõ /..."
                        disabled={loading}
                        className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all placeholder-gray-400"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || (!inputValue.trim() && !selectedImage)}
                        className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl flex items-center justify-center hover:shadow-md disabled:opacity-40 transition-all focus:outline-none"
                    >
                        <SendOutlined style={{ fontSize: 16 }} />
                    </button>
                </div>
            </div>

            {/* Drag and Drop Overlay */}
            {isDragging && (
                <div 
                    className="absolute inset-0 bg-red-600/10 dark:bg-red-950/20 backdrop-blur-[2px] border-2 border-dashed border-red-500 rounded-2xl m-2 z-50 flex flex-col items-center justify-center pointer-events-none animate-fade-in"
                >
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 border border-red-100 dark:border-red-900/30 scale-105 transition-transform duration-300">
                        <PictureOutlined className="text-red-500 text-3xl animate-pulse" />
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Thả ảnh vào đây</div>
                        <div className="text-xs text-gray-500">Hỗ trợ các định dạng PNG, JPG, WEBP...</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatbotWidget;
