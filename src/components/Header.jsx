import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles, Command, Clock, UserPlus, Sun, Moon, LogOut, Sliders, Zap } from 'lucide-react';

const Header = ({ 
  activeTabTitle, 
  onOpenSearch, 
  onToggleNotifications, 
  unreadCount,
  roleMode,
  currentUser,
  onLogout,
  theme,
  onToggleTheme,
  onOpenAssignModal,
  onOpenAIAssistant
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header style={{
      height: '70px',
      backgroundColor: 'var(--bg-header)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      padding: '0 24px',
      gap: '20px',
      zIndex: 10
    }}>
      {/* Active Module Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
          {activeTabTitle}
        </h2>
      </div>

      {/* Expanded Futuristic Advanced Search Bar (Takes Central Space) */}
      <div 
        onClick={onOpenSearch}
        style={{
          flex: 1,
          maxWidth: '520px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          background: 'linear-gradient(90deg, var(--bg-input) 0%, var(--bg-card) 100%)',
          border: '1px solid var(--border-color-highlight)',
          borderRadius: '20px',
          padding: '0 16px',
          cursor: 'pointer',
          boxShadow: '0 0 15px rgba(0, 122, 255, 0.12)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="futuristic-search-bar"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} color="var(--primary-accent)" />
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '6px',
              height: '6px',
              backgroundColor: 'var(--neon-cyan)',
              borderRadius: '50%',
              boxShadow: '0 0 6px var(--neon-cyan)'
            }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>
            Search modules, employees, financial metrics & sprint tasks...
          </span>
        </div>

        {/* Futuristic Shortcut Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: '700',
            backgroundColor: 'rgba(0, 240, 255, 0.12)',
            color: 'var(--neon-cyan)',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid rgba(0, 240, 255, 0.3)'
          }}>
            AI SEARCH
          </span>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '3px 8px',
            color: 'var(--text-main)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: '600'
          }}>
            <Command size={11} />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Navbar Controls Cluster (Includes Logout Button) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        
        {/* OpenAI Assistant Trigger Button */}
        <button
          onClick={onOpenAIAssistant}
          style={{
            backgroundColor: 'rgba(0, 240, 255, 0.12)',
            border: '1px solid var(--neon-cyan)',
            color: 'var(--neon-cyan)',
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 12px rgba(0, 240, 255, 0.25)',
            transition: 'var(--transition)'
          }}
        >
          <Sparkles size={15} />
          <span>OpenAI Assistant</span>
        </button>

        {/* Assign Task Button for Executive View */}
        {roleMode === 'ceo' && (
          <button
            onClick={() => onOpenAssignModal(null)}
            className="btn-primary"
            style={{ padding: '7px 14px', fontSize: '12px' }}
          >
            <UserPlus size={14} />
            <span>Assign Task</span>
          </button>
        )}

        {/* Theme Switcher Button */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} color="var(--warning-amber)" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={15} color="var(--primary-accent)" />
              <span>Dark</span>
            </>
          )}
        </button>

        {/* Real-time Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          backgroundColor: 'var(--bg-card)',
          padding: '7px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <Clock size={13} color="var(--primary-accent)" />
          <span>{time.toLocaleTimeString()}</span>
        </div>

        {/* Notifications Icon */}
        <button 
          onClick={onToggleNotifications}
          style={{
            position: 'relative',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--primary-accent)',
              borderRadius: '50%',
              boxShadow: '0 0 6px var(--primary-accent)'
            }} />
          )}
        </button>

        {/* Log Out Button in Right Navbar */}
        <button
          onClick={onLogout}
          title="Sign out of workspace"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 59, 48, 0.12)',
            border: '1px solid var(--danger-red)',
            color: 'var(--danger-red)',
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          <LogOut size={15} />
          <span>Log Out</span>
        </button>

      </div>
    </header>
  );
};

export default Header;
