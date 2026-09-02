import React, { useState, useRef, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Send, User, Sparkles, Plus, Trash2, Clock,
    Search, Home, Paperclip, Lightbulb,
    Globe, ChevronDown, ArrowUp, BarChart2, Check
} from 'lucide-react';

export default function AiAssistantIndex({ hasApiKey }) {
    const { auth } = usePage().props;
    const userId = auth?.user?.id || 'guest';
    const userName = auth?.user?.name || 'Admin';
    const storageKey = `trakin_ai_chat_sessions_user_${userId}_v1`;

    const [selectedModel, setSelectedModel] = useState('Trakin AI 4o');
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarTab, setSidebarTab] = useState('home'); // 'home' | 'history'

    const createNewSession = () => {
        const id = 'sess_' + Date.now();
        return {
            id,
            title: 'Percakapan Baru',
            createdAt: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
            updatedAt: new Date().getTime(),
            messages: [],
        };
    };

    const loadUserSessions = () => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error('Failed to load chat history:', e);
        }
        return [createNewSession()];
    };

    const [sessions, setSessions] = useState(loadUserSessions);

    const [activeSessionId, setActiveSessionId] = useState(() => {
        return sessions[0]?.id || 'sess_' + Date.now();
    });

    useEffect(() => {
        const loaded = loadUserSessions();
        setSessions(loaded);
        setActiveSessionId(loaded[0]?.id || 'sess_' + Date.now());
    }, [userId]);

    const [input, setInput] = useState('');
    const [loadingSessionId, setLoadingSessionId] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(sessions));
        } catch (e) {
            console.error('Failed to save chat history:', e);
        }
    }, [sessions, storageKey]);

    const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || createNewSession();
    const messages = activeSession.messages || [];
    const isLoading = loadingSessionId === activeSession.id;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages, isLoading]);

    const handleNewChat = () => {
        const existingEmpty = sessions.find((s) => !s.messages || s.messages.length === 0);
        if (existingEmpty) {
            setActiveSessionId(existingEmpty.id);
            setInput('');
            return;
        }

        const newSess = createNewSession();
        setSessions((prev) => [newSess, ...prev]);
        setActiveSessionId(newSess.id);
        setInput('');
    };

    const handleDeleteSession = (sessionId, e) => {
        e.stopPropagation();
        if (sessions.length <= 1) {
            const fresh = createNewSession();
            setSessions([fresh]);
            setActiveSessionId(fresh.id);
            return;
        }

        const filtered = sessions.filter((s) => s.id !== sessionId);
        setSessions(filtered);
        if (activeSessionId === sessionId) {
            setActiveSessionId(filtered[0].id);
        }
    };

    const handleSend = async (textToSend = null) => {
        const query = textToSend || input;
        if (!query.trim() || loadingSessionId) return;

        // Lock current session ID and history for memory context
        const targetSessionId = activeSessionId;
        const targetSession = sessions.find((s) => s.id === targetSessionId);
        const historyPayload = (targetSession?.messages || []).map((m) => ({
            sender: m.sender,
            text: m.text,
        }));

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: query,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };

        setSessions((prev) =>
            prev.map((s) => {
                if (s.id === targetSessionId) {
                    const isFirstQuery = s.title === 'Percakapan Baru' || !s.messages || s.messages.length === 0;
                    const updatedTitle = isFirstQuery ? (query.length > 30 ? query.substring(0, 30) + '...' : query) : s.title;
                    return {
                        ...s,
                        title: updatedTitle,
                        updatedAt: new Date().getTime(),
                        messages: [...(s.messages || []), userMsg],
                    };
                }
                return s;
            })
        );

        if (!textToSend) setInput('');
        setLoadingSessionId(targetSessionId);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/owner/ai-assistant/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    message: query,
                    history: historyPayload,
                }),
            });
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error('Server mengembalikan respons tidak valid. Silakan refresh halaman dan coba lagi.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.reply || 'Layanan AI sedang tidak tersedia.');
            }

            const aiMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: data.reply,
                engine: data.engine || (hasApiKey ? 'Google Gemini AI Engine' : 'Analitik POS Local'),
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            };

            setSessions((prev) =>
                prev.map((s) => {
                    if (s.id === targetSessionId) {
                        return {
                            ...s,
                            updatedAt: new Date().getTime(),
                            messages: [...(s.messages || []), aiMsg],
                        };
                    }
                    return s;
                })
            );
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: error?.message || "Terjadi kesalahan koneksi saat memproses data. Silakan coba kembali.",
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            };
            setSessions((prev) =>
                prev.map((s) => {
                    if (s.id === targetSessionId) {
                        return {
                            ...s,
                            messages: [...(s.messages || []), errorMsg],
                        };
                    }
                    return s;
                })
            );
        } finally {
            setLoadingSessionId(null);
        }
    };

    const getGreetingTime = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const filteredSessions = sessions.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupSessionsByTime = () => {
        const today = [];
        const earlier = [];
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        filteredSessions.forEach((s) => {
            const diff = now - (s.updatedAt || 0);
            if (diff < oneDay) {
                today.push(s);
            } else {
                earlier.push(s);
            }
        });

        return { today, earlier };
    };

    const { today: todaySessions, earlier: earlierSessions } = groupSessionsByTime();

    const formatInlineMarkdown = (text) => {
        if (!text) return '';
        const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
        const parts = text.split(regex);

        return parts.map((part, i) => {
            if (!part) return null;
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                const clean = part.slice(2, -2).replace(/[\*#_]/g, '');
                return <strong key={i} className="font-bold text-gray-900">{clean}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
                const clean = part.slice(1, -1).replace(/[\*#_]/g, '');
                return <em key={i} className="italic text-gray-800">{clean}</em>;
            }
            if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
                const clean = part.slice(1, -1);
                return <code key={i} className="bg-gray-100 px-1 py-0.5 rounded font-mono text-[11px] text-gray-800">{clean}</code>;
            }
            const cleanText = part.replace(/[\*#_]/g, '');
            return cleanText;
        });
    };

    const formatMarkdown = (content) => {
        if (!content) return null;
        const lines = content.split('\n');
        const blocks = [];
        let currentTable = null;

        lines.forEach((line) => {
            const trimmed = line.trim();
            const isTableRow = trimmed.startsWith('|') || (trimmed.includes('|') && trimmed.split('|').length >= 3);

            if (isTableRow) {
                if (!currentTable) currentTable = [];
                currentTable.push(trimmed);
            } else {
                if (currentTable) {
                    blocks.push({ type: 'table', rows: currentTable });
                    currentTable = null;
                }
                blocks.push({ type: 'text', line: line });
            }
        });

        if (currentTable) blocks.push({ type: 'table', rows: currentTable });

        return blocks.map((block, idx) => {
            if (block.type === 'table') {
                const rows = block.rows;
                const dataRows = rows.filter(r => r.replace(/[\s|:\-]/g, '').length > 0);
                if (dataRows.length === 0) return null;

                const parseCells = (rowStr) => {
                    const raw = rowStr.split('|');
                    if (raw.length > 1 && raw[0].trim() === '') raw.shift();
                    if (raw.length > 0 && raw[raw.length - 1].trim() === '') raw.pop();
                    return raw.map(c => c.trim());
                };

                const headerCells = parseCells(dataRows[0]);
                const bodyRows = dataRows.slice(1);

                return (
                    <div key={`table_${idx}`} className="my-3 overflow-x-auto rounded-xl border border-gray-200/80 shadow-xs bg-white">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {headerCells.map((header, hIdx) => (
                                        <th key={hIdx} className="px-3.5 py-2.5 font-bold text-gray-900 border-r border-gray-200/80 last:border-r-0 whitespace-nowrap">
                                            {formatInlineMarkdown(header)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bodyRows.map((rowStr, rIdx) => {
                                    const cells = parseCells(rowStr);
                                    return (
                                        <tr key={rIdx} className="hover:bg-blue-50/30 transition-colors">
                                            {cells.map((cell, cIdx) => (
                                                <td key={cIdx} className="px-3.5 py-2.5 text-gray-800 border-r border-gray-100 last:border-r-0 font-medium whitespace-nowrap">
                                                    {formatInlineMarkdown(cell)}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            }

            const line = block.line;
            const trimmed = line.trim();

            if (trimmed === '---' || trimmed === '***') return <hr key={idx} className="my-3 border-gray-200" />;
            if (/^#+\s*/.test(line)) {
                const cleanHeading = line.replace(/^#+\s*/, '');
                return <h3 key={idx} className="text-xs font-bold text-gray-900 tracking-wide uppercase mt-4 mb-1.5">{formatInlineMarkdown(cleanHeading)}</h3>;
            }
            if (/^[\-\*\+]\s+/.test(line)) {
                const cleanItem = line.replace(/^[\-\*\+]\s+/, '');
                return <li key={idx} className="ml-4 list-disc text-xs text-gray-700 my-0.5">{formatInlineMarkdown(cleanItem)}</li>;
            }
            if (/^\d+\.\s*/.test(line)) {
                const cleanItem = line.replace(/^\d+\.\s*/, '');
                return <li key={idx} className="ml-4 list-decimal text-xs text-gray-700 my-0.5">{formatInlineMarkdown(cleanItem)}</li>;
            }
            if (trimmed === '') return <div key={idx} className="h-1.5" />;

            return <p key={idx} className="text-xs text-gray-800 leading-relaxed my-0.5">{formatInlineMarkdown(line)}</p>;
        });
    };

    return (
        <AdminLayout title="AI Assistant">
            <Head title="AI Assistant" />

            <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-130px)] min-h-[620px] -m-2 sm:m-0">
                {/* LEFT SIDEBAR Drawer */}
                <div className="w-full lg:w-64 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/90 p-4 flex flex-col shrink-0 shadow-2xs">
                    {/* Brand Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-gray-900 tracking-tight">AI Assistant</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleNewChat}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                            title="Mulai Percakapan Baru"
                        >
                            <Plus className="w-4.5 h-4.5" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="my-3">
                        <div className="relative rounded-xl border border-gray-200/80 bg-gray-50/70 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all flex items-center px-3 py-1.5">
                            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                            />
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-200/60 px-1 py-0.5 rounded shrink-0">⌘K</span>
                        </div>
                    </div>

                    {/* Navigation Items (Home Only) */}
                    <div className="pb-3 border-b border-gray-100">
                        <button
                            type="button"
                            onClick={() => { setSidebarTab('home'); handleNewChat(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 transition-colors cursor-pointer"
                        >
                            <Home className="w-4 h-4 text-blue-600" />
                            <span>Home</span>
                        </button>
                    </div>

                    {/* Chat History Group List */}
                    <div className="flex-1 overflow-y-auto pt-3 space-y-4 pr-0.5 scrollbar-hide">
                        {todaySessions.length > 0 && (
                            <div>
                                <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Today</p>
                                <div className="space-y-0.5">
                                    {todaySessions.map((sess) => {
                                        const isActive = sess.id === activeSessionId;
                                        return (
                                            <div
                                                key={sess.id}
                                                onClick={() => {
                                                    setActiveSessionId(sess.id);
                                                    setSidebarTab('home');
                                                }}
                                                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                                                    isActive
                                                        ? 'bg-blue-50 text-blue-900 font-semibold'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                <span className="truncate pr-2">{sess.title}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteSession(sess.id, e)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {earlierSessions.length > 0 && (
                            <div>
                                <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">7 Days Ago</p>
                                <div className="space-y-0.5">
                                    {earlierSessions.map((sess) => {
                                        const isActive = sess.id === activeSessionId;
                                        return (
                                            <div
                                                key={sess.id}
                                                onClick={() => {
                                                    setActiveSessionId(sess.id);
                                                    setSidebarTab('home');
                                                }}
                                                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                                                    isActive
                                                        ? 'bg-blue-50 text-blue-900 font-semibold'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                <span className="truncate pr-2">{sess.title}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteSession(sess.id, e)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT MAIN CANVAS AREA (Clean Floating Layout - No Container BG) */}
                <div className="flex-1 bg-transparent p-0 flex flex-col justify-between relative min-h-[550px]">
                    {/* Top Status Bar */}
                    <div className="relative z-20 flex items-center justify-end py-1">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${hasApiKey ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {hasApiKey ? 'Gemini AI Connected' : 'Local Analytics'}
                        </span>
                    </div>

                    {/* CENTER CANVAS: Greeting Hero (if no messages yet) OR Chat Feed */}
                    {messages.length === 0 ? (
                        <div className="my-auto py-8 text-center space-y-3 relative z-10 animate-in fade-in duration-300">
                            {/* Headline */}
                            <div className="space-y-1">
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                    {getGreetingTime()}, {userName.split(' ')[0]}
                                </h2>
                                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                    How Can I <span className="text-blue-600 font-extrabold">Assist You Today?</span>
                                </h3>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto py-6 space-y-4 relative z-10 scrollbar-hide my-2 pr-1">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                                >
                                    {msg.sender !== 'user' && (
                                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                                            <img src="/images/logo_trakin.png" alt="Trakin AI" className="w-full h-full object-cover rounded-xl" />
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`p-4 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                                                msg.sender === 'user'
                                                    ? 'bg-blue-600 text-white font-medium'
                                                    : 'bg-white border border-gray-200/90 text-gray-800'
                                            }`}
                                        >
                                            {msg.sender === 'user' ? (
                                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                            ) : (
                                                <div className="space-y-1">
                                                    {formatMarkdown(msg.text)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-medium px-1">
                                            <span>{msg.time}</span>
                                            {msg.engine && (
                                                <>
                                                    <span>•</span>
                                                    <span>{msg.engine}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                 <div className="flex gap-3 max-w-3xl animate-in fade-in duration-200">
                                     <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                                         <img src="/images/logo_trakin.png" alt="Trakin AI" className="w-full h-full object-cover rounded-xl" />
                                     </div>
                                     <div className="bg-white border border-gray-200/90 px-4 py-3 rounded-2xl shadow-2xs flex items-center gap-1.5">
                                         <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                                         <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                                         <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                                     </div>
                                 </div>
                             )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {/* BOTTOM FLOATING GLASSMORPHIC INPUT BOX */}
                    <div className="relative z-20 max-w-2xl mx-auto w-full">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="bg-white/90 backdrop-blur-xl border border-gray-200/80 rounded-3xl p-3.5 sm:p-4 shadow-xl shadow-blue-500/5 space-y-3"
                        >
                            {/* Input Field */}
                            <div className="px-1">
                                <textarea
                                    ref={inputRef}
                                    rows="2"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Tanyakan analisis omset POS, statistik member, atau rekomendasi gym..."
                                    className="w-full text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none resize-none leading-relaxed font-medium"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Toolbar Feature Pills & Floating Action Button */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100/80">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleSend("Ringkasan statistik total omset dan penjualan POS bulan ini")}
                                        disabled={isLoading}
                                        className="px-3 py-1.5 bg-gray-100/80 hover:bg-blue-50 text-gray-600 hover:text-blue-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-200/60"
                                    >
                                        <BarChart2 className="w-3.5 h-3.5" />
                                        <span>Total Omset POS</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSend("Produk kasir gym paling laris dan rincian transaksi QRIS vs Cash")}
                                        disabled={isLoading}
                                        className="px-3 py-1.5 bg-gray-100/80 hover:bg-blue-50 text-gray-600 hover:text-blue-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-200/60"
                                    >
                                        <Paperclip className="w-3.5 h-3.5" />
                                        <span>Produk Terlaris & QRIS</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSend("Ringkasan statistik aktivitas kehadiran member dan pendaftaran baru")}
                                        disabled={isLoading}
                                        className="px-3 py-1.5 bg-gray-100/80 hover:bg-blue-50 text-gray-600 hover:text-blue-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-200/60"
                                    >
                                        <Globe className="w-3.5 h-3.5" />
                                        <span>Statistik Member & Check-in</span>
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="w-9 h-9 rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center transition-all disabled:opacity-40 shadow-md cursor-pointer ml-auto"
                                >
                                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
