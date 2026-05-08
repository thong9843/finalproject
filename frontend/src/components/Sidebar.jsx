import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardOutlined, BankOutlined, CalendarOutlined, SettingOutlined, LogoutOutlined, TeamOutlined, BarChartOutlined, AppstoreOutlined, CloseOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark } = useTheme();

    const userCookie = Cookies.get('user');
    const user = userCookie ? JSON.parse(userCookie) : null;
    const isAdmin = user && user.role === 'ADMIN';

    const items = [
        {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: 'Trang chủ',
        },
        {
            key: '/kanban',
            icon: <AppstoreOutlined />,
            label: 'Kanban Board',
        },
        {
            key: '/calendar',
            icon: <CalendarOutlined />,
            label: 'Lịch sự kiện',
        },
        {
            key: 'enterprise-group',
            icon: <BankOutlined />,
            label: 'Quản lý doanh nghiệp',
            children: [
                {
                    key: '/enterprises',
                    label: 'Quản lý theo công ty',
                },
                {
                    key: '/activities',
                    label: 'Quản lý theo hoạt động',
                },
                {
                    key: '/mous',
                    label: 'Biên bản ghi nhớ (MOU)',
                },
            ]
        },
        {
            key: '/students',
            icon: <TeamOutlined />,
            label: 'Quản lý sinh viên',
        },
        {
            key: 'report-group',
            icon: <BarChartOutlined />,
            label: 'Báo cáo thống kê',
            children: [
                {
                    key: '/reports/students',
                    label: 'SV thực tập theo công ty',
                },
                {
                    key: '/reports/activities',
                    label: 'Hoạt động hợp tác',
                },
            ]
        },
        {
            key: 'system-settings',
            icon: <SettingOutlined />,
            label: 'Cấu hình hệ thống',
            children: [
                {
                    key: '/activity-types',
                    label: 'Loại hình hoạt động',
                },
                ...(isAdmin ? [{
                    key: '/users',
                    label: 'Quản lý người dùng',
                }] : [])
            ]
        },
    ];

    const bottomItems = [
        {
            key: '/settings',
            icon: <SettingOutlined />,
            label: 'Cài đặt',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined className="text-red-500" />,
            label: <span className="text-red-500 font-medium">Đăng xuất</span>,
        }
    ];

    const handleMenuClick = ({ key }) => {
        if (key === 'logout') {
            Cookies.remove('token');
            Cookies.remove('user');
            navigate('/login');
        } else if (key.startsWith('/')) {
            navigate(key);
            // Close sidebar on mobile after navigation
            if (onClose) onClose();
        }
    };

    return (
        <div
            className={`
                w-64 h-screen fixed left-0 top-0 z-30 flex flex-col pt-4
                bg-white dark:bg-gray-800
                shadow-lg dark:shadow-gray-900
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}
        >
            {/* Header with logo + close button on mobile */}
            <div className="flex justify-between items-center px-4 mb-4">
                <img
                    src="https://cdn.haitrieu.com/wp-content/uploads/2022/12/Logo-Dai-Hoc-Van-Lang-H.png"
                    alt="VLU Logo"
                    className="h-10 object-contain"
                />
                <button
                    className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                    onClick={onClose}
                >
                    <CloseOutlined className="text-lg" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    onClick={handleMenuClick}
                    items={items}
                    className="border-r-0 transition-colors duration-300"
                    theme={isDark ? 'dark' : 'light'}
                />
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 pb-4 pt-2">
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    onClick={handleMenuClick}
                    items={bottomItems}
                    className="border-r-0"
                    theme={isDark ? 'dark' : 'light'}
                />
            </div>
        </div>
    );
};

export default Sidebar;
