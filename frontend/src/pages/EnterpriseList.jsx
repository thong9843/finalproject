import React, { useEffect, useState } from 'react';
import { Table, Tag, Form, Input, Select, Button, Modal, message, Space, Drawer, Timeline, Row, Col, DatePicker, Descriptions, Switch, Popover, Badge, Divider , App as AntApp } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UnorderedListOutlined, UploadOutlined, DownloadOutlined, UserOutlined, HomeOutlined, FilterOutlined, SortAscendingOutlined, ClearOutlined, SearchOutlined } from '@ant-design/icons';
import ImportModal from '../components/ImportModal';
import api from '../utils/api';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import Cookies from 'js-cookie';

const { Option } = Select;
const { TextArea } = Input;

const EnterpriseList = () => {
    const userCookie = Cookies.get('user');
    let user = null;
    try {
        if (userCookie) user = JSON.parse(userCookie);
    } catch (e) {
        console.error("Failed to parse user cookie", e);
    }
    const isLecturer = user?.role === 'LECTURER';

    const [data, setData] = useState([]);
    const { modal } = AntApp.useApp();
    const [departments, setDepartments] = useState([]);
    const [scales, setScales] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState(null);
    const [statusFilter, setStatusFilter] = useState(undefined);
    const [searchText, setSearchText] = useState('');
    const [filterScale, setFilterScale] = useState(undefined);
    const [filterField, setFilterField] = useState(undefined);
    const [filterIsHcmc, setFilterIsHcmc] = useState(undefined);
    const [filterDistrict, setFilterDistrict] = useState(undefined);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [selectedEnterprise, setSelectedEnterprise] = useState(null);
    const [showImport, setShowImport] = useState(false);
    const [sortOption, setSortOption] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    const [showDeleted, setShowDeleted] = useState(false);

    useEffect(() => {
        document.title = "Quản lý Doanh nghiệp | VLU Enterprise Link Manager";
        fetchDepartments();
        fetchScales();
        fetchFields();
    }, []);

    useEffect(() => {
        fetchData();
    }, [showDeleted]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/enterprises?is_deleted=${showDeleted ? 1 : 0}`);
            setData(res.data);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu doanh nghiệp');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/structure/departments');
            setDepartments(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchScales = async () => {
        try {
            const res = await api.get('/structure/scales');
            setScales(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchFields = async () => {
        try {
            const res = await api.get('/structure/fields');
            setFields(res.data);
        } catch (e) { console.error(e); }
    };

    const handleSave = async (values) => {
        try {
            if (editingId) {
                await api.put(`/enterprises/${editingId}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/enterprises', values);
                message.success('Thêm mới thành công');
            }
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi lưu dữ liệu');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/enterprises/${id}`);
            message.success('Xóa thành công');
            fetchData();
            setSelectedRowKeys(prev => prev.filter(key => key !== id));
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi xóa dữ liệu');
        }
    };

    const handleRestore = async (id) => {
        try {
            await api.post(`/enterprises/${id}/restore`);
            message.success('Khôi phục doanh nghiệp thành công');
            fetchData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi khôi phục doanh nghiệp');
        }
    };

    const handleBulkDelete = () => {
        modal.confirm({
            title: `Xác nhận xóa ${selectedRowKeys.length} doanh nghiệp?`,
            content: 'Hành động này không thể hoàn tác.',
            okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' },
            onOk: async () => {
                setLoading(true);
                try {
                    await Promise.all(selectedRowKeys.map(id => api.delete(`/enterprises/${id}`)));
                    message.success(`Đã xóa thành công ${selectedRowKeys.length} doanh nghiệp`);
                    setSelectedRowKeys([]);
                    fetchData();
                } catch (error) {
                    message.error('Có lỗi xảy ra khi xóa hàng loạt');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleBulkUpdateStatus = (status) => {
        modal.confirm({
            title: `Xác nhận chuyển ${selectedRowKeys.length} doanh nghiệp sang "${status}"?`,
            okButtonProps: { className: '!bg-blue-600 hover:!bg-blue-500 text-white' },
            onOk: async () => {
                setLoading(true);
                try {
                    await Promise.all(selectedRowKeys.map(id => {
                        const ent = data.find(item => item.id === id);
                        if (!ent) return Promise.resolve();
                        const payload = {
                            name: ent.name,
                            tax_code: ent.tax_code,
                            scale_id: ent.scale_id,
                            is_hcmc: ent.is_hcmc,
                            status: status,
                            department_id: ent.department_id,
                            rep_title: ent.rep_title,
                            rep_full_name: ent.rep_full_name,
                            rep_role: ent.rep_role,
                            rep_phone: ent.rep_phone,
                            rep_email: ent.rep_email,
                            building_street: ent.building_street,
                            district: ent.district,
                            province: ent.province,
                            country: ent.country,
                            field_ids: ent.field_ids ? ent.field_ids.split(',').map(Number) : []
                        };
                        return api.put(`/enterprises/${id}`, payload);
                    }));
                    message.success(`Cập nhật trạng thái thành công cho ${selectedRowKeys.length} doanh nghiệp`);
                    setSelectedRowKeys([]);
                    fetchData();
                } catch (error) {
                    message.error('Có lỗi xảy ra khi cập nhật hàng loạt');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleViewTimeline = async (record) => {
        try {
            const res = await api.get(`/enterprises/${record.id}`);
            setSelectedEnterprise(res.data);
            setIsDrawerVisible(true);
        } catch (error) {
            message.error('Lỗi khi tải thông tin chi tiết');
        }
    };

    const statusColors = {
        'Tiềm năng': 'magenta', 'Liên hệ': 'cyan', 'Đàm phán': 'orange',
        'Đề xuất': 'geekblue', 'Đã ký hợp tác': 'purple',
        'Đang triển khai': 'green', 'Đã hoàn thành': 'blue', 'Đã tạm ngưng': 'red'
    };

    const statusConfig = {
        'Tiềm năng': { colorClass: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-900/30', ringClass: 'ring-pink-500 dark:ring-pink-400', icon: '💡' },
        'Liên hệ': { colorClass: 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/30', ringClass: 'ring-cyan-500 dark:ring-cyan-400', icon: '📞' },
        'Đàm phán': { colorClass: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30', ringClass: 'ring-orange-500 dark:ring-orange-400', icon: '🤝' },
        'Đề xuất': { colorClass: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30', ringClass: 'ring-blue-500 dark:ring-blue-400', icon: '📋' },
        'Đã ký hợp tác': { colorClass: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30', ringClass: 'ring-purple-500 dark:ring-purple-400', icon: '✍️' },
        'Đang triển khai': { colorClass: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30', ringClass: 'ring-green-500 dark:ring-green-400', icon: '🚀' },
        'Đã hoàn thành': { colorClass: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30', ringClass: 'ring-indigo-500 dark:ring-indigo-400', icon: '✅' },
        'Đã tạm ngưng': { colorClass: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30', ringClass: 'ring-red-500 dark:ring-red-400', icon: '⏸️' },
        'Chưa xác định': { colorClass: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800', ringClass: 'ring-gray-500 dark:ring-gray-400', icon: '📋' }
    };

    const statusCounts = {};
    data.forEach(item => {
        const s = item.status || 'Chưa xác định';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    const handleExport = () => {
        if (!data || data.length === 0) { message.warning('Không có dữ liệu để xuất'); return; }
        const exportData = filteredData.map(item => ({
            'Tên doanh nghiệp': item.name,
            'Mã số thuế': item.tax_code || '',
            'Quy mô': item.scale_name || '',
            'Lĩnh vực': item.fields_text || '',
            'Ở TP.HCM': item.is_hcmc ? 'Có' : 'Không',
            'Danh xưng': item.rep_title || '',
            'Họ và tên': item.rep_full_name || '',
            'Chức vụ': item.rep_role || '',
            'Số điện thoại': item.rep_phone || '',
            'Email': item.rep_email || '',
            'Địa chỉ': item.building_street || '',
            'Quận/Huyện': item.district || '',
            'Tỉnh/Thành': item.province || '',
            'Quốc gia': item.country || '',
            'Bộ môn ID': item.department_id || '',
            'Trạng thái': item.status || '',
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'DoanhNghiep');
        XLSX.writeFile(wb, `DanhSachDoanhNghiep_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    const uniqueDistricts = [...new Set(data.map(item => item.district).filter(Boolean))];

    const filteredData = data.filter(item => {
        const q = searchText.toLowerCase();
        const matchSearch = !searchText || 
            item.name?.toLowerCase().includes(q) ||
            item.tax_code?.toLowerCase().includes(q) ||
            item.rep_full_name?.toLowerCase().includes(q) ||
            item.rep_phone?.toLowerCase().includes(q);
        const matchScale = !filterScale || item.scale_id === filterScale;
        const matchField = !filterField || (item.field_ids && item.field_ids.split(',').map(Number).includes(filterField));
        const matchIsHcmc = filterIsHcmc === undefined || item.is_hcmc === filterIsHcmc;
        const matchDistrict = !filterDistrict || item.district === filterDistrict;
        const matchStatus = !statusFilter || item.status === statusFilter;
        return matchSearch && matchScale && matchField && matchIsHcmc && matchDistrict && matchStatus;
    }).sort((a, b) => {
        if (!sortOption) return 0;
        switch (sortOption) {
            case 'name_asc': return (a.name || '').localeCompare(b.name || '', 'vi');
            case 'name_desc': return (b.name || '').localeCompare(a.name || '', 'vi');
            case 'created_newest': return new Date(b.created_at) - new Date(a.created_at);
            case 'created_oldest': return new Date(a.created_at) - new Date(b.created_at);
            case 'students_desc': return (b.student_count || 0) - (a.student_count || 0);
            case 'students_asc': return (a.student_count || 0) - (b.student_count || 0);
            default: return 0;
        }
    });

    const activeFilterCount = [statusFilter, filterScale, filterField, filterIsHcmc !== undefined ? filterIsHcmc : undefined, filterDistrict, sortOption, showDeleted ? true : null].filter(v => v !== undefined && v !== null).length;

    const sortOptions = [
        { value: 'name_asc', label: '🔤 Tên (A → Z)' },
        { value: 'name_desc', label: '🔤 Tên (Z → A)' },
        { value: 'created_newest', label: '📅 Mới nhất' },
        { value: 'created_oldest', label: '📅 Cũ nhất' },
        { value: 'students_desc', label: '👥 SV nhiều → ít' },
        { value: 'students_asc', label: '👥 SV ít → nhiều' },
    ];

    const filterContent = (
        <div className="flex flex-col gap-3 w-72 p-1">
            <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><SortAscendingOutlined /> Sắp xếp</div>
                <Select allowClear placeholder="Chọn cách sắp xếp..." onChange={setSortOption} value={sortOption} className="w-full" options={sortOptions} />
            </div>
            <Divider className="my-0" />
            <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><FilterOutlined /> Bộ lọc</div>
                <div className="flex flex-col gap-2">
                    <Select allowClear placeholder="Lọc trạng thái" onChange={setStatusFilter} value={statusFilter} className="w-full">
                        {Object.keys(statusColors).map(s => <Option key={s} value={s}>{s}</Option>)}
                    </Select>
                    <Select allowClear placeholder="Lọc quy mô" onChange={setFilterScale} value={filterScale} className="w-full">
                        {scales.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                    </Select>
                    <Select allowClear placeholder="Lọc lĩnh vực" onChange={setFilterField} value={filterField} className="w-full">
                        {fields.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                    </Select>
                    <Select allowClear placeholder="Khu vực" onChange={setFilterIsHcmc} value={filterIsHcmc} className="w-full">
                        <Option value={true}>Trong TP.HCM</Option>
                        <Option value={false}>Ngoài TP.HCM</Option>
                    </Select>
                    <Select allowClear placeholder="Quận/Huyện" onChange={setFilterDistrict} value={filterDistrict} className="w-full" showSearch>
                        {uniqueDistricts.map(d => <Option key={d} value={d}>{d}</Option>)}
                    </Select>
                </div>
            </div>
            <Divider className="my-0" />
            <div className="flex justify-between items-center py-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1"><DeleteOutlined /> Hiển thị đã xóa</span>
                <Switch size="small" checked={showDeleted} onChange={setShowDeleted} />
            </div>
            <Button icon={<ClearOutlined />} type="default" block onClick={() => {
                setStatusFilter(undefined); setFilterScale(undefined); setFilterField(undefined); setFilterIsHcmc(undefined); setFilterDistrict(undefined); setSortOption(null); setShowDeleted(false);
            }}>Xóa tất cả bộ lọc</Button>
        </div>
    );

    const columns = [
        { 
            title: 'Tên Doanh nghiệp', 
            dataIndex: 'name', 
            key: 'name', 
            width: 220, 
            render: (text, record) => (
                <span className="font-semibold text-slate-800 dark:text-gray-100 flex items-center gap-2">
                    {text}
                    {record.is_deleted === 1 && <Tag color="red">Đã xóa</Tag>}
                </span>
            )
        },
        {
            title: 'Đại diện liên hệ', key: 'contact', width: 230,
            render: (_, r) => (
                <div className="text-xs">
                    <div className="font-medium text-slate-700 dark:text-gray-200">{r.rep_title} {r.rep_full_name} {r.rep_role && `- ${r.rep_role}`}</div>
                    <div className="text-gray-500 mt-0.5">{r.rep_phone || 'Chưa có SĐT'}</div>
                    <div className="text-gray-400">{r.rep_email || 'Chưa có Email'}</div>
                </div>
            )
        },
        {
            title: 'Lĩnh vực', dataIndex: 'fields_text', key: 'fields', width: 180,
            render: (text) => text ? text.split(', ').map((f, i) => <Tag key={i} color="blue" className="mb-1">{f}</Tag>) : <span className="text-slate-300 italic">Chưa có</span>
        },
        {
            title: 'Quy mô', dataIndex: 'scale_name', key: 'scale', width: 120,
            render: (text) => text ? <Tag color="geekblue">{text}</Tag> : '---'
        },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 140,
            render: (text) => <Tag color={statusColors[text]}>{text}</Tag>
        },
        {
            title: 'Thao tác', key: 'action', width: 120,
            render: (_, record) => {
                const isDeleted = record.is_deleted === 1;
                if (isDeleted) {
                    return (
                        <Space size="middle">
                            <Button 
                                type="primary" 
                                size="small" 
                                className="bg-green-600 hover:bg-green-500 text-white border-0 rounded-md" 
                                onClick={() => handleRestore(record.id)}
                            >
                                Khôi phục
                            </Button>
                        </Space>
                    );
                }
                return (
                    <Space size="middle">
                        <Button type="text" icon={<UnorderedListOutlined />} onClick={() => handleViewTimeline(record)} />
                        {!isLecturer && (
                            <Button type="text" className="text-blue-500" icon={<EditOutlined />} onClick={() => {
                                setEditingId(record.id);
                                form.setFieldsValue({
                                    name: record.name,
                                    tax_code: record.tax_code,
                                    scale_id: record.scale_id,
                                    is_hcmc: record.is_hcmc,
                                    status: record.status,
                                    department_id: record.department_id,
                                    field_ids: record.field_ids ? record.field_ids.split(',').map(Number) : [],
                                    rep_title: record.rep_title,
                                    rep_full_name: record.rep_full_name,
                                    rep_role: record.rep_role,
                                    rep_phone: record.rep_phone,
                                    rep_email: record.rep_email,
                                    building_street: record.building_street,
                                    district: record.district,
                                    province: record.province,
                                    country: record.country,
                                });
                                setIsModalVisible(true);
                            }} />
                        )}
                        {!isLecturer && (
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => {
                                modal.confirm({ title: 'Bạn có chắc chắn muốn xóa?', okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' }, onOk: () => handleDelete(record.id) });
                            }} />
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Quản lý Doanh nghiệp</h1>
                    <p className="text-sm text-slate-500 m-0">Cập nhật thông tin Doanh nghiệp & Đầu mối liên hệ Đối tác</p>
                </div>
                <div className="flex gap-3">
                    {!isLecturer && <Button size="large" icon={<UploadOutlined />} onClick={() => setShowImport(true)}>Import</Button>}
                    <Button size="large" icon={<DownloadOutlined />} onClick={handleExport}>Xuất Excel</Button>
                    {!isLecturer && (
                        <Button size="large" type="primary" className="bg-blue-600 rounded-lg shadow-sm" icon={<PlusOutlined />} onClick={() => {
                            setEditingId(null); form.resetFields(); setIsModalVisible(true);
                        }}>Thêm Đối Tác</Button>
                    )}
                </div>
            </div>

            {/* Status tags */}
            <div className="mb-5">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Trạng thái doanh nghiệp</div>
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(statusCounts).map(([status, count]) => {
                        const sc = statusConfig[status] || statusConfig['Chưa xác định'];
                        return (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${sc.colorClass} ${statusFilter === status
                                    ? `ring-2 ring-offset-1 dark:ring-offset-gray-900 shadow-sm dark:shadow-none ${sc.ringClass} border-current`
                                    : 'hover:shadow-sm dark:hover:shadow-none border-transparent'
                                    }`}
                            >
                                {sc.icon} {status} <span className="font-bold">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Search + Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-3 transition-colors">
                <Input
                    placeholder="Tìm kiếm theo tên, mã thuế, đại diện..."
                    prefix={<SearchOutlined className="text-gray-300" />}
                    className="flex-1 min-w-[200px] rounded-lg h-10"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />
                <Popover content={filterContent} title="Bộ lọc nâng cao" trigger="click" placement="bottomLeft">
                    <Button icon={<FilterOutlined />} className="h-10 rounded-lg text-gray-600">
                        Bộ lọc {activeFilterCount > 0 && <Badge count={activeFilterCount} size="small" offset={[2, -2]} style={{ backgroundColor: '#1677ff' }} />}
                    </Button>
                </Popover>
            </div>

            {/* Action Bar for Bulk Selection */}
            {selectedRowKeys.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex justify-between items-center animate-fade-in">
                    <span className="text-blue-700 font-medium ml-2">Đã chọn {selectedRowKeys.length} doanh nghiệp</span>
                    <Space>
                        <Select
                            placeholder="Đổi trạng thái..."
                            onChange={handleBulkUpdateStatus}
                            className="w-48"
                            size="small"
                        >
                            {Object.keys(statusColors).map(s => <Option key={s} value={s}>{s}</Option>)}
                        </Select>
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
                            Xóa đã chọn
                        </Button>
                    </Space>
                </div>
            )}

            <Table 
                rowSelection={isLecturer ? null : {
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                }}
                columns={columns} 
                dataSource={filteredData} 
                rowKey="id" 
                loading={loading}
                rowClassName={(record) => record.is_deleted === 1 ? 'opacity-65 bg-red-50/20 dark:bg-red-950/10' : ''}
                className="shadow-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 12 }} />

            <Modal
                title={<div className="text-xl font-bold">{editingId ? 'Chỉnh sửa Đối Tác' : 'Thêm mới Doanh Nghiệp'}</div>}
                open={isModalVisible} onCancel={() => setIsModalVisible(false)}
                footer={null} width={860} destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
                    {/* Thông tin cơ bản */}
                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item name="name" label="Tên Doanh nghiệp" rules={[{ required: true }]}>
                                <Input className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item name="tax_code" label="Mã số thuế">
                                <Input className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={10}>
                            <Form.Item name="scale_id" label="Quy mô">
                                <Select allowClear placeholder="Chọn quy mô..." className="rounded-lg">
                                    {scales.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={14}>
                            <Form.Item name="field_ids" label="Lĩnh vực / Ngành nghề">
                                <Select mode="multiple" allowClear placeholder="Chọn lĩnh vực..." className="rounded-lg">
                                    {fields.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="department_id" label="Bộ môn phân loại">
                                <Select allowClear placeholder="Chọn bộ môn..." className="rounded-lg">
                                    {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="status" label="Trạng thái" initialValue="Tiềm năng">
                                <Select className="rounded-lg">
                                    {Object.keys(statusColors).map(s => <Option key={s} value={s}>{s}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="is_hcmc" label="Có tại TP.HCM?" valuePropName="checked" initialValue={true}>
                                <Switch checkedChildren="Có" unCheckedChildren="Không" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Đại diện chính */}
                    <div className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-xl mb-4 border border-slate-100 dark:border-gray-700">
                        <h4 className="text-slate-700 dark:text-gray-200 font-bold mb-3 flex items-center gap-2"><UserOutlined /> Đại diện liên hệ chính</h4>
                        <Row gutter={16}>
                            <Col span={5}>
                                <Form.Item name="rep_title" label="Danh xưng">
                                    <Select placeholder="Ông/Bà">
                                        {['Ông', 'Bà', 'Anh', 'Chị', 'Khác'].map(t => <Option key={t} value={t}>{t}</Option>)}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={11}>
                                <Form.Item name="rep_full_name" label="Họ và tên">
                                    <Input placeholder="Nguyễn Văn A" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="rep_role" label="Chức vụ">
                                    <Input placeholder="HR Director..." className="rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="rep_phone" label="Số điện thoại">
                                    <Input placeholder="0123456789" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="rep_email" label="Email">
                                    <Input placeholder="contact@domain.com" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    {/* Địa chỉ */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-4 border border-blue-100 dark:border-blue-800/50">
                        <h4 className="text-blue-700 dark:text-blue-400 font-bold mb-3 flex items-center gap-2"><HomeOutlined /> Địa chỉ chính</h4>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item name="building_street" label="Tòa nhà / Đường">
                                    <Input placeholder="Số 1, đường ABC, tòa nhà XYZ" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="district" label="Quận / Huyện">
                                    <Input placeholder="Quận 1" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="province" label="Tỉnh / Thành phố">
                                    <Input placeholder="TP. Hồ Chí Minh" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="country" label="Quốc gia" initialValue="Việt Nam">
                                    <Input className="rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-gray-700">
                        <Button onClick={() => setIsModalVisible(false)} size="large" className="rounded-lg">Hủy</Button>
                        <Button type="primary" htmlType="submit" size="large" className="bg-blue-600 rounded-lg">Lưu vào Hệ thống</Button>
                    </div>
                </Form>
            </Modal>

            <Drawer
                title={<span className="font-bold flex items-center gap-2"><UnorderedListOutlined /> {selectedEnterprise?.name}</span>}
                placement="right" width={720}
                onClose={() => setIsDrawerVisible(false)}
                open={isDrawerVisible} className="bg-slate-50 dark:bg-gray-800/50"
            >
                {selectedEnterprise && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-4 border-b pb-2">Thông tin Chi tiết</h3>
                            <Descriptions column={2} layout="vertical" size="small" bordered className="bg-white dark:bg-gray-800">
                                <Descriptions.Item label="Mã số thuế"><span className="font-medium">{selectedEnterprise.tax_code || '---'}</span></Descriptions.Item>
                                <Descriptions.Item label="Quy mô"><Tag color="geekblue">{selectedEnterprise.scale_name || '---'}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Lĩnh vực" span={2}>
                                    {selectedEnterprise.fields?.length > 0
                                        ? selectedEnterprise.fields.map(f => <Tag key={f.id} color="blue">{f.name}</Tag>)
                                        : '---'}
                                </Descriptions.Item>
                                <Descriptions.Item label="TP.HCM">{selectedEnterprise.is_hcmc ? <Tag color="green">Có</Tag> : <Tag color="default">Không</Tag>}</Descriptions.Item>
                                <Descriptions.Item label="Trạng thái"><Tag color={statusColors[selectedEnterprise.status]}>{selectedEnterprise.status}</Tag></Descriptions.Item>
                            </Descriptions>
                        </div>

                        {selectedEnterprise.representatives?.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-4 border-b pb-2">Đại diện Liên hệ</h3>
                                {selectedEnterprise.representatives.map(rep => (
                                    <div key={rep.id} className="flex items-start gap-3 mb-3 pb-3 border-b border-slate-50 last:border-0">
                                        {rep.is_primary && <Tag color="gold">Chính</Tag>}
                                        <div>
                                            <p className="font-semibold m-0">{rep.title} {rep.full_name} {rep.role && `- ${rep.role}`}</p>
                                            <p className="text-gray-500 text-sm m-0">{rep.phone} • {rep.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedEnterprise.addresses?.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-4 border-b pb-2">Địa chỉ</h3>
                                {selectedEnterprise.addresses.map(addr => (
                                    <div key={addr.id} className="mb-4 last:mb-0">
                                        {addr.is_main && <Tag color="blue" className="mb-2">Chính</Tag>}
                                        <Descriptions column={1} size="small" className="ml-1" colon={false}>
                                            <Descriptions.Item label={<span className="text-gray-500 w-28 inline-block">Đường/Tòa nhà</span>}><span className="font-medium text-slate-700 dark:text-gray-200">{addr.building_street || '---'}</span></Descriptions.Item>
                                            <Descriptions.Item label={<span className="text-gray-500 w-28 inline-block">Quận/Huyện</span>}><span className="font-medium text-slate-700 dark:text-gray-200">{addr.district || '---'}</span></Descriptions.Item>
                                            <Descriptions.Item label={<span className="text-gray-500 w-28 inline-block">Tỉnh/Thành</span>}><span className="font-medium text-slate-700 dark:text-gray-200">{addr.province || '---'}</span></Descriptions.Item>
                                            <Descriptions.Item label={<span className="text-gray-500 w-28 inline-block">Quốc gia</span>}><span className="font-medium text-slate-700 dark:text-gray-200">{addr.country || '---'}</span></Descriptions.Item>
                                        </Descriptions>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-4 border-b pb-2">Timeline Hoạt động</h3>
                            {selectedEnterprise.activities?.length > 0 ? (
                                <Timeline>
                                    {selectedEnterprise.activities.map(act => (
                                        <Timeline.Item key={act.id} color={act.status === 'Đã triển khai' ? 'green' : 'blue'}>
                                            <p className="font-semibold text-slate-700 dark:text-gray-200 m-0">{act.title}</p>
                                            <p className="text-slate-500 text-sm m-0 mt-1">
                                                {act.start_date && dayjs(act.start_date).format('DD/MM/YYYY')}
                                                {act.type_names && <> • <Tag color="cyan" className="ml-1">{act.type_names}</Tag></>}
                                            </p>
                                            <p className="text-slate-400 text-xs mt-1">Trạng thái: <span className="font-medium">{act.status}</span></p>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            ) : (
                                <p className="text-slate-400 text-center py-4">Chưa có hoạt động nào.</p>
                            )}
                        </div>
                    </div>
                )}
            </Drawer>

            <ImportModal
                open={showImport} onClose={() => setShowImport(false)} onSuccess={fetchData}
                type="enterprises"
                templateColumns={['Tên doanh nghiệp', 'Mã số thuế', 'Quy mô', 'Lĩnh vực', 'Ở TP.HCM', 'Danh xưng', 'Họ và tên', 'Chức vụ', 'Số điện thoại', 'Email', 'Địa chỉ', 'Quận/Huyện', 'Tỉnh/Thành', 'Quốc gia', 'Bộ môn ID', 'Trạng thái']}
            />
        </div>
    );
};

export default EnterpriseList;
