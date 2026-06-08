import React, { useEffect, useState, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Space, Tooltip, Row, Col, Upload, Spin, Tag, Alert, Switch, Popover, Badge, Divider, App as AntApp, Card, Checkbox, Drawer, Descriptions, Progress } from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, SearchOutlined,
    FilePdfOutlined, ScanOutlined, InboxOutlined, CheckCircleOutlined, RobotOutlined, DownloadOutlined,
    FilterOutlined, ClearOutlined, SortAscendingOutlined, AuditOutlined, EyeOutlined, UnorderedListOutlined,
    UploadOutlined, CloudUploadOutlined, ExclamationCircleOutlined, ReloadOutlined
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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedMOU, setSelectedMOU] = useState(null);

    // File upload states (for drawer and edit form)
    const [drawerUploadFile, setDrawerUploadFile] = useState(null);
    const [drawerUploading, setDrawerUploading] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const drawerUploadRef = useRef(null);
    const formUploadRef = useRef(null);
    const [formUploadFile, setFormUploadFile] = useState(null);
    const [formUploading, setFormUploading] = useState(false);
    const [scanUploadingToCloud, setScanUploadingToCloud] = useState(false);

    const handleViewDetail = (record) => {
        setSelectedMOU(record);
        setDrawerUploadFile(null);
        setIsDrawerOpen(true);
    };

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
                const res = await api.post('/mous', payload);
                const newId = res.data.id;
                // If user chose a file in form, upload it now
                if (formUploadFile && newId) {
                    await doFormFileUpload(newId);
                }
                message.success('Thêm mới thành công!');
            }
            // If editing and user chose a new file
            if (editingId && formUploadFile) {
                await doFormFileUpload(editingId);
            }
            setIsModalOpen(false);
            setEditingId(null);
            form.resetFields();
            setFormUploadFile(null);
            fetchMOUs();
        } catch (error) {
            message.error('Lỗi khi lưu dữ liệu: ' + (error.response?.data?.message || error.message));
        }
    };

    const doFormFileUpload = async (mouId) => {
        if (!formUploadFile) return;
        setFormUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', formUploadFile);
            await api.post(`/mous/${mouId}/upload-file`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormUploadFile(null);
        } catch (err) {
            message.warning('Không thể upload file đính kèm: ' + (err.response?.data?.message || err.message));
        } finally {
            setFormUploading(false);
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
        setFormUploadFile(null);
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

            // If MOU has no cloud file yet, offer to upload this PDF to Firebase
            if (!record.file_url) {
                modal.confirm({
                    title: 'Lưu PDF lên Cloud?',
                    icon: <CloudUploadOutlined className="text-indigo-500" />,
                    content: (
                        <div>
                            <p>PDF đã tải xuống thành công. Bạn có muốn <strong>lưu PDF này lên Firebase Cloud</strong> để đính kèm vào biên bản không?</p>
                            <p className="text-slate-400 text-xs mt-1">Sau khi lưu, bạn có thể xem lại bất kỳ lúc nào từ trang chi tiết MOU.</p>
                        </div>
                    ),
                    okText: 'Lưu lên Cloud',
                    cancelText: 'Không cần',
                    okButtonProps: { className: '!bg-indigo-600 hover:!bg-indigo-500 text-white border-none' },
                    onOk: async () => {
                        try {
                            const res = await api.post(`/mous/${record.id}/generate-pdf-upload`);
                            message.success('Đã lưu PDF lên Firebase Cloud!');
                            // Refresh local state if it's the currently selected drawer MOU
                            if (selectedMOU?.id === record.id) {
                                setSelectedMOU(prev => ({ ...prev, file_url: res.data.file_url }));
                            }
                            fetchMOUs();
                        } catch (err) {
                            message.error('Lỗi khi lưu lên Cloud: ' + (err.response?.data?.message || err.message));
                        }
                    }
                });
            }
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
            setScanResult({ ...response.data.extracted, _originalFile: uploadedFile });
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
        let cloudFileUrl = null;

        // 1. Ask if user wants to upload the scanned file to Firebase
        if (scanResult._originalFile) {
            const wantsUpload = await new Promise((resolve) => {
                modal.confirm({
                    title: 'Lưu tài liệu gốc lên Cloud?',
                    icon: <CloudUploadOutlined className="text-purple-600" />,
                    content: (
                        <div>
                            <p>Bạn có muốn tải file <strong>{scanResult._originalFile.name}</strong> lên Firebase Storage để lưu trữ lâu dài không?</p>
                            <p className="text-slate-400 text-xs mt-1">Nếu không, bạn vẫn có thể upload thủ công sau từ trang chi tiết MOU.</p>
                        </div>
                    ),
                    okText: 'Có, tải lên Firebase',
                    cancelText: 'Bỏ qua, chỉ điền form',
                    okButtonProps: { className: '!bg-purple-600 hover:!bg-purple-500 text-white border-none' },
                    onOk: () => resolve(true),
                    onCancel: () => resolve(false)
                });
            });

            if (wantsUpload) {
                setScanUploadingToCloud(true);
                try {
                    const fd = new FormData();
                    fd.append('file', scanResult._originalFile);
                    const uploadRes = await api.post('/mous/upload-scan-file', fd, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    cloudFileUrl = uploadRes.data.file_url;
                    message.success('Đã tải tài liệu lên Firebase!');
                } catch (uploadErr) {
                    message.warning('Không thể tải lên Firebase: ' + (uploadErr.response?.data?.message || uploadErr.message));
                } finally {
                    setScanUploadingToCloud(false);
                }
            }
        }

        // 2. Tự động hỏi tạo Doanh nghiệp nếu chưa có
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
                        status: 'Tiềm năng',
                        faculty_id: filterFaculty || null
                    });
                    finalEnterpriseId = res.data.id;
                    await fetchOptions();
                    message.success('Tạo doanh nghiệp thành công!');
                } catch (error) {
                    message.error('Lỗi khi tạo doanh nghiệp!');
                }
            }
        }

        // 3. Tự động hỏi tạo Hoạt động nếu chưa có
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
                    await fetchOptions();
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
            file_url: cloudFileUrl || undefined,
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
            faculty_id: filterFaculty || user?.faculty_id || undefined,
        };
        Object.keys(fields).forEach(k => fields[k] == null && delete fields[k]);
        form.setFieldsValue(fields);
        setEditingId(null);
        setFormUploadFile(null);
        setIsScanModalOpen(false);
        setIsModalOpen(true);
        message.success('Đã điền thông tin vào form. Vui lòng kiểm tra và lưu!');
    };

    // Upload file manually from Drawer (for existing MOU)
    const handleUploadFileToMOU = async () => {
        if (!drawerUploadFile || !selectedMOU) return;
        setDrawerUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', drawerUploadFile);
            const res = await api.post(`/mous/${selectedMOU.id}/upload-file`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            message.success('Đã tải lên tài liệu thành công!');
            const newFileUrl = res.data.file_url;
            setSelectedMOU(prev => ({ ...prev, file_url: newFileUrl }));
            setDrawerUploadFile(null);
            fetchMOUs();
        } catch (err) {
            message.error('Lỗi khi tải lên: ' + (err.response?.data?.message || err.message));
        } finally {
            setDrawerUploading(false);
        }
    };

    // Generate PDF and upload to Firebase from Drawer
    const handleGeneratePdfAndUpload = async (mou) => {
        setGeneratingPdf(true);
        try {
            const res = await api.post(`/mous/${mou.id}/generate-pdf-upload`);
            message.success('Đã tạo và lưu PDF lên Firebase!');
            const newFileUrl = res.data.file_url;
            setSelectedMOU(prev => ({ ...prev, file_url: newFileUrl }));
            fetchMOUs();
        } catch (err) {
            message.error('Lỗi: ' + (err.response?.data?.message || err.message));
        } finally {
            setGeneratingPdf(false);
        }
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
            fixed: 'left',
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
            fixed: 'left',
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
            width: 210,
            fixed: 'right',
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
                        <Tooltip title="Xem chi tiết">
                            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
                        </Tooltip>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <AuditOutlined className="text-xl sm:text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Biên bản ghi nhớ (MOU)</h1>
                        <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5">Danh sách thống kê các MOU đã ký với Đối tác/Doanh nghiệp</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto header-actions">
                    {!isLecturer && (
                        <>
                            <Button
                                size="middle"
                                icon={<InboxOutlined />}
                                onClick={() => { setScanResult(null); setScanError(null); setUploadedFile(null); setIsScanModalOpen(true); }}
                                className="border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg shadow-sm font-medium hover:border-purple-700 flex-1 sm:flex-initial"
                            >
                                Import MOU bằng AI
                            </Button>
                            <Button
                                size="middle"
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}
                                className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium flex-1 sm:flex-initial"
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
                <Popover content={filterContent} title="Bộ lọc nâng cao" trigger="click" placement="bottomLeft">
                    <Button icon={<FilterOutlined />} className="h-10 rounded-lg text-slate-600">
                        Bộ lọc {activeFilterCount > 0 && <Badge count={activeFilterCount} size="small" offset={[2, -2]} style={{ backgroundColor: '#1677ff' }} />}
                    </Button>
                </Popover>
            </div>

            {/* Floating Action Bar for Bulk Selection */}
            {selectedRowKeys.length > 0 && (
                <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[600px] z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-slate-200 dark:border-gray-800 shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-in-up md:animate-fade-in-up-centered">
                    <div className="flex items-center gap-2">
                        <span className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-xs font-bold px-2.5 py-1 rounded-full">
                            {selectedRowKeys.length}
                        </span>
                        <span className="text-slate-700 dark:text-gray-200 text-sm font-semibold hidden xs:inline">Biên bản MOU đã chọn</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                        <Button 
                            type="primary"
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={handleBulkDelete}
                            className="flex items-center justify-center font-medium"
                        >
                            Xóa đã chọn
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

            {/* Desktop View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
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

            {/* Mobile View */}
            <div className="block md:hidden space-y-4">
                {!isLecturer && !loading && filteredData.length > 0 && (
                    <div className="bg-slate-50 dark:bg-gray-800 p-3 rounded-lg border border-slate-200 dark:border-gray-700 mb-2 flex items-center justify-between">
                        <Checkbox
                            checked={filteredData.length > 0 && selectedRowKeys.length === filteredData.length}
                            indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < filteredData.length}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedRowKeys(filteredData.map(mou => mou.id));
                                } else {
                                    setSelectedRowKeys([]);
                                }
                            }}
                        >
                            Chọn tất cả ({filteredData.length} biên bản)
                        </Checkbox>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-10"><Spin size="large" /></div>
                ) : filteredData.length === 0 ? (
                    <Card className="text-center py-6 text-gray-400">Không có dữ liệu</Card>
                ) : (
                    filteredData.map(record => {
                        const isChecked = selectedRowKeys.includes(record.id);
                        return (
                            <Card
                                key={record.id}
                                className={`shadow-sm border rounded-xl bg-white dark:bg-gray-800 transition-colors ${
                                    isChecked 
                                        ? 'border-blue-400 dark:border-blue-500 bg-blue-50/5 dark:bg-blue-955/5' 
                                        : 'border-slate-200 dark:border-gray-700'
                                } ${record.is_deleted === 1 ? 'opacity-65 bg-red-50/10' : ''}`}
                                title={
                                    <div className="flex items-center justify-between gap-3 w-full">
                                        <span className="font-semibold text-blue-600 truncate">
                                            {record.mou_code}
                                        </span>
                                        <div className="flex items-center gap-2.5 flex-shrink-0">
                                            {record.is_deleted === 1 && <Tag color="red" className="m-0">Đã xóa</Tag>}
                                            {!isLecturer && record.is_deleted !== 1 && (
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
                                            )}
                                        </div>
                                    </div>
                                }
                            >
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-400 font-medium">Đối tác:</span>{' '}
                                    <span className="text-slate-800 dark:text-gray-200 font-semibold">{record.enterprise_name}</span>
                                </div>
                                {record.activity_title && (
                                    <div>
                                        <span className="text-gray-400 font-medium">Hoạt động:</span>{' '}
                                        <Tag color="purple" className="m-0 text-xs whitespace-normal">{record.activity_title}</Tag>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-400 font-medium">Ngày ký:</span>{' '}
                                    <span className="text-slate-700 dark:text-gray-300">{record.signing_date ? dayjs(record.signing_date).format('DD/MM/YYYY') : '---'}</span>
                                </div>
                                {record.executing_unit_name && (
                                    <div>
                                        <span className="text-gray-400 font-medium">Đơn vị:</span>{' '}
                                        <span className="text-slate-700 dark:text-gray-300">{record.executing_unit_name}</span>
                                    </div>
                                )}
                                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                    <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
                                    {record.working_dir && (
                                        <Button type="text" icon={<LinkOutlined />} onClick={() => window.open(record.working_dir, '_blank')} />
                                    )}
                                    <Button
                                        type="text"
                                        icon={record.file_url ? <InboxOutlined className="text-purple-500" /> : <FilePdfOutlined className="text-red-500" />}
                                        loading={exportingId === record.id}
                                        onClick={() => handleSmartPdfAction(record)}
                                    />
                                    {!isLecturer && record.is_deleted !== 1 && (
                                        <>
                                            <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => openEditModal(record)} />
                                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                                        </>
                                    )}
                                    {record.is_deleted === 1 && (
                                        <Button type="primary" size="small" className="bg-green-600 hover:bg-green-500 text-white border-0 rounded-md" onClick={() => handleRestore(record.id)}>Khôi phục</Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                }))}
            </div>

            {/* ==================== ADD/EDIT MODAL ==================== */}
            <Modal
                title={editingId ? "Cập nhật Biên bản ghi nhớ (MOU)" : "Thêm mới Biên bản ghi nhớ (MOU)"}
                open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); setFormUploadFile(null); }}
                footer={null}
                width={850}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={handleSave} className="mt-4">
                    <Form.Item name="file_url" hidden><Input /></Form.Item>
                    {user?.role === 'ADMIN' && (
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item name="faculty_id" label="Khoa quản lý" rules={[{ required: true, message: 'Vui lòng chọn khoa!' }]}>
                                    <Select placeholder="Chọn khoa quản lý..." className="rounded-lg" showSearch optionFilterProp="children">
                                        {faculties.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
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

                    {/* File Upload Section */}
                    <div className="border border-dashed border-slate-300 dark:border-gray-600 rounded-xl p-4 mb-4 bg-slate-50 dark:bg-gray-800/30">
                        <div className="flex items-center gap-2 mb-3">
                            <CloudUploadOutlined className="text-blue-500 text-lg" />
                            <span className="font-semibold text-slate-700 dark:text-gray-200 text-sm">Tài liệu đính kèm (tùy chọn)</span>
                        </div>
                        <Form.Item noStyle dependencies={['file_url']}>
                            {({ getFieldValue }) => {
                                const existingUrl = getFieldValue('file_url');
                                return existingUrl ? (
                                    <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 mb-2">
                                        <CheckCircleOutlined className="text-green-500" />
                                        <span className="text-sm text-green-700 dark:text-green-300 flex-1">Đã có tài liệu trên Cloud</span>
                                        <Button size="small" type="link" href={existingUrl} target="_blank" className="text-green-600">Xem</Button>
                                        <Button size="small" danger type="text" onClick={() => form.setFieldsValue({ file_url: null })}>Gỡ bỏ</Button>
                                    </div>
                                ) : null;
                            }}
                        </Form.Item>
                        {formUploadFile ? (
                            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                                <FilePdfOutlined className="text-blue-500" />
                                <span className="text-sm text-blue-700 dark:text-blue-300 flex-1 truncate">{formUploadFile.name}</span>
                                <span className="text-xs text-slate-400">{(formUploadFile.size / 1024).toFixed(1)} KB</span>
                                <Button size="small" danger type="text" onClick={() => setFormUploadFile(null)}>Xóa</Button>
                            </div>
                        ) : (
                            <>
                                <input
                                    ref={formUploadRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) setFormUploadFile(f);
                                        e.target.value = '';
                                    }}
                                />
                                <Button
                                    icon={<UploadOutlined />}
                                    onClick={() => formUploadRef.current?.click()}
                                    className="w-full rounded-lg border-dashed"
                                >
                                    Chọn file để đính kèm (JPG, PNG, PDF)
                                </Button>
                                <p className="text-xs text-slate-400 mt-1 text-center">File sẽ được tải lên Firebase sau khi lưu biên bản</p>
                            </>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-700 mt-4">
                        <Button onClick={() => { setIsModalOpen(false); setFormUploadFile(null); }} size="large" className="rounded-lg">Hủy</Button>
                        <Button type="primary" htmlType="submit" size="large" loading={formUploading} className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium">
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
                        <div className="mt-4">
                            {scanUploadingToCloud && (
                                <div className="mb-3 flex items-center gap-2 text-purple-600 text-sm">
                                    <Spin size="small" /> Đang tải lên Firebase...
                                </div>
                            )}
                            <div className="flex justify-end gap-3">
                                <Button onClick={() => setIsScanModalOpen(false)} className="rounded-lg">Hủy</Button>
                                <Button
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    onClick={handleApplyScanResult}
                                    disabled={scanUploadingToCloud}
                                    className="rounded-lg !bg-purple-600 hover:!bg-purple-500 !border-0 !text-white"
                                    size="large"
                                >
                                    Điền vào Form & Lưu
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <Drawer
                title={<span className="font-bold flex items-center gap-2"><AuditOutlined /> Chi tiết Biên bản ghi nhớ (MOU)</span>}
                placement="right"
                styles={{ wrapper: { width: window.innerWidth < 768 ? '100%' : 680 } }}
                onClose={() => setIsDrawerOpen(false)}
                open={isDrawerOpen}
                className="bg-slate-50 dark:bg-gray-800/50"
            >
                {selectedMOU && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-bold text-blue-600 m-0 leading-tight">{selectedMOU.mou_code}</h2>
                                {selectedMOU.is_deleted === 1 && <Tag color="red" className="m-0">Đã xóa</Tag>}
                            </div>
                            <div className="text-sm text-gray-500 mb-6 flex flex-col gap-1">
                                <div><span className="font-medium text-slate-600 dark:text-gray-400">Đối tác:</span> <span className="font-semibold text-slate-800 dark:text-gray-100">{selectedMOU.enterprise_name}</span></div>
                                <div><span className="font-medium text-slate-600 dark:text-gray-400">Quốc gia:</span> <span className="text-slate-800 dark:text-gray-100">{selectedMOU.country || 'Việt Nam'}</span></div>
                                <div><span className="font-medium text-slate-600 dark:text-gray-400">Đơn vị triển khai:</span> <span className="text-slate-800 dark:text-gray-100">{selectedMOU.executing_unit_name || '---'}</span></div>
                            </div>

                            <Descriptions column={2} layout="vertical" size="small" bordered className="bg-white dark:bg-gray-800">
                                <Descriptions.Item label="Ngày ký kết"><span className="font-medium">{selectedMOU.signing_date ? dayjs(selectedMOU.signing_date).format('DD/MM/YYYY') : '---'}</span></Descriptions.Item>
                                <Descriptions.Item label="Loại tổ chức"><Tag color="blue">{selectedMOU.org_type || '---'}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Đầu mối VLU" span={1}><span className="font-medium">{selectedMOU.vlu_contact || '---'}</span></Descriptions.Item>
                                <Descriptions.Item label="Đầu mối Đối tác" span={1}><span className="font-medium">{selectedMOU.partner_contact || '---'}</span></Descriptions.Item>
                                <Descriptions.Item label="Hoạt động liên kết" span={2}>
                                    {selectedMOU.activity_title ? <Tag color="purple">{selectedMOU.activity_title}</Tag> : '---'}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>

                        {selectedMOU.collaboration_scope && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-3 border-b pb-2">Mảng hợp tác</h3>
                                <div className="text-slate-600 dark:text-gray-300 whitespace-pre-wrap">{selectedMOU.collaboration_scope}</div>
                            </div>
                        )}

                        {(selectedMOU.tasks_ay24_25 || selectedMOU.next_steps) && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-3 border-b pb-2">Kế hoạch triển khai</h3>
                                <Descriptions column={1} layout="vertical" size="small" bordered className="bg-white dark:bg-gray-800">
                                    {selectedMOU.tasks_ay24_25 && (
                                        <Descriptions.Item label="Công tác đã triển khai NH 24-25">
                                            <div className="whitespace-pre-wrap">{selectedMOU.tasks_ay24_25}</div>
                                        </Descriptions.Item>
                                    )}
                                    {selectedMOU.next_steps && (
                                        <Descriptions.Item label="Bước kế tiếp (Dự kiến)">
                                            <div className="whitespace-pre-wrap">{selectedMOU.next_steps}</div>
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </div>
                        )}

                        {(selectedMOU.past_activities || selectedMOU.related_data) && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-3 border-b pb-2">Thông tin bổ sung</h3>
                                <Descriptions column={1} layout="vertical" size="small" bordered className="bg-white dark:bg-gray-800">
                                    {selectedMOU.past_activities && (
                                        <Descriptions.Item label="Hoạt động cũ">
                                            <div className="whitespace-pre-wrap">{selectedMOU.past_activities}</div>
                                        </Descriptions.Item>
                                    )}
                                    {selectedMOU.related_data && (
                                        <Descriptions.Item label="Số liệu liên quan (sv, ngành...)">
                                            <div className="whitespace-pre-wrap">{selectedMOU.related_data}</div>
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-3 border-b pb-2 flex items-center gap-2">
                                <CloudUploadOutlined className="text-blue-500" /> Tài liệu đính kèm
                            </h3>
                            <div className="flex flex-col gap-3">
                                {/* CASE 1: Already has file_url */}
                                {selectedMOU.file_url ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
                                            <CheckCircleOutlined className="text-green-500 text-lg" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-green-700 dark:text-green-300 text-sm m-0">Tài liệu đã có trên Cloud</p>
                                                <p className="text-green-600/70 text-xs m-0 truncate">{selectedMOU.file_url}</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="primary"
                                            icon={<EyeOutlined />}
                                            onClick={() => window.open(selectedMOU.file_url, '_blank')}
                                            className="bg-purple-600 hover:bg-purple-500 border-none w-full text-white flex items-center justify-center rounded-lg"
                                        >
                                            Xem tài liệu gốc (Cloud)
                                        </Button>
                                        <Divider className="my-1" plain><span className="text-xs text-slate-400">Hoặc thay thế bằng file khác</span></Divider>
                                        {/* Allow replacing */}
                                        {!isLecturer && (
                                            <>
                                                {drawerUploadFile ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg px-3 py-2">
                                                            <FilePdfOutlined className="text-blue-500" />
                                                            <span className="text-sm text-blue-700 dark:text-blue-300 flex-1 truncate">{drawerUploadFile.name}</span>
                                                            <span className="text-xs text-slate-400">{(drawerUploadFile.size / 1024).toFixed(1)} KB</span>
                                                            <Button size="small" danger type="text" onClick={() => setDrawerUploadFile(null)}>Xóa</Button>
                                                        </div>
                                                        <Button
                                                            type="primary"
                                                            icon={<CloudUploadOutlined />}
                                                            loading={drawerUploading}
                                                            onClick={handleUploadFileToMOU}
                                                            className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 border-none text-white"
                                                        >
                                                            Tải lên & Cập nhật tài liệu
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <input
                                                            ref={drawerUploadRef}
                                                            type="file"
                                                            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                                                            style={{ display: 'none' }}
                                                            onChange={(e) => {
                                                                const f = e.target.files?.[0];
                                                                if (f) setDrawerUploadFile(f);
                                                                e.target.value = '';
                                                            }}
                                                        />
                                                        <Button
                                                            icon={<UploadOutlined />}
                                                            onClick={() => drawerUploadRef.current?.click()}
                                                            className="w-full rounded-lg border-dashed"
                                                        >
                                                            Chọn file để thay thế
                                                        </Button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    /* CASE 2: No file yet - show options */
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                                            <ExclamationCircleOutlined className="text-amber-500 text-lg" />
                                            <div>
                                                <p className="font-semibold text-amber-700 dark:text-amber-300 text-sm m-0">Chưa có tài liệu đính kèm</p>
                                                <p className="text-amber-600/70 text-xs m-0">Hãy tải lên file gốc hoặc tạo PDF biên bản mẫu</p>
                                            </div>
                                        </div>

                                        {!isLecturer && (
                                            <>
                                                {/* Option A: Manual file upload */}
                                                <div className="border border-dashed border-slate-300 dark:border-gray-600 rounded-xl p-3">
                                                    <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                        <UploadOutlined /> Tải lên tài liệu gốc
                                                    </p>
                                                    {drawerUploadFile ? (
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg px-3 py-2">
                                                                <FilePdfOutlined className="text-blue-500" />
                                                                <span className="text-sm text-blue-700 dark:text-blue-300 flex-1 truncate">{drawerUploadFile.name}</span>
                                                                <span className="text-xs text-slate-400">{(drawerUploadFile.size / 1024).toFixed(1)} KB</span>
                                                                <Button size="small" danger type="text" onClick={() => setDrawerUploadFile(null)}>Xóa</Button>
                                                            </div>
                                                            <Button
                                                                type="primary"
                                                                icon={<CloudUploadOutlined />}
                                                                loading={drawerUploading}
                                                                onClick={handleUploadFileToMOU}
                                                                className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 border-none text-white"
                                                            >
                                                                Xác nhận tải lên Firebase
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <input
                                                                ref={drawerUploadRef}
                                                                type="file"
                                                                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                                                                style={{ display: 'none' }}
                                                                onChange={(e) => {
                                                                    const f = e.target.files?.[0];
                                                                    if (f) setDrawerUploadFile(f);
                                                                    e.target.value = '';
                                                                }}
                                                            />
                                                            <Button
                                                                icon={<UploadOutlined />}
                                                                onClick={() => drawerUploadRef.current?.click()}
                                                                className="w-full rounded-lg border-dashed"
                                                            >
                                                                Chọn file để tải lên (JPG, PNG, PDF)
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Option B: Generate PDF and upload */}
                                                <div className="border border-dashed border-slate-300 dark:border-gray-600 rounded-xl p-3">
                                                    <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                        <FilePdfOutlined /> Tự tạo PDF biên bản mẫu
                                                    </p>
                                                    <Button
                                                        icon={<CloudUploadOutlined />}
                                                        loading={generatingPdf}
                                                        onClick={() => handleGeneratePdfAndUpload(selectedMOU)}
                                                        className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border-none"
                                                    >
                                                        {generatingPdf ? 'Đang tạo & tải lên...' : 'Tạo PDF mẫu & Upload lên Firebase'}
                                                    </Button>
                                                    <p className="text-xs text-slate-400 mt-1 text-center">
                                                        Hệ thống sẽ tạo PDF biên bản từ dữ liệu hiện có rồi lưu lên Cloud
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Always show download PDF template */}
                                <Button icon={<FilePdfOutlined />} onClick={() => handleExportPdf(selectedMOU)} className="w-full rounded-lg">
                                    Tải xuống PDF Biên bản mẫu
                                </Button>
                                {selectedMOU.working_dir && (
                                    <Button icon={<LinkOutlined />} onClick={() => window.open(selectedMOU.working_dir, '_blank')} className="w-full rounded-lg">
                                        Thư mục làm việc (Drive/Link)
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default MOUList;
