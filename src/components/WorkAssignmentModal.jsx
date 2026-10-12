import React, { useState } from 'react';
import { X, UserPlus, CheckCircle, AlertCircle, Calendar, Tag, Briefcase, User } from 'lucide-react';
import { employees } from '../data/mockData';

const WorkAssignmentModal = ({ isOpen, onClose, onAssignTask, initialAssignee = null }) => {
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('Digital Twin Engine');
  const [assigneeId, setAssigneeId] = useState(initialAssignee ? initialAssignee.id : employees[0].id);
  const [priority, setPriority] = useState('High');
  const [dueDate, setDueDate] = useState('Aug 08, 2026');
  const [tags, setTags] = useState('Frontend, Core');
  const [description, setDescription] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedEmp = employees.find(e => e.id === assigneeId) || employees[0];

    const newTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      project,
      status: 'inProgress',
      priority,
      assignee: assignedEmp.name,
      assigneeAvatar: assignedEmp.avatar,
      progress: 15,
      dueDate,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      description: description || 'High priority work assignment delegated by management.'
    };

    onAssignTask(newTask);

    setToastMessage(`Work successfully assigned to ${assignedEmp.name}!`);
    setTimeout(() => {
      setToastMessage(null);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
    }, 1200);
  };

  const selectedEmployeeObj = employees.find(e => e.id === assigneeId) || employees[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-main)',
        border: '1px solid var(--border-color-highlight)',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        position: 'relative',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(0, 122, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0, 122, 255, 0.3)'
            }}>
              <UserPlus size={18} color="var(--primary-accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Assign Work / Delegate Task</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SyncDesk Executive Work Delegation Engine</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Toast Banner */}
        {toastMessage && (
          <div style={{
            backgroundColor: 'rgba(0, 230, 118, 0.15)',
            border: '1px solid var(--neon-green)',
            color: 'var(--neon-green)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <CheckCircle size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Task Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Work / Task Title *
            </label>
            <input 
              type="text" 
              placeholder="e.g., Optimize Digital Twin WebSocket Latency" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-field"
              style={{ width: '100%' }}
            />
          </div>

          {/* Assignee Selection with Avatar Preview */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Assign to Employee *
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="input-field"
                style={{ flex: 1, backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.title} ({emp.department})
                  </option>
                ))}
              </select>

              {/* Selected Assignee Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}>
                <img 
                  src={selectedEmployeeObj.avatar} 
                  alt={selectedEmployeeObj.name}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--neon-green)', fontWeight: '600' }}>
                  {selectedEmployeeObj.status}
                </span>
              </div>
            </div>
          </div>

          {/* Grid row: Project & Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Project Scope
              </label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="input-field"
                style={{ width: '100%', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}
              >
                <option value="Digital Twin Engine">Digital Twin Engine</option>
                <option value="Communication Suite">Communication Suite</option>
                <option value="AI Insights Core">AI Insights Core</option>
                <option value="Security Mesh">Security Mesh</option>
                <option value="Predictive Analytics">Predictive Analytics</option>
                <option value="Design System">Design System</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input-field"
                style={{ width: '100%', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}
              >
                <option value="Critical">🔴 Critical (Immediate)</option>
                <option value="High">🟠 High Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="Low">🟢 Low Priority</option>
              </select>
            </div>
          </div>

          {/* Grid row: Due Date & Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Target Deadline
              </label>
              <input 
                type="text" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Tags (comma separated)
              </label>
              <input 
                type="text" 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Canvas, API, Urgent"
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Brief Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Execution Guidelines / Deliverables
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, acceptance criteria, or key requirements for the assignee..."
              className="input-field"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '10px 22px', fontSize: '13px' }}
            >
              <UserPlus size={16} />
              <span>Dispatch Work Assignment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkAssignmentModal;
