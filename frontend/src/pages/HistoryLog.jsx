import React, { useState, useEffect } from 'react';
import { 
    Table, Tag, Button, Modal, Card, Space, Input, Select, 
    Row, Col, Tooltip, message, Badge, Typography, Descriptions, Divider, Alert
} from 'antd';
import { 
    HistoryOutlined, SearchOutlined, ReloadOutlined, 
    EyeOutlined, UndoOutlined, DeleteOutlined, InfoCircleOutlined 
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';

const { Title, Text } = Typography;
const { Option } = Select;

const HistoryLog = () => {
    const userCookie = Cookies.get('user');
    let currentUser = null;
    try {
        if (userCookie) currentUser = JSON.parse(userCookie);
    } catch (e) {
        console.error("Failed to parse user cookie", e);
    }
    const isAdmin = currentUser?.role === 'ADMIN';

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState({
        entity_type: '',
        action_type: '',
        search: ''
    });
    
    // Detail Modal State
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [selectedLogDetail, setSelectedLogDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Restore State
    const [restoreLoading, setRestoreLoading] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.entity_type) queryParams.append('entity_type', filters.entity_type);
            if (filters.action_type) queryParams.append('action_type', filters.action_type);
            if (filters.search) queryParams.append('search', filters.search);

            const res = await api.get(`/history?${queryParams.toString()}`);
            setData(res.data);
        } catch (err) {
            message.error('Không thể tải lịch sử thao tác: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = "Lịch sử Hệ thống | VLU Enterprise Link";
        fetchHistory();
    }, [filters.entity_type, filters.action_type]);

    const handleSearch = () => {
        fetchHistory();
    };

    const handleResetFilters = () => {
        setFilters({
            entity_type: '',
            action_type: '',
            search: ''
        });
    };

    const viewDetail = async (record) => {
        setSelectedLog(record);
        setDetailModalVisible(true);
        setDetailLoading(true);
        try {
            const res = await api.get(`/history/${record.id}`);
            setSelectedLogDetail(res.data);
        } catch (err) {
            message.error('Không thể tải chi tiết lịch sử: ' + (err.response?.data?.message || err.message));
            setDetailModalVisible(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleRestore = async (logId) => {
        Modal.confirm({
            title: 'Xác nhận khôi phục?',
            content: 'Dữ liệu sẽ được khôi phục về trạng thái được lưu trong bản ghi lịch sử này.',
            okText: 'Khôi phục',
            cancelText: 'Hủy',
            okButtonProps: { className: '!bg-blue-600 hover:!bg-blue-500 text-white' },
            onOk: async () => {
                setRestoreLoading(true);
                try {
                    await api.post(`/history/${logId}/restore`);
                    message.success('Khôi phục dữ liệu thành công!');
                    setDetailModalVisible(false);
                    fetchHistory();
                } catch (err) {
                    message.error('Khôi phục thất bại: ' + (err.response?.data?.message || err.message));
                } finally {
                    setRestoreLoading(false);
                }
            }
        });
    };

    const handlePermanentDelete = async (logId) => {
        Modal.confirm({
            title: 'Xác nhận xóa vĩnh viễn?',
            content: 'Hành động này sẽ XÓA THẬT bản ghi khỏi cơ sở dữ liệu và KHÔNG THỂ khôi phục lại. Bạn có chắc chắn?',
            okText: 'Xóa vĩnh viễn',
            cancelText: 'Hủy',
            okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' },
            onOk: async () => {
                try {
                    const res = await api.delete(`/history/${logId}/permanent`);
                    message.success(res.data.message || 'Xóa vĩnh viễn thành công!');
                    setDetailModalVisible(false);
                    fetchHistory();
                } catch (err) {
                    message.error('Xóa vĩnh viễn thất bại: ' + (err.response?.data?.message || err.message));
                }
            }
        });
    };

    // Color definitions for Action Types
    const actionColors = {
        'CREATE': { color: 'green', text: 'Thêm mới' },
        'UPDATE': { color: 'blue', text: 'Chỉnh sửa' },
        'DELETE': { color: 'red', text: 'Đã xóa' },
        'RESTORE': { color: 'gold', text: 'Khôi phục' }
    };

    // Color definitions for Entity Types
    const entityColors = {
        'ENTERPRISE': { color: 'purple', text: 'Doanh nghiệp' },
        'MOU': { color: 'cyan', text: 'Biên bản MOU' },
        'ACTIVITY': { color: 'orange', text: 'Hoạt động' },
        'STUDENT': { color: 'geekblue', text: 'Sinh viên' }
    };

    const columns = [
        {
            title: 'Thời gian',
            dataIndex: 'changed_at',
            key: 'changed_at',
            width: 170,
            render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm:ss')
        },
        {
            title: 'Người thực hiện',
            key: 'user',
            width: 200,
            render: (_, r) => (
                <div>
                    <div className="font-semibold text-slate-800 dark:text-gray-200">{r.user_name || 'Hệ thống'}</div>
                    <div className="text-gray-400 text-xs">{r.user_email || 'system@vlu.edu.vn'}</div>
                </div>
            )
        },
        {
            title: 'Phân khoa',
            dataIndex: 'faculty_name',
            key: 'faculty_name',
            width: 180,
            render: (text) => text ? <Tag color="default">{text}</Tag> : <Tag color="gray">Hệ thống</Tag>
        },
        {
            title: 'Đối tượng',
            dataIndex: 'entity_type',
            key: 'entity_type',
            width: 140,
            render: (type) => {
                const config = entityColors[type] || { color: 'gray', text: type };
                return <Tag color={config.color}>{config.text}</Tag>;
            }
        },
        {
            title: 'Tên đối tượng',
            dataIndex: 'entity_name',
            key: 'entity_name',
            width: 250,
            render: (text) => <span className="font-medium text-slate-700 dark:text-gray-200">{text}</span>
        },
        {
            title: 'Thao tác',
            dataIndex: 'action_type',
            key: 'action_type',
            width: 120,
            render: (action) => {
                const config = actionColors[action] || { color: 'gray', text: action };
                return <Tag color={config.color} className="font-bold">{config.text}</Tag>;
            }
        },
        {
            title: 'Chức năng',
            key: 'actions',
            width: 150,
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết & So sánh">
                        <Button 
                            type="text" 
                            icon={<EyeOutlined />} 
                            onClick={() => viewDetail(record)} 
                        />
                    </Tooltip>
                    <Tooltip title="Khôi phục trạng thái này">
                        <Button 
                            type="text" 
                            className="text-blue-600 hover:text-blue-500"
                            icon={<UndoOutlined />} 
                            onClick={() => handleRestore(record.id)} 
                        />
                    </Tooltip>
                    {isAdmin && record.action_type === 'DELETE' && (
                        <Tooltip title="Xóa vĩnh viễn khỏi Database">
                            <Button 
                                type="text" 
                                danger
                                icon={<DeleteOutlined />} 
                                onClick={() => handlePermanentDelete(record.id)} 
                            />
                        </Tooltip>
                    )}
                </Space>
            )
        }
    ];

    // Helper to format values for display
    const renderValue = (val) => {
        if (val === null || val === undefined) return <span className="text-gray-400 italic">null</span>;
        if (typeof val === 'boolean') return val ? <Tag color="green">TRUE</Tag> : <Tag color="red">FALSE</Tag>;
        if (typeof val === 'object') return <pre className="text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded max-h-40 overflow-y-auto">{JSON.stringify(val, null, 2)}</pre>;
        return <span>{String(val)}</span>;
    };

    const renderDiffDetail = () => {
        if (!selectedLogDetail) return null;

        const oldValueParsed = selectedLogDetail.old_value ? JSON.parse(selectedLogDetail.old_value) : null;
        const newValueParsed = selectedLogDetail.new_value ? JSON.parse(selectedLogDetail.new_value) : null;

        const entityType = selectedLogDetail.entity_type;
        const actionType = selectedLogDetail.action_type;

        // Render differently based on action
        if (actionType === 'DELETE') {
            return (
                <div className="flex flex-col gap-4">
                    <Alert 
                        message="Bản ghi đã bị xóa (Soft Delete)"
                        description="Bản ghi dưới đây hiện đang ẩn khỏi giao diện quản lý. Khôi phục sẽ hiển thị lại đối tượng cùng các hoạt động liên đới."
                        type="warning"
                        showIcon
                    />
                    
                    <Card size="small" title="Thông tin bản ghi trước khi xóa" className="bg-slate-50 dark:bg-gray-800/40">
                        {entityType === 'ENTERPRISE' && oldValueParsed?.enterprise && (
                            <Descriptions bordered size="small" column={2}>
                                <Descriptions.Item label="Tên công ty" span={2}>{oldValueParsed.enterprise.name}</Descriptions.Item>
                                <Descriptions.Item label="Mã số thuế">{oldValueParsed.enterprise.tax_code || 'Chưa có'}</Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">{oldValueParsed.enterprise.status}</Descriptions.Item>
                            </Descriptions>
                        )}
                        {entityType === 'ACTIVITY' && oldValueParsed?.activity && (
                            <Descriptions bordered size="small" column={2}>
                                <Descriptions.Item label="Tiêu đề hoạt động" span={2}>{oldValueParsed.activity.title}</Descriptions.Item>
                                <Descriptions.Item label="Ngày bắt đầu">{oldValueParsed.activity.start_date || '---'}</Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">{oldValueParsed.activity.status}</Descriptions.Item>
                            </Descriptions>
                        )}
                        {entityType === 'MOU' && oldValueParsed?.mou && (
                            <Descriptions bordered size="small" column={2}>
                                <Descriptions.Item label="Mã MOU" span={2}>{oldValueParsed.mou.mou_code}</Descriptions.Item>
                                <Descriptions.Item label="Ngày ký">{oldValueParsed.mou.signing_date || '---'}</Descriptions.Item>
                                <Descriptions.Item label="Quốc gia">{oldValueParsed.mou.country || '---'}</Descriptions.Item>
                            </Descriptions>
                        )}
                        {entityType === 'STUDENT' && oldValueParsed?.student && (
                            <Descriptions bordered size="small" column={2}>
                                <Descriptions.Item label="Họ tên SV" span={2}>{oldValueParsed.student.name}</Descriptions.Item>
                                <Descriptions.Item label="Mã sinh viên">{oldValueParsed.student.student_code}</Descriptions.Item>
                                <Descriptions.Item label="Lớp">{oldValueParsed.student.class || '---'}</Descriptions.Item>
                            </Descriptions>
                        )}
                    </Card>

                    {/* Show cascade deletions */}
                    {entityType === 'ENTERPRISE' && oldValueParsed && (
                        <div className="flex flex-col gap-2">
                            <Text className="font-bold text-red-600 dark:text-red-400">Ảnh hưởng liên đới (Cascade Soft-Deletes):</Text>
                            <ul className="list-disc pl-5 text-xs text-gray-500">
                                <li>Hoạt động liên kết bị xóa: <span className="font-semibold">{oldValueParsed.cascaded_activities?.length || 0}</span> hoạt động</li>
                                <li>Biên bản MOU bị xóa: <span className="font-semibold">{oldValueParsed.cascaded_mous?.length || 0}</span> MOU</li>
                                <li>Sinh viên thực tập bị ảnh hưởng: <span className="font-semibold">{oldValueParsed.cascaded_students?.length || 0}</span> sinh viên</li>
                            </ul>
                        </div>
                    )}

                    {entityType === 'ACTIVITY' && oldValueParsed && (
                        <div className="flex flex-col gap-2">
                            <Text className="font-bold text-red-600 dark:text-red-400">Ảnh hưởng liên đới (Cascade Soft-Deletes):</Text>
                            <ul className="list-disc pl-5 text-xs text-gray-500">
                                <li>Biên bản MOU bị xóa: <span className="font-semibold">{oldValueParsed.cascaded_mous?.length || 0}</span> MOU</li>
                                <li>Sinh viên thực tập bị ảnh hưởng: <span className="font-semibold">{oldValueParsed.cascaded_students?.length || 0}</span> sinh viên</li>
                            </ul>
                        </div>
                    )}
                </div>
            );
        }

        if (actionType === 'CREATE') {
            return (
                <div className="flex flex-col gap-4">
                    <Alert message="Khởi tạo đối tượng mới" type="success" showIcon />
                    <Card size="small" title="Thông tin khởi tạo">
                        <pre className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded overflow-x-auto max-h-80">
                            {JSON.stringify(newValueParsed, null, 2)}
                        </pre>
                    </Card>
                </div>
            );
        }

        if (actionType === 'UPDATE' && oldValueParsed && newValueParsed) {
            // Find key differences to render cleanly
            // Flat keys for core entity
            const oldCore = oldValueParsed.enterprise || oldValueParsed.activity || oldValueParsed.mou || oldValueParsed.student || {};
            const newCore = newValueParsed.enterprise || newValueParsed.activity || newValueParsed.mou || newValueParsed.student || {};
            
            const diffKeys = Object.keys(newCore).filter(k => {
                if (k === 'created_at' || k === 'updated_at') return false;
                return JSON.stringify(oldCore[k]) !== JSON.stringify(newCore[k]);
            });

            return (
                <div className="flex flex-col gap-4">
                    <Alert message="Chi tiết chỉnh sửa thông tin" type="info" showIcon />
                    
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs border border-gray-200 dark:border-gray-700">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900">
                                    <th className="border p-2 text-left w-1/4">Trường dữ liệu</th>
                                    <th className="border p-2 text-left w-3/8 text-red-500">Giá trị Cũ</th>
                                    <th className="border p-2 text-left w-3/8 text-green-500">Giá trị Mới</th>
                                </tr>
                            </thead>
                            <tbody>
                                {diffKeys.length > 0 ? (
                                    diffKeys.map(k => (
                                        <tr key={k} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30">
                                            <td className="border p-2 font-semibold">{k}</td>
                                            <td className="border p-2 bg-red-50/20 dark:bg-red-900/10">{renderValue(oldCore[k])}</td>
                                            <td className="border p-2 bg-green-50/20 dark:bg-green-900/10">{renderValue(newCore[k])}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="border p-4 text-center text-gray-400 italic">Không có thay đổi nào ở các trường chính (có thể là cập nhật danh sách liên kết/địa chỉ)</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Show detailed JSON */}
                    <Divider orientation="left" className="!my-2">Dữ liệu thô (Raw JSON)</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Card size="small" title="State Cũ (Trước chỉnh sửa)" className="bg-red-50/5 dark:bg-red-900/5">
                                <pre className="text-[10px] p-2 bg-slate-50 dark:bg-slate-900 rounded max-h-60 overflow-y-auto">
                                    {JSON.stringify(oldValueParsed, null, 2)}
                                </pre>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card size="small" title="State Mới (Sau chỉnh sửa)" className="bg-green-50/5 dark:bg-green-900/5">
                                <pre className="text-[10px] p-2 bg-slate-50 dark:bg-slate-900 rounded max-h-60 overflow-y-auto">
                                    {JSON.stringify(newValueParsed, null, 2)}
                                </pre>
                            </Card>
                        </Col>
                    </Row>
                </div>
            );
        }

        return <pre className="text-xs bg-slate-50 p-2 rounded">{JSON.stringify(selectedLogDetail, null, 2)}</pre>;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100 m-0 flex items-center gap-2">
                        <HistoryOutlined /> Lịch sử Hệ thống
                    </h1>
                    <p className="text-sm text-slate-500 m-0">Tra cứu lịch sử chỉnh sửa, xóa mềm và khôi phục dữ liệu</p>
                </div>
                <Button 
                    icon={<ReloadOutlined />} 
                    onClick={fetchHistory} 
                    loading={loading}
                >
                    Tải lại
                </Button>
            </div>

            {/* Filters */}
            <Card className="shadow-sm border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl mb-6">
                <Row gutter={16} align="middle">
                    <Col xs={24} md={8}>
                        <Input 
                            placeholder="Tìm theo tên đối tượng hoặc người thực hiện..." 
                            prefix={<SearchOutlined className="text-gray-300" />}
                            value={filters.search}
                            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            onPressEnter={handleSearch}
                            allowClear
                        />
                    </Col>
                    <Col xs={12} md={5}>
                        <Select 
                            placeholder="Chọn loại đối tượng" 
                            className="w-full"
                            value={filters.entity_type}
                            onChange={val => setFilters(prev => ({ ...prev, entity_type: val }))}
                        >
                            <Option value="">Tất cả đối tượng</Option>
                            <Option value="ENTERPRISE">Doanh nghiệp</Option>
                            <Option value="ACTIVITY">Hoạt động</Option>
                            <Option value="MOU">Biên bản MOU</Option>
                            <Option value="STUDENT">Sinh viên</Option>
                        </Select>
                    </Col>
                    <Col xs={12} md={5}>
                        <Select 
                            placeholder="Chọn loại thao tác" 
                            className="w-full"
                            value={filters.action_type}
                            onChange={val => setFilters(prev => ({ ...prev, action_type: val }))}
                        >
                            <Option value="">Tất cả thao tác</Option>
                            <Option value="CREATE">Thêm mới</Option>
                            <Option value="UPDATE">Chỉnh sửa</Option>
                            <Option value="DELETE">Xóa (Soft Delete)</Option>
                            <Option value="RESTORE">Khôi phục</Option>
                        </Select>
                    </Col>
                    <Col xs={24} md={6} className="text-right">
                        <Space>
                            <Button type="primary" className="bg-blue-600 hover:bg-blue-500 rounded" onClick={handleSearch}>Tìm kiếm</Button>
                            <Button onClick={handleResetFilters}>Đặt lại</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* List Table */}
            <Table 
                columns={columns} 
                dataSource={data} 
                rowKey="id" 
                loading={loading}
                className="shadow-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 15 }} 
            />

            {/* Detail Log Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <HistoryOutlined />
                        <span>Chi tiết Lịch sử thao tác #{selectedLog?.id}</span>
                    </div>
                }
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Đóng
                    </Button>,
                    <Button 
                        key="restore" 
                        type="primary" 
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                        icon={<UndoOutlined />} 
                        loading={restoreLoading}
                        onClick={() => selectedLog && handleRestore(selectedLog.id)}
                    >
                        Khôi phục trạng thái này
                    </Button>,
                    isAdmin && selectedLog?.action_type === 'DELETE' && (
                        <Button 
                            key="permanent" 
                            danger
                            type="primary"
                            className="bg-red-600 hover:bg-red-500 text-white"
                            icon={<DeleteOutlined />}
                            onClick={() => selectedLog && handlePermanentDelete(selectedLog.id)}
                        >
                            Xóa vĩnh viễn
                        </Button>
                    )
                ].filter(Boolean)}
                width={800}
                destroyOnClose
            >
                {detailLoading ? (
                    <div className="py-12 text-center text-gray-400 italic">Đang tải dữ liệu...</div>
                ) : (
                    <div>
                        {selectedLogDetail && (
                            <div className="flex flex-col gap-4">
                                <Descriptions column={2} size="small" bordered className="bg-white dark:bg-gray-900/20">
                                    <Descriptions.Item label="Người thực hiện">{selectedLogDetail.user_name} ({selectedLogDetail.user_email})</Descriptions.Item>
                                    <Descriptions.Item label="Thời gian">{dayjs(selectedLogDetail.changed_at).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
                                    <Descriptions.Item label="Loại đối tượng">
                                        {entityColors[selectedLogDetail.entity_type]?.text || selectedLogDetail.entity_type}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Thao tác">
                                        <Tag color={actionColors[selectedLogDetail.action_type]?.color}>
                                            {actionColors[selectedLogDetail.action_type]?.text}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tên đối tượng liên quan" span={2}>
                                        <span className="font-semibold">{selectedLogDetail.entity_name}</span> (ID: {selectedLogDetail.entity_id})
                                    </Descriptions.Item>
                                </Descriptions>
                                
                                <Divider className="!my-2" />
                                
                                {renderDiffDetail()}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default HistoryLog;