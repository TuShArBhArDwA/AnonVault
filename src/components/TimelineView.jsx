import React, { useState } from 'react';
import { 
  Plus, Search, ArrowUpDown, Filter, ExternalLink, 
  Edit3, Trash2, Calendar, Link as LinkIcon, AlertTriangle, 
  HelpCircle, Clock, ChevronDown, ChevronRight, ListCollapse
} from 'lucide-react';
import { formatDate, getPriorityStyles, getStatusStyles, sortApplicationsByDeadline, groupApplicationsByMonth } from '../utils/helpers';

export default function TimelineView({ 
  applications, 
  onAdd, 
  onUpdate, 
  onDelete, 
  loading
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [groupByMonthMode, setGroupByMonthMode] = useState(true); // true = month grouped, false = linear sorted
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formName, setFormName] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [formStatus, setFormStatus] = useState('pending');
  const [formNotes, setFormNotes] = useState('');

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Month collapse state (which months are expanded)
  const [expandedMonths, setExpandedMonths] = useState({});

  // Reset form helper
  const resetForm = () => {
    setFormName('');
    setFormLink('');
    // Default deadline to tomorrow at 12:00 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(tomorrow - tzOffset)).toISOString().slice(0, 16);
    setFormDeadline(localISOTime);
    setFormPriority('medium');
    setFormStatus('pending');
    setFormNotes('');
    setEditingApp(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (app) => {
    setEditingApp(app);
    setFormName(app.name);
    setFormLink(app.link || '');
    
    // Format timestampz for datetime-local input
    if (app.deadline) {
      const dateObj = new Date(app.deadline);
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      const formatted = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
      setFormDeadline(formatted);
    } else {
      setFormDeadline('');
    }
    
    setFormPriority(app.priority || 'medium');
    setFormStatus(app.status || 'pending');
    setFormNotes(app.notes || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formDeadline) return;

    const appPayload = {
      name: formName.trim(),
      link: formLink.trim(),
      deadline: new Date(formDeadline).toISOString(),
      priority: formPriority,
      status: formStatus,
      notes: formNotes.trim(),
    };

    if (editingApp) {
      await onUpdate(editingApp.id, appPayload);
    } else {
      await onAdd(appPayload);
    }
    setIsFormOpen(false);
    resetForm();
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId) {
      await onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const toggleMonth = (month) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: prev[month] === false ? true : false // default to true
    }));
  };

  // --- Filtering & Sorting Data ---
  const filteredApps = (applications || []).filter(app => {
    if (!app) return false;
    const matchesSearch = 
      (app.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.notes && app.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPriority = selectedPriority === 'all' || app.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const sortedApps = sortApplicationsByDeadline(filteredApps, sortOrder);
  const groupedApps = groupApplicationsByMonth(sortedApps);

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden bg-slate-950">
      
      {/* View Header / Navigation */}
      <header className="px-8 py-5 border-b border-slate-900 bg-slate-950 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Hackathon Timeline</h2>
          <p className="text-xs text-slate-500">Track and sort hackathons and project submissions chronologically</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus size={15} />
            New Hackathon
          </button>
        </div>
      </header>

      {/* Main Toolbar Controls */}
      <section className="px-8 py-4 border-b border-slate-900 bg-slate-950/60 flex flex-wrap gap-4 items-center justify-between shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search hackathons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs text-white bg-slate-900/40 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1.5 text-xs text-slate-300 bg-slate-900/60 border border-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs text-slate-300 bg-slate-900/60 border border-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="applied">Registered</option>
              <option value="interviewing">Building</option>
              <option value="offered">Winner</option>
              <option value="rejected">Completed</option>
            </select>
          </div>

          {/* Toggle Sorting Order */}
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-900/50 hover:bg-slate-900 border border-slate-900 rounded-lg transition-colors cursor-pointer"
            title="Toggle Deadline Sort Order"
          >
            <ArrowUpDown size={12} className="text-slate-450" />
            <span>{sortOrder === 'asc' ? 'Soonest First' : 'Furthest First'}</span>
          </button>

          {/* Toggle Month Grouping */}
          <button
            onClick={() => setGroupByMonthMode(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-900/50 hover:bg-slate-900 border border-slate-900 rounded-lg transition-colors cursor-pointer"
            title="Switch Between Grouping Methods"
          >
            <ListCollapse size={12} className="text-slate-450" />
            <span>{groupByMonthMode ? 'Month Grouped' : 'Linear List'}</span>
          </button>
        </div>
      </section>

      {/* Timeline Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-xs gap-2">
            <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
            Synchronizing timeline...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-900 rounded-2xl max-w-md mx-auto my-12">
            <Calendar size={32} className="text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-350">No hackathons matching criteria</h3>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-normal">
              {searchTerm || selectedPriority !== 'all' || selectedStatus !== 'all' 
                ? 'Try relaxing your filters or query to find existing items.' 
                : 'Start tracking by creating your first entry.'}
            </p>
            {!searchTerm && selectedPriority === 'all' && selectedStatus === 'all' && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600/20 border border-indigo-500/25 rounded-xl transition-all"
              >
                Create Hackathon
              </button>
            )}
          </div>
        ) : groupByMonthMode ? (
          /* ================= MONTH GROUPED VIEW ================= */
          <div className="space-y-8 relative pl-4 border-l border-slate-900/60 ml-2">
            {Object.keys(groupedApps).map((monthYear) => {
              const isExpanded = expandedMonths[monthYear] !== false;
              const monthApps = groupedApps[monthYear];

              return (
                <div key={monthYear} className="space-y-4 relative">
                  
                  {/* Month Node Badge */}
                  <div className="absolute -left-[25px] top-1.5 w-4 h-4 bg-slate-950 border-2 border-indigo-500/50 rounded-full flex items-center justify-center shadow-lg">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  </div>

                  <button 
                    onClick={() => toggleMonth(monthYear)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white focus:outline-none transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span>{monthYear}</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-slate-900 text-slate-500 rounded-full font-medium">{monthApps.length}</span>
                  </button>

                  {isExpanded && (
                    <div className="space-y-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {monthApps.map((app) => (
                        <HackathonCard 
                          key={app.id} 
                          app={app} 
                          onEdit={handleOpenEdit} 
                          onDelete={handleDeleteClick} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= LINEAR SORTED VIEW ================= */
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {sortedApps.map((app) => (
              <HackathonCard 
                key={app.id} 
                app={app} 
                onEdit={handleOpenEdit} 
                onDelete={handleDeleteClick} 
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= EDIT / ADD DRAWER FORM ================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-slate-950 border-l border-slate-900 shadow-2xl flex flex-col justify-between overflow-hidden">
            
            {/* Form Header */}
            <div className="p-6 border-b border-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingApp ? 'Modify Hackathon' : 'Register Hackathon'}
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Timeline Tracker</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Form Body (Scrollable) */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 flex items-center gap-1.5">
                  Hackathon / Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HackMIT or BuildSpace"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-white bg-slate-900/60 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-650 transition-all font-medium"
                />
              </div>

              {/* Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 flex items-center gap-1.5">
                  <LinkIcon size={12} className="text-slate-555" />
                  Hackathon / Event Link
                </label>
                <input
                  type="url"
                  placeholder="https://hackmit.org or devpost.com/..."
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-white bg-slate-900/60 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-650 transition-all font-medium"
                />
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-555" />
                  Deadline Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-white bg-slate-900/60 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              {/* Grid: Priority & Status */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Priority Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-350">Priority Scale</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs text-white bg-slate-900/60 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-350">Submission Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs text-white bg-slate-900/60 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="applied">Registered</option>
                    <option value="interviewing">Building</option>
                    <option value="offered">Winner</option>
                    <option value="rejected">Completed</option>
                  </select>
                </div>

              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350">Progress Notes / Details</label>
                <textarea
                  rows={6}
                  placeholder="Project ideas, team formation details, submission requirements, preparation notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-white bg-slate-900/60 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-650 transition-all font-medium resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons inside Drawer */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 px-4 text-xs font-bold text-slate-450 hover:text-white bg-slate-900 hover:bg-slate-900/80 rounded-xl border border-slate-900 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  {editingApp ? 'Save Changes' : 'Add Hackathon'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="w-full max-w-sm p-6 rounded-2xl glass-panel shadow-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3 text-rose-455">
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">Delete Hackathon Record</h3>
            </div>
            
            <p className="text-xs text-slate-450 leading-relaxed">
              Are you sure you want to delete this hackathon record? This action is permanent and cannot be undone on Supabase.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 px-3 text-xs font-bold text-slate-450 hover:text-white bg-slate-900 hover:bg-slate-800/80 border border-slate-850 rounded-xl transition-all cursor-pointer"
              >
                Keep Record
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl shadow-lg shadow-rose-600/10 transition-all cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ================= COMPONENT: HACKATHON CARD ================= */
function HackathonCard({ app, onEdit, onDelete }) {
  const priority = getPriorityStyles(app.priority);
  const status = getStatusStyles(app.status);

  // Time remaining helper
  const getTimeRemaining = (deadlineStr) => {
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Expired ${Math.abs(diffDays)}d ago`, isUrgent: false, isExpired: true };
    }
    if (diffDays === 0) {
      return { text: 'Due Today', isUrgent: true, isExpired: false };
    }
    if (diffDays === 1) {
      return { text: 'Due Tomorrow', isUrgent: true, isExpired: false };
    }
    if (diffDays <= 4) {
      return { text: `${diffDays} days left`, isUrgent: true, isExpired: false };
    }
    return { text: `${diffDays} days left`, isUrgent: false, isExpired: false };
  };

  const remaining = getTimeRemaining(app.deadline);

  return (
    <article className={`glass-card p-5 rounded-2xl flex flex-col justify-between relative border border-slate-800/50 hover:border-slate-800/90 shadow-md ${priority.glow}`}>
      
      {/* Top Section */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 max-w-[70%]">
            <h4 className="text-sm font-bold text-white truncate" title={app.name}>{app.name}</h4>
            
            {/* Badges row */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-md leading-normal tracking-wide ${priority.bg} ${priority.text} ${priority.border}`}>
                {priority.label}
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-md leading-normal tracking-wide ${status.bg} ${status.text} ${status.border}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Quick Action Trigger Keys */}
          <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
            {app.link && (
              <a
                href={app.link}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-900 transition-all cursor-pointer"
                title="Go to hackathon event link"
              >
                <ExternalLink size={13} />
              </a>
            )}
            <button
              onClick={() => onEdit(app)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-900 transition-all cursor-pointer"
              title="Edit hackathon details"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={() => onDelete(app.id)}
              className="p-1 text-slate-450 hover:text-rose-400 rounded hover:bg-slate-900 transition-all cursor-pointer"
              title="Delete hackathon record"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Deadline information */}
        <div className="flex items-center gap-3 pt-1 text-[11px] border-t border-slate-900/60">
          <span className="flex items-center gap-1 text-slate-455 font-medium">
            <Calendar size={11} className="text-indigo-400" />
            {formatDate(app.deadline)}
          </span>
          <span className={`flex items-center gap-1 font-semibold ${
            remaining.isExpired ? 'text-rose-500' : remaining.isUrgent ? 'text-amber-400 animate-pulse' : 'text-emerald-450'
          }`}>
            <Clock size={11} />
            {remaining.text}
          </span>
        </div>

        {/* Notes summary */}
        {app.notes && (
          <p className="text-[11px] text-slate-455 leading-relaxed pt-2 line-clamp-3 whitespace-pre-line border-t border-slate-900/30">
            {app.notes}
          </p>
        )}
      </div>

    </article>
  );
}
