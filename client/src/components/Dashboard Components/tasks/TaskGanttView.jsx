import { useMemo, useRef, useState } from 'react';

const C = {
  surface: '#FFFFFF',
  bg:      '#F8FAFC',
  border:  'rgba(0,0,0,0.07)',
  borderMd:'rgba(0,0,0,0.11)',
  text:    '#0F1117',
  sub:     '#3D4452',
  muted:   '#8891A4',
  accent:  '#4F46E5',
};

const STATUS_BAR = {
  backlog:     { bar:'#94A3B8', bg:'#F1F5F9', border:'#CBD5E1', text:'#475569', label:'Backlog'     },
  in_progress: { bar:'#3B82F6', bg:'#DBEAFE', border:'#93C5FD', text:'#1D4ED8', label:'In Progress' },
  review:      { bar:'#F59E0B', bg:'#FEF3C7', border:'#FCD34D', text:'#B45309', label:'Review'      },
  done:        { bar:'#10B981', bg:'#D1FAE5', border:'#6EE7B7', text:'#065F46', label:'Done'        },
};

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const DAY_W   = 30;
const ROW_H   = 48;
const LABEL_W = 210;
const HEAD_H  = 60;

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

export default function TaskGanttView({ project, tasks=[], onTaskClick }) {
  const scrollRef = useRef(null);
  const [hovId, setHovId] = useState(null);

  const ganttTasks = useMemo(() =>
    tasks.filter(t => t.dueDate).sort((a,b) => new Date(a.dueDate)-new Date(b.dueDate)),
  [tasks]);

  const { startDate, totalDays } = useMemo(() => {
    if (ganttTasks.length === 0) {
      const now = new Date(); now.setHours(0,0,0,0);
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: s, totalDays: 60 };
    }
    const allDates = ganttTasks.flatMap(t => {
      const due = new Date(t.dueDate);
      const est = t.startDate ? new Date(t.startDate) : addDays(due, -Math.max(3, Math.ceil(daysBetween(new Date(), due) * 0.2)));
      return [est, due];
    });
    if (project?.deadline) allDates.push(new Date(project.deadline));
    const min = new Date(Math.min(...allDates.map(d => d.getTime())));
    const max = new Date(Math.max(...allDates.map(d => d.getTime())));
    const s   = addDays(min, -4);
    const e   = addDays(max, 6);
    return { startDate: s, totalDays: daysBetween(s, e) + 1 };
  }, [ganttTasks, project]);

  const today = new Date(); today.setHours(0,0,0,0);
  const todayOff = daysBetween(startDate, today);

  const dayColumns = useMemo(() => {
    const cols = [];
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(startDate, i);
      cols.push({ date: d, day: d.getDate(), isWeekend: d.getDay()===0||d.getDay()===6 });
    }
    return cols;
  }, [startDate, totalDays]);

  const monthGroups = useMemo(() => {
    const groups = [];
    let cur = new Date(startDate);
    const end = addDays(startDate, totalDays);
    while (cur < end) {
      const m = cur.getMonth(), y = cur.getFullYear();
      let count = 0;
      while (cur < end && cur.getMonth() === m) { count++; cur = addDays(cur, 1); }
      groups.push({ label: `${MONTHS_SHORT[m]} ${y}`, days: count });
    }
    return groups;
  }, [startDate, totalDays]);

  function barProps(task) {
    const due   = new Date(task.dueDate);
    const start = task.startDate
      ? new Date(task.startDate)
      : addDays(due, -Math.max(3, Math.ceil(daysBetween(startDate, due) * 0.15) || 3));
    const left  = Math.max(0, daysBetween(startDate, start)) * DAY_W;
    const width = Math.max(DAY_W * 1.5, daysBetween(start, due) * DAY_W);
    const overdue = due < today && task.status !== 'done';
    return { left, width, overdue };
  }

  const totalW = totalDays * DAY_W;

  if (ganttTasks.length === 0) return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:14, padding:'64px 20px', textAlign:'center',
      background:C.surface, borderRadius:14,
      border:'1px solid rgba(0,0,0,0.08)',
      boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ width:52, height:52, borderRadius:14, background:C.accentBg||'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.6" strokeLinecap="round"><path d="M3 6h8M3 12h14M3 18h6"/></svg>
      </div>
      <div>
        <p style={{ fontSize:14, fontWeight:700, color:C.text, margin:'0 0 5px' }}>No timeline data</p>
        <p style={{ fontSize:12.5, color:C.muted, margin:0, lineHeight:1.6 }}>Add due dates to tasks to see them here</p>
      </div>
    </div>
  );

  return (
    <div style={{
      background:C.surface, borderRadius:14,
      border:'1px solid rgba(0,0,0,0.08)',
      boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
      overflow:'hidden', fontFamily:'inherit',
    }}>

      {/* Top bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'13px 18px', borderBottom:`1px solid ${C.border}`,
        background:'#FAFBFD',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round"><path d="M3 6h8M3 12h14M3 18h6"/></svg>
          <span style={{ fontSize:14, fontWeight:700, color:C.text, letterSpacing:'-0.02em' }}>Timeline</span>
          <span style={{ fontSize:12, color:C.muted }}>{ganttTasks.length} task{ganttTasks.length!==1?'s':''}</span>
        </div>
        {/* Legend */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {Object.values(STATUS_BAR).map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:10, height:10, borderRadius:3, background:s.bar, flexShrink:0 }} />
              <span style={{ fontSize:11.5, color:C.muted }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gantt body */}
      <div style={{ display:'flex', overflow:'hidden' }}>

        {/* Fixed left label panel */}
        <div style={{
          width:LABEL_W, flexShrink:0,
          borderRight:`1px solid ${C.border}`,
          background:C.surface, zIndex:2,
        }}>
          {/* Spacer matching header height */}
          <div style={{
            height:HEAD_H, borderBottom:`1px solid ${C.border}`,
            background:'#F8FAFC',
            display:'flex', alignItems:'flex-end', padding:'0 16px 9px',
          }}>
            <span style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:'0.07em', textTransform:'uppercase' }}>
              Task
            </span>
          </div>

          {/* Task label rows */}
          {ganttTasks.map((task, i) => {
            const s = STATUS_BAR[task.status] || STATUS_BAR.backlog;
            const isHov = hovId === task._id;
            return (
              <div key={task._id}
                onClick={() => onTaskClick(task)}
                onMouseEnter={() => setHovId(task._id)}
                onMouseLeave={() => setHovId(null)}
                style={{
                  height:ROW_H, display:'flex', alignItems:'center',
                  padding:'0 16px', gap:10, cursor:'pointer',
                  borderBottom:`1px solid ${C.border}`,
                  background: isHov ? '#F8FAFC' : i%2===0 ? C.surface : '#FAFBFD',
                  transition:'background 0.12s',
                }}
              >
                <span style={{ width:7, height:7, borderRadius:2, background:s.bar, flexShrink:0 }} />
                <span style={{
                  fontSize:12.5, fontWeight:500, color:C.sub,
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1,
                }}>
                  {task.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Scrollable chart */}
        <div ref={scrollRef} style={{ flex:1, overflowX:'auto', overflowY:'hidden' }}>
          <div style={{ width:totalW, position:'relative', minHeight: HEAD_H + ganttTasks.length * ROW_H }}>

            {/* Month row */}
            <div style={{ display:'flex', height:32, borderBottom:`1px solid ${C.border}`, background:'#F8FAFC' }}>
              {monthGroups.map((g,i) => (
                <div key={i} style={{
                  width:g.days*DAY_W, borderRight:`1px solid ${C.border}`,
                  display:'flex', alignItems:'center', padding:'0 10px',
                  fontSize:11.5, fontWeight:700, color:C.sub,
                  overflow:'hidden', whiteSpace:'nowrap', flexShrink:0,
                }}>
                  {g.label}
                </div>
              ))}
            </div>

            {/* Day row */}
            <div style={{ display:'flex', height:HEAD_H-32, borderBottom:`1px solid ${C.border}`, background:'#F8FAFC' }}>
              {dayColumns.map((col,i) => {
                const isToday2 = col.date.getTime() === today.getTime();
                return (
                  <div key={i} style={{
                    width:DAY_W, flexShrink:0, textAlign:'center',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:isToday2?700:400,
                    color:col.isWeekend?'#CBD5E1':isToday2?C.accent:C.muted,
                    borderRight:`1px solid rgba(0,0,0,0.04)`,
                    background:col.isWeekend?'rgba(0,0,0,0.015)':'transparent',
                    position:'relative',
                  }}>
                    {col.day}
                    {isToday2 && (
                      <span style={{
                        position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)',
                        width:4, height:4, borderRadius:'50%', background:C.accent,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Task rows */}
            {ganttTasks.map((task, i) => {
              const s = STATUS_BAR[task.status] || STATUS_BAR.backlog;
              const { left, width, overdue } = barProps(task);
              const isHov = hovId === task._id;

              return (
                <div key={task._id}
                  style={{
                    position:'relative', height:ROW_H,
                    borderBottom:`1px solid rgba(0,0,0,0.04)`,
                    background: i%2===0 ? C.surface : '#FAFBFD',
                  }}
                  onMouseEnter={() => setHovId(task._id)}
                  onMouseLeave={() => setHovId(null)}
                >
                  {/* Weekend shading */}
                  {dayColumns.map((col, ci) => col.isWeekend && (
                    <div key={ci} style={{
                      position:'absolute', top:0, left:ci*DAY_W, width:DAY_W, height:'100%',
                      background:'rgba(0,0,0,0.018)', pointerEvents:'none',
                    }} />
                  ))}

                  {/* Task bar */}
                  <div
                    onClick={() => onTaskClick(task)}
                    style={{
                      position:'absolute',
                      top:'50%', transform:'translateY(-50%)',
                      left:left + 3, width:Math.max(width - 6, DAY_W),
                      height:28, borderRadius:7,
                      background:overdue ? '#FEF2F2' : s.bg,
                      border:`1.5px solid ${overdue ? '#FCA5A5' : s.border}`,
                      cursor:'pointer', overflow:'hidden',
                      display:'flex', alignItems:'center', padding:'0 10px', gap:6,
                      boxShadow: isHov
                        ? `0 4px 12px rgba(0,0,0,0.12), 0 0 0 2px ${overdue ? '#FECACA' : s.border}`
                        : '0 1px 3px rgba(0,0,0,0.06)',
                      transition:'box-shadow 0.15s',
                    }}
                  >
                    {/* Progress fill for done */}
                    {task.status === 'done' && (
                      <div style={{
                        position:'absolute', inset:0, background:s.bar,
                        opacity:0.12, borderRadius:6,
                      }} />
                    )}
                    <span style={{
                      width:6, height:6, borderRadius:2,
                      background:overdue?'#EF4444':s.bar, flexShrink:0,
                    }} />
                    <span style={{
                      fontSize:11.5, fontWeight:600,
                      color:overdue?'#DC2626':s.text,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      flex:1, position:'relative',
                    }}>
                      {task.title}
                    </span>
                    {/* Due date chip */}
                    <span style={{
                      fontSize:10, fontWeight:600, color:overdue?'#DC2626':s.text,
                      opacity:0.8, whiteSpace:'nowrap', flexShrink:0,
                    }}>
                      {new Date(task.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Today vertical line */}
            {todayOff >= 0 && todayOff < totalDays && (
              <div style={{
                position:'absolute', top:0,
                height: HEAD_H + ganttTasks.length * ROW_H,
                left:todayOff * DAY_W + DAY_W/2,
                width:2, background:C.accent, opacity:0.5,
                pointerEvents:'none', zIndex:1,
              }}>
                <div style={{
                  position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
                  width:8, height:8, borderRadius:'50%', background:C.accent,
                }} />
              </div>
            )}

            {/* Deadline vertical line */}
            {project?.deadline && (() => {
              const dl = new Date(project.deadline);
              const off = daysBetween(startDate, dl);
              if (off < 0 || off >= totalDays) return null;
              return (
                <div style={{
                  position:'absolute', top:0,
                  height: HEAD_H + ganttTasks.length * ROW_H,
                  left:off * DAY_W + DAY_W/2,
                  width:2, background:'#EF4444', opacity:0.45,
                  pointerEvents:'none', zIndex:1,
                }}>
                  <div style={{
                    position:'absolute', top:HEAD_H + 6, left:4,
                    fontSize:10, fontWeight:700, color:'#EF4444', whiteSpace:'nowrap',
                    background:'#FEF2F2', padding:'2px 5px', borderRadius:4,
                    border:'1px solid #FECACA',
                  }}>
                    Deadline
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display:'flex', alignItems:'center', gap:16, flexWrap:'wrap',
        padding:'9px 18px', borderTop:`1px solid ${C.border}`,
        background:'#F8FAFC',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:18, height:2, background:C.accent, borderRadius:1, opacity:0.6 }} />
          <span style={{ fontSize:11.5, color:C.muted }}>Today</span>
        </div>
        {project?.deadline && (
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:18, height:2, background:'#EF4444', borderRadius:1, opacity:0.5 }} />
            <span style={{ fontSize:11.5, color:C.muted }}>Project deadline</span>
          </div>
        )}
        {tasks.filter(t => !t.dueDate).length > 0 && (
          <span style={{ marginLeft:'auto', fontSize:11, color:C.muted }}>
            {tasks.filter(t => !t.dueDate).length} task{tasks.filter(t => !t.dueDate).length!==1?'s':''} without due dates hidden
          </span>
        )}
      </div>
    </div>
  );
}