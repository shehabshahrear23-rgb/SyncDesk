import React, { useState, useEffect, useMemo } from 'react';
import { documentLibrary } from '../../data/mockData';
import { FileText, Star, Search, Filter, Download, ExternalLink, Briefcase, Eye, X, RefreshCw, AlertCircle, Upload, CheckCircle } from 'lucide-react';
import MetadataBadge from '../MetadataBadge';

const DOCUMENTS_ENDPOINT = '/api/documents';
const ALL_TAB = 'All';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Upload form rules
const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'doc', 'docx'];
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_TAGS = 8;
const EMPTY_FORM = { file: null, title: '', category: '', tags: '', author: '' };

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

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
    starred: Boolean(doc?.starred)
  };
};

const DocumentManagement = () => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'starred'
  const [previewDoc, setPreviewDoc] = useState(null);
  const [activeTab, setActiveTab] = useState(ALL_TAB);

  // Raw documents exactly as received. Never modified after loading.
  const [documents, setDocuments] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'ready' | 'offline'

  // Upload Document form
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'warning', text }

  // Load all documents once. Tabs and search then filter in the browser, with no more requests.
  useEffect(() => {
    const controller = new AbortController();

    const loadDocuments = async () => {
      try {
        const response = await fetch(DOCUMENTS_ENDPOINT, { signal: controller.signal });
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Unexpected response');
        setDocuments(data);
        setLoadState('ready');
      } catch (err) {
        if (err.name === 'AbortError') return; // component closed while loading
        // Backend not reachable: keep the vault usable with the built-in sample documents
        setDocuments(documentLibrary);
        setLoadState('offline');
      }
    };

    loadDocuments();
    return () => controller.abort();
  }, []);

  const normalizedDocs = useMemo(
    () => (Array.isArray(documents) ? documents : []).map(normalizeDocument),
    [documents]
  );

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
    setDocuments(prev => [newDocument, ...(Array.isArray(prev) ? prev : [])]);
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

    const payload = {
      title,
      category,
      linked_context: tags,
      file_size: formatFileSize(form.file.size),
      author: form.author.trim() || null,
      starred: false
    };

    // Kept only in this page when the backend cannot be reached
    const saveLocally = () => showNewDocument(
      { ...payload, id: `local-${Date.now()}`, upload_date: todayISO() },
      { type: 'warning', text: `"${title}" was added, but the document server is not reachable, so it will disappear when the page is refreshed.` }
    );

    setFormError('');
    setIsSaving(true);
    try {
      const response = await fetch(DOCUMENTS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => null);

      if (response.ok && data && data.id !== undefined) {
        showNewDocument(data, { type: 'success', text: `"${data.title}" was added to the Document Vault.` });
      } else if (data?.code === 'backend_offline' || (response.status >= 500 && typeof data?.detail !== 'string')) {
        saveLocally();
      } else if (typeof data?.detail === 'string') {
        setFormError(data.detail);
      } else {
        setFormError('The document could not be saved. Please check the form and try again.');
      }
    } catch {
      saveLocally();
    } finally {
      setIsSaving(false);
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
            className="btn-primary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
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
          <span>Could not reach the document server, so the built-in sample documents are shown.</span>
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
                  <Star size={18} color={doc.starred ? 'var(--warning-amber)' : 'var(--text-dim)'} fill={doc.starred ? 'var(--warning-amber)' : 'none'} />
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
              <p>This document is cryptographically verified and integrated with the SyncDesk context layer for project <strong>{previewDoc.linkedContext.join(', ') || 'General'}</strong>.</p>
              <p style={{ marginTop: '12px' }}>Author: {previewDoc.author || 'Unknown'} | Last Modified: {previewDoc.uploadDate || 'Unknown'}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => setPreviewDoc(null)}>Close</button>
              <button className="btn-primary">
                <Download size={14} /> Download Package
              </button>
            </div>
          </div>
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
                  : 'The file name and size are recorded. The file itself is not stored yet.'}
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

            <div>
              <label htmlFor="upload-author" style={labelStyle}>Author (optional)</label>
              <input
                id="upload-author"
                type="text"
                value={form.author}
                maxLength={80}
                onChange={updateField('author')}
                placeholder="Who wrote this document?"
                className="input-field"
                style={{ width: '100%' }}
              />
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
