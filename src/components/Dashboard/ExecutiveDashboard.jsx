import React from 'react';
import DigitalTwinCanvas from './DigitalTwinCanvas';
import { companyHealth, quickStats, aiInsights } from '../../data/mockData';
import { 
  TrendingUp, 
  Users, 
  CheckSquare, 
  DollarSign, 
  Sparkles, 
  ArrowUpRight,
  ShieldAlert,
  Info,
  CheckCircle2,
  UserPlus
} from 'lucide-react';

const ExecutiveDashboard = ({ onNavigateModule, onSelectNode, onOpenAssignModal }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Hero Section: Health Gauge + Quick Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
        
        {/* SyncDesk Company Health Score Box */}
        <div className="card-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>SyncDesk Health Index</span>
              <span className="status-pill status-online">Pulse: {companyHealth.pulseStatus}</span>
            </div>
            
            {/* Health Meter Radial */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '16px 0' }}>
              <div style={{
                position: 'relative',
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: `conic-gradient(var(--neon-green) ${companyHealth.score}%, rgba(255, 255, 255, 0.08) 0%)`,
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                boxShadow: '0 0 20px var(--neon-green-glow)'
              }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  flexDirection: 'column'
                }}>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1' }}>
                    {companyHealth.score}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/ 100</span>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>Optimal Operational Pulse</p>
                <p style={{ fontSize: '12px', color: 'var(--neon-green)', fontWeight: '600', marginTop: '2px' }}>
                  {companyHealth.change} improvement vs last sprint
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Health Breakdown list */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            {companyHealth.breakdown.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.name}</p>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>{item.score}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stat Grid (4 items) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {quickStats.map((stat) => {
            let Icon = Users;
            let iconColor = 'var(--primary-accent)';
            let moduleTarget = 'people';

            if (stat.id === 'projects') { Icon = TrendingUp; iconColor = 'var(--neon-cyan)'; moduleTarget = 'projects'; }
            if (stat.id === 'tasks') { Icon = CheckSquare; iconColor = 'var(--neon-green)'; moduleTarget = 'projects'; }
            if (stat.id === 'revenue') { Icon = DollarSign; iconColor = 'var(--warning-amber)'; moduleTarget = 'finance'; }

            return (
              <div 
                key={stat.id} 
                onClick={() => onNavigateModule(moduleTarget)}
                className="card-panel card-panel-hover" 
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{stat.title}</span>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '8px',
                    borderRadius: '8px',
                    color: iconColor
                  }}>
                    <Icon size={18} />
                  </div>
                </div>

                <div style={{ margin: '12px 0' }}>
                  <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{stat.value}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.subtext}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--neon-green)', fontWeight: '600' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowUpRight size={14} />
                    <span>{stat.change}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Click to view &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Middle Section: Interactive Digital Twin & Org Canvas */}
      <DigitalTwinCanvas 
        onSelectNode={onSelectNode}
        onNavigateModule={onNavigateModule} 
      />

      {/* Bottom Section: AI Insights & Executive Task Delegation Feed */}
      <div className="card-panel glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--neon-cyan)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>SyncDesk AI Risk Radar & Work Assignment Engine</h3>
          </div>
          
          <button 
            onClick={() => onOpenAssignModal(null)}
            className="btn-primary" 
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            <UserPlus size={14} />
            <span>+ Assign Work to Employee</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {aiInsights.map((insight) => {
            let severityBg = 'rgba(255, 59, 48, 0.12)';
            let severityColor = 'var(--danger-red)';
            let Icon = ShieldAlert;

            if (insight.type === 'info') {
              severityBg = 'rgba(0, 122, 255, 0.12)';
              severityColor = 'var(--primary-accent)';
              Icon = Info;
            } else if (insight.type === 'success') {
              severityBg = 'rgba(0, 230, 118, 0.12)';
              severityColor = 'var(--neon-green)';
              Icon = CheckCircle2;
            }

            return (
              <div key={insight.id} style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                  <div style={{
                    backgroundColor: severityBg,
                    color: severityColor,
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center'
                  }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{insight.title}</span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: severityBg,
                        color: severityColor,
                        fontWeight: '600'
                      }}>
                        {insight.severity} Severity
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{insight.description}</p>
                  </div>
                </div>

                <button 
                  onClick={() => onOpenAssignModal(null)}
                  className="btn-primary" 
                  style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
                >
                  <span>{insight.action}</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ExecutiveDashboard;
