import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatbotWidget from './ChatbotWidget';

const Layout = () => {
    return (
        <div className="flex bg-white min-h-screen text-gray-800 transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col pt-16 min-w-0">
                <Header />
                <main className="p-8 flex-1 overflow-auto min-w-0">
                    <Outlet />
                </main>
            </div>
            <ChatbotWidget />
        </div>
    );
};

export default Layout;
