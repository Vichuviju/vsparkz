import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

const TASK_TYPES = ['seo', 'social', 'influencer', 'ads'];
const STATUS_OPTIONS = ['pending', 'in_progress', 'review', 'completed'];

const WORKFLOW_LABELS = {
  project_initialized: 'Project Initialized',
  requirement_gathering: 'Requirement Gathering',
  quotation_processing: 'Quotation Processing',
  quotation_generated: 'Quotation Generated',
  quotation_rejected: 'Quotation Rejected',
  quotation_resubmitted: 'Quotation Resubmitted',
  agreement_generation: 'Agreement Generation',
  agreement_rework: 'Agreement Rework',
  work_in_progress: 'Work in Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

// Colors mapping for column badges
const COLUMN_STYLES = {
  pending: {
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700/60',
    indicator: 'bg-slate-400',
    label: 'To Do',
  },
  in_progress: {
    bg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-100 dark:border-blue-800/40',
    indicator: 'bg-blue-500',
    label: 'In Progress',
  },
  review: {
    bg: 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-100 dark:border-amber-800/40',
    indicator: 'bg-amber-500',
    label: 'Under Review',
  },
  completed: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/40',
    indicator: 'bg-emerald-500',
    label: 'Completed',
  },
};

// Initial colors for user avatars
const USER_COLORS = [
  'bg-blue-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-emerald-600',
  'bg-teal-600',
  'bg-amber-600',
];

export function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  
  // Tab control: 'overview', 'board', 'list'
  const [activeTab, setActiveTab] = useState('board');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssigneeId, setFilterAssigneeId] = useState(null);
  const [filterMyTasks, setFilterMyTasks] = useState(false);

  // Task creation/update forms
  const [quickAddTitles, setQuickAddTitles] = useState({ pending: '', in_progress: '', review: '', completed: '' });
  const [activeQuickAddColumn, setActiveQuickAddColumn] = useState(null);
  const [editingTask, setEditingTask] = useState(null); // task object currently in detail modal
  const [saving, setSaving] = useState(false);
  const [workflowSaving, setWorkflowSaving] = useState(false);

  // Drag state
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [hoveredColumn, setHoveredColumn] = useState(null);

  // Current user helper
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchProject = () => {
    if (!id) return;
    setLoading(true);
    api.get(`/admin/projects/${id}`)
      .then(({ data }) => setProject(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load project'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProject();
    api.get('/admin/users').then(({ data }) => {
      setUsers(Array.isArray(data) ? data : []);
    }).catch(() => setUsers([]));

    // Try to deduce current logged in user from localStorage if present
    try {
      const storedUser = localStorage.getItem('vsparkz_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u && u.id) setCurrentUserId(u.id);
      }
    } catch {
      // ignore
    }
  }, [id]);

  const addTask = async (e, customFields = {}) => {
    if (e) e.preventDefault();
    if (!project?.id) return;
    setSaving(true);
    const payload = {
      type: customFields.type || 'seo',
      title: customFields.title || '',
      status: customFields.status || 'pending',
      due_date: customFields.due_date || null,
      assigned_to: customFields.assigned_to ? parseInt(customFields.assigned_to, 10) : null
    };

    try {
      await api.post(`/admin/projects/${project.id}/tasks`, payload);
      fetchProject();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add task');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAddSubmit = async (column) => {
    const title = quickAddTitles[column]?.trim();
    if (!title) return;
    const success = await addTask(null, { title, status: column, type: 'seo' });
    if (success) {
      setQuickAddTitles(prev => ({ ...prev, [column]: '' }));
      setActiveQuickAddColumn(null);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      await api.put(`/admin/project-tasks/${taskId}`, updates);
      fetchProject();
      // Keep modal updated if active
      if (editingTask && editingTask.id === taskId) {
        setEditingTask(prev => ({ ...prev, ...updates }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Remove this task?')) return;
    try {
      await api.delete(`/admin/project-tasks/${taskId}`);
      if (editingTask && editingTask.id === taskId) {
        setEditingTask(null);
      }
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const setWorkflowStatus = async (workflowStatus) => {
    if (!project?.id) return;
    setWorkflowSaving(true);
    setError(null);
    try {
      await api.patch(`/admin/projects/${project.id}`, { workflow_status: workflowStatus });
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update workflow');
    } finally {
      setWorkflowSaving(false);
    }
  };

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    if (hoveredColumn !== column) {
      setHoveredColumn(column);
    }
  };

  const handleDragLeave = () => {
    setHoveredColumn(null);
  };

  const handleDrop = async (e, column) => {
    e.preventDefault();
    setHoveredColumn(null);
    const taskIdStr = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr, 10);
    
    // Optimistic UI state update
    if (project) {
      const updatedTasks = (project.project_tasks || []).map(t => 
        t.id === taskId ? { ...t, status: column } : t
      );
      setProject(prev => ({ ...prev, project_tasks: updatedTasks }));
    }
    
    await updateTask(taskId, { status: column });
    setDraggingTaskId(null);
  };

  if (loading && !project) return <div className="p-8 text-center text-text-muted">Loading…</div>;
  if (error && !project) return <div className="p-8"><div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright">{error}</div><Link to="/projects" className="text-accent hover:underline">Back to Projects</Link></div>;
  if (!project) return null;

  const tasks = project.project_tasks || project.projectTasks || [];

  // Filter Tasks list
  const filteredTasks = tasks.filter(t => {
    const titleMatch = !searchTerm || t.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const assigneeMatch = !filterAssigneeId || t.assigned_to === filterAssigneeId;
    const selfMatch = !filterMyTasks || (t.assigned_to === currentUserId);
    return titleMatch && assigneeMatch && selfMatch;
  });

  // Unique assignees actually holding tasks inside this project
  const projectAssignees = Array.from(new Set(tasks.map(t => t.assigned_to).filter(Boolean)))
    .map(userId => users.find(u => u.id === userId))
    .filter(Boolean);

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  };

  const getUserColorClass = (userId) => {
    return USER_COLORS[userId % USER_COLORS.length];
  };

  // Icon Mappers
  const renderTypeIcon = (type) => {
    switch (type) {
      case 'seo':
        return (
          <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 inline-block" title="SEO Task">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        );
      case 'social':
        return (
          <span className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 inline-block" title="Social Media Task">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </span>
        );
      case 'influencer':
        return (
          <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 inline-block" title="Influencer Task">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c-.195-.39-.623-.53-.984-.282L3.13 8.358A1.5 1.5 0 002.25 9.6v5.8c0 .546.295 1.05.772 1.316l7.366 4.143a.998.998 0 00.984-.282l.86-.86a1.5 1.5 0 00.44-1.06v-5.263l4.772 2.686a1.5 1.5 0 002.23-1.316v-5.8c0-.546-.295-1.05-.772-1.316L11.48 3.5z" />
            </svg>
          </span>
        );
      case 'ads':
      default:
        return (
          <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 inline-block" title="Paid Ads Task">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
            <Link to="/projects" className="hover:text-blue-500 transition-colors">Projects</Link>
            <span>/</span>
            <span className="text-slate-400">Workspace</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 tracking-tight">{project.name}</h1>
          <p className="text-text-muted text-sm mt-1">
            Client:{' '}
            <Link to={`/clients/${project.client_id}`} className="text-blue-500 font-semibold hover:underline">
              {project.client?.company_name ?? `ID: ${project.client_id}`}
            </Link>
            {' · '}
            Status:{' '}
            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400">
              {project.status}
            </span>
            {' · '}
            Workflow:{' '}
            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {WORKFLOW_LABELS[project.workflow_status] ?? project.workflow_status}
            </span>
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/40 w-fit shrink-0">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'board'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Overview
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-medium animate-fade-in">
          {error}
        </div>
      )}

      {/* Overview/Workflow Helper Blocks */}
      {project.workflow_status === 'requirement_gathering' && (
        <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-500/20">
          <span className="text-text-primary text-sm font-medium">📋 Requirement gathering is currently in progress. When done, update status to Quotation.</span>
          <button
            type="button"
            disabled={workflowSaving}
            onClick={() => setWorkflowStatus('quotation_processing')}
            className="btn-primary px-4 py-2 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <span>Complete Requirements</span>
          </button>
        </div>
      )}

      {project.workflow_status === 'quotation_processing' && (
        <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-500/20">
          <span className="text-text-primary text-sm font-medium">💰 Project is ready for pricing. Create a quotation for the client to review.</span>
          <Link to={`/quotations?project_id=${project.id}`} className="btn-primary px-4 py-2 text-xs font-bold">
            Create Quotation
          </Link>
        </div>
      )}

      {/* TAB CONTENTS */}
      
      {/* 1. KANBAN BOARD TAB */}
      {activeTab === 'board' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="glass-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-slate-100 dark:border-white/5">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              
              {/* Search Bar */}
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Filter tasks by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              {/* Assignees Filter bubbles */}
              {projectAssignees.length > 0 && (
                <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700/60 pl-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mr-1">Assignees:</span>
                  <div className="flex -space-x-1">
                    {projectAssignees.map(user => {
                      const isActive = filterAssigneeId === user.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => setFilterAssigneeId(isActive ? null : user.id)}
                          className={`w-7 h-7 rounded-full text-[9px] font-black text-white flex items-center justify-center border-2 uppercase transition-all ${getUserColorClass(user.id)} ${
                            isActive ? 'border-blue-500 scale-110 z-10' : 'border-white dark:border-slate-900 hover:scale-105'
                          }`}
                          title={`Filter by ${user.name}`}
                        >
                          {getInitials(user.name)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Filter My Tasks toggle */}
              {currentUserId && (
                <button
                  type="button"
                  onClick={() => setFilterMyTasks(!filterMyTasks)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    filterMyTasks
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Only My Tasks
                </button>
              )}

            </div>

            {/* Clear filters shortcut */}
            {(searchTerm || filterAssigneeId || filterMyTasks) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterAssigneeId(null);
                  setFilterMyTasks(false);
                }}
                className="text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-wider"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Kanban Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start select-none">
            {STATUS_OPTIONS.map(status => {
              const colTasks = filteredTasks.filter(t => t.status === status);
              const isHovered = hoveredColumn === status;
              const style = COLUMN_STYLES[status];

              return (
                <div
                  key={status}
                  onDragOver={(e) => handleDragOver(e, status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status)}
                  className={`rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-900/20 border-2 transition-all min-h-[450px] flex flex-col ${
                    isHovered
                      ? 'border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/10 scale-[1.01] shadow-lg'
                      : 'border-slate-100 dark:border-slate-800/40'
                  }`}
                >
                  
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3.5 px-1 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${style.indicator}`} />
                      <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {style.label}
                      </h3>
                    </div>
                    <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Column Cards Container */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                    {colTasks.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-600 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        No tasks
                      </div>
                    ) : (
                      colTasks.map(task => {
                        const taskUser = users.find(u => u.id === task.assigned_to);
                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-600 transition-all group relative"
                          >
                            {/* Card Content */}
                            <div className="flex justify-between items-start gap-2">
                              <span
                                onClick={() => setEditingTask(task)}
                                className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-500 cursor-pointer transition-colors break-words leading-relaxed"
                              >
                                {task.title}
                              </span>
                            </div>

                            {/* Card Details/Footer */}
                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 shrink-0">
                              <div className="flex items-center gap-1.5">
                                {renderTypeIcon(task.type)}
                                {task.due_date && (
                                  <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                    {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Card hover quick edit/delete controls */}
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity duration-150 absolute right-2 bottom-2 bg-white dark:bg-slate-800 pl-2 rounded-xl">
                                  <button
                                    onClick={() => setEditingTask(task)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    title="Edit details"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                                    title="Remove task"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                  </button>
                                </div>

                                {taskUser ? (
                                  <span
                                    className={`w-6 h-6 rounded-full text-[9px] font-black text-white flex items-center justify-center uppercase select-none ${getUserColorClass(taskUser.id)}`}
                                    title={`Assigned to ${taskUser.name}`}
                                  >
                                    {getInitials(taskUser.name)}
                                  </span>
                                ) : (
                                  <span
                                    className="w-6 h-6 rounded-full border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 flex items-center justify-center text-[10px] select-none"
                                    title="Unassigned"
                                  >
                                    —
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Column Quick Add Task */}
                  <div className="mt-2 shrink-0">
                    {activeQuickAddColumn === status ? (
                      <div className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 animate-fade-in shadow-sm">
                        <textarea
                          placeholder="What needs to be done?"
                          rows={2}
                          value={quickAddTitles[status]}
                          onChange={(e) => setQuickAddTitles(prev => ({ ...prev, [status]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleQuickAddSubmit(status);
                            }
                          }}
                          className="w-full px-2.5 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg focus:outline-none"
                          autoFocus
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleQuickAddSubmit(status)}
                            className="btn-primary px-3 py-1.5 text-[10px] font-bold"
                          >
                            Add Task
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveQuickAddColumn(null);
                              setQuickAddTitles(prev => ({ ...prev, [status]: '' }));
                            }}
                            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveQuickAddColumn(status)}
                        className="w-full py-2 hover:bg-white dark:hover:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>Add Task</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. FLAT LIST TABLE VIEW TAB */}
      {activeTab === 'list' && (
        <div className="glass-card overflow-hidden border border-slate-100 dark:border-white/5">
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800/40 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Project Tasks List</h2>
            
            {/* Inline Quick Add for List Tab */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const title = e.currentTarget.elements.listTitle.value?.trim();
              if (!title) return;
              const success = await addTask(null, { title, status: 'pending', type: 'seo' });
              if (success) e.currentTarget.reset();
            }} className="flex items-center gap-2">
              <input
                type="text"
                name="listTitle"
                required
                placeholder="Quick add new task title..."
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
              <button type="submit" disabled={saving} className="btn-primary px-3 py-1.5 text-xs font-bold">
                Add Task
              </button>
            </form>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-left border-b border-slate-100 dark:border-slate-800/40">
                <th className="px-5 py-3 text-slate-500 dark:text-text-muted font-bold text-xs uppercase tracking-wider">Title</th>
                <th className="px-5 py-3 text-slate-500 dark:text-text-muted font-bold text-xs uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-slate-500 dark:text-text-muted font-bold text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-slate-500 dark:text-text-muted font-bold text-xs uppercase tracking-wider">Due Date</th>
                <th className="px-5 py-3 text-slate-500 dark:text-text-muted font-bold text-xs uppercase tracking-wider">Assignee</th>
                <th className="px-5 py-3 text-slate-500 dark:text-text-muted font-bold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-slate-400 dark:text-slate-600 text-center font-medium">
                    No tasks created for this project yet.
                  </td>
                </tr>
              ) : (
                tasks.map(t => (
                  <tr key={t.id} className="border-t border-slate-100 dark:border-navy-600/30 hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td className="px-5 py-3.5 text-slate-800 dark:text-text-primary font-semibold">{t.title}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-text-muted uppercase text-xs font-bold">{t.type}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={t.status}
                        onChange={(e) => updateTask(t.id, { status: e.target.value })}
                        className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-text-primary"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{COLUMN_STYLES[s]?.label ?? s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-text-muted text-xs font-medium">
                      {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={t.assigned_to || ''}
                        onChange={(e) => updateTask(t.id, { assigned_to: e.target.value ? parseInt(e.target.value, 10) : null })}
                        className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-text-primary"
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingTask(t)}
                          className="text-blue-500 hover:text-blue-600 font-bold text-xs"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(t.id)}
                          className="text-rose-500 hover:text-rose-600 font-bold text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. OVERVIEW DETAIL TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Details Card */}
          <div className="glass-card p-6 border border-slate-100 dark:border-white/5 space-y-4 lg:col-span-2">
            <h2 className="font-extrabold text-xs text-slate-500 dark:text-text-muted uppercase tracking-wider">Project Specifications</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">Campaign Type</dt>
                <dd className="text-slate-800 dark:text-text-primary font-bold text-sm bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 uppercase">
                  {project.campaign_type || 'General Campaign'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">Status Code</dt>
                <dd className="text-slate-800 dark:text-text-primary font-bold text-sm bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 uppercase">
                  {project.status}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">Timeline Start</dt>
                <dd className="text-slate-800 dark:text-text-primary font-semibold text-sm">
                  {project.start_date ? new Date(project.start_date).toLocaleDateString(undefined, { dateStyle: 'full' }) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">Timeline End</dt>
                <dd className="text-slate-800 dark:text-text-primary font-semibold text-sm">
                  {project.end_date ? new Date(project.end_date).toLocaleDateString(undefined, { dateStyle: 'full' }) : '—'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Workflow Status Timeline */}
          <div className="glass-card p-6 border border-slate-100 dark:border-white/5 space-y-4">
            <h2 className="font-extrabold text-xs text-slate-500 dark:text-text-muted uppercase tracking-wider">Workflow Progression</h2>
            
            <div className="space-y-3">
              {Object.entries(WORKFLOW_LABELS).map(([key, value]) => {
                const isCurrent = project.workflow_status === key;
                return (
                  <button
                    key={key}
                    onClick={() => setWorkflowStatus(key)}
                    disabled={workflowSaving}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md font-bold'
                        : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{value}</span>
                    {isCurrent && (
                      <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* EDIT/DETAIL MODAL WINDOW */}
      {editingTask && (
        <div className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in overflow-y-auto z-[9999] bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 dark:border-slate-850/60 space-y-4 relative my-8">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Task Details</span>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">Edit Task</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-4">
              
              {/* Title input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => updateTask(editingTask.id, { title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                
                {/* Type selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Type</label>
                  <select
                    value={editingTask.type}
                    onChange={(e) => updateTask(editingTask.id, { type: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    {TASK_TYPES.map(t => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Status selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => updateTask(editingTask.id, { status: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{COLUMN_STYLES[s]?.label ?? s}</option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">

                {/* Due Date selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Due Date</label>
                  <input
                    type="date"
                    value={editingTask.due_date ? editingTask.due_date.slice(0, 10) : ''}
                    onChange={(e) => updateTask(editingTask.id, { due_date: e.target.value || null })}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>

                {/* Assignee selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assignee</label>
                  <select
                    value={editingTask.assigned_to || ''}
                    onChange={(e) => updateTask(editingTask.id, { assigned_to: e.target.value ? parseInt(e.target.value, 10) : null })}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => deleteTask(editingTask.id)}
                className="px-4 py-2 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <span>Delete Task</span>
              </button>

              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="btn-primary px-5 py-2 text-xs font-bold shadow-sm"
              >
                Close & Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
