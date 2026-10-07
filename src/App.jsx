import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GlobalSearchModal from './components/GlobalSearchModal';
import WorkAssignmentModal from './components/WorkAssignmentModal';
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

import { companyHealth, kanbanTasks } from './data/mockData';
import { clearToken } from './utils/auth';

function App() {
  // Authentication & User Session State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState('dark');

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [tasks, setTasks] = useState(kanbanTasks);

  // Modals & Drawers State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigneeTarget, setAssigneeTarget] = useState(null);

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    clearToken();
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

  const handleAssignTask = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTaskStatus = (taskId) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        if (task.status === 'backlog') return { ...task, status: 'inProgress', progress: 40 };
        if (task.status === 'inProgress') return { ...task, status: 'review', progress: 85 };
        if (task.status === 'review') return { ...task, status: 'done', progress: 100 };
      }
      return task;
    }));
  };

  const handleOpenAssignModal = (employee = null) => {
    setAssigneeTarget(employee);
    setIsAssignModalOpen(true);
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
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onOpenAssignModal={handleOpenAssignModal}
              departmentFilter={departmentFilter}
            />
          );
        case 'engineering':
        case 'staff':
        case 'employee':
          return (
            <EmployeeDashboard
              tasks={tasks}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onOpenAssignModal={handleOpenAssignModal}
              onNavigateModule={setActiveTab}
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
        return (
          <PeopleTalent
            onOpenAssignModal={handleOpenAssignModal}
            departmentFilter={departmentFilter}
          />
        );
      case 'projects':
        return (
          <ProjectsOperations
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onOpenAssignModal={handleOpenAssignModal}
            departmentFilter={departmentFilter}
          />
        );
      case 'finance':
        return <FinanceAnalytics />;
      case 'communication':
        return <CommunicationSuite />;
      case 'documents':
        return <DocumentManagement />;
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
          unreadCount={3}
          roleMode={currentUser?.role || 'ceo'}
          currentUser={currentUser}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenAssignModal={() => handleOpenAssignModal(null)}
          onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        />

        {/* View Content Body */}
        <main className="page-body">
          {renderActiveModule()}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectModule={(module) => setActiveTab(module)}
      />

      {/* Work Assignment / Task Delegation Modal */}
      <WorkAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssignTask={handleAssignTask}
        initialAssignee={assigneeTarget}
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
        onAssignTask={handleAssignTask}
        tasks={tasks}
        currentUser={currentUser}
      />
    </div>
  );
}

export default App;
