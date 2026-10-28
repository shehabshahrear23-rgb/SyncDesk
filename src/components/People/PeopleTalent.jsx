import React, { useEffect, useMemo, useState } from 'react';
import StatusIndicator from '../StatusIndicator';
import LocalTimeDisplay from '../LocalTimeDisplay';
import { AlertCircle, Clock, Mail, RefreshCw, Search, X } from 'lucide-react';
import { getToken } from '../../utils/auth';

const ROLE_ORDER = ['ceo', 'admin', 'hr', 'team_lead', 'project_manager', 'employee'];
const DIRECTORY_REFRESH_INTERVAL_MS = 30_000;

const parseLastActive = (value) => {
  if (!value) return null;
  const timestampText = String(value);
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(timestampText);
  const timestamp = new Date(hasTimezone ? timestampText : `${timestampText}Z`);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
};

const formatLastActive = (value) => {
  if (!value) return 'No activity recorded';
  const timestamp = parseLastActive(value);
  if (!timestamp) return 'Activity time unavailable';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).format(timestamp);
};

const lastActiveTitle = formatLastActive;

const roleLabel = (role) => ({
  ceo: 'CEO',
  admin: 'Admin',
  hr: 'HR',
  team_lead: 'Team Lead',
  project_manager: 'Project Manager',
  employee: 'Employee'
}[role] || String(role || 'Unknown').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()));

const PeopleTalent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const loadDirectory = async () => {
      const token = getToken();
      if (!token) {
        setLoadError('Sign in with a backend account to view the employee directory.');
        setLoadState('error');
        return;
      }

      try {
        const response = await fetch('/api/users/directory', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(typeof error?.detail === 'string' ? error.detail : `Server responded with ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Unexpected directory response.');
        setUsers(data);
        setLoadError('');
        setLoadState('ready');
      } catch (error) {
        if (error.name === 'AbortError') return;
        setLoadError(error instanceof Error ? error.message : 'Could not load the employee directory.');
        setLoadState('error');
      }
    };

    loadDirectory();
    const intervalId = window.setInterval(loadDirectory, DIRECTORY_REFRESH_INTERVAL_MS);
    window.addEventListener('focus', loadDirectory);
    return () => {
      controller.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', loadDirectory);
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = user.name.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      return matchesSearch && (selectedRole === 'All' || user.role === selectedRole);
    });
  }, [users, searchQuery, selectedRole]);

  const availableRoles = useMemo(() => {
    const userRoles = new Set(users.map((user) => user.role));
    return [
      ...ROLE_ORDER.filter((role) => userRoles.has(role)),
      ...[...userRoles].filter((role) => !ROLE_ORDER.includes(role)).sort()
    ];
  }, [users]);

  const roleGroups = useMemo(() => {
    const groups = new Map();
    filteredEmployees.forEach((user) => {
      if (!groups.has(user.role)) groups.set(user.role, []);
      groups.get(user.role).push(user);
    });
    const orderedRoles = [
      ...ROLE_ORDER.filter((role) => groups.has(role)),
      ...[...groups.keys()].filter((role) => !ROLE_ORDER.includes(role)).sort()
    ];
    return orderedRoles.map((role) => ({
      role,
      label: roleLabel(role),
      users: groups.get(role)
    }));
  }, [filteredEmployees]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      
      {/* Top Filter & Search Bar */}
      <div className="card-panel glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search directory by name, role, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Account role filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', ...availableRoles].map(role => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              style={{
                backgroundColor: selectedRole === role ? 'var(--primary-accent)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedRole === role ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {role === 'All' ? role : roleLabel(role)}
            </button>
          ))}
        </div>
      </div>

      {loadState === 'loading' && (
        <div role="status" className="card-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <RefreshCw size={16} color="var(--neon-cyan)" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading employee directory...</span>
        </div>
      )}

      {loadState === 'error' && (
        <div role="alert" className="card-panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', color: 'var(--warning-amber)', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{loadError}</span>
        </div>
      )}

      {loadState === 'ready' && filteredEmployees.length === 0 && (
        <div className="card-panel" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
          {users.length === 0 ? 'No other user accounts are in the database.' : 'No users match your search or role filter.'}
        </div>
      )}

      {/* Directory Grid View */}
      {loadState === 'ready' && filteredEmployees.length > 0 && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {roleGroups.map((group) => (
          <section key={group.role} aria-labelledby={`directory-role-${group.role}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <h2 id={`directory-role-${group.role}`} style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                {group.label}
              </h2>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)', padding: '3px 9px', borderRadius: '12px' }}>
                {group.users.length} {group.users.length === 1 ? 'user' : 'users'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {group.users.map((emp) => (
          <div 
            key={emp.id} 
            onClick={() => setSelectedEmployee(emp)}
            className="card-panel card-panel-hover"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <img 
                    src={emp.avatar_url} 
                    alt={emp.name} 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{emp.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{roleLabel(emp.role)}</p>
                  </div>
                </div>
                <StatusIndicator status={emp.status} showLabel />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="var(--primary-accent)" />
                  <span>{emp.email}</span>
                </div>
                <LocalTimeDisplay timezone={emp.timezone} />
                <span
                  title={lastActiveTitle(emp.last_active)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}
                >
                  <Clock size={13} color="var(--warning-amber)" />
                  <span>Last active (local time): {formatLastActive(emp.last_active)}</span>
                </span>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-dim)'
            }}>
              <span>Role: {roleLabel(emp.role)}</span>
              <span style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>View Profile &rarr;</span>
            </div>
          </div>
        ))}
            </div>
          </section>
        ))}
      </div>
      )}

      {/* User Profile Drawer */}
      {selectedEmployee && (
        <div style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0, left: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            width: '440px',
            height: '100%',
            backgroundColor: '#161922',
            borderLeft: '1px solid var(--border-color-highlight)',
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.6)'
          }}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                User Directory Profile
              </span>
              <button 
                onClick={() => setSelectedEmployee(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Avatar & Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src={selectedEmployee.avatar_url}
                alt={selectedEmployee.name}
                style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--primary-accent)', objectFit: 'cover' }} 
              />
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>{selectedEmployee.name}</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{roleLabel(selectedEmployee.role)}</p>
                <div style={{ marginTop: '6px' }}>
                  <StatusIndicator status={selectedEmployee.status} showLabel />
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
                Account Details
              </h4>
              <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>
                  <Mail size={14} color="var(--primary-accent)" />
                  <span>{selectedEmployee.email}</span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Role: <span style={{ color: '#fff', fontWeight: '600' }}>{roleLabel(selectedEmployee.role)}</span>
                </div>
                <LocalTimeDisplay timezone={selectedEmployee.timezone} />
                <div
                  title={lastActiveTitle(selectedEmployee.last_active)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}
                >
                  <Clock size={13} color="var(--warning-amber)" />
                  <span>Last active (local time): {formatLastActive(selectedEmployee.last_active)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PeopleTalent;
