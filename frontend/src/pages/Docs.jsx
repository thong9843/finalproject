import React, { useState, useEffect, useMemo } from 'react';
import { Input, Spin, Alert, Empty, Breadcrumb } from 'antd';
import { SearchOutlined, BookOutlined, MenuOutlined, CloseOutlined, ArrowLeftOutlined, FormOutlined } from '@ant-design/icons';
import { marked } from 'marked';
import { useTheme } from '../context/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';

// Chuyển đổi tiếng Việt không dấu chuẩn và tạo slug
const slugify = (text) => {
    if (!text) return '';
    // Loại bỏ thẻ HTML
    let cleaned = text.replace(/<\/?[^>]+(>|$)/g, "");
    // Loại bỏ markdown format như backticks `
    cleaned = cleaned.replace(/`/g, '');
    
    // Loại bỏ dấu tiếng Việt
    cleaned = cleaned.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    cleaned = cleaned.replace(/[đĐ]/g, 'd');
    
    // Chuyển sang chữ thường
    cleaned = cleaned.toLowerCase();
    
    // Loại bỏ emoji và các ký tự đặc biệt (chỉ giữ chữ cái, số, khoảng trắng, gạch ngang)
    cleaned = cleaned.replace(/[^a-z0-9\s-]/g, '');
    
    // Thay thế nhiều khoảng trắng hoặc gạch ngang thành một gạch ngang
    cleaned = cleaned.replace(/[\s-]+/g, '-');
    
    // Trim gạch ngang ở đầu/cuối
    cleaned = cleaned.replace(/^-+|-+$/g, '');
    
    return cleaned;
};

// Loại bỏ các ký tự định dạng markdown và HTML thô để hiển thị đẹp hơn trên TOC
const cleanMarkdownForDisplay = (text) => {
    if (!text) return '';
    // Loại bỏ thẻ HTML
    let cleaned = text.replace(/<\/?[^>]+(>|$)/g, "");
    // Loại bỏ các ký tự định dạng markdown như `, *, _
    cleaned = cleaned.replace(/[`*_]/g, '');
    return cleaned.trim();
};

// Configure marked with a custom heading renderer to support anchors and scrolling offset
marked.use({
    renderer: {
        heading({ text, depth }) {
            const anchor = slugify(text);
            return `<h${depth} id="${anchor}" class="group relative flex items-center scroll-mt-20 font-bold border-b border-slate-100 dark:border-slate-800/50 pb-2 mb-4 mt-6 text-slate-800 dark:text-gray-100 ${
                depth === 1 ? 'text-3xl' : depth === 2 ? 'text-xl' : 'text-lg'
            }">${text}<a href="#${anchor}" class="opacity-0 group-hover:opacity-100 ml-2 text-red-500 transition-opacity">#</a></h${depth}>`;
        }
    }
});

const DOC_IDS = ['intro', 'accounts', 'enterprises', 'students', 'activities', 'mous', 'tasks', 'notes', 'advanced'];

const Docs = () => {
    const { isDark } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [docMenu, setDocMenu] = useState([]);
    const [activeDocId, setActiveDocId] = useState('intro');
    const [docContent, setDocContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [allDocsText, setAllDocsText] = useState({});
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Fetch documentation menu list and index all files for search
    useEffect(() => {
        const initializeDocs = async () => {
            setLoading(true);
            try {
                // Fetch menu configuration
                const menuRes = await fetch('/docs/docs.json');
                if (menuRes.ok) {
                    const menuData = await menuRes.json();
                    setDocMenu(menuData);
                }

                // Load all md files for instant client-side search indexing
                const docsData = {};
                for (const id of DOC_IDS) {
                    try {
                        const res = await fetch(`/docs/${id}.md`);
                        if (res.ok) {
                            docsData[id] = await res.text();
                        }
                    } catch (e) {
                        console.error('Error fetching md file:', id, e);
                    }
                }
                setAllDocsText(docsData);

                // Set initial active content
                if (docsData['intro']) {
                    setDocContent(docsData['intro']);
                } else {
                    const fallbackRes = await fetch('/docs/intro.md');
                    if (fallbackRes.ok) {
                        setDocContent(await fallbackRes.text());
                    }
                }
            } catch (error) {
                console.error('Failed to initialize documentation:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeDocs();
        document.title = "Tài liệu Hướng dẫn | VLU Enterprise Link";
    }, []);

    // Đồng bộ URL query params (?doc=notes) với activeDocId
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const docParam = params.get('doc');
        if (docParam && DOC_IDS.includes(docParam)) {
            setActiveDocId(docParam);
        }
    }, [location.search]);

    // Cuộn tới heading khi có hash (#them-ghi-chu) và nội dung đã load xong
    useEffect(() => {
        if (!loading && docContent && location.hash) {
            const hashId = location.hash.replace('#', '');
            const timer = setTimeout(() => {
                const element = document.getElementById(hashId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [loading, docContent, location.hash]);

    // Load active document content
    useEffect(() => {
        if (allDocsText[activeDocId]) {
            setDocContent(allDocsText[activeDocId]);
            // Scroll content area back to top
            const contentEl = document.getElementById('docs-content-area');
            if (contentEl) contentEl.scrollTop = 0;
        } else {
            const fetchDoc = async () => {
                setLoading(true);
                try {
                    const res = await fetch(`/docs/${activeDocId}.md`);
                    if (res.ok) {
                        const text = await res.text();
                        setDocContent(text);
                    }
                } catch (e) {
                    console.error('Failed to load active doc:', activeDocId, e);
                } finally {
                    setLoading(false);
                }
            };
            fetchDoc();
        }
    }, [activeDocId, allDocsText]);

    // Parse Markdown to HTML with standard GitHub-style alerts support
    const renderedHtml = useMemo(() => {
        if (!docContent) return '';
        try {
            let html = marked.parse(docContent);
            
            // Post-process HTML to convert standard blockquotes with [!NOTE], [!IMPORTANT], etc. into styled alert boxes
            html = html.replace(/<blockquote>\s*<p>\s*\[!NOTE\]([\s\S]*?)<\/p>\s*<\/blockquote>/gi, 
                '<div class="my-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-r-xl text-sm text-blue-900 dark:text-blue-200"><strong class="text-blue-700 dark:text-blue-400 block mb-1">💡 LƯU Ý</strong>$1</div>');
            html = html.replace(/<blockquote>\s*<p>\s*\[!IMPORTANT\]([\s\S]*?)<\/p>\s*<\/blockquote>/gi, 
                '<div class="my-4 p-4 bg-red-50/50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl text-sm text-red-900 dark:text-red-200"><strong class="text-red-700 dark:text-red-400 block mb-1">⚠️ QUAN TRỌNG</strong>$1</div>');
            html = html.replace(/<blockquote>\s*<p>\s*\[!WARNING\]([\s\S]*?)<\/p>\s*<\/blockquote>/gi, 
                '<div class="my-4 p-4 bg-orange-50/50 dark:bg-orange-950/20 border-l-4 border-orange-500 rounded-r-xl text-sm text-orange-900 dark:text-orange-200"><strong class="text-orange-700 dark:text-orange-400 block mb-1">🚨 CẢNH BÁO</strong>$1</div>');
            html = html.replace(/<blockquote>\s*<p>\s*\[!TIP\]([\s\S]*?)<\/p>\s*<\/blockquote>/gi, 
                '<div class="my-4 p-4 bg-green-50/50 dark:bg-green-950/20 border-l-4 border-green-500 rounded-r-xl text-sm text-green-900 dark:text-green-200"><strong class="text-green-700 dark:text-green-400 block mb-1">💡 GỢI Ý</strong>$1</div>');
            
            // Fallbacks in case marked renders differently
            html = html.replace(/<blockquote>([\s\S]*?)\[!NOTE\]([\s\S]*?)<\/blockquote>/gi, 
                '<div class="my-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-r-xl text-sm text-blue-900 dark:text-blue-200"><strong class="text-blue-700 dark:text-blue-400 block mb-1">💡 LƯU Ý</strong>$1$2</div>');
            html = html.replace(/<blockquote>([\s\S]*?)\[!IMPORTANT\]([\s\S]*?)<\/blockquote>/gi, 
                '<div class="my-4 p-4 bg-red-50/50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl text-sm text-red-900 dark:text-red-200"><strong class="text-red-700 dark:text-red-400 block mb-1">⚠️ QUAN TRỌNG</strong>$1$2</div>');
            
            return html;
        } catch (e) {
            console.error('Marked parsing error:', e);
            return docContent; // Return raw text on error
        }
    }, [docContent]);

    // Extract headings from Markdown for the Right Side Table of Contents (TOC)
    const headings = useMemo(() => {
        if (!docContent) return [];
        const lines = docContent.split('\n');
        const list = [];
        lines.forEach(line => {
            const match = line.match(/^(#{2,3})\s+(.+)$/);
            if (match) {
                const depth = match[1].length;
                const text = match[2].trim();
                const anchor = slugify(text);
                const displayText = cleanMarkdownForDisplay(text);
                list.push({ depth, text: displayText, anchor });
            }
        });
        return list;
    }, [docContent]);

    // Search function across all indexed markdown documents
    const searchResults = useMemo(() => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return [];
        const kw = trimmed.toLowerCase();
        const list = [];

        Object.entries(allDocsText).forEach(([id, text]) => {
            const menuItem = docMenu.find(item => item.id === id);
            const title = menuItem ? menuItem.title : id;

            let idx = text.toLowerCase().indexOf(kw);
            if (idx !== -1) {
                // Generate a highlighted text snippet surrounding the keyword
                const start = Math.max(0, idx - 60);
                const end = Math.min(text.length, idx + kw.length + 60);
                let snippet = text.substring(start, end);
                if (start > 0) snippet = '...' + snippet;
                if (end < text.length) snippet = snippet + '...';

                // Escape HTML tags in snippet
                const escaped = snippet
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');

                // Highlight the keyword
                const regex = new RegExp(`(${kw})`, 'gi');
                const highlighted = escaped.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800/60 text-slate-900 dark:text-white px-0.5 rounded font-semibold">$1</mark>');

                list.push({
                    id,
                    title,
                    snippet: highlighted
                });
            }
        });
        return list;
    }, [searchQuery, allDocsText, docMenu]);

    const handleSelectSearchResult = (id) => {
        setActiveDocId(id);
        navigate(`/docs?doc=${id}`);
        setSearchQuery('');
    };

    const activeMenuTitle = useMemo(() => {
        const item = docMenu.find(d => d.id === activeDocId);
        return item ? item.title : '';
    }, [activeDocId, docMenu]);

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 bg-slate-50 dark:bg-gray-900/50 p-4 md:p-6 rounded-xl border border-slate-200/60 dark:border-gray-700/60 overflow-hidden relative">
            <style>{`
                .docs-content p {
                    line-height: 1.75;
                    margin-bottom: 1.25rem;
                    color: #475569;
                }
                .dark .docs-content p {
                    color: #cbd5e1;
                }
                .docs-content ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin-bottom: 1.25rem;
                    color: #475569;
                }
                .dark .docs-content ul {
                    color: #cbd5e1;
                }
                .docs-content ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin-bottom: 1.25rem;
                    color: #475569;
                }
                .dark .docs-content ol {
                    color: #cbd5e1;
                }
                .docs-content li {
                    margin-bottom: 0.5rem;
                }
                .docs-content code {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 0.85em;
                    color: #da251d;
                    background-color: #f1f5f9;
                    padding: 0.2rem 0.4rem;
                    border-radius: 0.25rem;
                    border: 1px solid #e2e8f0;
                }
                .dark .docs-content code {
                    color: #f87171;
                    background-color: #1e293b;
                    border-color: #334155;
                }
                .docs-content pre {
                    background-color: #1e293b;
                    color: #f8fafc;
                    padding: 1.25rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    margin-bottom: 1.5rem;
                    border: 1px solid #334155;
                }
                .docs-content pre code {
                    background-color: transparent;
                    color: inherit;
                    padding: 0;
                    border-radius: 0;
                    border: none;
                }
                .docs-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 1.5rem;
                }
                .docs-content th, .docs-content td {
                    border: 1px solid #e2e8f0;
                    padding: 0.75rem 1rem;
                    text-align: left;
                    font-size: 0.875rem;
                }
                .dark .docs-content th, .dark .docs-content td {
                    border-color: #334155;
                }
                .docs-content th {
                    background-color: #f8fafc;
                    font-weight: 600;
                    color: #1e293b;
                }
                .dark .docs-content th {
                    background-color: #1e293b;
                    color: #f8fafc;
                }
                .docs-content tr:nth-child(even) {
                    background-color: rgba(248, 250, 252, 0.5);
                }
                .dark .docs-content tr:nth-child(even) {
                    background-color: rgba(30, 41, 59, 0.3);
                }
                .docs-content blockquote {
                    border-left: 4px solid #cbd5e1;
                    padding-left: 1rem;
                    margin: 1.25rem 0;
                    color: #64748b;
                    font-style: italic;
                }
                .dark .docs-content blockquote {
                    border-left-color: #475569;
                    color: #94a3b8;
                }
                .docs-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.5rem;
                    margin: 1.5rem 0;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    border: 1px solid #e2e8f0;
                }
                .dark .docs-content img {
                    border-color: #334155;
                }
            `}</style>

            {/* MOBILE SIDEBAR TRIGGER BUTTON */}
            <div className="md:hidden flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-slate-200/60 dark:border-gray-700/60 mb-2 shrink-0 w-full shadow-sm">
                <span className="font-bold text-slate-800 dark:text-gray-100 flex items-center gap-2">
                    <BookOutlined className="text-red-500" /> Tài liệu: {activeMenuTitle}
                </span>
                <button
                    onClick={() => setMobileMenuOpen(prev => !prev)}
                    className="p-1 rounded-md bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300"
                >
                    {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
                </button>
            </div>

            {/* LEFT SIDEBAR NAVIGATION */}
            <div className={`
                absolute md:relative top-[72px] md:top-0 left-4 md:left-0 z-30
                w-[calc(100%-32px)] md:w-64 h-[calc(100%-90px)] md:h-full
                flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-slate-200/60 dark:border-gray-700/60 p-4 shrink-0 transition-all duration-300
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BookOutlined className="text-red-500" /> Hướng dẫn sử dụng
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {docMenu.map((doc) => {
                        const isActive = doc.id === activeDocId;
                        return (
                            <button
                                key={doc.id}
                                onClick={() => {
                                    setActiveDocId(doc.id);
                                    navigate(`/docs?doc=${doc.id}`);
                                    setMobileMenuOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between group ${
                                    isActive
                                        ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-500 border border-red-100 dark:border-red-900/30 font-semibold'
                                        : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700/50 hover:text-slate-800 dark:hover:text-gray-100'
                                }`}
                            >
                                <span>{doc.title}</span>
                                <span className={`w-1.5 h-1.5 rounded-full bg-red-500 transition-transform ${isActive ? 'scale-100' : 'scale-0 group-hover:scale-100 bg-slate-400'}`}></span>
                            </button>
                        );
                    })}
                </div>

                {/* SURVEY CARD */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-700 shrink-0">
                    <div className="bg-gradient-to-br from-red-50 to-red-100/40 dark:from-red-950/20 dark:to-red-900/10 p-3.5 rounded-xl border border-red-100 dark:border-red-900/30 text-center">
                        <div className="text-vluRed dark:text-red-400 font-semibold text-xs mb-1.5 flex items-center justify-center gap-1.5">
                            <FormOutlined /> Khảo sát người dùng
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                            Hãy dành 1 phút để đánh giá và giúp chúng tôi hoàn thiện hệ thống nhé!
                        </p>
                        <a
                            href="https://forms.gle/vG4hhfUFrPTUNgwY6"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block w-full py-1.5 bg-vluRed hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm text-center"
                        >
                            Làm khảo sát ➔
                        </a>
                    </div>
                </div>
            </div>

            {/* MAIN DOC CONTAINER */}
            <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-xl border border-slate-200/60 dark:border-gray-700/60 flex flex-col overflow-hidden shadow-sm relative">
                
                {/* DOC TOP BAR: SEARCH & BREADCRUMBS */}
                <div className="p-4 border-b border-slate-200/60 dark:border-gray-700/60 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0 bg-slate-50/50 dark:bg-gray-800/40">
                    <Breadcrumb
                        items={[
                            { title: 'Tài liệu' },
                            { title: activeMenuTitle }
                        ]}
                        className="text-xs"
                    />

                    {/* SEARCH INPUT BAR */}
                    <div className="relative w-full sm:w-72">
                        <Input
                            placeholder="Tìm kiếm tài liệu..."
                            prefix={<SearchOutlined className="text-slate-400" />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            allowClear
                            className="rounded-lg h-9"
                        />

                        {/* SEARCH RESULTS DROPDOWN */}
                        {searchQuery.trim() && (
                            <div className="absolute top-full mt-1.5 right-0 w-full sm:w-[400px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-slate-200 dark:border-gray-700 max-h-80 overflow-y-auto z-[200] p-2 flex flex-col gap-1.5 animate-fade-in">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-100 dark:border-gray-700">
                                    Kết quả tìm kiếm ({searchResults.length})
                                </div>
                                {searchResults.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-slate-400">Không tìm thấy nội dung nào</div>
                                ) : (
                                    searchResults.map((result, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSelectSearchResult(result.id)}
                                            className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700/50 border border-transparent hover:border-slate-100 dark:hover:border-gray-700 transition-colors flex flex-col gap-1 focus:outline-none"
                                        >
                                            <div className="text-xs font-bold text-red-600 dark:text-red-500 flex items-center gap-1.5">
                                                <BookOutlined /> {result.title}
                                            </div>
                                            <div
                                                className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: result.snippet }}
                                            />
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* CONTENT LAYOUT CONTAINER */}
                <div className="flex-1 flex min-h-0 min-w-0">
                    
                    {/* MARKDOWN RENDER AREA */}
                    <div
                        id="docs-content-area"
                        className="flex-1 overflow-y-auto px-6 md:px-10 py-6 md:py-8 custom-scrollbar scroll-smooth"
                    >
                        {loading ? (
                            <div className="w-full h-full flex justify-center items-center py-20"><Spin size="large" /></div>
                        ) : !docContent ? (
                            <Empty description="Không có nội dung" className="my-20" />
                        ) : (
                            <div
                                className="docs-content max-w-3xl mx-auto pb-12 prose dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                            />
                        )}
                    </div>

                    {/* RIGHT SIDEBAR: TABLE OF CONTENTS (TOC) */}
                    {headings.length > 0 && (
                        <div className="hidden lg:flex flex-col w-56 border-l border-slate-200/60 dark:border-gray-700/60 p-4 shrink-0 bg-slate-50/20 dark:bg-gray-800/10">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                                Nội dung chính (TOC)
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar text-xs">
                                {headings.map((h, i) => (
                                    <a
                                        key={i}
                                        href={`#${h.anchor}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const element = document.getElementById(h.anchor);
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                navigate(`/docs?doc=${activeDocId}#${h.anchor}`, { replace: true });
                                            }
                                        }}
                                        className={`block hover:text-red-500 transition-colors ${
                                            h.depth === 2 
                                                ? 'font-medium text-slate-600 dark:text-gray-300' 
                                                : 'pl-3.5 text-slate-400 dark:text-gray-500'
                                        }`}
                                    >
                                        {h.text}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Docs;
