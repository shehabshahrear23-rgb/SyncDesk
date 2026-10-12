import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  Heart, 
  PlusCircle, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  TrendingUp,
  Award,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { employees } from '../../data/mockData';

const HRDashboard = ({ onNavigateModule, onOpenAssignModal }) => {
  const [selectedDept, setSelectedDept] = useState('All');
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 'l1', name: 'Alex Chen', title: 'Principal Product Manager', dept: 'Product', type: 'Annual Paid Leave', dates: 'Oct 02 - Oct 06', status: 'pending' },
    { id: 'l2', name: 'Priya Sharma', title: 'Senior UX Researcher', dept: 'Design', type: 'Sick Leave', dates: 'Oct 01 - Oct 02', status: 'approved' },
    { id: 'l3', name: 'David Kim', title: 'Financial Analyst', dept: 'Finance', type: 'Remote Work Week', dates: 'Oct 10 - Oct 15', status: 'pending' }
  ]);

  const hiringPipeline = [
    { id: 'h1', title: 'Senior AI Systems Engineer', dept: 'Engineering', applicants: 48, interview: 6, offer: 2, status: 'Active' },
    { id: 'h2', title: 'EMEA Enterprise Sales Director', dept: 'Sales', applicants: 32, interview: 4, offer: 1, status: 'Active' },
    { id: 'h3', title: 'Lead Product Designer', dept: 'Product', applicants: 64, interview: 8, offer: 0, status: 'Reviewing' },
    { id: 'h4', title: 'Corporate Compliance Officer', dept: 'Legal & HR', applicants: 19, interview: 3, offer: 1, status: 'Offer Stage' }
  ];

  const departmentStats = [
    { name: 'Engineering & Cloud', count: 342, percentage: 39, color: 'var(--primary-accent)' },
    { name: 'Global Sales & Rev', count: 218, percentage: 25, color: 'var(--neon-green)' },
    { name: 'Product & Design', count: 145, percentage: 17, color: 'var(--neon-cyan)' },
    { name: 'Finance & Legal', count: 98, percentage: 11, color: 'var(--warning-amber)' },
    { name: 'HR & People Ops', count: 70, percentage: 8, color: '#a855f7' }
  ];

  const handleApproveLeave = (reqId) => {
    setLeaveRequests(prev => prev.map(req => req.id === reqId ? { ...req, status: 'approved' } : req));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HR Hero Overview KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        <div className="card-panel card-panel-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Headcount</span>
            <div style={{ backgroundColor: 'rgba(0, 122, 255, 0.12)', padding: '8px', borderRadius: '8px', color: 'var(--primary-accent)' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ margin: '12px 0' }}>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>873</h3>
            <p style={{ fontSize: '12px', color: 'var(--neon-green)', fontWeight: '600' }}>+12 hired this month</p>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Across 8 global offices</span>
        </div>

        <div className="card-panel card-panel-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Today's Attendance</span>
            <div style={{ backgroundColor: 'rgba(0, 230, 118, 0.12)', padding: '8px', borderRadius: '8px', color: 'var(--neon-green)' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div style={{ margin: '12px 0' }}>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>96.4%</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>842 / 873 checked in</p>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--neon-green)', fontWeight: '600' }}>Optimal Pulse</span>
        </div>

        <div className="card-panel card-panel-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Hiring Requisitions</span>
            <div style={{ backgroundColor: 'rgba(0, 240, 255, 0.12)', padding: '8px', borderRadius: '8px', color: 'var(--neon-cyan)' }}>
              <Briefcase size={18} />
            </div>
          </div>
          <div style={{ margin: '12px 0' }}>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>14</h3>
            <p style={{ fontSize: '12px', color: 'var(--neon-cyan)', fontWeight: '600' }}>163 total candidates</p>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>4 in offer stage</span>
        </div>

        <div className="card-panel card-panel-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Team Sentiment Index</span>
            <div style={{ backgroundColor: 'rgba(255, 149, 0, 0.12)', padding: '8px', borderRadius: '8px', color: 'var(--warning-amber)' }}>
              <Heart size={18} />
            </div>
          </div>
          <div style={{ margin: '12px 0' }}>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--warning-amber)', letterSpacing: '-0.5px' }}>94/100</h3>
            <p style={{ fontSize: '12px', color: 'var(--neon-green)', fontWeight: '600' }}>+3.2% vs Q2 survey</p>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>98% retention rate</span>
        </div>

      </div>

      {/* HR Action Banner & Department Headcount Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px' }}>
        
        {/* Active Hiring Pipeline & Requisitions */}
        <div className="card-panel glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Talent Acquisition & Hiring Pipeline</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active talent requisitions & candidate progress</p>
            </div>
            <button 
              onClick={() => onNavigateModule('people')}
              className="btn-primary" 
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              <PlusCircle size={14} />
              <span>View Employee Directory</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {hiringPipeline.map(item => (
              <div 
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{item.title}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Department: {item.dept}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-accent)' }}>{item.applicants} Candidates</span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.interview} interviewing • {item.offer} offer</p>
                  </div>
                  <span className="status-pill status-online" style={{ fontSize: '11px' }}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Headcount Distribution by Department */}
        <div className="card-panel glass-panel">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
            Departmental Headcount Split
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            873 total enterprise workforce distribution
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {departmentStats.map((dept, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{dept.name}</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>{dept.count} ({dept.percentage}%)</span>
                </div>
                <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${dept.percentage}%`, backgroundColor: dept.color, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Leave Approvals & Employee Directory Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Time-off & Leave Request Management */}
        <div className="card-panel glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Pending Leave & Time-off Requests</h3>
            <span style={{ fontSize: '11px', color: 'var(--warning-amber)', fontWeight: '700' }}>
              {leaveRequests.filter(r => r.status === 'pending').length} Action Required
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {leaveRequests.map(req => (
              <div 
                key={req.id}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>{req.name}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.type} • {req.dates}</p>
                </div>

                <div>
                  {req.status === 'pending' ? (
                    <button
                      onClick={() => handleApproveLeave(req.id)}
                      className="btn-primary"
                      style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: 'var(--neon-green)', color: '#101216', fontWeight: '700' }}
                    >
                      Approve Request
                    </button>
                  ) : (
                    <span className="status-pill status-online" style={{ fontSize: '11px' }}>
                      Approved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Directory Snapshot */}
        <div className="card-panel glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Key Team Leadership</h3>
            <button 
              onClick={() => onNavigateModule('people')}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary-accent)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              Full Directory &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {employees.slice(0, 3).map(emp => (
              <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={emp.avatar} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>{emp.name}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.title} • {emp.department}</p>
                  </div>
                </div>
                <span className={`status-pill status-${emp.status}`} style={{ fontSize: '10px' }}>
                  {emp.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default HRDashboard;
