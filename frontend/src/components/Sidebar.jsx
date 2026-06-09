import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardOutlined, BankOutlined, CalendarOutlined, SettingOutlined, LogoutOutlined, TeamOutlined, BarChartOutlined, AppstoreOutlined, CloseOutlined, ToolOutlined, DatabaseOutlined, FileTextOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ isOpen, onClose, collapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark } = useTheme();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isCollapsedDesktop = collapsed && !isMobile;

    const userCookie = Cookies.get('user');
    const user = userCookie ? JSON.parse(userCookie) : null;
    const isAdmin = user && user.role === 'ADMIN';

    const isManagerOrAdmin = user && (user.role === 'ADMIN' || user.role === 'FACULTY_MANAGER');

    const items = [
        {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: 'Trang chủ',
        },
        {
            key: '/tasks',
            icon: <AppstoreOutlined />,
            label: 'Nhiệm vụ',
        },
        {
            key: '/notes',
            icon: <FileTextOutlined />,
            label: 'Ghi chú',
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
            key: 'master-data-group',
            icon: <DatabaseOutlined />,
            label: 'Dữ liệu mẫu',
            children: [
                {
                    key: '/activity-types',
                    label: 'Loại hình hoạt động',
                },
                {
                    key: '/fields',
                    label: 'Lĩnh vực / Ngành nghề',
                },
                {
                    key: '/departments',
                    label: 'Bộ môn phân loại',
                }
            ]
        },
        {
            key: 'other-tools',
            icon: <ToolOutlined />,
            label: 'Công cụ khác',
            children: [
                ...(isManagerOrAdmin ? [
                    {
                        key: '/history',
                        label: 'Lịch sử hệ thống',
                    },
                    {
                        key: '/ai-import',
                        label: 'Import dữ liệu AI',
                    },
                    {
                        key: '/files',
                        label: 'Quản lý File & Rác',
                    }
                ] : []),
                ...(isAdmin ? [
                    {
                        key: '/users',
                        label: 'Quản lý người dùng',
                    },
                    {
                        key: '/duplicates',
                        label: 'Xử lý dữ liệu trùng lặp',
                    },
                    {
                        key: '/bulk-data',
                        label: 'Xử lý dữ liệu hàng loạt',
                    }
                ] : [])
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
                h-screen fixed left-0 top-0 z-40 flex flex-col pt-4 overflow-x-hidden
                bg-white dark:bg-gray-800
                shadow-lg dark:shadow-gray-900/50 border-r border-transparent dark:border-gray-700/50
                transition-all duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
                ${isCollapsedDesktop ? 'w-64 lg:w-20' : 'w-64'}
            `}
        >
            {/* Header with logo + close button on mobile */}
            <div className={`flex items-center mb-6 transition-all duration-300 ${isCollapsedDesktop ? 'justify-center px-2' : 'justify-center px-4 relative'}`}>
                <img
                    src={isCollapsedDesktop ? "https://cdn.haitrieu.com/wp-content/uploads/2022/12/Icon-Dai-Hoc-Van-Lang.png" : "https://upload.wikimedia.org/wikipedia/commons/d/d1/Logo_VLU_2022.png"}
                    alt="VLU Logo"
                    className={`${isCollapsedDesktop ? 'h-10 w-10' : 'h-10'} object-contain transition-all duration-300`}
                />
                {!isCollapsedDesktop && (
                    <button
                        className="lg:hidden absolute right-4 p-1 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                        onClick={onClose}
                    >
                        <CloseOutlined className="text-lg" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <Menu
                    mode="inline"
                    inlineCollapsed={isCollapsedDesktop}
                    selectedKeys={[location.pathname]}
                    onClick={handleMenuClick}
                    items={items}
                    className="border-r-0 transition-colors duration-300"
                    theme={isDark ? 'dark' : 'light'}
                />
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700/50 pb-0 pt-2">
                <Menu
                    mode="inline"
                    inlineCollapsed={isCollapsedDesktop}
                    selectedKeys={[location.pathname]}
                    onClick={handleMenuClick}
                    items={bottomItems}
                    className="border-r-0 mb-0"
                    theme={isDark ? 'dark' : 'light'}
                />
            </div>
        </div>
    );
};

export default Sidebar;
