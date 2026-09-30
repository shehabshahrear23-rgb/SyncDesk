import React from 'react';
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
  Compass
} from 'lucide-react';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  companyHealthScore, 
  currentUser,
  onLogout,
  theme,
  onToggleTheme,
  onOpenAssignModal 
}) => {

  const getRoleNavItems = (userRole) => {
    switch (userRole) {
      case 'ceo':
        return [
          { id: 'dashboard', label: 'Executive Command Center', icon: LayoutDashboard, badge: null },
          { id: 'people', label: 'People & Directory', icon: Users, badge: '873' },
          { id: 'projects', label: 'Projects & Operations', icon: Kanban, badge: '24' },
          { id: 'finance', label: 'Finance & Risk Modeling', icon: TrendingUp, badge: 'AI' },
          { id: 'communication', label: 'Communication Suite', icon: MessageSquare, badge: '8' },
          { id: 'documents', label: 'Document Library', icon: FileText, badge: null },
        ];

      case 'hr':
        return [
          { id: 'dashboard', label: 'HR Command & Talent', icon: Heart, badge: 'Active' },
          { id: 'people', label: 'Employee & HR Directory', icon: Users, badge: '873' },
          { id: 'projects', label: 'Hiring Requisitions', icon: Kanban, badge: '14' },
          { id: 'communication', label: 'Employee Relations', icon: MessageSquare, badge: '5' },
          { id: 'documents', label: 'HR Policies & Docs', icon: FileText, badge: null },
        ];

      case 'finance':
        return [
          { id: 'dashboard', label: 'Financial Analytics Radar', icon: DollarSign, badge: 'CFO' },
          { id: 'finance', label: 'Revenue & Expense Modeling', icon: TrendingUp, badge: '+18%' },
          { id: 'projects', label: 'Department Budgets', icon: Kanban, badge: '8' },
          { id: 'communication', label: 'Financial Comms', icon: MessageSquare, badge: '2' },
          { id: 'documents', label: 'Audit Vault & Reports', icon: FileText, badge: null },
        ];

      case 'product':
        return [
          { id: 'dashboard', label: 'Product Roadmap & Specs', icon: Compass, badge: 'v4.0' },
          { id: 'projects', label: 'Sprint Kanban & Backlog', icon: Kanban, badge: '24' },
          { id: 'people', label: 'UX & Engineering Teams', icon: Users, badge: null },
          { id: 'communication', label: 'Product Sync & Calls', icon: MessageSquare, badge: '4' },
          { id: 'documents', label: 'PRDs & Feature Specs', icon: FileText, badge: null },
        ];

      case 'engineering':
      default:
        return [
          { id: 'dashboard', label: 'My Sprint Workstation', icon: Briefcase, badge: 'Active' },
          { id: 'projects', label: 'My Assigned Tasks', icon: Kanban, badge: 'Kanban' },
          { id: 'communication', label: 'Team Chat & Video Calls', icon: MessageSquare, badge: '3' },
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
          <img 
            src={displayUser.avatar} 
            alt={displayUser.name}
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--primary-accent)' }}
          />
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayUser.name}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--primary-accent)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayUser.title}
            </p>
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
                {item.badge && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    backgroundColor: isActive ? 'var(--primary-accent)' : 'var(--bg-input)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Executive Task Delegation Button */}
        {userRole === 'ceo' && (
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
  );
};

export default Sidebar;
