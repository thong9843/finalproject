import React from 'react';
import { Dropdown, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();
    const userCookie = Cookies.get('user');
    const user = userCookie ? JSON.parse(userCookie) : null;

    const handleLogout = () => {
        Cookies.remove('token');
        Cookies.remove('user');
        navigate('/login');
    };

    const items = [
        {
            key: '1',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            onClick: handleLogout
        }
    ];

    return (
        <div className="h-16 bg-white shadow-sm flex justify-end items-center px-8 fixed top-0 right-0 left-64 z-10 w-[calc(100%-16rem)]">
            {user && (
                <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-medium">{user.full_name} ({user.role})</span>
                    <Dropdown menu={{ items }} placement="bottomRight" arrow>
                        <Avatar className="bg-vluRed cursor-pointer" icon={<UserOutlined />} />
                    </Dropdown>
                </div>
            )}
        </div>
    );
};

export default Header;
