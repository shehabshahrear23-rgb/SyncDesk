import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Star, Search, Download, Briefcase, Eye, X, RefreshCw, AlertCircle, Upload, CheckCircle, Share2, Users } from 'lucide-react';
import MetadataBadge from '../MetadataBadge';
import { getToken } from '../../utils/auth';

const DOCUMENTS_ENDPOINT = '/api/documents';
const ALL_TAB = 'All';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Upload form rules
const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'doc', 'docx'];
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_TAGS = 8;
const EMPTY_FORM = { file: null, title: '', category: '', tags: '' };
const EMPTY_SHARE = { document: null, users: [], selectedIds: [] };
const DOCUMENT_REFRESH_INTERVAL_MS = 30_000;

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

// 2516582 -> "2.4 MB"
const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// "Onboarding, Q3 Project, onboarding" -> ["Onboarding", "Q3 Project"]
const parseTags = (text) => {
  const tags = [];
  String(text ?? '').split(',').forEach((part) => {
    const tag = part.trim().slice(0, 40);
    if (tag && !tags.some(existing => existing.toLowerCase() === tag.toLowerCase())) tags.push(tag);
  });
  return tags;
};

// "2026-10-01" -> "Oct 01, 2026". Any other text (e.g. "Aug 02, 2026") is shown as it is.
const formatDate = (value) => {
  const text = cleanText(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return text;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${match[3]}, ${match[1]}` : text;
};

// One shape for the UI, whichever source a document came from:
//   API       -> linked_context (list), upload_date, file_size
//   mockData  -> linkedProject (one name), modified, size
// It returns a new object, so the raw documents are never changed.
const normalizeDocument = (doc, index) => {
  const rawContext = Array.isArray(doc?.linked_context)
    ? doc.linked_context
    : (doc?.linkedProject ? [doc.linkedProject] : []);
  const linkedContext = [...new Set(rawContext.map(cleanText).filter(Boolean))];

  return {
    id: doc?.id ?? `document-${index}`,
    title: cleanText(doc?.title) || 'Untitled document',
    category: cleanText(doc?.category),
    linkedContext,
    uploadDate: formatDate(doc?.upload_date ?? doc?.modified),
    fileSize: cleanText(doc?.file_size ?? doc?.size),
    author: cleanText(doc?.author),
    starred: Boolean(doc?.starred),
    ownerId: doc?.owner_id ?? null,
    isSample: Boolean(doc?.is_sample),
    hasFile: Boolean(doc?.has_file)
  };
};

const DocumentManagement = ({ currentUser }) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'starred'
  const [previewDoc, setPreviewDoc] = useState(null);
  const [activeTab, setActiveTab] = useState(ALL_TAB);

  // Raw documents exactly as received. Never modified after loading.
  const [documents, setDocuments] = useState([]);
  const [loadState, setLoadState] = useState(() => getToken() ? 'loading' : 'offline'); // 'loading' | 'ready' | 'offline'
  const [loadError, setLoadError] = useState(() => getToken() ? '' : 'Sign in with a backend account to view and upload documents.');

  // Upload Document form
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'warning', text }
  const [shareState, setShareState] = useState(EMPTY_SHARE);
  const [shareError, setShareError] = useState('');
  const [isLoadingShare, setIsLoadingShare] = useState(false);
  const [isSavingShare, setIsSavingShare] = useState(false);
  const [isDownloading, setIsDownloading] = useState(null);
  const [togglingStarIds, setTogglingStarIds] = useState(() => new Set());

  // Load all documents once. Tabs and search then filter in the browser, with no more requests.
  useEffect(() => {
    const controller = new AbortController();

    const loadDocuments = async () => {
      const token = getToken();
      if (!token) return undefined;
      try {
        const response = await fetch(DOCUMENTS_ENDPOINT, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.detail || `Server responded with ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Unexpected response');
        setDocuments(data);
        setLoadState('ready');
      } catch (err) {
        if (err.name === 'AbortError') return; // component closed while loading
        setDocuments([]);
        setLoadError(err instanceof Error ? err.message : 'Could not load documents.');
        setLoadState('offline');
      }
    };

    loadDocuments();
    const intervalId = window.setInterval(loadDocuments, DOCUMENT_REFRESH_INTERVAL_MS);
    window.addEventListener('focus', loadDocuments);
    return () => {
      controller.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', loadDocuments);
    };
  }, []);

  const normalizedDocs = useMemo(
    () => (Array.isArray(documents) ? documents : []).map(normalizeDocument),
    [documents]
  );

  const toggleStar = async (doc) => {
    const token = getToken();
    if (!token) {
      setNotice({ type: 'warning', text: 'Sign in with a backend account to star documents.' });
      return;
    }
    if (togglingStarIds.has(doc.id)) return;

    setTogglingStarIds((current) => new Set(current).add(doc.id));
    try {
      const response = await fetch(`${DOCUMENTS_ENDPOINT}/${doc.id}/star`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.detail === 'string' ? data.detail : 'Could not update this star.');
      }

      setDocuments((current) => current.map((document) => (
        document.id === data.id ? { ...document, starred: data.starred } : document
      )));
      setPreviewDoc((current) => (
        current?.id === data.id ? { ...current, starred: data.starred } : current
      ));
    } catch (error) {
      setNotice({ type: 'warning', text: error instanceof Error ? error.message : 'Could not update this star.' });
    } finally {
      setTogglingStarIds((current) => {
        const next = new Set(current);
        next.delete(doc.id);
        return next;
      });
    }
  };

  // "All" + every distinct category found in the data (no duplicates, A-Z)
  const categoryTabs = useMemo(() => {
    const byKey = new Map();
    normalizedDocs.forEach((doc) => {
      const key = doc.category.toLowerCase();
      if (key && !byKey.has(key)) byKey.set(key, doc.category);
    });
    const categories = [...byKey.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return [ALL_TAB, ...categories];
  }, [normalizedDocs]);

  // Raw documents -> category tab -> starred toggle -> search
  const filteredDocs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const tabKey = activeTab.toLowerCase();

    return normalizedDocs.filter((doc) => {
      const matchesTab = activeTab === ALL_TAB || doc.category.toLowerCase() === tabKey;
      const matchesFilter = filterMode === 'starred' ? doc.starred : true;
      const matchesSearch = !query ||
                            doc.title.toLowerCase().includes(query) ||
                            doc.category.toLowerCase().includes(query) ||
                            doc.author.toLowerCase().includes(query) ||
                            doc.linkedContext.some(context => context.toLowerCase().includes(query));
      return matchesTab && matchesFilter && matchesSearch;
    });
  }, [normalizedDocs, activeTab, search, filterMode]);

  const openUpload = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setNotice(null);
    setIsUploadOpen(true);
  };

  // Typing in a field also clears the last error message
  const updateField = (field) => (event) => {
    const { value } = event.target;
    setFormError('');
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const closeUpload = () => {
    if (isSaving) return;
    setIsUploadOpen(false);
  };

  // Escape closes the upload form
  useEffect(() => {
    if (!isUploadOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) setIsUploadOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isUploadOpen, isSaving]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormError('');
    if (!file) {
      setForm(prev => ({ ...prev, file: null }));
      return;
    }
    const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      event.target.value = '';
      setForm(prev => ({ ...prev, file: null }));
      setFormError('Please choose a PDF, TXT, DOC or DOCX file.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      event.target.value = '';
      setForm(prev => ({ ...prev, file: null }));
      setFormError('That file is larger than 25 MB.');
      return;
    }
    // The file name becomes the title (it can still be edited)
    setForm(prev => ({ ...prev, file, title: file.name }));
  };

  // Put a newly saved document at the top and reset the filters so it is visible
  const showNewDocument = (newDocument, message) => {
    setDocuments(prev => [
      newDocument,
      ...(Array.isArray(prev) ? prev.filter((document) => !document?.is_sample) : [])
    ]);
    setActiveTab(ALL_TAB);
    setSearch('');
    setFilterMode('all');
    setIsUploadOpen(false);
    setNotice(message);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    const title = form.title.trim();
    const category = form.category.trim();
    const tags = parseTags(form.tags);

    if (!form.file) { setFormError('Please choose a file.'); return; }
    if (!title) { setFormError('Please enter a title.'); return; }
    if (!category) { setFormError('Please enter a category.'); return; }
    if (tags.length > MAX_TAGS) { setFormError(`Please use at most ${MAX_TAGS} tags.`); return; }

    const token = getToken();
    if (!token) {
      setFormError('Sign in with a backend account to upload documents.');
      return;
    }
    const payload = new FormData();
    payload.append('file', form.file);
    payload.append('title', title);
    payload.append('category', category);
    payload.append('linked_context', tags.join(', '));

    setFormError('');
    setIsSaving(true);
    try {
      const response = await fetch(DOCUMENTS_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload
      });
      const data = await response.json().catch(() => null);

      if (response.ok && data && data.id !== undefined) {
        showNewDocument(data, { type: 'success', text: `"${data.title}" was uploaded. Only you can see it until you grant access.` });
      } else if (typeof data?.detail === 'string') {
        setFormError(data.detail);
      } else if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
        setFormError(String(data.detail[0].msg).replace(/^Value error, /, ''));
      } else {
        setFormError('The document could not be saved. Please check the form and try again.');
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not reach the document server. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const openShare = async (document) => {
    const token = getToken();
    if (!token) {
      setShareError('Sign in with a backend account to manage document access.');
      return;
    }
    setShareState({ document, users: [], selectedIds: [] });
    setShareError('');
    setIsLoadingShare(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [usersResponse, accessResponse] = await Promise.all([
        fetch(`${DOCUMENTS_ENDPOINT}/users`, { headers }),
        fetch(`${DOCUMENTS_ENDPOINT}/${document.id}/access`, { headers })
      ]);
      const usersData = await usersResponse.json().catch(() => null);
      const accessData = await accessResponse.json().catch(() => null);
      if (!usersResponse.ok || !accessResponse.ok) {
        const detail = usersData?.detail || accessData?.detail;
        throw new Error(typeof detail === 'string' ? detail : 'Could not load document access settings.');
      }
      setShareState({
        document,
        users: Array.isArray(usersData) ? usersData : [],
        selectedIds: Array.isArray(accessData) ? accessData.map((user) => user.id) : []
      });
    } catch (error) {
      setShareError(error instanceof Error ? error.message : 'Could not load document access settings.');
    } finally {
      setIsLoadingShare(false);
    }
  };

  const saveShare = async (event) => {
    event.preventDefault();
    if (!shareState.document || isSavingShare) return;
    const token = getToken();
    if (!token) {
      setShareError('Sign in with a backend account to manage document access.');
      return;
    }
    setIsSavingShare(true);
    setShareError('');
    try {
      const response = await fetch(`${DOCUMENTS_ENDPOINT}/${shareState.document.id}/access`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_ids: shareState.selectedIds })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.detail === 'string' ? data.detail : 'Could not save document access.');
      }
      setShareState(EMPTY_SHARE);
      setNotice({ type: 'success', text: `Access saved for "${shareState.document.title}". Newly granted users will receive a notification.` });
    } catch (error) {
      setShareError(error instanceof Error ? error.message : 'Could not save document access.');
    } finally {
      setIsSavingShare(false);
    }
  };

  const downloadDocument = async (doc) => {
    const token = getToken();
    if (!token) {
      setNotice({ type: 'warning', text: 'Sign in with a backend account to download documents.' });
      return;
    }
    setIsDownloading(doc.id);
    try {
      const response = await fetch(`${DOCUMENTS_ENDPOINT}/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(typeof data?.detail === 'string' ? data.detail : 'Could not download this document.');
      }
      const url = URL.createObjectURL(await response.blob());
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.title;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setNotice({ type: 'warning', text: error instanceof Error ? error.message : 'Could not download this document.' });
    } finally {
      setIsDownloading(null);
    }
  };

  const formTags = parseTags(form.tags);
  const knownCategories = categoryTabs.filter(tab => tab !== ALL_TAB);
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' };

  const emptyMessage = (() => {
    if (normalizedDocs.length === 0) return 'No documents available.';
    if (search.trim()) return 'No documents match your search.';
    if (filterMode === 'starred') {
      return activeTab === ALL_TAB ? 'No starred documents.' : `No starred documents found in ${activeTab}.`;
    }
    return `No documents found in ${activeTab}.`;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Category Tabs (built from the categories in the document data) */}
      <div role="tablist" aria-label="Document categories" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {categoryTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            style={{
              backgroundColor: activeTab === tab ? 'var(--primary-accent)' : 'var(--bg-card)',
              color: activeTab === tab ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search & Filter Header */}
      <div className="card-panel glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Filter document repository by title, tag, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => setFilterMode('all')}
            style={{
              backgroundColor: filterMode === 'all' ? 'var(--primary-accent)' : 'transparent',
              color: filterMode === 'all' ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            All Enterprise Files
          </button>
          <button
            onClick={() => setFilterMode('starred')}
            style={{
              backgroundColor: filterMode === 'starred' ? 'var(--warning-amber)' : 'transparent',
              color: filterMode === 'starred' ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Star size={14} fill={filterMode === 'starred' ? '#fff' : 'none'} />
            <span>Starred</span>
          </button>
          <button
            type="button"
            onClick={openUpload}
            disabled={!getToken()}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '6px 14px', opacity: getToken() ? 1 : 0.5 }}
          >
            <Upload size={14} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Result of the last upload */}
      {notice && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: notice.type === 'success' ? 'var(--neon-green)' : 'var(--warning-amber)' }}>
          {notice.type === 'success' ? <CheckCircle size={14} style={{ flexShrink: 0 }} /> : <AlertCircle size={14} style={{ flexShrink: 0 }} />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Notice when the backend could not be reached */}
      {loadState === 'offline' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--warning-amber)' }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{loadError || 'Could not load documents from the server.'}</span>
        </div>
      )}

      {/* Loading */}
      {loadState === 'loading' && (
        <div className="card-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <RefreshCw size={16} color="var(--neon-cyan)" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading documents...</span>
        </div>
      )}

      {/* Empty State */}
      {loadState !== 'loading' && filteredDocs.length === 0 && (
        <div className="card-panel" style={{ textAlign: 'center', padding: '40px 16px' }}>
          <FileText size={28} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{emptyMessage}</h3>
        </div>
      )}

      {/* Document Cards Grid */}
      {loadState !== 'loading' && filteredDocs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '16px' }}>
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="card-panel card-panel-hover"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', minWidth: 0 }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{
                    backgroundColor: 'rgba(0, 122, 255, 0.12)',
                    color: 'var(--primary-accent)',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText size={22} />
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleStar(doc)}
                    disabled={togglingStarIds.has(doc.id)}
                    aria-label={doc.starred ? `Remove ${doc.title} from starred documents` : `Add ${doc.title} to starred documents`}
                    aria-pressed={doc.starred}
                    title={doc.starred ? 'Remove from starred documents' : 'Add to starred documents'}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', border: 'none', background: 'transparent', cursor: togglingStarIds.has(doc.id) ? 'wait' : 'pointer' }}
                  >
                    <Star size={18} color={doc.starred ? 'var(--warning-amber)' : 'var(--text-dim)'} fill={doc.starred ? 'var(--warning-amber)' : 'none'} />
                  </button>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.4', marginBottom: '8px', overflowWrap: 'anywhere' }}>
                  {doc.title}
                </h3>

                {/* Category Badge */}
                {doc.category && (
                  <div style={{ marginBottom: '10px' }}>
                    <MetadataBadge label={doc.category} type="category" />
                  </div>
                )}

                {/* Linked Context Badges (one badge per value) */}
                {doc.linkedContext.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '11px', color: 'var(--neon-green)', marginBottom: '12px' }}>
                    <Briefcase size={12} style={{ flexShrink: 0 }} />
                    <span>Linked Context:</span>
                    {doc.linkedContext.map((context) => (
                      <MetadataBadge key={context} label={context} type="linked-context" />
                    ))}
                  </div>
                )}

                {doc.author && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Author: <span style={{ color: 'var(--text-main)' }}>{doc.author}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: 'var(--text-dim)'
              }}>
                <span>{[doc.fileSize, doc.uploadDate].filter(Boolean).join(' • ')}</span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {doc.hasFile && (
                    <button
                      type="button"
                      onClick={() => downloadDocument(doc)}
                      className="btn-secondary"
                      disabled={isDownloading === doc.id}
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      aria-label={`Download ${doc.title}`}
                    >
                      <Download size={12} /> {isDownloading === doc.id ? 'Downloading...' : 'Download'}
                    </button>
                  )}
                  {doc.ownerId !== null && doc.ownerId === Number(currentUser?.id) && (
                    <button
                      type="button"
                      onClick={() => openShare(doc)}
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      aria-label={`Manage access to ${doc.title}`}
                    >
                      <Share2 size={12} /> Access
                    </button>
                  )}
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    <Eye size={12} /> Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            width: '600px',
            backgroundColor: '#1a1d24',
            border: '1px solid var(--border-color-highlight)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--neon-green)', fontWeight: '600', textTransform: 'uppercase' }}>
                Enterprise Document Reader
              </span>
              <button onClick={() => setPreviewDoc(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{previewDoc.title}</h3>

            <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '20px', fontSize: '13px', color: 'var(--text-muted)', minHeight: '180px' }}>
              <p style={{ color: 'var(--text-main)', fontWeight: '600', marginBottom: '8px' }}>Executive Summary & Metadata</p>
              <p>{previewDoc.hasFile ? 'This file is stored privately and is available only to its uploader and users granted access.' : 'This is a sample document entry; no downloadable file is attached.'} Context: <strong>{previewDoc.linkedContext.join(', ') || 'General'}</strong>.</p>
              <p style={{ marginTop: '12px' }}>Author: {previewDoc.author || 'Unknown'} | Last Modified: {previewDoc.uploadDate || 'Unknown'}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => setPreviewDoc(null)}>Close</button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => toggleStar(previewDoc)}
                disabled={togglingStarIds.has(previewDoc.id)}
                aria-pressed={previewDoc.starred}
              >
                <Star size={14} fill={previewDoc.starred ? 'currentColor' : 'none'} />
                {previewDoc.starred ? 'Unstar' : 'Star'}
              </button>
              {previewDoc.hasFile && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => downloadDocument(previewDoc)}
                  disabled={isDownloading === previewDoc.id}
                >
                  <Download size={14} /> {isDownloading === previewDoc.id ? 'Downloading...' : 'Download'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {shareState.document && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSavingShare && !isLoadingShare) {
              setShareState(EMPTY_SHARE);
              setShareError('');
            }
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-label="Manage document access"
            onSubmit={saveShare}
            style={{ width: '480px', maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color-highlight)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Manage document access</h2>
                <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{shareState.document.title}</p>
              </div>
              <button
                type="button"
                onClick={() => { setShareState(EMPTY_SHARE); setShareError(''); }}
                disabled={isSavingShare || isLoadingShare}
                aria-label="Close access settings"
                style={{ display: 'flex', padding: '4px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Only you and the users selected here can view or download this document. Newly granted users receive an in-app notification.
            </p>

            {shareError && (
              <p role="alert" style={{ padding: '9px 11px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 59, 48, 0.12)', color: 'var(--danger-red)', fontSize: '12px' }}>
                {shareError}
              </p>
            )}

            {isLoadingShare ? (
              <p role="status" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <RefreshCw size={14} /> Loading users...
              </p>
            ) : shareState.users.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No other user accounts are available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '42vh', overflowY: 'auto' }}>
                {shareState.users.map((user) => {
                  const checked = shareState.selectedIds.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: isSavingShare ? 'wait' : 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isSavingShare}
                        onChange={() => setShareState((current) => ({
                          ...current,
                          selectedIds: checked
                            ? current.selectedIds.filter((id) => id !== user.id)
                            : [...current.selectedIds, user.id]
                        }))}
                      />
                      <Users size={14} color="var(--primary-accent)" />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>{user.name}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{user.email}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setShareState(EMPTY_SHARE); setShareError(''); }}
                disabled={isSavingShare || isLoadingShare}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSavingShare || isLoadingShare}>
                <Share2 size={13} /> {isSavingShare ? 'Saving...' : 'Save access'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeUpload(); }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100
          }}
        >
          <form
            onSubmit={handleUpload}
            role="dialog"
            aria-modal="true"
            aria-label="Upload document"
            style={{
              width: '520px',
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
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--neon-green)', fontWeight: '600', textTransform: 'uppercase' }}>
                Upload Document
              </span>
              <button type="button" onClick={closeUpload} aria-label="Close" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
              <label htmlFor="upload-file" style={labelStyle}>File (PDF, TXT, DOC or DOCX)</label>
              <input
                id="upload-file"
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileChange}
                className="input-field"
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
                {form.file
                  ? `${form.file.name} • ${formatFileSize(form.file.size)}`
                  : 'The document will be stored privately and only you can see it until you grant access.'}
              </p>
            </div>

            <div>
              <label htmlFor="upload-title" style={labelStyle}>Title</label>
              <input
                id="upload-title"
                type="text"
                value={form.title}
                maxLength={200}
                onChange={updateField('title')}
                placeholder="Document title"
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label htmlFor="upload-category" style={labelStyle}>Category</label>
              <input
                id="upload-category"
                type="text"
                list="upload-category-options"
                value={form.category}
                maxLength={60}
                onChange={updateField('category')}
                placeholder="Choose one or type a new category"
                className="input-field"
                style={{ width: '100%' }}
              />
              <datalist id="upload-category-options">
                {knownCategories.map(category => <option key={category} value={category} />)}
              </datalist>
            </div>

            <div>
              <label htmlFor="upload-tags" style={labelStyle}>Linked Context tags (separate with commas)</label>
              <input
                id="upload-tags"
                type="text"
                value={form.tags}
                onChange={updateField('tags')}
                placeholder="Onboarding, Q3 Project"
                className="input-field"
                style={{ width: '100%' }}
              />
              {formTags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {formTags.map(tag => <MetadataBadge key={tag} label={tag} type="linked-context" />)}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-secondary" onClick={closeUpload} disabled={isSaving}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSaving} style={{ opacity: isSaving ? 0.6 : 1 }}>
                <Upload size={14} /> {isSaving ? 'Saving...' : 'Add Document'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default DocumentManagement;
