import React, { useState } from 'react';
import { 
  Plus, Search, ArrowUpDown, ExternalLink, 
  Edit3, Trash2, Calendar, Link as LinkIcon, AlertTriangle, 
  Clock, ChevronDown, ChevronRight, ListCollapse,
  Lock, X, Flame
} from 'lucide-react';
import { formatDate, getPriorityStyles, getStatusStyles, sortApplicationsByDeadline, groupApplicationsByMonth } from '../utils/helpers';

export default function TimelineView({ 
  applications, 
  onAdd, 
  onUpdate, 
  onDelete, 
  loading,
  theme,
  onLock,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [groupByMonthMode, setGroupByMonthMode] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formName, setFormName] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [formStatus, setFormStatus] = useState('pending');
  const [formNotes, setFormNotes] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [selectedAppDetails, setSelectedAppDetails] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({});

  const resetForm = () => {
    setFormName(''); setFormLink('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    setFormDate(`${y}-${m}-${d}`);
    setFormTime('12:00');
    setFormPriority('medium'); setFormStatus('pending');
    setFormNotes(''); setEditingApp(null);
  };

  const handleOpenAdd = () => { resetForm(); setIsFormOpen(true); };

  const handleOpenEdit = (app) => {
    setEditingApp(app);
    setFormName(app.name); setFormLink(app.link || '');
    if (app.deadline) {
      const d = new Date(app.deadline);
      setFormDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
      setFormTime(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    } else { setFormDate(''); setFormTime(''); }
    setFormPriority(app.priority || 'medium');
    setFormStatus(app.status || 'pending');
    setFormNotes(app.notes || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast?.('error', 'Name Required', 'Please enter the hackathon or event name.');
      return;
    }
    if (!formDate) {
      showToast?.('error', 'Date Required', 'Please pick a deadline date.');
      return;
    }
    if (!formTime) {
      showToast?.('error', 'Time Required', 'Please set a deadline time.');
      return;
    }
    const appPayload = {
      name: formName.trim(), link: formLink.trim(),
      deadline: new Date(`${formDate}T${formTime}`).toISOString(),
      priority: formPriority, status: formStatus, notes: formNotes.trim(),
    };
    if (editingApp) await onUpdate(editingApp.id, appPayload);
    else await onAdd(appPayload);
    setIsFormOpen(false); resetForm();
  };

  const handleDeleteClick = (id) => setDeleteConfirmId(id);
  const handleConfirmDelete = async () => {
    if (deleteConfirmId) { await onDelete(deleteConfirmId); setDeleteConfirmId(null); }
  };

  const toggleMonth = (month) =>
    setExpandedMonths(prev => ({ ...prev, [month]: prev[month] === false ? true : false }));

  const filteredApps = (applications || []).filter(app => {
    if (!app) return false;
    const matchesSearch = (app.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.notes && app.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch &&
      (selectedPriority === 'all' || app.priority === selectedPriority) &&
      (selectedStatus === 'all' || app.status === selectedStatus);
  });

  const sortedApps = sortApplicationsByDeadline(filteredApps, sortOrder);
  const groupedApps = groupApplicationsByMonth(sortedApps);

  const nearestAppId = (() => {
    const active = (applications || []).filter(a => a?.deadline && new Date(a.deadline) > new Date() && a.status !== 'rejected');
    if (!active.length) return null;
    return [...active].sort((a,b) => new Date(a.deadline)-new Date(b.deadline))[0].id;
  })();

  const selectClass = "px-3 py-1.5 text-xs text-slate-300 rounded-lg cursor-pointer transition-all focus:outline-none input-premium";

  const TimelineNodeDot = ({ app }) => (
    <div className={`absolute -left-[27px] top-5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
      app.id === nearestAppId
        ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
        : app.priority === 'high'
          ? 'border-rose-400 bg-rose-400/20 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
          : 'border-slate-700 bg-slate-900'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        app.id === nearestAppId ? 'bg-amber-400' :
        app.priority === 'high' ? 'bg-rose-400' : 'bg-slate-600'
      }`} />
    </div>
  );

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden bg-slate-950">

      {/* Header */}
      <header className="glass-header px-7 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Hackathon Timeline</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">{(applications||[]).length} events tracked</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onLock}
            className="btn-ghost p-2.5 rounded-xl cursor-pointer flex items-center justify-center"
            title="Lock workspace"
          >
            <Lock size={14} className="text-slate-400 hover:text-rose-400 transition-colors" />
          </button>
          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-xl cursor-pointer">
            <Plus size={14} />
            Add Hackathon
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="px-7 py-3 border-b border-white/[0.04] flex flex-wrap gap-3 items-center justify-between shrink-0">
        <div className="relative min-w-[220px] max-w-xs flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search hackathons…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-premium w-full pl-9 pr-4 py-2 text-[13px] rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)} className={selectClass}>
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className={selectClass}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="applied">Registered</option>
            <option value="interviewing">Building</option>
            <option value="offered">Winner</option>
            <option value="rejected">Completed</option>
          </select>

          <button
            onClick={() => setSortOrder(p => p === 'asc' ? 'desc' : 'asc')}
            className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-xl cursor-pointer"
          >
            <ArrowUpDown size={12} />
            {sortOrder === 'asc' ? 'Soonest' : 'Furthest'}
          </button>

          <button
            onClick={() => setGroupByMonthMode(p => !p)}
            className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-xl cursor-pointer"
          >
            <ListCollapse size={12} />
            {groupByMonthMode ? 'By Month' : 'Linear'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-7 py-6">
        {loading ? (
          <div className="h-48 flex items-center justify-center gap-3 text-slate-500 text-sm">
            <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
              <Calendar size={24} className="text-slate-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">No hackathons found</h3>
            <p className="text-[12px] text-slate-600 mt-1.5 leading-relaxed">
              {searchTerm || selectedPriority !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters.'
                : 'Start tracking your first hackathon.'}
            </p>
            {!searchTerm && selectedPriority === 'all' && selectedStatus === 'all' && (
              <button onClick={handleOpenAdd} className="btn-primary mt-5 px-5 py-2 text-[13px] font-semibold rounded-xl cursor-pointer">
                Add Hackathon
              </button>
            )}
          </div>
        ) : groupByMonthMode ? (
          <div className="relative pl-5 ml-1" style={{ borderLeft: '1px solid rgba(99,102,241,0.12)' }}>
            <div className="space-y-10">
              {Object.keys(groupedApps).map(monthYear => {
                const isExpanded = expandedMonths[monthYear] !== false;
                const monthApps = groupedApps[monthYear];
                return (
                  <div key={monthYear} className="relative">
                    {/* Month marker */}
                    <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>
                    <button
                      onClick={() => toggleMonth(monthYear)}
                      className="flex items-center gap-2 text-[13px] font-semibold text-slate-300 hover:text-white transition-colors mb-4 cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                      {monthYear}
                      <span className="px-2 py-0.5 text-[10px] bg-white/[0.06] text-slate-500 rounded-full font-medium">{monthApps.length}</span>
                    </button>
                    {isExpanded && (
                      <div className="relative pl-5 space-y-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                        {monthApps.map(app => (
                          <div key={app.id} className="relative">
                            <TimelineNodeDot app={app} />
                            <HackathonCard app={app} isNearest={app.id===nearestAppId} onEdit={handleOpenEdit} onDelete={handleDeleteClick} onViewDetails={setSelectedAppDetails} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="relative pl-5 ml-1 space-y-4" style={{ borderLeft: '1px solid rgba(99,102,241,0.12)' }}>
            {sortedApps.map(app => (
              <div key={app.id} className="relative">
                <TimelineNodeDot app={app} />
                <HackathonCard app={app} isNearest={app.id===nearestAppId} onEdit={handleOpenEdit} onDelete={handleDeleteClick} onViewDetails={setSelectedAppDetails} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {isFormOpen && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setIsFormOpen(false)}>
          <div className="modal-surface w-full max-w-lg max-h-[90vh] rounded-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-white">{editingApp ? 'Edit Hackathon' : 'New Hackathon'}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{editingApp ? 'Update the details below' : 'Track a new event or deadline'}</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="btn-ghost p-2 rounded-lg cursor-pointer"><X size={15} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <Field label="Event Name" required>
                <input type="text" required placeholder="e.g. HackMIT 2025" value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="input-premium w-full px-3.5 py-2.5 text-[13px] rounded-xl" />
              </Field>

              <Field label="Event Link">
                <div className="relative">
                  <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="url" placeholder="https://…" value={formLink}
                    onChange={e => setFormLink(e.target.value)}
                    className="input-premium w-full pl-9 pr-3.5 py-2.5 text-[13px] rounded-xl" />
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Deadline Date" required>
                  <input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)}
                    className="input-premium w-full px-3.5 py-2.5 text-[13px] rounded-xl" />
                </Field>
                <Field label="Deadline Time" required>
                  <input type="time" required value={formTime} onChange={e => setFormTime(e.target.value)}
                    className="input-premium w-full px-3.5 py-2.5 text-[13px] rounded-xl" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Priority">
                  <select value={formPriority} onChange={e => setFormPriority(e.target.value)}
                    className="input-premium w-full px-3.5 py-2.5 text-[13px] rounded-xl cursor-pointer">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value)}
                    className="input-premium w-full px-3.5 py-2.5 text-[13px] rounded-xl cursor-pointer">
                    <option value="pending">Pending</option>
                    <option value="applied">Registered</option>
                    <option value="interviewing">Building</option>
                    <option value="offered">Winner</option>
                    <option value="rejected">Completed</option>
                  </select>
                </Field>
              </div>

              <Field label="Notes">
                <textarea rows={5} placeholder="Project ideas, team, requirements…" value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="input-premium w-full px-3.5 py-2.5 text-[13px] rounded-xl resize-none leading-relaxed" />
              </Field>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn-ghost flex-1 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="btn-primary flex-1 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer">
                  {editingApp ? 'Save Changes' : 'Add Hackathon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteConfirmId && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-surface w-full max-w-sm rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 size={16} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-white">Delete Hackathon</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">This cannot be undone</p>
              </div>
            </div>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              Are you sure you want to delete this hackathon? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="btn-ghost flex-1 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer">Keep It</button>
              <button onClick={handleConfirmDelete} className="btn-danger flex-1 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAILS MODAL ── */}
      {selectedAppDetails && (
        <AppDetailModal 
          app={selectedAppDetails} 
          onClose={() => setSelectedAppDetails(null)} 
          onEdit={handleOpenEdit} 
          nearestAppId={nearestAppId} 
        />
      )}
    </div>
  );
}

/* ── Utility sub-components ── */
function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3 text-[13px]">
      <span className="mt-0.5">{icon}</span>
      <span className="text-slate-500 shrink-0 w-16">{label}</span>
      <span className="text-slate-200 font-medium flex-1">{children}</span>
    </div>
  );
}

/* ── HACKATHON CARD ── */
function HackathonCard({ app, isNearest, onEdit, onDelete, onViewDetails }) {
  const priority = getPriorityStyles(app.priority);
  const status = getStatusStyles(app.status);

  const getTimeRemaining = (deadlineStr) => {
    const diffTime = new Date(deadlineStr) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `Expired ${Math.abs(diffDays)}d ago`, isUrgent: false, isExpired: true };
    if (diffDays === 0) return { text: 'Due today', isUrgent: true, isExpired: false };
    if (diffDays === 1) return { text: 'Due tomorrow', isUrgent: true, isExpired: false };
    if (diffDays <= 4) return { text: `${diffDays}d left`, isUrgent: true, isExpired: false };
    return { text: `${diffDays}d left`, isUrgent: false, isExpired: false };
  };

  const remaining = getTimeRemaining(app.deadline);

  return (
    <article
      onClick={() => onViewDetails && onViewDetails(app)}
      className={`glass-card rounded-2xl cursor-pointer select-none group ${
        isNearest ? 'glow-nearest border-amber-500/30' :
        app.priority === 'high' ? 'glow-high border-rose-500/25' : ''
      }`}
    >
      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {isNearest && <span className="beacon-amber" />}
              {app.priority === 'high' && !isNearest && <span className="beacon-red" />}
              <h4 className="text-[14px] font-bold text-white leading-tight truncate">{app.name}</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {isNearest && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full
                                 bg-amber-400/10 text-amber-300 border border-amber-400/20 animate-pulse">
                  ⚡ Soonest
                </span>
              )}
              <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full border ${priority.bg} ${priority.text} ${priority.border}`}>
                {priority.label}
              </span>
              <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full border ${status.bg} ${status.text} ${status.border}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Actions — always visible, pop on hover */}
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            {app.link && (
              <a href={app.link} target="_blank" rel="noreferrer"
                 className="p-1.5 text-slate-600 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all cursor-pointer"
                 title="Open link">
                <ExternalLink size={12} />
              </a>
            )}
            <button onClick={() => onEdit(app)}
              className="p-1.5 text-slate-600 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/[0.08] transition-all cursor-pointer"
              title="Edit">
              <Edit3 size={12} />
            </button>
            <button onClick={() => onDelete(app.id)}
              className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-rose-500/[0.08] transition-all cursor-pointer"
              title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Deadline strip */}
        <div className="flex items-center gap-3 pt-3 border-t border-white/[0.04] text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Calendar size={11} className="text-indigo-400/70" />
            {formatDate(app.deadline)}
          </span>
          <span className={`flex items-center gap-1 font-semibold ${
            remaining.isExpired ? 'text-slate-600' :
            remaining.isUrgent ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            <Clock size={11} />
            {remaining.text}
          </span>
        </div>

        {/* Notes preview */}
        {app.notes && (
          <p className="text-[11px] text-slate-500 leading-relaxed mt-3 line-clamp-2 whitespace-pre-line">
            {app.notes}
          </p>
        )}
      </div>
    </article>
  );
}

/* ── App Detail Modal with smooth transitions ──────────────── */
function AppDetailModal({ app, onClose, onEdit, nearestAppId }) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <div className={`modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`modal-surface w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh] ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h3 className="text-[15px] font-bold text-white leading-snug">{app.name}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {app.id === nearestAppId && (
                <span className="tag-pill text-amber-300 border-amber-500/25 bg-amber-500/10">⚡ Soonest</span>
              )}
              <span className={`tag-pill ${getPriorityStyles(app.priority).text}`}>
                {getPriorityStyles(app.priority).label}
              </span>
              <span className={`tag-pill ${getStatusStyles(app.status).text}`}>
                {getStatusStyles(app.status).label}
              </span>
            </div>
          </div>
          <button onClick={handleClose} className="btn-ghost p-2 rounded-lg cursor-pointer"><X size={15} /></button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {app.deadline && (
            <InfoRow icon={<Calendar size={13} className="text-indigo-400" />} label="Deadline">
              {formatDate(app.deadline)}
            </InfoRow>
          )}
          {app.link && (
            <InfoRow icon={<LinkIcon size={13} className="text-indigo-400" />} label="Link">
              <a href={app.link} target="_blank" rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 break-all">
                {app.link}
                <ExternalLink size={10} />
              </a>
            </InfoRow>
          )}
          <div className="divider" />
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Notes</p>
            <div className="glass-panel rounded-xl p-4 text-[13px] text-slate-300 whitespace-pre-line leading-relaxed min-h-[80px]">
              {app.notes || <span className="text-slate-650 italic">No notes added.</span>}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.04] flex gap-3">
          <button onClick={() => { onEdit(app); onClose(); }}
            className="btn-primary flex-1 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer">Edit Details</button>
          <button onClick={handleClose}
            className="btn-ghost py-2.5 px-5 text-[13px] font-semibold rounded-xl cursor-pointer">Close</button>
        </div>
      </div>
    </div>
  );
}
