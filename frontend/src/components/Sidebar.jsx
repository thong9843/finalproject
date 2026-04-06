import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardOutlined, BankOutlined, CalendarOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/enterprises',
            icon: <BankOutlined />,
            label: 'Quản lý Doanh nghiệp',
        },
        {
            key: '/activities',
            icon: <CalendarOutlined />,
            label: 'Quản lý Hoạt động',
        }
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
        } else {
            navigate(key);
        }
    };

    return (
        <div className="w-64 bg-white h-screen fixed left-0 top-0 shadow-md flex flex-col pt-4">
            <div className="flex justify-center mb-6">
                <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/12/Logo-Dai-Hoc-Van-Lang-H.png" alt="VLU Logo" className="h-12" />
            </div>
            <div className="flex-1 overflow-y-auto">
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    onClick={handleMenuClick}
                    items={items}
                    className="border-r-0"
                    theme="light"
                />
            </div>
            <div className="border-t border-gray-100 pb-4 pt-2">
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    onClick={handleMenuClick}
                    items={bottomItems}
                    className="border-r-0"
                    theme="light"
                />
            </div>
        </div>
    );
};

export default Sidebar;
