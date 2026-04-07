import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStatus } from '../../../api/tasks.api';
import AssigneeIcon from '../ui/AssigneeIcon';

const C = {
  surface: '#FFFFFF',
  border:  'rgba(0,0,0,0.07)',
  text:    '#0F1117',
  sub:     '#3D4452',
  muted:   '#8891A4',
};

const COLUMNS = [
  { key: 'done',        label: 'Done',            dot: '#00C875', headerBg: '#39C98A', countColor: '#FFFFFF', countBg: 'rgba(255,255,255,0.14)', badgeBg: '#EFFAF4', badgeBorder: '#B6EBCF', badgeText: '#18664A', colBg: '#F5F7FC', dropBg: '#E6F8EF', dropBorder: '#39C98A' },
  { key: 'in_progress', label: 'Working on it',   dot: '#FDAB3D', headerBg: '#FFC266', countColor: '#FFFFFF', countBg: 'rgba(255,255,255,0.14)', badgeBg: '#FFF5E7', badgeBorder: '#FFD79B', badgeText: '#8F5A0A', colBg: '#F5F7FC', dropBg: '#FFF1D9', dropBorder: '#FDAB3D' },
  { key: 'review',      label: 'Stuck',           dot: '#E2445C', headerBg: '#E4627A', countColor: '#FFFFFF', countBg: 'rgba(255,255,255,0.14)', badgeBg: '#FFF0F3', badgeBorder: '#F6B7C4', badgeText: '#8B2742', colBg: '#F5F7FC', dropBg: '#FFE4EA', dropBorder: '#E2445C' },
  { key: 'backlog',     label: 'Not Started',     dot: '#7F849B', headerBg: '#80859D', countColor: '#FFFFFF', countBg: 'rgba(255,255,255,0.14)', badgeBg: '#F3F4F8', badgeBorder: '#D7DAE6', badgeText: '#4F556B', colBg: '#F5F7FC', dropBg: '#ECEEF6', dropBorder: '#80859D' },
];

const PRIORITY = {
  urgent: { label: 'Urgent', color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5', dot: '#EF4444' },
  high:   { label: 'High',   color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B' },
  medium: { label: 'Medium', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6' },
  low:    { label: 'Low',    color: '#475569', bg: '#F8FAFC', border: '#CBD5E1', dot: '#94A3B8' },
};

function TaskCard({ task, onTaskClick, isDragging, onDragStart, onDragEnd }) {
  const [hov, setHov] = useState(false);
  const overdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();
  const isDone = task.status === 'done';
  const pm = PRIORITY[task.priority];
  const columnMeta = COLUMNS.find((column) => column.key === task.status) || COLUMNS[COLUMNS.length - 1];
  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : null;

  return (
    <div draggable={!String(task._id || '').startsWith('local-')} onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={() => !isDragging && onTaskClick(task)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: isDone ? '#FAFBFD' : C.surface,
        border: `1px solid ${overdue ? '#FCA5A5' : hov ? 'rgba(0,0,0,0.13)' : C.border}`,
        borderLeft: overdue ? '3px solid #EF4444' : '3px solid transparent',
        borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
        opacity: isDragging ? 0.4 : 1,
        transform: hov && !isDragging ? 'translateY(-2px)' : 'none',
        boxShadow: hov && !isDragging
          ? '0 8px 20px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.04)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        userSelect: 'none',
      }}
    >
      {pm && (
        <div style={{ marginBottom: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: pm.bg, color: pm.color, border: `1px solid ${pm.border}`,
            fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: pm.dot }} />
            {pm.label}
          </span>
        </div>
      )}

      <p style={{
        fontSize: 13.5, fontWeight: 500, lineHeight: 1.45, marginBottom: 12,
        color: isDone ? C.muted : C.text, textDecoration: isDone ? 'line-through' : 'none',
      }}>
        {task.title}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 0,
          background: columnMeta.badgeBg, border: `1px solid ${columnMeta.badgeBorder}`,
          color: columnMeta.badgeText, fontSize: 11, fontWeight: 500,
          borderRadius: 6, overflow: 'hidden'
        }}>
          <span style={{ width: 4, alignSelf: 'stretch', background: columnMeta.dot }} />
          <span style={{ padding: '4px 9px' }}>{columnMeta.label}</span>
        </span>
        {due && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#F3F4F8', color: '#4B5565',
            fontSize: 11, fontWeight: 500, padding: '4px 9px', borderRadius: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
              <path d="M5 2.5v2" />
              <path d="M11 2.5v2" />
              <path d="M2.5 6.5h11" />
            </svg>
            {due}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {task.assignedTo?.name ? (
            <AssigneeIcon
              assigned={Boolean(task.assignedTo?.name)}
              size="sm"
              title={task.assignedTo?.name || 'Unassigned'}
            />
          ) : <span />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#A5ACBA' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5A8.4 8.4 0 0 1 8 18.7L3 20l1.4-4.7A8.5 8.5 0 1 1 21 11.5Z"/></svg>
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="10" height="10"/><rect x="5" y="5" width="10" height="10"/></svg>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks = [], projectId, workspaceKey, queryKey, onTaskClick, onAddTask }) {
  const queryClient = useQueryClient();
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const taskQueryKey = queryKey || ['tasks', workspaceKey, projectId];

  const { mutate: moveTask } = useMutation({
    mutationFn: ({ id, status }) => updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKey });

      const previousTasks = queryClient.getQueryData(taskQueryKey);

      queryClient.setQueryData(taskQueryKey, (current = []) =>
        current.map((task) => (task._id === id ? { ...task, status } : task))
      );

      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskQueryKey, context.previousTasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKey });
      queryClient.invalidateQueries({ queryKey: ['project', workspaceKey, projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceKey] });
    },
  });

  const cols = COLUMNS.map(col => ({ ...col, tasks: tasks.filter(t => t.status === col.key) }));

  return (
    <div style={{ display:'flex', gap:18, alignItems:'flex-start', overflowX:'auto', padding:'8px 4px 16px', minHeight:520, background:'#fff' }}>
      {cols.map(col => {
        const isOver = dragOver === col.key;
        return (
          <div key={col.key}
            onDragOver={e => { e.preventDefault(); setDragOver(col.key); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging && dragging.status !== col.key) moveTask({ id: dragging._id, status: col.key });
              setDragging(null); setDragOver(null);
            }}
            style={{
              width: 326, flexShrink: 0, borderRadius: 16,
              background: isOver ? col.dropBg : col.colBg,
              border: `1.5px solid ${isOver ? col.dropBorder : '#e2e7f3'}`,
              padding: '0 0 16px',
              transition: 'background 0.18s, border-color 0.18s',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, padding:'14px 16px', background:col.headerBg }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#fff', flex:1, letterSpacing:'-0.01em' }}>{col.label}</span>
              <span style={{
                fontSize:12, fontWeight:700,
                background:col.countBg, color:col.countColor,
                padding:'2px 8px', borderRadius:20,
              }}>{col.tasks.length}</span>
            </div>

            {/* Cards */}
            <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 14px' }}>
              {col.tasks.length === 0 ? (
                <div style={{
                  padding:'28px 12px', borderRadius:10, textAlign:'center',
                  border:`1.5px dashed ${isOver ? col.dropBorder : 'rgba(0,0,0,0.1)'}`,
                  color:C.muted, fontSize:12.5,
                  background: isOver ? 'rgba(255,255,255,0.5)' : 'transparent',
                  transition:'all 0.15s',
                }}>
                  {isOver ? '↓ Drop here' : 'No tasks'}
                </div>
              ) : col.tasks.map(task => (
                <TaskCard key={task._id} task={task}
                  onTaskClick={onTaskClick}
                  isDragging={dragging?._id === task._id}
                  onDragStart={() => setDragging(task)}
                  onDragEnd={() => {
                    setDragging(null);
                    setDragOver(null);
                  }}
                />
              ))}
            </div>

            {onAddTask && (
              <button onClick={() => onAddTask(col.key)}
                style={{
                  width:'calc(100% - 28px)', margin:'12px 14px 0', padding:'10px 12px', borderRadius:10,
                  border:`1.5px dashed rgba(0,0,0,0.1)`,
                  background:'transparent', color:C.muted, fontSize:12.5,
                  fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                  transition:'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.8)'; e.currentTarget.style.color=C.sub; e.currentTarget.style.borderColor='rgba(0,0,0,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=C.muted; e.currentTarget.style.borderColor='rgba(0,0,0,0.1)'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Add task
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
