const ASSIGNING_ROLES = new Set(['ceo', 'hr', 'team_lead', 'project_manager']);

export const canAssignTasks = (role) => ASSIGNING_ROLES.has(role);

export const canUpdateTask = (task, userId) =>
  userId !== null && userId !== undefined && String(task.assigneeId) === String(userId);
