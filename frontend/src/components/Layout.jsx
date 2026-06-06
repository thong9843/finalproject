import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatbotWidget from './ChatbotWidget';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
    const [chatbotOpen, setChatbotOpen] = useState(false);

    useEffect(() => {
        const handleOpenChat = () => {
            setChatbotOpen(true);
        };
        window.addEventListener('open-chatbot', handleOpenChat);
        return () => window.removeEventListener('open-chatbot', handleOpenChat);
    }, []);

    const handleCollapseToggle = () => {
        setCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar-collapsed', String(next));
            return next;
        });
    };

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
                    <Outlet />
                </main>
            </div>
            <ChatbotWidget isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
        </div>
    );
};

export default Layout;
