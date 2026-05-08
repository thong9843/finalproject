import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatbotWidget from './ChatbotWidget';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 lg:ml-64 flex flex-col pt-16 min-w-0 transition-all duration-300">
                <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
                <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto min-w-0">
                    <Outlet />
                </main>
            </div>
            <ChatbotWidget />
        </div>
    );
};

export default Layout;
