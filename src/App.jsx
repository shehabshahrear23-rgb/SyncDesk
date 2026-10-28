import React, { useState, useEffect, useRef } from 'react';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GlobalSearchModal from './components/GlobalSearchModal';
import WorkAssignmentModal from './components/WorkAssignmentModal';
import NotificationsPanel from './components/NotificationsPanel';
import PasscodeAuthModal from './components/PasscodeAuthModal';
import DepartmentSectorModal from './components/DepartmentSectorModal';
import AIAssistantModal from './components/AIAssistantModal';

import ExecutiveDashboard from './components/Dashboard/ExecutiveDashboard';
import HRDashboard from './components/Dashboard/HRDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import PeopleTalent from './components/People/PeopleTalent';
import ProjectsOperations from './components/Projects/ProjectsOperations';
import FinanceAnalytics from './components/Finance/FinanceAnalytics';
import CommunicationSuite from './components/Communication/CommunicationSuite';
import DocumentManagement from './components/Documents/DocumentManagement';

import { companyHealth } from './data/mockData';
import { clearToken, getToken } from './utils/auth';
import { canAssignTasks } from './utils/taskAccess';
import usePresence, { sendStatus } from './hooks/usePresence';

const TASK_REFRESH_INTERVAL_MS = 30_000;

const normalizeTask = (task) => {
  if (!task || typeof task !== 'object' || !Number.isInteger(task.id)) {
    throw new Error('The server returned an invalid task.');
  }
  return {
    ...task,
    assignee: task.assignee_name,
    assigneeId: task.assignee_id,
    assigneeEmail: task.assignee_email,
    assigneeAvatar: task.assignee_avatar,
    assignedById: task.assigned_by_id,
    assignedByName: task.assigned_by_name,
    dueDate: task.due_date,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    tags: Array.isArray(task.tags) ? task.tags : []
  };
};

function App() {
  // Authentication & User Session State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Heartbeat + away detection (only runs while logged in with a JWT)
  usePresence(isAuthenticated);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState('dark');

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [tasks, setTasks] = useState([]);
  const [taskPerformance, setTaskPerformance] = useState(null);
  const [updatingTaskIds, setUpdatingTaskIds] = useState(() => new Set());
  const [taskError, setTaskError] = useState('');
  const taskUpdateInFlight = useRef(new Set());

  // Modals & Drawers State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigneeTarget, setAssigneeTarget] = useState(null);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  // Which board the modal was opened from ('sprint' | 'operation' | null)
  const [assignCategory, setAssignCategory] = useState(null);

  // Security Challenge State
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [targetRoleToUnlock, setTargetRoleToUnlock] = useState('ceo');

  // Sector Graph Modal State
  const [selectedSectorNode, setSelectedSectorNode] = useState(null);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);

  // AI Assistant Drawer State
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  // Synchronize theme attribute on root HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated || !getToken()) {
      return undefined;
    }

    const controller = new AbortController();
    const loadTasks = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const response = await fetch('/api/tasks', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(typeof data?.detail === 'string' ? data.detail : `Could not load tasks (${response.status}).`);
        }
        if (!Array.isArray(data)) throw new Error('Unexpected task response.');
        setTasks(data.map(normalizeTask));
        if (currentUser?.role !== 'ceo') {
          const performanceResponse = await fetch('/api/tasks/performance/me', {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          });
          const performanceData = await performanceResponse.json().catch(() => null);
          if (!performanceResponse.ok || !performanceData || typeof performanceData.completion_rate !== 'number') {
            throw new Error(typeof performanceData?.detail === 'string'
              ? performanceData.detail
              : 'Could not load task completion statistics.');
          }
          setTaskPerformance(performanceData);
        } else {
          setTaskPerformance(null);
        }
        setTaskError('');
      } catch (error) {
        if (error.name === 'AbortError') return;
        setTaskError(error instanceof Error ? error.message : 'Could not load tasks.');
      }
    };

    loadTasks();
    const intervalId = window.setInterval(loadTasks, TASK_REFRESH_INTERVAL_MS);
    window.addEventListener('focus', loadTasks);
    return () => {
      controller.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', loadTasks);
    };
  }, [isAuthenticated, currentUser?.id, currentUser?.role]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleProfileDetailsChange = (updatedUser) => {
    setCurrentUser((user) => user ? {
      ...user,
      ...updatedUser,
      avatar: updatedUser.avatar_url || user.avatar
    } : user);
  };

  const handleLogin = (userData) => {
    setTaskError('');
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    sendStatus('offline', { keepalive: true }); // must go before clearToken(), it needs the JWT
    clearToken();
    setTasks([]);
    setTaskPerformance(null);
    setTaskError('');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const moduleTitles = {
    dashboard: currentUser?.dashboardTitle || 'SyncDesk Corporate Command Dashboard',
    people: 'People, Talent & Global Org Directory',
    projects: 'Projects, Operations & Sprint Kanban',
    finance: 'Finance, Analytics & Predictive Risk Modeling',
    communication: 'Unified Communication & Cinematic Video Calls',
    documents: 'Document Vault & Knowledge Management'
  };

  const handleAuthenticateSuccess = (unlockedRole) => {
    if (currentUser) {
      setCurrentUser(prev => ({ ...prev, role: unlockedRole }));
    }
  };

  const handleSelectSectorNode = (node) => {
    setSelectedSectorNode(node);
    setIsSectorModalOpen(true);
  };

  const handleAssignTask = async (newTask) => {
    const token = getToken();
    if (!token) {
      return { notificationError: 'Sign in with a backend account to assign tasks.' };
    }
    if (!canAssignTasks(currentUser?.role)) {
      return { notificationError: 'Your account role cannot assign tasks.' };
    }

    try {
      let assigneeId = newTask.assignee_id;
      if (!assigneeId && newTask.assigneeEmail) {
        const assigneesResponse = await fetch('/api/tasks/assignees', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const assignees = await assigneesResponse.json().catch(() => null);
        if (!assigneesResponse.ok || !Array.isArray(assignees)) {
          throw new Error(typeof assignees?.detail === 'string' ? assignees.detail : 'Could not resolve the selected assignee.');
        }
        const assignee = assignees.find((user) => user.email.toLowerCase() === newTask.assigneeEmail.toLowerCase());
        assigneeId = assignee?.id;
      }
      if (!assigneeId) {
        throw new Error('Choose a user who is eligible to receive tasks from your role.');
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTask.title,
          category: newTask.category || 'sprint',
          assignee_id: Number(assigneeId),
          due_date: newTask.due_date ?? newTask.dueDate
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof data?.detail === 'string' ? data.detail : `Could not assign the task (${response.status}).`;
        setTaskError(message);
        return { notificationError: message };
      }

      const task = normalizeTask(data);
      setTasks((current) => [task, ...current.filter((item) => item.id !== task.id)]);
      setTaskError('');
      return { task };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The task could not be assigned.';
      setTaskError(message);
      return { notificationError: message };
    }
  };

  const handleUpdateTaskStatus = async (taskId) => {
    const token = getToken();
    if (!token) {
      setTaskError('Sign in again before updating task progress.');
      return;
    }
    if (taskUpdateInFlight.current.has(taskId)) return;
    taskUpdateInFlight.current.add(taskId);
    setUpdatingTaskIds((current) => new Set(current).add(taskId));
    try {
      const response = await fetch(`/api/tasks/${taskId}/progress`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.detail === 'string' ? data.detail : `Could not update task (${response.status}).`);
      }
      const updatedTask = normalizeTask(data);
      setTasks((current) => current.map((task) => task.id === updatedTask.id ? updatedTask : task));
      setTaskError('');
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'Could not update task progress.');
    } finally {
      taskUpdateInFlight.current.delete(taskId);
      setUpdatingTaskIds((current) => {
        const next = new Set(current);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleTaskAction = async (taskId, action, body = null) => {
    const token = getToken();
    if (!token) {
      setTaskError('Sign in again before updating this task.');
      return;
    }
    if (taskUpdateInFlight.current.has(taskId)) return;
    taskUpdateInFlight.current.add(taskId);
    setUpdatingTaskIds((current) => new Set(current).add(taskId));
    try {
      const response = await fetch(`/api/tasks/${taskId}/${action}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.detail === 'string' ? data.detail : `Could not update task (${response.status}).`);
      }
      const updatedTask = normalizeTask(data);
      setTasks((current) => ['ended', 'expired'].includes(updatedTask.status)
        ? current.filter((task) => task.id !== updatedTask.id)
        : current.map((task) => task.id === updatedTask.id ? updatedTask : task));
      if (updatedTask.status === 'ended') {
        const performanceResponse = await fetch('/api/tasks/performance/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const performanceData = await performanceResponse.json().catch(() => null);
        if (!performanceResponse.ok || !performanceData || typeof performanceData.completion_rate !== 'number') {
          throw new Error(typeof performanceData?.detail === 'string'
            ? performanceData.detail
            : 'Task ended, but completion statistics could not be refreshed.');
        }
        setTaskPerformance(performanceData);
      }
      setTaskError('');
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'Could not update task.');
    } finally {
      taskUpdateInFlight.current.delete(taskId);
      setUpdatingTaskIds((current) => {
        const next = new Set(current);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleReviewTask = (taskId, decision, note = '') => handleTaskAction(taskId, 'review', { decision, note });
  const handleEndTask = (taskId) => handleTaskAction(taskId, 'end');

  // category is optional: ProjectsOperations passes the active board,
  // other callers open a Sprint task by default.
  const handleOpenAssignModal = (employee = null, category = null, title = '') => {
    if (!canAssignTasks(currentUser?.role)) {
      setTaskError('Your account role cannot assign tasks.');
      return;
    }
    setAssigneeTarget(employee);
    setAssignCategory(typeof category === 'string' ? category : null);
    setAssignmentTitle(title);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setAssignmentTitle('');
  };

  const renderActiveModule = () => {
    const userRole = currentUser?.role || 'ceo';

    if (activeTab === 'dashboard') {
      switch (userRole) {
        case 'admin':
          return <AdminDashboard onUnauthorized={handleLogout} onNavigateModule={setActiveTab} />;
        case 'hr':
          return (
            <HRDashboard
              onNavigateModule={setActiveTab}
              onOpenAssignModal={handleOpenAssignModal}
            />
          );
        case 'finance':
          return <FinanceAnalytics />;
        case 'product':
          return (
            <ProjectsOperations
              tasks={tasks}
              updatingTaskIds={updatingTaskIds}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onEndTask={handleEndTask}
              onOpenAssignModal={handleOpenAssignModal}
              departmentFilter={departmentFilter}
              currentUserRole={userRole}
              currentUserId={currentUser?.id}
            />
          );
        case 'engineering':
        case 'staff':
        case 'employee':
        case 'team_lead':
        case 'project_manager':
          return (
            <EmployeeDashboard
              tasks={tasks}
              taskPerformance={taskPerformance}
              updatingTaskIds={updatingTaskIds}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onReviewTask={handleReviewTask}
              onEndTask={handleEndTask}
              onOpenAssignModal={handleOpenAssignModal}
              onNavigateModule={setActiveTab}
              currentUser={currentUser}
            />
          );
        case 'ceo':
        default:
          return (
            <ExecutiveDashboard
              onNavigateModule={setActiveTab}
              onSelectNode={handleSelectSectorNode}
              onOpenAssignModal={handleOpenAssignModal}
            />
          );
      }
    }

    switch (activeTab) {
      case 'people':
        return <PeopleTalent />;
      case 'projects':
        return (
          <ProjectsOperations
            tasks={tasks}
            updatingTaskIds={updatingTaskIds}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onReviewTask={handleReviewTask}
            onEndTask={handleEndTask}
            onOpenAssignModal={handleOpenAssignModal}
            departmentFilter={departmentFilter}
            currentUserRole={userRole}
            currentUserId={currentUser?.id}
          />
        );
      case 'finance':
        return <FinanceAnalytics />;
      case 'communication':
        return <CommunicationSuite />;
      case 'documents':
        return <DocumentManagement currentUser={currentUser} />;
      default:
        return (
          <ExecutiveDashboard
            onNavigateModule={setActiveTab}
            onSelectNode={handleSelectSectorNode}
            onOpenAssignModal={handleOpenAssignModal}
          />
        );
    }
  };

  // If user is not authenticated, render Login Screen
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={handleLogin}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // If authenticated, render main Enterprise Dashboard layout
  return (
    <div className="app-container">
      {/* Persistent SyncDesk Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        companyHealthScore={companyHealth.score}
        currentUser={currentUser}
        tasks={tasks}
        onProfileDetailsChange={handleProfileDetailsChange}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAssignModal={() => handleOpenAssignModal(null)}
      />

      {/* Main Content Area */}
      <div className="main-content-area">
        {/* Global SyncDesk Header */}
        <Header
          activeTabTitle={moduleTitles[activeTab]}
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
          unreadCount={unreadNotificationCount}
          roleMode={currentUser?.role || 'ceo'}
          currentUser={currentUser}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenAssignModal={() => handleOpenAssignModal(null)}
          onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        />
        <NotificationsPanel
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onUnreadCountChange={setUnreadNotificationCount}
        />

        {/* View Content Body */}
        <main className="page-body">
          {taskError && (
            <div role="alert" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger-red)', backgroundColor: 'rgba(255, 59, 48, 0.12)', color: 'var(--danger-red)', fontSize: '13px' }}>
              {taskError}
            </div>
          )}
          {renderActiveModule()}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectModule={(module) => setActiveTab(module)}
        tasks={tasks}
      />

      {/* Work Assignment / Task Delegation Modal */}
      <WorkAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        onAssignTask={handleAssignTask}
        initialAssignee={assigneeTarget}
        initialTitle={assignmentTitle}
        category={assignCategory}
      />

      {/* Security Passcode Auth Modal */}
      <PasscodeAuthModal
        isOpen={isPasscodeModalOpen}
        onClose={() => setIsPasscodeModalOpen(false)}
        targetRole={targetRoleToUnlock}
        onAuthenticateSuccess={handleAuthenticateSuccess}
      />

      {/* Department / Sector Deep-Dive Modal (Triggered by Graph Click) */}
      <DepartmentSectorModal
        isOpen={isSectorModalOpen}
        onClose={() => setIsSectorModalOpen(false)}
        node={selectedSectorNode}
        onNavigateModule={setActiveTab}
        onSelectDepartment={setDepartmentFilter}
        onOpenAssignModal={handleOpenAssignModal}
      />

      {/* Interactive AI Assistant / Copilot Drawer */}
      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onNavigateModule={setActiveTab}
        onOpenAssignModal={handleOpenAssignModal}
        tasks={tasks}
        currentUser={currentUser}
      />
    </div>
  );
}

export default App;
