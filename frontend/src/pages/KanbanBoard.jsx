import React, { useState, useEffect, useRef } from 'react';
import { message, Card, Select, Typography, Spin, Badge, Button, Modal, Form, Input, DatePicker, Tag, Tooltip, Dropdown, Menu, Row, Col } from 'antd';
import { PlusOutlined, BankOutlined, ProjectOutlined, CalendarOutlined, PushpinOutlined, MoreOutlined, DragOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ENTERPRISE_STATUSES = [
  { name: 'Tiềm năng', color: 'bg-blue-500', hex: '#3b82f6', tagConfig: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' } },
  { name: 'Liên hệ', color: 'bg-cyan-500', hex: '#06b6d4', tagConfig: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' } },
  { name: 'Đàm phán', color: 'bg-purple-500', hex: '#a855f7', tagConfig: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' } },
  { name: 'Đề xuất', color: 'bg-orange-500', hex: '#f97316', tagConfig: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' } },
  { name: 'Đã ký hợp tác', color: 'bg-green-500', hex: '#22c55e', tagConfig: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' } },
  { name: 'Đang triển khai', color: 'bg-teal-500', hex: '#14b8a6', tagConfig: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100' } },
  { name: 'Đã hoàn thành', color: 'bg-indigo-500', hex: '#6366f1', tagConfig: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' } },
  { name: 'Đã tạm ngưng', color: 'bg-red-500', hex: '#ef4444', tagConfig: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' } },
];

const ACTIVITY_STATUSES = [
  { name: 'Đề xuất', color: 'bg-orange-500', hex: '#f97316', tagConfig: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' } },
  { name: 'Phê duyệt nội bộ', color: 'bg-purple-500', hex: '#a855f7', tagConfig: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' } },
  { name: 'Đã triển khai', color: 'bg-blue-500', hex: '#3b82f6', tagConfig: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' } },
  { name: 'Đã kết thúc', color: 'bg-green-500', hex: '#22c55e', tagConfig: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' } },
];

const KanbanBoard = () => {
  const [view, setView] = useState('ENTERPRISE');
  const [items, setItems] = useState([]);
  const [enterprises, setEnterprises] = useState([]); // Needed for activity modal dropdown
  const [activityTypes, setActivityTypes] = useState([]);
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

  const fetchEnterprises = async () => {
    try {
      const [entRes, actTypeRes] = await Promise.all([
        api.get('/enterprises'),
        api.get('/structure/activity-types')
      ]);
      setEnterprises(entRes.data);
      setActivityTypes(actTypeRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchItems();
    if (view === 'ACTIVITY') {
      fetchEnterprises();
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

  const handleSave = async (values) => {
    setSubmitting(true);
    try {
      if (view === 'ENTERPRISE') {
        if (editingId) {
          await api.put(`/enterprises/${editingId}`, values);
          message.success('Cập nhật doanh nghiệp thành công');
        } else {
          await api.post('/enterprises', values);
          message.success('Thêm doanh nghiệp thành công');
        }
      } else {
        const payload = {
          ...values,
          start_date: values.start_date?.format('YYYY-MM-DD'),
          end_date: values.end_date?.format('YYYY-MM-DD'),
        };
        if (editingId) {
          await api.put(`/activities/${editingId}`, payload);
          message.success('Cập nhật hoạt động thành công');
        } else {
          await api.post('/activities', payload);
          message.success('Thêm hoạt động thành công');
        }
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

  // View Handlers
  const openAddModal = () => {
    setEditingId(null);
    form.resetFields();
    if (view === 'ENTERPRISE') {
      form.setFieldsValue({ status: 'Tiềm năng' });
    } else {
      form.setFieldsValue({ status: 'Đề xuất' });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    if (view === 'ENTERPRISE') {
      form.setFieldsValue(item);
    } else {
      form.setFieldsValue({
        ...item,
        start_date: item.start_date ? dayjs(item.start_date) : null,
        end_date: item.end_date ? dayjs(item.end_date) : null,
      });
    }
    setIsModalOpen(true);
  };

  const showDeleteConfirm = (item) => {
    Modal.confirm({
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
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full min-w-0 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-5 bg-white border-b border-slate-200 gap-4 shrink-0">
        <div>
          <Title level={4} className="!m-0 text-slate-800 font-bold">
            {view === 'ENTERPRISE' ? 'Bảng Kanban Doanh Nghiệp' : 'Bảng Kanban Hoạt Động'}
          </Title>
          <Text type="secondary" className="text-sm">Quản lý và cập nhật tiến độ công việc một cách trực quan</Text>
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
            className="bg-blue-600 hover:bg-blue-500 shadow-sm border-none font-medium"
          >
            Thêm Mới
          </Button>
        </div>
      </div>

      {/* Board Columns container */}
      <div ref={boardRef} className="flex-1 overflow-x-auto overflow-y-hidden w-full min-h-0 bg-slate-50/50 p-6 will-change-scroll custom-scroller">
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
                  className={`bg-slate-100/70 rounded-2xl w-[320px] flex flex-col h-full border border-slate-200/60 shadow-sm transition-all duration-200 ${isDragOver ? 'ring-2 ring-blue-400 bg-blue-50/50 scale-[1.02]' : ''}`}
                  onDragOver={(e) => onDragOver(e, status)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, status)}
                >
                  {/* Column Header */}
                  <div className="p-4 flex flex-col gap-3 shrink-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colConfig.color} shadow-sm`}></div>
                        <h3 className="font-bold text-slate-700 text-sm">{status}</h3>
                      </div>
                      <span className="bg-white text-slate-500 font-semibold text-xs px-2.5 py-1 rounded-full shadow-sm border border-slate-200">
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
                            className={`group bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing ${isDragged ? 'opacity-40 rotate-2 scale-95 ring-2 ring-blue-400 border-none' : ''}`}
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
                                <div className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug w-[90%]">
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
                                      <span className="text-xs px-2 py-1 bg-slate-50 text-slate-600 rounded-md font-medium border border-slate-200 flex items-center">
                                        <CalendarOutlined className="mr-1.5" /> {dayjs(item.start_date).format('DD/MM/YYYY')}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              
                              <div className="pt-3 mt-1 border-t border-slate-100 flex justify-between items-center">
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
                      <div className={`h-28 flex flex-col items-center justify-center text-sm rounded-xl border-2 border-dashed transition-colors ${isDragOver ? 'border-blue-400 text-blue-600 bg-blue-50/50' : 'border-slate-200 text-slate-400'}`}>
                        <div className={`p-2 rounded-full mb-2 ${isDragOver ? 'bg-blue-100' : 'bg-slate-100'}`}>
                          <PlusOutlined className={isDragOver ? 'text-blue-500' : 'text-slate-400'} />
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
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          {view === 'ENTERPRISE' ? (
            <>
              <Form.Item name="name" label={<span className="font-medium">Tên Doanh Nghiệp</span>} rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                <Input placeholder="Nhập Công ty Cổ phần ABC..." size="large" className="rounded-lg" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="tax_code" label={<span className="font-medium">Mã số thuế</span>} rules={[{ required: true, message: 'Vui lòng nhập mã số thuế' }]}>
                    <Input placeholder="Nhập mã số thuế..." size="large" className="rounded-lg" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="industry" label={<span className="font-medium">Lĩnh vực / Ngành nghề</span>}>
                    <Input placeholder="VD: Công nghệ thông tin, Tài chính..." size="large" className="rounded-lg" />
                  </Form.Item>
                </Col>
              </Row>
              <div className="flex gap-4">
                <Form.Item name="email" label={<span className="font-medium">Email</span>} rules={[{ type: 'email', message: 'Email không hợp lệ' }]} className="flex-1">
                  <Input placeholder="contact@abc.com" size="large" className="rounded-lg" />
                </Form.Item>
                <Form.Item name="phone" label={<span className="font-medium">Số điện thoại</span>} className="flex-1">
                  <Input placeholder="0123456789" size="large" className="rounded-lg" />
                </Form.Item>
              </div>
              <Form.Item name="address" label={<span className="font-medium">Địa chỉ</span>}>
                <TextArea rows={2} placeholder="Số nhà, đường, quận, thành phố..." className="rounded-lg" />
              </Form.Item>
              <Form.Item name="status" label={<span className="font-medium">Trạng thái</span>}>
                <Select size="large" className="rounded-lg">
                  {currentConfig.map(col => <Option key={col.name} value={col.name}>{col.name}</Option>)}
                </Select>
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="title" label={<span className="font-medium">Tiêu đề hoạt động</span>} rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
                <Input placeholder="Nhập Hội thảo kết nối doanh nghiệp..." size="large" className="rounded-lg" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="enterprise_id" label={<span className="font-medium">Doanh nghiệp liên kết</span>} rules={[{ required: true, message: 'Vui lòng chọn doanh nghiệp' }]}>
                    <Select showSearch placeholder="Chọn doanh nghiệp" size="large" className="rounded-lg" filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
                      {enterprises.map(e => (
                        <Option key={e.id} value={e.id}>{e.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="type" label={<span className="font-medium">Loại hình</span>} rules={[{ required: true, message: 'Vui lòng chọn loại hình' }]}>
                    <Select size="large" className="rounded-lg" placeholder="Chọn loại hình" showSearch>
                      {activityTypes.map(act => (
                         <Option key={act.id} value={act.name}>{act.name}</Option>
                      ))}
                      <Option value="Khác">Khác</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <div className="flex gap-4">
                <Form.Item name="start_date" label={<span className="font-medium">Từ ngày</span>} className="flex-1" rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}>
                  <DatePicker format="DD/MM/YYYY" className="w-full rounded-lg" size="large" />
                </Form.Item>
                <Form.Item name="end_date" label={<span className="font-medium">Đến ngày</span>} className="flex-1">
                  <DatePicker format="DD/MM/YYYY" className="w-full rounded-lg" size="large" />
                </Form.Item>
              </div>
              <Form.Item name="description" label={<span className="font-medium">Mô tả chi tiết</span>}>
                <TextArea rows={3} placeholder="Nội dung, mục tiêu của hoạt động..." className="rounded-lg" />
              </Form.Item>
              <Form.Item name="status" label={<span className="font-medium">Trạng thái</span>}>
                <Select size="large" className="rounded-lg">
                  {currentConfig.map(col => <Option key={col.name} value={col.name}>{col.name}</Option>)}
                </Select>
              </Form.Item>
            </>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button size="large" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="rounded-lg font-medium">Hủy</Button>
            <Button size="large" type="primary" htmlType="submit" loading={submitting} className="bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm font-medium border-none">
              {editingId ? 'Cập Nhật Tùy Chọn' : 'Lưu Thành Công'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default KanbanBoard;
