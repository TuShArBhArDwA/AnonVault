export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getMonthYear = (dateString) => {
  if (!dateString) return 'No Date';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });
};

export const getPriorityStyles = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        glow: 'glow-high',
        label: 'High Priority'
      };
    case 'medium':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        glow: 'glow-medium',
        label: 'Medium Priority'
      };
    case 'low':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        glow: '',
        label: 'Low Priority'
      };
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/20',
        glow: '',
        label: 'Normal'
      };
  }
};

export const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case 'applied':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/25',
        label: 'Registered'
      };
    case 'interviewing':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/25',
        label: 'Building'
      };
    case 'offered':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/25',
        label: 'Winner'
      };
    case 'rejected':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/25',
        label: 'Completed'
      };
    case 'pending':
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/25',
        label: 'Pending'
      };
  }
};

export const sortApplicationsByDeadline = (apps, order = 'asc') => {
  return [...apps].sort((a, b) => {
    const dateA = new Date(a.deadline).getTime();
    const dateB = new Date(b.deadline).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
};

export const groupApplicationsByMonth = (apps) => {
  const grouped = {};
  
  apps.forEach(app => {
    const monthYear = getMonthYear(app.deadline);
    if (!grouped[monthYear]) {
      grouped[monthYear] = [];
    }
    grouped[monthYear].push(app);
  });
  
  // Sort group keys chronologically
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    // Treat first item of each group as month representative
    const dateA = new Date(grouped[a][0].deadline).getTime();
    const dateB = new Date(grouped[b][0].deadline).getTime();
    return dateA - dateB;
  });
  
  const sortedGrouped = {};
  sortedKeys.forEach(key => {
    // Sort applications inside the month
    sortedGrouped[key] = [...grouped[key]].sort((a, b) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  });
  
  return sortedGrouped;
};
