import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Modal, Tag, Spin, Tooltip } from 'antd';
import { DeleteOutlined, WarningOutlined, ExclamationCircleOutlined, ClearOutlined, MergeCellsOutlined } from '@ant-design/icons';
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
        document.title = "Xử lý Dữ liệu Hàng loạt | VLU Enterprise Link Manager";
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

    const handleMergeDuplicates = (group) => {
        const target = group.enterprises[group.enterprises.length - 1];
        const duplicatesToMerge = group.enterprises.slice(0, -1);
        const duplicateIds = duplicatesToMerge.map(e => e.id);

        confirm({
            title: 'Xác nhận gộp doanh nghiệp trùng lặp?',
            icon: <MergeCellsOutlined className="text-blue-500" />,
            content: (
                <div>
                    <p>Hệ thống sẽ tiến hành gộp <strong>{duplicateIds.length}</strong> bản ghi trùng lặp vào bản ghi gốc (cũ nhất, ID: {target.id}).</p>
                    <p className="text-red-500 font-semibold">Tất cả hoạt động cộng tác, sinh viên thực tập, MOU, địa chỉ, người đại diện của các bản ghi trùng lặp sẽ được chuyển đổi và liên kết sang bản ghi gốc này (Không bị mất dữ liệu của bất kỳ khoa nào).</p>
                    <p>Các bản ghi trùng lặp sau đó sẽ được gỡ bỏ khỏi danh sách.</p>
                </div>
            ),
            okText: 'Gộp dữ liệu',
            okType: 'primary',
            cancelText: 'Huỷ',
            onOk: async () => {
                try {
                    const token = Cookies.get('token');
                    await axios.post('/api/enterprises/bulk/merge', {
                        targetId: target.id,
                        duplicateIds: duplicateIds
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    message.success('Đã gộp dữ liệu trùng lặp thành công!');
                    fetchDuplicates();
                } catch (error) {
                    console.error('Lỗi khi gộp doanh nghiệp:', error);
                    message.error(error.response?.data?.message || 'Không thể gộp doanh nghiệp.');
                }
            }
        });
    };

    const handleMergeAllDuplicates = () => {
        confirm({
            title: 'Gộp tất cả dữ liệu trùng lặp?',
            icon: <MergeCellsOutlined className="text-blue-500" />,
            content: `Hệ thống sẽ tự động gộp tất cả các bản ghi trùng lặp trên mọi nhóm vào bản ghi gốc tương ứng của chúng. Toàn bộ hoạt động và liên kết dữ liệu sẽ được giữ lại. Hành động này không thể hoàn tác.`,
            okText: 'Gộp tất cả',
            okType: 'primary',
            cancelText: 'Huỷ',
            onOk: async () => {
                setLoading(true);
                try {
                    const token = Cookies.get('token');
                    for (const group of duplicates) {
                        const target = group.enterprises[group.enterprises.length - 1];
                        const duplicatesToMerge = group.enterprises.slice(0, -1);
                        const duplicateIds = duplicatesToMerge.map(e => e.id);
                        if (duplicateIds.length > 0) {
                            await axios.post('/api/enterprises/bulk/merge', {
                                targetId: target.id,
                                duplicateIds: duplicateIds
                            }, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                        }
                    }
                    message.success('Đã gộp tất cả dữ liệu trùng lặp thành công!');
                    fetchDuplicates();
                } catch (error) {
                    console.error('Lỗi khi gộp hàng loạt:', error);
                    message.error('Có lỗi xảy ra khi gộp hàng loạt.');
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <MergeCellsOutlined className="text-xl sm:text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Xử lý dữ liệu trùng lặp</h1>
                        <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5">Tìm kiếm và xử lý gộp các bản ghi doanh nghiệp trùng tên</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {duplicates.length > 0 && (
                        <Button type="primary" icon={<MergeCellsOutlined />} onClick={handleMergeAllDuplicates} disabled={loading} className="bg-blue-600 hover:bg-blue-500 border-none rounded-lg shadow-sm font-medium w-full sm:w-auto">
                            Gộp tất cả trùng lặp
                        </Button>
                    )}
                    <Button type="default" onClick={fetchDuplicates} loading={loading} className="rounded-lg shadow-sm font-medium border-slate-300 dark:border-gray-600 hover:border-vluRed hover:text-vluRed w-full sm:w-auto">
                        Tải lại dữ liệu
                    </Button>
                </div>
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
                                <Tooltip title="Gộp tất cả các bản ghi trùng lặp và giữ lại bản ghi gốc">
                                    <Button 
                                        type="primary" 
                                        icon={<MergeCellsOutlined />} 
                                        onClick={() => handleMergeDuplicates(group)}
                                        className="bg-blue-600 hover:bg-blue-500 border-none text-white rounded-lg"
                                    >
                                        Gộp dữ liệu
                                    </Button>
                                </Tooltip>
                            }
                            className="shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden"
                            styles={{ header: { backgroundColor: 'rgba(254, 226, 226, 0.5)' } }}
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
