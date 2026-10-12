import React, { useState } from 'react';
import { resourceAllocation } from '../../data/mockData';
import { 
  Kanban, 
  BarChart3, 
  Plus, 
  CheckCircle2, 
  Users,
  UserPlus,
  ArrowRight,
  Filter
} from 'lucide-react';

const ProjectsOperations = ({ tasks, onUpdateTaskStatus, onOpenAssignModal, departmentFilter = 'All' }) => {
  const [activeView, setActiveView] = useState('kanban'); // 'kanban' | 'resource'
  const [filterProject, setFilterProject] = useState('All');

  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'var(--text-muted)' },
    { id: 'inProgress', title: 'In Progress', color: 'var(--primary-accent)' },
    { id: 'review', title: 'In Review', color: 'var(--warning-amber)' },
    { id: 'done', title: 'Done / Completed', color: 'var(--neon-green)' },
  ];

  const projectsList = ['All', 'Digital Twin Engine', 'Communication Suite', 'Security Mesh', 'Predictive Analytics', 'Design System'];

  const filteredTasks = tasks.filter(task => {
    if (filterProject !== 'All' && task.project !== filterProject) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header & View Mode Selector */}
      <div className="card-panel glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Kanban size={20} color="var(--primary-accent)" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Projects, Operations & Work Allocation</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SyncDesk Operational Command Center</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Project Filter Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="input-field"
              style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}
            >
              {projectsList.map(p => (
                <option key={p} value={p}>Project: {p}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveView('kanban')}
              style={{
                backgroundColor: activeView === 'kanban' ? 'var(--primary-accent)' : 'transparent',
                color: activeView === 'kanban' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setActiveView('resource')}
              style={{
                backgroundColor: activeView === 'resource' ? 'var(--primary-accent)' : 'transparent',
                color: activeView === 'resource' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Resource Allocation
            </button>
          </div>

          {/* Work Assignment Modal Trigger */}
          <button 
            onClick={onOpenAssignModal}
            className="btn-primary" 
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            <UserPlus size={14} />
            <span>+ Assign Work to Employee</span>
          </button>
        </div>
      </div>

      {activeView === 'kanban' ? (
        /* Kanban Board View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', minHeight: '520px' }}>
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} style={{
                backgroundColor: 'rgba(22, 25, 32, 0.65)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>{col.title}</span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'var(--text-muted)',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Task List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {colTasks.map(task => (
                    <div 
                      key={task.id}
                      className="card-panel card-panel-hover"
                      style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '11px', color: 'var(--primary-accent)', fontWeight: '700', textTransform: 'uppercase' }}>
                          {task.project}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          backgroundColor: task.priority === 'Critical' ? 'rgba(255,59,48,0.18)' : 'rgba(255,255,255,0.08)',
                          color: task.priority === 'Critical' ? 'var(--danger-red)' : 'var(--text-muted)'
                        }}>
                          {task.priority}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.4' }}>
                        {task.title}
                      </h4>

                      {/* Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${task.progress}%`, height: '100%', backgroundColor: col.color, transition: 'width 0.3s' }} />
                        </div>
                      </div>

                      {/* Assignee & Action */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={task.assigneeAvatar} alt={task.assignee} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{task.assignee}</span>
                        </div>

                        {task.status !== 'done' && (
                          <button
                            onClick={() => onUpdateTaskStatus(task.id)}
                            title="Advance Task Status"
                            style={{
                              background: 'rgba(0, 122, 255, 0.15)',
                              border: '1px solid rgba(0, 122, 255, 0.3)',
                              color: 'var(--primary-accent)',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}
                          >
                            <span>Advance</span>
                            <ArrowRight size={10} />
                          </button>
                        )}
                      </div>

                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div style={{
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: 'var(--text-dim)',
                      fontSize: '12px',
                      border: '1px dashed var(--border-color)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      No tasks in {col.title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Resource Allocation View */
        <div className="card-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={20} color="var(--neon-green)" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>SyncDesk Departmental Capacity Heatmap</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time team bandwidth allocation and burnout prevention tracking</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {resourceAllocation.map((res, idx) => (
              <div key={idx} style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={16} color="var(--primary-accent)" />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{res.department}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bandwidth: {res.allocated}%</span>
                    <span className="status-pill" style={{
                      backgroundColor: res.allocated > 90 ? 'rgba(255, 59, 48, 0.15)' : 'rgba(0, 230, 118, 0.15)',
                      color: res.allocated > 90 ? 'var(--danger-red)' : 'var(--neon-green)'
                    }}>
                      {res.status}
                    </span>
                  </div>
                </div>

                {/* Heatmap Bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${res.allocated}%`,
                    height: '100%',
                    background: res.allocated > 90 
                      ? 'linear-gradient(90deg, #007aff 0%, #ff3b30 100%)' 
                      : 'linear-gradient(90deg, #007aff 0%, #00e676 100%)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectsOperations;
