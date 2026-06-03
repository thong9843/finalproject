import React, { useState, useEffect, useRef } from 'react';
import { message, Card, Select, Typography, Spin, Badge, Button, Modal, Form, Input, DatePicker, TimePicker, Tag, Tooltip, Dropdown, Menu, Row, Col , Switch, App as AntApp } from 'antd';
import { PlusOutlined, BankOutlined, ProjectOutlined, CalendarOutlined, PushpinOutlined, MoreOutlined, DragOutlined, EditOutlined, DeleteOutlined, UserOutlined, HomeOutlined, AppstoreOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ENTERPRISE_STATUSES = [
  { name: 'Tiềm năng', color: 'bg-blue-500', hex: '#3b82f6', tagConfig: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-500/20' } },
  { name: 'Liên hệ', color: 'bg-cyan-500', hex: '#06b6d4', tagConfig: { bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-100 dark:border-cyan-500/20' } },
  { name: 'Đàm phán', color: 'bg-purple-500', hex: '#a855f7', tagConfig: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-500/20' } },
  { name: 'Đề xuất', color: 'bg-orange-500', hex: '#f97316', tagConfig: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-500/20' } },
  { name: 'Đã ký hợp tác', color: 'bg-green-500', hex: '#22c55e', tagConfig: { bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-100 dark:border-green-500/20' } },
  { name: 'Đang triển khai', color: 'bg-teal-500', hex: '#14b8a6', tagConfig: { bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-teal-500/20' } },
  { name: 'Đã hoàn thành', color: 'bg-indigo-500', hex: '#6366f1', tagConfig: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-500/20' } },
  { name: 'Đã tạm ngưng', color: 'bg-red-500', hex: '#ef4444', tagConfig: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-100 dark:border-red-500/20' } },
];

const ACTIVITY_STATUSES = [
  { name: 'Đề xuất', color: 'bg-orange-500', hex: '#f97316', tagConfig: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-500/20' } },
  { name: 'Phê duyệt nội bộ', color: 'bg-purple-500', hex: '#a855f7', tagConfig: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-500/20' } },
  { name: 'Đã triển khai', color: 'bg-blue-500', hex: '#3b82f6', tagConfig: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-500/20' } },
  { name: 'Đã kết thúc', color: 'bg-green-500', hex: '#22c55e', tagConfig: { bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-100 dark:border-green-500/20' } },
];

const KanbanBoard = () => {
  const userCookie = Cookies.get('user');
  let user = null;
  try {
      if (userCookie) user = JSON.parse(userCookie);
  } catch (e) {
      console.error("Failed to parse user cookie", e);
  }
  const isAdmin = user?.role === 'ADMIN';

  const [view, setView] = useState('ENTERPRISE');
    const { modal } = AntApp.useApp();
  const [items, setItems] = useState([]);
  const [enterprises, setEnterprises] = useState([]); // Needed for activity modal dropdown
  const [activityTypes, setActivityTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [scales, setScales] = useState([]);
  const [fields, setFields] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Drag state
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Modal forms & CRUD state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Fetch functions
  const fetchItems = async () => {
    setLoading(true);
    try {
      const endpoint = view === 'ENTERPRISE' ? '/enterprises' : '/activities';
      const res = await api.get(endpoint);
      setItems(res.data);
    } catch (error) {
      message.error(`Lỗi khi tải dữ liệu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnterprisesAndDependencies = async () => {
    try {
      const [entRes, actTypeRes, targetRes] = await Promise.all([
        api.get('/enterprises'),
        api.get('/structure/act-types'),
        api.get('/structure/targets')
      ]);
      setEnterprises(entRes.data);
      setActivityTypes(actTypeRes.data || []);
      setTargets(targetRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchEnterpriseDependencies = async () => {
    try {
      const [depRes, scaleRes, fieldRes] = await Promise.all([
        api.get('/structure/departments'),
        api.get('/structure/scales'),
        api.get('/structure/fields')
      ]);
      setDepartments(depRes.data);
      setScales(scaleRes.data);
      setFields(fieldRes.data);
      if (isAdmin) {
        const facRes = await api.get('/structure/faculties');
        setFaculties(facRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching enterprise dependencies:', error);
    }
  };

  useEffect(() => {
    fetchItems();
    if (view === 'ACTIVITY') {
      fetchEnterprisesAndDependencies();
      document.title = "Bảng Kanban Hoạt động | VLU Enterprise Link Manager";
    } else {
      fetchEnterpriseDependencies();
      document.title = "Bảng Kanban Doanh nghiệp | VLU Enterprise Link Manager";
    }
  }, [view]);

  // Horizontal scroll for Kanban columns via mouse wheel
  const boardRef = useRef(null);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // Ignore if not a vertical scroll
      if (Math.abs(e.deltaY) === 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      let target = e.target;
      let preventCustomScroll = false;

      // Check if we are hovering over an inner scrollable vertical container
      while (target && target !== el) {
        if (target.scrollHeight > target.clientHeight) {
          const style = window.getComputedStyle(target);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            const isAtTop = target.scrollTop === 0;
            const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
            
            // Allow native vertical scroll if the inner container can still scroll in that direction
            if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
              preventCustomScroll = true;
              break;
            }
          }
        }
        target = target.parentNode;
      }

      if (!preventCustomScroll) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // API Interaction Functions
  const handleStatusChange = async (item, newStatus) => {
    if (item.status === newStatus) return;
    
    // Optimistic update
    const previousItems = [...items];
    setItems(items.map(i => i.id === item.id ? { ...i, status: newStatus } : i));

    try {
      if (view === 'ENTERPRISE') {
        const payload = { ...item, status: newStatus };
        await api.put(`/enterprises/${item.id}`, payload);
      } else {
        await api.put(`/activities/${item.id}/status`, { status: newStatus });
      }
      message.success('Cập nhật trạng thái thành công!');
    } catch (error) {
      setItems(previousItems);
      message.error(`Lỗi khi cập nhật trạng thái: ${error.response?.data?.message || error.message}`);
    }
  };

  const submitActivitySave = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD') || null,
        start_time: values.start_time?.format('HH:mm:ss') || null,
        end_time: values.end_time?.format('HH:mm:ss') || null,
        collaboration_date: values.collaboration_date?.format('YYYY-MM-DD') || null,
        type_ids: values.type_ids || [],
        target_ids: values.target_ids || [],
      };
      if (editingId) {
        await api.put(`/activities/${editingId}`, payload);
        message.success('Cập nhật hoạt động thành công');
      } else {
        await api.post('/activities', payload);
        message.success('Thêm hoạt động thành công');
      }
      setIsModalOpen(false);
      setEditingId(null);
      form.resetFields();
      fetchItems();
    } catch (error) {
      message.error(`Lỗi khi lưu: ${error.response?.data?.message || 'Không xác định'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async (values) => {
    if (view === 'ENTERPRISE') {
      setSubmitting(true);
      try {
        if (editingId) {
          await api.put(`/enterprises/${editingId}`, values);
          message.success('Cập nhật doanh nghiệp thành công');
        } else {
          await api.post('/enterprises', values);
          message.success('Thêm doanh nghiệp thành công');
        }
        setIsModalOpen(false);
        setEditingId(null);
        form.resetFields();
        fetchItems();
      } catch (error) {
        message.error(`Lỗi khi lưu: ${error.response?.data?.message || 'Không xác định'}`);
      } finally {
        setSubmitting(false);
      }
    } else {
      // Validate dates and times
      if (values.start_date && values.end_date) {
        if (values.end_date.isBefore(values.start_date, 'day')) {
          message.error('Ngày kết thúc không được nhỏ hơn ngày bắt đầu');
          return;
        }
        if (values.start_date.isSame(values.end_date, 'day') && values.start_time && values.end_time) {
          if (values.end_time.isBefore(values.start_time, 'second') || values.end_time.isSame(values.start_time, 'second')) {
            message.error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu khi trong cùng một ngày');
            return;
          }
        }
      }

      // Check overlap
      const sDate = values.start_date.format('YYYY-MM-DD');
      const eDate = values.end_date ? values.end_date.format('YYYY-MM-DD') : sDate;
      const sTime = values.start_time ? values.start_time.format('HH:mm:ss') : '00:00:00';
      const eTime = values.end_time ? values.end_time.format('HH:mm:ss') : '23:59:59';
      const newStart = dayjs(`${sDate} ${sTime}`);
      const newEnd = dayjs(`${eDate} ${eTime}`);

      const isOverlap = items.some(act => {
        if (act.id === editingId) return false;

        if (!act.start_date) return false;
        const actSDate = dayjs(act.start_date).format('YYYY-MM-DD');
        const actEDate = act.end_date ? dayjs(act.end_date).format('YYYY-MM-DD') : actSDate;
        const actSTime = act.start_time || '00:00:00';
        const actETime = act.end_time || '23:59:59';

        const actStart = dayjs(`${actSDate} ${actSTime}`);
        const actEnd = dayjs(`${actEDate} ${actETime}`);

        return newStart.isBefore(actEnd) && newEnd.isAfter(actStart);
      });

      if (isOverlap) {
        modal.confirm({
          title: 'Cảnh báo trùng lặp thời gian',
          content: 'Thời gian của hoạt động này đang bị trùng với một hoạt động khác. Bạn có chắc chắn muốn tiếp tục lưu?',
          onOk: () => submitActivitySave(values),
        });
        return;
      }

      submitActivitySave(values);
    }
  };

  const handleDelete = async (item) => {
    try {
      const endpoint = view === 'ENTERPRISE' ? `/enterprises/${item.id}` : `/activities/${item.id}`;
      await api.delete(endpoint);
      message.success('Xóa thành công');
      fetchItems();
    } catch (error) {
      message.error(`Lỗi khi xóa: ${error.response?.data?.message || 'Không xác định'}`);
    }
  };

  // Drag Handlers
  const onDragStart = (e, item) => {
    e.dataTransfer.setData('itemId', item.id);
    setDraggedItemId(item.id);
  };

  const onDragOver = (e, status) => {
    e.preventDefault();
    if (dragOverCol !== status) {
      setDragOverCol(status);
    }
  };

  const onDragLeave = () => {
    setDragOverCol(null);
  };

  const onDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggedItemId(null);
    
    const itemId = e.dataTransfer.getData('itemId');
    if (!itemId) return;
    
    const item = items.find(i => i.id === parseInt(itemId, 10));
    if (item && item.status !== newStatus) {
      handleStatusChange(item, newStatus);
    }
  };

  const onDragEnd = () => {
    setDragOverCol(null);
    setDraggedItemId(null);
  };

  const removeAccents = (str) => {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  const filterOptionIgnoreCase = (input, option) => 
    removeAccents(option?.children || '').includes(removeAccents(input));

  // View Handlers
  const openAddModal = () => {
    setEditingId(null);
    form.resetFields();
    if (view === 'ENTERPRISE') {
      form.setFieldsValue({ status: 'Tiềm năng', is_hcmc: true, country: 'Việt Nam' });
    } else {
      form.setFieldsValue({ status: 'Đề xuất' });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    if (view === 'ENTERPRISE') {
      form.setFieldsValue({
        ...item,
        field_ids: item.field_ids ? item.field_ids.split(',').map(Number) : [],
        faculty_id: item.faculty_id,
      });
    } else {
      form.setFieldsValue({
        ...item,
        type_ids: item.type_ids ? item.type_ids.split(',').map(Number) : [],
        target_ids: item.target_ids ? item.target_ids.split(',').map(Number) : [],
        start_date: item.start_date ? dayjs(item.start_date) : null,
        end_date: item.end_date ? dayjs(item.end_date) : null,
        start_time: item.start_time ? dayjs(`1970-01-01 ${item.start_time}`) : null,
        end_time: item.end_time ? dayjs(`1970-01-01 ${item.end_time}`) : null,
        collaboration_date: item.collaboration_date ? dayjs(item.collaboration_date) : null,
      });
    }
    setIsModalOpen(true);
  };

  const showDeleteConfirm = (item) => {
    modal.confirm({
      title: 'Bạn có chắc chắn muốn xóa?',
      content: view === 'ENTERPRISE' ? `Xóa doanh nghiệp "${item.name}"?` : `Xóa hoạt động "${item.title}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => handleDelete(item),
    });
  };

  const currentConfig = view === 'ENTERPRISE' ? ENTERPRISE_STATUSES : ACTIVITY_STATUSES;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
            <AppstoreOutlined className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Bảng Kanban</h1>
            <p className="text-sm text-slate-500 m-0 mt-0.5">Quản lý và cập nhật tiến độ công việc một cách trực quan</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select 
            value={view} 
            onChange={setView} 
            className="w-[180px]"
            size="large"
          >
            <Option value="ENTERPRISE">Doanh nghiệp</Option>
            <Option value="ACTIVITY">Hoạt động</Option>
          </Select>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large"
            onClick={openAddModal}
            className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium"
          >
            Thêm Mới
          </Button>
        </div>
      </div>

      {/* Board Columns container */}
      <div ref={boardRef} className="flex-1 overflow-x-auto overflow-y-hidden w-full min-h-0 bg-slate-50 dark:bg-gray-800/50 p-6 will-change-scroll custom-scroller border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm">
        {loading ? (
          <div className="w-full h-full flex justify-center items-center"><Spin size="large" /></div>
        ) : (
          <div className="flex gap-6 h-full items-start w-max pb-2">
            {currentConfig.map(colConfig => {
              const status = colConfig.name;
              const columnItems = items.filter(item => item.status === status);
              const isDragOver = dragOverCol === status;
              
              return (
                <div 
                  key={status} 
                  className={`bg-slate-100/70 dark:bg-gray-800/40 rounded-2xl w-[320px] flex flex-col h-full border border-slate-200 dark:border-gray-700/60 shadow-sm dark:shadow-none transition-all duration-200 ${isDragOver ? 'ring-2 ring-blue-400 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02]' : ''}`}
                  onDragOver={(e) => onDragOver(e, status)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, status)}
                >
                  {/* Column Header */}
                  <div className="p-4 flex flex-col gap-3 shrink-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colConfig.color} shadow-sm`}></div>
                        <h3 className="font-bold text-slate-700 dark:text-gray-200 text-sm">{status}</h3>
                      </div>
                      <span className="bg-white dark:bg-gray-800 text-slate-500 font-semibold text-xs px-2.5 py-1 rounded-full shadow-sm border border-slate-200 dark:border-gray-700">
                        {columnItems.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Column Items Scroll Area */}
                  <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3 custom-scrollbar">
                    {columnItems.map(item => {
                      const isDragged = draggedItemId === item.id;
                      const itemName = view === 'ENTERPRISE' ? item.name : item.title;
                      const itemIndustry = view === 'ENTERPRISE' ? item.industry : item.activity_type || item.type; // Fallback to 'type' field
                      
                      const contextMenuItems = [
                        {
                          key: 'edit',
                          icon: <EditOutlined />,
                          label: 'Chỉnh sửa',
                          onClick: () => openEditModal(item),
                        },
                        {
                          key: 'delete',
                          icon: <DeleteOutlined />,
                          danger: true,
                          label: 'Xóa',
                          onClick: () => showDeleteConfirm(item),
                        },
                        { type: 'divider' },
                        {
                          key: 'status',
                          label: 'Chuyển trạng thái',
                          children: currentConfig.map(cfg => ({
                            key: `status-${cfg.name}`,
                            label: (
                               <div className="flex items-center gap-2 text-sm">
                                 <div className={`w-2 h-2 rounded-full ${cfg.color}`}></div>
                                 {cfg.name}
                               </div>
                            ),
                            onClick: () => handleStatusChange(item, cfg.name)
                          }))
                        }
                      ];

                      return (
                        <Dropdown 
                          key={item.id}
                          menu={{ items: contextMenuItems }} 
                          trigger={['contextMenu']} 
                        >
                          <div
                            className={`group bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 dark:border-gray-700 shadow-sm dark:shadow-none hover:shadow dark:hover:shadow-none hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-grab active:cursor-grabbing ${isDragged ? 'opacity-40 rotate-2 scale-95 ring-2 ring-blue-400 border-none' : ''}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, item)}
                            onDragEnd={onDragEnd}
                          >
                            <div className="flex flex-col gap-3 relative">
                              {/* Drag handle icon - visible on hover */}
                              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
                                <DragOutlined />
                              </div>

                              <Tooltip title={itemName}>
                                <div className="font-semibold text-slate-800 dark:text-gray-100 text-sm line-clamp-2 leading-snug w-[90%]">
                                  {itemName}
                                </div>
                              </Tooltip>
                              
                              <div className="flex flex-wrap gap-2">
                                {view === 'ENTERPRISE' ? (
                                  <span className={`text-xs px-2 py-1 ${colConfig.tagConfig.bg} ${colConfig.tagConfig.text} rounded-md font-medium border ${colConfig.tagConfig.border} flex items-center`}>
                                    <BankOutlined className="mr-1.5" /> {itemIndustry || 'Chưa phân loại'}
                                  </span>
                                ) : (
                                  <>
                                    <span className={`text-xs px-2 py-1 ${colConfig.tagConfig.bg} ${colConfig.tagConfig.text} rounded-md font-medium border ${colConfig.tagConfig.border} flex items-center`}>
                                      <ProjectOutlined className="mr-1.5" /> {itemIndustry || 'Chưa phân loại'}
                                    </span>
                                    {item.start_date && (
                                      <span className="text-xs px-2 py-1 bg-slate-50 dark:bg-gray-800/50 text-slate-600 rounded-md font-medium border border-slate-200 dark:border-gray-700 flex items-center">
                                        <CalendarOutlined className="mr-1.5" /> {dayjs(item.start_date).format('DD/MM/YYYY')}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              
                              <div className="pt-3 mt-1 border-t border-slate-100 dark:border-gray-700 flex justify-between items-center">
                                <div className="text-xs text-slate-400 font-medium flex items-center">
                                  <PushpinOutlined className="mr-1" /> ID: {item.id}
                                </div>
                                
                                <Dropdown 
                                  menu={{ items: contextMenuItems }} 
                                  trigger={['click']} 
                                  placement="bottomRight"
                                >
                                  <Button 
                                    type="text" 
                                    icon={<MoreOutlined />} 
                                    size="small" 
                                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </Dropdown>
                              </div>
                            </div>
                          </div>
                        </Dropdown>
                      );
                    })}
                    
                    {columnItems.length === 0 && (
                      <div className={`h-28 flex flex-col items-center justify-center text-sm rounded-xl border-2 border-dashed transition-colors ${isDragOver ? 'border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-gray-700 text-slate-400'}`}>
                        <div className={`p-2 rounded-full mb-2 ${isDragOver ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-slate-100 dark:bg-gray-800'}`}>
                          <PlusOutlined className={isDragOver ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'} />
                        </div>
                        {isDragOver ? 'Thả vào đây' : 'Kéo thả vào đây'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        title={<div className="font-bold text-lg">{editingId ? 'Chỉnh sửa' : 'Thêm mới'} {view === 'ENTERPRISE' ? "Doanh Nghiệp" : "Hoạt Động"}</div>}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        footer={null}
        destroyOnClose
        className="rounded-2xl"
        width={860}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          {view === 'ENTERPRISE' ? (
            <>
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
                              {currentConfig.map(col => <Option key={col.name} value={col.name}>{col.name}</Option>)}
                          </Select>
                      </Form.Item>
                  </Col>
                  <Col span={8}>
                      <Form.Item name="is_hcmc" label="Có tại TP.HCM?" valuePropName="checked" initialValue={true}>
                          <Switch checkedChildren="Có" unCheckedChildren="Không" />
                      </Form.Item>
                  </Col>
              </Row>

              {isAdmin && (
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
            </>
          ) : (
            <>
              <Form.Item name="title" label="Tên Hoạt động" rules={[{ required: true }]}>
                  <Input placeholder="VD: Thực tập sinh Marketing 2024" />
              </Form.Item>
              <Row gutter={16}>
                  <Col span={12}>
                      <Form.Item name="enterprise_id" label="Doanh nghiệp liên kết" rules={[{ required: true }]}>
                          <Select showSearch placeholder="Chọn doanh nghiệp" filterOption={filterOptionIgnoreCase}>
                              {enterprises.map(e => (
                                  <Option key={e.id} value={e.id}>{e.name}</Option>
                              ))}
                          </Select>
                      </Form.Item>
                  </Col>
                  <Col span={12}>
                      <Form.Item name="type_ids" label="Loại hình hoạt động">
                          <Select mode="multiple" placeholder="Chọn loại hình" showSearch filterOption={filterOptionIgnoreCase}>
                              {activityTypes.map(act => (
                                  <Option key={act.id} value={act.id}>{act.name}</Option>
                              ))}
                          </Select>
                      </Form.Item>
                  </Col>
              </Row>
              <Form.Item name="target_ids" label="Đối tượng hướng tới">
                  <Select mode="multiple" placeholder="Chọn đối tượng" showSearch filterOption={filterOptionIgnoreCase}>
                      {targets.map(t => (
                          <Option key={t.id} value={t.id}>{t.name}</Option>
                      ))}
                  </Select>
              </Form.Item>
              <Row gutter={16}>
                  <Col span={12}>
                      <Form.Item name="start_date" label="Ngày bắt đầu" rules={[{ required: true }]}>
                          <DatePicker className="w-full" format="DD/MM/YYYY" />
                      </Form.Item>
                  </Col>
                  <Col span={12}>
                      <Form.Item name="end_date" label="Ngày kết thúc">
                          <DatePicker className="w-full" format="DD/MM/YYYY" />
                      </Form.Item>
                  </Col>
              </Row>
              <Row gutter={16}>
                  <Col span={12}>
                      <Form.Item name="start_time" label="Giờ bắt đầu">
                          <TimePicker className="w-full" format="HH:mm" />
                      </Form.Item>
                  </Col>
                  <Col span={12}>
                      <Form.Item name="end_time" label="Giờ kết thúc">
                          <TimePicker className="w-full" format="HH:mm" />
                      </Form.Item>
                  </Col>
              </Row>
              <Form.Item name="collaboration_date" label="Ngày hợp tác">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
              <Form.Item name="detail" label="Mô tả nội dung hoạt động">
                  <Input.TextArea rows={3} placeholder="Nhập tóm tắt nội dung..." />
              </Form.Item>
              <Form.Item name="status" label="Trạng thái" initialValue="Đề xuất">
                  <Select>
                      {currentConfig.map(col => <Option key={col.name} value={col.name}>{col.name}</Option>)}
                  </Select>
              </Form.Item>
            </>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-gray-700">
            <Button size="large" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="rounded-lg font-medium">Hủy</Button>
            <Button size="large" type="primary" htmlType="submit" loading={submitting} className="bg-vluRed hover:bg-vluRedHover text-white rounded-lg shadow-sm font-medium border-none">
              {editingId ? 'Cập Nhật Tùy Chọn' : 'Lưu Thành Công'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default KanbanBoard;
