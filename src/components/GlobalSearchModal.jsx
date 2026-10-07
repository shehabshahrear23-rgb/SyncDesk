import React, { useState, useEffect } from 'react';
import { Search, User, Kanban, FileText, Sparkles, X, ArrowRight } from 'lucide-react';
import { employees, kanbanTasks, documentLibrary } from '../data/mockData';

const GlobalSearchModal = ({ isOpen, onClose, onSelectModule }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(query.toLowerCase()) || 
    e.title.toLowerCase().includes(query.toLowerCase()) ||
    e.department.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTasks = kanbanTasks.filter(t => 
    t.title.toLowerCase().includes(query.toLowerCase()) || 
    t.project.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDocs = documentLibrary.filter(d => 
    d.title.toLowerCase().includes(query.toLowerCase()) ||
    d.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '100px',
      zIndex: 100
    }}>
      <div style={{
        width: '640px',
        backgroundColor: '#1a1d24',
        border: '1px solid var(--border-color-highlight)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <Search size={20} color="var(--primary-accent)" />
          <input 
            type="text"
            placeholder="Type a command, employee name, task, or file..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '15px',
              fontFamily: 'var(--font-main)',
              outline: 'none'
            }}
          />
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Body */}
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '12px'
        }}>
          {query === '' ? (
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', padding: '8px 12px', fontWeight: '600' }}>
                Quick Navigation & AI Actions
              </p>
              <div 
                onClick={() => { onSelectModule('dashboard'); onClose(); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                  <Sparkles size={16} color="var(--neon-cyan)" />
                  <span>View Company Health & AI Insights</span>
                </div>
                <ArrowRight size={14} color="var(--text-dim)" />
              </div>
              <div 
                onClick={() => { onSelectModule('people'); onClose(); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                  <User size={16} color="var(--primary-accent)" />
                  <span>Search Employee Directory</span>
                </div>
                <ArrowRight size={14} color="var(--text-dim)" />
              </div>
            </div>
          ) : (
            <>
              {/* Employee Results */}
              {filteredEmployees.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', padding: '6px 12px', fontWeight: '600' }}>
                    People & Talent ({filteredEmployees.length})
                  </p>
                  {filteredEmployees.map(emp => (
                    <div 
                      key={emp.id}
                      onClick={() => { onSelectModule('people'); onClose(); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                      className="card-panel-hover"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={emp.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{emp.name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.title} • {emp.department}</p>
                        </div>
                      </div>
                      <span className={`status-pill status-${emp.status}`}>{emp.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Task Results */}
              {filteredTasks.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', padding: '6px 12px', fontWeight: '600' }}>
                    Projects & Tasks ({filteredTasks.length})
                  </p>
                  {filteredTasks.map(t => (
                    <div 
                      key={t.id}
                      onClick={() => { onSelectModule('projects'); onClose(); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Kanban size={16} color="var(--primary-accent)" />
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{t.title}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.project} • {t.priority}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Document Results */}
              {filteredDocs.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', padding: '6px 12px', fontWeight: '600' }}>
                    Documents ({filteredDocs.length})
                  </p>
                  {filteredDocs.map(d => (
                    <div 
                      key={d.id}
                      onClick={() => { onSelectModule('documents'); onClose(); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={16} color="var(--neon-green)" />
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{d.title}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.category} • {d.size}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--text-dim)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)'
        }}>
          <span>Press ESC to exit</span>
          <span>SyncDesk Intelligence Hub</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
