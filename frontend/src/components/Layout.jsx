import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Tour } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatbotWidget from './ChatbotWidget';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
    const [chatbotOpen, setChatbotOpen] = useState(false);
    const [tourOpen, setTourOpen] = useState(false);

    useEffect(() => {
        const handleOpenChat = () => {
            setChatbotOpen(true);
        };
        window.addEventListener('open-chatbot', handleOpenChat);
        return () => window.removeEventListener('open-chatbot', handleOpenChat);
    }, []);

    useEffect(() => {
        // Tự động kích hoạt tour ở lần đầu đăng nhập sau 1.5 giây
        const hasCompletedTour = localStorage.getItem('vlu-take-tour-completed');
        if (!hasCompletedTour) {
            const timer = setTimeout(() => {
                setTourOpen(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        // Lắng nghe sự kiện để kích hoạt lại tour khi người dùng yêu cầu
        const handleStartTour = () => {
            setTourOpen(true);
        };
        window.addEventListener('start-tour', handleStartTour);
        return () => window.removeEventListener('start-tour', handleStartTour);
    }, []);

    const handleTourClose = () => {
        localStorage.setItem('vlu-take-tour-completed', 'true');
        setTourOpen(false);
    };

    const handleCollapseToggle = () => {
        setCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar-collapsed', String(next));
            return next;
        });
    };

    const tourSteps = [
        {
            title: 'Chào mừng Thầy/Cô! 👋',
            description: (
                <div className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Chào mừng Thầy/Cô đến với hệ thống <strong>VLU Enterprise Link</strong> - Phần mềm quản lý các hoạt động hợp tác doanh nghiệp của Khoa Công nghệ Thông tin.
                </div>
            ),
            target: () => document.getElementById('tour-sidebar-logo'),
        },
        {
            title: 'Thanh điều hướng chính 📂',
            description: (
                <div className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Đây là menu chính giúp Thầy/Cô truy cập các chức năng quản lý: thông tin Doanh nghiệp, Biên bản ghi nhớ (MOU), Lịch sự kiện và danh sách Sinh viên thực tập.
                </div>
            ),
            target: () => document.getElementById('tour-sidebar'),
        },
        {
            title: 'Trợ lý ảo AI thông minh 🤖',
            description: (
                <div className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Nhấp vào đây để mở chatbot <strong>VLU AI Assistant</strong>. Thầy/Cô có thể hỏi đáp nhanh số liệu thống kê doanh nghiệp, phân tích ảnh hoặc lưu trực tiếp nội dung chat làm Ghi chú.
                </div>
            ),
            target: () => document.getElementById('tour-ai-button'),
        },
        {
            title: 'Hồ sơ cá nhân & Cài đặt ⚙️',
            description: (
                <div className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Thầy/Cô có thể chỉnh sửa thông tin cá nhân, chuyển đổi nhanh giao diện tối (Dark mode) hoặc xem lại hướng dẫn nhanh này bất kỳ lúc nào tại đây.
                </div>
            ),
            target: () => document.getElementById('tour-user-profile'),
        }
    ];

    return (
        <div className="flex bg-slate-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-300">
            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Chatbot Overlay for mobile */}
            {chatbotOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[9999] lg:hidden"
                    onClick={() => setChatbotOpen(false)}
                />
            )}

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} />

            <div className={`flex-1 flex flex-col pt-16 min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'} ${chatbotOpen ? 'lg:mr-[400px]' : 'lg:mr-0'}`}>
                <Header 
                    onMenuToggle={() => setSidebarOpen(prev => !prev)} 
                    collapsed={collapsed}
                    onCollapseToggle={handleCollapseToggle}
                    chatbotOpen={chatbotOpen}
                    onChatbotToggle={() => setChatbotOpen(prev => !prev)}
                />
                <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto min-w-0">
                    {children || <Outlet />}
                </main>
            </div>
            <ChatbotWidget isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
            <Tour open={tourOpen} onClose={handleTourClose} steps={tourSteps} />
        </div>
    );
};

export default Layout;
