import React from 'react';
import { Button } from 'antd';
import { LoginOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const GuestHeader = () => {
    const navigate = useNavigate();
    const { isDark, toggleDark } = useTheme();

    return (
        <div className="h-16 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between px-4 sm:px-6 md:px-8 fixed top-0 left-0 right-0 z-50 transition-colors duration-300">
            {/* Left side: Logo & Brand */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/login')}>
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/d/d1/Logo_VLU_2022.png"
                    alt="VLU Logo"
                    className="h-8 sm:h-9 object-contain"
                />
                <span className="hidden sm:inline-block h-6 w-[1px] bg-gray-200 dark:bg-gray-700" />
                <span className="text-gray-800 dark:text-gray-100 font-bold text-xs sm:text-sm md:text-base tracking-wide truncate">
                    Hệ thống Quản lý Liên kết Doanh nghiệp
                </span>
            </div>

            {/* Right side: Theme & Login Button */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={toggleDark}
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                    aria-label="Toggle theme"
                >
                    {isDark ? <SunOutlined className="text-lg text-yellow-400" /> : <MoonOutlined className="text-lg" />}
                </button>

                {/* Login Button */}
                <Button
                    type="primary"
                    icon={<LoginOutlined />}
                    onClick={() => navigate('/login')}
                    className="bg-vluRed hover:bg-vluRedHover border-none rounded-lg h-9 font-semibold text-xs sm:text-sm px-4 flex items-center justify-center shadow-md shadow-red-500/20 transition-all hover:scale-105"
                >
                    Đăng nhập
                </Button>
            </div>
        </div>
    );
};

export default GuestHeader;
