import React, { useState, useEffect } from 'react';
import { Dropdown, Avatar, Badge, List, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../utils/api';

const { Text } = Typography;

const Header = () => {
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
        <div className="w-80 bg-white p-4 shadow-lg rounded-lg border">
            <h4 className="font-bold mb-3 border-b pb-2">Sự kiện sắp tới (3 ngày)</h4>
            {upcomingEvents.length === 0 ? (
                <Text type="secondary">Không có sự kiện nào sắp diễn ra.</Text>
            ) : (
                <List
                    itemLayout="horizontal"
                    dataSource={upcomingEvents}
                    renderItem={item => (
                        <List.Item
                            className="cursor-pointer hover:bg-gray-50 px-2 rounded transition-colors"
                            onClick={() => navigate('/calendar')}
                        >
                            <List.Item.Meta
                                title={<Text strong>{item.title}</Text>}
                                description={`Bắt đầu: ${dayjs(item.start_date).format('DD/MM/YYYY')} - ${item.enterprise_name}`}
                            />
                        </List.Item>
                    )}
                    className="max-h-60 overflow-y-auto"
                />
            )}
        </div>
    );

    return (
        <div className="h-16 bg-white shadow-sm flex justify-end items-center px-8 fixed top-0 right-0 left-64 z-10 w-[calc(100%-16rem)] gap-6">
            <Dropdown dropdownRender={() => notificationContent} trigger={['click']} placement="bottomRight">
                <Badge count={upcomingEvents.length} size="small">
                    <Avatar className="bg-gray-100 text-gray-600 cursor-pointer" icon={<BellOutlined />} />
                </Badge>
            </Dropdown>

            {user && (
                <div className="flex items-center gap-3 border-l pl-6">
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
