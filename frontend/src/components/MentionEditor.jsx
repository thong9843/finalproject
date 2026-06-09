import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Mention from '@tiptap/extension-mention';
import Link from '@tiptap/extension-link';
import { marked } from 'marked';
import tippy from 'tippy.js';

// Markdown-HTML bidirectional converter helpers
const normalizeLineEndings = (str) => {
  if (!str) return '';
  return str.replace(/\r\n/g, '\n').trim();
};

const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  // Chuẩn hóa ký tự xuống dòng của Windows/Mac để tránh lỗi regex
  let text = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Clean up duplicate audio markup leftover from old htmlToMarkdown bug
  text = text.replace(/(\@\[.*?\]\(entity:file:.*?\))<audio\s+[^>]*>([\s\S]*?)<\/audio>(?:<\/span>)?/g, '$1');

  // Chuyển đổi các nhắc tên @[label](entity:type:id) sang thẻ span trước khi parse marked
  text = text.replace(/@\[(.*?)\]\(entity:(\w+):(.*?)\)/g, (match, label, type, id) => {
    return `<span data-type="mention" data-id="${type}:${id}" data-label="${label}">@${label}</span>`;
  });
  
  // Chuẩn hóa các dấu đầu dòng phổ biến (•, *, +) thành dấu gạch ngang (-) để marked parse thành danh sách
  text = text.replace(/^[•\*\+]\s+/gm, '- ');

  // Sử dụng thư viện marked chuyển đổi Markdown thô sang HTML cho editor với breaks và gfm
  const rawHtml = marked.parse(text, { breaks: true, gfm: true });
  
  // Convert standard paragraph breaks </p>\n<p> to empty paragraphs </p><p><br></p><p> for visual blank lines in the editor
  let cleanedHtml = rawHtml.replace(/<\/p>\s*\n\s*<p>/gi, '</p><p><br></p><p>');

  // Loại bỏ ký tự xuống dòng thừa sau thẻ <br> do marked sinh ra để tránh Tiptap hiểu nhầm thành dòng mới
  cleanedHtml = cleanedHtml.replace(/<br\s*\/?>\s*\n/gi, '<br>');
  // Loại bỏ các khoảng trắng và ký tự xuống dòng thừa giữa các thẻ HTML block để tránh Tiptap tự tạo dòng trống
  cleanedHtml = cleanedHtml.replace(/>\s*\n\s*</g, '><');
  
  return cleanedHtml;
};

const htmlToMarkdown = (html) => {
  if (!html) return '';
  // Chuẩn hóa ký tự xuống dòng của Windows/Mac để tránh lỗi regex
  let text = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Loại bỏ thẻ span phụ của audio-label để tránh lỗi regex match nhầm span đóng của nó
  text = text.replace(/<span\s+[^>]*class=["']audio-label["'][^>]*>([\s\S]*?)<\/span>/g, '');

  // *** BƯỚC QUAN TRỌNG: Đưa mention span ra khỏi thẻ formatting (strong, em, s, u...) ***
  // Khi TipTap export HTML, mention thường nằm BÊN TRONG thẻ <strong>/<em>/..., ví dụ:
  //   <strong>Test <span data-type="mention">...</span></strong>
  // Nếu giữ nguyên, khi chuyển đổi sẽ tạo ra **Test @[...](entity:...)** 
  // Khi render lại, `renderTextWithMentions` split tại @[...] → phần trước có **Test mà không có ** đóng → lỗi
  // Giải pháp: tách mention ra ngoài formatting tag trước khi xử lý
  const FORMATTING_TAGS_RE = ['strong', 'b', 'em', 'i', 's', 'del', 'strike', 'u'];
  FORMATTING_TAGS_RE.forEach(tag => {
    text = text.replace(
      new RegExp(`(<${tag}(?:\\s[^>]*)?>)([\\s\\S]*?)(<\\/${tag}>)`, 'gi'),
      (match, open, content, close) => {
        // Chỉ xử lý nếu content chứa mention span
        if (!/<span[^>]*data-type=["']mention["']/.test(content)) return match;
        const mentionRe = /(<span[^>]*data-type=["']mention["'][^>]*>[\s\S]*?<\/span>)/gi;
        const parts = [];
        let lastIdx = 0;
        let m2;
        mentionRe.lastIndex = 0;
        while ((m2 = mentionRe.exec(content)) !== null) {
          const before = content.slice(lastIdx, m2.index);
          // Chỉ bọc text thực sự (không phải khoảng trắng thuần)
          if (before.trim()) parts.push(`${open}${before.trimEnd()}${close}`);
          else if (before) parts.push(before);
          parts.push(m2[1]); // mention span giữ nguyên
          lastIdx = m2.index + m2[0].length;
        }
        const after = content.slice(lastIdx);
        if (after.trim()) parts.push(`${open}${after.trimStart()}${close}`);
        else if (after) parts.push(after);
        return parts.join('');
      }
    );
  });

  // Chuyển đổi ngược lại các thẻ span mention của Tiptap về dạng text thô @[Label](entity:type:id)
  text = text.replace(/<span\s+([^>]*data-type=["']mention["'][^>]*)>(.*?)<\/span>/g, (match, attributesGroup) => {
    const idMatch = attributesGroup.match(/data-id=["']([^'"]*)["']/);
    const labelMatch = attributesGroup.match(/data-label=["']([^'"]*)["']/);
    
    if (idMatch && labelMatch) {
      const id = idMatch[1];
      const label = labelMatch[1];
      const firstColon = id.indexOf(':');
      if (firstColon !== -1) {
        const type = id.substring(0, firstColon);
        const payload = id.substring(firstColon + 1);
        return `@[${label}](entity:${type}:${payload})`;
      }
    }
    return match;
  });
  
  // Chuyển đổi thẻ HTML link <a href="url">text</a> của Tiptap sang Markdown [text](url)
  text = text.replace(/<a\s+[^>]*href=["']([^'"]*)["'][^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)');

  // Chuyển đổi danh sách không thứ tự (ul) và có thứ tự (ol) về Markdown với khoảng xuống dòng kép để tránh bị dính liền với đoạn văn xung quanh
  text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
    const cleaned = listContent
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1')
      .replace(/\s*<li/gi, '<li')
      .replace(/<\/li>\s*/gi, '</li>');
    return '\n\n' + cleaned.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (liMatch, p1) => `- ${p1.trim()}\n`).trim() + '\n\n';
  });
  
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
    const cleaned = listContent
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1')
      .replace(/\s*<li/gi, '<li')
      .replace(/<\/li>\s*/gi, '</li>');
    let index = 1;
    return '\n\n' + cleaned.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (liMatch, p1) => `${index++}. ${p1.trim()}\n`).trim() + '\n\n';
  });
  
  // Chuyển đổi các tag in đậm, in nghiêng, gạch ngang về Markdown
  // Dùng callback để trim() khoảng trắng bên trong marker → tránh lỗi CommonMark **text ** (space trước ** không hợp lệ)
  text = text
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, (_, c) => { c = c.trim(); return c ? `**${c}**` : ''; })
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/g, (_, c) => { c = c.trim(); return c ? `**${c}**` : ''; })
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/g, (_, c) => { c = c.trim(); return c ? `*${c}*` : ''; })
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/g, (_, c) => { c = c.trim(); return c ? `*${c}*` : ''; })
    .replace(/<u[^>]*>([\s\S]*?)<\/u>/g, (_, c) => { c = c.trim(); return c ? `<u>${c}</u>` : ''; })
    .replace(/<s[^>]*>([\s\S]*?)<\/s>/g, (_, c) => { c = c.trim(); return c ? `~~${c}~~` : ''; })
    .replace(/<del[^>]*>([\s\S]*?)<\/del>/g, (_, c) => { c = c.trim(); return c ? `~~${c}~~` : ''; })
    .replace(/<strike[^>]*>([\s\S]*?)<\/strike>/g, (_, c) => { c = c.trim(); return c ? `~~${c}~~` : ''; });
  
  // Chuyển các khối paragraph <p> của Tiptap về ký tự xuống dòng \n để giữ cấu trúc văn bản thô
  // Đầu tiên convert các paragraph trống (như <p><br></p>) sang \n
  text = text.replace(/<p>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, '\n');

  text = text
    .replace(/<\/p>\s*<p>/g, '\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '')
    .replace(/<br\s*\/?>\s*/gi, '\n');
    
  // Giải mã các thực thể HTML thực tế
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
    
  // Làm sạch các dòng trống thừa do danh sách sinh ra
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
};

// SVG Icons for Toolbar
const BoldIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
);

const ItalicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
);

const StrikeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><path d="M16 6a4 4 0 0 0-4-4 4 4 0 0 0-4 4v3m0 6v3a4 4 0 0 0 4 4 4 4 0 0 0 4-4"/></svg>
);

const UnderlineIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v6a6 6 0 0 0 12 0V4"/>
    <line x1="4" y1="20" x2="20" y2="20"/>
  </svg>
);

const BulletListIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
);

const OrderedListIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="6" x2="21" y2="6"/>
    <line x1="10" y1="12" x2="21" y2="12"/>
    <line x1="10" y1="18" x2="21" y2="18"/>
    <path d="M4 6h1v4"/>
    <path d="M4 10h2"/>
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
  </svg>
);

const UndoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
);

const RedoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
);

// Toolbar Menu Component
const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const btnClass = (active) => 
    `p-1.5 rounded hover:bg-slate-200/80 dark:hover:bg-gray-700 transition-colors duration-100 text-slate-500 dark:text-gray-400 ${
      active ? 'bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : ''
    }`;

  return (
    <div className="border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/40 px-3 py-1.5 flex flex-wrap gap-1 items-center w-full">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="In đậm"
      >
        <BoldIcon />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="In nghiêng"
      >
        <ItalicIcon />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive('strike'))}
        title="Gạch ngang"
      >
        <StrikeIcon />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))}
        title="Gạch chân"
      >
        <UnderlineIcon />
      </button>
      
      <div className="w-[1px] h-4 bg-slate-300 dark:bg-gray-600 mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
        title="Danh sách dấu chấm"
      >
        <BulletListIcon />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
        title="Danh sách số"
      >
        <OrderedListIcon />
      </button>
      
      <div className="w-[1px] h-4 bg-slate-300 dark:bg-gray-600 mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded hover:bg-slate-200/80 dark:hover:bg-gray-700 transition-colors duration-100 text-slate-500 dark:text-gray-400 disabled:opacity-30 disabled:pointer-events-none"
        title="Hoàn tác"
      >
        <UndoIcon />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded hover:bg-slate-200/80 dark:hover:bg-gray-700 transition-colors duration-100 text-slate-500 dark:text-gray-400 disabled:opacity-30 disabled:pointer-events-none"
        title="Làm lại"
      >
        <RedoIcon />
      </button>
    </div>
  );
};

// Suggestion popup rendering list component
const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.label });
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-2 text-slate-400 text-xs shadow-lg">
        Không tìm thấy kết quả
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg max-h-[220px] overflow-y-auto py-1 z-[99999] min-w-[200px]">
      {props.items.map((item, index) => (
        <button
          type="button"
          key={item.id}
          onClick={() => selectItem(index)}
          className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors duration-100 ${
            index === selectedIndex
              ? 'bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-gray-100'
              : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <span className="text-base">{item.icon || '🔗'}</span>
          <span className="truncate">{item.display || item.label}</span>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';

const CustomMention = Mention.extend({
  renderHTML({ node, HTMLAttributes }) {
    const idStr = node.attrs.id || '';
    const label = node.attrs.label || '';

    if (idStr.startsWith('file:')) {
      const fileUrl = idStr.substring(5);
      const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || label.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|svg)$/);
      const isAudio = fileUrl.match(/\.(mp3|wav|ogg|m4a|flac)/i) || label.toLowerCase().match(/\.(mp3|wav|ogg|m4a|flac)$/);

      if (isImage) {
        const displayUrl = fileUrl.startsWith('pending:') ? fileUrl.substring(8) : fileUrl;
        return [
          'span',
          {
            ...HTMLAttributes,
            class: 'mention-image',
            'data-type': 'mention',
          },
          ['img', { src: displayUrl, alt: label }],
        ];
      } else if (isAudio) {
        const displayUrl = fileUrl.startsWith('pending:') ? fileUrl.substring(8) : fileUrl;
        return [
          'span',
          {
            ...HTMLAttributes,
            class: 'mention-audio',
            'data-type': 'mention',
          },
          ['span', { class: 'audio-label' }, '🎵 '],
          ['audio', { src: displayUrl, controls: 'true' }],
        ];
      } else {
        let fileIcon = '📄';
        if (label.endsWith('.pdf')) fileIcon = '📕';
        else if (label.endsWith('.xlsx') || label.endsWith('.xls')) fileIcon = '📗';
        else if (label.endsWith('.docx') || label.endsWith('.doc')) fileIcon = '📘';
        else if (label.endsWith('.zip') || label.endsWith('.rar')) fileIcon = '📦';

        return [
          'span',
          {
            ...HTMLAttributes,
            class: 'mention-file',
            'data-type': 'mention',
          },
          `${fileIcon} ${label}`,
        ];
      }
    }

    let emoji = '🏢';
    if (idStr.startsWith('activity:')) emoji = '📅';
    else if (idStr.startsWith('mou:')) emoji = '🤝';
    else if (idStr.startsWith('student:')) emoji = '🎓';

    return [
      'span',
      {
        ...HTMLAttributes,
        class: 'mention',
        'data-type': 'mention',
      },
      `${emoji} ${label}`,
    ];
  },
  renderText({ node }) {
    return `@${node.attrs.label}`;
  },
});

// Core MentionEditor Component
const MentionEditor = forwardRef(({ value, onChange, placeholder, onMentionClick, allEnterprises = [], allActivities = [], allMous = [], allStudents = [] }, ref) => {
  const lastEditorValue = useRef(value || '');

  useImperativeHandle(ref, () => ({
    insertFile: (name, url) => {
      if (editor) {
        editor
          .chain()
          .focus()
          .insertContent([
            {
              type: 'mention',
              attrs: {
                id: `file:${url}`,
                label: name,
              },
            },
            {
              type: 'text',
              text: ' ',
            },
          ])
          .run();
      }
    },
    insertMention: (entityType, id, label) => {
      if (editor) {
        editor
          .chain()
          .focus()
          .insertContent([
            {
              type: 'mention',
              attrs: {
                id: `${entityType}:${id}`,
                label: label,
              },
            },
            {
              type: 'text',
              text: ' ',
            },
          ])
          .run();
      }
    }
  }));

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-red-600 dark:text-red-400 font-semibold underline cursor-pointer',
        },
      }),
      CustomMention.configure({
        suggestion: {
          allowSpaces: true,
          items: ({ query }) => {
            const text = query || '';
            const match = text.match(/^(Doanh nghiệp|Hoạt động|MOU|Sinh viên):(.*)$/i);
            
            if (match) {
              const [_, category, subQuery] = match;
              const lowerQuery = subQuery.trim().toLowerCase();
              
              if (category.toLowerCase() === 'doanh nghiệp') {
                return allEnterprises
                  .filter(e => e.name.toLowerCase().includes(lowerQuery))
                  .map(e => ({ id: `enterprise:${e.id}`, label: e.name, icon: '🏢' }))
                  .slice(0, 10);
              } else if (category.toLowerCase() === 'hoạt động') {
                return allActivities
                  .filter(a => a.title.toLowerCase().includes(lowerQuery))
                  .map(a => ({ id: `activity:${a.id}`, label: a.title, icon: '📅' }))
                  .slice(0, 10);
              } else if (category.toLowerCase() === 'mou') {
                return allMous
                  .filter(m => 
                    m.mou_code.toLowerCase().includes(lowerQuery) || 
                    (m.partner_name && m.partner_name.toLowerCase().includes(lowerQuery)) ||
                    (m.enterprise_name && m.enterprise_name.toLowerCase().includes(lowerQuery))
                  )
                  .map(m => ({ id: `mou:${m.id}`, label: m.mou_code, icon: '🤝' }))
                  .slice(0, 10);
              } else if (category.toLowerCase() === 'sinh viên') {
                return allStudents
                  .filter(s => 
                    s.name.toLowerCase().includes(lowerQuery) || 
                    s.student_code.toLowerCase().includes(lowerQuery)
                  )
                  .map(s => ({ id: `student:${s.id}`, label: s.name, icon: '🎓' }))
                  .slice(0, 10);
              }
              return [];
            } else {
              const categories = [
                { id: 'category:enterprise', label: 'Doanh nghiệp:', display: 'Doanh nghiệp...' },
                { id: 'category:activity', label: 'Hoạt động:', display: 'Hoạt động...' },
                { id: 'category:mou', label: 'MOU:', display: 'MOU...' },
                { id: 'category:student', label: 'Sinh viên:', display: 'Sinh viên...' },
              ];
              const lowerText = text.trim().toLowerCase();
              if (!lowerText) return categories;
              return categories.filter(c => 
                c.label.toLowerCase().includes(lowerText) || 
                c.display.toLowerCase().includes(lowerText)
              );
            }
          },
          render: () => {
            let component;
            let popup;

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },

              onUpdate(props) {
                component.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  popup[0].hide();
                  return true;
                }

                return component.ref?.onKeyDown(props);
              },

              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
          command: ({ editor, range, props }) => {
            // Check if user selected a category rather than a leaf entity
            if (props.id.startsWith('category:')) {
              editor
                .chain()
                .focus()
                .insertContentAt(range, `@${props.label} `)
                .run();
              return;
            }
            
            // Insert standard mention node
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: 'mention',
                  attrs: {
                    id: props.id,
                    label: props.label,
                  },
                },
                {
                  type: 'text',
                  text: ' ',
                },
              ])
              .run();
          },
        },
      }),
    ],
    content: markdownToHtml(value),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      lastEditorValue.current = markdown;
      if (onChange) {
        onChange(markdown);
      }
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content outline-none w-full min-h-[110px] max-h-[250px] overflow-y-auto p-3 text-sm text-slate-700 dark:text-gray-200',
        placeholder: placeholder || '',
      },
      handleClick: (view, pos, event) => {
        const mentionElement = event.target.closest('[data-type="mention"]');
        if (mentionElement) {
          const dataId = mentionElement.getAttribute('data-id');
          if (dataId && onMentionClick) {
            onMentionClick(dataId);
            return true;
          }
        }
        return false;
      }
    },
  }, [allEnterprises, allActivities, allMous, allStudents]);

  // Synchronize editor content with form value when modified externally
  useEffect(() => {
    if (editor && !editor.isFocused) {
      if (normalizeLineEndings(value) !== normalizeLineEndings(lastEditorValue.current)) {
        editor.commands.setContent(markdownToHtml(value));
        lastEditorValue.current = value;
      }
    }
  }, [value, editor]);

  return (
    <div className="border border-slate-300 dark:border-gray-700 rounded-lg hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:hover:border-red-400 dark:focus-within:border-red-500 dark:focus-within:ring-red-500/20 transition-all bg-white dark:bg-gray-800 overflow-hidden min-h-[150px] flex flex-col w-full">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="w-full flex-1 flex" />
    </div>
  );
});

export default MentionEditor;
