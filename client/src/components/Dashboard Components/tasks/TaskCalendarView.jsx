import { useMemo, useState } from 'react';

const C = {
  surface: '#FFFFFF',
  border:  'rgba(0,0,0,0.07)',
  text:    '#0F1117',
  sub:     '#3D4452',
  muted:   '#8891A4',
  accent:  '#4F46E5',
  accentBg:'#EEF2FF',
};

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_PILL = {
  backlog:     { bg:'#F1F5F9', border:'#CBD5E1', dot:'#64748B', text:'#475569' },
  in_progress: { bg:'#EFF6FF', border:'#BFDBFE', dot:'#3B82F6', text:'#1D4ED8' },
  review:      { bg:'#FFFBEB', border:'#FDE68A', dot:'#F59E0B', text:'#B45309' },
  done:        { bg:'#F0FDF4', border:'#BBF7D0', dot:'#10B981', text:'#065F46' },
};

export default function TaskCalendarView({ tasks=[], selectedMonth, onMonthChange, onTaskClick }) {
  const year  = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const today = new Date();
  today.setHours(0,0,0,0);

  const daysInMonth  = new Date(year, month+1, 0).getDate();
  const firstDay     = new Date(year, month, 1).getDay();

  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(t);
      }
    });
    return map;
  }, [tasks, year, month]);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = d => {
    if (!d) return false;
    const t = new Date(year, month, d);
    return t.getTime() === today.getTime();
  };

  const isPast = d => {
    if (!d) return false;
    return new Date(year, month, d) < today;
  };

  return (
    <div style={{
      background: C.surface, borderRadius: 14,
      border: '1px solid rgba(0,0,0,0.08)',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        background: '#FAFBFD',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>
            {MONTHS[month]} <span style={{ color: C.muted, fontWeight: 500 }}>{year}</span>
          </h3>
          <button
            onClick={() => onMonthChange(new Date())}
            style={{
              fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
              border: '1px solid rgba(0,0,0,0.1)', background: C.surface,
              color: C.sub, cursor: 'pointer',
            }}
          >
            Today
          </button>
        </div>

        {/* Month stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {tasks.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {[
                { label: 'Total', count: tasks.length, color: C.sub },
                { label: 'Done', count: tasks.filter(t => t.status === 'done').length, color: '#10B981' },
                { label: 'Overdue', count: tasks.filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date()).length, color: '#EF4444' },
              ].map(s => s.count > 0 && (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.count}</span>
                  <span style={{ fontSize: 11.5, color: C.muted }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Nav arrows */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[{ dir: -1, label: 'Previous month' }, { dir: 1, label: 'Next month' }].map(({ dir, label }) => (
              <button key={dir}
                onClick={() => onMonthChange(new Date(year, month + dir, 1))}
                aria-label={label}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.1)', background: C.surface,
                  color: C.sub, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.surface; }}
              >
                <svg viewBox="0 0 16 16" style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  {dir < 0 ? <path d="M9.5 3.5 5 8l4.5 4.5" /> : <path d="M6.5 3.5 11 8l-4.5 4.5" />}
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        background: '#F8FAFC', borderBottom: '1px solid rgba(0,0,0,0.07)',
      }}>
        {DAYS.map((d, i) => (
          <div key={d} style={{
            padding: '9px 0', textAlign: 'center',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            color: (i === 0 || i === 6) ? '#CBD5E1' : C.muted,
            textTransform: 'uppercase',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, i) => {
          const dayTasks = day ? (tasksByDay[day] || []) : [];
          const isCurrentDay = isToday(day);
          const isWeekend = i % 7 === 0 || i % 7 === 6;
          const isPastDay  = !isCurrentDay && isPast(day);
          const visible = dayTasks.slice(0, 3);
          const extra  = dayTasks.length - 3;

          return (
            <div key={i} style={{
              minHeight: 96, padding: '8px 8px 6px',
              borderRight: '1px solid rgba(0,0,0,0.05)',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              background: !day
                ? '#FBFCFD'
                : isWeekend
                ? '#FAFBFD'
                : isPastDay
                ? '#FEFEFE'
                : C.surface,
            }}>
              {day && (
                <>
                  <div style={{ marginBottom: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, height: 24, borderRadius: '50%',
                      fontSize: 12, fontWeight: isCurrentDay ? 700 : isPastDay ? 400 : 500,
                      background: isCurrentDay ? C.accent : 'transparent',
                      color: isCurrentDay ? '#fff' : isPastDay ? '#CBD5E1' : C.sub,
                    }}>
                      {day}
                    </span>
                    {dayTasks.length > 0 && !isCurrentDay && (
                      <span style={{
                        fontSize: 9.5, fontWeight: 700,
                        color: C.muted, background: '#F1F5F9',
                        padding: '1px 5px', borderRadius: 10,
                      }}>
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {visible.map(task => {
                      const overdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
                      const isDone  = task.status === 'done';
                      const pill = isDone
                        ? STATUS_PILL.done
                        : overdue
                        ? { bg:'#FEF2F2', border:'#FECACA', dot:'#EF4444', text:'#DC2626' }
                        : STATUS_PILL[task.status] || STATUS_PILL.backlog;

                      return (
                        <div key={task._id}
                          onClick={() => onTaskClick(task)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '3px 7px', borderRadius: 5, cursor: 'pointer',
                            background: pill.bg,
                            border: `1px solid ${pill.border}`,
                            transition: 'opacity 0.12s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: pill.dot, flexShrink: 0 }} />
                          <span style={{
                            fontSize: 11, fontWeight: 500, color: pill.text,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}>
                            {task.title}
                          </span>
                        </div>
                      );
                    })}
                    {extra > 0 && (
                      <span style={{ fontSize: 10.5, color: C.muted, fontWeight: 600, paddingLeft: 4 }}>
                        +{extra} more
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        padding: '10px 20px', borderTop: '1px solid rgba(0,0,0,0.07)',
        background: '#F8FAFC',
      }}>
        {[
          { dot:'#64748B', bg:'#F1F5F9', border:'#CBD5E1', label:'Backlog' },
          { dot:'#3B82F6', bg:'#EFF6FF', border:'#BFDBFE', label:'In progress' },
          { dot:'#F59E0B', bg:'#FFFBEB', border:'#FDE68A', label:'Review' },
          { dot:'#10B981', bg:'#F0FDF4', border:'#BBF7D0', label:'Done' },
          { dot:'#EF4444', bg:'#FEF2F2', border:'#FECACA', label:'Overdue' },
        ].map(item => (
          <div key={item.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:5, background:item.bg, border:`1px solid ${item.border}` }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:item.dot }} />
              <span style={{ fontSize:11, fontWeight:500, color:item.dot }}>{item.label}</span>
            </span>
          </div>
        ))}
        <div style={{ marginLeft:'auto', fontSize:11, color:C.muted }}>
          {tasks.length} task{tasks.length!==1?'s':''} with due dates
        </div>
      </div>
    </div>
  );
}
