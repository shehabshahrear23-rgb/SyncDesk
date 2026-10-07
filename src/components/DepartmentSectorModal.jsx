import React from 'react';
import { 
  X, 
  Activity, 
  Users, 
  Kanban, 
  TrendingUp, 
  UserPlus, 
  MessageSquare, 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  Cpu, 
  Zap, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { employees, kanbanTasks } from '../data/mockData';

const DepartmentSectorModal = ({ isOpen, onClose, node, onNavigateModule, onSelectDepartment, onOpenAssignModal }) => {
  if (!isOpen || !node) return null;

  // Department / Sector specific metadata based on clicked node
  const getSectorDetails = (nodeId) => {
    switch (nodeId) {
      case 'node-hq':
        return {
          title: 'Executive Command HQ',
          department: 'Executive',
          moduleTarget: 'dashboard',
          leadName: 'Elena Rostova',
          leadTitle: 'Chief Technology Officer & Executive Lead',
          leadAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          stats: [
            { label: 'System Health', value: '98/100', color: 'var(--neon-green)' },
            { label: 'Executive Directives', value: '14 Active', color: '#fff' },
            { label: 'Company ARR Target', value: '$18.5M', color: 'var(--neon-cyan)' },
            { label: 'Security Clearance', value: 'Level 5', color: 'var(--warning-amber)' }
          ],
          description: 'Central executive command hub overseeing company-wide OKRs, strategic capital allocation, and AI risk radar.'
        };
      case 'node-eng':
        return {
          title: 'Engineering & Cloud Operations',
          department: 'Engineering',
          moduleTarget: 'projects',
          leadName: 'Marcus Vance',
          leadTitle: 'VP of Engineering',
          leadAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
          stats: [
            { label: 'Node Telemetry Latency', value: '14ms', color: 'var(--neon-cyan)' },
            { label: 'Bandwidth Load', value: '92%', color: 'var(--danger-red)' },
            { label: 'Active Sprints', value: '8 Sprints', color: '#fff' },
            { label: 'System Uptime', value: '99.99%', color: 'var(--neon-green)' }
          ],
          description: 'Core engineering infrastructure driving low-latency WebSocket data streaming, digital twin canvas rendering, and microservice meshes.'
        };
      case 'node-product':
        return {
          title: 'Product & UX Design Studio',
          department: 'Product',
          moduleTarget: 'projects',
          leadName: 'Sophia Lin',
          leadTitle: 'Head of Product Design',
          leadAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
          stats: [
            { label: 'Design Tokens', value: 'v2.4 Dark', color: 'var(--primary-accent)' },
            { label: 'Active User Specs', value: '12 Specs', color: '#fff' },
            { label: 'UX Satisfaction', value: '96%', color: 'var(--neon-green)' },
            { label: 'Prototype Cycle', value: '2.5 Days', color: 'var(--neon-cyan)' }
          ],
          description: 'High-density enterprise dark design system, micro-animation engineering, and user experience research.'
        };
      case 'node-sales':
        return {
          title: 'Global Sales & Revenue Growth',
          department: 'Sales',
          moduleTarget: 'people',
          leadName: 'David Kim',
          leadTitle: 'VP of Finance & Sales Strategy',
          leadAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
          stats: [
            { label: 'EMEA Growth', value: '+22%', color: 'var(--neon-green)' },
            { label: 'Pipeline Value', value: '$24.8M', color: 'var(--neon-cyan)' },
            { label: 'Quota Attainment', value: '104%', color: '#fff' },
            { label: 'Enterprise Accounts', value: '142 Clients', color: 'var(--primary-accent)' }
          ],
          description: 'Enterprise commercial operations, global demo conversions, and customer success management across EMEA & APAC.'
        };
      case 'node-fin':
        return {
          title: 'Finance & Risk Analytics',
          department: 'Finance',
          moduleTarget: 'finance',
          leadName: 'David Kim',
          leadTitle: 'VP of Finance & Strategy',
          leadAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
          stats: [
            { label: 'Net Profit Margin', value: '34.2%', color: 'var(--neon-green)' },
            { label: 'Cash Runway', value: '28 Months', color: 'var(--neon-cyan)' },
            { label: 'Monthly OpEx', value: '$1.12M', color: '#fff' },
            { label: 'Risk Coverage', value: '98%', color: 'var(--warning-amber)' }
          ],
          description: 'Predictive Monte Carlo revenue trajectory modeling, cash flow liquidity management, and macroeconomic risk hedging.'
        };
      case 'node-ai':
        return {
          title: 'AI Intelligence Subsystem Engine',
          department: 'Engineering',
          moduleTarget: 'dashboard',
          leadName: 'Priya Sharma',
          leadTitle: 'Lead AI Researcher',
          leadAvatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
          stats: [
            { label: 'Classifier Precision', value: '99.2%', color: 'var(--neon-green)' },
            { label: 'Inference Speed', value: '8ms', color: 'var(--neon-cyan)' },
            { label: 'Active Neural Models', value: '14 Models', color: '#fff' },
            { label: 'GPU Cluster Load', value: '78%', color: 'var(--warning-amber)' }
          ],
          description: 'Real-time neural anomaly detection, predictive risk scoring, and enterprise workflow automated recommendations.'
        };
      case 'node-sec':
        return {
          title: 'Security, Compliance & SOC2 Mesh',
          department: 'Engineering',
          moduleTarget: 'documents',
          leadName: 'Marcus Vance',
          leadTitle: 'VP of Engineering & Security',
          leadAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
          stats: [
            { label: 'SOC2 Attestation', value: 'Verified', color: 'var(--neon-green)' },
            { label: 'Zero Trust Mesh', value: 'Enforced', color: 'var(--neon-cyan)' },
            { label: 'Open Vulnerabilities', value: '0 Critical', color: '#fff' },
            { label: 'Audit Readiness', value: '100%', color: 'var(--primary-accent)' }
          ],
          description: 'Zero-trust network security, automated SOC2 Type II compliance auditing, and identity access control.'
        };
      default:
        return {
          title: node.label || 'Regional Operations Hub',
          department: 'All',
          moduleTarget: 'people',
          leadName: 'Elena Rostova',
          leadTitle: 'Executive Director',
          leadAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          stats: [
            { label: 'Node Health', value: `${node.health}%`, color: 'var(--neon-green)' },
            { label: 'Regional Team', value: '48 Staff', color: '#fff' },
            { label: 'Local Latency', value: '18ms', color: 'var(--neon-cyan)' }
          ],
          description: 'Regional corporate operations node handling local compliance, client onboarding, and regional staff management.'
        };
    }
  };

  const sector = getSectorDetails(node.id);
  const sectorEmployees = employees.filter(e => sector.department === 'All' || e.department === sector.department);
  const sectorTasks = kanbanTasks.filter(t => sector.department === 'All' || t.project.toLowerCase().includes(sector.department.toLowerCase()));

  const handleOpenDepartmentView = () => {
    onSelectDepartment(sector.department);
    onNavigateModule(sector.moduleTarget);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '680px',
        backgroundColor: '#161922',
        border: '1px solid var(--border-color-highlight)',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.8)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #007aff 0%, #00f0ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              boxShadow: '0 0 20px rgba(0, 122, 255, 0.4)'
            }}>
              <Activity size={24} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{sector.title}</h2>
                <span className="status-pill status-online" style={{ fontSize: '11px' }}>
                  {node.health}% Health
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                SyncDesk Sector Intelligence & Telemetry Breakdown
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Sector Description */}
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '20px' }}>
          {sector.description}
        </p>

        {/* KPI Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {sector.stats.map((st, idx) => (
            <div key={idx} style={{
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{st.label}</p>
              <p style={{ fontSize: '16px', fontWeight: '800', color: st.color }}>{st.value}</p>
            </div>
          ))}
        </div>

        {/* Sector Lead Profile Banner */}
        <div style={{
          backgroundColor: 'rgba(0, 122, 255, 0.08)',
          border: '1px solid rgba(0, 122, 255, 0.25)',
          borderRadius: 'var(--radius)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={sector.leadAvatar} alt={sector.leadName} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-accent)' }} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Sector Lead: {sector.leadName}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sector.leadTitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenAssignModal({ name: sector.leadName, title: sector.leadTitle, department: sector.department, avatar: sector.leadAvatar });
            }}
            className="btn-primary"
            style={{ fontSize: '11px', padding: '6px 12px' }}
          >
            <UserPlus size={14} />
            <span>Delegate Work</span>
          </button>
        </div>

        {/* Sector Team Directory */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--neon-green)" />
            <span>Sector Team Members ({sectorEmployees.length})</span>
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {sectorEmployees.slice(0, 4).map(emp => (
              <div key={emp.id} style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={emp.avatar} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{emp.name}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{emp.title}</p>
                  </div>
                </div>
                <span className={`status-pill status-${emp.status}`} style={{ fontSize: '9px' }}>
                  {emp.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Direct Action Buttons Footer */}
        <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '18px', flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenDepartmentView}
            className="btn-primary"
            style={{ flex: 1, padding: '10px', fontSize: '13px', justifyContent: 'center' }}
          >
            <span>Open Full {sector.title} Module</span>
            <ArrowRight size={16} />
          </button>
          
          <button
            onClick={() => {
              onClose();
              onNavigateModule('communication');
            }}
            className="btn-secondary"
            style={{ padding: '10px 16px', fontSize: '13px' }}
          >
            <MessageSquare size={16} color="var(--primary-accent)" />
            <span>Chat Team</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default DepartmentSectorModal;
