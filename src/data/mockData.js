export const companyHealth = {
  score: 94,
  pulseStatus: "Optimal",
  change: "+2.4%",
  breakdown: [
    { name: "System Infrastructure", score: 98, status: "Optimal" },
    { name: "Operations & Delivery", score: 92, status: "Stable" },
    { name: "Team Sentiment", score: 95, status: "High" },
    { name: "Financial Growth", score: 91, status: "On Track" },
  ]
};

export const quickStats = [
  { id: "attendance", title: "Active Attendance", value: "96.4%", subtext: "842 / 873 active today", change: "+1.2%", status: "positive" },
  { id: "projects", title: "Active Projects", value: "24", subtext: "6 delivering this week", change: "4 in review", status: "neutral" },
  { id: "tasks", title: "Pending Tasks", value: "142", subtext: "88% on track for sprint", change: "-12 today", status: "positive" },
  { id: "revenue", title: "YTD Revenue", value: "$14.2M", subtext: "Target: $13.5M", change: "+18.4%", status: "positive" },
];

export const aiInsights = [
  {
    id: "insight-1",
    type: "warning",
    category: "Operations",
    title: "Project Hyperion Deadline Risk",
    description: "Third-party payment gateway integration dependency in Sprint 14 is delaying sub-module delivery by 3.5 days.",
    action: "Reassign 2 Senior Engineers from Infrastructure",
    timestamp: "12m ago",
    severity: "High"
  },
  {
    id: "insight-2",
    type: "info",
    category: "Financials",
    title: "Cloud Infrastructure Budget Anomaly",
    description: "AWS us-east GPU compute instance spend increased +14% due to parallel LLM benchmark evaluations.",
    action: "Schedule auto-termination for idle clusters",
    timestamp: "45m ago",
    severity: "Medium"
  },
  {
    id: "insight-3",
    type: "success",
    category: "Sales Velocity",
    title: "EMEA Region Revenue Acceleration",
    description: "Enterprise demo conversions increased by 22% following the deployment of the SyncDesk automated workflow feature.",
    action: "Expand EMEA sales team allocation",
    timestamp: "2h ago",
    severity: "Low"
  }
];

export const digitalTwinNodes = [
  { id: "node-hq", label: "Executive HQ", type: "hub", health: 98, x: 50, y: 50, connections: ["node-eng", "node-sales", "node-product", "node-fin"] },
  { id: "node-eng", label: "Engineering & Cloud", type: "dept", health: 94, x: 25, y: 30, connections: ["node-hq", "node-ai", "node-sec"] },
  { id: "node-product", label: "Product & UX", type: "dept", health: 96, x: 75, y: 30, connections: ["node-hq", "node-eng"] },
  { id: "node-sales", label: "Global Sales & Rev", type: "dept", health: 90, x: 25, y: 70, connections: ["node-hq", "node-emea", "node-apac"] },
  { id: "node-fin", label: "Finance & Ops", type: "dept", health: 95, x: 75, y: 70, connections: ["node-hq"] },
  { id: "node-ai", label: "AI Engine Subsystem", type: "tech", health: 99, x: 10, y: 15, connections: ["node-eng"] },
  { id: "node-sec", label: "Security & Compliance", type: "tech", health: 100, x: 40, y: 15, connections: ["node-eng"] },
  { id: "node-emea", label: "EMEA Regional Hub", type: "region", health: 92, x: 10, y: 85, connections: ["node-sales"] },
  { id: "node-apac", label: "APAC Regional Hub", type: "region", health: 88, x: 40, y: 85, connections: ["node-sales"] }
];

export const employees = [
  {
    id: "emp-1",
    name: "Elena Rostova",
    title: "Chief Technology Officer",
    department: "Executive",
    email: "e.rostova@syncdesk.io",
    status: "online",
    location: "San Francisco, CA",
    timeZone: "PST (UTC-7)",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    reportingTo: "Chief Executive Officer",
    directReports: ["Marcus Vance", "Sophia Lin", "David K."],
    recentActivity: "Approved Architecture RFC #402 for AI Pipeline",
    projects: ["SyncDesk Core", "Project Hyperion"]
  },
  {
    id: "emp-2",
    name: "Marcus Vance",
    title: "VP of Engineering",
    department: "Engineering",
    email: "m.vance@syncdesk.io",
    status: "online",
    location: "New York, NY",
    timeZone: "EST (UTC-4)",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    reportingTo: "Elena Rostova",
    directReports: ["Alex Chen", "Priya Sharma"],
    recentActivity: "Merged PR #1288: Latency optimization in node graph",
    projects: ["Digital Twin Engine", "Security Mesh"]
  },
  {
    id: "emp-3",
    name: "Sophia Lin",
    title: "Head of Product Design",
    department: "Product",
    email: "s.lin@syncdesk.io",
    status: "in-meeting",
    location: "London, UK",
    timeZone: "BST (UTC+1)",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    reportingTo: "Elena Rostova",
    directReports: ["Lucas Meyer", "Emma Watson"],
    recentActivity: "Published Design System Tokens v2.4 (Dark Glass)",
    projects: ["SyncDesk Mobile", "Design System"]
  },
  {
    id: "emp-4",
    name: "David Kim",
    title: "VP of Finance & Strategy",
    department: "Finance",
    email: "d.kim@syncdesk.io",
    status: "online",
    location: "Chicago, IL",
    timeZone: "CST (UTC-5)",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    reportingTo: "Chief Financial Officer",
    directReports: ["Sarah Jenkins"],
    recentActivity: "Finalized Q3 Revenue Forecast & Risk Trajectory",
    projects: ["Predictive Analytics", "Q3 Budget Review"]
  },
  {
    id: "emp-5",
    name: "Priya Sharma",
    title: "Lead AI Researcher",
    department: "Engineering",
    email: "p.sharma@syncdesk.io",
    status: "away",
    location: "Toronto, CA",
    timeZone: "EST (UTC-4)",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
    reportingTo: "Marcus Vance",
    directReports: [],
    recentActivity: "Trained SyncDesk Neural Anomaly Classifier v4",
    projects: ["AI Insights Core", "Digital Twin Engine"]
  },
  {
    id: "emp-6",
    name: "Alex Chen",
    title: "Principal Staff Engineer",
    department: "Engineering",
    email: "a.chen@syncdesk.io",
    status: "online",
    location: "Seattle, WA",
    timeZone: "PST (UTC-7)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    reportingTo: "Marcus Vance",
    directReports: [],
    recentActivity: "Deployed low-latency WebSocket hub for cinematic calls",
    projects: ["Communication Suite", "Realtime Bus"]
  }
];

export const kanbanTasks = [
  {
    id: "task-101",
    title: "High-Density Canvas Node Graph Rendering",
    project: "Digital Twin Engine",
    status: "inProgress",
    priority: "Critical",
    assignee: "Marcus Vance",
    assigneeAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    progress: 75,
    dueDate: "Tomorrow",
    tags: ["Frontend", "Canvas", "Performance"]
  },
  {
    id: "task-102",
    title: "Cinematic Video Call Active Speaker Audio Ducking",
    project: "Communication Suite",
    status: "inProgress",
    priority: "High",
    assignee: "Alex Chen",
    assigneeAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    progress: 40,
    dueDate: "Aug 06",
    tags: ["WebRTC", "Audio", "UX"]
  },
  {
    id: "task-103",
    title: "SOC2 Compliance Audit Documentation Package",
    project: "Security Mesh",
    status: "review",
    priority: "Medium",
    assignee: "Elena Rostova",
    assigneeAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    progress: 90,
    dueDate: "Aug 04",
    tags: ["Security", "Compliance", "Legal"]
  },
  {
    id: "task-104",
    title: "AI Revenue Trajectory Monte Carlo Simulation Engine",
    project: "Predictive Analytics",
    status: "done",
    priority: "High",
    assignee: "David Kim",
    assigneeAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    progress: 100,
    dueDate: "Completed",
    tags: ["AI", "Finance", "Modeling"]
  },
  {
    id: "task-105",
    title: "Unified Global Inbox Filter & Mentions Engine",
    project: "Communication Suite",
    status: "backlog",
    priority: "Low",
    assignee: "Sophia Lin",
    assigneeAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    progress: 10,
    dueDate: "Aug 12",
    tags: ["Inbox", "UI"]
  }
];

export const resourceAllocation = [
  { department: "Engineering", allocated: 92, capacity: 100, status: "High Load" },
  { department: "Product & Design", allocated: 84, capacity: 100, status: "Balanced" },
  { department: "Sales & Marketing", allocated: 76, capacity: 100, status: "Optimal" },
  { department: "Finance & Ops", allocated: 68, capacity: 100, status: "Optimal" },
  { department: "Security & Legal", allocated: 88, capacity: 100, status: "Heavy" },
];

export const financialData = {
  metrics: {
    ytdRevenue: "$14,280,000",
    monthlyExpenses: "$1,120,000",
    profitMargin: "34.2%",
    cashRunway: "28 Months",
  },
  chartHistory: [
    { month: "Jan", revenue: 1.8, expense: 0.9, profit: 0.9 },
    { month: "Feb", revenue: 2.1, expense: 0.95, profit: 1.15 },
    { month: "Mar", revenue: 2.3, expense: 1.0, profit: 1.3 },
    { month: "Apr", revenue: 2.2, expense: 1.05, profit: 1.15 },
    { month: "May", revenue: 2.6, expense: 1.08, profit: 1.52 },
    { month: "Jun", revenue: 2.9, expense: 1.10, profit: 1.80 },
    { month: "Jul", revenue: 3.2, expense: 1.12, profit: 2.08 },
  ],
  riskAssessments: [
    { risk: "Global Supply Chain Hardware Delays", category: "Operations", impact: "High", probability: "18%", mitigation: "Pre-purchased 12-month GPU hardware reserves" },
    { risk: "Macroeconomic Interest Rate Volatility", category: "Finance", impact: "Medium", probability: "35%", mitigation: "Hedged fixed-rate short-term treasury yields" },
    { risk: "Senior Engineering Attrition Rate", category: "Talent", impact: "High", probability: "8%", mitigation: "Implemented competitive equity retention refresh" }
  ]
};

export const chatChannels = [
  { id: "c-1", name: "announcements", type: "channel", unread: 2, icon: "Megaphone" },
  { id: "c-2", name: "executive-hub", type: "channel", unread: 0, icon: "Shield" },
  { id: "c-3", name: "project-hyperion", type: "channel", unread: 5, icon: "Zap" },
  { id: "c-4", name: "ai-ops-alerts", type: "channel", unread: 1, icon: "Cpu" },
];

export const sampleMessages = [
  {
    id: "m-1",
    author: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    time: "10:14 AM",
    content: "Team, the AI Health score reached 94/100 today following our cloud infrastructure deployment. Outstanding work on the latency optimization!",
    reactions: ["🚀 6", "🔥 4"]
  },
  {
    id: "m-2",
    author: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    time: "10:18 AM",
    content: "Thanks Elena! @Alex Chen and @Priya Sharma tuned the WebSocket broadcast protocol. Node response latency is down to 14ms globally.",
    reactions: ["👏 5", "⚡ 8"]
  },
  {
    id: "m-3",
    author: "Alex Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    time: "10:22 AM",
    content: "We're currently reviewing the Cinematic Call doc sharing overlay. Ready for test run in our afternoon sync.",
    reactions: ["🎥 3"]
  }
];

export const documentLibrary = [
  {
    id: "doc-1",
    title: "SyncDesk Q3 Strategic Growth & Revenue Roadmap.pdf",
    category: "Executive Strategy",
    size: "4.8 MB",
    modified: "Aug 02, 2026",
    author: "David Kim",
    starred: true,
    linkedProject: "Predictive Analytics"
  },
  {
    id: "doc-2",
    title: "System Architecture & Digital Twin Node Specification v3.2.docx",
    category: "Engineering",
    size: "12.4 MB",
    modified: "Jul 29, 2026",
    author: "Elena Rostova",
    starred: true,
    linkedProject: "Digital Twin Engine"
  },
  {
    id: "doc-3",
    title: "Enterprise Dark Design Tokens & Component Standard Guidelines.fig",
    category: "Design",
    size: "42.1 MB",
    modified: "Aug 01, 2026",
    author: "Sophia Lin",
    starred: false,
    linkedProject: "Design System"
  },
  {
    id: "doc-4",
    title: "SOC2 Type II Audit & Infrastructure Security Attestation Report.pdf",
    category: "Compliance",
    size: "8.2 MB",
    modified: "Jul 15, 2026",
    author: "Marcus Vance",
    starred: true,
    linkedProject: "Security Mesh"
  }
];
