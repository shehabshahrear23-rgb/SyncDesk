import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  Users,
  AlertCircle,
  RefreshCw,
  X,
  ShieldCheck,
  UserPlus,
  FileText,
  Sparkles,
  Server,
  CheckCircle,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react';
import EmployeeCard from '../EmployeeCard';
import MetadataBadge from '../MetadataBadge';
import { getToken, clearToken } from '../../utils/auth';

const USERS_ENDPOINT = '/api/admin/users';
const ME_ENDPOINT = '/api/auth/me';
const DOCUMENTS_ENDPOINT = '/api/documents';
const AI_STATUS_ENDPOINT = '/api/ai/status';

const ROLES = [
  { key: 'admin', label: 'Admin', plural: 'Admins', color: '#a855f7' },
  { key: 'hr', label: 'HR', plural: 'HR', color: 'var(--neon-cyan)' },
  { key: 'employee', label: 'Employee', plural: 'Employees', color: 'var(--neon-green)' }
];
const ALL_ROLES = 'all';
const EMPTY_NEW_USER = { name: '', email: '', role: 'employee', password: '' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-10-01" -> "Oct 01, 2026"
const formatDate = (value) => {
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match || !MONTHS[Number(match[2]) - 1]) return String(value ?? '');
  return `${MONTHS[Number(match[2]) - 1]} ${match[3]}, ${match[1]}`;
};

// Turns any API error into one readable sentence
const readError = async (response, fallback) => {
  const data = await response.json().catch(() => null);
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
    return String(data.detail[0].msg).replace(/^Value error, /, '');
  }
  return fallback;
};

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  zIndex: 100
};

const dialogStyle = {
  width: '460px',
  maxWidth: '100%',
  maxHeight: '100%',
  overflowY: 'auto',
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color-highlight)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' };
const panelTitleStyle = { fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' };
const panelSubtitleStyle = { fontSize: '12px', color: 'var(--text-muted)' };

// One KPI tile, in the same style as the other SyncDesk dashboards
const StatTile = ({ label, value, detail, detailColor, icon, tint }) => (
  <div className="card-panel card-panel-hover" style={{ minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</span>
      <div style={{ backgroundColor: tint.background, padding: '8px', borderRadius: '8px', color: tint.color, display: 'flex', flexShrink: 0 }}>
        {icon}
      </div>
    </div>
    <div style={{ margin: '12px 0 4px' }}>
      <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </h3>
    </div>
    <span style={{ fontSize: '12px', color: detailColor || 'var(--text-muted)', fontWeight: '600' }}>{detail}</span>
  </div>
);

const AdminDashboard = ({ onUnauthorized, onNavigateModule }) => {
  // Data from the backend
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [documents, setDocuments] = useState(null); // null = could not be loaded
  const [aiStatus, setAiStatus] = useState(null);   // null = could not be loaded
  const [responseMs, setResponseMs] = useState(null);

  // Page state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState(ALL_ROLES);
  const [notice, setNotice] = useState('');

  // Add User form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_NEW_USER);
  const [showPassword, setShowPassword] = useState(false);

  // Manage User window
  const [managedUser, setManagedUser] = useState(null);
  const [managedRole, setManagedRole] = useState('employee');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Shared by both windows
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Keep the latest onUnauthorized without making the fetch effect re-run
  const onUnauthorizedRef = useRef(onUnauthorized);
  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  // No/expired/forbidden session: drop the token and go back to the login screen
  const handleUnauthorized = useCallback(() => {
    clearToken();
    if (onUnauthorizedRef.current) onUnauthorizedRef.current();
  }, []);

  // Load everything on mount (and again when "Refresh" or "Try again" is clicked)
  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      const token = getToken();
      if (!token) {
        handleUnauthorized();
        return;
      }

      setIsLoading(true);
      setError('');

      const authHeaders = { Authorization: `Bearer ${token}` };
      const startedAt = performance.now();

      try {
        // The account list is required. If it fails, the dashboard cannot be shown.
        const response = await fetch(USERS_ENDPOINT, { headers: authHeaders, signal: controller.signal });
        setResponseMs(Math.round(performance.now() - startedAt));

        if (response.status === 401 || response.status === 403) {
          handleUnauthorized();
          return;
        }
        if (!response.ok) {
          throw new Error(await readError(response, `The server responded with an error (${response.status}).`));
        }
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);

        // The rest is optional: each part shows "unavailable" by itself if it fails.
        const optional = async (url, options) => {
          try {
            const result = await fetch(url, { ...options, signal: controller.signal });
            return result.ok ? await result.json() : null;
          } catch (err) {
            if (err.name === 'AbortError') throw err;
            return null;
          }
        };
        const [meData, documentData, aiData] = await Promise.all([
          optional(ME_ENDPOINT, { headers: authHeaders }),
          optional(DOCUMENTS_ENDPOINT),
          optional(AI_STATUS_ENDPOINT)
        ]);
        setMe(meData && meData.id !== undefined ? meData : null);
        setDocuments(Array.isArray(documentData) ? documentData : null);
        setAiStatus(aiData && typeof aiData.configured === 'boolean' ? aiData : null);
        setIsLoading(false);
      } catch (err) {
        if (err.name === 'AbortError') return; // component unmounted mid-request
        setError(
          err instanceof TypeError
            ? 'Could not reach the server. Check that "npm run dev" is still running, then try again.'
            : err.message || 'Could not load the admin dashboard.'
        );
        setIsLoading(false);
      }
    };

    loadDashboard();
    return () => controller.abort();
  }, [reloadKey, handleUnauthorized]);

  // ---- Derived numbers (all computed from the loaded data) ----

  const roleCounts = useMemo(() => {
    const counts = { admin: 0, hr: 0, employee: 0, other: 0 };
    users.forEach((user) => {
      const key = String(user?.role ?? '').toLowerCase();
      if (key in counts && key !== 'other') counts[key] += 1;
      else counts.other += 1;
    });
    return counts;
  }, [users]);

  const documentStats = useMemo(() => {
    if (!documents) return null;
    const categories = new Set();
    documents.forEach((doc) => {
      const category = typeof doc?.category === 'string' ? doc.category.trim().toLowerCase() : '';
      if (category) categories.add(category);
    });
    return { total: documents.length, categories: categories.size, recent: documents.slice(0, 5) };
  }, [documents]);

  // Client-side search and role filter: no API call while typing
  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const role = String(user?.role ?? '').toLowerCase();
      if (roleFilter !== ALL_ROLES && role !== roleFilter) return false;
      if (!query) return true;
      const name = String(user?.name ?? '').toLowerCase();
      const email = String(user?.email ?? '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [users, searchTerm, roleFilter]);

  // ---- Actions ----

  const authorizedFetch = async (url, options = {}) => {
    const token = getToken();
    if (!token) {
      handleUnauthorized();
      return null;
    }
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    });
    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      return null;
    }
    return response;
  };

  const openAddUser = () => {
    setNewUser(EMPTY_NEW_USER);
    setShowPassword(false);
    setFormError('');
    setNotice('');
    setIsAddOpen(true);
  };

  const openManageUser = (user) => {
    setManagedUser(user);
    setManagedRole(String(user?.role ?? 'employee').toLowerCase());
    setConfirmDelete(false);
    setFormError('');
    setNotice('');
  };

  const closeWindows = () => {
    if (isSaving) return;
    setIsAddOpen(false);
    setManagedUser(null);
  };

  // Escape closes whichever window is open
  useEffect(() => {
    if (!isAddOpen && !managedUser) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) {
        setIsAddOpen(false);
        setManagedUser(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAddOpen, managedUser, isSaving]);

  const updateNewUser = (field) => (event) => {
    const { value } = event.target;
    setFormError('');
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  const runAction = async (action) => {
    if (isSaving) return;
    setFormError('');
    setIsSaving(true);
    try {
      await action();
    } catch {
      setFormError('Could not reach the server. Check that "npm run dev" is still running, then try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUser = (event) => {
    event.preventDefault();
    const name = newUser.name.trim();
    const email = newUser.email.trim();

    if (!name) { setFormError('Please enter a name.'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setFormError('Please enter a valid email address.'); return; }
    if (newUser.password.length < 8) { setFormError('The password needs at least 8 characters.'); return; }

    runAction(async () => {
      const response = await authorizedFetch(USERS_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ name, email, role: newUser.role, password: newUser.password })
      });
      if (!response) return;
      if (!response.ok) {
        setFormError(await readError(response, 'The account could not be created.'));
        return;
      }
      const created = await response.json();
      setUsers(prev => [...prev, created].sort((a, b) => String(a?.name ?? '').localeCompare(String(b?.name ?? ''))));
      setIsAddOpen(false);
      setNotice(`Account created for ${created.name} (${created.email}).`);
    });
  };

  const handleSaveRole = () => {
    if (!managedUser) return;
    runAction(async () => {
      const response = await authorizedFetch(`${USERS_ENDPOINT}/${managedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: managedRole })
      });
      if (!response) return;
      if (!response.ok) {
        setFormError(await readError(response, 'The role could not be changed.'));
        return;
      }
      const updated = await response.json();
      setUsers(prev => prev.map(user => (user?.id === updated.id ? updated : user)));
      setManagedUser(null);
      setNotice(`${updated.name} is now ${ROLES.find(role => role.key === updated.role)?.label || updated.role}.`);
    });
  };

  const handleDeleteUser = () => {
    if (!managedUser) return;
    runAction(async () => {
      const response = await authorizedFetch(`${USERS_ENDPOINT}/${managedUser.id}`, { method: 'DELETE' });
      if (!response) return;
      if (!response.ok) {
        setFormError(await readError(response, 'The account could not be deleted.'));
        return;
      }
      setUsers(prev => prev.filter(user => user?.id !== managedUser.id));
      setManagedUser(null);
      setNotice(`The account for ${managedUser.name || managedUser.email} was deleted.`);
    });
  };

  const isOwnAccount = Boolean(managedUser && me && managedUser.id === me.id);
  const managedRoleChanged = Boolean(managedUser) && managedRole !== String(managedUser.role ?? '').toLowerCase();

  // ---- Status values shown in the tiles and the system panel ----

  const aiTile = aiStatus === null
    ? { value: 'Unknown', detail: 'Status unavailable', color: 'var(--text-muted)' }
    : aiStatus.configured
      ? { value: 'Connected', detail: aiStatus.model || 'Key saved', color: 'var(--neon-green)' }
      : { value: 'Key missing', detail: 'Add GROQ_API_KEY in backend/.env', color: 'var(--warning-amber)' };

  const systemChecks = [
    { label: 'API server', ok: true, text: responseMs !== null ? `Online, answered in ${responseMs} ms` : 'Online' },
    { label: 'Account database', ok: true, text: `${users.length} ${users.length === 1 ? 'account' : 'accounts'} loaded` },
    {
      label: 'Document Vault',
      ok: documentStats !== null,
      text: documentStats !== null ? `${documentStats.total} documents in ${documentStats.categories} categories` : 'Could not be loaded'
    },
    {
      label: 'AI assistant',
      ok: Boolean(aiStatus?.configured),
      text: aiStatus === null ? 'Status unavailable' : aiStatus.configured ? `Key saved, model ${aiStatus.model}` : 'No API key saved'
    }
  ];

  const roleBars = [
    ...ROLES.map(role => ({ ...role, count: roleCounts[role.key] })),
    ...(roleCounts.other > 0 ? [{ key: 'other', plural: 'Other roles', color: 'var(--text-muted)', count: roleCounts.other }] : [])
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="card-panel glass-panel" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 260px' }}>
          <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.14)', padding: '10px', borderRadius: '8px', color: '#a855f7', display: 'flex', flexShrink: 0 }}>
            <ShieldCheck size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>Administration Console</h2>
            <p style={panelSubtitleStyle}>
              {me ? `Signed in as ${me.name} • ` : ''}Accounts, access and system health
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setNotice(''); setReloadKey(key => key + 1); }}
            disabled={isLoading}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            <RefreshCw size={14} style={isLoading ? { animation: 'spin 1s linear infinite' } : undefined} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={openAddUser}
            disabled={isLoading || Boolean(error)}
            style={{ fontSize: '12px', padding: '6px 14px', opacity: isLoading || error ? 0.6 : 1 }}
          >
            <UserPlus size={14} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Result of the last action */}
      {notice && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--neon-green)' }}>
          <CheckCircle size={14} style={{ flexShrink: 0 }} />
          <span>{notice}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="card-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <RefreshCw size={16} color="var(--neon-cyan)" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading admin dashboard...</span>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(255, 59, 48, 0.12)',
            border: '1px solid var(--danger-red)',
            color: 'var(--danger-red)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            <RefreshCw size={14} />
            <span>Try again</span>
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* KPI Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
            <StatTile
              label="Total Accounts"
              value={users.length}
              detail={`${roleCounts.admin} admin • ${roleCounts.hr} HR • ${roleCounts.employee} employee`}
              icon={<Users size={18} />}
              tint={{ background: 'rgba(0, 122, 255, 0.12)', color: 'var(--primary-accent)' }}
            />
            <StatTile
              label="Documents in Vault"
              value={documentStats !== null ? documentStats.total : '—'}
              detail={documentStats !== null ? `Across ${documentStats.categories} categories` : 'Could not be loaded'}
              icon={<FileText size={18} />}
              tint={{ background: 'rgba(0, 240, 255, 0.12)', color: 'var(--neon-cyan)' }}
            />
            <StatTile
              label="AI Assistant"
              value={aiTile.value}
              detail={aiTile.detail}
              detailColor={aiTile.color}
              icon={<Sparkles size={18} />}
              tint={{ background: 'rgba(255, 149, 0, 0.12)', color: 'var(--warning-amber)' }}
            />
            <StatTile
              label="API Server"
              value="Online"
              detail={responseMs !== null ? `Answered in ${responseMs} ms` : 'Responding'}
              detailColor="var(--neon-green)"
              icon={<Server size={18} />}
              tint={{ background: 'rgba(0, 230, 118, 0.12)', color: 'var(--neon-green)' }}
            />
          </div>

          {/* Accounts by Role + System Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>

            <div className="card-panel glass-panel">
              <h3 style={{ ...panelTitleStyle, marginBottom: '4px' }}>Accounts by Role</h3>
              <p style={{ ...panelSubtitleStyle, marginBottom: '16px' }}>Who can do what in SyncDesk</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {roleBars.map((role) => {
                  const percentage = users.length ? Math.round((role.count / users.length) * 100) : 0;
                  return (
                    <div key={role.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{role.plural}</span>
                        <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>{role.count} ({percentage}%)</span>
                      </div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: role.color, borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card-panel glass-panel">
              <h3 style={{ ...panelTitleStyle, marginBottom: '4px' }}>System Status</h3>
              <p style={{ ...panelSubtitleStyle, marginBottom: '16px' }}>Checked when this page loaded</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {systemChecks.map((check) => (
                  <div
                    key={check.label}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>{check.label}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{check.text}</p>
                    </div>
                    <span className={`status-pill ${check.ok ? 'status-online' : 'status-away'}`} style={{ fontSize: '11px', flexShrink: 0 }}>
                      {check.ok ? 'OK' : 'Check'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Documents */}
          {documentStats !== null && (
            <div className="card-panel glass-panel">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h3 style={panelTitleStyle}>Latest Documents</h3>
                  <p style={panelSubtitleStyle}>The most recent uploads to the Document Vault</p>
                </div>
                {onNavigateModule && (
                  <button
                    type="button"
                    onClick={() => onNavigateModule('documents')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary-accent)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Open Document Vault</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {documentStats.recent.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No documents have been uploaded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {documentStats.recent.map((doc, index) => (
                    <div
                      key={doc?.id ?? `document-${index}`}
                      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px 12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 240px' }}>
                        <FileText size={16} color="var(--primary-accent)" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc?.title || 'Untitled document'}
                          </h4>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {[doc?.author, formatDate(doc?.upload_date), doc?.file_size].filter(Boolean).join(' • ')}
                          </p>
                        </div>
                      </div>
                      <MetadataBadge label={doc?.category} type="category" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Company Directory */}
          <div className="card-panel glass-panel">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                <h3 style={panelTitleStyle}>Company Directory</h3>
                <p style={panelSubtitleStyle}>
                  {filteredUsers.length === users.length
                    ? `${users.length} ${users.length === 1 ? 'account' : 'accounts'}`
                    : `Showing ${filteredUsers.length} of ${users.length}`}
                </p>
              </div>

              <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '420px' }}>
                <Search size={16} color="var(--neon-cyan)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  aria-label="Search employees by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field cyber-input"
                  style={{ width: '100%', paddingLeft: '42px', paddingRight: '38px', height: '42px', fontSize: '13px', borderRadius: '8px' }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Role filter */}
            <div role="tablist" aria-label="Filter accounts by role" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
              {[{ key: ALL_ROLES, plural: 'All', count: users.length }, ...ROLES.map(role => ({ ...role, count: roleCounts[role.key] }))].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="tab"
                  aria-selected={roleFilter === option.key}
                  onClick={() => setRoleFilter(option.key)}
                  style={{
                    backgroundColor: roleFilter === option.key ? 'var(--primary-accent)' : 'var(--bg-card)',
                    color: roleFilter === option.key ? '#fff' : 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {option.plural} ({option.count})
                </button>
              ))}
            </div>
          </div>

          {filteredUsers.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
              {filteredUsers.map((user, index) => (
                <EmployeeCard key={user?.id ?? `user-${index}`} user={user} onManage={user?.id !== undefined ? openManageUser : undefined} />
              ))}
            </div>
          ) : (
            <div className="card-panel" style={{ textAlign: 'center', padding: '40px 16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                {users.length === 0
                  ? 'No users yet'
                  : searchTerm.trim()
                    ? `No one matches "${searchTerm.trim()}"`
                    : 'No accounts with this role'}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {users.length === 0
                  ? 'Click "Add User" to create the first account.'
                  : 'Try a different name, email address or role.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Add User window */}
      {isAddOpen && (
        <div style={overlayStyle} onMouseDown={(event) => { if (event.target === event.currentTarget) closeWindows(); }}>
          <form onSubmit={handleAddUser} role="dialog" aria-modal="true" aria-label="Add user" style={dialogStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--neon-green)', fontWeight: '600', textTransform: 'uppercase' }}>Add User</span>
              <button type="button" onClick={closeWindows} aria-label="Close" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 59, 48, 0.12)', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: '600' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label htmlFor="new-user-name" style={labelStyle}>Full name</label>
              <input id="new-user-name" type="text" value={newUser.name} maxLength={80} onChange={updateNewUser('name')} className="input-field" style={{ width: '100%' }} autoComplete="off" />
            </div>

            <div>
              <label htmlFor="new-user-email" style={labelStyle}>Work email</label>
              <input id="new-user-email" type="text" inputMode="email" value={newUser.email} maxLength={120} onChange={updateNewUser('email')} placeholder="name@company.com" className="input-field" style={{ width: '100%' }} autoComplete="off" />
            </div>

            <div>
              <label htmlFor="new-user-role" style={labelStyle}>Role</label>
              <select id="new-user-role" value={newUser.role} onChange={updateNewUser('role')} className="input-field" style={{ width: '100%' }}>
                {ROLES.map(role => <option key={role.key} value={role.key}>{role.label}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="new-user-password" style={labelStyle}>Temporary password (at least 8 characters)</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new-user-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password}
                  maxLength={72}
                  onChange={updateNewUser('password')}
                  className="input-field"
                  style={{ width: '100%', paddingRight: '40px' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-secondary" onClick={closeWindows} disabled={isSaving}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSaving} style={{ opacity: isSaving ? 0.6 : 1 }}>
                <UserPlus size={14} /> {isSaving ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manage User window */}
      {managedUser && (
        <div style={overlayStyle} onMouseDown={(event) => { if (event.target === event.currentTarget) closeWindows(); }}>
          <div role="dialog" aria-modal="true" aria-label="Manage user" style={dialogStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--neon-green)', fontWeight: '600', textTransform: 'uppercase' }}>Manage User</span>
              <button type="button" onClick={closeWindows} aria-label="Close" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', overflowWrap: 'anywhere' }}>{managedUser.name || 'Unnamed user'}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{managedUser.email || 'No email on file'}</p>
            </div>

            {formError && (
              <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 59, 48, 0.12)', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: '600' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            {isOwnAccount && (
              <p style={{ fontSize: '12px', color: 'var(--warning-amber)', fontWeight: '600' }}>
                This is your own account. You cannot change your own role or delete yourself, so the company always keeps an admin.
              </p>
            )}

            <div>
              <label htmlFor="manage-user-role" style={labelStyle}>Role</label>
              <select
                id="manage-user-role"
                value={managedRole}
                onChange={(e) => { setFormError(''); setManagedRole(e.target.value); }}
                disabled={isOwnAccount || isSaving}
                className="input-field"
                style={{ width: '100%' }}
              >
                {ROLES.map(role => <option key={role.key} value={role.key}>{role.label}</option>)}
                {!ROLES.some(role => role.key === managedRole) && <option value={managedRole}>{managedRole || 'Unknown'}</option>}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-secondary" onClick={closeWindows} disabled={isSaving}>Close</button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveRole}
                disabled={isSaving || isOwnAccount || !managedRoleChanged}
                style={{ opacity: isSaving || isOwnAccount || !managedRoleChanged ? 0.5 : 1 }}
              >
                <CheckCircle size={14} /> Save Role
              </button>
            </div>

            {!isOwnAccount && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', flex: '1 1 200px' }}>
                  {confirmDelete ? 'This cannot be undone. Delete this account?' : 'Remove this account and its access to SyncDesk.'}
                </p>
                {confirmDelete ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setConfirmDelete(false)} disabled={isSaving} style={{ fontSize: '12px', padding: '6px 12px' }}>Keep</button>
                    <button
                      type="button"
                      onClick={handleDeleteUser}
                      disabled={isSaving}
                      style={{ backgroundColor: 'var(--danger-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={13} /> Yes, Delete
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={isSaving}
                    style={{ backgroundColor: 'rgba(255, 59, 48, 0.12)', color: 'var(--danger-red)', border: '1px solid var(--danger-red)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={13} /> Delete Account
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
