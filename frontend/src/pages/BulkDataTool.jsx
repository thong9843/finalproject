import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Select, message, Modal, Input, Checkbox, Tag, Row, Col, Divider, Spin } from 'antd';
import { ToolOutlined, DeleteOutlined, SwapOutlined, TagOutlined, SearchOutlined, CheckCircleOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import api from '../utils/api';

const { Option } = Select;
const { confirm } = Modal;

const BulkDataTool = () => {
    const [enterprises, setEnterprises] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Filters state
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState(undefined);
    const [facultyFilter, setFacultyFilter] = useState(undefined);

    // Actions state
    const [newStatus, setNewStatus] = useState(undefined);
    const [newFacultyId, setNewFacultyId] = useState(undefined);

    useEffect(() => {
        document.title = "Xử lý Dữ liệu Hàng loạt | VLU Enterprise Link Manager";
        fetchEnterprises();
        fetchFaculties();
    }, []);

    const fetchEnterprises = async () => {
        setLoading(true);
        try {
            const res = await api.get('/enterprises');
            setEnterprises(res.data || []);
        } catch (error) {
            console.error('Error fetching enterprises:', error);
            message.error('Không thể tải danh sách doanh nghiệp.');
        } finally {
            setLoading(false);
        }
    };

    const fetchFaculties = async () => {
        try {
            const res = await api.get('/structure/faculties');
            setFaculties(res.data || []);
        } catch (error) {
            console.error('Error fetching faculties:', error);
        }
    };

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const hasSelected = selectedRowKeys.length > 0;

    // Filter logic
    const filteredEnterprises = enterprises.filter(ent => {
        const matchesSearch = ent.name.toLowerCase().includes(searchText.toLowerCase()) || 
            (ent.tax_code && ent.tax_code.includes(searchText)) ||
            (ent.rep_full_name && ent.rep_full_name.toLowerCase().includes(searchText.toLowerCase()));
        
        const matchesStatus = statusFilter ? ent.status === statusFilter : true;
        const matchesFaculty = facultyFilter ? ent.faculty_id === facultyFilter : true;

        return matchesSearch && matchesStatus && matchesFaculty;
    });

    const handleBulkStatusUpdate = async () => {
        if (!newStatus) {
            message.warning('Vui lòng chọn trạng thái mới.');
            return;
        }
        confirm({
            title: 'Xác nhận thay đổi trạng thái hàng loạt?',
            icon: <ExclamationCircleOutlined />,
            content: `Bạn đang thực hiện chuyển trạng thái thành "${newStatus}" cho ${selectedRowKeys.length} doanh nghiệp đã chọn.`,
            okText: 'Áp dụng',
            cancelText: 'Hủy',
            onOk: async () => {
                setActionLoading(true);
                try {
                    await api.post('/enterprises/bulk/update-status', {
                        ids: selectedRowKeys,
                        status: newStatus
                    });
                    message.success(`Đã cập nhật trạng thái thành công cho ${selectedRowKeys.length} doanh nghiệp.`);
                    setSelectedRowKeys([]);
                    setNewStatus(undefined);
                    fetchEnterprises();
                } catch (error) {
                    console.error('Bulk update status error:', error);
                    message.error('Có lỗi xảy ra khi cập nhật trạng thái.');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleBulkFacultyUpdate = async () => {
        if (!newFacultyId) {
            message.warning('Vui lòng chọn khoa mới.');
            return;
        }
        const targetFaculty = faculties.find(f => f.id === newFacultyId);
        confirm({
            title: 'Xác nhận chuyển khoa hàng loạt?',
            icon: <ExclamationCircleOutlined />,
            content: `Bạn đang thực hiện chuyển ${selectedRowKeys.length} doanh nghiệp đã chọn sang trực thuộc "${targetFaculty?.name}".`,
            okText: 'Áp dụng',
            cancelText: 'Hủy',
            onOk: async () => {
                setActionLoading(true);
                try {
                    await api.post('/enterprises/bulk/update-faculty', {
                        ids: selectedRowKeys,
                        faculty_id: newFacultyId
                    });
                    message.success(`Đã chuyển khoa thành công cho ${selectedRowKeys.length} doanh nghiệp.`);
                    setSelectedRowKeys([]);
                    setNewFacultyId(undefined);
                    fetchEnterprises();
                } catch (error) {
                    console.error('Bulk update faculty error:', error);
                    message.error('Có lỗi xảy ra khi chuyển khoa.');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleBulkDelete = async () => {
        confirm({
            title: 'Xác nhận xóa hàng loạt doanh nghiệp?',
            icon: <DeleteOutlined className="text-red-500" />,
            content: `CẢNH BÁO: Hành động này sẽ xóa mềm ${selectedRowKeys.length} doanh nghiệp đã chọn và các hoạt động cộng tác đi kèm. Bạn có chắc chắn muốn tiếp tục?`,
            okText: 'Xóa tất cả',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                setActionLoading(true);
                try {
                    await api.post('/enterprises/bulk/delete', {
                        ids: selectedRowKeys
                    });
                    message.success(`Đã xóa thành công ${selectedRowKeys.length} doanh nghiệp.`);
                    setSelectedRowKeys([]);
                    fetchEnterprises();
                } catch (error) {
                    console.error('Bulk delete error:', error);
                    message.error('Có lỗi xảy ra khi xóa doanh nghiệp.');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const columns = [
        {
            title: 'Tên Doanh nghiệp',
            dataIndex: 'name',
            key: 'name',
            width: 220,
            fixed: 'left',
            fontWeight: 'bold',
            render: (text) => <strong className="text-slate-800 dark:text-gray-100">{text}</strong>
        },
        {
            title: 'Mã số thuế',
            dataIndex: 'tax_code',
            key: 'tax_code',
            render: (text) => text || <span className="text-gray-400 italic">Trống</span>
        },
        {
            title: 'Khoa quản lý',
            dataIndex: 'faculty_name',
            key: 'faculty_name',
            render: (text) => text || <span className="text-gray-400 italic">Dùng chung</span>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'blue';
                if (status === 'Đã hoàn thành' || status === 'Đã ký hợp tác') color = 'green';
                else if (status === 'Tiềm năng') color = 'orange';
                else if (status === 'Đã tạm ngưng') color = 'red';
                return <Tag color={color}>{status}</Tag>;
            }
        }
    ];

    const statusOptions = [
        'Tiềm năng',
        'Liên hệ',
        'Đàm phán',
        'Đề xuất',
        'Đã ký hợp tác',
        'Đang triển khai',
        'Đã hoàn thành',
        'Đã tạm ngưng'
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <ToolOutlined className="text-xl sm:text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Xử lý dữ liệu hàng loạt</h1>
                        <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5">Thực hiện cập nhật trạng thái, chuyển khoa hoặc xóa nhiều doanh nghiệp cùng lúc</p>
                    </div>
                </div>
                <Button type="default" onClick={fetchEnterprises} loading={loading} className="rounded-lg shadow-sm font-medium border-slate-300 dark:border-gray-600 hover:border-vluRed hover:text-vluRed w-full sm:w-auto">
                    Tải lại dữ liệu
                </Button>
            </div>

            {/* Filters Card */}
            <Card className="shadow-sm border border-slate-200 dark:border-gray-700 rounded-xl">
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={8}>
                        <Input
                            placeholder="Tìm kiếm doanh nghiệp, MST..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            size="large"
                            className="rounded-lg"
                        />
                    </Col>
                    <Col xs={12} md={8}>
                        <Select
                            allowClear
                            placeholder="Lọc theo trạng thái"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            size="large"
                            className="w-full rounded-lg"
                        >
                            {statusOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} md={8}>
                        <Select
                            allowClear
                            placeholder="Lọc theo Khoa quản lý"
                            value={facultyFilter}
                            onChange={setFacultyFilter}
                            size="large"
                            className="w-full rounded-lg"
                        >
                            {faculties.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Floating Action Bar for Bulk Selection */}
            {hasSelected && (
                <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[850px] z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-slate-200 dark:border-gray-800 shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up md:animate-fade-in-up-centered">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="bg-vluRed text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                            {selectedRowKeys.length}
                        </span>
                        <span className="text-slate-700 dark:text-gray-200 text-sm font-semibold">Đã chọn</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 justify-end flex-1 w-full sm:w-auto">
                        {/* Update Status Action */}
                        <Space.Compact className="w-full sm:w-auto">
                            <Select
                                placeholder="Chọn trạng thái"
                                value={newStatus}
                                onChange={setNewStatus}
                                style={{ width: 140 }}
                                className="rounded-l-lg"
                            >
                                {statusOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                            </Select>
                            <Button 
                                type="primary" 
                                icon={<TagOutlined />} 
                                onClick={handleBulkStatusUpdate}
                                loading={actionLoading}
                                className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-r-lg font-medium"
                            >
                                Đổi
                            </Button>
                        </Space.Compact>

                        {/* Update Faculty Action */}
                        <Space.Compact className="w-full sm:w-auto">
                            <Select
                                placeholder="Chọn khoa"
                                value={newFacultyId}
                                onChange={setNewFacultyId}
                                style={{ width: 140 }}
                                className="rounded-l-lg"
                            >
                                {faculties.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                            </Select>
                            <Button 
                                type="primary" 
                                icon={<SwapOutlined />} 
                                onClick={handleBulkFacultyUpdate}
                                loading={actionLoading}
                                className="bg-blue-600 hover:bg-blue-500 border-none text-white rounded-r-lg font-medium"
                            >
                                Khoa
                            </Button>
                        </Space.Compact>

                        {/* Delete Action */}
                        <Button 
                            type="primary" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={handleBulkDelete}
                            loading={actionLoading}
                            className="rounded-lg font-medium"
                        >
                            Xóa
                        </Button>
                        <Button 
                            type="text" 
                            onClick={() => setSelectedRowKeys([])}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Table Card (Desktop) */}
            <div className="hidden md:block">
                <Card className="shadow-sm border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <Table
                        rowSelection={rowSelection}
                        columns={columns}
                        dataSource={filteredEnterprises}
                        loading={loading}
                        rowKey="id"
                        pagination={{ pageSize: 15 }}
                        className="m-0"
                    />
                </Card>
            </div>

            {/* Mobile View */}
            <div className="block md:hidden space-y-4">
                {!loading && filteredEnterprises.length > 0 && (
                    <div className="bg-slate-50 dark:bg-gray-800 p-3 rounded-lg border border-slate-200 dark:border-gray-700 mb-2 flex items-center justify-between">
                        <Checkbox
                            checked={filteredEnterprises.length > 0 && selectedRowKeys.length === filteredEnterprises.length}
                            indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < filteredEnterprises.length}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedRowKeys(filteredEnterprises.map(ent => ent.id));
                                } else {
                                    setSelectedRowKeys([]);
                                }
                            }}
                        >
                            Chọn tất cả ({filteredEnterprises.length} DN)
                        </Checkbox>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-10"><Spin size="large" /></div>
                ) : filteredEnterprises.length === 0 ? (
                    <Card className="text-center py-6 text-gray-400">Không có dữ liệu</Card>
                ) : (
                    filteredEnterprises.map(record => {
                        const isChecked = selectedRowKeys.includes(record.id);
                        return (
                            <Card
                                key={record.id}
                                className={`shadow-sm border rounded-xl bg-white dark:bg-gray-800 transition-colors ${
                                    isChecked 
                                        ? 'border-vluRed/40 bg-red-50/5 dark:bg-red-950/5' 
                                        : 'border-slate-200 dark:border-gray-700'
                                }`}
                                title={
                                    <div className="flex items-center justify-between gap-3 w-full">
                                        <span className="font-semibold text-slate-800 dark:text-gray-100 truncate">
                                            {record.name}
                                        </span>
                                        <Checkbox
                                            checked={isChecked}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedRowKeys([...selectedRowKeys, record.id]);
                                                } else {
                                                    setSelectedRowKeys(selectedRowKeys.filter(key => key !== record.id));
                                                }
                                            }}
                                        />
                                    </div>
                                }
                            >
                                <div className="space-y-2 text-sm">
                                    {record.tax_code && (
                                        <div>
                                            <span className="text-gray-400 font-medium">Mã số thuế:</span>{' '}
                                            <span className="text-slate-700 dark:text-gray-300 font-semibold">{record.tax_code}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-gray-400 font-medium">Khoa quản lý:</span>{' '}
                                        {record.faculty_name ? (
                                            <Tag color="cyan" className="m-0 text-xs rounded-md">{record.faculty_name}</Tag>
                                        ) : (
                                            <span className="text-gray-400 italic">Dùng chung</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-gray-400 font-medium">Trạng thái:</span>{' '}
                                        {(() => {
                                            let color = 'blue';
                                            if (record.status === 'Đã hoàn thành' || record.status === 'Đã ký hợp tác') color = 'green';
                                            else if (record.status === 'Tiềm năng') color = 'orange';
                                            else if (record.status === 'Đã tạm ngưng') color = 'red';
                                            return <Tag color={color} className="m-0 text-xs">{record.status}</Tag>;
                                        })()}
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default BulkDataTool;
