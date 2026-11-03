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
import { employees } from '../data/mockData';
import StatusIndicator, { normalizeStatus } from './StatusIndicator';
import LocalTimeDisplay from './LocalTimeDisplay';
import { sendStatus } from '../hooks/usePresence';

const EmployeeDashboard = ({ tasks, taskPerformance, updatingTaskIds = new Set(), onUpdateTaskStatus, onEndTask, onOpenAssignModal, onNavigateModule, currentUser }) => {
  const [currentUserStatus, setCurrentUserStatus] = useState('online');
  const [statusNote, setStatusNote] = useState('Optimizing Digital Twin graph render speeds');
  const [selectedTask, setSelectedTask] = useState(null);
  const [workLogInput, setWorkLogInput] = useState('');
  const [workLogs, setWorkLogs] = useState([
    { id: 1, text: "Completed WebSocket ping optimization benchmark (14ms latency)", time: "10:30 AM" },
    { id: 2, text: "Reviewed SOC2 compliance document bundle with legal team", time: " Yesterday" }
  ]);

  // Current logged in employee (Marcus Vance as staff view example)
  const currentEmployee = currentUser
    ? { ...employees[1], ...currentUser, avatar: currentUser.avatar_url || currentUser.avatar || employees[1].avatar }
    : employees[1]; // Marcus Vance - VP of Engineering / Staff member

  // Filter tasks assigned to this employee or general staff assigned tasks
  const myAssignedTasks = tasks.filter((task) =>
    currentUser?.id !== undefined
    && String(task.assigneeId) === String(currentUser.id)
    && !['ended', 'expired'].includes(task.status)
  );
  const activeAssignedTasks = myAssignedTasks;
  const successfulTasks = taskPerformance?.successful ?? 0;
  const expiredTasks = taskPerformance?.expired ?? 0;
  const completionRate = taskPerformance?.completion_rate ?? 0;
  const formatDeadline = (value) => {
    if (!value) return '—';
    const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
    return Number.isNaN(dateValue.getTime())
      ? value
      : dateValue.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

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
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* Glowing ring in the status colour: follows the availability switch */}
            <img 
              src={currentEmployee.avatar} 
              alt={currentEmployee.name} 
              className={`hud-avatar hud--${normalizeStatus(currentUserStatus)}`}
              style={{ width: '56px', height: '56px', display: 'block', objectFit: 'cover' }}
            />
          </div>
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
            <div className={`hud-pod hud--${normalizeStatus(currentUserStatus)}`} style={{ marginTop: '8px' }}>
              <StatusIndicator status={currentUserStatus} size={8} showLabel calm />
              <span className="hud-pod-divider" />
              <LocalTimeDisplay timezone={currentEmployee.timezone} />
            </div>
          </div>
        </div>

        {/* Real-time Employee Status Check-in Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(0,0,0,0.4)', padding: '10px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>MY AVAILABILITY STATUS</span>
            <div className="hud-switch" style={{ marginTop: '6px' }}>
              {['online', 'away', 'offline'].map(st => (
                <button
                  key={st}
                  type="button"
                  className={`hud--${st}${currentUserStatus === st ? ' is-active' : ''}`}
                  onClick={() => {
                    setCurrentUserStatus(st);
                    sendStatus(st); // saves to the backend when logged in with a JWT
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card-panel glass-panel" aria-label="Successful task completion percentage">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Successful Task Completion</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Approved tasks you ended, compared with ended and expired tasks.</p>
          </div>
          <strong style={{ fontSize: '22px', color: 'var(--neon-green)' }}>{completionRate}%</strong>
        </div>
        <div role="progressbar" aria-valuenow={completionRate} aria-valuemin={0} aria-valuemax={100} aria-label={`${completionRate}% successful task completion`} style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ width: `${completionRate}%`, height: '100%', backgroundColor: 'var(--neon-green)', transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
          {(taskPerformance?.total ?? 0) > 0
            ? `${successfulTasks} successful • ${expiredTasks} expired`
            : 'No tasks have ended yet.'}
        </p>
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
              {activeAssignedTasks.length} Active Assignments
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
                      {task.status === 'inProgress' ? 'In Progress' : task.status === 'review' ? 'In Review' : task.status}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--warning-amber)', fontWeight: '600' }}>
                    Due: {formatDeadline(task.dueDate)}
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

                  {['backlog', 'inProgress'].includes(task.status) && (
                    <button
                      onClick={() => onUpdateTaskStatus(task.id)}
                      disabled={updatingTaskIds.has(task.id)}
                      className="btn-primary"
                      style={{ padding: '4px 12px', fontSize: '11px', opacity: updatingTaskIds.has(task.id) ? 0.6 : 1 }}
                    >
                      <CheckCircle2 size={12} />
                      <span>{updatingTaskIds.has(task.id) ? 'Saving...' : 'Advance Status'}</span>
                    </button>
                  )}
                  {task.status === 'review' && (
                    <span style={{ fontSize: '11px', color: 'var(--warning-amber)' }}>Waiting for the assigner to review</span>
                  )}
                  {task.status === 'done' && (
                    <button
                      onClick={() => onEndTask(task.id)}
                      disabled={updatingTaskIds.has(task.id)}
                      className="btn-primary"
                      style={{ padding: '4px 12px', fontSize: '11px', opacity: updatingTaskIds.has(task.id) ? 0.6 : 1 }}
                    >
                      {updatingTaskIds.has(task.id) ? 'Saving...' : 'End Task'}
                    </button>
                  )}
                  {task.history?.length > 0 && (
                    <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                      <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>Task history</p>
                      {task.history.map((entry) => (
                        <p key={entry.id} style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '3px 0' }}>
                          {new Date(entry.created_at).toLocaleString()} — {entry.actor_name}: {entry.note || entry.event_type}
                        </p>
                      ))}
                    </div>
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
