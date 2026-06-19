import React from 'react';
import GuestHeader from './GuestHeader';

const GuestLayout = ({ children }) => {
    return (
        <div className="flex bg-slate-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <GuestHeader />
            <div className="flex-1 flex flex-col pt-16 min-w-0">
                <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default GuestLayout;
