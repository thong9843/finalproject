import React, { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../utils/api';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', values);
            Cookies.set('token', data.accessToken, { expires: 1 });
            Cookies.set('user', JSON.stringify(data), { expires: 1 });
            message.success('Đăng nhập thành công');
            navigate('/dashboard');
        } catch (error) {
            message.error(error.response?.data?.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-lg rounded-xl">
                <div className="flex flex-col items-center mb-8">
                    <img 
                        src="https://cdn.haitrieu.com/wp-content/uploads/2022/12/Logo-Dai-Hoc-Van-Lang-H.png" 
                        alt="VLU Logo" 
                        className="h-20 mb-4 object-contain"
                    />
                    <h2 className="text-2xl font-bold text-gray-800">Enterprise Link Manager</h2>
                </div>

                <Form name="login" onFinish={onFinish} size="large">
                    <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập Email!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="Email" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full bg-vluRed hover:bg-vluRedHover" loading={loading}>
                            ĐĂNG NHẬP
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
