import React, { useState, useEffect, useRef } from 'react';
import { message, Card, Select, Typography, Spin, Badge, Button, Modal, Form, Input, DatePicker, Tag, Tooltip, Dropdown, Row, Col, Space, Divider, Avatar } from 'antd';
import { PlusOutlined, BankOutlined, ProjectOutlined, CalendarOutlined, MoreOutlined, DragOutlined, EditOutlined, DeleteOutlined, UserOutlined, HomeOutlined, FileTextOutlined, LinkOutlined, InfoCircleOutlined, CheckSquareOutlined, HeartOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const TASK_STATUSES = [
  { name: 'Cần làm', color: 'bg-slate-400', hex: '#94a3b8', tagConfig: { bg: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-100 dark:border-slate-500/20' } },
  { name: 'Đang thực hiện', color: 'bg-blue-500', hex: '#3b82f6', tagConfig: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-500/20' } },
  { name: 'Đang kiểm tra', color: 'bg-amber-500', hex: '#f59e0b', tagConfig: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-500/20' } },
  { name: 'Đã hoàn thành', color: 'bg-green-500', hex: '#10b981', tagConfig: { bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-100 dark:border-green-500/20' } },
];

const STICKY_COLORS = [
  { name: 'Vàng', hex: '#fef08a', textHex: '#854d0e', bgClass: 'bg-yellow-100 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50' },
  { name: 'Xanh dương', hex: '#bfdbfe', textHex: '#1e40af', bgClass: 'bg-blue-100 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50' },
  { name: 'Xanh lá', hex: '#bbf7d0', textHex: '#166534', bgClass: 'bg-green-100 dark:bg-green-950/20 border-green-200 dark:border-green-900/50' },
  { name: 'Hồng', hex: '#fbcfe8', textHex: '#9d174d', bgClass: 'bg-pink-100 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900/50' },
  { name: 'Tím', hex: '#e9d5ff', textHex: '#6b21a8', bgClass: 'bg-purple-100 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50' },
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

  const [activeTab, setActiveTab] = useState('TASKS'); // 'TASKS' or 'NOTES'
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [assignees, setAssignees] = useState([]);

  // Mentions database
  const [allEnterprises, setAllEnterprises] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [allMous, setAllMous] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  // Drag states for Tasks
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Touch drag states for Tasks
  const touchDragRef = useRef(null);
  const [touchDragOverCol, setTouchDragOverCol] = useState(null);
  const [touchDraggedItemId, setTouchDraggedItemId] = useState(null);

  // Task & Note Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [taskForm] = Form.useForm();
  const [noteForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Filters for Tasks
  const [searchKeyword, setSearchKeyword] = useState('');
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [assigneeFilter, setAssigneeFilter] = useState(null);

  // Mention Popover Helper State
  const [isMentionModalOpen, setIsMentionModalOpen] = useState(false);
  const [mentionType, setMentionType] = useState(null); // 'enterprise', 'activity', 'mou', 'student'
  const [mentionForm] = Form.useForm();
  const [activeFormType, setActiveFormType] = useState('TASK'); // 'TASK' or 'NOTE'
  const [activeField, setActiveField] = useState(''); // 'description' or 'content'

  // Detailed preview modal for clicked badges
  const [previewEntity, setPreviewEntity] = useState({ visible: false, type: '', data: null });

  // Fetch functions
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchKeyword) params.search = searchKeyword;
      if (priorityFilter) params.priority = priorityFilter;
      if (assigneeFilter) params.assigned_to = assigneeFilter;

      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } catch (error) {
      message.error(`Lỗi khi tải danh sách nhiệm vụ: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notes');
      setNotes(res.data);
    } catch (error) {
      message.error(`Lỗi khi tải ghi chú: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignees = async () => {
    try {
      const res = await api.get('/users/assignees');
      setAssignees(res.data || []);
    } catch (error) {
      console.error("Failed to load assignees", error);
    }
  };

  const fetchMentionData = async () => {
    try {
      const [entRes, actRes, mouRes, stuRes] = await Promise.allSettled([
        api.get('/enterprises'),
        api.get('/activities'),
        api.get('/mous'),
        api.get('/students')
      ]);
      if (entRes.status === 'fulfilled') setAllEnterprises(entRes.value.data || []);
      if (actRes.status === 'fulfilled') setAllActivities(actRes.value.data || []);
      if (mouRes.status === 'fulfilled') setAllMous(mouRes.value.data || []);
      if (stuRes.status === 'fulfilled') setAllStudents(stuRes.value.data || []);
    } catch (e) {
      console.error("Failed to load reference data", e);
    }
  };

  useEffect(() => {
    fetchAssignees();
    fetchMentionData();
  }, []);

  useEffect(() => {
    if (activeTab === 'TASKS') {
      fetchTasks();
      document.title = "Bảng Nhiệm Vụ | VLU Kanban Board";
    } else {
      fetchNotes();
      document.title = "Không Gian Ghi Chú | VLU Notes Workspace";
    }
  }, [activeTab, searchKeyword, priorityFilter, assigneeFilter]);

  // Horizontal scroll for Kanban columns via mouse wheel
  const boardRef = useRef(null);
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) === 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      let target = e.target;
      let preventCustomScroll = false;

      while (target && target !== el) {
        if (target.scrollHeight > target.clientHeight) {
          const style = window.getComputedStyle(target);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            const isAtTop = target.scrollTop === 0;
            const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
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
  }, [activeTab]);

  // Regex parser for @mentions
  const renderTextWithMentions = (text) => {
    if (!text) return null;
    // Match @[Name](entity:type:id)
    const parts = text.split(/(\@\[.*?\]\(entity:\w+:\d+\))/g);
    return parts.map((part, index) => {
      const match = part.match(/^\@\[(.*?)\]\(entity:(\w+):(\d+)\)$/);
      if (match) {
        const [_, name, type, id] = match;
        let color = 'blue';
        let icon = <BankOutlined />;
        if (type === 'activity') {
          color = 'green';
          icon = <ProjectOutlined />;
        } else if (type === 'mou') {
          color = 'purple';
          icon = <FileTextOutlined />;
        } else if (type === 'student') {
          color = 'orange';
          icon = <UserOutlined />;
        }

        return (
          <Tag
            key={index}
            color={color}
            icon={icon}
            className="cursor-pointer font-medium hover:opacity-85 transition-all inline-flex items-center gap-1 my-0.5 shadow-sm border"
            onClick={(e) => {
              e.stopPropagation();
              handleShowEntityPreview(type, parseInt(id, 10));
            }}
          >
            {name}
          </Tag>
        );
      }
      return part;
    });
  };

  const handleShowEntityPreview = (type, id) => {
    let matchedData = null;
    if (type === 'enterprise') {
      matchedData = allEnterprises.find(e => e.id === id);
    } else if (type === 'activity') {
      matchedData = allActivities.find(a => a.id === id);
    } else if (type === 'mou') {
      matchedData = allMous.find(m => m.id === id);
    } else if (type === 'student') {
      matchedData = allStudents.find(s => s.id === id);
    }

    if (matchedData) {
      setPreviewEntity({ visible: true, type, data: matchedData });
    } else {
      message.warning("Không tìm thấy thông tin chi tiết trên bộ nhớ cache.");
    }
  };

  // Drag and drop task card handlers
  const handleTaskStatusChange = async (task, newStatus) => {
    if (task.status === newStatus) return;
    const previousTasks = [...tasks];
    // Optimistic update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/tasks/${task.id}/status`, { status: newStatus });
      message.success('Đã chuyển đổi trạng thái nhiệm vụ');
    } catch (error) {
      setTasks(previousTasks);
      message.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    }
  };

  const onDragStart = (e, item) => {
    e.dataTransfer.setData('taskId', item.id);
    setDraggedItemId(item.id);
  };

  const onDragOver = (e, status) => {
    e.preventDefault();
    if (dragOverCol !== status) setDragOverCol(status);
  };

  const onDragLeave = () => {
    setDragOverCol(null);
  };

  const onDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggedItemId(null);

    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = tasks.find(t => t.id === parseInt(taskId, 10));
    if (task && task.status !== newStatus) {
      handleTaskStatusChange(task, newStatus);
    }
  };

  const onDragEnd = () => {
    setDragOverCol(null);
    setDraggedItemId(null);
  };

  // Touch drag handlers
  const onTouchStart = (e, item) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    const sourceEl = e.currentTarget;
    const rect = sourceEl.getBoundingClientRect();
    const ghost = sourceEl.cloneNode(true);
    ghost.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      opacity: 0.85;
      pointer-events: none;
      z-index: 9999;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      transform: rotate(2deg) scale(1.03);
      transition: transform 0.1s ease;
    `;
    document.body.appendChild(ghost);

    touchDragRef.current = { item, ghostEl: ghost, startX, startY, moved: false };
    setTouchDraggedItemId(item.id);
  };

  const onTouchMove = (e) => {
    if (!touchDragRef.current) return;
    const { ghostEl } = touchDragRef.current;
    const touch = e.touches[0];

    const dx = touch.clientX - touchDragRef.current.startX;
    const dy = touch.clientY - touchDragRef.current.startY;
    if (!touchDragRef.current.moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    touchDragRef.current.moved = true;
    e.preventDefault();

    ghostEl.style.transform = `translate(${dx}px, ${dy}px) rotate(2deg) scale(1.03)`;

    ghostEl.style.display = 'none';
    const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    ghostEl.style.display = '';

    const dropTarget = elUnder?.closest('[data-drop-status]');
    const newOverCol = dropTarget ? dropTarget.getAttribute('data-drop-status') : null;
    if (newOverCol !== touchDragRef.current.overCol) {
      touchDragRef.current.overCol = newOverCol;
      setTouchDragOverCol(newOverCol);
    }
  };

  const onTouchEnd = () => {
    if (!touchDragRef.current) return;
    const { item, ghostEl, moved, overCol } = touchDragRef.current;

    if (ghostEl && ghostEl.parentNode) ghostEl.parentNode.removeChild(ghostEl);

    if (moved && overCol) {
      handleTaskStatusChange(item, overCol);
    }

    touchDragRef.current = null;
    setTouchDraggedItemId(null);
    setTouchDragOverCol(null);
  };

  // CRUD Operations - Task
  const openAddTaskModal = () => {
    setEditingTaskId(null);
    taskForm.resetFields();
    taskForm.setFieldsValue({ status: 'Cần làm', priority: 'Trung bình' });
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTaskId(task.id);
    taskForm.setFieldsValue({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? dayjs(task.due_date) : null,
      assigned_to: task.assigned_to,
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
      };

      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, payload);
        message.success('Cập nhật nhiệm vụ thành công');
      } else {
        await api.post('/tasks', payload);
        message.success('Tạo nhiệm vụ thành công');
      }

      setIsTaskModalOpen(false);
      taskForm.resetFields();
      fetchTasks();
    } catch (error) {
      message.error(`Lỗi: ${error.response?.data?.message || 'Không thể lưu nhiệm vụ'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = (task) => {
    Modal.confirm({
      title: 'Bạn có chắc muốn xóa?',
      content: `Xóa nhiệm vụ: "${task.title}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await api.delete(`/tasks/${task.id}`);
          message.success('Xóa nhiệm vụ thành công');
          fetchTasks();
        } catch (error) {
          message.error(`Lỗi: ${error.message}`);
        }
      }
    });
  };

  // CRUD Operations - Note
  const openAddNoteModal = () => {
    setEditingNoteId(null);
    noteForm.resetFields();
    noteForm.setFieldsValue({ color: '#fef08a' }); // yellow default
    setIsNoteModalOpen(true);
  };

  const openEditNoteModal = (note) => {
    setEditingNoteId(note.id);
    noteForm.setFieldsValue({
      title: note.title,
      content: note.content,
      color: note.color,
    });
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async (values) => {
    setSubmitting(true);
    try {
      if (editingNoteId) {
        await api.put(`/notes/${editingNoteId}`, values);
        message.success('Cập nhật ghi chú thành công');
      } else {
        await api.post('/notes', values);
        message.success('Tạo ghi chú thành công');
      }

      setIsNoteModalOpen(false);
      noteForm.resetFields();
      fetchNotes();
    } catch (error) {
      message.error(`Lỗi: ${error.response?.data?.message || 'Không thể lưu ghi chú'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = (note) => {
    Modal.confirm({
      title: 'Xóa ghi chú?',
      content: 'Bạn có chắc chắn muốn xóa mẫu ghi chú này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await api.delete(`/notes/${note.id}`);
          message.success('Xóa ghi chú thành công');
          fetchNotes();
        } catch (error) {
          message.error(`Lỗi: ${error.message}`);
        }
      }
    });
  };

  const handleUpdateNoteColor = async (note, hexColor) => {
    try {
      const updatedNotes = notes.map(n => n.id === note.id ? { ...n, color: hexColor } : n);
      setNotes(updatedNotes); // Optimistic UI
      await api.put(`/notes/${note.id}`, {
        title: note.title,
        content: note.content,
        color: hexColor
      });
    } catch (error) {
      message.error("Không thể cập nhật màu sắc ghi chú");
      fetchNotes();
    }
  };

  // Helper trigger for "@ mentions" inside Task and Note textareas
  const openMentionModal = (type, formType, fieldName) => {
    setMentionType(type);
    setActiveFormType(formType);
    setActiveField(fieldName);
    mentionForm.resetFields();
    setIsMentionModalOpen(true);
  };

  const handleInsertMention = (values) => {
    const selectedId = values.entity_id;
    let selectedName = '';
    
    if (mentionType === 'enterprise') {
      const ent = allEnterprises.find(e => e.id === selectedId);
      selectedName = ent ? ent.name : 'Doanh nghiệp';
    } else if (mentionType === 'activity') {
      const act = allActivities.find(a => a.id === selectedId);
      selectedName = act ? act.title : 'Hoạt động';
    } else if (mentionType === 'mou') {
      const mou = allMous.find(m => m.id === selectedId);
      selectedName = mou ? mou.mou_code : 'MOU';
    } else if (mentionType === 'student') {
      const stu = allStudents.find(s => s.id === selectedId);
      selectedName = stu ? stu.name : 'Sinh viên';
    }

    const mentionMarkup = ` @[${selectedName}](entity:${mentionType}:${selectedId}) `;
    
    // Insert into the active form field
    const activeForm = activeFormType === 'TASK' ? taskForm : noteForm;
    const currentText = activeForm.getFieldValue(activeField) || '';
    activeForm.setFieldsValue({
      [activeField]: currentText + mentionMarkup
    });

    setIsMentionModalOpen(false);
  };

  const getPriorityColor = (priority) => {
    if (priority === 'Cao') return 'red';
    if (priority === 'Trung bình') return 'orange';
    return 'default';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full min-w-0">
      {/* Upper Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
            <CheckSquareOutlined className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Kanban Board V2</h1>
            <p className="text-sm text-slate-500 m-0 mt-0.5">Quản lý nhiệm vụ kéo thả và không gian ghi chú tiện ích</p>
          </div>
        </div>

        {/* Tab & Button Controllers */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Custom Tabs */}
          <div className="flex bg-slate-100 dark:bg-gray-800/80 p-1 rounded-xl w-full sm:w-auto border border-slate-200/50 dark:border-gray-700/50">
            <button
              onClick={() => setActiveTab('TASKS')}
              className={`flex-1 sm:flex-none px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'TASKS'
                  ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Nhiệm vụ (Tasks)
            </button>
            <button
              onClick={() => setActiveTab('NOTES')}
              className={`flex-1 sm:flex-none px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'NOTES'
                  ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Ghi chú (Notes)
            </button>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={activeTab === 'TASKS' ? openAddTaskModal : openAddNoteModal}
            className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium w-full sm:w-auto"
          >
            Thêm Mới
          </Button>
        </div>
      </div>

      {/* Filter panel (Tasks only) */}
      {activeTab === 'TASKS' && (
        <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-center shrink-0 shadow-sm">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Tìm kiếm tiêu đề, nội dung..."
              allowClear
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div className="w-[180px]">
            <Select
              placeholder="Độ ưu tiên"
              allowClear
              value={priorityFilter}
              onChange={setPriorityFilter}
              className="w-full rounded-lg"
            >
              <Option value="Cao">Cao</Option>
              <Option value="Trung bình">Trung bình</Option>
              <Option value="Thấp">Thấp</Option>
            </Select>
          </div>
          <div className="w-[200px]">
            <Select
              placeholder="Người thực hiện"
              allowClear
              showSearch
              optionFilterProp="children"
              value={assigneeFilter}
              onChange={setAssigneeFilter}
              className="w-full rounded-lg"
            >
              {assignees.map(u => (
                <Option key={u.id} value={u.id}>{u.full_name}</Option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {/* Main workspace */}
      <div className="flex-1 min-h-0 min-w-0">
        {loading ? (
          <div className="w-full h-full flex justify-center items-center"><Spin size="large" /></div>
        ) : activeTab === 'TASKS' ? (
          // ==================== KANBAN BOARD FOR TASKS ====================
          <div ref={boardRef} className="flex-1 overflow-x-auto overflow-y-hidden w-full h-full bg-slate-50 dark:bg-gray-800/50 p-6 will-change-scroll custom-scroller border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm">
            <div className="flex gap-6 h-full items-start w-max pb-2">
              {TASK_STATUSES.map(colConfig => {
                const status = colConfig.name;
                const columnItems = tasks.filter(t => t.status === status);
                const isDragOver = dragOverCol === status;

                return (
                  <div
                    key={status}
                    data-drop-status={status}
                    className={`bg-slate-100/70 dark:bg-gray-800/40 rounded-2xl w-[320px] flex flex-col h-full border border-slate-200 dark:border-gray-700/60 shadow-sm dark:shadow-none transition-all duration-200 ${
                      isDragOver || touchDragOverCol === status ? 'ring-2 ring-blue-400 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]' : ''
                    }`}
                    onDragOver={(e) => onDragOver(e, status)}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDrop(e, status)}
                  >
                    {/* Header */}
                    <div className="p-4 flex justify-between items-center shrink-0 border-b border-slate-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 rounded-t-2xl">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colConfig.color} shadow-sm`}></div>
                        <span className="font-bold text-slate-700 dark:text-gray-200 text-sm">{status}</span>
                      </div>
                      <span className="bg-white dark:bg-gray-800 text-slate-500 font-semibold text-xs px-2.5 py-1 rounded-full shadow-sm border border-slate-200 dark:border-gray-700">
                        {columnItems.length}
                      </span>
                    </div>

                    {/* Task cards scroll area */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                      {columnItems.map(item => {
                        const isTouchDragged = touchDraggedItemId === item.id;
                        const isDragged = draggedItemId === item.id;
                        const isOverdue = item.due_date && dayjs(item.due_date).isBefore(dayjs(), 'day') && item.status !== 'Đã hoàn thành';

                        const contextMenuItems = [
                          {
                            key: 'edit',
                            icon: <EditOutlined />,
                            label: 'Chỉnh sửa',
                            onClick: () => openEditTaskModal(item),
                          },
                          {
                            key: 'delete',
                            icon: <DeleteOutlined />,
                            danger: true,
                            label: 'Xóa nhiệm vụ',
                            onClick: () => handleDeleteTask(item),
                          },
                          { type: 'divider' },
                          {
                            key: 'status',
                            label: 'Chuyển trạng thái',
                            children: TASK_STATUSES.map(cfg => ({
                              key: `status-${cfg.name}`,
                              label: (
                                <div className="flex items-center gap-2 text-sm">
                                  <div className={`w-2 h-2 rounded-full ${cfg.color}`}></div>
                                  {cfg.name}
                                </div>
                              ),
                              onClick: () => handleTaskStatusChange(item, cfg.name)
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
                              draggable
                              onDragStart={(e) => onDragStart(e, item)}
                              onDragEnd={onDragEnd}
                              onTouchStart={(e) => onTouchStart(e, item)}
                              onTouchMove={onTouchMove}
                              onTouchEnd={onTouchEnd}
                              className={`group bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 dark:border-gray-700 shadow-sm dark:shadow-none hover:shadow dark:hover:shadow-none hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-grab active:cursor-grabbing ${
                                isDragged || isTouchDragged ? 'opacity-40 rotate-1 scale-95 ring-2 ring-blue-400 border-none' : ''
                              }`}
                            >
                              <div className="flex flex-col gap-2 relative">
                                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
                                  <DragOutlined />
                                </div>

                                {/* Title */}
                                <div className="font-semibold text-slate-800 dark:text-gray-100 text-sm leading-snug w-[90%]">
                                  {item.title}
                                </div>

                                {/* Description (with parsed Mentions) */}
                                {item.description && (
                                  <div className="text-xs text-slate-500 dark:text-gray-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                                    {renderTextWithMentions(item.description)}
                                  </div>
                                )}

                                {/* Tags and Metadata */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {item.priority && (
                                    <Tag color={getPriorityColor(item.priority)} className="text-[10px] uppercase font-bold px-1.5 py-0">
                                      {item.priority}
                                    </Tag>
                                  )}
                                  
                                  {item.due_date && (
                                    <Tag color={isOverdue ? 'error' : 'default'} className="text-[10px] font-medium inline-flex items-center gap-1">
                                      <CalendarOutlined /> {dayjs(item.due_date).format('DD/MM/YYYY')}
                                    </Tag>
                                  )}
                                </div>

                                {/* Footer & Assignee */}
                                <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-gray-700/60 flex justify-between items-center shrink-0">
                                  <div className="text-[10px] text-slate-400 font-medium">
                                    ID: {item.id} • {item.faculty_name || 'Hệ thống'}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {item.assignee_name && (
                                      <Tooltip title={`Người gán: ${item.assignee_name}`}>
                                        <Avatar size="small" className="bg-slate-200 text-slate-700 text-[10px] font-bold">
                                          {item.assignee_name.split(' ').pop().substring(0, 2).toUpperCase()}
                                        </Avatar>
                                      </Tooltip>
                                    )}

                                    <Dropdown
                                      menu={{ items: contextMenuItems }}
                                      trigger={['click']}
                                      placement="bottomRight"
                                    >
                                      <Button
                                        type="text"
                                        icon={<MoreOutlined />}
                                        size="small"
                                        className="text-slate-400 hover:text-blue-600"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </Dropdown>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Dropdown>
                        );
                      })}

                      {columnItems.length === 0 && (
                        <div className={`h-24 flex flex-col items-center justify-center text-xs rounded-xl border border-dashed transition-colors ${isDragOver ? 'border-blue-400 text-blue-500 bg-blue-50/20' : 'border-slate-200 dark:border-gray-700 text-slate-400'}`}>
                          {isDragOver ? 'Thả vào đây' : 'Không có nhiệm vụ'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // ==================== STICKY NOTES WORKSPACE ====================
          <div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-gray-800/40 p-6 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm">
            {notes.length === 0 ? (
              <div className="h-[250px] flex flex-col items-center justify-center text-slate-400">
                <Paragraph className="text-lg mb-2">Chưa có ghi chú nào được tạo</Paragraph>
                <Button type="primary" onClick={openAddNoteModal} icon={<PlusOutlined />}>Tạo Ghi Chú Đầu Tiên</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {notes.map(note => {
                  const stickerColor = STICKY_COLORS.find(c => c.hex === note.color) || STICKY_COLORS[0];

                  return (
                    <div
                      key={note.id}
                      className={`relative rounded-2xl p-5 shadow-sm hover:shadow-md border transform hover:-rotate-1 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between min-h-[200px] ${stickerColor.bgClass}`}
                    >
                      {/* Note Header / Controls */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-bold text-slate-800 text-sm line-clamp-1 pr-4">
                          {note.title || 'Ghi chú'}
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            type="text"
                            icon={<EditOutlined style={{ fontSize: '12px' }} />}
                            size="small"
                            onClick={() => openEditNoteModal(note)}
                            className="text-slate-500 hover:text-blue-600 rounded-md"
                          />
                          <Button
                            type="text"
                            icon={<DeleteOutlined style={{ fontSize: '12px' }} />}
                            danger
                            size="small"
                            onClick={() => handleDeleteNote(note)}
                            className="text-slate-400 hover:text-red-600 rounded-md"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 text-slate-700 text-xs whitespace-pre-wrap leading-relaxed mb-4">
                        {renderTextWithMentions(note.content)}
                      </div>

                      {/* Note Footer with Color Switcher */}
                      <div className="pt-3 border-t border-slate-500/10 flex justify-between items-center shrink-0">
                        <span className="text-[10px] text-slate-400">
                          {dayjs(note.created_at).format('DD/MM/YYYY HH:mm')}
                        </span>
                        
                        {/* Tiny Color Circles */}
                        <div className="flex gap-1.5">
                          {STICKY_COLORS.map(c => (
                            <button
                              key={c.hex}
                              onClick={() => handleUpdateNoteColor(note, c.hex)}
                              className={`w-3.5 h-3.5 rounded-full border border-black/10 transition-transform hover:scale-125 ${
                                note.color === c.hex ? 'ring-1 ring-slate-400 scale-110' : ''
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== TASK MODAL ==================== */}
      <Modal
        title={<div className="font-bold text-lg">{editingTaskId ? 'Chỉnh sửa nhiệm vụ' : 'Tạo nhiệm vụ mới'}</div>}
        open={isTaskModalOpen}
        onCancel={() => setIsTaskModalOpen(false)}
        footer={null}
        destroyOnClose
        width={720}
      >
        <Form form={taskForm} layout="vertical" onFinish={handleSaveTask} className="mt-4">
          <Form.Item name="title" label="Tiêu đề nhiệm vụ" rules={[{ required: true, message: 'Nhập tiêu đề nhiệm vụ!' }]}>
            <Input placeholder="VD: Gửi scan hợp đồng MOU cho FPT Software" className="rounded-lg" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="Trạng thái">
                <Select className="w-full">
                  {TASK_STATUSES.map(s => <Option key={s.name} value={s.name}>{s.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="Độ ưu tiên">
                <Select className="w-full">
                  <Option value="Cao">Cao</Option>
                  <Option value="Trung bình">Trung bình</Option>
                  <Option value="Thấp">Thấp</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="due_date" label="Ngày hết hạn">
                <DatePicker className="w-full rounded-lg" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="assigned_to" label="Giao cho giảng viên/nhân viên">
            <Select showSearch placeholder="Chọn người thực hiện..." optionFilterProp="children" allowClear className="w-full rounded-lg">
              {assignees.map(u => (
                <Option key={u.id} value={u.id}>{u.full_name} ({u.email})</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Mô tả & chi tiết công việc">
            <Input.TextArea rows={4} placeholder="Mô tả nhiệm vụ công việc..." className="rounded-lg" />
          </Form.Item>

          {/* Mentions tool shelf */}
          <div className="bg-slate-50 dark:bg-gray-800/80 p-3 rounded-lg border border-slate-200/60 dark:border-gray-700/60 mb-6">
            <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <LinkOutlined className="text-blue-500" /> Chèn liên kết thực thể hệ thống (nhấn @)
            </div>
            <Space size="small" wrap>
              <Button size="small" icon={<BankOutlined />} onClick={() => openMentionModal('enterprise', 'TASK', 'description')}>@ Doanh nghiệp</Button>
              <Button size="small" icon={<ProjectOutlined />} onClick={() => openMentionModal('activity', 'TASK', 'description')}>@ Hoạt động</Button>
              <Button size="small" icon={<FileTextOutlined />} onClick={() => openMentionModal('mou', 'TASK', 'description')}>@ MOU</Button>
              <Button size="small" icon={<UserOutlined />} onClick={() => openMentionModal('student', 'TASK', 'description')}>@ Sinh viên</Button>
            </Space>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-700">
            <Button onClick={() => setIsTaskModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-vluRed hover:bg-vluRedHover border-none text-white font-medium">Lưu</Button>
          </div>
        </Form>
      </Modal>

      {/* ==================== NOTE MODAL ==================== */}
      <Modal
        title={<div className="font-bold text-lg">{editingNoteId ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú mới'}</div>}
        open={isNoteModalOpen}
        onCancel={() => setIsNoteModalOpen(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={noteForm} layout="vertical" onFinish={handleSaveNote} className="mt-4">
          <Form.Item name="title" label="Tiêu đề ghi chú">
            <Input placeholder="VD: Ý tưởng cuộc họp" className="rounded-lg" />
          </Form.Item>

          <Form.Item name="content" label="Nội dung ghi chú" rules={[{ required: true, message: 'Nhập nội dung ghi chú!' }]}>
            <Input.TextArea rows={5} placeholder="Nhập nội dung ghi chú..." className="rounded-lg" />
          </Form.Item>

          <Form.Item name="color" label="Màu giấy note">
            <Select className="w-full">
              {STICKY_COLORS.map(c => (
                <Option key={c.hex} value={c.hex}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Mentions tool shelf */}
          <div className="bg-slate-50 dark:bg-gray-800/80 p-3 rounded-lg border border-slate-200/60 dark:border-gray-700/60 mb-6">
            <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <LinkOutlined className="text-blue-500" /> Chèn liên kết thực thể hệ thống (nhấn @)
            </div>
            <Space size="small" wrap>
              <Button size="small" icon={<BankOutlined />} onClick={() => openMentionModal('enterprise', 'NOTE', 'content')}>@ Doanh nghiệp</Button>
              <Button size="small" icon={<ProjectOutlined />} onClick={() => openMentionModal('activity', 'NOTE', 'content')}>@ Hoạt động</Button>
              <Button size="small" icon={<FileTextOutlined />} onClick={() => openMentionModal('mou', 'NOTE', 'content')}>@ MOU</Button>
              <Button size="small" icon={<UserOutlined />} onClick={() => openMentionModal('student', 'NOTE', 'content')}>@ Sinh viên</Button>
            </Space>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-700">
            <Button onClick={() => setIsNoteModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-vluRed hover:bg-vluRedHover border-none text-white font-medium">Lưu</Button>
          </div>
        </Form>
      </Modal>

      {/* ==================== MENTION MODAL HELPER ==================== */}
      <Modal
        title={<div className="font-bold text-[16px]">Liên kết dữ liệu @{mentionType === 'enterprise' ? 'Doanh nghiệp' : mentionType === 'activity' ? 'Hoạt động' : mentionType === 'mou' ? 'Biên bản MOU' : 'Sinh viên'}</div>}
        open={isMentionModalOpen}
        onCancel={() => setIsMentionModalOpen(false)}
        footer={null}
        destroyOnClose
        width={450}
      >
        <Form form={mentionForm} layout="vertical" onFinish={handleInsertMention} className="mt-4">
          <Form.Item name="entity_id" label="Chọn thực thể hệ thống" rules={[{ required: true, message: 'Vui lòng chọn thực thể!' }]}>
            <Select
              showSearch
              placeholder="Gõ để tìm kiếm..."
              optionFilterProp="children"
              className="w-full"
            >
              {mentionType === 'enterprise' && allEnterprises.map(e => (
                <Option key={e.id} value={e.id}>{e.name}</Option>
              ))}
              {mentionType === 'activity' && allActivities.map(a => (
                <Option key={a.id} value={a.id}>{a.title}</Option>
              ))}
              {mentionType === 'mou' && allMous.map(m => (
                <Option key={m.id} value={m.id}>{m.mou_code} ({m.partner_name || m.enterprise_name || 'MOU'})</Option>
              ))}
              {mentionType === 'student' && allStudents.map(s => (
                <Option key={s.id} value={s.id}>{s.name} - {s.student_code}</Option>
              ))}
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setIsMentionModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" className="bg-blue-600 hover:bg-blue-700 border-none text-white">Chèn liên kết</Button>
          </div>
        </Form>
      </Modal>

      {/* ==================== PREVIEW MODAL FOR Badges ==================== */}
      <Modal
        title={
          <div className="font-bold text-lg flex items-center gap-2">
            <InfoCircleOutlined className="text-blue-500" /> 
            Chi tiết {previewEntity.type === 'enterprise' ? 'Doanh nghiệp' : previewEntity.type === 'activity' ? 'Hoạt động' : previewEntity.type === 'mou' ? 'Hợp tác MOU' : 'Sinh viên'}
          </div>
        }
        open={previewEntity.visible}
        onCancel={() => setPreviewEntity({ visible: false, type: '', data: null })}
        footer={[
          <Button key="close" type="primary" onClick={() => setPreviewEntity({ visible: false, type: '', data: null })}>Đóng</Button>
        ]}
        width={650}
        destroyOnClose
      >
        {previewEntity.visible && previewEntity.data && (
          <div className="py-4 text-slate-700">
            {previewEntity.type === 'enterprise' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{previewEntity.data.name}</h3>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div><Text type="secondary">Mã số thuế:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.tax_code || 'Không có'}</Text>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Quy mô:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.scale_name || 'Tiêu chuẩn'}</Text>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Khu vực TP.HCM:</Text></div>
                    <Tag color={previewEntity.data.is_hcmc ? 'success' : 'warning'}>{previewEntity.data.is_hcmc ? 'Có tại TP.HCM' : 'Khu vực khác'}</Tag>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Trạng thái hợp tác:</Text></div>
                    <Tag color="cyan">{previewEntity.data.status || 'Tiềm năng'}</Tag>
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <h4 className="font-semibold text-sm text-slate-800"><HomeOutlined className="mr-1" /> Địa chỉ chính</h4>
                <div className="text-slate-600 bg-slate-50 dark:bg-gray-800 p-3 rounded-lg border border-slate-100 dark:border-gray-700">
                  {previewEntity.data.building_street ? `${previewEntity.data.building_street}, ${previewEntity.data.district || ''}, ${previewEntity.data.province || ''}, ${previewEntity.data.country || 'Việt Nam'}` : 'Chưa cập nhật địa chỉ'}
                </div>
              </div>
            )}

            {previewEntity.type === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{previewEntity.data.title}</h3>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div><Text type="secondary">Doanh nghiệp liên kết:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.enterprise_name}</Text>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Người chịu trách nhiệm:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.person_in_charge || 'Chưa phân công'}</Text>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Ngày bắt đầu:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.start_date ? dayjs(previewEntity.data.start_date).format('DD/MM/YYYY') : 'Chưa thiết lập'}</Text>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Trạng thái:</Text></div>
                    <Tag color="blue">{previewEntity.data.status}</Tag>
                  </Col>
                </Row>
                {previewEntity.data.detail && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <h4 className="font-semibold text-sm text-slate-800"><FileTextOutlined className="mr-1" /> Nội dung chi tiết</h4>
                    <div className="text-slate-600 bg-slate-50 dark:bg-gray-800 p-3 rounded-lg border border-slate-100 dark:border-gray-700 whitespace-pre-wrap">
                      {previewEntity.data.detail}
                    </div>
                  </>
                )}
              </div>
            )}

            {previewEntity.type === 'mou' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Mã hợp tác: {previewEntity.data.mou_code}</h3>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div><Text type="secondary">Đối tác ký kết:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.partner_name || previewEntity.data.enterprise_name}</Text>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Ngày ký kết:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.signing_date ? dayjs(previewEntity.data.signing_date).format('DD/MM/YYYY') : 'Chưa thiết lập'}</Text>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Đại diện liên hệ phía đối tác:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.partner_contact || 'Không có'}</Text>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Liên hệ VLU:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.vlu_contact || 'Không có'}</Text>
                  </Col>
                </Row>
                {previewEntity.data.collaboration_scope && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <h4 className="font-semibold text-sm text-slate-800"><LinkOutlined className="mr-1" /> Phạm vi hợp tác</h4>
                    <div className="text-slate-600 bg-slate-50 dark:bg-gray-800 p-3 rounded-lg border border-slate-100 dark:border-gray-700 whitespace-pre-wrap">
                      {previewEntity.data.collaboration_scope}
                    </div>
                  </>
                )}
              </div>
            )}

            {previewEntity.type === 'student' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{previewEntity.data.name}</h3>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div><Text type="secondary">Mã số sinh viên:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.student_code}</Text>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Lớp học:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.class || 'Chưa cập nhật'}</Text>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Ngành học:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.major || 'Chưa cập nhật'}</Text>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">GPA:</Text></div>
                    <Tag color="gold" className="font-bold">{previewEntity.data.gpa || '0.00'}</Tag>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Địa điểm thực tập:</Text></div>
                    <Text className="font-medium text-slate-900">{previewEntity.data.enterprise_name || 'Chờ phân công'}</Text>
                  </Col>
                  <Col span={12}>
                    <div><Text type="secondary">Trạng thái thực tập:</Text></div>
                    <Tag color={previewEntity.data.status === 'Hoàn thành' ? 'success' : previewEntity.data.status === 'Đang thực tập' ? 'processing' : 'default'}>{previewEntity.data.status}</Tag>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KanbanBoard;
