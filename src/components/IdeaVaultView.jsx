import React, { useState, useRef } from 'react';
import { 
  Plus, Search, Tag, Image as ImageIcon, Trash2, Edit3, 
  X, Calendar, AlertTriangle, Hash, FileImage, Link as LinkIcon, Database,
  Lightbulb
} from 'lucide-react';
import { uploadIdeaImage, isConfigured } from '../services/supabase';
import { formatDate } from '../utils/helpers';

export default function IdeaVaultView({ 
  ideas, 
  onAdd, 
  onUpdate, 
  onDelete, 
  loading
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Form Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formTagsString, setFormTagsString] = useState('');
  
  // Image Upload States
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Detailed View State
  const [selectedIdeaDetails, setSelectedIdeaDetails] = useState(null);

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormImageUrl('');
    setFormTagsString('');
    setUploadingFile(false);
    setUploadError('');
    setEditingIdea(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (idea) => {
    setEditingIdea(idea);
    setFormTitle(idea.title);
    setFormContent(idea.content || '');
    setFormImageUrl(idea.image_url || '');
    setFormTagsString(idea.tags ? idea.tags.join(', ') : '');
    setIsFormOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (limit to 4MB for standard prototypes)
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('Image size exceeds 4MB limit.');
      return;
    }

    setUploadingFile(true);
    setUploadError('');

    try {
      const publicUrl = await uploadIdeaImage(file);
      setFormImageUrl(publicUrl);
    } catch (err) {
      console.error('File upload failure:', err);
      setUploadError(
        'Failed to upload. Make sure a PUBLIC storage bucket named "idea-images" is created on your Supabase dashboard.'
      );
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    // Parse comma-separated tags
    const parsedTags = formTagsString
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && !tag.startsWith('#'))
      .map(tag => tag.replace(/[^a-zA-Z0-9]/g, '')); // clean tags

    const ideaPayload = {
      title: formTitle.trim(),
      content: formContent.trim(),
      image_url: formImageUrl.trim(),
      tags: parsedTags,
    };

    if (editingIdea) {
      await onUpdate(editingIdea.id, ideaPayload);
    } else {
      await onAdd(ideaPayload);
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

  // --- Filtering Ideas ---
  const allTags = Array.from(new Set((ideas || []).flatMap(idea => (idea && idea.tags) || [])));

  const filteredIdeas = (ideas || []).filter(idea => {
    if (!idea) return false;
    const matchesSearch = 
      (idea.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (idea.content && idea.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = !selectedTag || (idea.tags && idea.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden bg-slate-950">
      
      {/* View Header */}
      <header className="px-8 py-5 border-b border-slate-900 bg-slate-950 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide font-sans">Idea Vault</h2>
          <p className="text-xs text-slate-500">Log and catalog creative thoughts, drafts, and designs</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus size={15} />
            Capture Idea
          </button>
        </div>
      </header>

      {/* Toolbar controls */}
      <section className="px-8 py-4 border-b border-slate-900 bg-slate-950/60 flex flex-wrap gap-4 items-center justify-between shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search ideas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs text-white bg-slate-900/40 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-500 transition-all font-medium"
            />
          </div>

          {selectedTag && (
            <span className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              Tag: #{selectedTag}
              <button 
                onClick={() => setSelectedTag('')}
                className="text-slate-450 hover:text-white ml-1 font-bold cursor-pointer"
              >
                <X size={10} />
              </button>
            </span>
          )}
        </div>

        {/* Dynamic Tags filter pill scroll */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 max-w-md overflow-x-auto pb-1 select-none">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0">Filter Tag:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                className={`px-2.5 py-1 text-[10px] font-semibold border rounded-lg transition-all shrink-0 cursor-pointer ${
                  tag === selectedTag
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    : 'bg-slate-900/40 text-slate-450 hover:text-slate-355 border-slate-900/60 hover:bg-slate-900'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs gap-2">
              <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
              Synchronizing vault...
            </div>
          ) : filteredIdeas.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-900 rounded-2xl max-w-md mx-auto my-12">
              <Lightbulb size={32} className="text-slate-650 mb-3 animate-pulse" />
              <h3 className="text-sm font-semibold text-slate-350">No ideas discovered</h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-normal">
                {searchTerm || selectedTag 
                  ? 'Try relaxing your search queries or tag selections.' 
                  : 'Start cataloging your thoughts by adding your first idea card.'}
              </p>
              {!searchTerm && !selectedTag && (
                <button
                  onClick={handleOpenAdd}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600/20 border border-indigo-500/25 rounded-xl transition-all"
                >
                  Log Creative Idea
                </button>
              )}
            </div>
          ) : (
            <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6 [column-fill:_auto]">
              {filteredIdeas.map((idea) => (
                <div key={idea.id} className="break-inside-avoid">
                  <IdeaCard 
                    idea={idea} 
                    onEdit={handleOpenEdit} 
                    onDelete={handleDeleteClick} 
                    onSelectTag={setSelectedTag} 
                    onViewDetails={setSelectedIdeaDetails}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

      {/* ================= EDIT / ADD CENTERED MODAL ================= */}
      {isFormOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsFormOpen(false)}
        >
          <div 
            className="w-full max-w-lg max-h-[90vh] bg-slate-950 border border-slate-900 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="p-6 border-b border-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingIdea ? 'Modify Creative Idea' : 'Capture New Idea'}
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Idea Vault</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Form Fields (Scrollable) */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350">
                  Idea Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-driven timeline dashboard"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-white bg-slate-900/60 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-650 transition-all font-medium"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350">Description & Details</label>
                <textarea
                  rows={8}
                  placeholder="Elaborate on your idea, write down details, frameworks, inspirations..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-white bg-slate-900/60 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-655 transition-all font-medium resize-none leading-relaxed"
                />
              </div>

              {/* Image Upload Area */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-355 flex items-center gap-1.5">
                  <ImageIcon size={12} className="text-slate-500" />
                  Visual Attachment (Image)
                </label>

                {/* Drag & Drop Upload Container */}
                <div className="p-4 border border-dashed border-slate-900 hover:border-slate-800 rounded-xl bg-slate-900/20 text-center space-y-2.5 transition-all">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mx-auto text-indigo-400">
                    <FileImage size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 block">
                      {uploadingFile ? 'Uploading files...' : 'Upload Local Image'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">PNG, JPG or WEBP up to 4MB</span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    disabled={uploadingFile}
                    className="hidden"
                    id="idea-image-file-input"
                  />
                  <label
                    htmlFor="idea-image-file-input"
                    className="inline-flex py-1.5 px-3.5 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-600/25 border border-indigo-500/20 rounded-lg cursor-pointer transition-all"
                  >
                    Select File
                  </label>
                </div>

                {/* External Image URL Alternative */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-550 block text-center">--- OR ENTER EXTERNAL LINK ---</span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <LinkIcon size={11} />
                    </span>
                    <input
                      type="url"
                      placeholder="Paste image web URL (https://...)"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 text-[11px] text-white bg-slate-900/60 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-650 transition-all"
                    />
                  </div>
                </div>

                {uploadError && (
                  <p className="text-[10px] text-amber-400 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 flex items-start gap-1 leading-normal">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    {uploadError}
                  </p>
                )}

                {/* Preview Image If Attached */}
                {formImageUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/40">
                    <img 
                      src={formImageUrl} 
                      alt="Vault Attachment Preview" 
                      className="max-h-48 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormImageUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 flex items-center gap-1.5">
                  <Tag size={12} className="text-slate-550" />
                  Category Tags
                </label>
                <input
                  type="text"
                  placeholder="design, startup, side-project (comma-separated)"
                  value={formTagsString}
                  onChange={(e) => setFormTagsString(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-white bg-slate-900/60 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-650 transition-all font-medium"
                />
              </div>

              {/* Actions */}
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
                  disabled={uploadingFile}
                  className={`flex-1 py-3 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer ${
                    uploadingFile && 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {editingIdea ? 'Save Changes' : 'Capture Idea'}
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
              <h3 className="text-sm font-bold text-white">Delete Idea Card</h3>
            </div>
            
            <p className="text-xs text-slate-455 leading-relaxed">
              Are you sure you want to delete this idea card? This action is permanent and cannot be undone on Supabase.
            </p>
 
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 px-3 text-xs font-bold text-slate-455 hover:text-white bg-slate-900 hover:bg-slate-800/80 border border-slate-850 rounded-xl transition-all cursor-pointer"
              >
                Keep Card
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl shadow-lg shadow-rose-600/10 transition-all cursor-pointer"
              >
                Delete Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= IDEA DETAILS CENTERED MODAL ================= */}
      {selectedIdeaDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setSelectedIdeaDetails(null)}
        >
          <div 
            className="w-full max-w-lg bg-slate-950 border border-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image header if exists */}
            {selectedIdeaDetails.image_url && (
              <div className="relative w-full max-h-64 overflow-hidden bg-slate-950 shrink-0">
                <img 
                  src={selectedIdeaDetails.image_url} 
                  alt={selectedIdeaDetails.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {/* Header Title & controls */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">{selectedIdeaDetails.title}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Idea Vault Details</p>
                </div>
                <button 
                  onClick={() => setSelectedIdeaDetails(null)}
                  className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Description */}
              {selectedIdeaDetails.content && (
                <div className="space-y-2 border-t border-slate-900/60 pt-4">
                  <h4 className="text-xs font-semibold text-slate-400">Description & Details</h4>
                  <div className="p-4 bg-slate-900/30 border border-slate-900/50 rounded-xl text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                    {selectedIdeaDetails.content}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedIdeaDetails.tags && selectedIdeaDetails.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-t border-slate-900/60 pt-4">
                  {selectedIdeaDetails.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer details */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-550 border-t border-slate-900/60 pt-4">
                <Calendar size={11} className="text-indigo-400" />
                <span>Logged on {formatDate(selectedIdeaDetails.created_at || new Date())}</span>
              </div>
            </div>

            {/* Actions footer */}
            <div className="p-6 border-t border-slate-900/80 bg-slate-950 flex gap-3 shrink-0">
              <button
                onClick={() => {
                  handleOpenEdit(selectedIdeaDetails);
                  setSelectedIdeaDetails(null);
                }}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10 text-center"
              >
                Edit Details
              </button>
              <button
                onClick={() => setSelectedIdeaDetails(null)}
                className="py-2.5 px-6 text-xs font-bold text-slate-450 hover:text-white bg-slate-900 border border-slate-900 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ================= COMPONENT: IDEA CARD ================= */
function IdeaCard({ idea, onEdit, onDelete, onSelectTag, onViewDetails }) {
  return (
    <article 
      onClick={() => onViewDetails && onViewDetails(idea)}
      className="glass-card rounded-2xl overflow-hidden border border-slate-800/50 hover:border-slate-800/90 hover:bg-slate-900/10 cursor-pointer shadow-md transition-all hover:scale-[1.005] select-none group"
    >
      
      {/* Attached visual display */}
      {idea.image_url && (
        <div className="relative overflow-hidden w-full bg-slate-950 max-h-56">
          <img 
            src={idea.image_url} 
            alt={idea.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      )}

      {/* Card Content body */}
      <div className="p-5 space-y-3.5">
        
        {/* Header Title & controls */}
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-bold text-white leading-snug">{idea.title}</h4>
          
          <div 
            className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onEdit(idea)}
              className="p-1 text-slate-455 hover:text-white rounded hover:bg-slate-900 transition-all cursor-pointer"
              title="Edit idea"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={() => onDelete(idea.id)}
              className="p-1 text-slate-455 hover:text-rose-400 rounded hover:bg-slate-900 transition-all cursor-pointer"
              title="Delete idea card"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Text descriptions */}
        {idea.content && (
          <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-line">
            {idea.content}
          </p>
        )}

        {/* Tags lists */}
        {idea.tags && idea.tags.length > 0 && (
          <div 
            className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-900/60"
            onClick={(e) => e.stopPropagation()}
          >
            {idea.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onSelectTag(tag)}
                className="px-2 py-0.5 text-[9px] font-bold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-650 border border-indigo-500/20 rounded-md transition-all cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-550 pt-1">
          <Calendar size={10} className="text-slate-550" />
          <span>Logged {formatDate(idea.created_at || new Date())}</span>
        </div>

      </div>

    </article>
  );
}
