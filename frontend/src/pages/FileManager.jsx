import React, { useEffect, useState } from 'react';
import { Table, Card, Row, Col, Button, Tag, Space, Popconfirm, Statistic, Spin, Empty, message, Input, Tooltip, Breadcrumb, App as AntApp } from 'antd';
import { 
    FileOutlined, DeleteOutlined, CloudServerOutlined, 
    ReloadOutlined, SearchOutlined, CheckCircleOutlined, 
    ExclamationCircleOutlined, DownloadOutlined, ClearOutlined,
    FileImageOutlined, FilePdfOutlined, AudioOutlined,
    FolderFilled, FolderOpenFilled, ArrowLeftOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const FileManager = () => {
    const { modal } = AntApp.useApp();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'in_use' | 'garbage'
    const [currentPath, setCurrentPath] = useState(''); // E.g., 'kanban', 'mous', or '' (root)

    useEffect(() => {
        document.title = "Quản lý File & Rác | VLU Enterprise Link Manager";
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await api.get('/files');
            if (res.data.success) {
                setFiles(res.data.files || []);
            } else {
                message.warning(res.data.message || 'Firebase Storage chưa được cấu hình.');
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách file từ Firebase');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (filePath, isFolder) => {
        try {
            const res = await api.post('/files/delete', { filePath, isFolder });
            if (res.data.success) {
                message.success(isFolder ? `Đã xóa thư mục ${filePath} thành công!` : 'Đã xóa file thành công!');
                fetchFiles();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi thực hiện xóa');
        }
    };

    const handleCleanupGarbage = () => {
        const garbageFiles = files.filter(f => !f.isReferenced);
        if (garbageFiles.length === 0) {
            message.info('Không có file rác nào cần dọn dẹp!');
            return;
        }

        modal.confirm({
            title: `Xác nhận dọn dẹp ${garbageFiles.length} file rác?`,
            content: 'Tất cả các file này không được liên kết với bất kỳ Doanh nghiệp, MOU, Nhiệm vụ hay Ghi chú nào trong hệ thống. Hành động này sẽ xóa vĩnh viễn chúng khỏi Firebase Storage và không thể khôi phục.',
            okText: 'Dọn dẹp ngay',
            okType: 'danger',
            cancelText: 'Hủy',
            okButtonProps: { className: '!bg-red-600 hover:!bg-red-500 text-white border-none' },
            onOk: async () => {
                setCleaning(true);
                try {
                    const res = await api.post('/files/cleanup');
                    if (res.data.success) {
                        modal.success({
                            title: 'Dọn dẹp hoàn tất!',
                            content: `Đã xóa thành công ${res.data.deletedCount} file rác khỏi Firebase.`,
                        });
                        fetchFiles();
                    }
                } catch (error) {
                    message.error('Lỗi trong quá trình dọn dẹp file rác');
                } finally {
                    setCleaning(false);
                }
            }
        });
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const getFileIcon = (contentType, fileName) => {
        const type = contentType || '';
        const name = (fileName || '').toLowerCase();
        if (type.startsWith('image/') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif') || name.endsWith('.webp')) {
            return <FileImageOutlined className="text-emerald-500 text-lg" />;
        }
        if (type === 'application/pdf' || name.endsWith('.pdf')) {
            return <FilePdfOutlined className="text-red-500 text-lg" />;
        }
        if (type.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a')) {
            return <AudioOutlined className="text-purple-500 text-lg" />;
        }
        return <FileOutlined className="text-blue-500 text-lg" />;
    };

    // Calculate metrics globally
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const garbageFiles = files.filter(f => !f.isReferenced);
    const garbageCount = garbageFiles.length;
    const garbageSize = garbageFiles.reduce((sum, f) => sum + (f.size || 0), 0);

    // Group files by path into folder nodes and file nodes for hierarchical navigation
    const getItemsInPath = (pathStr) => {
        const folders = new Set();
        const items = [];

        files.forEach(file => {
            const name = file.name;
            if (pathStr === "") {
                // Root level
                if (name.includes("/")) {
                    const topFolder = name.split("/")[0];
                    folders.add(topFolder);
                } else {
                    items.push(file);
                }
            } else {
                // Inside a folder, e.g., "kanban"
                if (name.startsWith(pathStr + "/")) {
                    const relative = name.substring(pathStr.length + 1);
                    if (relative.includes("/")) {
                        const nextFolder = relative.split("/")[0];
                        folders.add(pathStr + "/" + nextFolder);
                    } else {
                        items.push(file);
                    }
                }
            }
        });

        const folderList = Array.from(folders).map(folderPath => {
            const folderName = folderPath.includes("/") ? folderPath.split("/").pop() : folderPath;
            
            // Calculate recursively
            const folderFiles = files.filter(f => f.name.startsWith(folderPath + "/"));
            const size = folderFiles.reduce((sum, f) => sum + (f.size || 0), 0);
            const totalCount = folderFiles.length;
            const garbageCount = folderFiles.filter(f => !f.isReferenced).length;

            return {
                name: folderName,
                path: folderPath,
                isFolder: true,
                size,
                totalCount,
                garbageCount,
                contentType: 'folder'
            };
        });

        const fileList = items.map(file => ({
            ...file,
            isFolder: false
        }));

        // Apply status filter on files if viewing hierarchically
        const filteredFileList = fileList.filter(file => {
            if (filterStatus === 'all') return true;
            if (filterStatus === 'in_use') return file.isReferenced;
            if (filterStatus === 'garbage') return !file.isReferenced;
            return true;
        });

        // Apply status filter on folders: if status is 'garbage', only show folders containing garbage
        const filteredFolderList = folderList.filter(folder => {
            if (filterStatus === 'all') return true;
            if (filterStatus === 'in_use') return (folder.totalCount - folder.garbageCount) > 0;
            if (filterStatus === 'garbage') return folder.garbageCount > 0;
            return true;
        });

        return [...filteredFolderList, ...filteredFileList];
    };

    // If searching, return flat matched files globally
    const getFlatSearchResults = () => {
        return files.filter(file => {
            const matchesSearch = file.name.toLowerCase().includes(searchText.toLowerCase());
            const matchesStatus = 
                filterStatus === 'all' || 
                (filterStatus === 'in_use' && file.isReferenced) ||
                (filterStatus === 'garbage' && !file.isReferenced);
            return matchesSearch && matchesStatus;
        }).map(file => ({
            ...file,
            isFolder: false
        }));
    };

    const tableData = searchText.trim() !== '' ? getFlatSearchResults() : getItemsInPath(currentPath);

    const handleBreadcrumbClick = (path) => {
        setSearchText('');
        setCurrentPath(path);
    };

    const renderBreadcrumbs = () => {
        const paths = currentPath ? currentPath.split('/') : [];
        const items = [
            {
                title: <a onClick={() => handleBreadcrumbClick('')}>Root</a>,
                key: 'root'
            }
        ];

        let accumulated = '';
        paths.forEach((p, idx) => {
            accumulated += (idx === 0 ? '' : '/') + p;
            const targetPath = accumulated;
            const isLast = idx === paths.length - 1;
            items.push({
                title: isLast ? <span className="font-semibold text-slate-800 dark:text-gray-100">{p}</span> : <a onClick={() => handleBreadcrumbClick(targetPath)}>{p}</a>,
                key: targetPath
            });
        });

        return <Breadcrumb items={items} className="mb-4 text-sm bg-slate-50 dark:bg-gray-800/30 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-gray-700/30 inline-block" />;
    };

    const columns = [
        {
            title: 'Tên file / Thư mục',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (text, record) => {
                if (record.isFolder) {
                    return (
                        <div 
                            onClick={() => setCurrentPath(record.path)}
                            className="flex items-center gap-2 cursor-pointer text-blue-600 hover:text-blue-500 font-semibold transition-colors group"
                        >
                            <FolderFilled className="text-amber-500 text-xl group-hover:scale-105 transition-transform" />
                            <span>{text}</span>
                        </div>
                    );
                }
                
                // For files, we show the relative name inside the folder if browsing, or full name if searching flatly
                const displayName = searchText.trim() !== '' ? record.name : (record.name.includes('/') ? record.name.split('/').pop() : record.name);
                return (
                    <Space>
                        {getFileIcon(record.contentType, record.name)}
                        <span className="font-medium text-slate-700 dark:text-gray-200 break-all select-all">
                            {displayName}
                        </span>
                    </Space>
                );
            }
        },
        {
            title: 'Dung lượng',
            dataIndex: 'size',
            key: 'size',
            sorter: (a, b) => a.size - b.size,
            render: (size) => formatBytes(size)
        },
        {
            title: 'Loại',
            dataIndex: 'contentType',
            key: 'contentType',
            render: (type, record) => {
                if (record.isFolder) {
                    return <span className="text-slate-400 dark:text-gray-500 italic">Thư mục ({record.totalCount} files)</span>;
                }
                return type || 'Không xác định';
            }
        },
        {
            title: 'Trạng thái / Rác',
            dataIndex: 'isReferenced',
            key: 'isReferenced',
            render: (_, record) => {
                if (record.isFolder) {
                    return record.garbageCount > 0 ? (
                        <Tag color="error" icon={<ExclamationCircleOutlined />} className="px-2.5 py-0.5 rounded-full font-medium">
                            {record.garbageCount} file rác
                        </Tag>
                    ) : (
                        <Tag color="success" icon={<CheckCircleOutlined />} className="px-2.5 py-0.5 rounded-full font-medium">
                            Sạch
                        </Tag>
                    );
                }
                return record.isReferenced ? (
                    <Tag color="success" icon={<CheckCircleOutlined />} className="px-2.5 py-0.5 rounded-full font-medium">Đang sử dụng</Tag>
                ) : (
                    <Tag color="error" icon={<ExclamationCircleOutlined />} className="px-2.5 py-0.5 rounded-full font-medium">File rác</Tag>
                );
            }
        },
        {
            title: 'Ngày cập nhật',
            dataIndex: 'updated',
            key: 'updated',
            sorter: (a, b) => {
                if (a.isFolder && b.isFolder) return 0;
                if (a.isFolder) return -1;
                if (b.isFolder) return 1;
                return new Date(a.updated) - new Date(b.updated);
            },
            render: (date, record) => {
                if (record.isFolder) return '—';
                return date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '—';
            }
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => {
                if (record.isFolder) {
                    const deleteConfirmMessage = `Bạn có chắc chắn muốn xóa thư mục "${record.name}"? Thư mục chứa ${record.totalCount} tệp tin và toàn bộ dữ liệu bên trong sẽ bị xóa vĩnh viễn trên Firebase Storage.`;
                    return (
                        <Popconfirm
                            title={`Xác nhận xóa thư mục ${record.name}?`}
                            description={deleteConfirmMessage}
                            onConfirm={() => handleDelete(record.path, true)}
                            okText="Xóa toàn bộ"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white border-none' }}
                        >
                            <Tooltip title="Xóa thư mục">
                                <Button 
                                    type="text" 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                />
                            </Tooltip>
                        </Popconfirm>
                    );
                }

                return (
                    <Space size="middle">
                        <Tooltip title="Tải xuống / Xem file">
                            <Button 
                                type="text" 
                                icon={<DownloadOutlined />} 
                                href={record.url} 
                                target="_blank" 
                                className="text-blue-600 hover:text-blue-700"
                            />
                        </Tooltip>
                        <Popconfirm
                            title="Xác nhận xóa file?"
                            description="Hành động này sẽ xóa vĩnh viễn file khỏi Firebase Storage."
                            onConfirm={() => handleDelete(record.name, false)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white border-none' }}
                        >
                            <Tooltip title="Xóa file">
                                <Button 
                                    type="text" 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                />
                            </Tooltip>
                        </Popconfirm>
                    </Space>
                );
            }
        }
    ];

    return (
        <div className="p-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <CloudServerOutlined className="text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Quản lý File & Dọn rác Firebase</h1>
                        <p className="text-sm text-slate-500 m-0 mt-0.5">Kiểm soát tệp đính kèm và giải phóng tài nguyên lưu trữ đám mây</p>
                    </div>
                </div>

                <Space className="w-full sm:w-auto">
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={fetchFiles}
                        loading={loading}
                        className="rounded-lg font-medium"
                    >
                        Làm mới
                    </Button>
                    <Button 
                        type="primary"
                        danger
                        icon={<ClearOutlined />} 
                        onClick={handleCleanupGarbage}
                        loading={cleaning}
                        className="bg-red-600 hover:bg-red-500 border-none rounded-lg font-semibold text-white shadow-sm"
                    >
                        Dọn dẹp file rác
                    </Button>
                </Space>
            </div>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="shadow-sm rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700/50">
                        <Statistic 
                            title={<span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Tổng số File</span>}
                            value={totalFiles}
                            prefix={<CloudServerOutlined className="text-blue-500 mr-2" />}
                            valueStyle={{ fontWeight: 800 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="shadow-sm rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700/50">
                        <Statistic 
                            title={<span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Tổng dung lượng</span>}
                            value={formatBytes(totalSize)}
                            valueStyle={{ fontWeight: 800 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="shadow-sm rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700/50 bg-gradient-to-br from-red-50 to-red-100/10 dark:from-red-950/10 dark:to-red-900/5">
                        <Statistic 
                            title={<span className="text-red-500/80 dark:text-red-400 font-semibold text-xs uppercase tracking-wider">Số File rác</span>}
                            value={garbageCount}
                            prefix={<ExclamationCircleOutlined className="text-red-500 mr-2" />}
                            valueStyle={{ fontWeight: 800, color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="shadow-sm rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700/50">
                        <Statistic 
                            title={<span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Dung lượng rác</span>}
                            value={formatBytes(garbageSize)}
                            valueStyle={{ fontWeight: 800, color: garbageCount > 0 ? '#ff4d4f' : 'inherit' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filter and Search Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-slate-100 dark:border-gray-700 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[260px]">
                    <Input 
                        placeholder="Tìm kiếm file theo tên (tìm toàn hệ thống)..." 
                        prefix={<SearchOutlined className="text-slate-300" />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                        className="rounded-lg h-9"
                    />
                </div>
                <div className="flex bg-slate-100 dark:bg-gray-700/60 p-1 rounded-lg border border-slate-200/50 dark:border-gray-600/40">
                    <button 
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            filterStatus === 'all'
                                ? 'bg-white dark:bg-gray-600 text-slate-800 dark:text-gray-100 shadow-sm'
                                : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
                        }`}
                    >
                        Tất cả
                    </button>
                    <button 
                        onClick={() => setFilterStatus('in_use')}
                        className={`px-4 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            filterStatus === 'in_use'
                                ? 'bg-white dark:bg-gray-600 text-slate-800 dark:text-gray-100 shadow-sm'
                                : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
                        }`}
                    >
                        Đang sử dụng
                    </button>
                    <button 
                        onClick={() => setFilterStatus('garbage')}
                        className={`px-4 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            filterStatus === 'garbage'
                                ? 'bg-white dark:bg-gray-600 text-slate-800 dark:text-gray-100 shadow-sm'
                                : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
                        }`}
                    >
                        File rác
                    </button>
                </div>
            </div>

            {/* Breadcrumbs Navigation & Back Button */}
            {searchText.trim() === '' && (
                <div className="flex items-center gap-3 mb-2">
                    {currentPath !== '' && (
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => {
                                const segments = currentPath.split('/');
                                segments.pop();
                                setCurrentPath(segments.join('/'));
                            }}
                            className="rounded-lg h-9 font-medium"
                        >
                            Quay lại
                        </Button>
                    )}
                    {renderBreadcrumbs()}
                </div>
            )}

            {/* Main Table */}
            <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <Table 
                    dataSource={tableData} 
                    columns={columns} 
                    rowKey={(record) => record.isFolder ? `folder-${record.path}` : record.name}
                    loading={loading}
                    pagination={{
                        showSizeChanger: true,
                        defaultPageSize: 10,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total) => `Tổng số ${total} mục`
                    }}
                    locale={{
                        emptyText: <Empty description={files.length === 0 ? "Firebase Storage trống hoặc chưa được cấu hình." : "Thư mục trống hoặc không tìm thấy mục phù hợp."} />
                    }}
                    className="custom-table"
                />
            </div>
        </div>
    );
};

export default FileManager;
