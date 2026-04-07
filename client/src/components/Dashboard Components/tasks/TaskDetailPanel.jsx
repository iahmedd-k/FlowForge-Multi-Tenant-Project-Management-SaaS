import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Zap, MessageSquare, AlertCircle } from 'lucide-react';
import { getTask, updateTask, addComment, deleteTask } from '../../../api/tasks.api';
import { getProject } from '../../../api/projects.api';
import { getAutomations } from '../../../api/automations.api';
import { useAuth } from '../../../hooks/useAuth';
import { DatePicker } from '../../ui/DatePicker';
import Spinner from '../ui/Spinner';
import TimeTrackerButton from '../../../components/TimeTrackerButton';
import TimeLogList from '../../../components/TimeLogList';

const STATUS_OPTIONS = [
  { value: 'backlog', label: '📋 Not Started' },
  { value: 'in_progress', label: '🔄 Working on it' },
  { value: 'review', label: '👀 In Review' },
  { value: 'done', label: '✅ Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: '🟢 Low' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'high', label: '🟠 High' },
  { value: 'urgent', label: '🔴 Urgent' },
];

const AUTOMATION_DESCRIPTIONS = {
  task_assignment_notification: 'Task assignment notification will trigger',
  status_change_completion: 'Task completion automation will trigger',
  review_stage_alert: 'Review stage alert will notify admins',
  priority_based_alert: 'Priority alert will notify admins',
};

function FieldLabel({ children }) {
  return <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">{children}</p>;
}

function InputField(props) {
  return (
    <input
      {...props}
      className={`h-9 w-full rounded-[8px] border border-[#e5e7eb] bg-white px-2.5 text-[12px] text-[#1f2a44] outline-none transition focus:border-[#9ec5ff] focus:shadow-[0_0_0_3px_rgba(0,115,234,0.08)] ${props.className || ''}`}
    />
  );
}

function SelectField({ children, className = '', ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`h-9 w-full appearance-none rounded-[8px] border border-[#e5e7eb] bg-white px-2.5 pr-8 text-[12px] text-[#1f2a44] outline-none transition focus:border-[#9ec5ff] focus:shadow-[0_0_0_3px_rgba(0,115,234,0.08)] ${className}`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-[#9ca3af]">
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6.5 8 10l4-3.5" />
        </svg>
      </span>
    </div>
  );
}

function TextareaField({ autoGrow = false, className = '', ...props }) {
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (!autoGrow || !textAreaRef.current) return;
    textAreaRef.current.style.height = 'auto';
    textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
  }, [autoGrow, props.value]);

  return (
    <textarea
      ref={textAreaRef}
      {...props}
      className={`w-full rounded-[8px] border border-[#e5e7eb] bg-white px-2.5 py-2 text-[12px] leading-5 text-[#1f2a44] outline-none transition focus:border-[#9ec5ff] focus:shadow-[0_0_0_3px_rgba(0,115,234,0.08)] ${className}`}
    />
  );
}

function calculateTriggeredAutomations(task, newFormData, activeAutomations) {
  if (!task || !activeAutomations) return [];
  const triggered = [];

  // Check task assignment
  if (newFormData.assignedTo && String(newFormData.assignedTo) !== String(task.assignedTo?._id || task.assignedTo || '')) {
    if (activeAutomations.find((a) => a.key === 'task_assignment_notification' && a.isActive)) {
      triggered.push('task_assignment_notification');
    }
  }

  // Check status change
  if (newFormData.status && newFormData.status !== task.status) {
    if (newFormData.status === 'done' && activeAutomations.find((a) => a.key === 'status_change_completion' && a.isActive)) {
      triggered.push('status_change_completion');
    }
    if (newFormData.status === 'review' && activeAutomations.find((a) => a.key === 'review_stage_alert' && a.isActive)) {
      triggered.push('review_stage_alert');
    }
  }

  return triggered;
}

export default function TaskDetailPanel({ taskId, projectId, onClose }) {
  const { isManager, canDeleteTask, currentRole, user, workspace } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [commentMessage, setCommentMessage] = useState(null);
  const [form, setForm] = useState({
    title: '',
    status: 'backlog',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    description: '',
  });

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId).then((res) => res.data.data.task),
    enabled: Boolean(taskId),
  });

  const { data: projectMembers = [] } = useQuery({
    queryKey: ['project', projectId, 'members'],
    queryFn: () => getProject(projectId).then((res) => res.data.data.project.members || []),
    staleTime: 30_000,
    enabled: Boolean(taskId && projectId),
  });

  const { data: automationsData } = useQuery({
    queryKey: ['automations', workspace?._id],
    queryFn: () => getAutomations(workspace?._id).then((res) => res.data.data),
    enabled: Boolean(workspace?._id),
  });

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title || '',
      status: task.status || 'backlog',
      priority: task.priority || 'medium',
      assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      description: task.description || '',
    });
  }, [task]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['tasks', projectId] });
    qc.invalidateQueries({ queryKey: ['task', taskId] });
    qc.invalidateQueries({ queryKey: ['calendar-tasks'] });
    qc.invalidateQueries({ queryKey: ['report-summary'] });
    qc.invalidateQueries({ queryKey: ['report-overdue'] });
    qc.invalidateQueries({ queryKey: ['projects'] });
  };

  const { mutate: saveTask, isPending: saving } = useMutation({
    mutationFn: (payload) => updateTask(taskId, payload),
    onSuccess: invalidate,
  });

  const { mutate: postComment, isPending: commenting } = useMutation({
    mutationFn: () => addComment(taskId, comment),
    onSuccess: (res) => {
      const nextComment = res.data.data.comment;
      qc.setQueryData(['task', taskId], (current) => {
        if (!current) return current;
        return {
          ...current,
          comments: [...(current.comments || []), nextComment],
        };
      });
      setComment('');
      setCommentMessage(null);
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
    onError: (err) => {
      setCommentMessage(err.response?.data?.message || 'Unable to send comment right now.');
    },
  });

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: () => deleteTask(taskId),
    onSuccess: () => {
      invalidate();
      onClose();
    },
  });

  if (!taskId) return null;

  const isAssignee = String(task?.assignedTo?._id || '') === String(user?._id || '');
  const canEditTask = isManager || (currentRole === 'member' && isAssignee);
  const canEditManagerFields = isManager;
  const canComment = ['owner', 'admin', 'member', 'viewer'].includes(currentRole);

  const handleSave = () => {
    if (!canEditTask) return;
    
    const activeAutomations = automationsData?.automations || [];
    const triggeredAutomations = calculateTriggeredAutomations(task, form, activeAutomations);

    saveTask({
      title: form.title.trim(),
      status: form.status,
      priority: canEditManagerFields ? form.priority : undefined,
      assignedTo: canEditManagerFields ? (form.assignedTo || null) : undefined,
      dueDate: canEditManagerFields ? (form.dueDate || null) : undefined,
      description: form.description.trim(),
    });

    // Show automation feedback
    if (triggeredAutomations.length > 0) {
      const messages = triggeredAutomations
        .map((key) => AUTOMATION_DESCRIPTIONS[key] || key)
        .join(', ');
      
      setTimeout(() => {
        toast.success(`✓ Task saved. ${messages}.`, {
          icon: '⚡',
          duration: 4000,
        });
      }, 500);
    }
  };

  const handleCommentSubmit = () => {
    if (!canComment || !comment.trim() || commenting) return;
    
    // Check for mentions
    const mentionPattern = /(@\w+)/g;
    const mentions = comment.match(mentionPattern);
    
    setCommentMessage(null);
    postComment();

    // Show feedback for mentions
    if (mentions && mentions.length > 0) {
      const activeAutomations = automationsData?.automations || [];
      if (activeAutomations.find((a) => a.key === 'comment_mention_trigger' && a.isActive)) {
        setTimeout(() => {
          toast.success(`✓ Mentioned ${mentions.length} user${mentions.length > 1 ? 's' : ''}. Notifications will be sent.`, {
            icon: '⚡',
            duration: 3000,
          });
        }, 300);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-[rgba(15,23,42,0.32)]" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-[520px] sm:max-w-[520px] flex-col border-l border-[#e3e8f4] bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.16)]">
        {isLoading || !task ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-2 sm:gap-3 border-b border-[#e5e7eb] bg-gradient-to-r from-[#f8faff] to-white px-4 sm:px-6 py-3 sm:py-5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a94ad] mb-1 sm:mb-2">Task Details</p>
                <h2 className="truncate text-base sm:text-[18px] font-bold text-[#1f2a44]">{task.title}</h2>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="rounded-[10px] px-2 py-1 text-[24px] leading-none text-[#9ca3af] transition hover:bg-[#f3f6fc] hover:text-[#1f2a44] flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-white">
              {/* Task Name Section */}
              <div className="border-b border-[#f0f2f7] px-4 sm:px-6 py-3 sm:py-4">
                <FieldLabel>Task Title</FieldLabel>
                <InputField
                  value={form.title}
                  disabled={!canEditTask}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Enter task title"
                  className="text-[12px] sm:text-[13px]"
                />
              </div>

              {/* Time Tracking */}
              <div className="border-b border-[#f0f2f7] px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <FieldLabel>Time Tracking</FieldLabel>
                    <p className="text-[11px] sm:text-[12px] text-[#6b7280]">Track live time on this task</p>
                  </div>
                  <TimeTrackerButton
                    taskId={taskId}
                    projectId={projectId || task?.projectId?._id || task?.projectId}
                    workspaceId={workspace?._id}
                  />
                </div>
              </div>

              {/* Status & Priority */}
              <div className="border-b border-[#f0f2f7] px-4 sm:px-6 py-3 sm:py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <FieldLabel>Status</FieldLabel>
                    <SelectField
                      value={form.status}
                      disabled={!canEditTask}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <div>
                    <FieldLabel>Priority</FieldLabel>
                    <SelectField
                      value={form.priority}
                      disabled={!canEditManagerFields}
                      onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                </div>

                {/* Automation Alert */}
                {calculateTriggeredAutomations(task, form, automationsData?.automations || []).length > 0 && (
                  <div className="mt-3 sm:mt-4 flex items-start gap-2 sm:gap-3 rounded-[12px] bg-gradient-to-r from-[#f0f9ff] to-[#f8fdff] p-2.5 sm:p-3.5 border border-[#bfdbfe] shadow-sm">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 text-[#0073ea] flex-shrink-0" />
                    <div className="text-[11px] sm:text-[12px] text-[#0c4a6e]">
                      <p className="font-semibold mb-1 sm:mb-2">⚡ Automations will trigger:</p>
                      <ul className="space-y-0.5 sm:space-y-1 ml-1">
                        {calculateTriggeredAutomations(task, form, automationsData?.automations || []).map((key) => (
                          <li key={key} className="text-[10px] sm:text-[11px] flex gap-2">
                            <span>→</span> {AUTOMATION_DESCRIPTIONS[key] || key}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Owner & Due Date */}
              <div className="border-b border-[#f0f2f7] px-4 sm:px-6 py-3 sm:py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <FieldLabel>Assignee</FieldLabel>
                    <div className="space-y-2">
                      <SelectField
                        value={form.assignedTo}
                        disabled={!canEditManagerFields}
                        onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))}
                      >
                        <option value="">👤 Unassigned</option>
                        {projectMembers.map((member) => (
                          <option key={member._id} value={member._id}>
                            👤 {member.name}
                          </option>
                        ))}
                      </SelectField>
                      {/* Display current assignee */}
                      {task.assignedTo && (
                        <p className="text-[11px] text-[#0073ea] font-medium bg-[#f0f9ff] px-2 py-1.5 rounded-[6px]">
                          ✓ Currently assigned to: <span className="font-semibold">{task.assignedTo?.name || 'Unknown'}</span>
                        </p>
                      )}
                      {!task.assignedTo && (
                        <p className="text-[11px] text-[#9ca3af] bg-[#f5f7fb] px-2 py-1.5 rounded-[6px]">
                          Not assigned yet
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Due Date</FieldLabel>
                    <DatePicker
                      value={form.dueDate}
                      disabled={!canEditManagerFields}
                      onChange={(date) => setForm((current) => ({ ...current, dueDate: date }))}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-b border-[#f0f2f7] px-4 sm:px-6 py-3 sm:py-4">
                <FieldLabel>Description & Notes</FieldLabel>
                <TextareaField
                  rows={3}
                  autoGrow
                  value={form.description}
                  disabled={!canEditTask}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Add task notes, context, or details..."
                  className="min-h-[100px] max-h-[280px] resize-none overflow-y-auto text-[12px] sm:text-[13px]"
                />
              </div>

              {/* Time Logs */}
              <div className="border-b border-[#f0f2f7]">
                <TimeLogList taskId={taskId} />
              </div>

              {/* Files */}
              {task.attachments?.length ? (
                <div className="border-b border-[#f0f2f7] px-4 sm:px-6 py-3 sm:py-4">
                  <FieldLabel>Attachments ({task.attachments.length})</FieldLabel>
                  <div className="space-y-2 mt-2 sm:mt-3">
                    {task.attachments.map((file) => (
                      <a
                        key={`${file.url}-${file.filename}`}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-[8px] border border-[#e5e7eb] px-2 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-[12px] text-[#1f2a44] transition hover:bg-[#f8faff] hover:border-[#d8dff3]"
                      >
                        <span className="truncate">📎 {file.filename}</span>
                        <span className="text-[10px] sm:text-[11px] text-[#0073ea] font-medium shrink-0 ml-2">Open</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Comments Section */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[#f0f2f7]">
                <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <MessageSquare className="h-4 w-4 text-[#6b7280]" />
                    <FieldLabel className="mb-0">Comments</FieldLabel>
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-semibold text-[#0073ea] bg-[#f0f9ff] px-2 sm:px-2.5 py-1 rounded-full">
                    {task.comments?.length ?? 0}
                  </span>
                </div>

                {/* Comments List */}
                <div className="mb-3 sm:mb-4 max-h-[280px] sm:max-h-[320px] space-y-2 sm:space-y-3 overflow-y-auto pr-1 sm:pr-2">
                  {task.comments?.length ? (
                    task.comments.map((entry) => (
                      <div key={entry._id} className="flex gap-2 sm:gap-3">
                        <div className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] text-[11px] sm:text-[12px] font-bold text-[#1f3a7d] shadow-sm">
                          {entry.userId?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 rounded-[10px] bg-[#f8faff] px-2.5 sm:px-3.5 py-2 sm:py-3 border border-[#f0f2f7]">
                          <div className="mb-1 sm:mb-2 flex items-center justify-between gap-2">
                            <p className="text-[11px] sm:text-[12px] font-semibold text-[#1f2a44]">{entry.userId?.name || 'User'}</p>
                            <span className="text-[9px] sm:text-[10px] text-[#9ca3af] whitespace-nowrap">
                              {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-[12px] leading-5 text-[#4b5563]">{entry.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-3 sm:py-4 text-center text-[11px] sm:text-[12px] text-[#9ca3af]">No comments yet. Start a conversation!</p>
                  )}
                </div>

                {/* Error Message */}
                {commentMessage ? (
                  <div className="mb-2 sm:mb-3 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-[10px] sm:text-[11px] text-[#dc2626] flex gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {commentMessage}
                  </div>
                ) : null}

                {/* Comment Input */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-end gap-2">
                    <div className="flex-1 w-full">
                      <TextareaField
                        rows={1}
                        autoGrow
                        value={comment}
                        disabled={!canComment}
                        onChange={(event) => setComment(event.target.value)}
                        onKeyDown={(event) => {
                          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                            event.preventDefault();
                            handleCommentSubmit();
                          }
                        }}
                        placeholder="Add a comment... (@name to mention)"
                        className="max-h-[120px] min-h-[40px] resize-none overflow-y-auto text-[12px] sm:text-[13px]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCommentSubmit}
                      disabled={!canComment || !comment.trim() || commenting}
                      className="w-full sm:w-auto h-10 rounded-[8px] bg-[#0073ea] px-3 sm:px-4 text-[12px] font-semibold text-white transition hover:bg-[#0060c0] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#d1d5db]"
                    >
                      {commenting ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-[#9ca3af] ml-0.5">💡 Tip: Type @username to mention team members</p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-[#e5e7eb] bg-gradient-to-r from-[#f8faff] to-white px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
              <div>
                {canDeleteTask ? (
                  <button
                    type="button"
                    onClick={() => window.confirm('Delete this task? This action cannot be undone.') && remove()}
                    disabled={deleting}
                    className="w-full sm:w-auto rounded-[8px] border border-[#fecaca] px-3 sm:px-3.5 py-2 text-[11px] sm:text-[12px] font-semibold text-[#dc2626] transition hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none rounded-[8px] px-3 sm:px-4 py-2 text-[11px] sm:text-[12px] font-semibold text-[#6b7280] transition hover:bg-[#f3f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canEditTask || saving || !form.title.trim()}
                  className="flex-1 sm:flex-none rounded-[8px] bg-gradient-to-r from-[#0073ea] to-[#0060c0] px-3 sm:px-4 py-2 text-[11px] sm:text-[12px] font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
