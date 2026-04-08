import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { DatePicker } from '../../components/ui/DatePicker';
import Spinner from '../../components/Dashboard Components/ui/Spinner';
import CreateTaskModal from '../../components/Dashboard Components/tasks/CreateTaskModal';
import CreateProjectModal from '../../components/Dashboard Components/projects/CreateProjectModal';
import TaskDetailPanel from '../../components/Dashboard Components/tasks/TaskDetailPanel';
import TaskCalendarView from '../../components/Dashboard Components/tasks/TaskCalendarView';
import TaskGanttView from '../../components/Dashboard Components/tasks/TaskGanttView';
import KanbanBoard from '../../components/Dashboard Components/tasks/KanbanBoard';
import AISidekickPanel from '../../components/Dashboard Components/ai/AISidekickPanel';
import AssigneeIcon from '../../components/Dashboard Components/ui/AssigneeIcon';
import AutomationsPanel from '../../components/Dashboard Components/layout/AutomationsPanel';
import Modal from '../../components/Dashboard Components/ui/Modal';
import { createTask, deleteTask, updateTask, uploadTaskAttachment } from '../../api/tasks.api';
import { getMembers } from '../../api/workspace.api';
import { useAuth } from '../../hooks/useAuth';

Chart.register(...registerables, annotationPlugin);

const STATUS_META = {
  backlog: { label: 'Not Started', className: 'bg-[#c9c9c9] text-white' },
  in_progress: { label: 'Working on it', className: 'bg-[#fdab3d] text-white' },
  review: { label: 'Stuck', className: 'bg-[#e2445c] text-white' },
  done: { label: 'Done', className: 'bg-[#00c875] text-white' },
};

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Not Started' },
  { value: 'in_progress', label: 'Working on it' },
  { value: 'review', label: 'Stuck' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_META = {
  low: { label: 'Low', className: 'bg-[#579bfc] text-white' },
  medium: { label: 'Medium', className: 'bg-[#5559df] text-white' },
  high: { label: 'High', className: 'bg-[#401694] text-white' },
  urgent: { label: 'Urgent', className: 'bg-[#e2445c] text-white' },
  default: { label: '', className: 'bg-[#c9c9c9] text-white' },
};

const PRIORITY_OPTIONS = [
  { value: '', label: 'Auto' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const WORKLOAD_CAPACITY = 6;

const AVATAR_COLORS = [
  { bg: '#e8f4ff', fg: '#0060c0' },
  { bg: '#fff3e0', fg: '#c06000' },
  { bg: '#f0fff8', fg: '#005c38' },
  { bg: '#fff0f3', fg: '#a0002b' },
  { bg: '#f3f0ff', fg: '#4e00b0' },
  { bg: '#e0f8ff', fg: '#005b80' },
];

const WORKLOAD_COLORS = {
  backlog: '#98a4b8',
  inProgress: '#3b82f6',
  review: '#f97316',
  capacity: '#475569',
};

const BOARD_GRID = '34px minmax(188px,1.16fr) 68px 72px 102px 98px 98px 78px 96px 118px 110px 48px';
const DEFAULT_GROUP_COLUMNS = ['owner', 'status', 'dueDate', 'priority', 'budget', 'files', 'notes', 'updated'];
const GROUP_COLOR_OPTIONS = ['#0073ea', '#00c875', '#fdab3d', '#a25ddc', '#e2445c'];
const COLUMN_LIBRARY = {
  owner: { label: 'Owner', width: '72px' },
  status: { label: 'Status', width: '102px' },
  dueDate: { label: 'Due date', width: '98px' },
  priority: { label: 'Priority', width: '98px' },
  budget: { label: 'Budget', width: '78px' },
  files: { label: 'Files', width: '96px' },
  notes: { label: 'Notes', width: '118px' },
  updated: { label: 'Last updated', width: '110px' },
};

const VIEW_OPTIONS = [
  { key: 'table', label: 'Table' },
  { key: 'overview', label: 'Overview' },
  { key: 'gantt', label: 'Gantt' },
  { key: 'chart', label: 'Chart' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'kanban', label: 'Kanban' },
  { key: 'files', label: 'File gallery' },
  { key: 'form', label: 'Form' },
];

const DEFAULT_VIEW_TABS = [
  { id: 'view-table', key: 'table', label: 'Main table', pinned: true },
  { id: 'view-overview', key: 'overview', label: 'Overview', pinned: false },
];

const SINGLE_INSTANCE_VIEWS = new Set(['table', 'overview']);
const DEFAULT_GROUP_CONFIGS = [
  { id: 'todo', title: 'To-Do', color: '#0073ea', columns: [...DEFAULT_GROUP_COLUMNS], isCustom: false },
  { id: 'completed', title: 'Completed', color: '#00c875', columns: [...DEFAULT_GROUP_COLUMNS], isCustom: false },
];

function createViewTab(viewKey, currentTabs = []) {
  const baseLabel = VIEW_OPTIONS.find((view) => view.key === viewKey)?.label || viewKey;
  const existing = currentTabs.filter((tab) => tab.key === viewKey).length;
  const label = viewKey === 'table' && !existing ? 'Main table' : baseLabel;
  return {
    id: `view-${viewKey}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key: viewKey,
    label,
    pinned: false,
  };
}

function getBoardGrid(columns = DEFAULT_GROUP_COLUMNS) {
  return ['34px', 'minmax(188px,1.16fr)', '68px', ...columns.map((column) => COLUMN_LIBRARY[column]?.width || '96px'), '48px'].join(' ');
}

function makeLocalRow(projectId = '') {
  return {
    _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    assignedTo: null,
    status: 'backlog',
    dueDate: null,
    priority: '',
    attachments: [],
    description: '',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    projectId: projectId || null,
  };
}

function formatShortDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatUpdatedAgo(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minutes`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  return `${days} days`;
}

function formatLongDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getInitials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function TabButton({ active, children, onClick, onMore, showMenu, menuContent }) {
  const dotsRef = useRef(null);
  const [dotsRect, setDotsRect] = useState(null);

  useEffect(() => {
    if (!showMenu || !dotsRef.current) return;

    const rect = dotsRef.current.getBoundingClientRect();
    setDotsRect(rect);

    const handleResize = () => {
      const newRect = dotsRef.current?.getBoundingClientRect();
      if (newRect) setDotsRect(newRect);
    };

    window.addEventListener('scroll', handleResize, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleResize, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [showMenu]);

  return (
    <>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onClick}
          className={`whitespace-nowrap rounded-[8px] px-2.5 py-1.5 text-[12px] sm:text-[13px] font-medium transition ${
            active
              ? 'bg-transparent text-[#0073ea]'
              : 'bg-transparent text-[#52607d] hover:bg-[#f3f6fc] hover:text-[#2d3554]'
          }`}
        >
          {children}
        </button>
        {active && onMore ? (
          <button
            ref={dotsRef}
            type="button"
            onClick={onMore}
            className="flex h-6 w-6 items-center justify-center rounded-[8px] text-[#6b7795] transition hover:bg-[#eef4ff] hover:text-[#0073ea]"
            aria-label="View options"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <circle cx="5" cy="10" r="1.35" />
              <circle cx="10" cy="10" r="1.35" />
              <circle cx="15" cy="10" r="1.35" />
            </svg>
          </button>
        ) : null}
      </div>
      {showMenu && menuContent && dotsRect && menuContent(dotsRect)}
    </>
  );
}

function ViewMenu({ onSelect, className = '', style }) {
  return (
    <div
      className={`z-40 w-[296px] rounded-[14px] border border-[#d8dff3] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)] ${className}`}
      style={style}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-[15px] font-semibold text-[#1f2a44]">Board views</p>
        <span className="text-[14px] text-[#7b86a5]">i</span>
      </div>
      <div className="space-y-1">
        {VIEW_OPTIONS.map((view) => (
          <button
            key={view.key}
            type="button"
            onClick={() => onSelect(view.key)}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] text-[#35405c] transition hover:bg-[#f6f8fc]"
          >
            <span className="flex h-4 w-4 items-center justify-center text-[#6f7b96]">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
                <path d="M2.5 6.5h11" />
              </svg>
            </span>
            <span>{view.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProjectMenuDropdown({ children }) {
  return (
    <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-[calc(100vw-16px)] sm:w-[344px] max-w-[344px] rounded-[10px] border border-[#d8dff3] bg-white p-4 sm:p-6 shadow-[0_20px_45px_rgba(15,23,42,0.16)]">
      {children}
    </div>
  );
}

function ViewTabMenu({ pinned, onPinToggle, onRename, onDuplicate, onDelete, canDelete, dotsButtonRect }) {
  return (
    <div 
      className="fixed z-[99999] w-[188px] rounded-[12px] border border-[#d8dff3] bg-white p-2 shadow-[0_16px_36px_rgba(15,23,42,0.16)] pointer-events-auto"
      style={{
        top: dotsButtonRect ? `${dotsButtonRect.bottom + 4}px` : '0',
        left: dotsButtonRect 
          ? `${Math.max(8, Math.min(dotsButtonRect.left - 156, window.innerWidth - 196))}px`
          : '0',
      }}
    >
      <button type="button" onClick={onPinToggle} className="flex w-full items-center rounded-[8px] px-3 py-2 text-left text-[13px] text-[#1f2a44] transition hover:bg-[#f6f8fc]">
        {pinned ? 'Unpin view' : 'Pin view'}
      </button>
      <button type="button" onClick={onRename} className="flex w-full items-center rounded-[8px] px-3 py-2 text-left text-[13px] text-[#1f2a44] transition hover:bg-[#f6f8fc]">
        Rename
      </button>
      <button type="button" onClick={onDuplicate} className="flex w-full items-center rounded-[8px] px-3 py-2 text-left text-[13px] text-[#1f2a44] transition hover:bg-[#f6f8fc]">
        Duplicate
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        className="flex w-full items-center rounded-[8px] px-3 py-2 text-left text-[13px] text-[#c23d52] transition hover:bg-[#fff6f8] disabled:cursor-not-allowed disabled:text-[#c8a6af] disabled:hover:bg-transparent"
      >
        Delete
      </button>
    </div>
  );
}

function AvatarBadge({ name, size = 'md' }) {
  return <AssigneeIcon assigned={Boolean(name)} size={size === 'sm' ? 'sm' : 'md'} title={name || 'Unassigned'} />;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function BoardHeader({
  selectedProjectId,
  setSelectedProjectId,
  projects,
  selectedProject,
  dashboardView,
  setDashboardView,
  visibleViews,
  onAddView,
  onPinView,
  onRenameView,
  onDuplicateView,
  onDeleteView,
}) {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [tabMenuViewId, setTabMenuViewId] = useState(null);
  const headerRef = useRef(null);
  const addViewButtonRef = useRef(null);
  const [viewMenuPosition, setViewMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!showViewMenu) return undefined;

    const updateViewMenuPosition = () => {
      const button = addViewButtonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const menuWidth = 296;
      const gutter = 12;
      const left = Math.min(
        Math.max(gutter, rect.left),
        Math.max(gutter, window.innerWidth - menuWidth - gutter)
      );

      setViewMenuPosition({
        top: rect.bottom + 8,
        left,
      });
    };

    updateViewMenuPosition();
    window.addEventListener('resize', updateViewMenuPosition);
    window.addEventListener('scroll', updateViewMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateViewMenuPosition);
      window.removeEventListener('scroll', updateViewMenuPosition, true);
    };
  }, [showViewMenu]);

  useEffect(() => {
    const handleOpenViewMenu = () => {
      setShowViewMenu(true);
      setShowProjectMenu(false);
      setTabMenuViewId(null);
    };

    window.addEventListener('dashboard:open-add-view', handleOpenViewMenu);
    return () => window.removeEventListener('dashboard:open-add-view', handleOpenViewMenu);
  }, []);

  useEffect(() => {
    if (!showProjectMenu && !showViewMenu && !tabMenuViewId) return undefined;

    const handlePointerDown = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowProjectMenu(false);
        setShowViewMenu(false);
        setTabMenuViewId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showProjectMenu, showViewMenu, tabMenuViewId]);

  const boardOwner = selectedProject?.members?.find((member) => ['owner', 'admin'].includes(member.role)) || selectedProject?.members?.[0];

  return (
    <div ref={headerRef} className="border-b border-[#d8dff3] px-2 pt-2 sm:px-5 sm:pt-3">
      <div className="mb-1 sm:mb-2">
        <div className="relative inline-flex items-center">
          <button
            type="button"
            onClick={() => setShowProjectMenu((current) => !current)}
            className="inline-flex items-center gap-1.5 bg-transparent pr-1 truncate text-[16px] sm:text-[19px] font-semibold leading-none text-[#1f2a44] outline-none"
          >
            <span className="truncate">{selectedProject?.name || 'Project'}</span>
            <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[#5f6f93]">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6.5 8 10l4-3.5" />
              </svg>
            </span>
          </button>

          {showProjectMenu ? (
            <ProjectMenuDropdown>
              <div className="mb-4">
                <div className="rounded-[4px] border border-[#cbd4e6] px-2 py-1.5">
                  <select
                    value={selectedProjectId}
                    onChange={(event) => {
                      setSelectedProjectId(event.target.value);
                      setShowProjectMenu(false);
                    }}
                    className="w-full appearance-none bg-transparent text-[16px] font-semibold text-[#333843] outline-none"
                  >
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="mb-5 text-[13px] leading-6 text-[#5f6780]">
                {selectedProject?.description || 'Manage any type of project. Assign owners, set timelines, and keep track of where your project stands.'}
              </p>

              <div className="border-t border-[#d8dff3] pt-4">
                <h3 className="mb-4 text-[15px] font-semibold text-[#333843]">Board info</h3>
                <div className="space-y-4 text-[13px] text-[#4f5873]">
                  <div className="grid grid-cols-[96px_1fr] items-center gap-3">
                    <span>Board type</span>
                    <div className="flex items-center gap-2 text-[#333843]">
                      <span className="text-[#6f7690]">
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3.5" y="4.5" width="13" height="11" rx="1.5" />
                          <path d="M9.8 4.5v11" />
                        </svg>
                      </span>
                      <span>Main</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-[96px_1fr] items-center gap-3">
                    <span>Owner</span>
                    <div className="flex items-center gap-2 text-[#333843]">
                      <AvatarBadge name={boardOwner?.name} />
                      <span>{boardOwner?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-[96px_1fr] items-center gap-3">
                    <span>Created by</span>
                    <div className="flex items-center gap-2 text-[#333843]">
                      <AvatarBadge name={boardOwner?.name} />
                      <span>on {formatLongDate(selectedProject?.createdAt)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-[96px_1fr] items-center gap-3">
                    <span>Notifications</span>
                    <div className="flex items-center gap-2 text-[#333843]">
                      <span className="text-[#6f7690]">
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 3.5a3 3 0 0 0-3 3v1.4c0 .7-.2 1.4-.6 2L5 12.3V14h10v-1.7l-1.4-2.4a3.9 3.9 0 0 1-.6-2V6.5a3 3 0 0 0-3-3Z" />
                          <path d="M8.5 15.5a1.7 1.7 0 0 0 3 0" />
                        </svg>
                      </span>
                      <span>Everything</span>
                    </div>
                  </div>
                </div>
              </div>
            </ProjectMenuDropdown>
          ) : null}
        </div>
      </div>

      <div className="flex overflow-x-auto overflow-y-visible items-center gap-1 pb-0 sm:items-end sm:gap-4 sm:pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 relative z-50">
          {visibleViews.map((view) => {
            if (!view) return null;
            return (
              <div key={view.id} className="relative shrink-0 overflow-visible">
                <TabButton
                  active={dashboardView === view.id}
                  onClick={() => {
                    setDashboardView(view.id);
                    setTabMenuViewId(null);
                  }}
                  onMore={() => setTabMenuViewId((current) => (current === view.id ? null : view.id))}
                  showMenu={tabMenuViewId === view.id}
                  menuContent={(dotsRect) => (
                    <ViewTabMenu
                      dotsButtonRect={dotsRect}
                      pinned={view.pinned}
                      canDelete={visibleViews.length > 1}
                      onPinToggle={() => {
                        onPinView(view.id);
                        setTabMenuViewId(null);
                      }}
                      onRename={() => {
                        onRenameView(view.id);
                        setTabMenuViewId(null);
                      }}
                      onDuplicate={() => {
                        onDuplicateView(view.id);
                        setTabMenuViewId(null);
                      }}
                      onDelete={() => {
                        onDeleteView(view.id);
                        setTabMenuViewId(null);
                      }}
                    />
                  )}
                >
                  {view.label}
                </TabButton>
            </div>
          );
          })}
        <div className="relative flex shrink-0 items-center self-center sm:self-end">
          <button
            type="button"
            ref={addViewButtonRef}
            aria-label="Add board view"
            title="Add board view"
            onClick={() => setShowViewMenu((current) => !current)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] bg-transparent text-[19px] leading-none text-[#7a89a8] transition hover:bg-[#eef4ff] hover:text-[#114b92] sm:h-8 sm:w-8 sm:text-[20px]"
          >
            +
          </button>
          {showViewMenu ? (
            <ViewMenu
              className="fixed"
              style={{ top: `${viewMenuPosition.top}px`, left: `${viewMenuPosition.left}px` }}
              onSelect={(viewKey) => {
                onAddView(viewKey);
                setShowViewMenu(false);
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ToolbarAction({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 sm:h-8 md:h-9 items-center gap-1 sm:gap-1.5 md:gap-2 rounded-[6px] px-1 sm:px-2 md:px-2.5 text-[11px] sm:text-[12px] md:text-[13px] text-[#1f2a44] font-medium transition hover:bg-[#f3f6fc]"
    >
      {children}
    </button>
  );
}

function TinyPopover({ children }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const updatePosition = () => {
      // Find the trigger button (sibling in same parent)
      const trigger = ref.current?.parentElement?.querySelector('[data-dashboard-popover-trigger="true"]');
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2 - 88, // 176/2 = 88
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-dashboard-popover="true"
      className="z-[9999] w-[176px] rounded-[8px] border border-[#d8dff3] bg-white p-2 shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>
  );
}

function OwnerPopover({ children }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const updatePosition = () => {
      // Find the trigger button (sibling in same parent)
      const trigger = ref.current?.parentElement?.querySelector('[data-dashboard-popover-trigger="true"]');
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2 - 112, // 224/2 = 112
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-dashboard-popover="true"
      className="z-[9999] w-[224px] rounded-[12px] border border-[#d8dff3] bg-white p-2.5 shadow-[0_14px_32px_rgba(15,23,42,0.18)]"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>
  );
}

function NotesPopover({ children }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const updatePosition = () => {
      // Find the trigger button (sibling in same parent)
      const trigger = ref.current?.parentElement?.querySelector('[data-dashboard-popover-trigger="true"]');
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2 - 180, // 360/2 = 180
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-dashboard-popover="true"
      className="z-[9999] w-[360px] rounded-[12px] border border-[#d8dff3] bg-white p-3 shadow-[0_14px_32px_rgba(15,23,42,0.18)]"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>
  );
}

function TinyOption({ active = false, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-[6px] px-2 py-1.5 text-left text-[13px] text-[#1f2a44] transition hover:bg-[#f4f7fd] ${active ? 'bg-[#eef4ff]' : ''}`}
    >
      {children}
    </button>
  );
}

function ToolbarMenu({ children, align = 'left' }) {
  return (
    <div
      data-dashboard-toolbar-menu="true"
      className={`absolute top-[calc(100%+8px)] z-[9999] w-[196px] rounded-[10px] border border-[#d8dff3] bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.14)] ${align === 'right' ? 'right-0' : 'left-0'}`}
    >
      {children}
    </div>
  );
}

function SelectionAction({ icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-w-[64px] flex-col items-center gap-1 text-[#1f2a44] transition hover:text-[#0073ea] disabled:cursor-not-allowed disabled:text-[#b7bfd2]"
    >
      <span className="text-[18px] leading-none">{icon}</span>
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

function HeaderCell({ children, className = '' }) {
  return <div className={`border-r border-[#d0d9ee] px-2 py-1.5 text-center text-[11px] text-[#1f2a44] last:border-r-0 ${className}`}>{children}</div>;
}

function GridRow({ children, className = '', gridTemplate = BOARD_GRID }) {
  return (
    <div className={`grid border-b border-[#d0d9ee] ${className}`} style={{ gridTemplateColumns: gridTemplate }}>
      {children}
    </div>
  );
}

function FooterRow({ children, className = '', gridTemplate = BOARD_GRID }) {
  return (
    <div className={`grid ${className}`} style={{ gridTemplateColumns: gridTemplate }}>
      {children}
    </div>
  );
}

function CheckboxGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3.5 8.2 2.6 2.6 6-6" />
    </svg>
  );
}

function TaskNameCell({ task, onClick, isEditing, onStartEdit, onSave, onCancel }) {
  return (
    <div className={`relative px-2.5 py-1.5 ${isEditing ? 'z-30' : ''}`}>
      {!isEditing ? (
        <button type="button" data-dashboard-editor-trigger="true" data-dashboard-popover-trigger="true" onClick={onStartEdit} className="w-full truncate text-left text-[12px] text-[#1f2a44] transition hover:text-[#0073ea]" style={{ WebkitTapHighlightColor: 'transparent' }}>
          {task.title || 'Untitled task'}
        </button>
      ) : null}
      {isEditing ? (
        <input
          autoFocus
          defaultValue={task.title || ''}
          className="h-full w-full bg-transparent px-0 text-[12px] font-medium text-[#1f2a44] outline-none"
          onBlur={(event) => onSave({ title: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSave({ title: event.currentTarget.value });
            if (event.key === 'Escape') onCancel();
          }}
        />
      ) : null}
    </div>
  );
}

function ActionIconsCell({ onOpenTask, onOpenAi }) {
  return (
    <div className="flex items-center justify-center gap-2 px-2 py-1.5 text-[#6f7690]">
      <button
        type="button"
        onClick={onOpenAi}
        className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-[#eef4ff] hover:text-[#0073ea]"
        title="Ask AI about this task"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3 2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3Z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onOpenTask}
        className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-[#eef4ff] hover:text-[#0073ea]"
        title="Open task sidebar"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      </button>
    </div>
  );
}

function AvatarCell({ task, members, isEditing, onStartEdit, onSave, onCancel }) {
  return (
    <div className={`relative flex items-center justify-center px-2 py-1 ${isEditing ? 'z-30' : ''}`}>
      <button
        type="button"
        data-dashboard-editor-trigger="true"
        data-dashboard-popover-trigger="true"
        onClick={onStartEdit}
        className="flex min-h-[28px] min-w-[74px] items-center justify-center rounded-[8px] px-2 transition hover:bg-[#f3f6fc]"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <AvatarBadge name={task.assignedTo?.name} />
      </button>
      {isEditing ? (
        <OwnerPopover>
          <div className="mb-2 border-b border-[#ebeff6] px-1 pb-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#7b86a5]">Owner</p>
          </div>
          <div className="space-y-1">
            <TinyOption active={!task.assignedTo} onClick={() => onSave({ assignedTo: null })}>
              <span className="flex items-center gap-2">
                <AvatarBadge name={null} size="sm" />
                <span>Unassigned</span>
              </span>
            </TinyOption>
            {members.map((member) => (
              <TinyOption key={member._id} active={task.assignedTo?._id === member._id} onClick={() => onSave({ assignedTo: member._id })}>
                <span className="flex items-center gap-2">
                  <AvatarBadge name={member.name} size="sm" />
                  <span className="truncate">{member.name}</span>
                </span>
              </TinyOption>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={onCancel} className="rounded-[8px] px-2 py-1 text-[12px] text-[#63708d] transition hover:bg-[#f4f7fd]">Close</button>
          </div>
        </OwnerPopover>
      ) : null}
    </div>
  );
}

function FilterChip({ active = false, icon = null, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-[8px] px-3 py-2.5 text-left text-[13px] transition ${
        active ? 'bg-[#cfe5ff] text-[#1f2a44]' : 'bg-[#f5f7fb] text-[#3e4863] hover:bg-[#ecf2fb]'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        {icon}
        <span className="truncate">{children}</span>
      </span>
    </button>
  );
}

function FilterSection({ title, count, children }) {
  return (
    <div className="min-w-[180px]">
      <div className="mb-3 flex items-center gap-1.5">
        <p className="text-[14px] font-medium text-[#5f6780]">{title}</p>
        {typeof count === 'number' ? <span className="text-[14px] text-[#7f89a3]">/ {count}</span> : null}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BoardConfigDialog({ state, onChange, onClose, onSubmit }) {
  if (!state?.open) return null;

  return (
    <Modal open={state.open} onClose={onClose} title={state.title} size="sm">
      <div className="space-y-4">
        {state.description ? <p className="text-sm text-[#64748b]">{state.description}</p> : null}

        {state.mode === 'select' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1f2a44]">Column</label>
            <select
              value={state.value}
              onChange={(event) => onChange(event.target.value)}
              className="input-base"
            >
              {state.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1f2a44]">{state.label || 'Name'}</label>
            <input
              autoFocus
              value={state.value}
              onChange={(event) => onChange(event.target.value)}
              className="input-base"
              placeholder={state.placeholder || ''}
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="button" onClick={onSubmit} className="btn-primary">
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ColorPill({ className, label, onClick, isEditing, options, activeValue, onSave, onCancel }) {
  return (
    <div className={`relative h-full ${isEditing ? 'z-30' : ''}`}>
      <button type="button" data-dashboard-editor-trigger="true" data-dashboard-popover-trigger="true" onClick={onClick} className={`flex h-full min-h-[30px] w-full items-center justify-center px-2 text-[12px] font-medium ${className}`}>
        {label}
      </button>
      {isEditing ? (
        <TinyPopover>
          <div className="space-y-1">
            {options.map((option) => (
              <TinyOption key={option.value} active={activeValue === option.value} onClick={() => onSave(option.value)}>
                {option.label}
              </TinyOption>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={onCancel} className="text-[12px] text-[#63708d]">Close</button>
          </div>
        </TinyPopover>
      ) : null}
    </div>
  );
}

function DateCell({ task, isEditing, onStartEdit, onSave, onCancel }) {
  const overdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();
  return (
    <div className={`relative ${isEditing ? 'z-30' : ''}`}>
      <button type="button" data-dashboard-editor-trigger="true" onClick={onStartEdit} className="flex w-full items-center justify-center gap-1.5 px-2 py-1.5 text-[12px] text-[#2d3554]" style={{ WebkitTapHighlightColor: 'transparent' }}>
        {overdue ? (
          <span className="text-[#e2445c]">!</span>
        ) : task.dueDate ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[#00c875]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3.5 8.2 2.6 2.6 6-6" />
          </svg>
        ) : null}
        <span>{formatShortDate(task.dueDate)}</span>
      </button>
      {isEditing ? (
        <DatePicker
          autoFocus
          value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ''}
          onChange={(date) => onSave({ dueDate: date || null })}
          className="h-8 text-[12px]"
        />
      ) : null}
    </div>
  );
}

function FilesCell({ task, isEditing, onStartEdit, onUploadFiles, onRemoveFile, onCancel, isUploading }) {
  return (
    <div className={`relative ${isEditing ? 'z-30' : ''}`}>
      <button type="button" data-dashboard-editor-trigger="true" data-dashboard-popover-trigger="true" onClick={onStartEdit} className="flex w-full items-center justify-center px-2 py-1.5 text-[12px] text-[#5f6f93]" style={{ WebkitTapHighlightColor: 'transparent' }}>
        {task.attachments?.length ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#635bff] text-white">
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 2.5h4l2.5 2.5v8H5z" />
              <path d="M9 2.5V5h2.5" />
            </svg>
          </span>
        ) : '+'}
      </button>
      {isEditing ? (
        <TinyPopover>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center justify-center rounded-[6px] border border-dashed border-[#c8d1e6] px-3 py-3 text-[12px] text-[#1f2a44] transition hover:bg-[#f8fbff]">
              <input
                autoFocus
                type="file"
                multiple
                className="hidden"
                onChange={(event) => onUploadFiles(Array.from(event.target.files || []))}
              />
              <span>{isUploading ? 'Uploading...' : 'Upload file'}</span>
            </label>

            {task.attachments?.length ? (
              <div className="max-h-[140px] space-y-1 overflow-y-auto">
                {task.attachments.map((item, index) => (
                  <div key={`${item.url}-${index}`} className="flex items-center justify-between gap-2 rounded-[6px] bg-[#f6f8fc] px-2 py-1.5 text-[12px] text-[#1f2a44]">
                    <a href={item.url} target="_blank" rel="noreferrer" className="truncate text-[#0073ea] hover:underline">
                      {item.filename}
                    </a>
                    <button type="button" onClick={() => onRemoveFile(index)} className="text-[#6f7690] transition hover:text-[#e2445c]">
                      x
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#6b7795]">No files added yet.</p>
            )}
          </div>
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={onCancel} className="text-[12px] text-[#63708d]">Close</button>
          </div>
        </TinyPopover>
      ) : null}
    </div>
  );
}
function NotesCell({ task, isEditing, onStartEdit, onSave, onCancel }) {
  return (
    <div className={`relative ${isEditing ? 'z-30' : ''}`}>
      <button type="button" data-dashboard-editor-trigger="true" data-dashboard-popover-trigger="true" onClick={onStartEdit} className="w-full truncate px-2.5 py-1.5 text-left text-[12px] text-[#1f2a44]" style={{ WebkitTapHighlightColor: 'transparent' }}>
        {task.description || ''}
      </button>
      {isEditing ? (
        <NotesPopover>
          <div className="mb-3 border-b border-[#ebeff6] pb-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#7b86a5]">Notes</p>
          </div>
          <textarea
            autoFocus
            rows={8}
            defaultValue={task.description || ''}
            className="mb-3 w-full rounded-[6px] border border-[#d8dff3] bg-[#f8fbff] px-2.5 py-2 text-[12px] text-[#1f2a44] outline-none transition focus:border-[#0073ea] focus:bg-white"
            onBlur={(event) => onSave({ description: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onCancel();
            }}
          />
          <div className="flex justify-end">
            <button type="button" onClick={onCancel} className="rounded-[6px] px-3 py-1.5 text-[12px] text-[#63708d] transition hover:bg-[#f4f7fd]">Close</button>
          </div>
        </NotesPopover>
      ) : null}
    </div>
  );
}

function UpdatedCell({ task }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`relative ${isOpen ? 'z-30' : ''}`}>
      <button
        type="button"
        data-dashboard-editor-trigger="true"
        data-dashboard-popover-trigger="true"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[11px] text-[#2d3554] transition hover:bg-[#f3f6fc]"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <AvatarBadge name={task.assignedTo?.name} size="sm" />
        <span className="truncate">{formatUpdatedAgo(task.updatedAt || task.createdAt)}</span>
      </button>
      {isOpen ? (
        <TinyPopover>
          <div className="mb-2 border-b border-[#ebeff6] px-1 pb-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#7b86a5]">Last Updated</p>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[11px] text-[#7b86a5]">Owner</p>
              <p className="flex items-center gap-2 text-[12px] font-medium text-[#1f2a44]">
                <AvatarBadge name={task.assignedTo?.name} size="sm" />
                <span>{task.assignedTo?.name || 'Unassigned'}</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#7b86a5]">Time</p>
              <p className="text-[12px] font-medium text-[#1f2a44]">{formatLongDate(task.updatedAt || task.createdAt)}</p>
              <p className="text-[11px] text-[#6b7795]">{formatUpdatedAgo(task.updatedAt || task.createdAt)}</p>
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={() => setIsOpen(false)} className="text-[12px] text-[#63708d]">Close</button>
          </div>
        </TinyPopover>
      ) : null}
    </div>
  );
}

function AddTaskFooterRow({ onAddTask, columns, gridTemplate, label }) {
  return (
    <FooterRow className="border-b border-[#d0d9ee] bg-white" gridTemplate={gridTemplate}>
      <div className="flex items-center justify-center border-r border-[#d0d9ee] px-2 py-1.5 text-[12px] text-[#1f2a44]">+</div>
      <div className="border-r border-[#d0d9ee] px-2.5 py-[7px]">
        <button type="button" onClick={onAddTask} className="flex h-full w-full items-center text-left text-[12px] font-normal text-[#6b7795]" style={{ WebkitTapHighlightColor: 'transparent' }}>
          {label}
        </button>
      </div>
      <div className="border-r border-[#d0d9ee]" />
      {columns.map((column, index) => (
        <div key={column} className={`${index < columns.length - 1 ? 'border-r border-[#d0d9ee]' : ''}`} />
      ))}
      <div />
    </FooterRow>
  );
}

function SummaryFooterRow({ latestDate, priorityCounts, budgetSum, sortMode, setSortMode, columns, gridTemplate }) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);

  useEffect(() => {
    if (!showSortMenu) return undefined;
    const handlePointerDown = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showSortMenu]);

  return (
    <div className="grid bg-white" style={{ gridTemplateColumns: gridTemplate }}>
      <div className="border-t border-transparent" />
      <div className="border-t border-transparent" />
      <div className="border-t border-transparent" />
      {columns.map((column, index) => {
        const borderClass = index < columns.length - 1 ? 'border-r border-t border-[#d0d9ee]' : 'border-t border-[#d0d9ee]';
        if (column === 'status') {
          return (
            <div key={column} className={`px-2 py-2 ${borderClass}`}>
              <div className="mx-auto flex h-[22px] w-full max-w-[86px] overflow-hidden rounded-[4px] bg-[#d8dde9]">
                <div style={{ width: `${Math.max(10, priorityCounts.high * 16)}px` }} className="bg-[#00c875]" />
                <div style={{ width: `${Math.max(10, priorityCounts.medium * 16)}px` }} className="bg-[#fdab3d]" />
                <div style={{ width: `${Math.max(10, priorityCounts.low * 16)}px` }} className="bg-[#e2445c]" />
                <div style={{ width: `${Math.max(10, priorityCounts.empty * 16)}px` }} className="bg-[#bfc4d2]" />
              </div>
            </div>
          );
        }
        if (column === 'dueDate') {
          return (
            <button key={column} type="button" ref={sortMenuRef} onClick={() => setShowSortMenu((current) => !current)} className={`relative px-2 py-[4px] text-center ${borderClass}`}>
              <div className="text-[12px] leading-[1.1] text-[#1f2a44]">{latestDate ? formatShortDate(latestDate.dueDate) : '-'}</div>
              <div className="text-[10px] leading-[1.05] text-[#7a84a4]">latest</div>
              {showSortMenu ? (
                <div className="absolute left-1/2 top-[calc(100%+8px)] z-40 w-[156px] -translate-x-1/2 rounded-[10px] border border-[#d8dff3] bg-white px-4 py-3 text-left shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
                  <button type="button" onClick={() => { setSortMode('due_asc'); setShowSortMenu(false); }} className="mb-2 flex w-full items-center gap-3 text-[14px] text-[#1f2a44]">
                    <span className={`h-4 w-4 rounded-full border ${sortMode === 'due_asc' ? 'border-[#0073ea] bg-[#0073ea]' : 'border-[#9ba7c3] bg-white'}`} />
                    Earliest to Latest
                  </button>
                  <button type="button" onClick={() => { setSortMode('updated_desc'); setShowSortMenu(false); }} className="flex w-full items-center gap-3 text-[14px] text-[#1f2a44]">
                    <span className={`h-4 w-4 rounded-full border ${sortMode === 'updated_desc' ? 'border-[#0073ea] bg-[#0073ea]' : 'border-[#9ba7c3] bg-white'}`} />
                    Latest
                  </button>
                </div>
              ) : null}
            </button>
          );
        }
        if (column === 'priority') {
          return (
            <div key={column} className={`px-2 py-2 ${borderClass}`}>
              <div className="mx-auto flex h-[22px] w-full max-w-[86px] overflow-hidden rounded-[4px] bg-[#d8dde9]">
                <div style={{ width: `${Math.max(10, priorityCounts.low * 16)}px` }} className="bg-[#579bfc]" />
                <div style={{ width: `${Math.max(10, priorityCounts.empty * 16)}px` }} className="bg-[#c9c9c9]" />
                <div style={{ width: `${Math.max(10, priorityCounts.medium * 16)}px` }} className="bg-[#5559df]" />
                <div style={{ width: `${Math.max(10, priorityCounts.high * 16)}px` }} className="bg-[#401694]" />
              </div>
            </div>
          );
        }
        if (column === 'budget') {
          return (
            <div key={column} className={`px-2 py-[4px] text-center ${borderClass}`}>
              <div className="text-[12px] leading-[1.1] text-[#1f2a44]">${budgetSum.toLocaleString()}</div>
              <div className="text-[10px] leading-[1.05] text-[#7a84a4]">sum</div>
            </div>
          );
        }
        return <div key={column} className={borderClass} />;
      })}
      <div className="border-t border-[#d0d9ee]" />
    </div>
  );
}

function renderGroupCell(column, task, ctx) {
  const { editingCell, onStartEdit, onSaveField, onCancelEdit, projectsData, workspaceMembers, isManager, onUploadFiles, onRemoveFile, uploadingTaskId } = ctx;

  if (column === 'owner') {
    return (
      <div className="border-r border-[#d0d9ee]">
        <AvatarCell
          task={task}
          members={((isManager ? workspaceMembers : []) || []).concat(task.projectId?.members || projectsData.find((project) => project._id === task.projectId?._id)?.members || [])
            .filter((member, index, list) => member?._id && list.findIndex((item) => item?._id === member._id) === index)}
          isEditing={editingCell?.taskId === task._id && editingCell?.field === 'assignedTo'}
          onStartEdit={() => onStartEdit(task._id, 'assignedTo')}
          onSave={(patch) => onSaveField(task, patch)}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }
  if (column === 'status') {
    return (
      <div className="border-r border-[#d0d9ee] p-0">
        <ColorPill
          className={(STATUS_META[task.status] || STATUS_META.backlog).className}
          label={(STATUS_META[task.status] || STATUS_META.backlog).label}
          onClick={() => onStartEdit(task._id, 'status')}
          isEditing={editingCell?.taskId === task._id && editingCell?.field === 'status'}
          options={STATUS_OPTIONS}
          activeValue={task.status}
          onSave={(value) => onSaveField(task, { status: value })}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }
  if (column === 'dueDate') {
    return (
      <div className="border-r border-[#d0d9ee]">
        <DateCell
          task={task}
          isEditing={editingCell?.taskId === task._id && editingCell?.field === 'dueDate'}
          onStartEdit={() => onStartEdit(task._id, 'dueDate')}
          onSave={(patch) => onSaveField(task, patch)}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }
  if (column === 'priority') {
    return (
      <div className="border-r border-[#d0d9ee] p-0">
        <ColorPill
          className={(PRIORITY_META[task.priority] || PRIORITY_META.default).className}
          label={(PRIORITY_META[task.priority] || PRIORITY_META.default).label}
          onClick={() => onStartEdit(task._id, 'priority')}
          isEditing={editingCell?.taskId === task._id && editingCell?.field === 'priority'}
          options={PRIORITY_OPTIONS}
          activeValue={task.priority || ''}
          onSave={(value) => onSaveField(task, { priority: value || undefined })}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }
  if (column === 'budget') {
    return <div className="flex items-center justify-center border-r border-[#d0d9ee] px-2 py-1.5 text-[12px] text-[#1f2a44]">${task.attachments?.length ? task.attachments.length * 100 : 0}</div>;
  }
  if (column === 'files') {
    return (
      <div className="border-r border-[#d0d9ee]">
        <FilesCell
          task={task}
          isEditing={editingCell?.taskId === task._id && editingCell?.field === 'attachments'}
          onStartEdit={() => onStartEdit(task._id, 'attachments')}
          onUploadFiles={(files) => onUploadFiles(task, files)}
          onRemoveFile={(index) => onRemoveFile(task, index)}
          onCancel={onCancelEdit}
          isUploading={uploadingTaskId === task._id}
        />
      </div>
    );
  }
  if (column === 'notes') {
    return (
      <div className="border-r border-[#d0d9ee]">
        <NotesCell
          task={task}
          isEditing={editingCell?.taskId === task._id && editingCell?.field === 'description'}
          onStartEdit={() => onStartEdit(task._id, 'description')}
          onSave={(patch) => onSaveField(task, patch)}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }
  if (column === 'updated') {
    return (
      <div className="border-r border-[#d0d9ee]">
        <UpdatedCell task={task} />
      </div>
    );
  }
  return <div className="border-r border-[#d0d9ee]" />;
}

function GroupSection({
  group,
  tasks,
  collapsed,
  onToggleCollapse,
  onAddTask,
  onTaskClick,
  selectedTaskIds,
  onToggleTask,
  onToggleGroup,
  editingCell,
  onStartEdit,
  onSaveField,
  onCancelEdit,
  projectsData,
  workspaceMembers,
  isManager,
  sortMode,
  setSortMode,
  onOpenAiForTask,
  onUploadFiles,
  onRemoveFile,
  uploadingTaskId,
  editingGroupId,
  editingGroupTitle,
  onRenameGroup,
  onGroupTitleChange,
  onGroupTitleSave,
  onGroupTitleCancel,
  onRenameColumn,
  onRemoveColumn,
  onAddColumn,
}) {
  const { id, title, color, columns, isCustom } = group;
  const gridTemplate = getBoardGrid(columns);
  const latestDate = tasks
    .filter((task) => task.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .at(-1);

  const priorityCounts = tasks.reduce(
    (acc, task) => {
      if (task.priority === 'low') acc.low += 1;
      else if (task.priority === 'medium') acc.medium += 1;
      else if (task.priority === 'high' || task.priority === 'urgent') acc.high += 1;
      else acc.empty += 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0, empty: 0 }
  );

  return (
    <div className="mb-6 overflow-x-auto overflow-y-visible">
      <div className="mb-2 flex items-center gap-2 px-1">
        <button type="button" onClick={onToggleCollapse} className="flex h-4 w-4 items-center justify-center" style={{ color }}>
          <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition ${collapsed ? '-rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6.5 8 10l4-3.5" /></svg>
        </button>
        {editingGroupId === id ? (
          <input
            autoFocus
            value={editingGroupTitle}
            onChange={(event) => onGroupTitleChange(event.target.value)}
            onBlur={() => onGroupTitleSave(id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onGroupTitleSave(id);
              if (event.key === 'Escape') onGroupTitleCancel();
            }}
            className="h-7 min-w-[180px] rounded-[6px] border border-[#9ec5ff] bg-white px-2 text-[12px] font-semibold uppercase tracking-[0.02em] text-[#1f2a44] outline-none"
          />
        ) : (
          <button type="button" onClick={() => onRenameGroup(id, title)} className="text-[12px] font-semibold uppercase tracking-[0.02em]" style={{ color }}>{title}</button>
        )}
      </div>

      {!collapsed ? (
      <div
        className="relative overflow-x-auto overflow-y-visible rounded-[6px] bg-white"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
      >
        <div className="absolute left-0 top-0 h-full w-[5px] hidden md:block" style={{ backgroundColor: color, opacity: 0.78 }} />
        <button
          type="button"
          className="absolute -left-5 top-[58px] text-[18px] leading-none text-[#1f2a44] hidden md:block"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          ...
        </button>
        <div className="min-w-max overflow-visible rounded-[6px] border border-[#d0d9ee]" style={{ overflow: 'visible' }}>
        <GridRow className="bg-white" gridTemplate={gridTemplate}>
          <div className="flex items-center justify-center border-r border-[#d0d9ee] px-2 py-1.5">
            <button
              type="button"
              onClick={() => onToggleGroup(tasks)}
              className={`flex h-[18px] w-[18px] items-center justify-center rounded-sm border text-[12px] ${
                tasks.length && tasks.every((task) => selectedTaskIds.includes(task._id))
                  ? 'border-[#0073ea] bg-[#0073ea] text-white'
                  : 'border-[#c8d1e6] bg-white text-transparent'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <CheckboxGlyph />
            </button>
          </div>
          <HeaderCell className="text-left">Task</HeaderCell>
          <HeaderCell />
          {columns.map((column) => (
            <HeaderCell key={column}>
              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => onRenameColumn(id, column)}
                  className="truncate"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {COLUMN_LIBRARY[column]?.label || column}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveColumn(id, column)}
                  className="text-[#8a95ad] hover:text-[#1f2a44]"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  ×
                </button>
              </div>
            </HeaderCell>
          ))}
          <HeaderCell>
            <button type="button" onClick={() => onAddColumn(id)} style={{ WebkitTapHighlightColor: 'transparent' }}>+</button>
          </HeaderCell>
        </GridRow>

        {!tasks.length ? (
          <GridRow className="bg-white" gridTemplate={gridTemplate}>
            <div className="flex items-center justify-center border-r border-[#d0d9ee] px-2 py-1.5">
              <button
                type="button"
                className="flex h-[18px] w-[18px] items-center justify-center rounded-sm border border-[#c8d1e6] bg-white text-transparent"
              >
                <CheckboxGlyph />
              </button>
            </div>
            <div className="border-r border-[#d0d9ee] px-2.5 py-1.5">
              {onAddTask ? (
                <button
                  type="button"
                  onClick={onAddTask}
                  className="flex h-full w-full items-center text-left text-[12px] font-normal text-[#6b7795]"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {isCustom ? '+ Add row' : '+ Add task'}
                </button>
              ) : (
                <span className="text-[12px] text-[#6b7795]">{isCustom ? '+ Add row' : '+ Add task'}</span>
              )}
            </div>
            <div className="border-r border-[#d0d9ee]" />
            {columns.map((column, index) => (
              <div key={column} className={`${index < columns.length - 1 ? 'border-r border-[#d0d9ee]' : ''}`} />
            ))}
            <div />
          </GridRow>
        ) : (
          tasks.map((task) => (
            <GridRow key={task._id} gridTemplate={gridTemplate} className={selectedTaskIds.includes(task._id) ? 'bg-[#cfe5ff]' : ''}>
              <div className="flex items-center justify-center border-r border-[#d0d9ee] px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => onToggleTask(task._id)}
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded-sm border text-[12px] ${
                    selectedTaskIds.includes(task._id)
                      ? 'border-[#0073ea] bg-[#0073ea] text-white'
                      : 'border-[#c8d1e6] bg-white text-transparent'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <CheckboxGlyph />
                </button>
              </div>
              <div className="border-r border-[#d0d9ee]">
                <TaskNameCell
                  task={task}
                  onClick={() => onTaskClick(task)}
                  isEditing={editingCell?.taskId === task._id && editingCell?.field === 'title'}
                  onStartEdit={() => onStartEdit(task._id, 'title')}
                  onSave={(patch) => onSaveField(task, patch)}
                  onCancel={onCancelEdit}
                />
              </div>
              <div className="border-r border-[#d0d9ee]">
                <ActionIconsCell
                  onOpenTask={() => onTaskClick(task)}
                  onOpenAi={() => onOpenAiForTask?.(task)}
                />
              </div>
              {columns.map((column) => (
                <div key={`${task._id}-${column}`}>
                  {renderGroupCell(column, task, {
                    editingCell,
                    onStartEdit,
                    onSaveField,
                    onCancelEdit,
                    projectsData,
                    workspaceMembers,
                    isManager,
                    onUploadFiles,
                    onRemoveFile,
                    uploadingTaskId,
                  })}
                </div>
              ))}
              <div />
            </GridRow>
          ))
        )}

        {onAddTask ? <AddTaskFooterRow onAddTask={onAddTask} columns={columns} gridTemplate={gridTemplate} label={isCustom ? '+ Add row' : '+ Add task'} /> : null}
        <SummaryFooterRow
          latestDate={latestDate}
          priorityCounts={priorityCounts}
          budgetSum={tasks.reduce((sum, task) => sum + (task.attachments?.length ? task.attachments.length * 100 : 0), 0)}
          sortMode={sortMode}
          setSortMode={setSortMode}
          columns={columns}
          gridTemplate={gridTemplate}
        />
        </div>
      </div>
      ) : null}
    </div>
  );
}

function BoardToolbar({
  search,
  setSearch,
  sortMode,
  setSortMode,
  onNewTask,
  members,
  ownerFilter,
  setOwnerFilter,
  quickFilter,
  setQuickFilter,
  hideCompleted,
  setHideCompleted,
  selectedGroupFilter,
  setSelectedGroupFilter,
  groupConfigs,
}) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [searchOpen, setSearchOpen] = useState(Boolean(search.trim()));
  const searchInputRef = useRef(null);
  const toolbarRef = useRef(null);
  const filterButtonRef = useRef(null);
  const [filterPosition, setFilterPosition] = useState({ top: 0, left: 0, width: 860 });
  const activeFilterCount = (ownerFilter !== 'all' ? 1 : 0) + (quickFilter !== 'all' ? 1 : 0) + (hideCompleted ? 1 : 0) + (search.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearch('');
    setOwnerFilter('all');
    setQuickFilter('all');
    setHideCompleted(false);
  };

  useEffect(() => {
    const handleFocusSearch = () => {
      setSearchOpen(true);
      searchInputRef.current?.focus();
      searchInputRef.current?.select?.();
    };
    const handleOpenPerson = () => setActiveMenu('person');
    const handleOpenFilter = () => setActiveMenu('filter');
    const handleOpenSort = () => setActiveMenu('sort');
    const handleOpenHide = () => setActiveMenu('hide');
    const handleOpenGroup = () => setActiveMenu('group');

    window.addEventListener('dashboard:focus-search', handleFocusSearch);
    window.addEventListener('dashboard:open-person', handleOpenPerson);
    window.addEventListener('dashboard:open-filter', handleOpenFilter);
    window.addEventListener('dashboard:open-sort', handleOpenSort);
    window.addEventListener('dashboard:open-hide', handleOpenHide);
    window.addEventListener('dashboard:open-group', handleOpenGroup);

    return () => {
      window.removeEventListener('dashboard:focus-search', handleFocusSearch);
      window.removeEventListener('dashboard:open-person', handleOpenPerson);
      window.removeEventListener('dashboard:open-filter', handleOpenFilter);
      window.removeEventListener('dashboard:open-sort', handleOpenSort);
      window.removeEventListener('dashboard:open-hide', handleOpenHide);
      window.removeEventListener('dashboard:open-group', handleOpenGroup);
    };
  }, []);

  useEffect(() => {
    if (search.trim()) {
      setSearchOpen(true);
    }
  }, [search]);

  useEffect(() => {
    if (!activeMenu) return undefined;

    const handlePointerDown = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu !== 'filter') return undefined;

    const updatePosition = () => {
      const rect = filterButtonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const popupWidth = Math.min(860, window.innerWidth - 48);
      const centeredLeft = rect.left + rect.width / 2 - popupWidth / 2;
      const left = Math.max(24, Math.min(centeredLeft, window.innerWidth - popupWidth - 24));

      setFilterPosition({
        top: rect.bottom + 12,
        left,
        width: popupWidth,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [activeMenu]);

  return (
    <div ref={toolbarRef} className="border-b border-[#d8dff3] px-2 py-1 sm:px-5 sm:py-3">
      <div className="flex flex-wrap items-center gap-0.5 sm:gap-1.5">
        {onNewTask ? (
          <button
            type="button"
            onClick={onNewTask}
            className="inline-flex h-8 sm:h-9 items-center gap-1 rounded-[8px] bg-[#0073ea] px-2.5 sm:px-3 text-[11px] sm:text-[12px] font-medium text-white transition hover:bg-[#0060c0]"
            title="New task"
          >
            <span className="flex h-3.5 w-3.5 items-center justify-center text-[13px] leading-none">+</span>
            <span className="sm:hidden">Add task</span>
            <span className="hidden sm:inline">New task</span>
            <span className="hidden sm:flex sm:h-3.5 sm:w-3.5 sm:items-center sm:justify-center">
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6.5 8 10l4-3.5" />
              </svg>
            </span>
          </button>
        ) : null}

        <div className="relative">
          {searchOpen ? (
            <label className="relative flex h-9 sm:h-10 items-center">
              <span className="pointer-events-none absolute left-3 flex h-4 w-4 items-center justify-center text-[#667391]">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="9" r="5.5" />
                  <path d="m13.5 13.5 4 4" />
                </svg>
              </span>
              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onBlur={() => {
                  if (!search.trim()) {
                    setSearchOpen(false);
                  }
                }}
                placeholder="Search"
                className="h-full w-[140px] sm:w-[212px] rounded-[7px] border border-[#d0d9ee] bg-white pl-9 pr-9 text-[13px] text-[#1f2a44] outline-none transition focus:border-[#b8c7e6]"
              />
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSearch('');
                  setSearchOpen(false);
                }}
                className="absolute right-3 flex h-4 w-4 items-center justify-center text-[#8a95ad] transition hover:text-[#4f5c78]"
                aria-label="Close search"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4 12 12" />
                  <path d="M12 4 4 12" />
                </svg>
              </button>
            </label>
          ) : (
            <ToolbarAction
              onClick={() => {
                setSearchOpen(true);
                window.setTimeout(() => {
                  searchInputRef.current?.focus();
                }, 0);
              }}
            >
              <span className="flex h-4 w-4 items-center justify-center text-[#667391]">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="9" r="5.5" />
                  <path d="m13.5 13.5 4 4" />
                </svg>
              </span>
              <span>Search</span>
            </ToolbarAction>
          )}
        </div>

        <div className="relative">
          <ToolbarAction onClick={() => setActiveMenu((current) => (current === 'person' ? null : 'person'))}>
            <span className="flex h-4 w-4 items-center justify-center text-[#667391]">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="8" />
                <circle cx="10" cy="7.2" r="2.8" />
                <path d="M5.7 15.2a5.2 5.2 0 0 1 8.6 0" />
              </svg>
            </span>
            <span>Person</span>
          </ToolbarAction>
          {activeMenu === 'person' ? (
            <ToolbarMenu>
              <TinyOption active={ownerFilter === 'all'} onClick={() => { setOwnerFilter('all'); setActiveMenu(null); }}>
                All people
              </TinyOption>
              <TinyOption active={ownerFilter === 'unassigned'} onClick={() => { setOwnerFilter('unassigned'); setActiveMenu(null); }}>
                Unassigned
              </TinyOption>
              {members.map((member) => (
                <TinyOption key={member._id} active={ownerFilter === member._id} onClick={() => { setOwnerFilter(member._id); setActiveMenu(null); }}>
                  {member.name}
                </TinyOption>
              ))}
            </ToolbarMenu>
          ) : null}
        </div>

        <div ref={filterButtonRef} className="relative">
          <ToolbarAction onClick={() => setActiveMenu((current) => (current === 'filter' ? null : 'filter'))}>
            <span className="contents">
              <span className="flex h-4 w-4 items-center justify-center text-[#667391]">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 4.5h13l-5 5.7v4.3l-3 1.6v-5.9l-5-5.7Z" />
                </svg>
              </span>
              <span>{activeFilterCount ? `Filter / ${activeFilterCount}` : 'Filter'}</span>
              <span className="flex h-4 w-4 items-center justify-center text-[#667391]">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6.5 8 10l4-3.5" />
                </svg>
              </span>
            </span>
          </ToolbarAction>
          {activeMenu === 'filter' ? (
            <div
              data-dashboard-toolbar-menu="true"
              className="fixed z-[80] rounded-[16px] border border-[#d8dff3] bg-white shadow-[0_20px_52px_rgba(15,23,42,0.18)]"
              style={{ top: filterPosition.top, left: filterPosition.left, width: filterPosition.width }}
            >
              <div className="flex items-center justify-between border-b border-[#e8edf7] px-6 py-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-[18px] font-semibold text-[#2a3248]">Quick filters</h3>
                  <p className="text-[14px] text-[#667391]">
                    Showing {activeFilterCount || 0} of 4 filters
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[14px] font-medium text-[#3f4a66] transition hover:text-[#0073ea]"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMenu(null)}
                    className="rounded-[8px] border border-[#cfd8ea] px-4 py-2 text-[14px] font-medium text-[#3f4a66] transition hover:bg-[#f6f9ff]"
                  >
                    Done
                  </button>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <FilterSection title="Person" count={members.length + 2}>
                    <FilterChip active={ownerFilter === 'all'} onClick={() => setOwnerFilter('all')}>
                      All people
                    </FilterChip>
                    <FilterChip active={ownerFilter === 'unassigned'} onClick={() => setOwnerFilter('unassigned')}>
                      Unassigned
                    </FilterChip>
                    {members.map((member) => (
                      <FilterChip
                        key={member._id}
                        active={ownerFilter === member._id}
                        onClick={() => setOwnerFilter(member._id)}
                        icon={<AvatarBadge name={member.name} size="sm" />}
                      >
                        {member.name}
                      </FilterChip>
                    ))}
                  </FilterSection>

                  <FilterSection title="Status" count={4}>
                    <FilterChip active={quickFilter === 'all'} onClick={() => setQuickFilter('all')}>
                      All tasks
                    </FilterChip>
                    <FilterChip active={quickFilter === 'overdue'} onClick={() => setQuickFilter('overdue')}>
                      Overdue only
                    </FilterChip>
                    <FilterChip active={quickFilter === 'high'} onClick={() => setQuickFilter('high')}>
                      High priority
                    </FilterChip>
                    <FilterChip active={quickFilter === 'dated'} onClick={() => setQuickFilter('dated')}>
                      Has due date
                    </FilterChip>
                  </FilterSection>

                  <FilterSection title="Visibility" count={2}>
                    <FilterChip active={!hideCompleted} onClick={() => setHideCompleted(false)}>
                      Show completed group
                    </FilterChip>
                    <FilterChip active={hideCompleted} onClick={() => setHideCompleted(true)}>
                      Hide completed group
                    </FilterChip>
                  </FilterSection>

                  <FilterSection title="Sort" count={2}>
                    <FilterChip active={sortMode === 'due_asc'} onClick={() => setSortMode('due_asc')}>
                      Due date
                    </FilterChip>
                    <FilterChip active={sortMode === 'updated_desc'} onClick={() => setSortMode('updated_desc')}>
                      Last updated
                    </FilterChip>
                  </FilterSection>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <ToolbarAction onClick={() => setActiveMenu((current) => (current === 'sort' ? null : 'sort'))}>
            <span className="flex h-4 w-4 items-center justify-center text-[#667391]">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3v14" />
                <path d="m3.5 5.5 2.5-2.5 2.5 2.5" />
                <path d="M14 17V3" />
                <path d="m11.5 14.5 2.5 2.5 2.5-2.5" />
              </svg>
            </span>
            <span>Sort</span>
          </ToolbarAction>
          {activeMenu === 'sort' ? (
            <ToolbarMenu>
              <TinyOption active={sortMode === 'due_asc'} onClick={() => { setSortMode('due_asc'); setActiveMenu(null); }}>
                Due date
              </TinyOption>
              <TinyOption active={sortMode === 'updated_desc'} onClick={() => { setSortMode('updated_desc'); setActiveMenu(null); }}>
                Last updated
              </TinyOption>
            </ToolbarMenu>
          ) : null}
        </div>

        <div className="relative">
          <ToolbarAction onClick={() => setActiveMenu((current) => (current === 'hide' ? null : 'hide'))}>
            <span className="flex h-4 w-4 items-center justify-center text-[#667391]">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 10c1.8-3.2 4.5-4.8 7.5-4.8s5.7 1.6 7.5 4.8c-1.8 3.2-4.5 4.8-7.5 4.8S4.3 13.2 2.5 10Z" />
                <circle cx="10" cy="10" r="2.2" />
                <path d="M4 16 16 4" />
              </svg>
            </span>
            <span>Hide</span>
          </ToolbarAction>
          {activeMenu === 'hide' ? (
            <ToolbarMenu align="right">
              <TinyOption active={hideCompleted} onClick={() => { setHideCompleted((current) => !current); setActiveMenu(null); }}>
                Hide completed group
              </TinyOption>
              <TinyOption active={!search} onClick={() => { setSearch(''); setActiveMenu(null); }}>
                Clear search
              </TinyOption>
            </ToolbarMenu>
          ) : null}
        </div>

        <div className="relative">
          <ToolbarAction onClick={() => setActiveMenu((current) => (current === 'group' ? null : 'group'))}>
            <span className="flex h-4 w-4 items-center justify-center text-[#667391]">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="4" width="13" height="12" rx="1.5" />
                <path d="M9.8 4v12" />
              </svg>
            </span>
            <span>Group by</span>
            {selectedGroupFilter !== 'all' ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: groupConfigs.find((g) => g.id === selectedGroupFilter)?.color || '#0073ea' }}>
                ✓
              </span>
            ) : null}
          </ToolbarAction>
          {activeMenu === 'group' ? (
            <ToolbarMenu>
              <TinyOption active={selectedGroupFilter === 'all'} onClick={() => { setSelectedGroupFilter('all'); setActiveMenu(null); }}>
                All groups
              </TinyOption>
              {groupConfigs.map((group) => (
                <TinyOption key={group.id} active={selectedGroupFilter === group.id} onClick={() => { setSelectedGroupFilter(group.id); setActiveMenu(null); }}>
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />
                    <span>{group.title}</span>
                  </span>
                </TinyOption>
              ))}
              {selectedGroupFilter !== 'all' ? (
                <div className="border-t border-[#ebeff6] pt-1 mt-1">
                  <button
                    type="button"
                    onClick={() => { setSelectedGroupFilter('all'); setActiveMenu(null); }}
                    className="flex w-full items-center justify-between rounded-[6px] px-2 py-1.5 text-left text-[13px] text-[#e2445c] transition hover:bg-[#fff6f8]"
                  >
                    <span>Clear filter</span>
                  </button>
                </div>
              ) : null}
            </ToolbarMenu>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoTable({ title, columns, rows, emptyLabel }) {
  return (
    <div className="overflow-x-auto rounded-[16px] border border-[#e2e8f0] bg-white">
      <div className="border-b border-[#f1f5f9] px-5 py-4">
        <h3 className="text-[16px] font-semibold text-[#0f172a]">{title}</h3>
      </div>
      <div
        className="grid border-b border-[#f1f5f9] bg-[#f8fafc] text-[12px] font-semibold uppercase tracking-[0.04em] text-[#64748b]"
        style={{ gridTemplateColumns: columns.map((column) => column.width).join(' ') }}
      >
        {columns.map((column, index) => (
          <div key={column.key} className={`px-5 py-3 text-center first:text-left`}>
            {column.label}
          </div>
        ))}
      </div>
      {!rows.length ? (
        <div className="px-6 py-16 text-center">
          <div className="mb-2 text-[13px] font-medium text-[#64748b]">{emptyLabel}</div>
        </div>
      ) : (
        rows.map((row, idx) => (
          <div
            key={row.id}
            className="grid border-b border-[#f1f5f9] text-[14px] text-[#334155] transition hover:bg-[#f8fafc] last:border-b-0"
            style={{ gridTemplateColumns: columns.map((column) => column.width).join(' ') }}
          >
            {columns.map((column, index) => (
              <div key={column.key} className={`px-5 py-4 text-center first:text-left font-medium ${column.className || ''}`}>
                {row[column.key]}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function WorkloadGraph({ workload }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const memberRows = workload.filter((entry) => entry.userId !== 'unassigned');
  const assignedRows = memberRows
    .filter((entry) => entry.openTasks > 0)
    .slice()
    .sort((a, b) => b.openTasks - a.openTasks || b.overdue - a.overdue);
  const unassignedRow = workload.find((entry) => entry.userId === 'unassigned');
  const assignedOpen = memberRows.reduce((sum, entry) => sum + entry.openTasks, 0);
  const overdueOpen = memberRows.reduce((sum, entry) => sum + (entry.overdue || 0), 0);
  const highPriorityOpen = memberRows.reduce((sum, entry) => sum + (entry.highPriority || 0), 0);
  const activeMembers = memberRows.filter((entry) => entry.openTasks > 0).length;
  const averageLoadValue = activeMembers ? assignedOpen / activeMembers : 0;
  const averageLoad = averageLoadValue.toFixed(1);
  const scaleMax = Math.max(...assignedRows.map((entry) => entry.openTasks), 1);
  const chartSuggestedMax = Math.max(Math.ceil(scaleMax * 1.25), 4);

  useEffect(() => {
    if (!canvasRef.current || !assignedRows.length) return undefined;

    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: assignedRows.map((entry) => entry.name),
        datasets: [
          {
            label: 'Not started',
            data: assignedRows.map((entry) => entry.backlog),
            backgroundColor: '#94a3b8',
            borderRadius: 7,
            stack: 'a',
            barThickness: 18,
            borderSkipped: false,
          },
          {
            label: 'Working on it',
            data: assignedRows.map((entry) => entry.inProgress),
            backgroundColor: '#3b82f6',
            borderRadius: 7,
            stack: 'a',
            barThickness: 18,
            borderSkipped: false,
          },
          {
            label: 'Stuck',
            data: assignedRows.map((entry) => entry.review),
            backgroundColor: '#f97316',
            borderRadius: 7,
            stack: 'a',
            barThickness: 18,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        layout: {
          padding: { top: 6, right: 10, bottom: 6, left: 6 },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { size: 13, weight: '600' },
            bodyFont: { size: 12 },
            footerFont: { size: 11 },
            padding: 12,
            displayColors: true,
            cornerRadius: 10,
            boxPadding: 4,
            callbacks: {
              title: (items) => assignedRows[items[0].dataIndex]?.name ?? '',
              footer: (items) => {
                const total = items.reduce((sum, item) => sum + item.raw, 0);
                const row = assignedRows[items[0]?.dataIndex];
                return `Open tasks: ${total}${row?.overdue ? ` • Overdue: ${row.overdue}` : ''}`;
              },
            },
          },
        },
        scales: {
          y: {
            stacked: true,
            grid: { display: false, drawBorder: false },
            border: { display: false },
            ticks: {
              font: { size: 12, weight: '600' },
              color: '#475569',
              crossAlign: 'far',
              padding: 10,
            },
          },
          x: {
            stacked: true,
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.12)', drawBorder: false },
            border: { display: false },
            ticks: {
              font: { size: 11 },
              color: '#64748b',
              stepSize: 1,
            },
            suggestedMax: chartSuggestedMax,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [assignedRows, chartSuggestedMax]);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Assigned open', value: assignedOpen, accent: '#0f172a', bg: '#dbeafe' },
          { label: 'Unassigned', value: unassignedRow?.openTasks || 0, accent: (unassignedRow?.openTasks || 0) > 0 ? '#b45309' : '#64748b', bg: '#fef3c7' },
          { label: 'Overdue open', value: overdueOpen, accent: overdueOpen > 0 ? '#b91c1c' : '#64748b', bg: '#fee2e2' },
          { label: 'High priority', value: highPriorityOpen, accent: highPriorityOpen > 0 ? '#1d4ed8' : '#64748b', bg: '#dbeafe' },
        ].map(({ label, value, accent, bg }) => (
          <div key={label} className="group rounded-[14px] border border-[#e2e8f0] bg-white px-4 py-3.5 transition hover:border-[#cbd5e1] hover:shadow-[0_4px_8px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">{label}</p>
                <p className="mt-2 text-[24px] font-bold" style={{ color: accent }}>{value}</p>
              </div>
              <div className="rounded-lg p-1.5" style={{ background: bg }}>
                <div className="h-3 w-3 rounded-full" style={{ background: accent }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 overflow-hidden rounded-[20px] border border-[#e2e8f0] bg-white shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-5">
          <div>
            <p className="text-[15px] font-semibold text-[#0f172a]">Team workload</p>
            <p className="mt-1 text-[12px] text-[#64748b]">
              Task-based workload by assignee, stacked by current task status
            </p>
          </div>
          <div className="rounded-full border border-[#e2e8f0] bg-[#f0fdf4] px-3.5 py-1.5 text-[12px] font-semibold text-[#16a34a]">
            Avg load {averageLoad}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 border-b border-[#f1f5f9] px-6 py-4">
          {[
            { color: '#94a3b8', label: 'Not started' },
            { color: '#3b82f6', label: 'Working on it' },
            { color: '#f97316', label: 'Stuck' },
          ].map(({ color, label }) => (
            <span key={label} className="inline-flex items-center gap-2 text-[12px] font-medium text-[#475569]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>

        <div className="bg-white px-6 pb-6 pt-5">
          {!assignedRows.length ? (
            <div className="rounded-[14px] border border-dashed border-[#e2e8f0] bg-[#f8fafc] px-5 py-12 text-center">
              <p className="text-[13px] font-semibold text-[#475569]">No assigned workload yet</p>
              <p className="mt-2 text-[12px] text-[#64748b]">
                Assign tasks to project members to see a real workload chart. Unassigned work: {unassignedRow?.openTasks || 0}
              </p>
            </div>
          ) : (
            <div className="rounded-[16px] border border-[#f1f5f9] bg-gradient-to-br from-white via-[#fafbfc] to-[#f8fafc] p-5">
              <div className="mb-5 grid grid-cols-2 gap-3 border-b border-[#f1f5f9] pb-4 xl:grid-cols-4">
                {assignedRows
                  .slice()
                  .slice(0, 4)
                  .map((entry) => (
                    <div key={entry.userId} className="rounded-[12px] bg-[#f0fdf4] px-3.5 py-3">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">{entry.name}</p>
                      <p className="mt-2 text-[22px] font-bold text-[#0f172a]">{entry.openTasks}</p>
                      <p className="mt-1.5 text-[11px] font-medium text-[#475569]\">
                        {entry.overdue ? `${entry.overdue} overdue` : 'On track'}
                      </p>
                    </div>
                  ))}
              </div>
              <div style={{ position: 'relative', height: `${Math.max(260, assignedRows.length * 46 + 80)}px` }}>
                <canvas ref={canvasRef} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[#e2e8f0] bg-white shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">Individual member workload</p>
          <p className="text-[12px] font-medium text-[#475569]">{activeMembers} active members</p>
        </div>

        {memberRows.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#e2e8f0] bg-[#f8fafc] m-4 px-5 py-12 text-center">
            <p className="text-[13px] font-medium text-[#64748b]">No members to display.</p>
          </div>
        ) : (
          assignedRows.concat(memberRows.filter((entry) => entry.openTasks === 0)).map((entry, index) => {
            const value = entry.openTasks;
            const avatarPalette = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const total = Math.max(value, 1);
            const backlogPct = value ? (entry.backlog / total) * 100 : 0;
            const inProgressPct = value ? (entry.inProgress / total) * 100 : 0;
            const reviewPct = value ? (entry.review / total) * 100 : 0;

            return (
              <div
                key={entry.userId}
                className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(220px,1.2fr)_repeat(3,minmax(88px,0.42fr))]"
                style={{ borderBottom: index < memberRows.length - 1 ? '1px solid #f0f3fa' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ background: avatarPalette.bg, color: avatarPalette.fg }}
                  >
                    {getInitials(entry.name)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[#1f2a44]">{entry.name}</p>
                    <p className="mt-1 text-[11px] text-[#7a84a4]">
                      {value} open tasks
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-medium text-[#475569]">Current mix</p>
                    <p className="text-[11px] text-[#64748b]">{value ? `${entry.backlog}/${entry.inProgress}/${entry.review}` : '0/0/0'}</p>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-[#edf2f7]">
                    <div style={{ width: `${backlogPct}%` }} className="bg-[#94a3b8]" />
                    <div style={{ width: `${inProgressPct}%` }} className="bg-[#3b82f6]" />
                    <div style={{ width: `${reviewPct}%` }} className="bg-[#f97316]" />
                  </div>
                </div>

                <div className="rounded-[14px] border border-[#e8edf6] bg-[#fafcff] px-3 py-2 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#7a84a4]">Open</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#1f2a44]">{value}</p>
                </div>

                <div className="rounded-[14px] border border-[#e8edf6] bg-[#fafcff] px-3 py-2 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#7a84a4]">Overdue</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#b91c1c]">{entry.overdue}</p>
                </div>

                <div className="rounded-[14px] border border-[#e8edf6] bg-[#fafcff] px-3 py-2 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#7a84a4]">Priority</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#1d4ed8]">{entry.highPriority}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CompletionView({ summary, trend }) {
  const trendMax = Math.max(...(trend.map((item) => item.count) || [1]));

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
      <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-6">
        <div className="mb-6">
          <h3 className="text-[15px] font-semibold text-[#0f172a]">Completion by project</h3>
          <p className="mt-1 text-[13px] text-[#64748b]">Live completion percentages from the backend summary.</p>
        </div>

        {!summary?.projectCompletion?.length ? (
          <div className="rounded-[12px] border border-dashed border-[#e2e8f0] bg-[#f8fafc] py-10 text-center">
            <p className="text-[13px] font-medium text-[#64748b]">No project completion data yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {summary.projectCompletion.map((project) => (
              <div key={project.projectId} className="rounded-[12px] border border-[#f1f5f9] bg-[#f8fafc] p-3.5 transition hover:border-[#e2e8f0] hover:bg-white">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[#0f172a]">{project.projectName}</p>
                    <p className="mt-0.5 text-[12px] text-[#64748b]">{project.done} of {project.total} tasks complete</p>
                  </div>
                  <div className="rounded-lg bg-[#e0f2fe] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0284c7]">
                    {project.projectStatus.replaceAll('_', ' ')}
                  </div>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#e2e8f0]">
                  <div className="h-full bg-gradient-to-r from-[#0284c7] to-[#64e6d6]" style={{ width: `${project.completionPercent}%` }} />
                </div>
                <p className="mt-2 text-right text-[12px] font-semibold text-[#0f172a]">{project.completionPercent}%</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-6">
        <div className="mb-6">
          <h3 className="text-[15px] font-semibold text-[#0f172a]">Completion trend</h3>
          <p className="mt-1 text-[13px] text-[#64748b]">Finished tasks over the last 30 days.</p>
        </div>

        {!trend.length ? (
          <div className="rounded-[12px] border border-dashed border-[#e2e8f0] bg-[#f8fafc] py-10 text-center">
            <p className="text-[13px] font-medium text-[#64748b]">No completed tasks yet.</p>
          </div>
        ) : (
          <div className="flex h-[260px] items-end gap-2 rounded-[16px] bg-gradient-to-b from-[#f0fdf4] to-[#f8fafc] px-4 py-6">
            {trend.map((entry) => {
              const height = trendMax > 0 ? Math.max(12, Math.round((entry.count / trendMax) * 100)) : 12;
              return (
                <div key={entry.date} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div className="w-full rounded-lg bg-gradient-to-t from-[#16a34a] to-[#4ade80] shadow-[0_2px_4px_rgba(22,163,74,0.15)] transition hover:shadow-[0_4px_8px_rgba(22,163,74,0.25)]" style={{ height: `${height}%` }} />
                  <span className="text-[11px] font-medium text-[#64748b]">{entry.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ViewToolbarButton({ children, active = false, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 sm:h-9 md:h-10 items-center gap-1 sm:gap-1.5 md:gap-2 rounded-[7px] md:rounded-[8px] border px-2 sm:px-2.5 md:px-3 text-[11px] sm:text-[12px] md:text-[13px] font-medium transition ${
        active
          ? 'border-[#bad7ff] bg-[#e9f3ff] text-[#0059b8]'
          : 'border-[#d6dced] bg-white text-[#2d3554] hover:bg-[#f8fbff]'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function ViewChrome({
  children,
  onNewTask,
  onFocusSearch,
  onOpenPerson,
  onOpenFilter,
  onOpenAddView,
  onExport,
  searchLabel = 'Search',
  filterLabel = 'Filter',
  showExport = true,
}) {
  return (
    <>
      <div className="border-b border-[#d8dff3] px-2 py-2 sm:px-4 md:px-5 md:py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3">
            {onNewTask ? (
              <button
                type="button"
                onClick={onNewTask}
                className="inline-flex h-8 sm:h-9 md:h-10 items-center gap-1.5 sm:gap-2 rounded-[7px] md:rounded-[8px] bg-[#0073ea] px-2.5 sm:px-3 md:px-3.5 text-[11px] sm:text-[12px] md:text-[13px] font-medium text-white transition hover:bg-[#005ec0]"
              >
                <span>New task</span>
                <svg viewBox="0 0 16 16" className="h-3 sm:h-3.5 md:h-3.5 w-3 sm:w-3.5 md:w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6.5 8 10l4-3.5" />
                </svg>
              </button>
            ) : null}
            <ViewToolbarButton onClick={onOpenAddView}>
              <span className="text-[18px] sm:text-[20px] md:text-[22px] leading-none">+</span>
              <span className="hidden sm:inline">Add widget</span>
            </ViewToolbarButton>
            <ViewToolbarButton onClick={onFocusSearch}>
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="9" r="5.5" />
                <path d="m13.5 13.5 4 4" />
              </svg>
              <span>{searchLabel}</span>
            </ViewToolbarButton>
            <ViewToolbarButton onClick={onOpenPerson}>
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="8" />
                <circle cx="10" cy="7.2" r="2.8" />
                <path d="M5.7 15.2a5.2 5.2 0 0 1 8.6 0" />
              </svg>
              <span>Person</span>
            </ViewToolbarButton>
            <ViewToolbarButton onClick={onOpenFilter}>
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.5 4.5h13l-5 5.7v4.3l-3 1.6v-5.9l-5-5.7Z" />
              </svg>
              <span>{filterLabel}</span>
            </ViewToolbarButton>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {showExport ? (
              <ViewToolbarButton onClick={onExport}>
                <svg viewBox="0 0 20 20" className="h-3.5 sm:h-4 md:h-4 w-3.5 sm:w-4 md:w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 3.5v9" />
                  <path d="m6.5 9 3.5 3.5L13.5 9" />
                  <path d="M4 13.5v2h12v-2" />
                </svg>
                <span className="hidden sm:inline">Export</span>
              </ViewToolbarButton>
            ) : null}
            <button type="button" className="flex h-8 sm:h-9 md:h-10 w-8 sm:w-9 md:w-10 items-center justify-center rounded-full bg-[#f5f7fb] text-[#6b7795] transition hover:bg-[#eef2f7]">
              <svg viewBox="0 0 16 16" className="h-3 sm:h-3.5 md:h-3.5 w-3 sm:w-3.5 md:w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9.5 8 5l4 4.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}

function StatusChartView({ tasks }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const statusCounts = useMemo(
    () => [
      { label: 'Working on it', value: tasks.filter((task) => task.status === 'in_progress').length, color: '#fdab3d' },
      { label: 'Done', value: tasks.filter((task) => task.status === 'done').length, color: '#00c875' },
      { label: 'Stuck', value: tasks.filter((task) => task.status === 'review').length, color: '#e2445c' },
      { label: 'Not started', value: tasks.filter((task) => task.status === 'backlog').length, color: '#94a3b8' },
    ],
    [tasks]
  );

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: statusCounts.map((item) => item.label),
        datasets: [
          {
            data: statusCounts.map((item) => item.value),
            backgroundColor: statusCounts.map((item) => item.color),
            borderRadius: 10,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1f2432',
            displayColors: true,
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            border: { display: false },
            ticks: { color: '#44506c', font: { size: 12 } },
          },
          y: {
            beginAtZero: true,
            suggestedMax: Math.max(...statusCounts.map((item) => item.value), 2) + 1,
            grid: { color: '#edf1f7', drawBorder: false },
            border: { display: false },
            ticks: { color: '#75819d', stepSize: 1, font: { size: 11 } },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [statusCounts]);

  return (
    <div className="p-4">
      <div className="overflow-hidden rounded-[14px] border border-[#d9e1f4] bg-white">
        <div className="flex items-center justify-between border-b border-[#d9e1f4] px-5 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[18px] font-semibold text-[#1f2a44]">Chart</h3>
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#6b7795]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 4.5h13l-5 5.7v4.3l-3 1.6v-5.9l-5-5.7Z" />
            </svg>
          </div>
          <button type="button" className="text-[20px] leading-none text-[#6b7795]">...</button>
        </div>
        <div className="px-5 py-4">
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {statusCounts.map((item) => (
              <div key={item.label} className="rounded-[12px] border border-[#e6ebf5] bg-[#fbfcff] px-4 py-3">
                <p className="text-[12px] text-[#7a84a4]">{item.label}</p>
                <p className="mt-1 text-[24px] font-semibold" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="h-[360px]">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FileGalleryView({ items, search, onSearchChange, mode, onModeChange, onTaskClick }) {
  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        `${item.attachment.filename} ${item.task.title}`.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [items, search]
  );

  return (
    <div className="p-4">
      <div className="overflow-hidden rounded-[14px] border border-[#d9e1f4] bg-white">
        <div className="flex items-center justify-between border-b border-[#d9e1f4] px-5 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[18px] font-semibold text-[#1f2a44]">Files Gallery</h3>
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#6b7795]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 4.5h13l-5 5.7v4.3l-3 1.6v-5.9l-5-5.7Z" />
            </svg>
          </div>
          <button type="button" className="text-[20px] leading-none text-[#6b7795]">...</button>
        </div>
        <div className="px-5 py-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <label className="relative block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa5bf]">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="9" r="5.5" />
                  <path d="m13.5 13.5 4 4" />
                </svg>
              </span>
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search for files"
                className="h-11 w-[220px] rounded-[8px] border border-[#d9e1f4] bg-[#f5f7fb] pl-10 pr-3 text-[13px] text-[#1f2a44] outline-none"
              />
            </label>
            <div className="flex items-center gap-2">
              <ViewToolbarButton active={mode === 'grid'} onClick={() => onModeChange('grid')} className="px-3">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="4.5" height="4.5" />
                  <rect x="9.5" y="2" width="4.5" height="4.5" />
                  <rect x="2" y="9.5" width="4.5" height="4.5" />
                  <rect x="9.5" y="9.5" width="4.5" height="4.5" />
                </svg>
              </ViewToolbarButton>
              <ViewToolbarButton active={mode === 'list'} onClick={() => onModeChange('list')} className="px-3">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 4h10" />
                  <path d="M3 8h10" />
                  <path d="M3 12h10" />
                </svg>
              </ViewToolbarButton>
            </div>
          </div>

          {!filteredItems.length ? (
            <div className="flex min-h-[380px] flex-col items-center justify-center rounded-[12px]">
              <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="flex h-24 w-24 items-center justify-center rounded-[12px] bg-[#ffc61a] text-white">
                  <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor"><path d="m8 6 10 6-10 6V6Z" /></svg>
                </div>
                <div className="flex h-24 w-24 items-center justify-center rounded-[12px] bg-[#b8d2ff] text-[#08b567]">
                  <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m21 16-5.5-5.5L7 19"/></svg>
                </div>
              </div>
              <p className="text-[32px] leading-none">🗂️</p>
              <p className="mt-4 text-[16px] font-medium text-[#1f2a44]">No files were found.</p>
              <p className="mt-2 max-w-[620px] text-center text-[13px] text-[#6b7795]">
                Please upload files to any item&apos;s files column, gallery or updates so they will be displayed here.
              </p>
            </div>
          ) : mode === 'grid' ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTaskClick(item.task)}
                  className="rounded-[14px] border border-[#d9e1f4] bg-[#fbfcff] p-4 text-left transition hover:bg-white"
                >
                  <div className="mb-3 flex h-32 items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,#edf4ff_0%,#f8fbff_100%)] text-[#5b74d6]">
                    <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/></svg>
                  </div>
                  <p className="truncate text-[14px] font-semibold text-[#1f2a44]">{item.attachment.filename}</p>
                  <p className="mt-1 truncate text-[12px] text-[#6b7795]">{item.task.title}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTaskClick(item.task)}
                  className="grid w-full grid-cols-[52px_minmax(0,1fr)_160px] items-center gap-3 rounded-[12px] border border-[#e2e8f4] px-4 py-3 text-left transition hover:bg-[#fbfcff]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#eef4ff] text-[#5b74d6]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[#1f2a44]">{item.attachment.filename}</p>
                    <p className="truncate text-[12px] text-[#6b7795]">{item.task.title}</p>
                  </div>
                  <div className="truncate text-right text-[12px] text-[#6b7795]">{formatUpdatedAgo(item.task.updatedAt || item.task.createdAt)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BoardFormView({
  projectName,
  values,
  onChange,
  onSubmit,
  submitting,
  recentTasks,
  showResults,
  setShowResults,
  onShare,
  members,
  onEditForm,
}) {
  return (
    <div className="min-h-[720px] bg-[#f6f8fc]">
      <div className="flex flex-wrap items-center justify-between border-b border-[#d9e1f4] bg-white gap-2 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-3">
        <ViewToolbarButton active={showResults} onClick={() => setShowResults((current) => !current)}>
          <svg viewBox="0 0 16 16" className="h-3.5 sm:h-4 md:h-4 w-3.5 sm:w-4 md:w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 2v6l4 4" />
          </svg>
          <span className="hidden sm:inline">Results</span>
        </ViewToolbarButton>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-2">
          <ViewToolbarButton onClick={onEditForm}>
            <svg viewBox="0 0 16 16" className="h-3.5 sm:h-4 md:h-4 w-3.5 sm:w-4 md:w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 13 13 3" />
              <path d="m10 3h3v3" />
            </svg>
            <span className="hidden sm:inline">Edit form</span>
          </ViewToolbarButton>
          <button type="button" onClick={onShare} className="inline-flex h-8 sm:h-9 md:h-10 items-center gap-1 sm:gap-1.5 md:gap-2 rounded-[7px] md:rounded-[8px] bg-[#0073ea] px-2.5 sm:px-3 md:px-4 text-[11px] sm:text-[12px] md:text-[13px] font-medium text-white transition hover:bg-[#005ec0]">
            <span>Share form</span>
          </button>
          <button type="button" className="inline-flex h-8 sm:h-9 md:h-10 items-center justify-center rounded-[7px] md:rounded-[8px] bg-[#0057d9] px-2 sm:px-2.5 md:px-3 text-white text-[14px] sm:text-[15px] md:text-[16px] transition hover:bg-[#004ab8]">↗</button>
          <AssigneeIcon assigned size="md" title="Form owner" />
          <button type="button" className="text-[20px] leading-none text-[#667391]">...</button>
        </div>
      </div>

      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-8">
        {showResults ? (
          <div className="mx-auto max-w-[980px] rounded-[14px] sm:rounded-[16px] md:rounded-[18px] border border-[#d9e1f4] bg-white p-3 sm:p-4 md:p-6">
            <div className="mb-4 sm:mb-5 md:mb-5">
              <h3 className="text-[18px] sm:text-[20px] md:text-[22px] font-semibold text-[#1f2a44]">Recent submissions</h3>
              <p className="text-[12px] sm:text-[13px] md:text-[13px] text-[#6b7795] mt-1">Tasks created through this board form.</p>
            </div>
            {!recentTasks.length ? (
              <div className="rounded-[12px] border border-dashed border-[#d9e1f4] px-4 py-14 text-center text-[14px] text-[#6b7795]">No submissions yet.</div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task._id} className="grid gap-4 rounded-[12px] border border-[#e6ebf5] px-4 py-4 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.6fr))]">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-[#1f2a44]">{task.title}</p>
                      <p className="mt-1 truncate text-[12px] text-[#6b7795]">{task.description || 'No description'}</p>
                    </div>
                    <div className="text-[12px] text-[#6b7795]">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b96b2]">Status</p>
                      <span>{(STATUS_META[task.status] || STATUS_META.backlog).label}</span>
                    </div>
                    <div className="text-[12px] text-[#6b7795]">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b96b2]">Priority</p>
                      <span>{(PRIORITY_META[task.priority] || PRIORITY_META.default).label || 'Auto'}</span>
                    </div>
                    <div className="text-[12px] text-[#6b7795]">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b96b2]">Owner</p>
                      <span>{task.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                    <div className="text-[12px] text-[#6b7795]">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b96b2]">Due</p>
                      <span>{task.dueDate ? formatLongDate(task.dueDate) : 'No date'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto grid max-w-[1100px] gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-[22px] border border-[#d9e1f4] bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7a84a4]">Form details</p>
              <h3 className="mt-3 text-[26px] font-semibold text-[#1f2a44]">{projectName || 'Board form'}</h3>
              <p className="mt-3 text-[14px] leading-6 text-[#63708d]">
                Capture work requests in a cleaner way. Submitters can define the task, due date, owner, and priority directly from this board form.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { label: 'Linked board', value: projectName || 'Current board' },
                  { label: 'Fields', value: 'Title, details, status, priority, owner, due date' },
                  { label: 'Submissions', value: `${recentTasks.length} recent tasks` },
                ].map((item) => (
                  <div key={item.label} className="rounded-[14px] border border-[#e6ebf5] bg-white px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8b96b2]">{item.label}</p>
                    <p className="mt-1 text-[13px] font-medium text-[#1f2a44]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[16px] sm:rounded-[18px] md:rounded-[22px] border border-[#d9e1f4] bg-white shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
            <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12">
              <h3 className="mb-2 sm:mb-3 md:mb-3 text-[18px] sm:text-[20px] md:text-[24px] font-semibold text-[#1f2a44]">{projectName || 'Board form'}</h3>
              <p className="mb-6 sm:mb-8 md:mb-10 text-[12px] sm:text-[13px] md:text-[14px] text-[#63708d]">Create a task directly in this board with structured fields.</p>
              <div className="space-y-5 sm:space-y-6 md:space-y-8">
                <div>
                  <label className="mb-2 sm:mb-2.5 md:mb-3 block text-[13px] sm:text-[14px] md:text-[16px] font-medium text-[#1f2a44]">Name</label>
                  <input
                    value={values.title}
                    onChange={(event) => onChange('title', event.target.value)}
                    placeholder="Enter task name"
                    className="h-9 sm:h-10 md:h-12 w-full rounded-[6px] border border-[#cfd8ea] px-3 sm:px-3.5 md:px-4 text-[12px] sm:text-[13px] md:text-[15px] text-[#1f2a44] outline-none focus:border-[#9ec5ff]"
                  />
                  <p className="mt-1 text-right text-[11px] sm:text-[12px] md:text-[12px] text-[#7a84a4]">{values.title.length}/255</p>
                </div>
                <div>
                  <label className="mb-2 sm:mb-2.5 md:mb-3 block text-[13px] sm:text-[14px] md:text-[16px] font-medium text-[#1f2a44]">Description</label>
                  <textarea
                    value={values.description}
                    onChange={(event) => onChange('description', event.target.value)}
                    placeholder="Add context, scope, links, or instructions"
                    rows={3}
                    className="w-full rounded-[6px] md:rounded-[8px] border border-[#cfd8ea] px-3 sm:px-3.5 md:px-4 py-2 sm:py-2.5 md:py-3 text-[12px] sm:text-[13px] md:text-[15px] text-[#1f2a44] outline-none focus:border-[#9ec5ff]"
                  />
                </div>
                <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 sm:mb-2.5 md:mb-3 block text-[13px] sm:text-[14px] md:text-[16px] font-medium text-[#1f2a44]">Status</label>
                  <select
                    value={values.status}
                    onChange={(event) => onChange('status', event.target.value)}
                    className="h-9 sm:h-10 md:h-12 w-full rounded-[6px] border border-[#cfd8ea] px-3 sm:px-3.5 md:px-4 text-[12px] sm:text-[13px] md:text-[15px] text-[#1f2a44] outline-none focus:border-[#9ec5ff]"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 sm:mb-2.5 md:mb-3 block text-[13px] sm:text-[14px] md:text-[16px] font-medium text-[#1f2a44]">Priority</label>
                  <select
                    value={values.priority}
                    onChange={(event) => onChange('priority', event.target.value)}
                    className="h-9 sm:h-10 md:h-12 w-full rounded-[6px] border border-[#cfd8ea] px-3 sm:px-3.5 md:px-4 text-[12px] sm:text-[13px] md:text-[15px] text-[#1f2a44] outline-none focus:border-[#9ec5ff]"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label || 'Auto'}</option>
                    ))}
                  </select>
                </div>
                </div>
                <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 sm:mb-2.5 md:mb-3 block text-[13px] sm:text-[14px] md:text-[16px] font-medium text-[#1f2a44]">Due date</label>
                  <DatePicker
                    value={values.dueDate}
                    onChange={(date) => onChange('dueDate', date)}
                    className="h-9 sm:h-10 md:h-12 text-[12px] sm:text-[13px] md:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-2 sm:mb-2.5 md:mb-3 block text-[13px] sm:text-[14px] md:text-[16px] font-medium text-[#1f2a44]">Owner</label>
                  <select
                    value={values.assignedTo}
                    onChange={(event) => onChange('assignedTo', event.target.value)}
                    className="h-9 sm:h-10 md:h-12 w-full rounded-[6px] border border-[#cfd8ea] px-3 sm:px-3.5 md:px-4 text-[12px] sm:text-[13px] md:text-[15px] text-[#1f2a44] outline-none focus:border-[#9ec5ff]"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member._id} value={member._id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-[#e6ebf5] px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5">
              <button
                type="button"
                onClick={() => onChange('__reset__', null)}
                className="w-full sm:w-auto rounded-[6px] md:rounded-[8px] border border-[#d9e1f4] bg-white px-3 sm:px-4 md:px-4 py-2 sm:py-2.5 md:py-3 text-[12px] sm:text-[13px] md:text-[14px] font-medium text-[#44506c] transition hover:bg-[#f8fbff]"
              >
                Reset
              </button>
              <button
                type="button"
                disabled={!values.title.trim() || submitting}
                onClick={onSubmit}
                className="w-full sm:w-auto rounded-[6px] md:rounded-[8px] bg-[#0073ea] px-3 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-[12px] sm:text-[13px] md:text-[14px] font-medium text-white transition hover:bg-[#005ec0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isManager, workspace, user, currentRole, canCreateTask, canCreateProject, canDeleteTask } = useAuth();
  const workspaceKey = workspace?._id || 'workspace';
  const [dashboardView, setDashboardView] = useState(DEFAULT_VIEW_TABS[0].id);
  const [overviewTab, setOverviewTab] = useState('workload');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createTaskGroupId, setCreateTaskGroupId] = useState(DEFAULT_GROUP_CONFIGS[0].id);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAiSidekick, setShowAiSidekick] = useState(false);
  const [showAutomationsPanel, setShowAutomationsPanel] = useState(false);
  const [focusedAiTask, setFocusedAiTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('due_asc');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [collapsedGroups, setCollapsedGroups] = useState({ todo: false, completed: false });
  const [uploadingTaskId, setUploadingTaskId] = useState(null);
  const [groupConfigs, setGroupConfigs] = useState(DEFAULT_GROUP_CONFIGS);
  const [localGroupRows, setLocalGroupRows] = useState({});
  // Board message state replaced with React Hot Toast notifications
  const [boardDialog, setBoardDialog] = useState({ open: false, type: null, value: '', meta: null, options: [] });
  const [visibleViews, setVisibleViews] = useState(DEFAULT_VIEW_TABS);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const EMPTY_FORM_VALUES = { title: '', description: '', status: 'backlog', priority: '', dueDate: '', assignedTo: '' };
  const [formValues, setFormValues] = useState(EMPTY_FORM_VALUES);
  const [fileGallerySearch, setFileGallerySearch] = useState('');
  const [fileGalleryMode, setFileGalleryMode] = useState('grid');
  const [showFormResults, setShowFormResults] = useState(false);
  const [ganttZoom, setGanttZoom] = useState(1);
  const [ganttUnit, setGanttUnit] = useState('Days');
  const [showGanttBaseline, setShowGanttBaseline] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupTitle, setEditingGroupTitle] = useState('');
  const dashboardPrefsKey = `dashboard-view-prefs:${workspaceKey}`;
  const boardStateStorageKey = `dashboard-board-state:${workspaceKey}:${selectedProjectId || 'default'}`;

  useEffect(() => {
    setVisibleViews((current) => current.filter((view) => view.key !== 'doc'));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;

    try {
      const raw = window.localStorage.getItem(boardStateStorageKey);
      if (!raw) {
        setGroupConfigs(DEFAULT_GROUP_CONFIGS);
        setLocalGroupRows({});
        setCollapsedGroups({ todo: false, completed: false });
        return;
      }

      const parsed = JSON.parse(raw);
      const savedGroups = Array.isArray(parsed?.groupConfigs)
        ? parsed.groupConfigs.map((group) => ({
            ...group,
            columns: Array.isArray(group.columns) && group.columns.length ? group.columns : [...DEFAULT_GROUP_COLUMNS],
          }))
        : DEFAULT_GROUP_CONFIGS;
      const savedRows = parsed?.localGroupRows && typeof parsed.localGroupRows === 'object' ? parsed.localGroupRows : {};
      const savedCollapsed = parsed?.collapsedGroups && typeof parsed.collapsedGroups === 'object'
        ? parsed.collapsedGroups
        : { todo: false, completed: false };
      const savedColumnLabels = parsed?.columnLabels && typeof parsed.columnLabels === 'object' ? parsed.columnLabels : {};

      Object.entries(savedColumnLabels).forEach(([columnKey, label]) => {
        if (COLUMN_LIBRARY[columnKey]) {
          COLUMN_LIBRARY[columnKey] = { ...COLUMN_LIBRARY[columnKey], label };
        }
      });

      setGroupConfigs(savedGroups);
      setLocalGroupRows(savedRows);
      setCollapsedGroups({ todo: false, completed: false, ...savedCollapsed });
    } catch (_error) {
      setGroupConfigs(DEFAULT_GROUP_CONFIGS);
      setLocalGroupRows({});
      setCollapsedGroups({ todo: false, completed: false });
    }
  }, [boardStateStorageKey, selectedProjectId]);

  useEffect(() => {
    setSelectedGroupFilter('all');
  }, [selectedProjectId]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(dashboardPrefsKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const savedViews = Array.isArray(parsed?.visibleViews)
        ? parsed.visibleViews.filter((view) => view && VIEW_OPTIONS.some((option) => option.key === view.key && view.key !== 'doc'))
        : null;
      if (savedViews?.length) {
        const ensured = [
          savedViews.find((view) => view.key === 'table') || DEFAULT_VIEW_TABS[0],
          savedViews.find((view) => view.key === 'overview') || DEFAULT_VIEW_TABS[1],
          ...savedViews.filter((view) => !['table', 'overview'].includes(view.key)),
        ];
        setVisibleViews(ensured);
        const savedActive = ensured.find((view) => view.id === parsed?.dashboardView) || ensured[0];
        setDashboardView(savedActive.id);
      }
    } catch (_error) {
      setVisibleViews(DEFAULT_VIEW_TABS);
      setDashboardView(DEFAULT_VIEW_TABS[0].id);
    }
  }, [dashboardPrefsKey]);

  useEffect(() => {
    const cleanedViews = visibleViews.filter((view) => view?.key !== 'doc');
    window.localStorage.setItem(
      dashboardPrefsKey,
      JSON.stringify({
        visibleViews: cleanedViews,
        dashboardView,
      })
    );
  }, [dashboardPrefsKey, visibleViews, dashboardView]);

  useEffect(() => {
    if (!selectedProjectId) return;

    const columnLabels = Object.fromEntries(
      Object.entries(COLUMN_LIBRARY).map(([key, config]) => [key, config.label])
    );

    window.localStorage.setItem(
      boardStateStorageKey,
      JSON.stringify({
        groupConfigs,
        localGroupRows,
        collapsedGroups,
        columnLabels,
      })
    );
  }, [boardStateStorageKey, selectedProjectId, groupConfigs, localGroupRows, collapsedGroups]);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['report-summary', workspaceKey],
    queryFn: () => api.get('/reports/summary').then((res) => res.data.data),
    staleTime: 30_000,
  });

  const { data: projectsData = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', workspaceKey],
    queryFn: () => api.get('/projects').then((res) => res.data.data.projects),
    staleTime: 30_000,
  });

  const { data: workspaceMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['members', workspaceKey],
    queryFn: () => getMembers().then((res) => res.data.data.members),
    staleTime: 30_000,
  });

  const { data: tasksData = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['calendar-tasks', workspaceKey],
    queryFn: () => api.get('/tasks').then((res) => res.data.data.tasks),
    staleTime: 15_000,
  });

  const { data: overdueData, isLoading: loadingOverdue } = useQuery({
    queryKey: ['report-overdue', workspaceKey],
    queryFn: () => api.get('/reports/overdue').then((res) => res.data.data),
    staleTime: 30_000,
  });

  const { data: trend = [], isLoading: loadingTrend } = useQuery({
    queryKey: ['report-trend', workspaceKey],
    queryFn: () => api.get('/reports/trend').then((res) => res.data.data.trend || []),
    staleTime: 30_000,
  });

  const activeProjects = useMemo(
    () => projectsData.filter((project) => project.status === 'active'),
    [projectsData]
  );

  const openTaskComposer = (groupId = DEFAULT_GROUP_CONFIGS[0].id) => {
    setCreateTaskGroupId(groupId);
    if (!projectsData.length) {
      if (!canCreateProject) return;
      setShowCreateProject(true);
      return;
    }

    setShowCreate(true);
  };

  useEffect(() => {
    if (!projectsData.length) return;

    const projectStillExists = projectsData.some((project) => project._id === selectedProjectId);
    if (!selectedProjectId || !projectStillExists) {
      setSelectedProjectId(projectsData[0]._id);
    }
  }, [projectsData, selectedProjectId]);

  useEffect(() => {
    const openAiPanel = () => setShowAiSidekick(true);
    window.addEventListener('dashboard:open-ai-sidekick', openAiPanel);
    return () => window.removeEventListener('dashboard:open-ai-sidekick', openAiPanel);
  }, []);

  useEffect(() => {
    const openAutomationsPanel = () => {
      if (isManager) setShowAutomationsPanel(true);
    };

    window.addEventListener('dashboard:open-automations', openAutomationsPanel);
    return () => window.removeEventListener('dashboard:open-automations', openAutomationsPanel);
  }, [isManager]);

  useEffect(() => {
    if (isManager && searchParams.get('automations') === '1') {
      setShowAutomationsPanel(true);
    }
  }, [isManager, searchParams]);

  const handleAutomationsPanelChange = (nextOpen) => {
    setShowAutomationsPanel(nextOpen);
    if (!nextOpen && searchParams.get('automations') === '1') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('automations');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const projectScopedTasks = selectedProjectId
      ? tasksData.filter((task) => (task.projectId?._id || task.projectId) === selectedProjectId)
      : tasksData;

    const base = !query
      ? projectScopedTasks
      : projectScopedTasks.filter((task) =>
          [
            task.title,
            task.description,
            task.assignedTo?.name,
            task.projectId?.name,
            task.priority,
            task.status,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(query)
        );

    const ownerScoped = ownerFilter === 'all'
      ? base
      : ownerFilter === 'unassigned'
        ? base.filter((task) => !task.assignedTo?._id && !task.assignedTo)
        : base.filter((task) => (task.assignedTo?._id || task.assignedTo) === ownerFilter);

    const quickScoped = ownerScoped.filter((task) => {
      if (quickFilter === 'all') return true;
      if (quickFilter === 'overdue') return Boolean(task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date());
      if (quickFilter === 'high') return ['high', 'urgent'].includes(task.priority);
      if (quickFilter === 'dated') return Boolean(task.dueDate);
      return true;
    });

    return quickScoped.slice().sort((a, b) => {
      if (sortMode === 'updated_desc') {
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      }
      if (!a.dueDate && !b.dueDate) return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [ownerFilter, quickFilter, search, selectedProjectId, sortMode, tasksData]);

  const todoTasks = filteredTasks.filter((task) => task.status !== 'done');
  const completedTasks = filteredTasks.filter((task) => task.status === 'done');
  const localRows = useMemo(() => Object.values(localGroupRows).flat(), [localGroupRows]);
  const selectedTasks = [...tasksData, ...localRows].filter((task) => selectedTaskIds.includes(task._id));
  const boardGroups = groupConfigs.map((group) => ({
    ...group,
    tasks: group.id === 'todo' ? todoTasks : group.id === 'completed' ? completedTasks : (localGroupRows[group.id] || []),
  }));
  const fileGalleryItems = useMemo(
    () =>
      filteredTasks.flatMap((task) =>
        (task.attachments || []).map((attachment, index) => ({
          id: `${task._id}-${index}`,
          task,
          attachment,
        }))
      ),
    [filteredTasks]
  );
  const recentFormTasks = useMemo(
    () => filteredTasks.slice().sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt)).slice(0, 8),
    [filteredTasks]
  );

  const isLoading = loadingSummary || loadingProjects || loadingTasks || loadingOverdue || loadingTrend || loadingMembers;
  const hasProjectAccess = projectsData.length > 0;
  const canOpenTaskComposer = canCreateTask && (hasProjectAccess || canCreateProject);
  const firstProject = projectsData[0];
  const selectedProject = projectsData.find((project) => project._id === selectedProjectId) || firstProject;
  const selectedProjectMembers = selectedProject?.members?.length ? selectedProject.members : workspaceMembers;
  const emptyBoardProject = useMemo(
    () => ({
      _id: 'workspace-empty-board',
      name: workspace?.name?.trim() ? `${workspace.name} board` : 'Workspace board',
      description: ['member', 'viewer'].includes(currentRole)
        ? 'Projects and tasks will appear here once they are shared with your account.'
        : 'Create your first project to start organizing tasks, owners, and timelines in this workspace.',
      members: workspaceMembers,
      createdAt: workspace?.createdAt || new Date().toISOString(),
    }),
    [workspace?.name, workspace?.createdAt, workspaceMembers, currentRole]
  );
  const boardProjects = hasProjectAccess ? projectsData : [emptyBoardProject];
  const boardSelectedProject = hasProjectAccess ? selectedProject : emptyBoardProject;
  const boardMembers = hasProjectAccess ? selectedProjectMembers : workspaceMembers;
  const taskGroupOptions = useMemo(
    () => groupConfigs.map((group) => ({ id: group.id, title: group.title })),
    [groupConfigs]
  );
  const activeViewTab = visibleViews.find((view) => view.id === dashboardView) || visibleViews[0] || DEFAULT_VIEW_TABS[0];
  const currentViewKey = activeViewTab?.key || 'table';
  const overviewScopedTasks = selectedProjectId
    ? tasksData.filter((task) => (task.projectId?._id || task.projectId) === selectedProjectId)
    : tasksData;
  const workload = useMemo(() => {
    const bucket = new Map();

    boardMembers.forEach((member) => {
      if (!member?._id) return;
      bucket.set(member._id, {
        userId: member._id,
        name: member.name || 'Unknown',
        openTasks: 0,
        backlog: 0,
        inProgress: 0,
        review: 0,
        overdue: 0,
        highPriority: 0,
      });
    });

    let unassignedCount = 0;
    let unassignedBacklog = 0;
    let unassignedInProgress = 0;
    let unassignedReview = 0;

    overviewScopedTasks
      .filter((task) => task.status !== 'done')
      .forEach((task) => {
        const assigneeId = task.assignedTo?._id || task.assignedTo || null;

        if (!assigneeId) {
          unassignedCount += 1;
          if (task.status === 'backlog') unassignedBacklog += 1;
          else if (task.status === 'in_progress') unassignedInProgress += 1;
          else if (task.status === 'review') unassignedReview += 1;
          return;
        }

        const current = bucket.get(assigneeId) || {
          userId: assigneeId,
          name: task.assignedTo?.name || 'Unknown',
          openTasks: 0,
          backlog: 0,
          inProgress: 0,
          review: 0,
          overdue: 0,
          highPriority: 0,
        };
        current.openTasks += 1;
        if (task.status === 'backlog') current.backlog += 1;
        else if (task.status === 'in_progress') current.inProgress += 1;
        else if (task.status === 'review') current.review += 1;
        if (task.dueDate && new Date(task.dueDate) < new Date()) current.overdue += 1;
        if (['high', 'urgent'].includes(task.priority)) current.highPriority += 1;
        bucket.set(assigneeId, current);
      });

    const rows = Array.from(bucket.values()).sort((a, b) => b.openTasks - a.openTasks);

    if (unassignedCount > 0) {
      rows.push({
        userId: 'unassigned',
        name: 'Unassigned',
        openTasks: unassignedCount,
        backlog: unassignedBacklog,
        inProgress: unassignedInProgress,
        review: unassignedReview,
        overdue: overviewScopedTasks.filter((task) => {
          const assigneeId = task.assignedTo?._id || task.assignedTo || null;
          return !assigneeId && task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date();
        }).length,
        highPriority: overviewScopedTasks.filter((task) => {
          const assigneeId = task.assignedTo?._id || task.assignedTo || null;
          return !assigneeId && task.status !== 'done' && ['high', 'urgent'].includes(task.priority);
        }).length,
      });
    }

    return rows;
  }, [overviewScopedTasks, boardMembers]);
  const overviewProjectColumns = [
    { key: 'name', label: 'Project', width: '1.35fr', className: 'text-left' },
    { key: 'status', label: 'Status', width: '0.75fr', className: 'text-center' },
    { key: 'deadline', label: 'Deadline', width: '0.8fr', className: 'text-center' },
    { key: 'tasks', label: 'Tasks', width: '0.6fr', className: 'text-center' },
  ];
  const activeProjectRows = activeProjects.map((project) => ({
    id: project._id,
    name: <span className="font-medium text-[#1f2a44]">{project.name}</span>,
    status: <span className="capitalize">{project.status.replaceAll('_', ' ')}</span>,
    deadline: project.deadline ? formatShortDate(project.deadline) : 'No date',
    tasks: project.taskCount ?? 0,
  }));
  const overdueRows = (overdueData?.tasks || []).slice(0, 8).map((task) => ({
    id: task._id,
    title: <span className="font-medium text-[#1f2a44]">{task.title}</span>,
    owner: task.assignedTo?.name || 'Unassigned',
    dueDate: task.dueDate ? formatShortDate(task.dueDate) : 'No date',
    priority: task.priority ? task.priority[0].toUpperCase() + task.priority.slice(1) : 'Auto',
  }));
  const overdueColumns = [
    { key: 'title', label: 'Task', width: '1.4fr', className: 'text-left' },
    { key: 'owner', label: 'Owner', width: '0.9fr', className: 'text-center' },
    { key: 'dueDate', label: 'Due date', width: '0.8fr', className: 'text-center' },
    { key: 'priority', label: 'Priority', width: '0.7fr', className: 'text-center' },
  ];
  const aiContext = useMemo(
    () => ({
      projectName: boardSelectedProject?.name || 'Current board',
      tasks: filteredTasks,
      selectedMembers: boardMembers,
      focusedTask: focusedAiTask,
    }),
    [filteredTasks, focusedAiTask, boardSelectedProject?.name, boardMembers]
  );

  const refreshBoard = () => {
    qc.invalidateQueries({ queryKey: ['calendar-tasks', workspaceKey] });
    qc.invalidateQueries({ queryKey: ['report-summary', workspaceKey] });
    qc.invalidateQueries({ queryKey: ['report-overdue', workspaceKey] });
    qc.invalidateQueries({ queryKey: ['projects', workspaceKey] });
  };

  const resolveTaskAssignee = (assignedTo) => {
    if (!assignedTo) return null;
    return workspaceMembers.find((member) => member._id === assignedTo)
      || boardMembers.find((member) => member._id === assignedTo)
      || projectsData
        .flatMap((project) => project.members || [])
        .find((member) => member._id === assignedTo)
      || null;
  };

  const createTaskFromModal = async (payload) => {
    const targetGroup = groupConfigs.find((group) => group.id === payload.groupId) || groupConfigs[0] || DEFAULT_GROUP_CONFIGS[0];
    if (!targetGroup) {
      throw new Error('Please choose a valid group before creating the task.');
    }

    if (targetGroup.isCustom) {
      const assignedMember = resolveTaskAssignee(payload.assignedTo);
      setLocalGroupRows((current) => ({
        ...current,
        [targetGroup.id]: [
          ...(current[targetGroup.id] || []),
          {
            ...makeLocalRow(payload.projectId),
            title: payload.title,
            description: payload.description || '',
            assignedTo: assignedMember
              ? { _id: assignedMember._id, name: assignedMember.name, email: assignedMember.email }
              : null,
            status: payload.status || 'backlog',
            dueDate: payload.dueDate || null,
            priority: payload.priority || '',
            attachments: Array.isArray(payload.attachments)
              ? payload.attachments.map((file) => ({
                  url: file.dataUrl || '',
                  filename: file.fileName || file.filename || 'Attachment',
                  uploadedAt: new Date().toISOString(),
                }))
              : [],
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      toast.success(`Task added to ${targetGroup.title}.`);
      return;
    }

    await createTask({
      projectId: payload.projectId,
      title: payload.title,
      description: payload.description || '',
      assignedTo: payload.assignedTo || null,
      priority: payload.priority || undefined,
      status: targetGroup.id === 'completed' ? 'done' : (payload.status || 'backlog'),
      dueDate: payload.dueDate || null,
      tags: payload.tags || [],
      attachments: payload.attachments || [],
    });
    refreshBoard();
    toast.success('Task created.');
  };

  const applyTaskPatchToBoard = (current = [], id, patch) =>
    current.map((task) => {
      if (task._id !== id) return task;

      const nextTask = { ...task, ...patch };

      if (Object.prototype.hasOwnProperty.call(patch, 'assignedTo')) {
        if (!patch.assignedTo) {
          nextTask.assignedTo = null;
        } else if (typeof patch.assignedTo === 'string') {
          const matchedMember = workspaceMembers.find((member) => member._id === patch.assignedTo)
            || boardMembers.find((member) => member._id === patch.assignedTo)
            || projectsData
              .flatMap((project) => project.members || [])
              .find((member) => member._id === patch.assignedTo);

          nextTask.assignedTo = matchedMember
            ? { _id: matchedMember._id, name: matchedMember.name, email: matchedMember.email }
            : task.assignedTo;
        }
      }

      return nextTask;
    });

  const updateLocalRow = (id, patch) => {
    setLocalGroupRows((current) => {
      const next = { ...current };
      Object.keys(next).forEach((groupId) => {
        next[groupId] = (next[groupId] || []).map((row) =>
          row._id === id ? { ...row, ...patch, updatedAt: new Date().toISOString() } : row
        );
      });
      return next;
    });
  };

  const { mutate: duplicateSelected, isPending: duplicating } = useMutation({
    mutationFn: async () => {
      const remoteTasks = selectedTasks.filter((task) => !String(task._id).startsWith('local-'));
      const localTasks = selectedTasks.filter((task) => String(task._id).startsWith('local-'));
      await Promise.all(
        remoteTasks.map((task) =>
          createTask({
            projectId: task.projectId?._id || task.projectId,
            title: `${task.title} copy`,
            description: task.description || '',
            assignedTo: task.assignedTo?._id || task.assignedTo || null,
            priority: task.priority || undefined,
            status: task.status || 'backlog',
            dueDate: task.dueDate || null,
            tags: task.tags || [],
            attachments: task.attachments || [],
          })
        )
      );
      if (localTasks.length) {
        setLocalGroupRows((current) => {
          const next = { ...current };
          Object.keys(next).forEach((groupId) => {
            const rows = next[groupId] || [];
            const clones = rows
              .filter((row) => localTasks.some((task) => task._id === row._id))
              .map((row) => ({ ...row, _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: `${row.title || 'Untitled task'} copy`, updatedAt: new Date().toISOString() }));
            next[groupId] = [...rows, ...clones];
          });
          return next;
        });
      }
    },
    onSuccess: () => {
      refreshBoard();
      setSelectedTaskIds([]);
      toast.success('Tasks duplicated successfully!');
    },
  });

  const { mutate: deleteSelected, isPending: deleting } = useMutation({
    mutationFn: async () => {
      const remoteIds = selectedTaskIds.filter((id) => !String(id).startsWith('local-'));
      const localIds = selectedTaskIds.filter((id) => String(id).startsWith('local-'));
      if (remoteIds.length) {
        await Promise.all(remoteIds.map((id) => deleteTask(id)));
      }
      if (localIds.length) {
        setLocalGroupRows((current) => {
          const next = { ...current };
          Object.keys(next).forEach((groupId) => {
            next[groupId] = (next[groupId] || []).filter((row) => !localIds.includes(row._id));
          });
          return next;
        });
      }
    },
    onSuccess: () => {
      refreshBoard();
      setSelectedTaskIds([]);
      toast.success('Tasks deleted successfully!');
    },
  });

  const { mutate: moveSelected, isPending: moving } = useMutation({
    mutationFn: async (status) => {
      const remoteIds = selectedTaskIds.filter((id) => !String(id).startsWith('local-'));
      const localIds = selectedTaskIds.filter((id) => String(id).startsWith('local-'));
      if (remoteIds.length) {
        await Promise.all(remoteIds.map((id) => updateTask(id, { status })));
      }
      localIds.forEach((id) => updateLocalRow(id, { status }));
    },
    onSuccess: () => {
      refreshBoard();
      setSelectedTaskIds([]);
      toast.success('Tasks moved successfully!');
    },
  });

  const { mutate: saveCellValue } = useMutation({
    mutationFn: async ({ id, patch }) => {
      if (String(id).startsWith('local-')) {
        updateLocalRow(id, patch);
        return { local: true };
      }
      return updateTask(id, patch);
    },
    onMutate: async ({ id, patch }) => {
      if (String(id).startsWith('local-')) {
        updateLocalRow(id, patch);
        return { previousTasks: null };
      }
      await qc.cancelQueries({ queryKey: ['calendar-tasks', workspaceKey] });

      const previousTasks = qc.getQueryData(['calendar-tasks', workspaceKey]);

      qc.setQueryData(['calendar-tasks', workspaceKey], (current = []) =>
        applyTaskPatchToBoard(current, id, patch)
      );

      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        qc.setQueryData(['calendar-tasks', workspaceKey], context.previousTasks);
      }
      toast.error('Failed to update task');
    },
    onSuccess: () => {
      refreshBoard();
      setEditingCell(null);
    },
  });

  const { mutate: createQuickTask, isPending: creatingQuickTask } = useMutation({
    mutationFn: (payload) => createTask(payload),
    onSuccess: () => {
      refreshBoard();
      toast.success('Task created.');
      setFormValues(EMPTY_FORM_VALUES);
      setShowFormResults(true);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Unable to create task.');
    },
  });

  const toggleTaskSelection = (taskId) => {
    setSelectedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    );
  };

  const toggleGroupSelection = (tasks) => {
    const ids = tasks.map((task) => task._id);
    const allSelected = ids.every((id) => selectedTaskIds.includes(id));

    setSelectedTaskIds((current) =>
      allSelected
        ? current.filter((id) => !ids.includes(id))
        : Array.from(new Set([...current, ...ids]))
    );
  };

  const toggleGroupCollapse = (groupKey) => {
    setCollapsedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

  const exportSelected = () => {
    const payload = JSON.stringify(selectedTasks, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'selected-tasks.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportVisibleTasks = () => {
    const payload = JSON.stringify(filteredTasks, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(boardSelectedProject?.name || 'board').replace(/\s+/g, '-').toLowerCase()}-tasks.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const focusBoardSearch = () => {
    const tableView = visibleViews.find((view) => view.key === 'table');
    if (tableView && currentViewKey !== 'table') {
      setDashboardView(tableView.id);
      window.setTimeout(() => window.dispatchEvent(new Event('dashboard:focus-search')), 40);
      return;
    }
    window.dispatchEvent(new Event('dashboard:focus-search'));
  };

  useEffect(() => {
    const handleOpenSearch = () => focusBoardSearch();
    window.addEventListener('dashboard:open-search', handleOpenSearch);
    return () => window.removeEventListener('dashboard:open-search', handleOpenSearch);
  }, [focusBoardSearch]);

  const openTableControl = (eventName) => {
    const tableView = visibleViews.find((view) => view.key === 'table');
    if (tableView && currentViewKey !== 'table') {
      setDashboardView(tableView.id);
      window.setTimeout(() => window.dispatchEvent(new Event(eventName)), 40);
      return;
    }
    window.dispatchEvent(new Event(eventName));
  };

  const shareFormView = async () => {
    const shareUrl = `${window.location.origin}/dashboard?view=${activeViewTab?.id || 'form'}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Form link copied!');
    } catch (_error) {
      toast.success(shareUrl);
    }
  };

  const startCellEdit = (taskId, field) => {
    const task = [...tasksData, ...localRows].find((entry) => entry._id === taskId);
    if (!task) return;
    if (String(taskId).startsWith('local-')) {
      setEditingCell({ taskId, field });
      return;
    }

    const isAssignee = String(task.assignedTo?._id || task.assignedTo || '') === String(user?._id || '');
    const canEditTask = isManager || (currentRole === 'member' && isAssignee);
    if (!canEditTask) return;

    if (!isManager && ['assignedTo', 'dueDate', 'priority'].includes(field)) {
      return;
    }

    setEditingCell({ taskId, field });
  };
  const cancelCellEdit = () => setEditingCell(null);

  const renameGroup = (groupId, title = '') => {
    setEditingGroupId(groupId);
    setEditingGroupTitle(title || groupConfigs.find((group) => group.id === groupId)?.title || '');
  };

  const saveGroupTitle = (groupId) => {
    const value = String(editingGroupTitle || '').trim() || 'New group';
    setGroupConfigs((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId ? { ...group, title: value } : group
      )
    );
    setEditingGroupId(null);
    setEditingGroupTitle('');
  };

  const cancelGroupTitleEdit = () => {
    setEditingGroupId(null);
    setEditingGroupTitle('');
  };

  const renameColumn = (groupId, columnKey) => {
    setBoardDialog({
      open: true,
      type: 'renameColumn',
      title: 'Rename column',
      label: 'Column name',
      value: COLUMN_LIBRARY[columnKey]?.label || columnKey,
      meta: { groupId, columnKey },
      options: [],
      placeholder: 'Enter column name',
    });
  };

  const addColumnToGroup = (groupId) => {
    const current = groupConfigs.find((group) => group.id === groupId);
    const available = Object.keys(COLUMN_LIBRARY).filter((key) => !current.columns.includes(key));
    if (!available.length) return;
    setBoardDialog({
      open: true,
      type: 'addColumn',
      mode: 'select',
      title: 'Add column',
      value: available[0],
      meta: { groupId },
      options: available.map((key) => ({ value: key, label: COLUMN_LIBRARY[key]?.label || key })),
      description: 'Choose a column to add to this group.',
    });
  };

  const removeColumnFromGroup = (groupId, columnKey) => {
    setGroupConfigs((currentGroups) => currentGroups.map((group) => {
      if (group.id !== groupId || group.columns.length <= 1) return group;
      return { ...group, columns: group.columns.filter((column) => column !== columnKey) };
    }));
  };

  const addNewGroup = () => {
    const id = `group-${Date.now()}`;
    setGroupConfigs((currentGroups) => [
      ...currentGroups,
      {
        id,
        title: 'New group',
        color: GROUP_COLOR_OPTIONS[currentGroups.length % GROUP_COLOR_OPTIONS.length],
        columns: [...DEFAULT_GROUP_COLUMNS],
        isCustom: true,
      },
    ]);
    setCollapsedGroups((current) => ({ ...current, [id]: false }));
    setLocalGroupRows((current) => ({ ...current, [id]: [makeLocalRow(selectedProjectId)] }));
    setEditingGroupId(id);
    setEditingGroupTitle('New group');
  };

  const addRowToCustomGroup = (groupId) => {
    setLocalGroupRows((current) => ({
      ...current,
      [groupId]: [...(current[groupId] || []), makeLocalRow(selectedProjectId)],
    }));
  };

  const addView = (viewKey) => {
    setVisibleViews((current) => {
      const existing = current.find((view) => view.key === viewKey);
      if (existing) {
        setDashboardView(existing.id);
        return current;
      }
      const nextTab = createViewTab(viewKey, current);
      setDashboardView(nextTab.id);
      return [...current, nextTab];
    });
  };

  const pinView = (viewId) => {
    setVisibleViews((current) => {
      const next = current.map((view) => (view.id === viewId ? { ...view, pinned: !view.pinned } : view));
      const pinned = next.filter((view) => view.pinned);
      const unpinned = next.filter((view) => !view.pinned);
      return [...pinned, ...unpinned];
    });
  };

  const renameView = (viewId) => {
    const view = visibleViews.find((entry) => entry.id === viewId);
    if (!view) return;
    setBoardDialog({
      open: true,
      type: 'renameView',
      title: 'Rename view',
      label: 'View name',
      value: view.label,
      meta: { viewId },
      options: [],
      placeholder: 'Enter view name',
    });
  };

  const duplicateView = (viewId) => {
    setVisibleViews((current) => {
      const source = current.find((view) => view.id === viewId);
      if (!source) return current;
      const duplicate = {
        ...source,
        id: `view-${source.key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: `${source.label} copy`,
        pinned: false,
      };
      const index = current.findIndex((view) => view.id === viewId);
      const next = [...current];
      next.splice(index + 1, 0, duplicate);
      return next;
    });
  };

  const deleteView = (viewId) => {
    setVisibleViews((current) => {
      if (current.length <= 1) return current;
      const index = current.findIndex((view) => view.id === viewId);
      const next = current.filter((view) => view.id !== viewId);
      if (dashboardView === viewId) {
        const fallback = next[Math.max(0, index - 1)] || next[0];
        setDashboardView(fallback.id);
      }
      return next;
    });
  };

  const closeBoardDialog = () => {
    setBoardDialog({ open: false, type: null, value: '', meta: null, options: [] });
  };

  const submitBoardDialog = () => {
    const value = String(boardDialog.value || '').trim();

    if (boardDialog.type === 'renameColumn') {
      if (!value) return;
      COLUMN_LIBRARY[boardDialog.meta.columnKey] = {
        ...COLUMN_LIBRARY[boardDialog.meta.columnKey],
        label: value,
      };
      setGroupConfigs((currentGroups) => [...currentGroups]);
      closeBoardDialog();
      return;
    }

    if (boardDialog.type === 'addColumn') {
      if (!value) return;
      setGroupConfigs((currentGroups) =>
        currentGroups.map((group) =>
          group.id === boardDialog.meta.groupId
            ? { ...group, columns: [...group.columns, value] }
            : group
        )
      );
      closeBoardDialog();
      return;
    }

    if (boardDialog.type === 'renameView') {
      if (!value) return;
      setVisibleViews((current) =>
        current.map((view) =>
          view.id === boardDialog.meta.viewId ? { ...view, label: value } : view
        )
      );
      closeBoardDialog();
    }
  };

  useEffect(() => {
    if (!editingCell) return undefined;

    const handlePointerDown = (event) => {
      if (
        event.target.closest('[data-dashboard-popover="true"]') ||
        event.target.closest('[data-dashboard-editor-trigger="true"]')
      ) {
        return;
      }

      setEditingCell(null);
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [editingCell]);

  useEffect(() => {
    setEditingCell(null);
  }, [dashboardView, overviewTab, selectedProjectId]);

  useEffect(() => {
    setEditingGroupId(null);
    setEditingGroupTitle('');
  }, [selectedProjectId]);

  const handleFilesUpload = async (task, files) => {
    if (!files.length) return;

    setUploadingTaskId(task._id);

    try {
      const uploaded = [];

      for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file);
        const response = await uploadTaskAttachment({
          fileName: file.name,
          dataUrl,
        });

        uploaded.push(response.data.data.attachment);
      }

      saveCellValue({
        id: task._id,
        patch: {
          attachments: [...(task.attachments || []), ...uploaded],
        },
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'File upload failed');
      setEditingCell(null);
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleFileRemove = (task, indexToRemove) => {
    saveCellValue({
      id: task._id,
      patch: {
        attachments: (task.attachments || []).filter((_, index) => index !== indexToRemove),
      },
    });
  };

  const saveField = (task, patch) => {
    if (String(task._id).startsWith('local-')) {
      saveCellValue({ id: task._id, patch });
      return;
    }

    const isAssignee = String(task.assignedTo?._id || task.assignedTo || '') === String(user?._id || '');
    const canEditTask = isManager || (currentRole === 'member' && isAssignee);
    if (!canEditTask) return;

    if (!isManager) {
      const restrictedKeys = ['assignedTo', 'priority', 'dueDate'];
      if (restrictedKeys.some((key) => Object.prototype.hasOwnProperty.call(patch, key))) {
        return;
      }
    }

    if ('attachmentUrls' in patch) {
      const attachments = (patch.attachmentUrls || '')
        .split(/\r?\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((url, index) => {
          const parts = url.split('/').filter(Boolean);
          const lastPart = parts[parts.length - 1] || `file-${index + 1}`;
          return { url, filename: decodeURIComponent(lastPart.split('?')[0]) };
        });

      saveCellValue({ id: task._id, patch: { attachments } });
      return;
    }

    saveCellValue({ id: task._id, patch });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6 py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="px-2 py-2">
      {['member', 'viewer'].includes(currentRole) && !hasProjectAccess ? (
        <div className="mb-3 rounded-[14px] border border-[#d8e4fb] bg-[#f7fbff] px-4 py-3 text-[13px] text-[#496282]">
          {currentRole === 'viewer'
            ? 'Viewer access: this workspace is ready, but no projects have been shared with you yet. Your dashboard will fill in automatically when a project is shared.'
            : 'Member access: this workspace is ready, but no projects have been assigned to you yet. Your dashboard will fill in automatically when you are added to a project.'}
        </div>
      ) : null}
      {!hasProjectAccess && canCreateProject ? (
        <div className="mb-3 rounded-[14px] border border-[#d8e4fb] bg-[#f7fbff] px-4 py-3 text-[13px] text-[#496282]">
          This workspace does not have any projects yet. Create your first project to unlock tasks, reporting, and team planning.
        </div>
      ) : null}
      <div className="space-y-4">
        <div className="overflow-visible border border-[#d8dff3] bg-white">
          <BoardHeader
            selectedProjectId={hasProjectAccess ? selectedProjectId : boardSelectedProject._id}
            setSelectedProjectId={hasProjectAccess ? setSelectedProjectId : () => {}}
            projects={boardProjects}
            selectedProject={boardSelectedProject}
            dashboardView={dashboardView}
            setDashboardView={setDashboardView}
            visibleViews={visibleViews}
            onAddView={addView}
            onPinView={pinView}
            onRenameView={renameView}
            onDuplicateView={duplicateView}
            onDeleteView={deleteView}
          />

          {currentViewKey === 'table' ? (
            <>
              <BoardToolbar
                search={search}
                setSearch={setSearch}
                sortMode={sortMode}
                setSortMode={setSortMode}
                onNewTask={canOpenTaskComposer ? openTaskComposer : undefined}
                members={boardMembers}
                ownerFilter={ownerFilter}
                setOwnerFilter={setOwnerFilter}
                quickFilter={quickFilter}
                setQuickFilter={setQuickFilter}
                hideCompleted={hideCompleted}
                setHideCompleted={setHideCompleted}
                selectedGroupFilter={selectedGroupFilter}
                setSelectedGroupFilter={setSelectedGroupFilter}
                groupConfigs={groupConfigs}
              />

              <div className="px-4 py-3">
                {boardGroups
                  .filter((group) => !hideCompleted || group.id !== 'completed')
                  .filter((group) => selectedGroupFilter === 'all' || group.id === selectedGroupFilter)
                  .map((group) => (
                    <GroupSection
                      key={group.id}
                      group={group}
                      tasks={group.tasks}
                      collapsed={collapsedGroups[group.id]}
                      onToggleCollapse={() => toggleGroupCollapse(group.id)}
                      onAddTask={canOpenTaskComposer ? () => openTaskComposer(group.id) : (group.isCustom ? () => addRowToCustomGroup(group.id) : undefined)}
                      onTaskClick={(task) => setSelectedTaskId(task._id)}
                      selectedTaskIds={selectedTaskIds}
                      onToggleTask={toggleTaskSelection}
                      onToggleGroup={toggleGroupSelection}
                      editingCell={editingCell}
                      onStartEdit={startCellEdit}
                      onSaveField={saveField}
                      onCancelEdit={cancelCellEdit}
                      projectsData={boardProjects}
                      workspaceMembers={workspaceMembers}
                      isManager={isManager}
                      sortMode={sortMode}
                      setSortMode={setSortMode}
                      onUploadFiles={handleFilesUpload}
                      onRemoveFile={handleFileRemove}
                      uploadingTaskId={uploadingTaskId}
                      editingGroupId={editingGroupId}
                      editingGroupTitle={editingGroupTitle}
                      onRenameGroup={renameGroup}
                      onGroupTitleChange={setEditingGroupTitle}
                      onGroupTitleSave={saveGroupTitle}
                      onGroupTitleCancel={cancelGroupTitleEdit}
                      onRenameColumn={renameColumn}
                      onRemoveColumn={removeColumnFromGroup}
                      onAddColumn={addColumnToGroup}
                      onOpenAiForTask={(task) => {
                        setFocusedAiTask(task);
                        setShowAiSidekick(true);
                      }}
                    />
                  ))}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={addNewGroup}
                    className="inline-flex h-9 items-center gap-2.5 rounded-[8px] border border-[#cfd8ea] bg-white px-3.5 text-[13px] font-medium text-[#2d3554] transition hover:bg-[#f8fbff]"
                  >
                    <span className="text-[18px] leading-none text-[#2d3554]">+</span>
                    <span>Add new group</span>
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {currentViewKey === 'overview' ? (
            <div className="space-y-5 p-3 sm:p-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div className="group rounded-[16px] border border-[#e2e8f0] bg-gradient-to-br from-white to-[#f8fafc] px-5 py-5 shadow-[0_4px_6px_rgba(15,23,42,0.04)] transition hover:shadow-[0_8px_12px_rgba(15,23,42,0.08)] hover:border-[#cbd5e1]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">Active projects</p>
                      <p className="mt-3 text-[32px] font-bold text-[#0f172a]">{activeProjects.length}</p>
                    </div>
                    <div className="rounded-full bg-[#e0f2fe] p-2.5 text-[#0284c7] transition group-hover:bg-[#cffafe]">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="group rounded-[16px] border border-[#e2e8f0] bg-gradient-to-br from-white to-[#f8fafc] px-5 py-5 shadow-[0_4px_6px_rgba(15,23,42,0.04)] transition hover:shadow-[0_8px_12px_rgba(15,23,42,0.08)] hover:border-[#cbd5e1]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">Overdue tasks</p>
                      <p className="mt-3 text-[32px] font-bold text-[#0f172a]">{overdueData?.count || 0}</p>
                    </div>
                    <div className="rounded-full bg-[#fee2e2] p-2.5 text-[#dc2626] transition group-hover:bg-[#fecaca]">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M8 5h8a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="group rounded-[16px] border border-[#e2e8f0] bg-gradient-to-br from-white to-[#f8fafc] px-5 py-5 shadow-[0_4px_6px_rgba(15,23,42,0.04)] transition hover:shadow-[0_8px_12px_rgba(15,23,42,0.08)] hover:border-[#cbd5e1]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">Completion rate</p>
                      <p className="mt-3 text-[32px] font-bold text-[#0f172a]">{summary?.completionRate || 0}<span className="text-[24px] text-[#64748b]">%</span></p>
                    </div>
                    <div className="rounded-full bg-[#dcfce7] p-2.5 text-[#16a34a] transition group-hover:bg-[#bbf7d0]">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="group rounded-[16px] border border-[#e2e8f0] bg-gradient-to-br from-white to-[#f8fafc] px-5 py-5 shadow-[0_4px_6px_rgba(15,23,42,0.04)] transition hover:shadow-[0_8px_12px_rgba(15,23,42,0.08)] hover:border-[#cbd5e1]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">Team workload</p>
                      <p className="mt-3 text-[32px] font-bold text-[#0f172a]">{workload.reduce((sum, item) => sum + item.openTasks, 0)}</p>
                    </div>
                    <div className="rounded-full bg-[#f3e8ff] p-2.5 text-[#9333ea] transition group-hover:bg-[#e9d5ff]">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM15 20h4a2 2 0 002-2v-2a6 6 0 00-9-5.497M9 20H5a2 2 0 01-2-2v-2a6 6 0 0110.39-3.5" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[20px] border border-[#e2e8f0] bg-white shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <div className="border-b border-[#f1f5f9] px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <TabButton active={overviewTab === 'workload'} onClick={() => setOverviewTab('workload')}>Workload graph</TabButton>
                    <TabButton active={overviewTab === 'active'} onClick={() => setOverviewTab('active')}>Active projects</TabButton>
                    <TabButton active={overviewTab === 'overdue'} onClick={() => setOverviewTab('overdue')}>Overdue tasks</TabButton>
                    <TabButton active={overviewTab === 'completion'} onClick={() => setOverviewTab('completion')}>Completion rate</TabButton>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  {overviewTab === 'workload' ? <WorkloadGraph workload={workload} /> : null}
                  {overviewTab === 'active' ? <InfoTable title="Active projects" columns={overviewProjectColumns} rows={activeProjectRows} emptyLabel="No active projects right now." /> : null}
                  {overviewTab === 'overdue' ? <InfoTable title="Overdue tasks" columns={overdueColumns} rows={overdueRows} emptyLabel="No overdue tasks right now." /> : null}
                  {overviewTab === 'completion' ? <CompletionView summary={summary} trend={trend} /> : null}
                </div>
              </div>
            </div>
          ) : null}

          {currentViewKey === 'chart' ? (
            <ViewChrome
              onNewTask={canOpenTaskComposer ? openTaskComposer : undefined}
              onFocusSearch={focusBoardSearch}
              onOpenPerson={() => openTableControl('dashboard:open-person')}
              onOpenFilter={() => openTableControl('dashboard:open-filter')}
              onOpenAddView={() => window.dispatchEvent(new Event('dashboard:open-add-view'))}
              onExport={exportVisibleTasks}
            >
              <StatusChartView tasks={filteredTasks} />
            </ViewChrome>
          ) : null}

          {currentViewKey === 'calendar' ? (
            <ViewChrome
              onNewTask={canOpenTaskComposer ? openTaskComposer : undefined}
              onFocusSearch={focusBoardSearch}
              onOpenPerson={() => openTableControl('dashboard:open-person')}
              onOpenFilter={() => openTableControl('dashboard:open-filter')}
              onOpenAddView={() => window.dispatchEvent(new Event('dashboard:open-add-view'))}
              onExport={exportVisibleTasks}
            >
              <div className="p-4">
                <TaskCalendarView
                  tasks={filteredTasks.filter((task) => task.dueDate)}
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  onTaskClick={(task) => setSelectedTaskId(task._id)}
                />
              </div>
            </ViewChrome>
          ) : null}

          {currentViewKey === 'kanban' ? (
            <ViewChrome
              onNewTask={canOpenTaskComposer ? openTaskComposer : undefined}
              onFocusSearch={focusBoardSearch}
              onOpenPerson={() => openTableControl('dashboard:open-person')}
              onOpenFilter={() => openTableControl('dashboard:open-filter')}
              onOpenAddView={() => window.dispatchEvent(new Event('dashboard:open-add-view'))}
              onExport={exportVisibleTasks}
            >
              <div className="p-4">
                <KanbanBoard
                  tasks={filteredTasks}
                  projectId={selectedProjectId}
                  workspaceKey={workspaceKey}
                  queryKey={['calendar-tasks', workspaceKey]}
                  onTaskClick={(task) => setSelectedTaskId(task._id)}
                  onAddTask={() => openTaskComposer()}
                />
              </div>
            </ViewChrome>
          ) : null}

          {currentViewKey === 'gantt' ? (
            <ViewChrome
              onNewTask={canOpenTaskComposer ? openTaskComposer : undefined}
              onFocusSearch={focusBoardSearch}
              onOpenPerson={() => openTableControl('dashboard:open-person')}
              onOpenFilter={() => openTableControl('dashboard:open-filter')}
              onOpenAddView={() => window.dispatchEvent(new Event('dashboard:open-add-view'))}
              onExport={exportVisibleTasks}
            >
              <div className="p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#d9e1f4] bg-white px-4 py-3">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[17px] font-semibold text-[#1f2a44]">Gantt</h3>
                    <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#6b7795]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3.5 4.5h13l-5 5.7v4.3l-3 1.6v-5.9l-5-5.7Z" />
                    </svg>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ViewToolbarButton active={showGanttBaseline} onClick={() => setShowGanttBaseline((current) => !current)}>Baseline</ViewToolbarButton>
                    <ViewToolbarButton onClick={() => setGanttZoom(1)}>Auto Fit</ViewToolbarButton>
                    <ViewToolbarButton onClick={() => setGanttUnit((current) => (current === 'Days' ? 'Weeks' : 'Days'))}>{ganttUnit}</ViewToolbarButton>
                    <ViewToolbarButton className="px-3" onClick={() => setGanttZoom((current) => Math.max(0.8, Number((current - 0.1).toFixed(1))))}>-</ViewToolbarButton>
                    <ViewToolbarButton className="px-3" onClick={() => setGanttZoom((current) => Math.min(1.4, Number((current + 0.1).toFixed(1))))}>+</ViewToolbarButton>
                    <button type="button" className="text-[20px] leading-none text-[#6b7795]">...</button>
                  </div>
                </div>
                {showGanttBaseline ? (
                  <div className="mb-3 rounded-[10px] border border-[#dce8fb] bg-[#f7fbff] px-4 py-3 text-[13px] text-[#48617f]">
                    Baseline preview is enabled for this board view.
                  </div>
                ) : null}
                <div style={{ transform: `scale(${ganttZoom})`, transformOrigin: 'top left', width: `${100 / ganttZoom}%` }}>
                  <TaskGanttView
                    project={boardSelectedProject}
                    tasks={filteredTasks}
                    onTaskClick={(task) => setSelectedTaskId(task._id)}
                  />
                </div>
              </div>
            </ViewChrome>
          ) : null}

          {currentViewKey === 'files' ? (
            <ViewChrome
              onNewTask={canOpenTaskComposer ? openTaskComposer : undefined}
              onFocusSearch={focusBoardSearch}
              onOpenPerson={() => openTableControl('dashboard:open-person')}
              onOpenFilter={() => openTableControl('dashboard:open-filter')}
              onOpenAddView={() => window.dispatchEvent(new Event('dashboard:open-add-view'))}
              onExport={exportVisibleTasks}
            >
              <FileGalleryView
                items={fileGalleryItems}
                search={fileGallerySearch}
                onSearchChange={setFileGallerySearch}
                mode={fileGalleryMode}
                onModeChange={setFileGalleryMode}
                onTaskClick={(task) => setSelectedTaskId(task._id)}
              />
            </ViewChrome>
          ) : null}

          {currentViewKey === 'form' ? (
            <BoardFormView
              projectName={boardSelectedProject?.name || 'Board form'}
              values={formValues}
              onChange={(field, value) => {
                if (field === '__reset__') {
                  setFormValues(EMPTY_FORM_VALUES);
                  return;
                }
                setFormValues((current) => ({ ...current, [field]: value }));
              }}
              onSubmit={() => createQuickTask({
                projectId: selectedProjectId || firstProject?._id,
                title: formValues.title.trim(),
                description: formValues.description.trim(),
                status: formValues.status,
                priority: formValues.priority || undefined,
                dueDate: formValues.dueDate || null,
                assignedTo: formValues.assignedTo || null,
                tags: [],
                attachments: [],
              })}
              submitting={creatingQuickTask}
              recentTasks={recentFormTasks}
              showResults={showFormResults}
              setShowResults={setShowFormResults}
              onShare={shareFormView}
              members={boardMembers}
              onEditForm={() => setShowFormResults(false)}
            />
          ) : null}
        </div>
      </div>

      {canCreateProject ? (
        <CreateProjectModal
          open={showCreateProject}
          onClose={() => setShowCreateProject(false)}
          includeMembers={false}
          title="Create your first project"
          submitLabel="Create project"
          onCreated={(project) => {
            setSelectedProjectId(project._id);
            setShowCreateProject(false);
            setShowCreate(true);
          }}
        />
      ) : null}

      {canCreateTask ? (
        <CreateTaskModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          projectId={selectedProject?._id}
          projects={projectsData}
          members={isManager ? workspaceMembers : boardMembers}
          groupOptions={taskGroupOptions}
          defaultGroupId={createTaskGroupId}
          onCreateTask={createTaskFromModal}
        />
      ) : null}

      {false && selectedTaskIds.length ? (
        <div className="fixed bottom-6 left-1/2 z-40 w-[min(760px,calc(100vw-40px))] -translate-x-1/2 rounded-[10px] border border-[#e2e7f3] bg-white px-6 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0073ea] text-sm font-semibold text-white">
                {selectedTaskIds.length}
              </span>
              <span className="text-[16px] font-semibold text-[#1f2a44]">{selectedTaskIds.length === 1 ? 'Task selected' : 'Tasks selected'}</span>
            </div>

            <div className="flex items-center gap-4">
              <SelectionAction icon="D" label="Duplicate" onClick={() => duplicateSelected()} disabled={duplicating || deleting || moving} />
              <SelectionAction icon="E" label="Export" onClick={exportSelected} disabled={duplicating || deleting || moving} />
              <SelectionAction icon="A" label="Archive" onClick={() => moveSelected('done')} disabled={duplicating || deleting || moving} />
              <SelectionAction icon="X" label="Delete" onClick={() => deleteSelected()} disabled={!canDeleteTask || duplicating || deleting || moving} />
              <SelectionAction icon="C" label="Convert" disabled />
              <SelectionAction icon="M" label="Move to" onClick={() => moveSelected('in_progress')} disabled={duplicating || deleting || moving} />
              <SelectionAction icon="S" label="Sidekick" disabled />
              <SelectionAction icon="A" label="Apps" disabled />
              <div className="h-10 w-px bg-[#dde3f0]" />
              <button
                type="button"
                onClick={() => setSelectedTaskIds([])}
                className="text-[26px] leading-none text-[#52607d] transition hover:text-[#1f2a44]"
              >
                x
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedTaskIds.length ? (
        <div className="fixed bottom-6 left-1/2 z-40 w-[min(680px,calc(100vw-32px))] -translate-x-1/2 rounded-[14px] border border-[#dfe5f2] bg-white px-5 py-4 shadow-[0_20px_44px_rgba(15,23,42,0.14)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0073ea] text-sm font-semibold text-white">
                {selectedTaskIds.length}
              </span>
              <span className="text-[15px] font-semibold text-[#1f2a44]">
                {selectedTaskIds.length === 1 ? 'Task selected' : 'Tasks selected'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canCreateTask ? (
                <button
                  type="button"
                  onClick={() => duplicateSelected()}
                  disabled={duplicating || deleting || moving}
                  className="rounded-[10px] border border-[#d9e1f4] bg-white px-3 py-2 text-[13px] font-medium text-[#1f2a44] transition hover:bg-[#f6f9ff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Duplicate
                </button>
              ) : null}
              <button
                type="button"
                onClick={exportSelected}
                disabled={duplicating || deleting || moving}
                className="rounded-[10px] border border-[#d9e1f4] bg-white px-3 py-2 text-[13px] font-medium text-[#1f2a44] transition hover:bg-[#f6f9ff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export
              </button>
              {isManager ? (
                <>
                  <button
                    type="button"
                    onClick={() => moveSelected('done')}
                    disabled={duplicating || deleting || moving}
                    className="rounded-[10px] border border-[#d9e1f4] bg-white px-3 py-2 text-[13px] font-medium text-[#1f2a44] transition hover:bg-[#f6fff9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSelected()}
                    disabled={duplicating || deleting || moving}
                    className="rounded-[10px] border border-[#f1c8d0] bg-white px-3 py-2 text-[13px] font-medium text-[#c23d52] transition hover:bg-[#fff6f8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setSelectedTaskIds([])}
                className="rounded-[10px] px-2 py-2 text-[20px] leading-none text-[#52607d] transition hover:bg-[#f6f9ff] hover:text-[#1f2a44]"
              >
                x
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedTaskId ? (
        <TaskDetailPanel
          taskId={selectedTaskId}
          projectId={tasksData.find((task) => task._id === selectedTaskId)?.projectId?._id}
          onClose={() => setSelectedTaskId(null)}
        />
      ) : null}

      <BoardConfigDialog
        state={boardDialog}
        onChange={(value) => setBoardDialog((current) => ({ ...current, value }))}
        onClose={closeBoardDialog}
        onSubmit={submitBoardDialog}
      />

      <AutomationsPanel
        open={showAutomationsPanel}
        onOpenChange={handleAutomationsPanelChange}
      />

      <AISidekickPanel
        open={showAiSidekick}
        onClose={() => setShowAiSidekick(false)}
        context={aiContext}
        userName={boardMembers[0]?.name || 'there'}
      />
    </div>
  );
}
