import React, { useEffect, useState, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Space, Tooltip, Row, Col, Upload, Spin, Tag, Alert, Switch, Popover, Badge, Divider, App as AntApp } from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, SearchOutlined,
    FilePdfOutlined, ScanOutlined, InboxOutlined, CheckCircleOutlined, RobotOutlined, DownloadOutlined,
    FilterOutlined, ClearOutlined, SortAscendingOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const MOUList = () => {
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
    const [enterprises, setEnterprises] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');

    // AI Scan states
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);

    // PDF Export state
    const [exportingId, setExportingId] = useState(null);

    const [showDeleted, setShowDeleted] = useState(false);
    const [sortOption, setSortOption] = useState(null);
    const [filterUnit, setFilterUnit] = useState(null);
    const [filterOrgType, setFilterOrgType] = useState(null);
    const [filterCountry, setFilterCountry] = useState(null);
    const [faculties, setFaculties] = useState([]);
    const [filterFaculty, setFilterFaculty] = useState(undefined);
    const [filterEnterprise, setFilterEnterprise] = useState(undefined);

    useEffect(() => {
        document.title = "Quản lý Biên bản ghi nhớ (MOU) | VLU Enterprise Link Manager";
        fetchOptions();
        if (user?.role === 'ADMIN') fetchFaculties();
    }, []);

    const fetchFaculties = async () => {
        try {
            const res = await api.get('/structure/faculties');
            setFaculties(res.data || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchMOUs();
    }, [showDeleted, filterFaculty, filterEnterprise]);

    const fetchMOUs = async () => {
        setLoading(true);
        try {
            let url = `/mous?is_deleted=${showDeleted ? 1 : 0}`;
            if (filterFaculty) url += `&faculty_id=${filterFaculty}`;
            if (filterEnterprise) url += `&enterprise_id=${filterEnterprise}`;
            const res = await api.get(url);
            setData(res.data);
        } catch (error) {
            message.error('Lỗi khi tải danh sách Biên bản ghi nhớ (MOU)');
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [entRes, deptRes, actRes] = await Promise.all([
                api.get('/enterprises'),
                api.get('/structure/departments'),
                api.get('/activities')
            ]);
            setEnterprises(entRes.data);
            setDepartments(deptRes.data);
            setActivities(actRes.data);
        } catch (error) {
            console.error('Lỗi tải option', error);
        }
    };

    const handleSave = async (values) => {
        try {
            const payload = {
                ...values,
                signing_date: values.signing_date ? values.signing_date.format('YYYY-MM-DD') : null,
            };
            if (editingId) {
                await api.put(`/mous/${editingId}`, payload);
                message.success('Cập nhật thành công!');
            } else {
                await api.post('/mous', payload);
                message.success('Thêm mới thành công!');
            }
            setIsModalOpen(false);
            setEditingId(null);
            form.resetFields();
            fetchMOUs();
        } catch (error) {
            message.error('Lỗi khi lưu dữ liệu!');
        }
    };

    const handleDelete = (id) => {
        modal.confirm({
            title: 'Xác nhận xóa?',
            content: 'Gỡ bỏ Biên bản ghi nhớ này khỏi hệ thống.',
            okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' },
            onOk: async () => {
                try {
                    await api.delete(`/mous/${id}`);
                    message.success('Xóa thành công!');
                    fetchMOUs();
                    setSelectedRowKeys(prev => prev.filter(key => key !== id));
                } catch (error) {
                    message.error('Lỗi khi xóa!');
                }
            }
        });
    };

    const handleRestore = async (id) => {
        try {
            await api.post(`/mous/${id}/restore`);
            message.success('Khôi phục MOU thành công!');
            fetchMOUs();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi khôi phục MOU');
        }
    };

    const handleBulkDelete = () => {
        modal.confirm({
            title: `Xác nhận xóa ${selectedRowKeys.length} biên bản MOU?`,
            content: 'Hành động này không thể hoàn tác.',
            okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' },
            onOk: async () => {
                setLoading(true);
                try {
                    await Promise.all(selectedRowKeys.map(id => api.delete(`/mous/${id}`)));
                    message.success(`Đã xóa thành công ${selectedRowKeys.length} biên bản MOU`);
                    setSelectedRowKeys([]);
                    fetchMOUs();
                } catch (error) {
                    message.error('Có lỗi xảy ra khi xóa hàng loạt');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const openEditModal = (record) => {
        setEditingId(record.id);
        form.setFieldsValue({
            ...record,
            signing_date: record.signing_date ? dayjs(record.signing_date) : null,
        });
        setIsModalOpen(true);
    };

    const removeAccents = (str) => {
        if (!str) return '';
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };

    const filterOptionIgnoreCase = (input, option) => 
        removeAccents(option?.children || '').includes(removeAccents(input));

    // ==================== PDF EXPORT ====================
    const handleExportPdf = async (record) => {
        setExportingId(record.id);
        try {
            const response = await api.get(`/mous/${record.id}/export-pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `MOU_${record.mou_code.replace(/\//g, '-')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            message.success(`Đã xuất PDF: ${record.mou_code}`);
        } catch (error) {
            message.error('Lỗi khi xuất PDF. Vui lòng thử lại!');
        } finally {
            setExportingId(null);
        }
    };

    // ==================== AI SCAN ====================
    const handleScanDocument = async () => {
        if (!uploadedFile) {
            message.warning('Vui lòng chọn file để scan!');
            return;
        }
        setScanning(true);
        setScanResult(null);
        setScanError(null);
        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);
            const response = await api.post('/mous/scan-document', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000,
            });
            setScanResult(response.data.extracted);
            message.success('AI đã phân tích xong tài liệu!');
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi kết nối AI. Vui lòng thử lại!';
            setScanError(msg);
            message.error(msg);
        } finally {
            setScanning(false);
        }
    };

    const handleApplyScanResult = async () => {
        if (!scanResult) return;

        let finalEnterpriseId = scanResult.enterprise_id;
        let finalActivityId = scanResult.activity_id;

        // 1. Tự động hỏi tạo Doanh nghiệp nếu chưa có
        if (scanResult.enterprise_name && !finalEnterpriseId) {
            const confirmed = await new Promise((resolve) => {
                modal.confirm({
                    title: 'Doanh nghiệp chưa tồn tại',
                    content: `Doanh nghiệp "${scanResult.enterprise_name}" chưa có trên hệ thống. Bạn có muốn tạo mới không?`,
                    okText: 'Tạo mới',
                    cancelText: 'Bỏ qua',
                    okButtonProps: { className: '!bg-blue-600 hover:!bg-blue-500 text-white' },
                    onOk: () => resolve(true),
                    onCancel: () => resolve(false)
                });
            });

            if (confirmed) {
                try {
                    const res = await api.post('/enterprises', {
                        name: scanResult.enterprise_name,
                        tax_code: scanResult.tax_code || null,
                        status: 'Tiềm năng'
                    });
                    finalEnterpriseId = res.data.id;
                    await fetchOptions(); // Cập nhật lại danh sách doanh nghiệp
                    message.success('Tạo doanh nghiệp thành công!');
                } catch (error) {
                    message.error('Lỗi khi tạo doanh nghiệp!');
                }
            }
        }

        // 2. Tự động hỏi tạo Hoạt động nếu chưa có
        if (scanResult.activity_name && !finalActivityId && finalEnterpriseId) {
            const confirmed = await new Promise((resolve) => {
                modal.confirm({
                    title: 'Hoạt động chưa tồn tại',
                    content: `Hoạt động "${scanResult.activity_name}" chưa có trên hệ thống. Bạn có muốn tạo mới cho doanh nghiệp này không?`,
                    okText: 'Tạo mới',
                    cancelText: 'Bỏ qua',
                    okButtonProps: { className: '!bg-blue-600 hover:!bg-blue-500 text-white' },
                    onOk: () => resolve(true),
                    onCancel: () => resolve(false)
                });
            });

            if (confirmed) {
                try {
                    const res = await api.post('/activities', {
                        title: scanResult.activity_name,
                        enterprise_id: finalEnterpriseId,
                        status: 'Đề xuất',
                        detail: scanResult.collaboration_scope || ''
                    });
                    finalActivityId = res.data.id;
                    await fetchOptions(); // Cập nhật lại danh sách hoạt động
                    message.success('Tạo hoạt động thành công!');
                } catch (error) {
                    message.error('Lỗi khi tạo hoạt động!');
                }
            }
        }

        const fields = {
            mou_code: scanResult.mou_code,
            enterprise_id: finalEnterpriseId || undefined,
            activity_id: finalActivityId || undefined,
            file_url: scanResult.file_url || undefined,
            signing_date: scanResult.signing_date ? dayjs(scanResult.signing_date) : null,
            partner_contact: scanResult.partner_contact,
            org_type: scanResult.org_type,
            country: scanResult.country,
            collaboration_scope: scanResult.collaboration_scope,
            vlu_contact: scanResult.vlu_contact,
            tasks_ay24_25: scanResult.tasks_ay24_25,
            next_steps: scanResult.next_steps,
            past_activities: scanResult.past_activities,
            related_data: scanResult.related_data,
        };
        // Remove nulls
        Object.keys(fields).forEach(k => fields[k] == null && delete fields[k]);
        form.setFieldsValue(fields);
        setEditingId(null);
        setIsScanModalOpen(false);
        setIsModalOpen(true);
        message.success('Đã điền thông tin vào form. Vui lòng kiểm tra và lưu!');
    };

    const handleSmartPdfAction = (record) => {
        if (record.file_url) {
            window.open(record.file_url, '_blank');
        } else {
            modal.confirm({
                title: 'Chưa có file scan đính kèm',
                content: 'Biên bản này chưa có tài liệu gốc trên hệ thống (Cloud). Bạn có muốn hệ thống tự động xuất file PDF mẫu không?',
                okText: 'Xuất PDF',
                cancelText: 'Huỷ',
                okButtonProps: { className: '!bg-blue-600 hover:!bg-blue-500 text-white' },
                onOk: () => handleExportPdf(record)
            });
        }
    };

    const uniqueOrgTypes = [...new Set(data.map(item => item.org_type).filter(Boolean))];
    const uniqueCountries = [...new Set(data.map(item => item.country).filter(Boolean))];

    const sortOptions = [
        { value: 'signing_date_desc', label: '📅 Ngày ký (Mới → Cũ)' },
        { value: 'signing_date_asc', label: '📅 Ngày ký (Cũ → Mới)' },
        { value: 'code_asc', label: '🆔 Mã MOU (A → Z)' },
        { value: 'code_desc', label: '🆔 Mã MOU (Z → A)' },
        { value: 'partner_asc', label: '🔤 Tên đối tác (A → Z)' },
        { value: 'partner_desc', label: '🔤 Tên đối tác (Z → A)' },
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
                    {user?.role === 'ADMIN' && (
                        <>
                            <Select allowClear placeholder="Lọc theo khoa" onChange={setFilterFaculty} value={filterFaculty} className="w-full">
                                {faculties.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                            </Select>
                            <Select allowClear placeholder="Lọc theo doanh nghiệp" onChange={setFilterEnterprise} value={filterEnterprise} className="w-full" showSearch filterOption={filterOptionIgnoreCase}>
                                {enterprises.map(e => <Option key={e.id} value={e.id}>{e.name}</Option>)}
                            </Select>
                        </>
                    )}
                    <Select allowClear placeholder="Đơn vị triển khai" onChange={setFilterUnit} value={filterUnit} className="w-full" showSearch filterOption={filterOptionIgnoreCase}>
                        {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                    </Select>
                    <Select allowClear placeholder="Loại tổ chức" onChange={setFilterOrgType} value={filterOrgType} className="w-full" showSearch filterOption={filterOptionIgnoreCase}>
                        {uniqueOrgTypes.map(ot => <Option key={ot} value={ot}>{ot}</Option>)}
                    </Select>
                    <Select allowClear placeholder="Quốc gia" onChange={setFilterCountry} value={filterCountry} className="w-full" showSearch filterOption={filterOptionIgnoreCase}>
                        {uniqueCountries.map(c => <Option key={c} value={c}>{c}</Option>)}
                    </Select>
                </div>
            </div>
            <Divider className="my-0" />
            <div className="flex justify-between items-center py-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1"><DeleteOutlined /> Hiển thị đã xóa</span>
                <Switch size="small" checked={showDeleted} onChange={setShowDeleted} />
            </div>
            <Button icon={<ClearOutlined />} type="default" block onClick={() => {
                setSortOption(null); setFilterUnit(null); setFilterOrgType(null); setFilterCountry(null); setShowDeleted(false); setFilterFaculty(undefined); setFilterEnterprise(undefined);
            }}>Xóa tất cả bộ lọc</Button>
        </div>
    );

    const activeFilterCount = [sortOption, filterUnit, filterOrgType, filterCountry, showDeleted ? true : null, filterFaculty, filterEnterprise].filter(v => v !== null && v !== undefined).length;

    const filteredData = data.filter(item => {
        const q = searchText.toLowerCase();
        const matchSearch = !searchText ||
            (item.mou_code?.toLowerCase().includes(q)) ||
            (item.enterprise_name?.toLowerCase().includes(q));
        const matchUnit = !filterUnit || item.executing_unit_id === filterUnit;
        const matchOrgType = !filterOrgType || item.org_type === filterOrgType;
        const matchCountry = !filterCountry || item.country === filterCountry;
        return matchSearch && matchUnit && matchOrgType && matchCountry;
    }).sort((a, b) => {
        if (!sortOption) return 0;
        switch (sortOption) {
            case 'signing_date_desc':
                if (!a.signing_date) return 1;
                if (!b.signing_date) return -1;
                return new Date(b.signing_date) - new Date(a.signing_date);
            case 'signing_date_asc':
                if (!a.signing_date) return 1;
                if (!b.signing_date) return -1;
                return new Date(a.signing_date) - new Date(b.signing_date);
            case 'code_asc': return (a.mou_code || '').localeCompare(b.mou_code || '');
            case 'code_desc': return (b.mou_code || '').localeCompare(a.mou_code || '');
            case 'partner_asc': return (a.enterprise_name || '').localeCompare(b.enterprise_name || '', 'vi');
            case 'partner_desc': return (b.enterprise_name || '').localeCompare(a.enterprise_name || '', 'vi');
            default: return 0;
        }
    });

    const columns = [
        {
            title: 'Mã Biên bản',
            dataIndex: 'mou_code',
            key: 'mou_code',
            width: 130,
            render: (text, record) => (
                <span className="font-semibold text-blue-600 flex items-center gap-2">
                    {text}
                    {record.is_deleted === 1 && <Tag color="red" className="m-0">Đã xóa</Tag>}
                </span>
            )
        },
        {
            title: 'Tên đối tác',
            dataIndex: 'enterprise_name',
            key: 'enterprise_name',
            width: 220,
            ellipsis: true,
            render: (text) => <span className="font-semibold text-slate-800 dark:text-gray-100">{text}</span>
        },
        {
            title: 'Hoạt động liên kết',
            dataIndex: 'activity_title',
            key: 'activity_title',
            width: 200,
            ellipsis: true,
            render: (text) => text ? <Tag color="purple" className="whitespace-normal text-xs">{text}</Tag> : <span className="text-slate-400 text-xs">Chưa liên kết</span>
        },
        ...(user?.role === 'ADMIN' ? [{
            title: 'Khoa',
            dataIndex: 'faculty_name',
            key: 'faculty_name',
            width: 150,
            render: (text) => text ? <Tag color="orange">{text}</Tag> : <span className="text-slate-300 italic text-xs">Chưa phân khoa</span>
        }] : []),
        {
            title: 'Ngày ký',
            dataIndex: 'signing_date',
            key: 'signing_date',
            width: 110,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : <span className="text-slate-400">---</span>
        },
        {
            title: 'Đơn vị triển khai',
            dataIndex: 'executing_unit_name',
            key: 'executing_unit_name',
            width: 160,
            ellipsis: true,
        },
        {
            title: 'Loại tổ chức',
            dataIndex: 'org_type',
            key: 'org_type',
            width: 130,
            render: (text) => text ? <Tag color="blue">{text}</Tag> : null,
        },
        {
            title: 'Quốc gia',
            dataIndex: 'country',
            key: 'country',
            width: 100,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 180,
            align: 'center',
            render: (_, record) => {
                const isDeleted = record.is_deleted === 1;
                if (isDeleted) {
                    return (
                        <Space>
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
                    <Space>
                        {record.working_dir && (
                            <Tooltip title="Mở thư mục làm việc">
                                <Button type="text" icon={<LinkOutlined />} onClick={() => window.open(record.working_dir, '_blank')} />
                            </Tooltip>
                        )}
                        <Tooltip title={record.file_url ? "Xem tài liệu (Cloud)" : "Xuất PDF Hợp đồng mẫu"}>
                            <Button
                                type="text"
                                icon={record.file_url ? <InboxOutlined className="text-purple-500" /> : <FilePdfOutlined className="text-red-500" />}
                                loading={exportingId === record.id}
                                onClick={() => handleSmartPdfAction(record)}
                            />
                        </Tooltip>
                        {!isLecturer && <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => openEditModal(record)} />}
                        {!isLecturer && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />}
                    </Space>
                );
            }
        }
    ];

    // ==================== SCAN RESULT PREVIEW ====================
    const ScanResultPreview = ({ result }) => {
        const fields = [
            { label: 'Mã biên bản', key: 'mou_code' },
            { label: 'Tên đối tác', key: 'enterprise_name' },
            { label: 'Doanh nghiệp khớp DB', key: 'matched_enterprise' },
            { label: 'Hoạt động liên quan', key: 'activity_name' },
            { label: 'Hoạt động khớp DB', key: 'matched_activity' },
            { label: 'Ngày ký', key: 'signing_date' },
            { label: 'Người liên hệ đối tác', key: 'partner_contact' },
            { label: 'Loại tổ chức', key: 'org_type' },
            { label: 'Quốc gia', key: 'country' },
            { label: 'Phạm vi hợp tác', key: 'collaboration_scope' },
            { label: 'Đầu mối VLU', key: 'vlu_contact' },
            { label: 'Công tác đã triển khai', key: 'tasks_ay24_25' },
            { label: 'Bước tiếp theo', key: 'next_steps' },
        ];
        return (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-4 max-h-80 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                    <CheckCircleOutlined className="text-green-500 text-lg" />
                    <span className="font-semibold text-green-700">AI đã trích xuất thành công:</span>
                    {result.matched_enterprise && (
                        <Tag color="green">Khớp: {result.matched_enterprise}</Tag>
                    )}
                </div>

                {result.firebase_error && (
                    <Alert
                        message="Lỗi Upload lên Cloud"
                        description={result.firebase_error}
                        type="warning"
                        showIcon
                        className="mb-3"
                    />
                )}

                <div className="grid grid-cols-2 gap-2">
                    {fields.map(f => result[f.key] ? (
                        <div key={f.key} className="text-sm">
                            <span className="text-slate-500 font-medium">{f.label}: </span>
                            <span className="text-slate-800 dark:text-gray-100">{result[f.key]}</span>
                        </div>
                    ) : null)}
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Quản lý Biên Bản Ghi Nhớ (MOU)</h1>
                    <p className="text-sm text-slate-500 m-0">Danh sách thống kê các MOU đã ký với Đối tác/Doanh nghiệp</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto flex-wrap">
                    {!isLecturer && (
                        <>
                            <Button
                                size="large"
                                icon={<InboxOutlined />}
                                onClick={() => { setScanResult(null); setScanError(null); setUploadedFile(null); setIsScanModalOpen(true); }}
                                className="border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg shadow-sm font-medium hover:border-purple-700"
                            >
                                Import MOU bằng AI
                            </Button>
                            <Button
                                size="large"
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}
                                className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium"
                            >
                                Thêm Biên bản
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Search + Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-3 transition-colors">
                <Input
                    placeholder="Tìm mã MOU, đối tác..."
                    prefix={<SearchOutlined className="text-slate-400" />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="flex-1 min-w-[200px] rounded-lg h-10"
                    allowClear
                />
                <Popover content={filterContent} title="Bộ lọc & Sắp xếp" trigger="click" placement="bottomRight">
                    <Button icon={<FilterOutlined />} className="h-10 rounded-lg text-gray-600">
                        Bộ lọc {activeFilterCount > 0 && <Badge count={activeFilterCount} size="small" offset={[2, -2]} style={{ backgroundColor: '#1677ff' }} />}
                    </Button>
                </Popover>
            </div>

            {/* Action Bar for Bulk Selection */}
            {selectedRowKeys.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 mb-4 flex justify-between items-center animate-fade-in">
                    <span className="text-red-700 dark:text-red-400 font-medium ml-2">Đã chọn {selectedRowKeys.length} biên bản MOU</span>
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
                        Xóa đã chọn
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
                <Table
                    rowSelection={isLecturer ? null : {
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    }}
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey="id"
                    rowClassName={(record) => record.is_deleted === 1 ? 'opacity-65 bg-red-50/20 dark:bg-red-950/10' : ''}
                    pagination={{ pageSize: 12 }}
                    className="border-none"
                    scroll={{ x: 'max-content' }}
                />
            </div>

            {/* ==================== ADD/EDIT MODAL ==================== */}
            <Modal
                title={editingId ? "Cập nhật Biên bản ghi nhớ (MOU)" : "Thêm mới Biên bản ghi nhớ (MOU)"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={850}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={handleSave} className="mt-4">
                    <Form.Item name="file_url" hidden><Input /></Form.Item>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="mou_code" label="Mã biên bản" rules={[{ required: true, message: 'Vui lòng nhập!' }]}>
                                <Input placeholder="VD: MOU-2024-001" className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item name="enterprise_id" label="Tên đối tác (Doanh nghiệp)" rules={[{ required: true, message: 'Vui lòng chọn đối tác!' }]}>
                                <Select showSearch placeholder="Chọn đối tác..." filterOption={filterOptionIgnoreCase} className="rounded-lg">
                                    {enterprises.map(e => <Option key={e.id} value={e.id}>{e.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="signing_date" label="Ngày ký kết">
                                <DatePicker format="DD/MM/YYYY" className="w-full rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="org_type" label="Loại tổ chức">
                                <Input placeholder="VD: Tập đoàn, Trường ĐH..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item noStyle dependencies={['enterprise_id']}>
                                {({ getFieldValue }) => {
                                    const entId = getFieldValue('enterprise_id');
                                    const filtered = activities.filter(a => Number(a.enterprise_id) === Number(entId));
                                    return (
                                        <Form.Item name="activity_id" label="Hoạt động liên kết">
                                            <Select showSearch allowClear placeholder={`Chọn hoạt động (${filtered.length} mục)`} filterOption={filterOptionIgnoreCase} className="rounded-lg" disabled={!entId}>
                                                {filtered.map(a => <Option key={a.id} value={a.id}>{a.title}</Option>)}
                                            </Select>
                                        </Form.Item>
                                    );
                                }}
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="partner_contact" label="Đầu mối liên hệ của đối tác">
                                <Input placeholder="Ông Nguyễn Văn A - Trưởng phòng..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="vlu_contact" label="Đầu mối liên hệ VLU">
                                <Input placeholder="ThS. Trần B..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="country" label="Quốc gia đối tác">
                                <Input placeholder="VD: Việt Nam, Nhật Bản..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="executing_unit_id" label="Đơn vị triển khai">
                                <Select showSearch allowClear placeholder="Chọn bộ môn/đơn vị triển khai..." filterOption={filterOptionIgnoreCase} className="rounded-lg">
                                    {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="working_dir" label="Thư mục làm việc (Link)">
                                <Input placeholder="https://drive.google.com/..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="collaboration_scope" label="Mảng hợp tác">
                        <TextArea rows={2} placeholder="Nội dung mảng hợp tác..." className="rounded-lg" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="tasks_ay24_25" label="Công tác đã triển khai NH 24-25">
                                <TextArea rows={2} placeholder="..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="next_steps" label="Bước kế tiếp (Dự kiến)">
                                <TextArea rows={2} placeholder="..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="past_activities" label="Hoạt động cũ">
                                <TextArea rows={2} placeholder="..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="related_data" label="Số liệu liên quan (sv, ngành...)">
                                <TextArea rows={2} placeholder="..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-700 mt-4">
                        <Button onClick={() => setIsModalOpen(false)} size="large" className="rounded-lg">Hủy</Button>
                        <Button type="primary" htmlType="submit" size="large" className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium">
                            {editingId ? "Cập nhật" : "Lưu Biên bản"}
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* ==================== AI SCAN MODAL ==================== */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <RobotOutlined className="text-purple-600 text-xl" />
                        <span className="text-lg font-bold text-slate-800 dark:text-gray-100">Import Tài Liệu MOU bằng AI</span>
                    </div>
                }
                open={isScanModalOpen}
                onCancel={() => setIsScanModalOpen(false)}
                footer={null}
                width={680}
                destroyOnClose
            >
                <div className="mt-4">
                    {/* Instructions */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-purple-700 m-0">
                            <strong>Hướng dẫn:</strong> Upload ảnh chụp hoặc file PDF của hợp đồng/biên bản ghi nhớ MOU.
                            Gemini AI sẽ tự động đọc và trích xuất thông tin để điền vào form.
                        </p>
                    </div>

                    {/* Upload Area */}
                    <Dragger
                        beforeUpload={(file) => {
                            setUploadedFile(file);
                            setScanResult(null);
                            setScanError(null);
                            return false; // Prevent auto upload
                        }}
                        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                        maxCount={1}
                        showUploadList={uploadedFile ? { showRemoveIcon: true } : false}
                        onRemove={() => setUploadedFile(null)}
                        className="rounded-lg"
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined className="text-purple-400 text-4xl" />
                        </p>
                        <p className="ant-upload-text text-slate-700 dark:text-gray-200">Kéo thả file hoặc nhấn để chọn</p>
                        <p className="ant-upload-hint text-slate-400 text-xs">
                            Hỗ trợ: JPG, PNG, WEBP, PDF • Tối đa 15MB
                        </p>
                    </Dragger>

                    {uploadedFile && (
                        <div className="mt-3 flex items-center gap-2 bg-slate-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700">
                            <FilePdfOutlined className="text-red-400" />
                            <span className="text-sm text-slate-700 dark:text-gray-200 flex-1 truncate">{uploadedFile.name}</span>
                            <span className="text-xs text-slate-400">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                        </div>
                    )}

                    {/* Scan Button */}
                    <div className="mt-4 flex justify-center">
                        <Button
                            type="primary"
                            size="large"
                            icon={scanning ? <Spin size="small" /> : <ScanOutlined />}
                            onClick={handleScanDocument}
                            disabled={!uploadedFile || scanning}
                            loading={scanning}
                            style={{ minWidth: 200 }}
                            className="rounded-lg !bg-purple-600 hover:!bg-purple-500 !border-0 !text-white"
                        >
                            {scanning ? 'Đang phân tích...' : 'Phân tích với Gemini AI'}
                        </Button>
                    </div>

                    {scanning && (
                        <div className="mt-4 text-center text-sm text-purple-600">
                            <Spin size="small" className="mr-2" />
                            AI đang đọc và trích xuất thông tin từ tài liệu, vui lòng đợi...
                        </div>
                    )}

                    {/* Error */}
                    {scanError && (
                        <Alert
                            message="Lỗi phân tích"
                            description={scanError}
                            type="error"
                            showIcon
                            className="mt-3 rounded-lg"
                        />
                    )}

                    {/* Result Preview */}
                    {scanResult && <ScanResultPreview result={scanResult} />}

                    {/* Apply Button */}
                    {scanResult && (
                        <div className="mt-4 flex justify-end gap-3">
                            <Button onClick={() => setIsScanModalOpen(false)} className="rounded-lg">Hủy</Button>
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={handleApplyScanResult}
                                className="rounded-lg !bg-purple-600 hover:!bg-purple-500 !border-0 !text-white"
                                size="large"
                            >
                                Điền vào Form & Lưu
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default MOUList;
