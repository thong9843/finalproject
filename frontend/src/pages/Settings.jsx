import React from 'react';
import { Card, Form, Input, Button, Switch, Divider, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, BellOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';

const Settings = () => {
    const userCookie = Cookies.get('user');
    const user = userCookie ? JSON.parse(userCookie) : {};

    const handleSaveProfile = () => {
        message.success('Cập nhật thông tin thành công!');
    };

    const handleSavePassword = () => {
        message.success('Đổi mật khẩu thành công!');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt Hệ thống</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cột trái: Menu điều hướng cài đặt (tuỳ chọn) có thể gom chung, nhưng đây để thiết kế hiện đại */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="shadow-sm border-t-4 border-vluRed">
                        <div className="flex flex-col flex-wrap items-center text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <UserOutlined className="text-3xl text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">{user.full_name || 'Người dùng'}</h3>
                            <p className="text-sm text-gray-500 mb-2">{user.role || 'Vai trò'}</p>
                            <span className="bg-red-50 text-vluRed px-3 py-1 rounded-full text-xs font-semibold">
                                Khoa ID: {user.faculty_id || 'All'}
                            </span>
                        </div>
                    </Card>

                    <Card title="Tùy chọn hiển thị" className="shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <span className="flex items-center gap-2"><BellOutlined /> Nhận thông báo Email</span>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">Chế độ tối (Dark Mode)</span>
                            <Switch disabled />
                        </div>
                    </Card>
                </div>

                {/* Cột phải: Form thay đổi thông tin */}
                <div className="md:col-span-2 space-y-6">
                    <Card title="Chỉnh sửa thông tin cá nhân" className="shadow-sm">
                        <Form layout="vertical" onFinish={handleSaveProfile} initialValues={{ name: user.full_name, email: user.email }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                <Form.Item label="Họ và tên" name="name">
                                    <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
                                </Form.Item>
                                <Form.Item label="Email" name="email">
                                    <Input prefix={<MailOutlined />} disabled className="bg-gray-50" />
                                </Form.Item>
                            </div>
                            <Button type="primary" htmlType="submit" className="bg-vluRed">Lưu thay đổi</Button>
                        </Form>
                    </Card>

                    <Card title="Đổi mật khẩu" className="shadow-sm">
                        <Form layout="vertical" onFinish={handleSavePassword}>
                            <Form.Item label="Mật khẩu hiện tại" name="oldPassword" rules={[{ required: true, message: 'Vui lòng nhập!' }]}>
                                <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu cũ" />
                            </Form.Item>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                <Form.Item label="Mật khẩu mới" name="newPassword" rules={[{ required: true, message: 'Vui lòng nhập!' }]}>
                                    <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
                                </Form.Item>
                                <Form.Item label="Xác nhận mật khẩu mới" name="confirmPassword" rules={[{ required: true, message: 'Vui lòng nhập!' }]}>
                                    <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
                                </Form.Item>
                            </div>
                            <Button type="primary" htmlType="submit" className="bg-gray-800 hover:bg-gray-700">Đổi mật khẩu</Button>
                        </Form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Settings;
