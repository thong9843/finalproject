import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Modal, Tag, Spin, Tooltip } from 'antd';
import { DeleteOutlined, WarningOutlined, ExclamationCircleOutlined, ClearOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import axios from 'axios';

const { confirm } = Modal;

const DuplicateDataTool = () => {
    const [duplicates, setDuplicates] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDuplicates = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('token');
            const res = await axios.get('/api/enterprises/duplicates/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDuplicates(res.data);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu trùng:', error);
            message.error('Không thể tải danh sách dữ liệu trùng.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = "Xử lý Trùng lặp Dữ liệu | VLU Enterprise Link Manager";
        fetchDuplicates();
    }, []);

    const handleDeleteEnterprise = (id) => {
        confirm({
            title: 'Bạn có chắc chắn muốn xoá doanh nghiệp này?',
            icon: <ExclamationCircleOutlined />,
            content: 'Tất cả các hoạt động, đại diện và địa chỉ của doanh nghiệp này sẽ bị xoá.',
            okText: 'Xoá',
            okType: 'danger',
            cancelText: 'Huỷ',
            onOk: async () => {
                try {
                    const token = Cookies.get('token');
                    await axios.delete(`/api/enterprises/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    message.success('Đã xoá doanh nghiệp thành công.');
                    fetchDuplicates();
                } catch (error) {
                    console.error('Lỗi khi xoá doanh nghiệp:', error);
                    message.error('Không thể xoá doanh nghiệp.');
                }
            }
        });
    };

    const handleDeleteActivitiesOnly = (id) => {
        confirm({
            title: 'Bạn có chắc chắn muốn xoá tất cả hoạt động của doanh nghiệp này?',
            icon: <WarningOutlined />,
            content: 'Doanh nghiệp vẫn sẽ được giữ lại, nhưng tất cả hoạt động sẽ bị xoá.',
            okText: 'Chỉ xoá hoạt động',
            okType: 'danger',
            cancelText: 'Huỷ',
            onOk: async () => {
                try {
                    const token = Cookies.get('token');
                    await axios.delete(`/api/enterprises/${id}/activities-only`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    message.success('Đã xoá các hoạt động thành công.');
                    fetchDuplicates();
                } catch (error) {
                    console.error('Lỗi khi xoá hoạt động:', error);
                    message.error('Không thể xoá các hoạt động.');
                }
            }
        });
    };

    const handleDeleteNewest = (group) => {
        // Group is ordered by created_at DESC, so the oldest is the last one.
        // We delete all except the last one.
        const toDelete = group.enterprises.slice(0, -1);
        
        if (toDelete.length === 0) return;

        confirm({
            title: 'Bạn có chắc chắn muốn xoá các bản ghi mới nhất?',
            icon: <WarningOutlined />,
            content: `Hệ thống sẽ xoá ${toDelete.length} doanh nghiệp tạo sau, CHỈ GIỮ LẠI bản ghi cũ nhất (ID: ${group.enterprises[group.enterprises.length - 1].id}).`,
            okText: 'Xoá mới nhất',
            okType: 'danger',
            cancelText: 'Huỷ',
            onOk: async () => {
                try {
                    const token = Cookies.get('token');
                    await Promise.all(toDelete.map(ent => 
                        axios.delete(`/api/enterprises/${ent.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                    ));
                    message.success(`Đã xoá ${toDelete.length} doanh nghiệp thành công.`);
                    fetchDuplicates();
                } catch (error) {
                    console.error('Lỗi khi xoá hàng loạt:', error);
                    message.error('Có lỗi xảy ra khi xoá một số doanh nghiệp.');
                    fetchDuplicates(); // Reload to see what was actually deleted
                }
            }
        });
    };

    const handleDeleteAllNewest = () => {
        let toDelete = [];
        duplicates.forEach(group => {
            const newest = group.enterprises.slice(0, -1);
            toDelete = toDelete.concat(newest);
        });

        if (toDelete.length === 0) {
            message.info('Không có dữ liệu trùng nào cần dọn dẹp.');
            return;
        }

        confirm({
            title: 'Dọn dẹp tất cả dữ liệu trùng lặp?',
            icon: <WarningOutlined />,
            content: `Hệ thống sẽ xoá tổng cộng ${toDelete.length} doanh nghiệp trùng lặp trên tất cả các nhóm, chỉ giữ lại các bản ghi gốc (cũ nhất) cho mỗi công ty. Hành động này không thể hoàn tác.`,
            okText: 'Xoá tất cả trùng lặp',
            okType: 'danger',
            cancelText: 'Huỷ',
            onOk: async () => {
                setLoading(true);
                try {
                    const token = Cookies.get('token');
                    await Promise.all(toDelete.map(ent => 
                        axios.delete(`/api/enterprises/${ent.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                    ));
                    message.success(`Đã xoá hàng loạt ${toDelete.length} doanh nghiệp trùng lặp thành công.`);
                    fetchDuplicates();
                } catch (error) {
                    console.error('Lỗi khi xoá hàng loạt:', error);
                    message.error('Có lỗi xảy ra khi dọn dẹp hàng loạt.');
                    fetchDuplicates();
                }
            }
        });
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Mã số thuế',
            dataIndex: 'tax_code',
            key: 'tax_code',
            render: (text) => text || <span className="text-gray-400 italic">Trống</span>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'blue';
                if (status === 'Đã hoàn thành') color = 'green';
                else if (status === 'Tiềm năng') color = 'orange';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Số hoạt động',
            dataIndex: 'activity_count',
            key: 'activity_count',
            align: 'center',
            render: (count) => (
                <Tag color={count > 0 ? 'volcano' : 'default'}>{count}</Tag>
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'right',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Chỉ xoá các hoạt động của doanh nghiệp này">
                        <Button 
                            danger 
                            icon={<ClearOutlined />} 
                            onClick={() => handleDeleteActivitiesOnly(record.id)}
                            disabled={record.activity_count === 0}
                        >
                            Xoá Hoạt động
                        </Button>
                    </Tooltip>
                    <Tooltip title="Xoá hoàn toàn doanh nghiệp và các hoạt động liên quan">
                        <Button 
                            type="primary" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => handleDeleteEnterprise(record.id)}
                        >
                            Xoá Doanh nghiệp
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-vluRed">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <WarningOutlined className="text-vluRed" /> Công cụ Xử lý Dữ liệu Trùng
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Danh sách các doanh nghiệp có cùng Tên. Bạn có thể dọn dẹp bằng cách xoá doanh nghiệp hoặc chỉ xoá hoạt động của chúng.
                    </p>
                </div>
                <Space>
                    {duplicates.length > 0 && (
                        <Button type="primary" danger icon={<DeleteOutlined />} onClick={handleDeleteAllNewest} disabled={loading}>
                            Xoá tất cả trùng lặp
                        </Button>
                    )}
                    <Button type="default" onClick={fetchDuplicates} loading={loading} className="border-vluRed text-vluRed hover:bg-red-50 dark:hover:bg-red-900/30">
                        Tải lại dữ liệu
                    </Button>
                </Space>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><Spin size="large" /></div>
            ) : duplicates.length === 0 ? (
                <Card className="text-center py-10">
                    <div className="text-green-500 mb-4"><ClearOutlined className="text-4xl" /></div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Không tìm thấy dữ liệu doanh nghiệp bị trùng!</h3>
                    <p className="text-gray-500">Hệ thống của bạn đang rất gọn gàng.</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    {duplicates.map((group, index) => (
                        <Card 
                            key={index} 
                            title={
                                <div className="flex items-center gap-2 text-vluRed">
                                    <ExclamationCircleOutlined /> 
                                    <span>Tên doanh nghiệp: <strong>{group.name}</strong></span>
                                    <Tag color="red" className="ml-2">{group.count} bản ghi</Tag>
                                </div>
                            } 
                            extra={
                                <Tooltip title="Giữ lại bản cũ nhất, xoá tất cả các bản mới tạo sau">
                                    <Button 
                                        type="primary" 
                                        danger 
                                        icon={<DeleteOutlined />} 
                                        onClick={() => handleDeleteNewest(group)}
                                    >
                                        Xoá mới nhất
                                    </Button>
                                </Tooltip>
                            }
                            className="shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden"
                            headStyle={{ backgroundColor: 'rgba(254, 226, 226, 0.5)' }}
                        >
                            <Table 
                                columns={columns} 
                                dataSource={group.enterprises} 
                                rowKey="id" 
                                pagination={false}
                                size="small"
                                className="dark:bg-gray-800"
                            />
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DuplicateDataTool;
