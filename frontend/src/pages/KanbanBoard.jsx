import React, { useState, useEffect, useRef } from 'react';
import { message, Card, Select, Typography, Spin, Badge, Button, Modal, Form, Input, DatePicker, Tag, Tooltip, Dropdown, Row, Col, Space, Divider, Avatar, Mentions } from 'antd';
import { PlusOutlined, BankOutlined, ProjectOutlined, CalendarOutlined, MoreOutlined, DragOutlined, EditOutlined, DeleteOutlined, UserOutlined, HomeOutlined, FileTextOutlined, LinkOutlined, InfoCircleOutlined, CheckSquareOutlined, RobotOutlined, CloudUploadOutlined, AudioOutlined, PictureOutlined, DownloadOutlined } from '@ant-design/icons';
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
  { name: 'Vàng', hex: '#fef08a', textHex: '#854d0e', bgClass: 'bg-yellow-100/90 border-yellow-200 dark:bg-yellow-950/45 dark:border-yellow-800/40' },
  { name: 'Xanh dương', hex: '#bfdbfe', textHex: '#1e40af', bgClass: 'bg-blue-100/90 border-blue-200 dark:bg-blue-950/45 dark:border-blue-800/40' },
  { name: 'Xanh lá', hex: '#bbf7d0', textHex: '#166534', bgClass: 'bg-green-100/90 border-green-200 dark:bg-green-950/45 dark:border-green-800/40' },
  { name: 'Hồng', hex: '#fbcfe8', textHex: '#9d174d', bgClass: 'bg-pink-100/90 border-pink-200 dark:bg-pink-950/45 dark:border-pink-800/40' },
  { name: 'Tím', hex: '#e9d5ff', textHex: '#6b21a8', bgClass: 'bg-purple-100/90 border-purple-200 dark:bg-purple-950/45 dark:border-purple-800/40' },
];

const KanbanBoard = () => {
  const userCookie = Cookies.get('user');
  let user = null;
  try {
    if (userCookie) user = JSON.parse(userCookie);
  } catch (e) {
    console.error("Failed to parse user cookie", e);
  }

  const [activeTab, setActiveTab] = useState('TASKS'); // 'TASKS' or 'NOTES'
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [assignees, setAssignees] = useState([]);

  // Mobile column switcher state
  const [activeMobileColumn, setActiveMobileColumn] = useState('Cần làm');

  // Mentions database
  const [allEnterprises, setAllEnterprises] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [allMous, setAllMous] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  // Drag states for Tasks
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Touch drag states for Tasks (with Long Press support)
  const touchDragRef = useRef(null);
  const touchTimeoutRef = useRef(null);
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

  // File Upload State
  const fileUploaderRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeUploadForm, setActiveUploadForm] = useState('TASK'); // 'TASK' or 'NOTE'
  const [activeUploadField, setActiveUploadField] = useState('description');

  // Filters for Tasks
  const [searchKeyword, setSearchKeyword] = useState('');
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [assigneeFilter, setAssigneeFilter] = useState(null);

  // Detailed preview modal for clicked badges
  const [previewEntity, setPreviewEntity] = useState({ visible: false, type: '', data: null });

  // Mention Popover Helper State
  const [isMentionModalOpen, setIsMentionModalOpen] = useState(false);
  const [mentionType, setMentionType] = useState(null); // 'enterprise', 'activity', 'mou', 'student'
  const [mentionForm] = Form.useForm();
  const [activeFormType, setActiveFormType] = useState('TASK'); // 'TASK' or 'NOTE'
  const [activeField, setActiveField] = useState(''); // 'description' or 'content'
  const [mentionSearchText, setMentionSearchText] = useState('');

  // Note Search, Filter and Arrange States
  const [noteSearchKeyword, setNoteSearchKeyword] = useState('');
  const [noteColorFilter, setNoteColorFilter] = useState(null);
  const [noteMentionFilter, setNoteMentionFilter] = useState(null);
  const [noteSortOrder, setNoteSortOrder] = useState('custom');

  // Drag states for Notes
  const [draggedNoteId, setDraggedNoteId] = useState(null);
  const [dragOverNoteId, setDragOverNoteId] = useState(null);

  // Touch drag states for Notes
  const [touchDraggedNoteId, setTouchDraggedNoteId] = useState(null);
  const [touchDragOverNoteId, setTouchDragOverNoteId] = useState(null);
  const touchNoteDragRef = useRef(null);
  const touchNoteTimeoutRef = useRef(null);

  const filteredAndSortedNotes = React.useMemo(() => {
    let result = [...notes];
    
    // 1. Search filter
    if (noteSearchKeyword) {
      const kw = noteSearchKeyword.toLowerCase();
      result = result.filter(n => 
        (n.title && n.title.toLowerCase().includes(kw)) ||
        (n.content && n.content.toLowerCase().includes(kw))
      );
    }
    
    // 2. Color filter
    if (noteColorFilter) {
      result = result.filter(n => n.color === noteColorFilter);
    }
    
    // 3. Mention type filter
    if (noteMentionFilter) {
      const mentionRegex = new RegExp(`entity:${noteMentionFilter}:`, 'i');
      result = result.filter(n => n.content && mentionRegex.test(n.content));
    }
    
    // 4. Arrange (Sort)
    if (noteSortOrder === 'newest') {
      result.sort((a, b) => b.id - a.id);
    } else if (noteSortOrder === 'oldest') {
      result.sort((a, b) => a.id - b.id);
    } else if (noteSortOrder === 'title-az') {
      result.sort((a, b) => {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB, 'vi', { sensitivity: 'base' });
      });
    }
    
    return result;
  }, [notes, noteSearchKeyword, noteColorFilter, noteMentionFilter, noteSortOrder]);

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
      let data = res.data || [];
      
      // Load custom order from localStorage if it exists
      const userKey = user ? `vlu_notes_order_${user.id}` : 'vlu_notes_order_default';
      const storedOrderRaw = localStorage.getItem(userKey);
      if (storedOrderRaw) {
        try {
          const storedOrder = JSON.parse(storedOrderRaw);
          data.sort((a, b) => {
            const indexA = storedOrder.indexOf(a.id);
            const indexB = storedOrder.indexOf(b.id);
            
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return 1;
            if (indexB !== -1) return -1;
            return b.id - a.id;
          });
        } catch (e) {
          console.error("Failed to parse stored notes order", e);
        }
      }
      setNotes(data);
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

  // Listen to custom refresh event from chatbot note saves
  useEffect(() => {
    const handleRefreshNotes = () => {
      fetchNotes();
    };
    window.addEventListener('refresh-notes', handleRefreshNotes);
    return () => window.removeEventListener('refresh-notes', handleRefreshNotes);
  }, []);

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

  // Formulate Mentions options dynamically based on the current search text (category -> entity)
  const getDynamicMentionOptions = () => {
    const text = mentionSearchText || '';
    
    // Check if the search text contains a category colon
    const match = text.match(/^(Doanh nghiệp|Hoạt động|MOU|Sinh viên):(.*)$/i);
    
    if (match) {
      const [_, category, query] = match;
      const lowerQuery = query.trim().toLowerCase();
      const options = [];
      
      if (category.toLowerCase() === 'doanh nghiệp') {
        const filtered = allEnterprises.filter(e => e.name.toLowerCase().includes(lowerQuery));
        filtered.forEach(e => {
          options.push({
            value: `@[${e.name}](entity:enterprise:${e.id}) `,
            label: `🏢 ${e.name}`
          });
        });
      } else if (category.toLowerCase() === 'hoạt động') {
        const filtered = allActivities.filter(a => a.title.toLowerCase().includes(lowerQuery));
        filtered.forEach(a => {
          options.push({
            value: `@[${a.title}](entity:activity:${a.id}) `,
            label: `📅 ${a.title}`
          });
        });
      } else if (category.toLowerCase() === 'mou') {
        const filtered = allMous.filter(m => 
          m.mou_code.toLowerCase().includes(lowerQuery) || 
          (m.partner_name && m.partner_name.toLowerCase().includes(lowerQuery)) ||
          (m.enterprise_name && m.enterprise_name.toLowerCase().includes(lowerQuery))
        );
        filtered.forEach(m => {
          options.push({
            value: `@[${m.mou_code}](entity:mou:${m.id}) `,
            label: `🤝 ${m.mou_code} (${m.partner_name || m.enterprise_name || 'MOU'})`
          });
        });
      } else if (category.toLowerCase() === 'sinh viên') {
        const filtered = allStudents.filter(s => 
          s.name.toLowerCase().includes(lowerQuery) || 
          s.student_code.toLowerCase().includes(lowerQuery)
        );
        filtered.forEach(s => {
          options.push({
            value: `@[${s.name}](entity:student:${s.id}) `,
            label: `🎓 ${s.name} - ${s.student_code}`
          });
        });
      }
      
      return options.map(opt => ({
        ...opt,
        key: opt.value
      }));
    } else {
      // If there is no colon, show the 4 categories
      const categories = [
        { value: 'Doanh nghiệp:', label: '🏢 Doanh nghiệp...' },
        { value: 'Hoạt động:', label: '📅 Hoạt động...' },
        { value: 'MOU:', label: '🤝 MOU...' },
        { value: 'Sinh viên:', label: '🎓 Sinh viên...' },
      ];
      
      const lowerText = text.trim().toLowerCase();
      if (!lowerText) return categories.map(opt => ({ ...opt, key: opt.value }));
      
      const filteredCategories = categories.filter(c => 
        c.label.toLowerCase().includes(lowerText) || 
        c.value.toLowerCase().includes(lowerText)
      );
      return filteredCategories.map(opt => ({ ...opt, key: opt.value }));
    }
  };

  // Helper to extract file references from text to render them nicely at the bottom
  const extractFileAttachments = (text) => {
    if (!text) return [];
    const fileRegex = /\@\[(.*?)\]\(entity:file:(.*?)\)/g;
    const attachments = [];
    let match;
    // Reset regex index
    fileRegex.lastIndex = 0;
    while ((match = fileRegex.exec(text)) !== null) {
      attachments.push({ name: match[1], url: match[2] });
    }
    return attachments;
  };

  // Helper to parse and render bold markdown **abc**
  const renderTextWithBold = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, lineIdx) => (
      <React.Fragment key={lineIdx}>
        {lineIdx > 0 && <br />}
        {line.split('**').map((part, i) =>
          i % 2 === 1 ? <strong key={i} className="font-bold text-slate-800 dark:text-gray-100">{part}</strong> : part
        )}
      </React.Fragment>
    ));
  };

  // Regex parser for rendering inline @mentions
  const renderTextWithMentions = (text) => {
    if (!text) return null;
    const matches = text.split(/(\@\[.*?\]\(entity:\w+:.*?\))/g);

    return matches.map((part, index) => {
      const match = part.match(/^\@\[(.*?)\]\(entity:(\w+):(.*?)\)$/);
      if (match) {
        const [_, name, type, payload] = match;

        // Custom inline file pill
        if (type === 'file') {
          return (
            <Tag
              key={index}
              color="cyan"
              icon={<LinkOutlined style={{ fontSize: '10px' }} />}
              className="cursor-pointer font-medium hover:opacity-85 inline-flex items-center gap-1.5 my-0.5 shadow-sm border border-cyan-200 max-w-full whitespace-normal break-all"
              onClick={(e) => {
                e.stopPropagation();
                window.open(payload, '_blank');
              }}
            >
              📎 {name}
            </Tag>
          );
        }

        // Standard System Entity Badge
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
            className="cursor-pointer font-medium hover:opacity-85 inline-flex items-center gap-1.5 my-0.5 shadow-sm border max-w-full whitespace-normal break-words"
            onClick={(e) => {
              e.stopPropagation();
              handleShowEntityPreview(type, parseInt(payload, 10));
            }}
          >
            {name}
          </Tag>
        );
      }
      return <React.Fragment key={index}>{renderTextWithBold(part)}</React.Fragment>;
    });
  };

  // Render file attachment blocks at the bottom of the card beautifully
  const renderFileAttachmentBlock = (name, url, index) => {
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || name.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|svg)$/);
    const isAudio = url.match(/\.(mp3|wav|ogg|m4a|flac)/i) || name.toLowerCase().match(/\.(mp3|wav|ogg|m4a|flac)$/);

    if (isImage) {
      return (
        <div key={index} className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow transition-all w-24 h-16 bg-slate-100 dark:bg-gray-800 shrink-0 select-none" onClick={e => e.stopPropagation()}>
          <img 
            src={url} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
            onClick={() => window.open(url, '_blank')}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <PictureOutlined className="text-white text-base" />
          </div>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div key={index} className="p-2 bg-slate-50 dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700 rounded-xl flex items-center gap-2 shadow-sm w-full" onClick={e => e.stopPropagation()}>
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-500 shrink-0">
            <AudioOutlined />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-500 font-bold truncate">{name}</div>
            <audio src={url} controls className="w-full h-6 scale-90 origin-left mt-0.5" />
          </div>
        </div>
      );
    }

    // Document styling
    let colorClass = 'text-blue-500 bg-blue-50 dark:bg-blue-950/20';
    if (name.endsWith('.pdf')) {
      colorClass = 'text-rose-500 bg-rose-50 dark:bg-rose-950/20';
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      colorClass = 'text-green-500 bg-green-50 dark:bg-green-950/20';
    }

    return (
      <div 
        key={index}
        onClick={(e) => { e.stopPropagation(); window.open(url, '_blank'); }}
        className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer w-full"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${colorClass}`}>
          {name.split('.').pop().toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[11px] font-semibold text-slate-700 dark:text-gray-200 truncate">{name}</div>
          <div className="text-[9px] text-slate-400 flex items-center gap-0.5"><DownloadOutlined /> Tải xuống</div>
        </div>
      </div>
    );
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
      message.warning("Không tìm thấy thông tin chi tiết thực thể.");
    }
  };

  // Drag and drop task card handlers
  const handleTaskStatusChange = async (task, newStatus) => {
    if (task.status === newStatus) return;
    const previousTasks = [...tasks];
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

  // Touch drag handlers with "Long Press" to prevent scroll conflicts
  const onTouchStart = (e, item) => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);

    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    touchDragRef.current = { item, startX, startY, moved: false };

    touchTimeoutRef.current = setTimeout(() => {
      const sourceEl = e.currentTarget;
      const rect = sourceEl.getBoundingClientRect();
      const ghost = sourceEl.cloneNode(true);
      ghost.id = 'touch-drag-ghost';
      ghost.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        opacity: 0.9;
        pointer-events: none;
        z-index: 10000;
        border-radius: 12px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.35);
        transform: rotate(2deg) scale(1.04);
        transition: transform 0.08s ease;
      `;
      document.body.appendChild(ghost);

      if (navigator.vibrate) {
        navigator.vibrate(40);
      }

      touchDragRef.current.ghostEl = ghost;
      setTouchDraggedItemId(item.id);
    }, 250);
  };

  const onTouchMove = (e) => {
    const touch = e.touches[0];

    if (!touchDraggedItemId) {
      if (touchDragRef.current) {
        const dx = touch.clientX - touchDragRef.current.startX;
        const dy = touch.clientY - touchDragRef.current.startY;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          if (touchTimeoutRef.current) {
            clearTimeout(touchTimeoutRef.current);
            touchTimeoutRef.current = null;
          }
        }
      }
      return;
    }

    if (!touchDragRef.current || !touchDragRef.current.ghostEl) return;
    const { ghostEl } = touchDragRef.current;

    const dx = touch.clientX - touchDragRef.current.startX;
    const dy = touch.clientY - touchDragRef.current.startY;
    touchDragRef.current.moved = true;

    e.preventDefault();

    ghostEl.style.transform = `translate(${dx}px, ${dy}px) rotate(2deg) scale(1.04)`;

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
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }

    if (!touchDragRef.current) return;
    const { item, ghostEl, moved, overCol } = touchDragRef.current;

    if (ghostEl && ghostEl.parentNode) {
      ghostEl.parentNode.removeChild(ghostEl);
    }

    if (moved && overCol && item) {
      handleTaskStatusChange(item, overCol);
      if (window.innerWidth < 768) {
        setActiveMobileColumn(overCol);
      }
    }

    touchDragRef.current = null;
    setTouchDraggedItemId(null);
    setTouchDragOverCol(null);
  };

  // Drag and drop notes reorder handler
  const handleReorderNotes = (draggedId, targetId) => {
    const currentNotes = [...notes];
    const draggedIndex = currentNotes.findIndex(n => n.id === draggedId);
    const targetIndex = currentNotes.findIndex(n => n.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedItem] = currentNotes.splice(draggedIndex, 1);
      currentNotes.splice(targetIndex, 0, draggedItem);
      
      setNotes(currentNotes);
      setNoteSortOrder('custom');
      
      const orderIds = currentNotes.map(n => n.id);
      const userKey = user ? `vlu_notes_order_${user.id}` : 'vlu_notes_order_default';
      localStorage.setItem(userKey, JSON.stringify(orderIds));
    }
  };

  // Touch drag handlers for Notes
  const onNoteTouchStart = (e, item) => {
    if (touchNoteTimeoutRef.current) clearTimeout(touchNoteTimeoutRef.current);
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    
    touchNoteDragRef.current = { item, startX, startY, moved: false };
    
    touchNoteTimeoutRef.current = setTimeout(() => {
      const sourceEl = e.currentTarget;
      const rect = sourceEl.getBoundingClientRect();
      const ghost = sourceEl.cloneNode(true);
      ghost.id = 'touch-note-ghost';
      ghost.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        opacity: 0.9;
        pointer-events: none;
        z-index: 10000;
        border-radius: 12px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.35);
        transform: scale(1.04);
        transition: transform 0.08s ease;
      `;
      document.body.appendChild(ghost);
      
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
      
      touchNoteDragRef.current.ghostEl = ghost;
      setTouchDraggedNoteId(item.id);
    }, 250);
  };

  const onNoteTouchMove = (e) => {
    const touch = e.touches[0];
    
    if (!touchDraggedNoteId) {
      if (touchNoteDragRef.current) {
        const dx = touch.clientX - touchNoteDragRef.current.startX;
        const dy = touch.clientY - touchNoteDragRef.current.startY;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          if (touchNoteTimeoutRef.current) {
            clearTimeout(touchNoteTimeoutRef.current);
            touchNoteTimeoutRef.current = null;
          }
        }
      }
      return;
    }
    
    if (!touchNoteDragRef.current || !touchNoteDragRef.current.ghostEl) return;
    const { ghostEl } = touchNoteDragRef.current;
    
    const dx = touch.clientX - touchNoteDragRef.current.startX;
    const dy = touch.clientY - touchNoteDragRef.current.startY;
    touchNoteDragRef.current.moved = true;
    
    e.preventDefault();
    
    ghostEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
    
    ghostEl.style.display = 'none';
    const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    ghostEl.style.display = '';
    
    const dropTarget = elUnder?.closest('[data-note-id]');
    const overId = dropTarget ? parseInt(dropTarget.getAttribute('data-note-id'), 10) : null;
    if (overId !== touchNoteDragRef.current.overId) {
      touchNoteDragRef.current.overId = overId;
      setTouchDragOverNoteId(overId);
    }
  };

  const onNoteTouchEnd = () => {
    if (touchNoteTimeoutRef.current) {
      clearTimeout(touchNoteTimeoutRef.current);
      touchNoteTimeoutRef.current = null;
    }
    
    if (!touchNoteDragRef.current) return;
    const { item, ghostEl, moved, overId } = touchNoteDragRef.current;
    
    if (ghostEl && ghostEl.parentNode) {
      ghostEl.parentNode.removeChild(ghostEl);
    }
    
    if (moved && overId && item && item.id !== overId) {
      handleReorderNotes(item.id, overId);
    }
    
    touchNoteDragRef.current = null;
    setTouchDraggedNoteId(null);
    setTouchDragOverNoteId(null);
  };

  // CRUD Operations - Task
  const openAddTaskModal = () => {
    setEditingTaskId(null);
    taskForm.resetFields();
    taskForm.setFieldsValue({ status: 'Cần làm', priority: 'Trung bình' });
    setMentionSearchText('');
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
    setMentionSearchText('');
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
    noteForm.setFieldsValue({ color: '#fef08a' });
    setMentionSearchText('');
    setIsNoteModalOpen(true);
  };

  const openEditNoteModal = (note) => {
    setEditingNoteId(note.id);
    noteForm.setFieldsValue({
      title: note.title,
      content: note.content,
      color: note.color,
    });
    setMentionSearchText('');
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
      setNotes(updatedNotes);
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

  // Helper trigger for "@ mentions" (manual buttons fallback)
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
    
    const activeForm = activeFormType === 'TASK' ? taskForm : noteForm;
    const currentText = activeForm.getFieldValue(activeField) || '';
    activeForm.setFieldsValue({
      [activeField]: currentText + mentionMarkup
    });

    setIsMentionModalOpen(false);
  };

  // Cloud File upload triggers
  const triggerFileUpload = (formType, fieldName) => {
    setActiveUploadForm(formType);
    setActiveUploadField(fieldName);
    fileUploaderRef.current?.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const hideLoading = message.loading('Đang tải tệp tin lên cloud...', 0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/tasks/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { file_url, file_name } = res.data;
      const mentionMarkup = ` @[${file_name}](entity:file:${file_url}) `;

      const activeForm = activeUploadForm === 'TASK' ? taskForm : noteForm;
      const currentText = activeForm.getFieldValue(activeUploadField) || '';
      activeForm.setFieldsValue({
        [activeUploadField]: currentText + mentionMarkup
      });

      message.success('Đã đính kèm tệp tin thành công!');
    } catch (error) {
      message.error('Lỗi khi upload file: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadingFile(false);
      hideLoading();
      e.target.value = '';
    }
  };

  // Run chatbot AI directly from notes/tasks
  const handleRunAiChat = (item, type) => {
    const title = type === 'TASK' ? item.title : (item.title || 'Ghi chú');
    const content = type === 'TASK' ? item.description : item.content;
    const prompt = `Tôi có một ${type === 'TASK' ? 'nhiệm vụ' : 'ghi chú'} với tiêu đề: "${title}". Nội dung chi tiết: "${content || ''}". Hãy phân tích nội dung này và gợi ý cho tôi các bước tiếp theo cần triển khai.`;
    
    window.dispatchEvent(new CustomEvent('open-chatbot', { detail: { prompt } }));
  };

  const getPriorityColor = (priority) => {
    if (priority === 'Cao') return 'red';
    if (priority === 'Trung bình') return 'orange';
    return 'default';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full min-w-0">
      {/* Hidden file uploader input */}
      <input
        ref={fileUploaderRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

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
          <div className="w-[180px] xs:w-full">
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
          <div className="w-[200px] xs:w-full">
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

      {/* Filter panel (Notes only) */}
      {activeTab === 'NOTES' && (
        <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-center shrink-0 shadow-sm">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Tìm kiếm tiêu đề, nội dung ghi chú..."
              allowClear
              value={noteSearchKeyword}
              onChange={(e) => setNoteSearchKeyword(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div className="w-[180px] xs:w-full">
            <Select
              placeholder="Lọc theo màu"
              allowClear
              value={noteColorFilter}
              onChange={setNoteColorFilter}
              className="w-full rounded-lg"
            >
              {STICKY_COLORS.map(c => (
                <Option key={c.hex} value={c.hex}>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border border-black/15" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          <div className="w-[180px] xs:w-full">
            <Select
              placeholder="Lọc theo liên kết"
              allowClear
              value={noteMentionFilter}
              onChange={setNoteMentionFilter}
              className="w-full rounded-lg"
            >
              <Option value="enterprise">🏢 Doanh nghiệp</Option>
              <Option value="activity">📅 Hoạt động</Option>
              <Option value="mou">🤝 MOU</Option>
              <Option value="student">🎓 Sinh viên</Option>
              <Option value="file">📎 Tệp đính kèm</Option>
            </Select>
          </div>
          <div className="w-[180px] xs:w-full">
            <Select
              placeholder="Sắp xếp"
              value={noteSortOrder}
              onChange={setNoteSortOrder}
              className="w-full rounded-lg"
            >
              <Option value="custom">Thứ tự kéo thả</Option>
              <Option value="newest">Mới nhất</Option>
              <Option value="oldest">Cũ nhất</Option>
              <Option value="title-az">Tiêu đề (A-Z)</Option>
            </Select>
          </div>
        </div>
      )}

      {/* Mobile Column Tabs Switcher (Visible on mobile only, < 768px) */}
      {activeTab === 'TASKS' && (
        <div className="flex md:hidden bg-slate-100 dark:bg-gray-800/80 p-1 rounded-xl mb-4 border border-slate-200/50 dark:border-gray-700/50 shrink-0">
          {TASK_STATUSES.map(col => {
            const count = tasks.filter(t => t.status === col.name).length;
            const isActive = activeMobileColumn === col.name;
            return (
              <button
                key={col.name}
                onClick={() => setActiveMobileColumn(col.name)}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all truncate px-1 ${
                  isActive
                    ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-gray-400'
                }`}
              >
                {col.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Quick Drop Targets Shelf for Dragging */}
      {(draggedItemId || touchDraggedItemId) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-slate-200 dark:border-gray-700 shadow-2xl rounded-2xl p-4 w-[600px] max-w-[92vw] animate-fade-in-up">
          <div className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
            <DragOutlined className="animate-pulse text-blue-500" /> Thả vào đây để thay đổi trạng thái
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {TASK_STATUSES.map(col => {
              const isMouseOver = dragOverCol === col.name;
              const isTouchOver = touchDragOverCol === col.name;
              const isActive = isMouseOver || isTouchOver;
              return (
                <div
                  key={col.name}
                  data-drop-status={col.name}
                  onDragOver={(e) => onDragOver(e, col.name)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, col.name)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-md'
                      : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color} shadow-sm`}></div>
                  {col.name}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main workspace */}
      <div className="flex-1 min-h-0 min-w-0">
        {loading ? (
          <div className="w-full h-full flex justify-center items-center"><Spin size="large" /></div>
        ) : activeTab === 'TASKS' ? (
          // ==================== KANBAN BOARD FOR TASKS ====================
          <div ref={boardRef} className="flex-1 overflow-x-auto md:overflow-x-auto overflow-y-auto md:overflow-y-hidden w-full h-full bg-slate-50 dark:bg-gray-800/50 p-4 md:p-6 will-change-scroll custom-scroller border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 h-full items-stretch md:items-start md:w-max pb-2">
              {TASK_STATUSES.map(colConfig => {
                const status = colConfig.name;
                const columnItems = tasks.filter(t => t.status === status);
                const isDragOver = dragOverCol === status;
                const isCurrentMobileCol = activeMobileColumn === status;

                return (
                  <div
                    key={status}
                    data-drop-status={status}
                    className={`bg-slate-100/70 dark:bg-gray-800/40 rounded-2xl w-full md:w-[320px] flex flex-col h-full border border-slate-200 dark:border-gray-700/60 shadow-sm dark:shadow-none transition-all duration-200 ${
                      isDragOver || touchDragOverCol === status ? 'ring-2 ring-blue-400 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]' : ''
                    } ${
                      isCurrentMobileCol ? 'flex' : 'hidden md:flex'
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
                        const fileAttachments = extractFileAttachments(item.description);

                        const contextMenuItems = [
                          {
                            key: 'ai-chat',
                            icon: <RobotOutlined className="text-red-500" />,
                            label: 'Thảo luận với AI',
                            onClick: () => handleRunAiChat(item, 'TASK'),
                          },
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
                              className={`group bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 dark:border-gray-700 shadow-sm dark:shadow-none hover:shadow dark:hover:shadow-none hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-grab active:cursor-grabbing select-none touch-none ${
                                isDragged || isTouchDragged ? 'opacity-30 rotate-1 scale-95 ring-2 ring-blue-400 border-none' : ''
                              }`}
                            >
                              <div className="flex flex-col gap-2 relative">
                                {/* Long press drag indicator on mobile */}
                                <div className="absolute top-0 right-0 flex items-center gap-1.5 opacity-40 md:opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                                  <span className="text-[10px] hidden md:inline font-medium text-slate-300">Giữ để kéo</span>
                                  <DragOutlined />
                                </div>

                                {/* Title */}
                                <div className="font-semibold text-slate-800 dark:text-gray-100 text-sm leading-snug w-[85%] break-words">
                                  {item.title}
                                </div>

                                {/* Description Text (Inline Mentions rendered) */}
                                {item.description && (
                                  <div className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                                    {renderTextWithMentions(item.description)}
                                  </div>
                                )}

                                {/* Premium file attachments gallery grid at the bottom */}
                                {fileAttachments.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-gray-700/60" onClick={e => e.stopPropagation()}>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tệp đính kèm ({fileAttachments.length})</div>
                                    <div className="flex flex-wrap gap-2">
                                      {fileAttachments.map((f, i) => renderFileAttachmentBlock(f.name, f.url, i))}
                                    </div>
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
                                      <CalendarOutlined style={{ fontSize: '10px' }} /> {dayjs(item.due_date).format('DD/MM/YYYY')}
                                    </Tag>
                                  )}
                                </div>

                                {/* Footer & Assignee */}
                                <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-gray-700/60 flex justify-between items-center shrink-0">
                                  <div className="text-[10px] text-slate-400 font-medium truncate mr-2 flex-1 min-w-0" title={`ID: ${item.id} • ${item.creator_name || 'Hệ thống'}`}>
                                    ID: {item.id} • {item.creator_name || 'Hệ thống'}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {item.assignee_name && (
                                      <Tooltip title={`Người gán: ${item.assignee_name}`}>
                                        <Avatar size="small" className="bg-slate-200 text-slate-700 text-[9px] font-bold">
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
          <div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-gray-800/40 p-4 md:p-6 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm">
            {notes.length === 0 ? (
              <div className="h-[250px] flex flex-col items-center justify-center text-slate-400">
                <Paragraph className="text-lg mb-2">Chưa có ghi chú nào được tạo</Paragraph>
                <Button type="primary" onClick={openAddNoteModal} icon={<PlusOutlined />}>Tạo Ghi Chú Đầu Tiên</Button>
              </div>
            ) : filteredAndSortedNotes.length === 0 ? (
              <div className="h-[250px] flex flex-col items-center justify-center text-slate-400">
                <Paragraph className="text-lg mb-2 text-center">Không tìm thấy ghi chú phù hợp</Paragraph>
                <Button type="default" onClick={() => { setNoteSearchKeyword(''); setNoteColorFilter(null); setNoteMentionFilter(null); }} className="rounded-lg">
                  Xóa bộ lọc
                </Button>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6">
                {filteredAndSortedNotes.map(note => {
                  const stickerColor = STICKY_COLORS.find(c => c.hex === note.color) || STICKY_COLORS[0];
                  const fileAttachments = extractFileAttachments(note.content);

                  return (
                    <div
                      key={note.id}
                      data-note-id={note.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('noteId', note.id);
                        setDraggedNoteId(note.id);
                      }}
                      onDragEnd={() => {
                        setDraggedNoteId(null);
                        setDragOverNoteId(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedNoteId && draggedNoteId !== note.id && dragOverNoteId !== note.id) {
                          setDragOverNoteId(note.id);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedId = parseInt(e.dataTransfer.getData('noteId'), 10);
                        if (draggedId && draggedId !== note.id) {
                          handleReorderNotes(draggedId, note.id);
                        }
                        setDraggedNoteId(null);
                        setDragOverNoteId(null);
                      }}
                      onTouchStart={(e) => onNoteTouchStart(e, note)}
                      onTouchMove={onNoteTouchMove}
                      onTouchEnd={onNoteTouchEnd}
                      className="break-inside-avoid w-full pb-6"
                    >
                      <div
                        className={`group relative rounded-xl p-5 shadow border transition-all duration-200 flex flex-col justify-between min-h-[120px] cursor-grab active:cursor-grabbing select-none ${stickerColor.bgClass} ${
                          (draggedNoteId === note.id || touchDraggedNoteId === note.id) ? 'opacity-30 border-dashed border-2 border-slate-400' : ''
                        } ${
                          (dragOverNoteId === note.id || touchDragOverNoteId === note.id) ? 'ring-2 ring-blue-500 scale-[1.01] shadow-md' : ''
                        }`}
                      >
                        {/* Note Header */}
                        <div className="flex justify-between items-start mb-2.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm break-words pr-2">
                            {note.title || 'Ghi chú'}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-slate-700 dark:text-slate-200 text-xs whitespace-pre-wrap leading-relaxed mb-4 break-words">
                          {renderTextWithMentions(note.content)}
                        </div>

                        {/* Premium file attachments gallery grid at the bottom of Sticky Note */}
                        {fileAttachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-500/10 mb-3" onClick={e => e.stopPropagation()}>
                            <div className="flex flex-wrap gap-2">
                              {fileAttachments.map((f, i) => renderFileAttachmentBlock(f.name, f.url, i))}
                            </div>
                          </div>
                        )}

                        {/* Note Footer with Color Switcher & Actions (Google Keep Style) */}
                        <div className="pt-3 border-t border-slate-500/10 flex flex-col gap-2 shrink-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {dayjs(note.created_at).format('DD/MM/YYYY HH:mm')}
                            </span>
                            
                            {/* Tiny Color Circles */}
                            <div className="flex gap-1">
                              {STICKY_COLORS.map(c => (
                                <button
                                  key={c.hex}
                                  onClick={(e) => { e.stopPropagation(); handleUpdateNoteColor(note, c.hex); }}
                                  className={`w-3 h-3 rounded-full border border-black/10 transition-transform hover:scale-125 ${
                                    note.color === c.hex ? 'ring-1 ring-slate-400 scale-110' : ''
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Actions menu appearing on hover on desktop, always visible on mobile */}
                          <div className="flex justify-end gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={e => e.stopPropagation()}>
                            <Tooltip title="Thảo luận với trợ lý AI">
                              <Button
                                type="text"
                                icon={<RobotOutlined className="text-red-500" style={{ fontSize: '13px' }} />}
                                size="small"
                                onClick={() => handleRunAiChat(note, 'NOTE')}
                                className="hover:bg-black/5 dark:hover:bg-white/5 rounded-md"
                              />
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa">
                              <Button
                                type="text"
                                icon={<EditOutlined style={{ fontSize: '12px' }} />}
                                size="small"
                                onClick={() => openEditNoteModal(note)}
                                className="text-slate-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-md"
                              />
                            </Tooltip>
                            <Tooltip title="Xóa ghi chú">
                              <Button
                                type="text"
                                icon={<DeleteOutlined style={{ fontSize: '12px' }} />}
                                danger
                                size="small"
                                onClick={() => handleDeleteNote(note)}
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                              />
                            </Tooltip>
                          </div>
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
            <Col xs={24} sm={8}>
              <Form.Item name="status" label="Trạng thái">
                <Select className="w-full">
                  {TASK_STATUSES.map(s => <Option key={s.name} value={s.name}>{s.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item name="priority" label="Độ ưu tiên">
                <Select className="w-full">
                  <Option value="Cao">Cao</Option>
                  <Option value="Trung bình">Trung bình</Option>
                  <Option value="Thấp">Thấp</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
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

          {/* Autocomplete Mentions Field */}
          <Form.Item name="description" label="Mô tả & chi tiết công việc (Gõ @ để liên kết nhanh dữ liệu)">
            <Mentions
              rows={4}
              placeholder="Nhập mô tả nhiệm vụ công việc, gõ @ để liên kết Doanh nghiệp, Hoạt động, MOU hoặc Sinh viên..."
              options={getDynamicMentionOptions()}
              onSearch={(text) => setMentionSearchText(text)}
              onSelect={() => setMentionSearchText('')}
              split=""
              className="rounded-lg"
              autoSize={{ minRows: 4, maxRows: 8 }}
            />
          </Form.Item>

          {/* Mentions tool shelf */}
          <div className="bg-slate-50 dark:bg-gray-800/80 p-3 rounded-lg border border-slate-200/60 dark:border-gray-700/60 mb-6">
            <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <LinkOutlined className="text-blue-500" /> Hoặc chọn nhanh liên kết & Đính kèm tập tin
            </div>
            <Space size="small" wrap>
              <Button size="small" icon={<BankOutlined />} onClick={() => openMentionModal('enterprise', 'TASK', 'description')}>@ Doanh nghiệp</Button>
              <Button size="small" icon={<ProjectOutlined />} onClick={() => openMentionModal('activity', 'TASK', 'description')}>@ Hoạt động</Button>
              <Button size="small" icon={<FileTextOutlined />} onClick={() => openMentionModal('mou', 'TASK', 'description')}>@ MOU</Button>
              <Button size="small" icon={<UserOutlined />} onClick={() => openMentionModal('student', 'TASK', 'description')}>@ Sinh viên</Button>
              <Button size="small" type="primary" ghost icon={<CloudUploadOutlined />} onClick={() => triggerFileUpload('TASK', 'description')} loading={uploadingFile}>
                Đính kèm File/Audio/Ảnh
              </Button>
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

          {/* Autocomplete Mentions Field */}
          <Form.Item name="content" label="Nội dung ghi chú (Gõ @ để liên kết nhanh dữ liệu)" rules={[{ required: true, message: 'Nhập nội dung ghi chú!' }]}>
            <Mentions
              rows={5}
              placeholder="Nhập nội dung ghi chú, gõ @ để liên kết Doanh nghiệp, Hoạt động, MOU hoặc Sinh viên..."
              options={getDynamicMentionOptions()}
              onSearch={(text) => setMentionSearchText(text)}
              onSelect={() => setMentionSearchText('')}
              split=""
              className="rounded-lg"
              autoSize={{ minRows: 5, maxRows: 10 }}
            />
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
              <LinkOutlined className="text-blue-500" /> Hoặc chọn nhanh liên kết & Đính kèm tập tin
            </div>
            <Space size="small" wrap>
              <Button size="small" icon={<BankOutlined />} onClick={() => openMentionModal('enterprise', 'NOTE', 'content')}>@ Doanh nghiệp</Button>
              <Button size="small" icon={<ProjectOutlined />} onClick={() => openMentionModal('activity', 'NOTE', 'content')}>@ Hoạt động</Button>
              <Button size="small" icon={<FileTextOutlined />} onClick={() => openMentionModal('mou', 'NOTE', 'content')}>@ MOU</Button>
              <Button size="small" icon={<UserOutlined />} onClick={() => openMentionModal('student', 'NOTE', 'content')}>@ Sinh viên</Button>
              <Button size="small" type="primary" ghost icon={<CloudUploadOutlined />} onClick={() => triggerFileUpload('NOTE', 'content')} loading={uploadingFile}>
                Đính kèm File/Audio/Ảnh
              </Button>
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
                    <div className="text-slate-600 bg-slate-50 dark:bg-gray-800/50 p-3 rounded-lg border border-slate-100 dark:border-gray-700 whitespace-pre-wrap">
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
                    <div className="text-slate-600 bg-slate-50 dark:bg-gray-800/50 p-3 rounded-lg border border-slate-100 dark:border-gray-700 whitespace-pre-wrap">
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
