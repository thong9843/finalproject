import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col pt-16">
                <Header />
                <main className="p-8 flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
