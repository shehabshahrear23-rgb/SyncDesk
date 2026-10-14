import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  ArrowRight, 
  RefreshCw, 
  Cpu, 
  Copy, 
  Check, 
  Sliders, 
  Trash2, 
  CheckCircle,
  TrendingUp,
  ShieldAlert,
  Users,
  DollarSign,
  UserPlus
} from 'lucide-react';
import { aiInsights, companyHealth, financialData, employees } from '../data/mockData';
import * as companyData from '../data/mockData';
import { getToken } from '../utils/auth';

// Real AI models served by the backend (Groq). The key never reaches the browser.
const AI_MODELS = [
  { id: 'openai/gpt-oss-120b', label: 'GPT OSS 120B (Smart)' },
  { id: 'openai/gpt-oss-20b', label: 'GPT OSS 20B (Fast)' },
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' }
];
const BUILT_IN_LABEL = 'SyncDesk Built-in';
const modelLabel = (id) => AI_MODELS.find(m => m.id === id)?.label || id;
const timeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// --- Company knowledge: turn the app's data into compact text the AI can read ---
// Everything exported from data/mockData.js is included automatically, so new
// data added there is known to the AI without touching this file.
const HIDDEN_KEYS = new Set(['id', 'avatar', 'assigneeAvatar', 'icon', 'x', 'y', 'reactions', 'connections', 'unread']);
const SECTION_ORDER = ['employees', 'kanbanTasks', 'financialData', 'companyHealth', 'aiInsights', 'quickStats', 'resourceAllocation'];
const SECTION_TITLES = {
  kanbanTasks: 'Tasks on the kanban board (live)',
  financialData: 'Finance',
  companyHealth: 'Company health',
  aiInsights: 'Insights and alerts',
  quickStats: 'Quick stats',
  resourceAllocation: 'Resource allocation by department',
  digitalTwinNodes: 'Departments and systems health',
  documentLibrary: 'Documents',
  sampleMessages: 'Recent chat messages',
  chatChannels: 'Chat channels'
};
const MAX_COMPANY_CONTEXT = 11000;

const toWords = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '';
  if (Array.isArray(value)) {
    return value.map(item => (isPlainObject(item) ? `(${formatValue(item)})` : formatValue(item))).filter(Boolean).join(', ');
  }
  if (isPlainObject(value)) {
    return Object.entries(value)
      .filter(([key]) => !HIDDEN_KEYS.has(key))
      .map(([key, item]) => [toWords(key), formatValue(item)])
      .filter(([, text]) => text)
      .map(([key, text]) => `${key}: ${text}`)
      .join(' | ');
  }
  return String(value);
};

const formatSection = (name, value) => {
  const title = SECTION_TITLES[name] || toWords(name).replace(/^./, c => c.toUpperCase());
  let lines;
  if (Array.isArray(value)) {
    lines = value.map(item => `- ${formatValue(item)}`);
  } else {
    lines = Object.entries(value)
      .filter(([key]) => !HIDDEN_KEYS.has(key))
      .map(([key, item]) => (
        Array.isArray(item) && item.some(isPlainObject)
          ? `${toWords(key)}:\n${item.map(row => `  - ${formatValue(row)}`).join('\n')}`
          : `- ${toWords(key)}: ${formatValue(item)}`
      ));
  }
  return `## ${title}\n${lines.join('\n')}`;
};

const buildCompanyContext = (tasks, currentUser) => {
  const data = { ...companyData };
  if (Array.isArray(tasks)) data.kanbanTasks = tasks; // live board, including newly assigned tasks

  const names = [
    ...SECTION_ORDER.filter(name => name in data),
    ...Object.keys(data).filter(name => !SECTION_ORDER.includes(name))
  ];

  const parts = [];
  if (currentUser?.name) {
    parts.push(`The person asking is ${currentUser.name} (${currentUser.roleLabel || currentUser.role || 'user'}).`);
  }
  let length = 0;
  for (const name of names) {
    const value = data[name];
    if (!value || typeof value !== 'object') continue;
    const section = formatSection(name, value);
    if (length + section.length > MAX_COMPANY_CONTEXT) continue; // keep the request small enough for the free plan
    parts.push(section);
    length += section.length;
  }
  return parts.join('\n\n');
};

// --- Small, safe Markdown renderer (headings, bullets, bold, inline code, code blocks) ---
const renderInline = (text) =>
  text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g).map((part, i) => {
    if (/^`[^`\n]+`$/.test(part)) {
      return (
        <code key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', backgroundColor: 'var(--bg-input)', padding: '1px 5px', borderRadius: '4px' }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^\*\*[^*\n]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return part;
  });

const MarkdownText = ({ text }) => {
  const segments = String(text ?? '').split('```');
  return (
    <div style={{ overflowWrap: 'anywhere' }}>
      {segments.map((segment, index) => {
        // Odd segments sit between ``` fences: show them as a code block
        if (index % 2 === 1) {
          const code = segment.replace(/^[^\n]*\n/, '').replace(/\n$/, '');
          return (
            <pre key={index} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', margin: '8px 0', overflowX: 'auto', whiteSpace: 'pre' }}>
              {code || segment}
            </pre>
          );
        }
        return segment.split('\n').map((line, lineIndex) => {
          const key = `${index}-${lineIndex}`;
          const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
          if (heading) {
            return <div key={key} style={{ fontSize: '14px', fontWeight: '800', margin: '6px 0 4px' }}>{renderInline(heading[1])}</div>;
          }
          const bullet = line.match(/^(\s*)[-*•]\s+(.*)$/);
          if (bullet) {
            return (
              <div key={key} style={{ display: 'flex', gap: '8px', paddingLeft: `${Math.min(bullet[1].length, 8) * 6}px` }}>
                <span>•</span>
                <span style={{ minWidth: 0 }}>{renderInline(bullet[2])}</span>
              </div>
            );
          }
          if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
            return <hr key={key} style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />;
          }
          if (!line.trim()) return <div key={key} style={{ height: '8px' }} />;
          return <div key={key}>{renderInline(line)}</div>;
        });
      })}
    </div>
  );
};

const AIAssistantModal = ({ 
  isOpen, 
  onClose, 
  onNavigateModule, 
  onOpenAssignModal,
  onAssignTask,
  tasks,
  currentUser
}) => {
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [aiStatus, setAiStatus] = useState('checking'); // checking | connected | no-key | offline
  const [selectedTone, setSelectedTone] = useState('Executive');
  const [copiedId, setCopiedId] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      model: BUILT_IN_LABEL,
      local: true,
      text: "Hello! I am your SyncDesk AI Assistant. I know your company's people, tasks, projects and finances, and I can also answer general questions like ChatGPT or Gemini.\n\nTo give work to someone, start your message with **Assign task to** and their name.",
      timestamp: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // When the assistant opens, ask the backend whether the AI key is set up
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    setAiStatus('checking');
    fetch('/api/ai/status', { signal: controller.signal })
      .then(response => (response.ok ? response.json() : Promise.reject(new Error('offline'))))
      .then(data => setAiStatus(data.configured === true ? 'connected' : data.configured === false ? 'no-key' : 'offline'))
      .catch(err => { if (err.name !== 'AbortError') setAiStatus('offline'); });
    return () => controller.abort();
  }, [isOpen]);

  if (!isOpen) return null;

  const statusBadge = {
    checking: { label: 'CHECKING AI...', color: 'var(--text-muted)', background: 'var(--bg-card)' },
    connected: { label: 'AI CONNECTED', color: '#10a37f', background: 'rgba(16, 163, 127, 0.15)' },
    'no-key': { label: 'AI KEY MISSING', color: 'var(--warning-amber)', background: 'rgba(255, 149, 0, 0.12)' },
    offline: { label: 'BACKEND OFFLINE', color: 'var(--danger-red)', background: 'rgba(255, 59, 48, 0.12)' }
  }[aiStatus];

  const quickPrompts = [
    { label: "🏢 Company Overview", query: "Give me a short overview of our company: the team, the projects, and how we are doing." },
    { label: "📊 Loss or Benefit Analysis", query: "Show me our financial loss and benefit analysis using the company's finance data." },
    { label: "📋 Open Tasks", query: "Which tasks are not finished yet, who owns each one, and which is most urgent?" },
    { label: "⚡ Assign Task to Marcus Vance", query: "Assign work to Marcus Vance: Optimize database query latency." }
  ];

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        model: BUILT_IN_LABEL,
        local: true,
        text: `Chat cleared. Ask me about the company or anything else.`,
        timestamp: timeNow()
      }
    ]);
  };

  // 1. Check for Work Assignment intent
  const checkWorkAssignmentIntent = (query) => {
    const lower = query.toLowerCase();
    if (lower.includes("assign") || lower.includes("delegate") || lower.includes("give task") || lower.includes("create task")) {
      // Find candidate employee
      let matchedEmp = employees.find(e => lower.includes(e.name.toLowerCase()) || lower.includes(e.name.split(' ')[0].toLowerCase())) || employees[1]; // default Marcus Vance
      
      // Extract title from prompt
      let title = "Optimize system performance & sprint deliverable";
      if (query.includes(":")) {
        title = query.split(":")[1].trim();
      } else if (lower.includes("task to")) {
        const parts = query.split(/task to [a-zA-Z\s]+/i);
        if (parts[1] && parts[1].trim()) title = parts[1].trim();
      }

      const newTask = {
        id: `task-${Date.now()}`,
        title: title,
        project: "Digital Twin Engine",
        status: "inProgress",
        priority: "High",
        assignee: matchedEmp.name,
        assigneeAvatar: matchedEmp.avatar,
        progress: 20,
        dueDate: "Oct 15, 2026",
        tags: ["AI Delegated", "Sprint"],
        description: `Work task assigned via AI Assistant prompt: "${query}"`
      };

      if (onAssignTask) {
        onAssignTask(newTask);
      }

      return {
        text: `### ✅ Work Task Successfully Assigned!\n\n* **Task Title**: "${newTask.title}"\n* **Assigned Employee**: **${matchedEmp.name}** (${matchedEmp.title})\n* **Department**: ${matchedEmp.department}\n* **Project Scope**: ${newTask.project}\n* **Priority Level**: High\n* **Status**: In Progress (Dispatched to Kanban Board)\n\nThe task has been added live to the Sprint Operations Kanban board.`,
        action: { label: "View Task on Sprint Kanban Board", action: () => { onClose(); onNavigateModule('projects'); } }
      };
    }
    return null;
  };

  // 3. Real AI answer from our own backend (POST /api/ai/chat/stream -> Groq).
  //    The answer arrives piece by piece, like ChatGPT typing. onText gets the text so far.
  const fetchAIResponse = async (history, onText) => {
    const controller = new AbortController();
    // Give up if nothing new arrives for 60 seconds
    let idleTimer = setTimeout(() => controller.abort(), 60000);
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => controller.abort(), 60000);
    };

    let text = '';
    let model = modelLabel(selectedModel);

    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
        },
        body: JSON.stringify({
          messages: history,
          model: selectedModel,
          mode: selectedTone,
          company_context: buildCompanyContext(tasks, currentUser)
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (typeof data?.detail === 'string') {
          if (data.code === 'backend_offline') setAiStatus('offline');
          else if (response.status === 503) setAiStatus('no-key');
          return { text: data.detail, isError: true };
        }
        if (response.status === 404) {
          return { text: 'The backend is running an old version that has no AI chat. Stop "npm run dev" with Ctrl+C, close any other backend window, and start it again.', isError: true };
        }
        if (response.status === 422) {
          return { text: 'That message could not be sent. Clear the chat with the bin icon and try again.', isError: true };
        }
        return { text: `The backend hit an error while answering (code ${response.status}). The terminal running "npm run dev" shows the reason.`, isError: true };
      }

      setAiStatus('connected');
      model = modelLabel(response.headers.get('X-AI-Model') || selectedModel);

      if (response.body?.getReader) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          resetIdleTimer();
          text += decoder.decode(value, { stream: true });
          if (text) onText(text, model);
        }
        text += decoder.decode();
      } else {
        text = await response.text();
      }

      if (!text.trim()) {
        return { text: 'The AI returned an empty answer. Please ask again.', isError: true };
      }
      return { text: text.trim(), model };
    } catch (err) {
      if (text.trim()) {
        return { text: `${text.trim()}\n\n[The answer was cut off. Please ask again.]`, model };
      }
      if (err.name === 'AbortError') {
        return { text: 'The AI took too long to answer. Please try again.', isError: true };
      }
      setAiStatus('offline');
      return { text: 'The connection to the app server was lost. Check that "npm run dev" is still running in the terminal, then try again.', isError: true };
    } finally {
      clearTimeout(idleTimer);
    }
  };

  const handleSend = async (textToSend = null) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || isTyping) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: queryText,
      timestamp: timeNow()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // Built-in shortcuts run only when asked for on purpose, so normal questions
    // (even ones containing words like "profit" or "assign") always go to the real AI.
    const fromQuickPrompt = textToSend !== null;
    const isAssignCommand = /^\s*(assign|delegate|give task|create task)\b/i.test(queryText);

    // Step A: Work assignment (quick button, or a message that starts with "Assign ...")
    const assignmentResponse = (fromQuickPrompt || isAssignCommand) ? checkWorkAssignmentIntent(queryText) : null;
    if (assignmentResponse) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          model: BUILT_IN_LABEL,
          text: assignmentResponse.text,
          action: assignmentResponse.action,
          timestamp: timeNow()
        }]);
        setIsTyping(false);
      }, 500);
      return;
    }

    // Step C: Ask the real AI, sending the recent conversation so it remembers context
    const history = [...messages, userMsg]
      .filter(msg => !msg.local && !msg.isError)
      .slice(-6)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: String(msg.text).slice(0, 2000)
      }));

    const replyId = Date.now() + 1;
    let started = false;

    const aiResult = await fetchAIResponse(history, (textSoFar, model) => {
      if (!started) {
        // First words arrived: show the answer bubble and let it grow
        started = true;
        setIsStreaming(true);
        setMessages(prev => [...prev, { id: replyId, sender: 'ai', model, text: textSoFar, timestamp: timeNow() }]);
      } else {
        setMessages(prev => prev.map(msg => (msg.id === replyId ? { ...msg, text: textSoFar } : msg)));
      }
    });

    const finalMessage = {
      id: replyId,
      sender: 'ai',
      model: aiResult.isError ? 'AI unavailable' : aiResult.model,
      text: aiResult.text,
      isError: aiResult.isError,
      timestamp: timeNow()
    };
    setMessages(prev => (
      prev.some(msg => msg.id === replyId)
        ? prev.map(msg => (msg.id === replyId ? finalMessage : msg))
        : [...prev, finalMessage]
    ));
    setIsStreaming(false);
    setIsTyping(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 180,
      display: 'flex',
      alignItems: 'center',
      justify: 'flex-end',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '520px',
        height: 'calc(100vh - 40px)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--neon-cyan)',
        borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          backgroundColor: 'var(--bg-input)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10a37f 0%, #00f0ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              boxShadow: '0 0 14px rgba(16, 163, 127, 0.4)'
            }}>
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>AI Chat & Task Assistant</h3>
                <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: statusBadge.background, color: statusBadge.color, padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                  {statusBadge.label}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Knows Your Company • Ask Anything • Assign Tasks</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleClearChat}
              title="Clear chat context"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <Trash2 size={16} />
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Model Selector Bar */}
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          fontSize: '11px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={13} color="var(--neon-cyan)" />
            <span style={{ color: 'var(--text-muted)' }}>AI Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="input-field"
              style={{ fontSize: '11px', padding: '2px 8px', height: '26px' }}
            >
              {AI_MODELS.map(model => (
                <option key={model.id} value={model.id}>{model.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={13} color="var(--primary-accent)" />
            <span style={{ color: 'var(--text-muted)' }}>Mode:</span>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="input-field"
              style={{ fontSize: '11px', padding: '2px 8px', height: '26px' }}
            >
              <option value="Executive">Executive & Action</option>
              <option value="Technical">Technical & Code</option>
              <option value="Financial">Profit & Loss Analysis</option>
            </select>
          </div>
        </div>

        {/* Quick Suggestion Prompts */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '6px', overflowX: 'auto', backgroundColor: 'var(--bg-input)' }}>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Conversation Stream Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                display: 'flex',
                gap: '12px',
                maxWidth: '92%',
                alignItems: 'flex-start',
                flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: msg.sender === 'user' ? 'var(--primary-accent)' : '#10a37f',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {msg.sender === 'user' ? <User size={16} color="#ffffff" /> : <Bot size={16} color="#ffffff" />}
                </div>

                <div style={{
                  backgroundColor: msg.sender === 'user' ? 'var(--primary-accent)' : 'var(--bg-card)',
                  color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                  padding: '14px 16px',
                  minWidth: 0,
                  borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  border: msg.sender === 'user' ? 'none' : `1px solid ${msg.isError ? 'var(--danger-red)' : 'var(--border-color)'}`,
                  fontSize: '13px',
                  lineHeight: '1.5',
                  boxShadow: 'var(--shadow-card)',
                  position: 'relative'
                }}>
                  {/* Model Tag for AI responses */}
                  {msg.sender === 'ai' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: msg.isError ? 'var(--danger-red)' : '#10a37f', textTransform: 'uppercase' }}>
                        {msg.model || BUILT_IN_LABEL}
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                      >
                        {copiedId === msg.id ? <Check size={12} color="var(--neon-green)" /> : <Copy size={12} />}
                        <span>{copiedId === msg.id ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  {/* Render Response Content */}
                  {msg.sender === 'user' ? (
                    <div style={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{msg.text}</div>
                  ) : (
                    <MarkdownText text={msg.text} />
                  )}

                  {/* Dynamic Action Trigger */}
                  {msg.action && (
                    <button
                      onClick={msg.action.action}
                      style={{
                        marginTop: '12px',
                        width: '100%',
                        backgroundColor: 'rgba(0, 122, 255, 0.12)',
                        border: '1px solid var(--primary-accent)',
                        color: 'var(--primary-accent)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        gap: '6px',
                        transition: 'var(--transition)'
                      }}
                    >
                      <span>{msg.action.label}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px', padding: '0 6px' }}>
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isTyping && !isStreaming && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10a37f', fontSize: '12px', padding: '8px' }}>
              <RefreshCw size={14} className="spin" />
              <span>AI is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-input)',
          display: 'flex',
          gap: '8px'
        }}>
          <input 
            type="text"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input-field"
            style={{ flex: 1, fontSize: '13px', height: '40px' }}
          />
          <button
            type="submit"
            disabled={isTyping}
            title={isTyping ? 'Wait for the answer to finish' : 'Send'}
            className="btn-primary"
            style={{ padding: '8px 16px', height: '40px', opacity: isTyping ? 0.5 : 1, cursor: isTyping ? 'not-allowed' : 'pointer' }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantModal;
