import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, message, Space, Card, Spin, Badge } from 'antd';
import { ReloadOutlined, EyeOutlined, MailOutlined, SendOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const EmailLogs = () => {
    const [loading, setLoading] = useState(false);
    const [emails, setEmails] = useState([]);
    const [triggering, setTriggering] = useState(false);
    const [activeEmail, setActiveEmail] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const res = await api.get('/mous/email-logs/all');
            setEmails(res.data);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách email:', error);
            message.error('Không thể tải danh sách email logs.');
        } finally {
            setLoading(false);
        }
    };

    const triggerExpiryCheck = async () => {
        setTriggering(true);
        try {
            const res = await api.post('/mous/trigger-expiry-check');
            message.success(`${res.data.message} Tìm thấy ${res.data.count} hợp đồng sắp hết hạn.`);
            // Refresh logs
            await fetchEmails();
        } catch (error) {
            console.error('Lỗi khi kích hoạt kiểm tra:', error);
            message.error('Lỗi kích hoạt kiểm tra sự kiện.');
        } finally {
            setTriggering(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, []);

    const showEmailDetail = (email) => {
        setActiveEmail(email);
        setIsDetailOpen(true);
    };

    const columns = [
        {
            title: 'Mã Email',
            dataIndex: 'id',
            key: 'id',
            width: 150,
            render: (text) => <span className="font-mono text-slate-500 text-xs">{text}</span>
        },
        {
            title: 'Người gửi',
            dataIndex: 'from',
            key: 'from',
            width: 200,
            render: (text) => <span className="text-slate-600 dark:text-gray-300 text-xs">{text}</span>
        },
        {
            title: 'Người nhận (Faculty Manager)',
            dataIndex: 'to',
            key: 'to',
            width: 200,
            render: (text) => <Tag color="blue" className="font-medium">{text}</Tag>
        },
        {
            title: 'Tiêu đề email',
            dataIndex: 'subject',
            key: 'subject',
            render: (text) => <span className="font-semibold text-slate-800 dark:text-gray-100">{text}</span>
        },
        {
            title: 'Thời gian gửi',
            dataIndex: 'sentAt',
            key: 'sentAt',
            width: 160,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '---'
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Button 
                    type="primary" 
                    size="small" 
                    icon={<EyeOutlined />} 
                    onClick={() => showEmailDetail(record)}
                    className="flex items-center gap-1"
                >
                    Xem thư
                </Button>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100 m-0 flex items-center gap-2">
                        <MailOutlined className="text-red-500" /> Lịch sử gửi Email & Nhắc nhở
                    </h1>
                    <p className="text-slate-500 dark:text-gray-400 m-0 mt-1 text-sm">
                        Toàn bộ email cảnh báo hợp đồng MOU sắp hết hạn và nhắc nhở sự kiện được lưu trữ cục bộ tại đây để phục vụ kiểm thử.
                    </p>
                </div>
                <Space>
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={fetchEmails} 
                        loading={loading}
                        className="rounded-lg flex items-center gap-1"
                    >
                        Làm mới
                    </Button>
                    <Button 
                        type="primary" 
                        danger
                        icon={<SendOutlined />} 
                        onClick={triggerExpiryCheck} 
                        loading={triggering}
                        className="rounded-lg flex items-center gap-1"
                    >
                        Kiểm tra & Gửi cảnh báo ngay
                    </Button>
                </Space>
            </div>

            <Card className="shadow-sm rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                    <strong>💡 Chế độ chạy thử nghiệm:</strong> Máy chủ SMTP ảo của hệ thống đang lắng nghe trên cổng <code>1025</code>. 
                    Khi bạn bấm nút <strong>Kiểm tra & Gửi cảnh báo ngay</strong>, hệ thống sẽ quét các hợp đồng MOUs có ngày kết thúc sắp đến (trong vòng 3 ngày) và tự động tạo email gửi cho Trưởng Khoa (Faculty Manager) tương ứng.
                </div>

                <Table 
                    dataSource={emails} 
                    columns={columns} 
                    rowKey="id" 
                    loading={loading} 
                    pagination={{ pageSize: 10 }}
                    className="border border-slate-100 dark:border-gray-700 rounded-lg overflow-hidden"
                />
            </Card>

            <Modal
                title={
                    <div className="flex items-center gap-2 border-b pb-3 mr-6">
                        <MailOutlined className="text-red-500 text-lg" />
                        <div>
                            <div className="text-base font-bold text-slate-800 dark:text-gray-100">
                                {activeEmail?.subject}
                            </div>
                            <div className="text-xs text-slate-400 font-normal mt-1">
                                Gửi đến: <span className="text-blue-500 font-medium">{activeEmail?.to}</span> | lúc {activeEmail?.sentAt ? dayjs(activeEmail?.sentAt).format('DD/MM/YYYY HH:mm:ss') : ''}
                            </div>
                        </div>
                    </div>
                }
                open={isDetailOpen}
                onCancel={() => setIsDetailOpen(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsDetailOpen(false)}>
                        Đóng
                    </Button>
                ]}
                width={700}
                bodyStyle={{ padding: '20px 0' }}
            >
                {activeEmail ? (
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-4 max-h-[500px] overflow-auto">
                        {activeEmail.body && activeEmail.body.includes('<div') ? (
                            <div 
                                dangerouslySetInnerHTML={{ __html: activeEmail.body }}
                                className="bg-white p-4 rounded border dark:text-slate-800"
                            />
                        ) : (
                            <pre className="whitespace-pre-wrap font-mono text-xs p-4 bg-white dark:bg-gray-800 border rounded dark:text-gray-300">
                                {activeEmail.body}
                            </pre>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Spin />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default EmailLogs;
