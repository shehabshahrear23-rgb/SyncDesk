import React, { useEffect, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle, UserPlus, X } from 'lucide-react';
import { getToken } from '../utils/auth';

const toLocalDateTimeValue = (deadline) => {
  const localDate = [
    deadline.getFullYear(),
    String(deadline.getMonth() + 1).padStart(2, '0'),
    String(deadline.getDate()).padStart(2, '0')
  ].join('-');
  const localTime = [
    String(deadline.getHours()).padStart(2, '0'),
    String(deadline.getMinutes()).padStart(2, '0')
  ].join(':');
  return `${localDate}T${localTime}`;
};

const getDefaultDeadline = () => {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  deadline.setHours(17, 0, 0, 0);
  return toLocalDateTimeValue(deadline);
};

const WorkAssignmentModal = ({
  isOpen,
  onClose,
  onAssignTask,
  initialAssignee = null,
  initialTitle = '',
  category = null
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [assigneeId, setAssigneeId] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [assigneeError, setAssigneeError] = useState('');
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dueDate, setDueDate] = useState(getDefaultDeadline);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    setTitle(initialTitle);
    setDueDate(getDefaultDeadline());
    const controller = new AbortController();
    const loadAssignees = async () => {
      const token = getToken();
      if (!token) {
        setAssignees([]);
        setAssigneeError('Sign in with a backend account to assign tasks.');
        return;
      }

      setIsLoadingAssignees(true);
      setAssigneeError('');
      try {
        const response = await fetch('/api/tasks/assignees', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(typeof data?.detail === 'string' ? data.detail : 'Could not load eligible assignees.');
        }
        if (!Array.isArray(data)) throw new Error('Unexpected assignee response.');
        setAssignees(data);
        const requestedId = Number(initialAssignee?.id);
        const initialUser = data.find((user) => user.id === requestedId)
          || data.find((user) => user.name.toLowerCase() === String(initialAssignee?.name ?? '').trim().toLowerCase());
        setAssigneeId(String(initialUser?.id ?? data[0]?.id ?? ''));
      } catch (error) {
        if (error.name === 'AbortError') return;
        setAssignees([]);
        setAssigneeError(error instanceof Error ? error.message : 'Could not load eligible assignees.');
      } finally {
        if (!controller.signal.aborted) setIsLoadingAssignees(false);
      }
    };

    loadAssignees();
    return () => controller.abort();
  }, [isOpen, initialAssignee, initialTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const assignee = assignees.find((user) => String(user.id) === assigneeId);
    if (!title.trim() || !assignee || !dueDate) return;
    const deadline = new Date(dueDate);
    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      setAssigneeError('Choose a future date and time for the deadline.');
      return;
    }

    setIsSaving(true);
    setAssigneeError('');
    try {
      const result = await onAssignTask({
        title: title.trim(),
        category: category || 'sprint',
        assignee_id: assignee.id,
        due_date: deadline.toISOString()
      });
      if (result?.notificationError) {
        setAssigneeError(result.notificationError);
        return;
      }
      if (!result?.task) throw new Error('The task was not saved. Please try again.');
      setToastMessage(`Task assigned to ${assignee.name} and added to their backlog.`);
      window.setTimeout(() => {
        setToastMessage(null);
        onClose();
      }, 1200);
    } catch (error) {
      setAssigneeError(error instanceof Error ? error.message : 'The task could not be assigned.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAssignee = assignees.find((user) => String(user.id) === assigneeId);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
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
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserPlus size={20} color="var(--primary-accent)" />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Assign Task</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Set the work, assignee, and deadline.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} aria-label="Close assignment form" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {toastMessage && (
          <div role="status" style={{ backgroundColor: 'rgba(0, 230, 118, 0.15)', border: '1px solid var(--neon-green)', color: 'var(--neon-green)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600' }}>
            <CheckCircle size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        {assigneeError && (
          <div role="alert" style={{ backgroundColor: 'rgba(255, 59, 48, 0.12)', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <AlertCircle size={15} />
            <span>{assigneeError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="task-title" style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Task title *
            </label>
            <input id="task-title" type="text" maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} required className="input-field" style={{ width: '100%' }} />
          </div>

          <div>
            <label htmlFor="task-assignee" style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Assign to *
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select id="task-assignee" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} disabled={isLoadingAssignees || assignees.length === 0 || isSaving} required className="input-field" style={{ flex: 1, backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}>
                {assignees.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} — {user.role.replaceAll('_', ' ')}</option>
                ))}
              </select>
              {selectedAssignee && (
                <img src={selectedAssignee.avatar_url} alt={selectedAssignee.name} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
              )}
            </div>
            {isLoadingAssignees && <p role="status" style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>Loading eligible users...</p>}
          </div>

          <div>
            <label htmlFor="task-deadline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <Calendar size={14} /> Deadline *
            </label>
            <input
              id="task-deadline"
              type="datetime-local"
              min={toLocalDateTimeValue(new Date())}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
              className="input-field"
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>Choose your local date and time. The exact deadline is saved as a UTC timestamp.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} disabled={isSaving} style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '10px 18px', borderRadius: 'var(--radius-sm)', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving || isLoadingAssignees || assignees.length === 0} style={{ padding: '10px 22px', fontSize: '13px', opacity: isSaving || isLoadingAssignees || assignees.length === 0 ? 0.6 : 1 }}>
              <UserPlus size={16} />
              <span>{isSaving ? 'Assigning...' : 'Assign Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkAssignmentModal;
