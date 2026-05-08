import React, { useState, useEffect } from 'react';
import { Dropdown, Avatar, Badge, List, Typography, Button } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined, MenuOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../utils/api';

const { Text } = Typography;

const Header = ({ onMenuToggle }) => {
    const navigate = useNavigate();
    const userCookie = Cookies.get('user');
    const user = userCookie ? JSON.parse(userCookie) : null;
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    useEffect(() => {
        if (user) {
            fetchUpcoming();
        }
    }, [user]);

    const fetchUpcoming = async () => {
        try {
            const res = await api.get('/activities/upcoming');
            setUpcomingEvents(res.data);
        } catch (error) {
            console.error('Failed to fetch upcoming events', error);
        }
    };

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

    const notificationContent = (
        <div className="w-72 sm:w-80 bg-white dark:bg-gray-800 p-4 shadow-lg rounded-lg border dark:border-gray-700 transition-colors duration-300">
            <h4 className="font-bold mb-3 border-b pb-2 dark:border-gray-600 dark:text-gray-100">Sự kiện sắp tới (3 ngày)</h4>
            {upcomingEvents.length === 0 ? (
                <Text type="secondary">Không có sự kiện nào sắp diễn ra.</Text>
            ) : (
                <List
                    itemLayout="horizontal"
                    dataSource={upcomingEvents}
                    renderItem={item => (
                        <List.Item
                            className="cursor-pointer hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-700 px-2 rounded transition-colors"
                            onClick={() => navigate('/calendar')}
                        >
                            <List.Item.Meta
                                title={<Text strong>{item.title}</Text>}
                                description={<span>Bắt đầu: {dayjs(item.start_date).format('DD/MM/YYYY')} - {item.enterprise_name}</span>}
                            />
                        </List.Item>
                    )}
                    className="max-h-60 overflow-y-auto"
                />
            )}
        </div>
    );

    return (
        <div className="h-16 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex items-center px-4 sm:px-6 fixed top-0 right-0 left-0 lg:left-64 z-10 gap-3 sm:gap-6 transition-colors duration-300">
            {/* Hamburger - chỉ hiện trên mobile */}
            <button
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={onMenuToggle}
                aria-label="Toggle menu"
            >
                <MenuOutlined className="text-lg" />
            </button>

            {/* Logo nhỏ cho mobile */}
            <div className="lg:hidden flex-1 flex items-center">
                <img
                    src="https://cdn.haitrieu.com/wp-content/uploads/2022/12/Logo-Dai-Hoc-Van-Lang-H.png"
                    alt="VLU"
                    className="h-7 object-contain"
                />
            </div>

            {/* Spacer for desktop */}
            <div className="hidden lg:flex flex-1" />

            {/* Notification bell */}
            <Dropdown dropdownRender={() => notificationContent} trigger={['click']} placement="bottomRight">
                <Badge count={upcomingEvents.length} size="small">
                    <Avatar
                        className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        icon={<BellOutlined />}
                    />
                </Badge>
            </Dropdown>

            {user && (
                <div className="flex items-center gap-2 sm:gap-3 border-l border-gray-200 dark:border-gray-600 pl-3 sm:pl-6 transition-colors duration-300">
                    <span className="hidden sm:inline text-gray-600 dark:text-gray-300 font-medium text-sm">
                        {user.full_name}
                        <span className="hidden md:inline"> ({user.role})</span>
                    </span>
                    <Dropdown menu={{ items }} placement="bottomRight" arrow>
                        <Avatar className="bg-vluRed cursor-pointer hover:opacity-90 transition-opacity" icon={<UserOutlined />} />
                    </Dropdown>
                </div>
            )}
        </div>
    );
};

export default Header;
