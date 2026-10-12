import React, { useState } from 'react';
import { employees } from '../../data/mockData';
import { Search, Filter, Mail, MapPin, Clock, GitFork, UserCheck, X, Briefcase, Activity, UserPlus } from 'lucide-react';

const PeopleTalent = ({ onOpenAssignModal, departmentFilter = 'All' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(departmentFilter);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const departments = ['All', 'Executive', 'Engineering', 'Product', 'Finance', 'Sales'];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      
      {/* Top Filter & Search Bar */}
      <div className="card-panel glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search SyncDesk global directory by name, role, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Department Pills Filter */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              style={{
                backgroundColor: selectedDept === dept ? 'var(--primary-accent)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedDept === dept ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredEmployees.map((emp) => (
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
                    src={emp.avatar} 
                    alt={emp.name} 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{emp.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.title}</p>
                  </div>
                </div>
                <span className={`status-pill status-${emp.status}`}>
                  {emp.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="var(--primary-accent)" />
                  <span>{emp.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} color="var(--neon-green)" />
                  <span>{emp.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} color="var(--warning-amber)" />
                  <span>Local Time: {emp.timeZone}</span>
                </div>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              fontSize: '11px',
              color: 'var(--text-dim)'
            }}>
              <span>Dept: {emp.department}</span>
              <span style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>View Profile & Assign Work &rarr;</span>
            </div>
          </div>
        ))}
      </div>

      {/* Rich Profile Drawer Overlay */}
      {selectedEmployee && (
        <div style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0, left: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          justify: 'flex-end'
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
                Employee Intelligence Profile
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
                src={selectedEmployee.avatar} 
                alt="" 
                style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--primary-accent)', objectFit: 'cover' }} 
              />
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>{selectedEmployee.name}</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedEmployee.title}</p>
                <div style={{ marginTop: '6px' }}>
                  <span className={`status-pill status-${selectedEmployee.status}`}>
                    {selectedEmployee.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action: Assign Work to this Employee */}
            <button
              onClick={() => {
                const emp = selectedEmployee;
                setSelectedEmployee(null);
                onOpenAssignModal(emp);
              }}
              className="btn-primary"
              style={{ padding: '10px 16px', width: '100%', justifyContent: 'center', fontSize: '13px' }}
            >
              <UserPlus size={16} />
              <span>Delegate / Assign Work to {selectedEmployee.name}</span>
            </button>

            {/* Reporting Chain & Structure */}
            <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitFork size={16} color="var(--primary-accent)" />
                Reporting Chain & Org Tree
              </h4>
              <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Reports To: </span>
                  <span style={{ color: '#fff', fontWeight: '600' }}>{selectedEmployee.reportingTo}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Direct Reports: </span>
                  <span style={{ color: '#fff' }}>
                    {selectedEmployee.directReports.length > 0 ? selectedEmployee.directReports.join(', ') : 'Individual Contributor'}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Allocations */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} color="var(--neon-green)" />
                Active Allocations
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedEmployee.projects.map((proj, idx) => (
                  <span key={idx} style={{
                    backgroundColor: 'rgba(0, 230, 118, 0.1)',
                    color: 'var(--neon-green)',
                    border: '1px solid rgba(0, 230, 118, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {proj}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Activity Stream */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="var(--warning-amber)" />
                Recent System Activity
              </h4>
              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
                {selectedEmployee.recentActivity}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PeopleTalent;
