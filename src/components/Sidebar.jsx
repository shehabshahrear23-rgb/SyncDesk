import React, { useEffect, useRef, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  TrendingUp, 
  MessageSquare, 
  FileText, 
  ShieldCheck, 
  Activity,
  LogOut,
  UserPlus,
  Briefcase,
  Sun,
  Moon,
  Heart,
  DollarSign,
  Compass,
  Camera,
  Pencil,
  X
} from 'lucide-react';
import { getToken } from '../utils/auth';
import { canAssignTasks } from '../utils/taskAccess';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  companyHealthScore, 
  currentUser,
  tasks = [],
  onProfileDetailsChange,
  onLogout,
  theme,
  onToggleTheme,
  onOpenAssignModal 
}) => {
  const profilePhotoInput = useRef(null);
  const [photoUploadMessage, setPhotoUploadMessage] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ name: '', timezone: 'UTC' });
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const openProfileEditor = () => {
    setProfileDraft({
      name: currentUser?.name || '',
      timezone: currentUser?.timezone || 'UTC'
    });
    setProfileError('');
    setProfileMessage('');
    setPhotoUploadMessage('');
    setPasswordDraft({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordMessage('');
    setIsProfileOpen(true);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const token = getToken();
    if (!token) {
      setProfileError('Sign in with a backend account to save profile changes.');
      return;
    }

    const name = profileDraft.name.trim();
    if (!name) {
      setProfileError('Please enter your name.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError('');
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, timezone: profileDraft.timezone.trim() || 'UTC' })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = typeof result?.detail === 'string'
          ? result.detail
          : Array.isArray(result?.detail) && result.detail[0]?.msg
            ? String(result.detail[0].msg).replace(/^Value error, /, '')
            : 'Could not update your profile.';
        throw new Error(detail);
      }

      onProfileDetailsChange(result);
      setProfileMessage('Profile updated.');
      setIsProfileOpen(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not update your profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!isProfileOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isSavingProfile && !isUploadingPhoto && !isChangingPassword) {
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isProfileOpen, isSavingProfile, isUploadingPhoto, isChangingPassword]);

  const handleProfilePhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoUploadMessage('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoUploadMessage('Profile pictures must be 5 MB or smaller.');
      return;
    }

    const token = getToken();
    if (!token) {
      setPhotoUploadMessage('Sign in with a backend account to save a profile picture.');
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoUploadMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.detail || 'Could not save your profile picture.');
      }
      if (!result?.avatar_url) {
        throw new Error('The server did not return the saved profile picture.');
      }

      onProfileDetailsChange(result);
      setPhotoUploadMessage('Profile picture updated.');
    } catch (error) {
      setPhotoUploadMessage(error instanceof Error ? error.message : 'Could not save your profile picture.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    const token = getToken();
    if (!token) {
      setPasswordError('Sign in with a backend account to change your password.');
      return;
    }
    if (!passwordDraft.currentPassword) {
      setPasswordError('Enter your current password.');
      return;
    }
    if (passwordDraft.newPassword.length < 8) {
      setPasswordError('Your new password must be at least 8 characters.');
      return;
    }
    if (passwordDraft.newPassword !== passwordDraft.confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordMessage('');
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordDraft.currentPassword,
          new_password: passwordDraft.newPassword,
          confirm_new_password: passwordDraft.confirmPassword
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = typeof result?.detail === 'string'
          ? result.detail
          : Array.isArray(result?.detail) && result.detail[0]?.msg
            ? String(result.detail[0].msg).replace(/^Value error, /, '')
            : 'Could not change your password.';
        throw new Error(detail);
      }

      setPasswordDraft({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage('Password changed. A confirmation notification was sent to your dashboard.');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Could not change your password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleNavItems = (userRole) => {
    switch (userRole) {
      case 'ceo':
        return [
          { id: 'dashboard', label: 'Executive Command Center', icon: LayoutDashboard, badge: null },
          { id: 'people', label: 'People & Directory', icon: Users, badge: null },
          { id: 'projects', label: 'Projects & Operations', icon: Kanban, badgeKey: 'activeTasks' },
          { id: 'finance', label: 'Finance & Risk Modeling', icon: TrendingUp, badge: null },
          { id: 'communication', label: 'Communication Suite', icon: MessageSquare, badge: null },
          { id: 'documents', label: 'Document Library', icon: FileText, badge: null },
        ];

      case 'hr':
        return [
          { id: 'dashboard', label: 'HR Command & Talent', icon: Heart, badge: null },
          { id: 'people', label: 'Employee & HR Directory', icon: Users, badge: null },
          { id: 'projects', label: 'Hiring Requisitions', icon: Kanban, badge: null },
          { id: 'communication', label: 'Employee Relations', icon: MessageSquare, badge: null },
          { id: 'documents', label: 'HR Policies & Docs', icon: FileText, badge: null },
        ];

      case 'team_lead':
      case 'project_manager':
        return [
          { id: 'dashboard', label: 'My Assigned Work', icon: Briefcase, badge: null },
          { id: 'projects', label: 'Team Projects & Tasks', icon: Kanban, badgeKey: 'myTasks' },
          { id: 'people', label: 'Employee Directory', icon: Users, badge: null },
          { id: 'communication', label: 'Team Chat & Video Calls', icon: MessageSquare, badge: null },
          { id: 'documents', label: 'Project Documents', icon: FileText, badge: null },
        ];

      case 'finance':
        return [
          { id: 'dashboard', label: 'Financial Analytics Radar', icon: DollarSign, badge: null },
          { id: 'finance', label: 'Revenue & Expense Modeling', icon: TrendingUp, badge: null },
          { id: 'projects', label: 'Department Budgets', icon: Kanban, badge: null },
          { id: 'communication', label: 'Financial Comms', icon: MessageSquare, badge: null },
          { id: 'documents', label: 'Audit Vault & Reports', icon: FileText, badge: null },
        ];

      case 'product':
        return [
          { id: 'dashboard', label: 'Product Roadmap & Specs', icon: Compass, badge: null },
          { id: 'projects', label: 'Sprint Kanban & Backlog', icon: Kanban, badgeKey: 'activeTasks' },
          { id: 'people', label: 'UX & Engineering Teams', icon: Users, badge: null },
          { id: 'communication', label: 'Product Sync & Calls', icon: MessageSquare, badge: null },
          { id: 'documents', label: 'PRDs & Feature Specs', icon: FileText, badge: null },
        ];

      case 'engineering':
      default:
        return [
          { id: 'dashboard', label: 'My Sprint Workstation', icon: Briefcase, badge: null },
          { id: 'projects', label: 'My Assigned Tasks', icon: Kanban, badgeKey: 'myTasks' },
          { id: 'communication', label: 'Team Chat & Video Calls', icon: MessageSquare, badge: null },
          { id: 'people', label: 'Employee Directory', icon: Users, badge: null },
          { id: 'documents', label: 'Code Vault & RFCs', icon: FileText, badge: null },
        ];
    }
  };

  const userRole = currentUser?.role || 'ceo';
  const navItems = getRoleNavItems(userRole);

  const displayUser = currentUser || {
    name: 'Elena Rostova',
    title: 'Chief Executive Officer',
    department: 'Executive',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  };

  return (
    <>
    <aside style={{
      width: '260px',
      height: '100vh',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      justify: 'space-between',
      padding: '20px 16px',
      userSelect: 'none',
      zIndex: 20
    }}>
      <div>
        {/* Top Header Logo - SyncDesk */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #007aff 0%, #00f0ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            boxShadow: '0 0 14px rgba(0, 122, 255, 0.3)'
          }}>
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '19px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
              Sync<span style={{ color: 'var(--primary-accent)' }}>Desk</span>
            </h1>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.5px', fontWeight: '600' }}>
              Enterprise OS
            </p>
          </div>
        </div>

        {/* User Profile & Role Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          padding: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={displayUser.avatar_url || displayUser.avatar || '/media/pp/default.jpg'}
              alt={`${displayUser.name}'s profile`}
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--primary-accent)' }}
            />
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayUser.name}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--primary-accent)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayUser.title || displayUser.roleLabel || displayUser.role}
            </p>
            <button
              type="button"
              onClick={openProfileEditor}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px', padding: 0, border: 'none', background: 'transparent', color: 'var(--primary-accent)', cursor: 'pointer', fontSize: '10px', fontWeight: '600' }}
            >
              <Pencil size={10} /> Edit profile
            </button>
            {profileMessage && (
              <p role="status" style={{ fontSize: '10px', color: 'var(--neon-green)', marginTop: '2px' }}>{profileMessage}</p>
            )}
            {isUploadingPhoto && <p role="status" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Uploading picture...</p>}
            {!isUploadingPhoto && photoUploadMessage && (
              <p role="status" style={{ fontSize: '10px', color: photoUploadMessage === 'Profile picture updated.' ? 'var(--neon-green)' : 'var(--warning-amber)' }}>
                {photoUploadMessage}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{
            fontSize: '11px',
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            padding: '6px 12px',
            fontWeight: '600'
          }}>
            {displayUser.department || 'Workspace'} Modules
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badgeCount = item.badgeKey
              ? tasks.filter((task) => {
                if (task.status === 'ended' || task.status === 'expired') return false;
                if (item.badgeKey === 'activeTasks') return true;
                return String(task.assignee_id ?? task.assigneeId) === String(currentUser?.id)
                  || String(task.assigned_by_id ?? task.assignedById) === String(currentUser?.id);
              }).length
              : 0;
            const badge = item.badge ?? (badgeCount > 0 ? badgeCount : null);
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'rgba(0, 122, 255, 0.14)' : 'transparent',
                  color: isActive ? 'var(--primary-accent)' : 'var(--text-main)',
                  border: isActive ? '1px solid rgba(0, 122, 255, 0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} color={isActive ? 'var(--primary-accent)' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500' }}>
                    {item.label}
                  </span>
                </div>
                {badge && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    backgroundColor: isActive ? 'var(--primary-accent)' : 'var(--bg-input)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)'
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Executive Task Delegation Button */}
        {canAssignTasks(userRole) && (
          <div style={{ marginTop: '16px', padding: '0 4px' }}>
            <button
              onClick={() => onOpenAssignModal(null)}
              className="btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
            >
              <UserPlus size={15} />
              <span>Delegate Task</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Quick Theme Switcher */}
        <button
          onClick={onToggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            color: 'var(--text-main)',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {theme === 'dark' ? <Sun size={15} color="var(--warning-amber)" /> : <Moon size={15} color="var(--primary-accent)" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
        </button>

        {/* System Health Status */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="pulse-dot pulse-dot-green" />
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)' }}>SyncDesk Network</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Score: {companyHealthScore}/100</p>
            </div>
          </div>
          <Activity size={15} color="var(--neon-green)" />
        </div>

        {/* User Sign Out Button */}
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            border: '1px solid rgba(255, 59, 48, 0.25)',
            color: 'var(--danger-red)',
            cursor: 'pointer',
            transition: 'var(--transition)',
            width: '100%'
          }}
        >
          <LogOut size={16} />
          <span style={{ fontSize: '12px', fontWeight: '700' }}>Sign Out</span>
        </button>
      </div>
    </aside>
    {isProfileOpen && (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSavingProfile) setIsProfileOpen(false);
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-editor-title"
          style={{ width: '480px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '22px', border: '1px solid var(--border-color-highlight)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 id="profile-editor-title" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Edit your profile</h2>
              <p style={{ marginTop: '3px', fontSize: '12px', color: 'var(--text-muted)' }}>Update the personal details shown to your team.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileOpen(false)}
              disabled={isSavingProfile || isUploadingPhoto || isChangingPassword}
              aria-label="Close profile editor"
              style={{ display: 'flex', padding: '4px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {profileError && (
            <p role="alert" style={{ padding: '9px 11px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 59, 48, 0.12)', color: 'var(--danger-red)', fontSize: '12px' }}>
              {profileError}
            </p>
          )}

          {!getToken() && (
            <p style={{ fontSize: '12px', color: 'var(--warning-amber)' }}>
              Sign in with a backend account to save profile changes, upload a photo, or change your password.
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)' }}>
            <img
              src={displayUser.avatar_url || displayUser.avatar || '/media/pp/default.jpg'}
              alt={`${displayUser.name}'s profile`}
              style={{ width: '58px', height: '58px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--primary-accent)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>Profile picture</span>
              <button
                type="button"
                onClick={() => profilePhotoInput.current?.click()}
                disabled={isUploadingPhoto || !getToken()}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '6px 10px' }}
              >
                <Camera size={13} /> {isUploadingPhoto ? 'Uploading...' : 'Choose image'}
              </button>
              <input
                ref={profilePhotoInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleProfilePhotoSelected}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>JPEG, PNG, or WebP; up to 5 MB.</span>
            </div>
          </div>
          {photoUploadMessage && (
            <p role="status" style={{ fontSize: '11px', color: photoUploadMessage === 'Profile picture updated.' ? 'var(--neon-green)' : 'var(--warning-amber)' }}>
              {photoUploadMessage}
            </p>
          )}

          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Personal details</h3>
            {profileMessage && (
              <p role="status" style={{ fontSize: '11px', color: 'var(--neon-green)' }}>{profileMessage}</p>
            )}
            <div>
              <label htmlFor="profile-name" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>Full name</label>
              <input
                id="profile-name"
                value={profileDraft.name}
                maxLength={80}
                onChange={(event) => setProfileDraft((draft) => ({ ...draft, name: event.target.value }))}
                className="input-field"
                autoComplete="name"
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label htmlFor="profile-timezone" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>Timezone</label>
              <input
                id="profile-timezone"
                value={profileDraft.timezone}
                onChange={(event) => setProfileDraft((draft) => ({ ...draft, timezone: event.target.value }))}
                placeholder="Asia/Dhaka or UTC"
                className="input-field"
                autoComplete="off"
                style={{ width: '100%' }}
              />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Your role and work email are managed by your administrator.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsProfileOpen(false)} disabled={isSavingProfile || isUploadingPhoto || isChangingPassword}>Close</button>
              <button type="submit" className="btn-primary" disabled={isSavingProfile || !getToken()}>
                {isSavingProfile ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Change password</h3>
              <p style={{ marginTop: '3px', fontSize: '11px', color: 'var(--text-muted)' }}>Confirm your current password and enter your new password twice.</p>
            </div>
            {passwordError && (
              <p role="alert" style={{ padding: '9px 11px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 59, 48, 0.12)', color: 'var(--danger-red)', fontSize: '12px' }}>
                {passwordError}
              </p>
            )}
            {passwordMessage && (
              <p role="status" style={{ fontSize: '11px', color: 'var(--neon-green)' }}>{passwordMessage}</p>
            )}
            <div>
              <label htmlFor="current-password" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>Current password</label>
              <input
                id="current-password"
                type="password"
                value={passwordDraft.currentPassword}
                onChange={(event) => setPasswordDraft((draft) => ({ ...draft, currentPassword: event.target.value }))}
                className="input-field"
                autoComplete="current-password"
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label htmlFor="new-password" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>New password</label>
              <input
                id="new-password"
                type="password"
                value={passwordDraft.newPassword}
                onChange={(event) => setPasswordDraft((draft) => ({ ...draft, newPassword: event.target.value }))}
                className="input-field"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label htmlFor="confirm-new-password" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>Confirm new password</label>
              <input
                id="confirm-new-password"
                type="password"
                value={passwordDraft.confirmPassword}
                onChange={(event) => setPasswordDraft((draft) => ({ ...draft, confirmPassword: event.target.value }))}
                className="input-field"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={isChangingPassword || !getToken()}>
                {isChangingPassword ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
};

export default Sidebar;
