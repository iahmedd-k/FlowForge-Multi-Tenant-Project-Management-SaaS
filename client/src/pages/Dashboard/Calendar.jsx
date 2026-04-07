import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTasks } from '../../api/tasks.api';
import api from '../../api/axios';
import TaskCalendarView from '../../components/Dashboard Components/tasks/TaskCalendarView';
import TaskDetailPanel from '../../components/Dashboard Components/tasks/TaskDetailPanel';
import Spinner from '../../components/Dashboard Components/ui/Spinner';
import AssigneeIcon from '../../components/Dashboard Components/ui/AssigneeIcon';
import CreateTaskModal from '../../components/Dashboard Components/tasks/CreateTaskModal';
import { useAuth } from '../../hooks/useAuth';

const STATUS_STYLES = {
  backlog: 'bg-[#e8efff] text-[#2563eb]',
  in_progress: 'bg-[#fdab3d] text-white',
  review: 'bg-[#8b5cf6] text-white',
  done: 'bg-[#00c875] text-white',
};

const PRIORITY_STYLES = {
  low: 'bg-[#579bfc] text-white',
  medium: 'bg-[#5559df] text-white',
  high: 'bg-[#401694] text-white',
  urgent: 'bg-[#e2445c] text-white',
};

const GROUP_META = {
  past: { label: 'Past Dates', accent: 'text-[#8c4b3f]', border: 'border-l-[#cda69a]' },
  today: { label: 'Today', accent: 'text-[#08a46b]', border: 'border-l-[#08a46b]' },
  thisWeek: { label: 'This Week', accent: 'text-[#0073ea]', border: 'border-l-[#0073ea]' },
  nextWeek: { label: 'Next Week', accent: 'text-[#4da6ff]', border: 'border-l-[#4da6ff]' },
  later: { label: 'Later', accent: 'text-[#c9a227]', border: 'border-l-[#c9a227]' },
  noDate: { label: 'Without a Date', accent: 'text-[#6b7280]', border: 'border-l-[#9ca3af]' },
};

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfWeek(value) {
  const date = startOfDay(value);
  const day = date.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(23, 59, 59, 999);
  return date;
}

function getDateBucket(task, now) {
  if (!task.dueDate) return 'noDate';

  const dueDate = startOfDay(task.dueDate);
  const today = startOfDay(now);
  const thisWeekEnd = endOfWeek(now);
  const nextWeekEnd = endOfWeek(new Date(thisWeekEnd.getTime() + 24 * 60 * 60 * 1000));

  if (dueDate < today) return 'past';
  if (dueDate.getTime() === today.getTime()) return 'today';
  if (dueDate <= thisWeekEnd) return 'thisWeek';
  if (dueDate <= nextWeekEnd) return 'nextWeek';
  return 'later';
}

function formatTaskDate(date) {
  if (!date) return 'No date';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function initials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function Pill({ className, children }) {
  return (
    <span className={`inline-flex min-h-9 min-w-[122px] items-center justify-center px-3 text-sm font-medium ${className}`}>
      {children}
    </span>
  );
}

function ViewTab({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-1 py-2 text-[15px] transition ${
        active ? 'border-[#0073ea] text-[#1f2a44]' : 'border-transparent text-[#3a4361]'
      }`}
    >
      {children}
    </button>
  );
}

function SectionChevron({ collapsed, className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-[16px] w-[16px] shrink-0 transition-transform duration-150 ${collapsed ? '' : 'rotate-90'} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3.5 10.5 8 6 12.5" />
    </svg>
  );
}

function GroupSection({
  groupKey,
  tasks,
  collapsed,
  onToggle,
  onTaskClick,
  onCreateTask,
}) {
  const meta = GROUP_META[groupKey];
  const gridCols = 'grid-cols-[2.4fr_1.2fr_1.5fr_0.8fr_0.9fr_1.1fr_1fr]';

  return (
    <section className="mb-8">
      <button
        type="button"
        onClick={() => onToggle(groupKey)}
        className="mb-2 flex items-center gap-2.5 px-2 text-left"
      >
        <SectionChevron collapsed={collapsed} className={meta.accent} />
        <h2 className={`text-[19px] font-semibold leading-none tracking-[-0.02em] ${meta.accent}`}>{meta.label}</h2>
        <span className="pt-[1px] text-[13px] leading-none text-[#2f3a52]">
          {tasks.length} {tasks.length === 1 ? 'item' : 'items'}
        </span>
      </button>

      {!collapsed && (
        <div
          className="overflow-x-auto overflow-y-hidden rounded-[18px] border border-[#d8dff3] bg-white"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
        >
          <div className="min-w-[860px]">
          <div className={`grid ${gridCols} border-b border-[#d8dff3] bg-white text-[13px] font-medium text-[#3a4361]`}>
            <div className="px-4 py-3">Task</div>
            <div className="border-l border-[#d8dff3] px-4 py-3 text-center">Group</div>
            <div className="border-l border-[#d8dff3] px-4 py-3">Board</div>
            <div className="border-l border-[#d8dff3] px-4 py-3 text-center">People</div>
            <div className="border-l border-[#d8dff3] px-4 py-3 text-center">Date</div>
            <div className="border-l border-[#d8dff3] px-4 py-3 text-center">Status</div>
            <div className="border-l border-[#d8dff3] px-4 py-3 text-center">Priority</div>
          </div>

          {tasks.length ? (
            tasks.map((task) => (
              <button
                key={task._id}
                type="button"
                onClick={() => onTaskClick(task)}
                className={`grid w-full ${gridCols} border-b border-[#d8dff3] text-left text-[14px] text-[#2d3554] transition hover:bg-[#f8fbff] last:border-b-0`}
              >
                <div className={`border-l-4 px-4 py-3 ${meta.border}`}>
                  <p className="font-medium">{task.title}</p>
                </div>
                <div className="flex items-center justify-center border-l border-[#d8dff3] px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#579bfc]" />
                    {task.status === 'in_progress' ? 'Working on it' : task.status.replaceAll('_', '-')}
                  </span>
                </div>
                <div className="border-l border-[#d8dff3] px-4 py-3">
                  {task.projectId?.name || 'General'}
                </div>
                <div className="flex items-center justify-center border-l border-[#d8dff3] px-4 py-3">
                  <AssigneeIcon
                    assigned={Boolean(task.assignedTo?.name)}
                    size="lg"
                    title={task.assignedTo?.name || 'Unassigned'}
                    className="shadow-sm"
                  />
                </div>
                <div className="border-l border-[#d8dff3] px-4 py-3 text-center">
                  {formatTaskDate(task.dueDate)}
                </div>
                <div className="flex items-center justify-center border-l border-[#d8dff3] p-0">
                  <Pill className={STATUS_STYLES[task.status] || 'bg-[#d0d4e4] text-[#44516f]'}>
                    {task.status === 'in_progress' ? 'Working on it' : task.status.replaceAll('_', ' ')}
                  </Pill>
                </div>
                <div className="flex items-center justify-center border-l border-[#d8dff3] p-0">
                  <Pill className={PRIORITY_STYLES[task.priority] || 'bg-[#e6e9f5] text-[#5b6484]'}>
                    {task.priority || 'Auto'}
                  </Pill>
                </div>
              </button>
            ))
          ) : (
            <div className="border-l-4 border-l-transparent px-4 py-3 text-sm text-[#7a84a4]">
              No tasks in this section.
            </div>
          )}

          {onCreateTask ? (
            <button
              type="button"
              onClick={onCreateTask}
              className={`w-full border-t border-[#d8dff3] border-l-4 px-8 py-3 text-left text-sm text-[#5b6484] transition hover:bg-[#f8fbff] ${meta.border}`}
            >
              + Add task
            </button>
          ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

export default function Calendar() {
  const { isManager, workspace, canCreateTask, currentRole } = useAuth();
  const workspaceKey = workspace?._id || 'workspace';
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({
    past: false,
    today: false,
    thisWeek: false,
    nextWeek: false,
    later: false,
    noDate: false,
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['calendar-tasks', workspaceKey],
    queryFn: () => getTasks({}).then((res) => res.data.data.tasks),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', workspaceKey],
    queryFn: () => api.get('/projects').then((res) => res.data.data.projects),
    staleTime: 30_000,
  });

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;

    return tasks.filter((task) => {
      const haystack = [
        task.title,
        task.description,
        task.projectId?.name,
        task.assignedTo?.name,
        task.status,
        task.priority,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [search, tasks]);

  const groupedTasks = useMemo(() => {
    const now = new Date();
    const groups = {
      past: [],
      today: [],
      thisWeek: [],
      nextWeek: [],
      later: [],
      noDate: [],
    };

    filteredTasks
      .slice()
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return a.title.localeCompare(b.title);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      })
      .forEach((task) => {
        groups[getDateBucket(task, now)].push(task);
      });

    return groups;
  }, [filteredTasks]);

  const datedTasks = useMemo(
    () =>
      filteredTasks
        .filter((task) => task.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    [filteredTasks]
  );

  const firstProject = projects[0];
  const hasProjectAccess = projects.length > 0;

  const toggleGroup = (groupKey) => {
    setCollapsedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

  return (
    <div className="px-3 py-3 sm:px-4">
      {['member', 'viewer'].includes(currentRole) ? (
        <div className="mb-3 rounded-[14px] border border-[#d8e4fb] bg-[#f7fbff] px-4 py-3 text-[13px] text-[#496282]">
          {currentRole === 'viewer'
            ? 'Viewer access: this calendar only shows tasks from projects that were shared with you.'
            : 'Member access: this calendar is limited to tasks from projects you belong to.'}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-[22px] border border-[#d8dff3] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#d8dff3] px-4 py-4 sm:px-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] leading-none font-semibold text-[#1f2a44] sm:text-[32px]">My Work</h1>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#bcc7e6] text-xs text-[#5b6484]">i</span>
            </div>
            <div className="mt-3 overflow-x-auto sm:mt-4" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
              <div className="flex min-w-max items-center gap-5 sm:gap-6">
                <ViewTab active={view === 'table'} onClick={() => setView('table')}>Table</ViewTab>
                <ViewTab active={view === 'calendar'} onClick={() => setView('calendar')}>Calendar</ViewTab>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#fbfcff] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-3">
            {canCreateTask ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="w-full rounded-lg bg-[#0073ea] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0060c0] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                New Task
              </button>
            ) : null}

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="w-full rounded-lg border border-[#cfd7ee] bg-white px-4 py-2.5 text-sm text-[#1f2a44] placeholder:text-[#7a84a4] focus:border-[#0073ea] sm:w-[210px]"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !hasProjectAccess && ['member', 'viewer'].includes(currentRole) ? (
        <div className="border-x border-b border-[#d8dff3] bg-white px-5 py-10 text-center">
          <p className="text-[15px] font-semibold text-[#1f2a44]">No tasks to show yet</p>
          <p className="mx-auto mt-2 max-w-[560px] text-[13px] leading-6 text-[#7a84a4]">
            This workspace has not shared any projects with your account yet, so your calendar is empty for now.
            Once you are added to a project, your assigned and visible tasks will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="border-x border-b border-[#d8dff3] bg-white px-3 py-4 sm:px-5">
          {view === 'calendar' ? (
            <TaskCalendarView
              tasks={datedTasks}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onTaskClick={(task) => setSelectedTaskId(task._id)}
            />
          ) : (
            Object.keys(GROUP_META).map((groupKey) => (
              <GroupSection
                key={groupKey}
                groupKey={groupKey}
                tasks={groupedTasks[groupKey]}
                collapsed={collapsedGroups[groupKey]}
                onToggle={toggleGroup}
                onTaskClick={(task) => setSelectedTaskId(task._id)}
                onCreateTask={canCreateTask ? () => setShowCreate(true) : undefined}
              />
            ))
          )}
        </div>
      )}

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          projectId={tasks.find((task) => task._id === selectedTaskId)?.projectId?._id}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {canCreateTask ? (
        <CreateTaskModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          projectId={firstProject?._id}
          projects={projects}
          members={firstProject?.members || []}
        />
      ) : null}
    </div>
  );
}
