import React, { useState } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  MessageSquare, 
  FileText, 
  Play, 
  PlusCircle, 
  User, 
  Activity,
  ArrowUpRight,
  Send,
  Zap
} from 'lucide-react';
import { employees, kanbanTasks, documentLibrary } from '../data/mockData';

const EmployeeDashboard = ({ tasks, onUpdateTaskStatus, onOpenAssignModal, onNavigateModule }) => {
  const [currentUserStatus, setCurrentUserStatus] = useState('online');
  const [statusNote, setStatusNote] = useState('Optimizing Digital Twin graph render speeds');
  const [selectedTask, setSelectedTask] = useState(null);
  const [workLogInput, setWorkLogInput] = useState('');
  const [workLogs, setWorkLogs] = useState([
    { id: 1, text: "Completed WebSocket ping optimization benchmark (14ms latency)", time: "10:30 AM" },
    { id: 2, text: "Reviewed SOC2 compliance document bundle with legal team", time: " Yesterday" }
  ]);

  // Current logged in employee (Marcus Vance as staff view example)
  const currentEmployee = employees[1]; // Marcus Vance - VP of Engineering / Staff member

  // Filter tasks assigned to this employee or general staff assigned tasks
  const myAssignedTasks = tasks.filter(t => t.assignee === currentEmployee.name || t.assignee === "Marcus Vance" || t.assignee === "Alex Chen");

  const handleAddWorkLog = (e) => {
    e.preventDefault();
    if (!workLogInput.trim()) return;
    setWorkLogs([
      { id: Date.now(), text: workLogInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ...workLogs
    ]);
    setWorkLogInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Staff Banner */}
      <div className="card-panel glass-panel" style={{
        background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.12) 0%, rgba(16, 18, 22, 0.95) 100%)',
        border: '1px solid rgba(0, 122, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src={currentEmployee.avatar} 
            alt={currentEmployee.name} 
            style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--primary-accent)', objectFit: 'cover' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
                Welcome back, {currentEmployee.name}
              </h2>
              <span className="status-pill status-online" style={{ fontSize: '11px' }}>
                Staff Workspace
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {currentEmployee.title} • {currentEmployee.department} Department
            </p>
          </div>
        </div>

        {/* Real-time Employee Status Check-in Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(0,0,0,0.4)', padding: '10px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>MY AVAILABILITY STATUS</span>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {['online', 'in-meeting', 'away'].map(st => (
                <button
                  key={st}
                  onClick={() => setCurrentUserStatus(st)}
                  style={{
                    backgroundColor: currentUserStatus === st ? 'var(--primary-accent)' : 'rgba(255,255,255,0.06)',
                    color: currentUserStatus === st ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: My Assigned Tasks vs Work Log & Quick Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Left Column: My Assigned Work & Tasks */}
        <div className="card-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Briefcase size={20} color="var(--primary-accent)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>My Assigned Work & Sprint Tasks</h3>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: 'rgba(0, 122, 255, 0.15)',
              color: 'var(--primary-accent)',
              padding: '4px 12px',
              borderRadius: '12px'
            }}>
              {myAssignedTasks.length} Active Assignments
            </span>
          </div>

          {/* Task Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myAssignedTasks.map(task => (
              <div 
                key={task.id}
                className="card-panel card-panel-hover"
                style={{
                  backgroundColor: 'rgba(22, 25, 32, 0.8)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderLeft: `4px solid ${task.status === 'done' ? 'var(--neon-green)' : 'var(--primary-accent)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--primary-accent)', fontWeight: '700', textTransform: 'uppercase' }}>
                      {task.project}
                    </span>
                    <span className={`status-pill status-${task.status === 'done' ? 'online' : 'in-meeting'}`}>
                      {task.status}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--warning-amber)', fontWeight: '600' }}>
                    Due: {task.dueDate}
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                    {task.title}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {task.description || 'Assigned project milestone.'}
                  </p>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Completion Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${task.progress}%`, height: '100%', backgroundColor: 'var(--primary-accent)', transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* Update Status Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {task.tags.map((tag, idx) => (
                      <span key={idx} style={{ fontSize: '10px', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {task.status !== 'done' && (
                    <button
                      onClick={() => onUpdateTaskStatus(task.id)}
                      className="btn-primary"
                      style={{ padding: '4px 12px', fontSize: '11px' }}
                    >
                      <CheckCircle2 size={12} />
                      <span>Advance Status</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Work Log & Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Daily Work Log Feed */}
          <div className="card-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--neon-green)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>My Daily Progress Log</h3>
            </div>

            <form onSubmit={handleAddWorkLog} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text"
                placeholder="Log your completed work or update..."
                value={workLogInput}
                onChange={(e) => setWorkLogInput(e.target.value)}
                className="input-field"
                style={{ flex: 1, fontSize: '12px' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '8px 12px' }}>
                <Send size={14} />
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {workLogs.map(log => (
                <div key={log.id} style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '10px', marginBottom: '4px' }}>
                    <span>Work Activity</span>
                    <span>{log.time}</span>
                  </div>
                  <p style={{ color: '#fff' }}>{log.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Quick Tools */}
          <div className="card-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Staff Workstations</h3>
            
            <button
              onClick={() => onNavigateModule('communication')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={16} color="var(--primary-accent)" />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Team Chat & Cinematic Calls</span>
              </div>
              <ArrowUpRight size={16} color="var(--text-muted)" />
            </button>

            <button
              onClick={() => onNavigateModule('documents')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={16} color="var(--neon-green)" />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Project Document Vault</span>
              </div>
              <ArrowUpRight size={16} color="var(--text-muted)" />
            </button>

            <button
              onClick={() => onNavigateModule('people')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={16} color="var(--warning-amber)" />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Employee Directory</span>
              </div>
              <ArrowUpRight size={16} color="var(--text-muted)" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default EmployeeDashboard;
