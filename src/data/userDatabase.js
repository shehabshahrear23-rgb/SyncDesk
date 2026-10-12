// Mock Enterprise User Database simulating backend authentication & database lookup
export const userDatabase = [
  {
    id: "usr-1",
    email: "ceo@syncdesk.io",
    password: "1234",
    name: "Elena Rostova",
    role: "ceo",
    roleLabel: "Executive / CEO",
    department: "Executive",
    title: "Chief Executive Officer",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    defaultModule: "dashboard",
    dashboardTitle: "SyncDesk Executive Command & Digital Twin"
  },
  {
    id: "usr-2",
    email: "hr@syncdesk.io",
    password: "1234",
    name: "Sophia Lin",
    role: "hr",
    roleLabel: "HR & People Director",
    department: "Human Resources",
    title: "Head of HR & Talent Acquisition",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    defaultModule: "dashboard",
    dashboardTitle: "SyncDesk HR Operations & Talent Command Center"
  },
  {
    id: "usr-3",
    email: "finance@syncdesk.io",
    password: "1234",
    name: "David Kim",
    role: "finance",
    roleLabel: "Finance & CFO",
    department: "Finance",
    title: "Chief Financial Officer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    defaultModule: "dashboard",
    dashboardTitle: "SyncDesk Financial Analytics & Risk Command"
  },
  {
    id: "usr-4",
    email: "staff@syncdesk.io",
    password: "1234",
    name: "Marcus Vance",
    role: "engineering",
    roleLabel: "Engineering Staff",
    department: "Engineering",
    title: "VP of Engineering",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    defaultModule: "dashboard",
    dashboardTitle: "SyncDesk Engineering Workstation & Sprint Kanban"
  },
  {
    id: "usr-5",
    email: "product@syncdesk.io",
    password: "1234",
    name: "Alex Chen",
    role: "product",
    roleLabel: "Product Manager",
    department: "Product",
    title: "Principal Product Manager",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    defaultModule: "dashboard",
    dashboardTitle: "SyncDesk Product Roadmap & Operations"
  },
  {
    id: "usr-6",
    email: "admin@syncdesk.io",
    password: "1234",
    name: "System Admin",
    role: "admin",
    roleLabel: "System Administrator",
    department: "IT & Administration",
    title: "Platform Administrator",
    avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&auto=format&fit=crop&q=80",
    defaultModule: "dashboard",
    dashboardTitle: "SyncDesk Admin — User Management Console"
  }
];

// Backend User Lookup Service
export const authenticateUser = (email, password) => {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Direct database match
  const foundUser = userDatabase.find(
    u => u.email.toLowerCase() === cleanEmail && u.password === password
  );

  if (foundUser) {
    return { success: true, user: foundUser };
  }

  // 2. Dynamic lookup fallback for any custom email address based on role hints
  if (cleanEmail.length > 3) {
    let role = "engineering";
    let roleLabel = "Staff Member";
    let department = "Operations";
    let title = "Staff Engineer";
    let avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

    if (cleanEmail.includes("hr") || cleanEmail.includes("people")) {
      role = "hr";
      roleLabel = "HR & People Manager";
      department = "Human Resources";
      title = "HR Manager";
      avatar = "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80";
    } else if (cleanEmail.includes("finance") || cleanEmail.includes("cfo") || cleanEmail.includes("account")) {
      role = "finance";
      roleLabel = "Finance Specialist";
      department = "Finance";
      title = "Financial Analyst";
      avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80";
    } else if (cleanEmail.includes("ceo") || cleanEmail.includes("exec") || cleanEmail.includes("director")) {
      role = "ceo";
      roleLabel = "Executive Leader";
      department = "Executive";
      title = "Executive Director";
      avatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80";
    } else if (cleanEmail.includes("product") || cleanEmail.includes("ux")) {
      role = "product";
      roleLabel = "Product Lead";
      department = "Product";
      title = "Product Manager";
      avatar = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80";
    }

    const userName = cleanEmail.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());

    return {
      success: true,
      user: {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        password,
        name: userName || "Workspace User",
        role,
        roleLabel,
        department,
        title,
        avatar,
        defaultModule: "dashboard",
        dashboardTitle: `SyncDesk ${roleLabel} Command Dashboard`
      }
    };
  }

  return { success: false, message: "Invalid email or password credentials." };
};
