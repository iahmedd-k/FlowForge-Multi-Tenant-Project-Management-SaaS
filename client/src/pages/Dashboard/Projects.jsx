import { useMemo, useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from '../../components/ui/DatePicker';
import {
  addMember, deleteProject, getProject, getProjects,
  removeMember, updateProject,
} from '../../api/projects.api';
import { getTasks } from '../../api/tasks.api';
import { getMembers } from '../../api/workspace.api';
import { useAuth } from '../../hooks/useAuth';
import CreateProjectModal from '../../components/Dashboard Components/projects/CreateProjectModal';
import CreateTaskModal from '../../components/Dashboard Components/tasks/CreateTaskModal';
import TaskDetailPanel from '../../components/Dashboard Components/tasks/TaskDetailPanel';
import TaskCalendarView from '../../components/Dashboard Components/tasks/TaskCalendarView';
import TaskGanttView from '../../components/Dashboard Components/tasks/TaskGanttView';
import KanbanBoard from '../../components/Dashboard Components/tasks/KanbanBoard';
import Badge from '../../components/Dashboard Components/ui/Badge';
import Spinner from '../../components/Dashboard Components/ui/Spinner';
import AssigneeIcon from '../../components/Dashboard Components/ui/AssigneeIcon';
import { useIsMobile } from '../../hooks/use-mobile';

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const T = {
  bg:           '#f0f2f6',
  surface:      '#ffffff',
  border:       '#e5e7eb',
  borderStrong: '#d1d5db',
  text:         '#111827',
  sub:          '#4b5563',
  muted:        '#9ca3af',
  accent:       '#4F46E5',
  accentMid:    '#818CF8',
  accentBg:     '#EEF2FF',
  accentHover:  '#4338CA',
  done:         '#3B6D11',
  doneBg:       '#EAF3DE',
  warn:         '#854F0B',
  warnBg:       '#FAEEDA',
  danger:       '#A32D2D',
  dangerBg:     '#FCEBEB',
  sideW:        '280px',
};

const STATUS_META = {
  active:    { color: '#1D9E75', bg: '#E1F5EE', text: '#0F6E56', label: 'Active'    },
  on_hold:   { color: '#BA7517', bg: '#FAEEDA', text: '#854F0B', label: 'On Hold'   },
  completed: { color: '#4F46E5', bg: '#EEF2FF', text: '#3C3489', label: 'Completed' },
  archived:  { color: '#888780', bg: '#F1EFE8', text: '#5F5E5A', label: 'Archived'  },
};

const PRIORITY_META = {
  urgent: { color: '#A32D2D', bg: '#FCEBEB', label: 'Urgent' },
  high:   { color: '#854F0B', bg: '#FAEEDA', label: 'High'   },
  medium: { color: '#3B6D11', bg: '#EAF3DE', label: 'Medium' },
  low:    { color: '#185FA5', bg: '#E6F1FB', label: 'Low'    },
};

const AVATAR_PALETTE = [
  ['#EEF2FF','#3C3489'], ['#E1F5EE','#085041'], ['#FBEAF0','#72243E'],
  ['#FAEEDA','#633806'], ['#EEEDFE','#26215C'], ['#FAECE7','#712B13'],
  ['#E6F1FB','#0C447C'], ['#EAF3DE','#27500A'],
];

const STATUS_FILTERS = [
  { key: 'all',       label: 'All'       },
  { key: 'active',    label: 'Active'    },
  { key: 'on_hold',   label: 'On hold'   },
  { key: 'completed', label: 'Completed' },
  { key: 'archived',  label: 'Archived'  },
];

const VIEW_TABS = [
  { key: 'kanban',   label: 'Board',    icon: 'M3 3h7v9H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 16h7v6H3z' },
  { key: 'list',     label: 'List',     icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { key: 'calendar', label: 'Calendar', icon: 'M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z' },
  { key: 'gantt',    label: 'Timeline', icon: 'M3 6h8M3 12h14M3 18h6' },
];

const TASK_FILTERS = [
  { key: 'all',     label: 'All tasks' },
  { key: 'mine',    label: 'My tasks'  },
  { key: 'overdue', label: 'Overdue'   },
];

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function avatarIdx(name = '') { return (name.charCodeAt(0) || 0) % AVATAR_PALETTE.length; }

function Avatar({ name = '', size = 'md' }) {
  const [bg, fg] = AVATAR_PALETTE[avatarIdx(name)];
  const sz = { sm: 'h-6 w-6 text-[9px]', md: 'h-7 w-7 text-[11px]', lg: 'h-9 w-9 text-[13px]' }[size];
  return (
    <div title={name}
      className={`flex shrink-0 items-center justify-center rounded-full font-bold select-none ${sz}`}
      style={{ background: bg, color: fg, border: `2px solid white` }}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function AssigneeCellIcon({ name }) {
  return <AssigneeIcon assigned={Boolean(name)} size="sm" title={name || 'Unassigned'} />;
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.archived;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: m.bg, color: m.text }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

function Svg({ path, size = 14, stroke = 'currentColor', sw = 1.7, fill = 'none' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function Ring({ pct = 0, size = 36, stroke = 3, color = T.accent }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
    </svg>
  );
}

function Tip({ label, children }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg pointer-events-none"
          style={{ background: '#111827' }}>
          {label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
            style={{ borderTopColor: '#111827' }} />
        </div>
      )}
    </div>
  );
}

/* ─── Project sidebar card (unchanged) ─────────────────────────────────── */
function ProjectCard({ project, active, onClick }) {
  const pct = project.completionPercent ?? 0;
  const m = STATUS_META[project.status] ?? STATUS_META.archived;
  const deadline = project.deadline
    ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;
  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed';

  return (
    <button type="button" onClick={onClick}
      className="group w-full rounded-xl text-left transition-all duration-150"
      style={{
        background: active ? T.accentBg : T.surface,
        border: `1.5px solid ${active ? T.accentMid : T.border}`,
        padding: '12px 14px',
        boxShadow: active
          ? `0 0 0 3px rgba(79,70,229,0.1), 0 2px 8px rgba(79,70,229,0.08)`
          : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = T.borderStrong; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = T.border; }}}>

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-snug"
            style={{ color: active ? T.accent : T.text }}>
            {project.name}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
            <span className="text-[10px] font-medium" style={{ color: m.text }}>{m.label}</span>
          </div>
        </div>
        <Tip label={`${pct}% complete`}>
          <div className="relative shrink-0">
            <Ring pct={pct} size={32} stroke={3}
              color={pct === 100 ? '#1D9E75' : active ? T.accent : '#94a3b8'} />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold"
              style={{ color: pct === 100 ? '#1D9E75' : active ? T.accent : T.muted }}>
              {pct}
            </span>
          </div>
        </Tip>
      </div>

      <div className="flex items-center justify-between text-[11px]" style={{ color: T.muted }}>
        <span>{project.taskCount ?? 0} tasks</span>
        {deadline && (
          <span className="flex items-center gap-1"
            style={{ color: isOverdue ? T.danger : T.muted, fontWeight: isOverdue ? 600 : 400 }}>
            {isOverdue && '⚠ '}{deadline}
          </span>
        )}
      </div>
    </button>
  );
}

/* ─── Task list table ───────────────────────────────────────────────────── */
function TaskListTable({ tasks, canManage, onTaskClick, onAddTask }) {
  return (
    <div
      className="overflow-x-auto overflow-y-hidden rounded-2xl"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
    >
      <div className="min-w-[760px] overflow-hidden rounded-2xl"
        style={{ border: `1px solid ${T.border}`, background: T.surface }}>
      <table className="w-full table-fixed">
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.border}`, background: '#f9fafb' }}>
            {['Task', 'Status', 'Priority', 'Assignee', 'Due date'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: T.muted }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: T.accentBg }}>
                    <Svg path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12v4M10 14h4"
                      size={24} stroke={T.accent} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: T.text }}>No tasks yet</p>
                    <p className="mt-0.5 text-[12px]" style={{ color: T.muted }}>Create your first task to get started</p>
                  </div>
                  {canManage && (
                    <button onClick={() => onAddTask()}
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                      style={{ background: T.accent }}>
                      <Svg path="M12 5v14M5 12h14" size={13} stroke="white" sw={2} />
                      Add first task
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : tasks.map(task => {
            const overdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();
            const pm = PRIORITY_META[task.priority];
            return (
              <tr key={task._id} onClick={() => onTaskClick(task)}
                className="cursor-pointer transition-colors"
                style={{ borderTop: `1px solid ${T.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: T.text }}>{task.title}</td>
                <td className="px-4 py-3"><Badge value={task.status} /></td>
                <td className="px-4 py-3">
                  {pm ? (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                      style={{ background: pm.bg, color: pm.color }}>
                      {pm.label}
                    </span>
                  ) : <span style={{ color: T.muted }}>—</span>}
                </td>
                <td className="px-4 py-3">
                  {task.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <AssigneeCellIcon name={task.assignedTo.name} />
                      <span className="truncate text-[12px] font-medium" style={{ color: T.sub }}>{task.assignedTo.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AssigneeCellIcon name="" />
                      <span className="text-[12px]" style={{ color: T.muted }}>Unassigned</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-[12px] font-medium" style={{ color: overdue ? T.danger : T.sub }}>
                  {task.dueDate
                    ? <span className="flex items-center gap-1">
                        <Svg path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          size={11} stroke={overdue ? T.danger : T.muted} />
                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    : <span style={{ color: T.muted }}>—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}

/* ─── Settings drawer ───────────────────────────────────────────────────── */
function SettingsDrawer({ open, onClose, project, user, memberToAdd, setMemberToAdd,
  availableMembers, addMemberMut, addingMember, removeMemberMut, removingMember,
  saveField, canDeleteTask, onDeleteRequest }) {

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open || !project) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0"
        style={{ background: 'rgba(17,24,39,0.3)', backdropFilter: 'blur(3px)' }}
        onClick={onClose} />
      <aside className="absolute right-0 top-0 bottom-0 flex w-full max-w-[360px] flex-col z-10"
        style={{ background: T.surface, borderLeft: `1px solid ${T.border}`, boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}>

        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <p className="text-[15px] font-bold" style={{ color: T.text }}>Project Settings</p>
            <p className="text-[12px] mt-0.5" style={{ color: T.muted }}>{project.name}</p>
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-gray-100"
            style={{ color: T.muted }}>
            <Svg path="M18 6L6 18M6 6l12 12" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <section className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>General</p>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: T.sub }}>Status</label>
              <select value={project.status} onChange={e => saveField({ status: e.target.value })}
                className="h-9 w-full rounded-xl px-3 text-[13px] outline-none transition"
                style={{ border: `1.5px solid ${T.border}`, background: '#f9fafb', color: T.text }}>
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: T.sub }}>Deadline</label>
              <DatePicker
                value={project.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : ''}
                onChange={(date) => saveField({ deadline: date || null })}
                className="h-9 text-[13px]"
              />
            </div>
          </section>

          <hr style={{ borderColor: T.border }} />

          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>Members</p>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ background: T.accentBg, color: T.accent }}>
                {project.members?.length ?? 0}
              </span>
            </div>
            <div className="space-y-2">
              {(project.members || []).map(member => (
                <div key={member._id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: '#f9fafb', border: `1px solid ${T.border}` }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={member.name} />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold" style={{ color: T.text }}>{member.name}</p>
                      <p className="truncate text-[11px]" style={{ color: T.muted }}>{member.email}</p>
                    </div>
                  </div>
                  {member._id !== user?._id && (
                    <button onClick={() => removeMemberMut(member._id)} disabled={removingMember}
                      className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold transition disabled:opacity-40"
                      style={{ color: T.muted }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.dangerBg; e.currentTarget.style.color = T.danger; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.muted; }}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            {availableMembers.length > 0 && (
              <div className="mt-3 flex gap-2">
                <select value={memberToAdd} onChange={e => setMemberToAdd(e.target.value)}
                  className="h-9 min-w-0 flex-1 rounded-xl px-3 text-[12px] outline-none"
                  style={{ border: `1.5px solid ${T.border}`, background: '#f9fafb', color: T.text }}>
                  <option value="">Add member…</option>
                  {availableMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
                <button onClick={() => memberToAdd && addMemberMut(memberToAdd)}
                  disabled={!memberToAdd || addingMember}
                  className="rounded-xl px-4 text-[12px] font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                  style={{ background: T.accent }}>
                  Add
                </button>
              </div>
            )}
          </section>

          <hr style={{ borderColor: T.border }} />

          <section className="rounded-xl p-4" style={{ background: '#fff5f5', border: `1px solid #fecaca` }}>
            <p className="text-[12px] font-bold" style={{ color: T.danger }}>Danger Zone</p>
            <p className="mt-1 text-[12px] leading-5" style={{ color: '#ef4444' }}>
              Permanently deletes this project and all its tasks. Cannot be undone.
            </p>
            {canDeleteTask ? (
              <button onClick={onDeleteRequest}
                className="mt-3 rounded-xl px-3 py-1.5 text-[12px] font-bold transition"
                style={{ border: `1px solid #fca5a5`, background: T.surface, color: T.danger }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = T.surface}>
                Delete project
              </button>
            ) : (
              <p className="mt-3 text-[12px] leading-5" style={{ color: T.muted }}>
                Only project admins can delete this project.
              </p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

/* ─── Delete confirm ────────────────────────────────────────────────────── */
function DeleteConfirmModal({ open, projectName, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-4"
          style={{ background: T.dangerBg }}>
          <Svg path="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            size={22} stroke={T.danger} />
        </div>
        <h3 className="text-[17px] font-bold" style={{ color: T.text }}>Delete "{projectName}"?</h3>
        <p className="mt-2 text-[13px] leading-6" style={{ color: T.sub }}>
          This will permanently remove the project and all its tasks. This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition hover:bg-gray-50"
            style={{ border: `1.5px solid ${T.border}`, color: T.sub }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
            style={{ background: T.danger }}>
            Delete project
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────────── */
function EmptyProjectState({ canManage, onNewProject }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center p-12">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl"
        style={{ background: T.accentBg }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.accent}
          strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="7" height="9" rx="1.5" />
          <rect x="11" y="3" width="11" height="5" rx="1.5" />
          <rect x="11" y="11" width="11" height="9" rx="1.5" />
          <rect x="2" y="15" width="7" height="5" rx="1.5" />
        </svg>
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-white text-[11px] font-bold"
          style={{ background: T.accent }}>+</div>
      </div>
      <div>
        <p className="text-[18px] font-bold" style={{ color: T.text }}>No project selected</p>
        <p className="mt-1.5 text-[13px] leading-6" style={{ color: T.muted }}>
          {canManage
            ? 'Create your first project to start organizing tasks and tracking progress.'
            : 'Select a project from the sidebar to view its tasks and details.'}
        </p>
      </div>
      {canManage && (
        <button onClick={onNewProject}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-bold text-white shadow-md transition hover:opacity-90 active:scale-95"
          style={{ background: T.accent }}>
          <Svg path="M12 5v14M5 12h14" size={14} stroke="white" sw={2.2} />
          Create project
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Projects() {
  const { id: routeProjectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isManager, workspace, canCreateProject, canCreateTask, canDeleteTask, currentRole } = useAuth();
  const isMobile = useIsMobile();
  const workspaceKey = workspace?._id || 'workspace';
  const canManage = isManager;

  const [showProjectModal,  setShowProjectModal]  = useState(false);
  const [showCreateTask,    setShowCreateTask]    = useState(false);
  const [defaultStatus,     setDefaultStatus]     = useState('backlog');
  const [selectedTaskId,    setSelectedTaskId]    = useState(null);
  const [selectedMonth,     setSelectedMonth]     = useState(() => new Date());
  const [filter,            setFilter]            = useState('all');
  const [activeTab,         setActiveTab]         = useState('kanban');
  const [taskFilter,        setTaskFilter]        = useState('all');
  const [search,            setSearch]            = useState('');
  const [memberToAdd,       setMemberToAdd]       = useState('');
  const [settingsOpen,      setSettingsOpen]      = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* ── Queries ── */
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', workspaceKey],
    queryFn: () => getProjects().then(r => r.data.data.projects),
  });

  const filteredProjects = useMemo(
    () => projects.filter(p => filter === 'all' || p.status === filter),
    [filter, projects]
  );
  const hasProjectAccess = projects.length > 0;

  const selectedProjectId = routeProjectId || filteredProjects[0]?._id || projects[0]?._id || '';

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', workspaceKey, selectedProjectId],
    queryFn: () => getProject(selectedProjectId).then(r => r.data.data.project),
    enabled: Boolean(selectedProjectId),
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', workspaceKey, selectedProjectId],
    queryFn: () => getTasks({ projectId: selectedProjectId }).then(r => r.data.data.tasks),
    enabled: Boolean(selectedProjectId),
  });

  const { data: workspaceMembers = [] } = useQuery({
    queryKey: ['members', workspaceKey],
    queryFn: () => getMembers().then(r => r.data.data.members),
    enabled: canManage,
    staleTime: 30_000,
  });

  /* ── Derived ── */
  const summary = useMemo(() => ({
    total:     projects.length,
    active:    projects.filter(p => p.status === 'active').length,
    onHold:    projects.filter(p => p.status === 'on_hold').length,
    completed: projects.filter(p => p.status === 'completed').length,
  }), [projects]);

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const overdueTasks   = tasks.filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date()).length;
  const pct            = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : (project?.completionPercent ?? 0);

  const projectDeadline = project?.deadline
    ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const isOverdue = project?.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed';

  const availableMembers = useMemo(() => {
    const ids = new Set((project?.members || []).map(m => m._id));
    return workspaceMembers.filter(m => !ids.has(m._id));
  }, [project?.members, workspaceMembers]);

  const visibleTasks = useMemo(() => {
    let t = [...tasks];
    if (search.trim()) t = t.filter(x => x.title?.toLowerCase().includes(search.toLowerCase()));
    if (taskFilter === 'mine') t = t.filter(x => x.assignedTo?._id === user?._id);
    if (taskFilter === 'overdue') t = t.filter(x => x.dueDate && x.status !== 'done' && new Date(x.dueDate) < new Date());
    return t;
  }, [tasks, search, taskFilter, user?._id]);

  /* ── Mutations ── */
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['projects', workspaceKey] });
    queryClient.invalidateQueries({ queryKey: ['project', workspaceKey, selectedProjectId] });
    queryClient.invalidateQueries({ queryKey: ['tasks', workspaceKey, selectedProjectId] });
  };

  const { mutate: saveField }       = useMutation({ mutationFn: p => updateProject(selectedProjectId, p), onSuccess: refresh });
  const { mutate: addMemberMut,    isPending: addingMember }   = useMutation({ mutationFn: uid => addMember(selectedProjectId, { userId: uid }), onSuccess: () => { setMemberToAdd(''); refresh(); } });
  const { mutate: removeMemberMut, isPending: removingMember } = useMutation({ mutationFn: uid => removeMember(selectedProjectId, uid), onSuccess: refresh });
  const { mutate: deleteProj }      = useMutation({ mutationFn: () => deleteProject(selectedProjectId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects', workspaceKey] }); navigate('/projects'); } });

  const handleAddTask = (status = 'backlog') => {
    if (!canCreateTask) return;
    setDefaultStatus(status);
    setShowCreateTask(true);
  };

  if (loadingProjects) return (
    <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>
  );

  const filterCounts = {
    all:       projects.length,
    active:    summary.active,
    on_hold:   summary.onHold,
    completed: summary.completed,
    archived:  projects.filter(p => p.status === 'archived').length,
  };

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: T.bg }}>

      {/* ══ Page header ══ */}
      <header className="shrink-0 px-4 py-3 sm:px-6 sm:py-4"
        style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-[20px] font-bold tracking-tight" style={{ color: T.text }}>Projects</h1>
            <div className="flex flex-wrap items-center gap-1.5">
              {summary.active > 0 && (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ background: T.doneBg, color: T.done }}>{summary.active} active</span>
              )}
              {summary.onHold > 0 && (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ background: T.warnBg, color: T.warn }}>{summary.onHold} on hold</span>
              )}
              {summary.completed > 0 && (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ background: T.accentBg, color: T.accent }}>{summary.completed} done</span>
              )}
            </div>
          </div>
          {canCreateProject && (
            <button onClick={() => setShowProjectModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90 active:scale-95 sm:w-auto"
              style={{ background: T.accent, boxShadow: `0 2px 8px rgba(79,70,229,0.3)` }}>
              <Svg path="M12 5v14M5 12h14" size={13} stroke="white" sw={2.2} />
              New project
            </button>
          )}
        </div>
      </header>

      {/* ══ Body ══ */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">

        {/* ── Sidebar (layout unchanged, colors updated) ── */}
        <aside className="flex shrink-0 flex-col"
          style={{
            width: isMobile ? '100%' : T.sideW,
            maxHeight: isMobile ? '260px' : 'none',
            background: T.surface,
            borderRight: isMobile ? 'none' : `1px solid ${T.border}`,
            borderBottom: isMobile ? `1px solid ${T.border}` : 'none',
          }}>

          {/* Status filter chips */}
          <div className="shrink-0 px-3 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map(f => {
                const count = filterCounts[f.key];
                const on = filter === f.key;
                return (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
                    style={{
                      background: on ? T.accent : 'transparent',
                      color: on ? '#fff' : T.sub,
                    }}>
                    {f.label}
                    {count > 0 && (
                      <span className="ml-1.5 text-[10px]"
                        style={{ color: on ? 'rgba(255,255,255,0.6)' : T.muted }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project list — each item is independently clickable */}
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {filteredProjects.length === 0 ? (
              <div className="rounded-xl px-4 py-10 text-center"
                style={{ border: `1.5px dashed ${T.border}` }}>
                <p className="text-[12px]" style={{ color: T.muted }}>
                  {filter === 'all' ? 'No projects yet.' : `No ${filter.replace('_', ' ')} projects.`}
                </p>
                {canCreateProject && filter === 'all' && (
                  <button onClick={() => setShowProjectModal(true)}
                    className="mt-2 text-[12px] font-semibold transition hover:opacity-75"
                    style={{ color: T.accent }}>
                    + Create one
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map(p => (
                  <ProjectCard key={p._id} project={p}
                    active={p._id === selectedProjectId}
                    onClick={() => navigate(p._id ? `/projects/${p._id}` : '/projects')} />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {loadingProject ? (
            <div className="flex flex-1 items-center justify-center"><Spinner size="lg" /></div>
          ) : !project ? (
            <EmptyProjectState canManage={canCreateProject} onNewProject={() => setShowProjectModal(true)} />
          ) : (
            <>
              {/* ══════════════════════════════════════
                  PROJECT HEADER — FlowForge design
                  ══════════════════════════════════════ */}
              <div className="shrink-0"
                style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>

                {/* Row 1 — topbar: breadcrumb + actions */}
                <div className="flex flex-col gap-3 px-3 py-3 sm:px-5 sm:flex-row sm:items-center"
                  style={{ borderBottom: `1px solid ${T.border}` }}>
                  {/* Breadcrumb */}
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px]" style={{ color: T.muted }}>
                    <span>Projects</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                    <span className="font-semibold truncate max-w-[200px]" style={{ color: T.text }}>
                      {project.name}
                    </span>
                  </div>
                  <StatusBadge status={project.status} />
                  <div className="flex-1" />
                  {/* Notification + search + settings + add task */}
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                    <Tip label="Search tasks">
                      <div className="relative">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.muted }}>
                          <Svg path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" size={13} />
                        </div>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                          placeholder="Search tasks…"
                          className="h-8 w-full min-w-0 rounded-lg pl-8 pr-3 text-[12px] outline-none transition sm:w-[160px]"
                          style={{ border: `1.5px solid ${T.border}`, background: '#f9fafb', color: T.text }} />
                      </div>
                    </Tip>
                    {canManage && (
                      <Tip label="Project settings">
                        <button onClick={() => setSettingsOpen(true)}
                          className="flex items-center justify-center h-8 w-8 rounded-lg transition"
                          style={{ border: `1.5px solid ${T.border}`, background: T.surface, color: T.sub }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = T.borderStrong; }}
                          onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.borderColor = T.border; }}>
                          <Svg path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            size={14} />
                        </button>
                      </Tip>
                    )}
                    {canCreateTask && (
                      <button onClick={() => handleAddTask()}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:opacity-90 active:scale-95 sm:w-auto"
                        style={{ background: T.accent, boxShadow: `0 2px 6px rgba(79,70,229,0.25)` }}>
                        <Svg path="M12 5v14M5 12h14" size={12} stroke="white" sw={2.2} />
                        Add task
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2 — meta strip: progress + stats + members */}
                <div className="flex flex-col gap-3 px-3 py-3 sm:px-5 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderBottom: `1px solid ${T.border}` }}>
                  {/* Left: stats */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-[90px] h-1.5 rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: pct === 100 ? '#1D9E75' : T.accent }} />
                      </div>
                      <span className="text-[12px] font-bold tabular-nums"
                        style={{ color: pct === 100 ? '#1D9E75' : T.accent }}>
                        {pct}%
                      </span>
                    </div>
                    <span className="h-3 w-px" style={{ background: T.border }} />
                    <span className="text-[12.5px]" style={{ color: T.muted }}>
                      <span className="font-semibold" style={{ color: T.sub }}>{tasks.length}</span> tasks
                    </span>
                    <span className="text-[12.5px]" style={{ color: T.muted }}>
                      <span className="font-semibold" style={{ color: '#1D9E75' }}>{completedTasks}</span> done
                    </span>
                    {overdueTasks > 0 && (
                      <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold"
                        style={{ color: T.danger }}>
                        <Svg path="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                          size={12} stroke={T.danger} />
                        {overdueTasks} overdue
                      </span>
                    )}
                    {projectDeadline && (
                      <>
                        <span className="h-3 w-px" style={{ background: T.border }} />
                        <span className="flex items-center gap-1 text-[12px]"
                          style={{ color: isOverdue ? T.danger : T.muted }}>
                          <Svg path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            size={11} stroke={isOverdue ? T.danger : T.muted} />
                          {isOverdue && <span className="font-semibold">Overdue · </span>}
                          {projectDeadline}
                        </span>
                      </>
                    )}
                  </div>
                  {/* Right: member avatars */}
                  <div className="flex items-center -space-x-1.5 shrink-0">
                    {(project.members || []).slice(0, 5).map(m => (
                      <Tip key={m._id} label={m.name}><Avatar name={m.name} size="sm" /></Tip>
                    ))}
                    {(project.members || []).length > 5 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold"
                        style={{ background: '#e5e7eb', color: T.sub, border: `2px solid white` }}>
                        +{project.members.length - 5}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3 — overdue banner (conditional, compact) */}
                {isOverdue && (
                  <div className="mx-3 my-2.5 flex flex-col gap-2 rounded-xl px-4 py-2.5 sm:mx-5 sm:flex-row sm:items-center sm:justify-between"
                    style={{ background: '#FAEEDA', border: `1px solid #EF9F27` }}>
                    <div className="flex items-center gap-2">
                      <Svg path="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        size={14} stroke="#BA7517" />
                      <span className="text-[12px] font-bold" style={{ color: '#854F0B' }}>Deadline passed</span>
                      <span className="text-[12px]" style={{ color: '#BA7517' }}>· {projectDeadline}</span>
                    </div>
                    <button onClick={() => saveField({ status: 'completed' })}
                      className="rounded-lg px-3 py-1 text-[11px] font-bold transition"
                      style={{ background: '#EF9F27', color: '#412402' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#BA7517'}
                      onMouseLeave={e => e.currentTarget.style.background = '#EF9F27'}>
                      Mark complete →
                    </button>
                  </div>
                )}

                {/* Row 4 — tab bar + task filters */}
                <div className="flex flex-col gap-2 px-3 sm:px-5 md:flex-row md:items-stretch md:justify-between"
                  style={{ borderTop: isOverdue ? `1px solid ${T.border}` : 'none' }}>

                  {/* View tabs */}
                  <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
                    <div className="flex min-w-max items-stretch gap-0.5">
                    {VIEW_TABS.map(tab => {
                      const on = activeTab === tab.key;
                      return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                          className="flex items-center gap-1.5 px-3 text-[12.5px] font-semibold transition-all"
                          style={{
                            color: on ? T.accent : T.sub,
                            borderBottom: `2px solid ${on ? T.accent : 'transparent'}`,
                            paddingTop: '10px',
                            paddingBottom: '10px',
                            background: 'transparent',
                          }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d={tab.icon} />
                          </svg>
                          {tab.label}
                        </button>
                      );
                    })}
                    </div>
                  </div>

                  {/* Task filter chips — right side of tab bar */}
                  <div className="overflow-x-auto py-2" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
                    <div className="flex items-center gap-0.5 rounded-lg p-0.5"
                      style={{ background: '#f3f4f6' }}>
                      {TASK_FILTERS.map(tf => (
                        <button key={tf.key} onClick={() => setTaskFilter(tf.key)}
                          className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition"
                          style={{
                            background: taskFilter === tf.key ? T.surface : 'transparent',
                            color: taskFilter === tf.key ? T.text : T.muted,
                            boxShadow: taskFilter === tf.key ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                          }}>
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* ══ End project header ══ */}

              {/* ── View content ── */}
              <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
                {loadingTasks ? (
                  <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>
                ) : activeTab === 'kanban' ? (
                  <KanbanBoard tasks={visibleTasks} projectId={selectedProjectId} workspaceKey={workspaceKey}
                    onTaskClick={t => setSelectedTaskId(t._id)}
                    onAddTask={canCreateTask ? handleAddTask : undefined} />
                ) : activeTab === 'list' ? (
                  <TaskListTable tasks={visibleTasks} canManage={canCreateTask}
                    onTaskClick={t => setSelectedTaskId(t._id)}
                    onAddTask={canCreateTask ? handleAddTask : undefined} />
                ) : activeTab === 'calendar' ? (
                  <TaskCalendarView tasks={visibleTasks.filter(t => t.dueDate)}
                    selectedMonth={selectedMonth} onMonthChange={setSelectedMonth}
                    onTaskClick={t => setSelectedTaskId(t._id)} />
                ) : (
                  <TaskGanttView project={project} tasks={visibleTasks}
                    onTaskClick={t => setSelectedTaskId(t._id)} />
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Overlays ── */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)}
        project={project} user={user} memberToAdd={memberToAdd}
        setMemberToAdd={setMemberToAdd} availableMembers={availableMembers}
        addMemberMut={addMemberMut} addingMember={addingMember}
        removeMemberMut={removeMemberMut} removingMember={removingMember}
        saveField={saveField} canDeleteTask={canDeleteTask}
        onDeleteRequest={() => { setSettingsOpen(false); setShowDeleteConfirm(true); }} />

      <DeleteConfirmModal open={showDeleteConfirm} projectName={project?.name}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => { setShowDeleteConfirm(false); deleteProj(); }} />

      {!hasProjectAccess && ['member', 'viewer'].includes(currentRole) ? (
        <div className="mx-6 mt-4 rounded-[16px] border border-[#dbe4f4] bg-white px-5 py-5">
          <p className="text-[16px] font-semibold" style={{ color: T.text }}>No project access yet</p>
          <p className="mt-2 max-w-[680px] text-[13px] leading-6" style={{ color: T.sub }}>
            You are part of this workspace, but no project has been shared with your account yet.
            Ask the owner or an admin to add you to a project so this area can show your boards and tasks.
          </p>
        </div>
      ) : null}

      {canCreateProject && (
        <CreateProjectModal open={showProjectModal} onClose={() => setShowProjectModal(false)} />
      )}
      {canCreateTask && selectedProjectId && (
        <CreateTaskModal open={showCreateTask} onClose={() => setShowCreateTask(false)}
          projectId={selectedProjectId} members={project?.members || []}
          defaultStatus={defaultStatus} />
      )}
      {selectedTaskId && (
        <TaskDetailPanel taskId={selectedTaskId} projectId={selectedProjectId}
          onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
}
