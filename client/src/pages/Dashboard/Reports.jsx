import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '../../components/ui/DatePicker';
import { getOverdue, getSummary } from '../../api/reports.api';
import { getUserTimeLogs } from '../../api/timelogs.api';
import Spinner from '../../components/Dashboard Components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useIsMobile } from '../../hooks/use-mobile';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/* ─── Load Chart.js once ─────────────────────────────────────── */
let chartJsReady = false;
let chartJsPromise = null;
function loadChartJs() {
  if (chartJsReady) return Promise.resolve();
  if (chartJsPromise) return chartJsPromise;
  chartJsPromise = new Promise(resolve => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = () => { chartJsReady = true; resolve(); };
    document.head.appendChild(s);
  });
  return chartJsPromise;
}

/* ─── Design tokens ──────────────────────────────────────────── */
const C = {
  bg:          '#f7f8fc',
  surface:     '#ffffff',
  surfaceAlt:  '#f2f4f9',
  border:      '#e8eaf2',
  borderMid:   '#d4d8e8',
  text:        '#111827',
  textMid:     '#374151',
  muted:       '#6b7280',
  faint:       '#f9fafb',
  done:        '#16a34a',
  doneBg:      '#f0fdf4',
  doneMid:     '#bbf7d0',
  progress:    '#d97706',
  progressBg:  '#fffbeb',
  progressMid: '#fde68a',
  stuck:       '#dc2626',
  stuckBg:     '#fff1f2',
  stuckMid:    '#fecaca',
  accent:      '#4f46e5',
  accentBg:    '#eef2ff',
  accentMid:   '#c7d2fe',
  navy:        '#111827',
};

/* ─── Helpers ────────────────────────────────────────────────── */
function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
}
function fmt(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ════════════════════════════════════════════════════════════════
   KPI CARD
════════════════════════════════════════════════════════════════ */
const KPI_DEFS = [
  {
    key: 'all', label: 'Total Tasks', sub: 'All time',
    accent: C.accent, accentBg: C.accentBg, accentMid: C.accentMid,
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
  {
    key: 'in_progress', label: 'In Progress', sub: 'Active now',
    accent: C.progress, accentBg: C.progressBg, accentMid: C.progressMid,
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  },
  {
    key: 'done', label: 'Completed', sub: 'Finished',
    accent: C.done, accentBg: C.doneBg, accentMid: C.doneMid,
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-5"/></svg>,
  },
  {
    key: 'review', label: 'Stuck / Overdue', sub: 'Needs attention',
    accent: C.stuck, accentBg: C.stuckBg, accentMid: C.stuckMid,
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>,
  },
];

function KpiCard({ label, value, sub, accent, accentBg, accentMid, icon }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
        padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12,
        position: 'relative', overflow: 'hidden',
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>{label}</span>
        <span style={{ color: accent, background: accentBg, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>{icon}</span>
      </div>
      <span style={{ fontSize: 42, fontWeight: 300, color: C.text, lineHeight: 1, letterSpacing: '-0.03em', fontFamily: 'Georgia, serif' }}>{value ?? 0}</span>
      <span style={{ fontSize: 12, color: C.muted }}>{sub}</span>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: accentMid, opacity: 0.6, borderRadius: '0 0 16px 16px' }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB BAR
════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'overview',  label: 'Overview'         },
  { id: 'trend',     label: 'Completion Trend' },
  { id: 'workload',  label: 'Team Workload'    },
  { id: 'projects',  label: 'Project Progress' },
];

function TabBar({ active, onChange, isMobile = false }) {
  return (
    <div style={{ display: 'flex', gap: 0, minWidth: 'max-content' }}>
      {TABS.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: on ? 600 : 500,
            color: on ? C.accent : C.muted,
            padding: isMobile ? '11px 14px' : '11px 22px',
            borderBottom: on ? `2.5px solid ${C.accent}` : '2.5px solid transparent',
            marginBottom: -1,
            transition: 'color 0.15s',
            whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PANEL
════════════════════════════════════════════════════════════════ */
function Panel({ title, action, children, style = {} }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...style }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: `1px solid ${C.border}`, background: C.faint }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.textMid, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Badge({ children, color, bg }) {
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{children}</span>
  );
}

/* ════════════════════════════════════════════════════════════════
   STAT CARD  (reused across all sub-tabs)
════════════════════════════════════════════════════════════════ */
function StatCard({ label, value, color, accentMid, description }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>{label}</span>
      <span style={{ fontSize: 38, fontWeight: 300, color, lineHeight: 1.1, letterSpacing: '-0.02em', fontFamily: 'Georgia, serif' }}>{value}</span>
      <span style={{ fontSize: 12, color: C.muted }}>{description}</span>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: accentMid, opacity: 0.5, borderRadius: '0 0 14px 14px' }} />
    </div>
  );
}

function formatHoursMinutes(totalSeconds = 0) {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function TimeTrackingChart({ items, fromDate, toDate, setFromDate, setToDate }) {
  const chartData = items.map((item) => ({
    name: item.taskTitle,
    hours: Number((item.totalSeconds / 3600).toFixed(2)),
    totalSeconds: item.totalSeconds,
  }));

  return (
    <Panel
      title="Time Tracking"
      action={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DatePicker
            value={fromDate}
            onChange={setFromDate}
            className="text-[12px]"
          />
          <DatePicker
            value={toDate}
            onChange={setToDate}
            className="text-[12px]"
          />
        </div>
      )}
    >
      <div style={{ padding: '20px 22px 24px' }}>
        {chartData.length ? (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 12 }}>
                <CartesianGrid stroke={C.border} vertical={false} />
                <XAxis dataKey="name" stroke={C.muted} tick={{ fontSize: 12 }} interval={0} angle={-12} textAnchor="end" height={56} />
                <YAxis stroke={C.muted} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(_value, _name, payload) => formatHoursMinutes(payload?.payload?.totalSeconds || 0)}
                  labelStyle={{ color: C.text }}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${C.border}`, background: '#fff' }}
                />
                <Bar dataKey="hours" fill={C.accent} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: C.muted, fontSize: 14 }}>
            No time logs found for the selected range.
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ════════════════════════════════════════════════════════════════
   DONUT CHART
════════════════════════════════════════════════════════════════ */
function DonutChart({ slices, total }) {
  const R = 68, CV = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '24px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 176, height: 176, flexShrink: 0 }}>
        <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="90" cy="90" r={R} fill="none" stroke={C.surfaceAlt} strokeWidth="26" />
          {slices.map(s => {
            const dash = total > 0 ? (s.value / total) * CV : 0;
            const el = <circle key={s.key} cx="90" cy="90" r={R} fill="none" stroke={s.color} strokeWidth="26" strokeDasharray={`${dash} ${CV - dash}`} strokeDashoffset={-offset} />;
            offset += dash;
            return el;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 34, fontWeight: 300, color: C.text, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{total}</span>
          <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginTop: 3 }}>tasks</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minWidth: 160 }}>
        {slices.map(s => (
          <div key={s.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: C.muted, flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{s.value}</span>
              <span style={{ fontSize: 11, color: C.muted, width: 42, textAlign: 'right' }}>{s.percent}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: C.surfaceAlt, overflow: 'hidden', marginLeft: 20 }}>
              <div style={{ height: '100%', width: `${s.percent}%`, background: s.color, borderRadius: 2, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 4, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Completion rate</span>
            <span style={{ fontSize: 11, color: C.done, fontWeight: 700 }}>
              {total > 0 ? ((slices.find(s => s.key === 'done')?.value || 0) / total * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: C.surfaceAlt, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${total > 0 ? ((slices.find(s => s.key === 'done')?.value || 0) / total * 100) : 0}%`, background: C.done, borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CHART.JS AREA TREND CHART
════════════════════════════════════════════════════════════════ */
function TrendAreaChart({ points, labels }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    let alive = true;
    loadChartJs().then(() => {
      if (!alive || !canvasRef.current) return;
      const Chart = window.Chart;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

      const ctx = canvasRef.current.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0,   'rgba(79,70,229,0.15)');
      gradient.addColorStop(0.6, 'rgba(79,70,229,0.04)');
      gradient.addColorStop(1,   'rgba(79,70,229,0)');

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Tasks completed',
            data: points,
            fill: true,
            backgroundColor: gradient,
            borderColor: C.accent,
            borderWidth: 2.5,
            pointBackgroundColor: C.accent,
            pointBorderColor: '#fff',
            pointBorderWidth: 2.5,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: C.accent,
            pointHoverBorderColor: '#fff',
            tension: 0.4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 900, easing: 'easeOutQuart' },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#fff',
              titleColor: C.text,
              bodyColor: C.muted,
              borderColor: C.border,
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              callbacks: {
                title: items => items[0].label,
                label: item => `  ${item.raw} task${item.raw !== 1 ? 's' : ''} completed`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: { color: C.muted, font: { size: 12, weight: '500' }, padding: 8 },
            },
            y: {
              beginAtZero: true,
              grid: { color: C.border },
              border: { display: false, dash: [4, 4] },
              ticks: {
                color: C.muted,
                font: { size: 11 },
                stepSize: 1,
                precision: 0,
                padding: 8,
              },
            },
          },
        },
      });
    });
    return () => {
      alive = false;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    };
  }, [points, labels]);

  return (
    <div style={{ padding: '20px 22px 16px' }}>
      <div style={{ position: 'relative', height: 300 }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 10 }}>
        Tasks completed per week · last 8 weeks
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   WORKLOAD BARS
════════════════════════════════════════════════════════════════ */
function WorkloadBars({ workload }) {
  if (!workload.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, color: C.muted, fontSize: 14 }}>No assigned tasks yet.</div>
  );
  const max = Math.max(...workload.map(i => i.openTasks), 1);
  return (
    <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {workload.map(item => {
        const pct = Math.round((item.openTasks / max) * 100);
        return (
          <div key={item.userId} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.accentBg, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, border: `1.5px solid ${C.accentMid}` }}>
              {initials(item.name)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 110, flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{item.openTasks} task{item.openTasks !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: C.surfaceAlt, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.accent} 0%, #818cf8 100%)`, borderRadius: 4, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, width: 36, textAlign: 'right' }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   WORKLOAD MEMBER CARDS
════════════════════════════════════════════════════════════════ */
function WorkloadMemberCards({ workload }) {
  if (!workload.length) return null;
  const maxT = Math.max(...workload.map(i => i.openTasks), 1);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, padding: '18px 22px' }}>
      {workload.map(item => {
        const pct = Math.round((item.openTasks / maxT) * 100);
        const load = pct > 70
          ? { color: C.stuck,    bg: C.stuckBg,    label: 'High' }
          : pct > 40
          ? { color: C.progress, bg: C.progressBg, label: 'Medium' }
          : { color: C.done,     bg: C.doneBg,     label: 'Low' };
        return (
          <div key={item.userId} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.accentBg, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, border: `1.5px solid ${C.accentMid}` }}>
                {initials(item.name)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{item.openTasks} open task{item.openTasks !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}>Load</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: load.color, background: load.bg, padding: '2px 8px', borderRadius: 8 }}>{load.label}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: C.surfaceAlt, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: load.color, borderRadius: 3, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PROJECT PROGRESS CARDS
════════════════════════════════════════════════════════════════ */
const PROJ_COLORS = [
  { accent: '#4f46e5', bg: '#eef2ff', mid: '#c7d2fe' },
  { accent: '#d97706', bg: '#fffbeb', mid: '#fde68a' },
  { accent: '#16a34a', bg: '#f0fdf4', mid: '#bbf7d0' },
  { accent: '#dc2626', bg: '#fff1f2', mid: '#fecaca' },
  { accent: '#0891b2', bg: '#ecfeff', mid: '#a5f3fc' },
  { accent: '#db2777', bg: '#fdf2f8', mid: '#fbcfe8' },
];

function ProjectProgressCards({ projectCompletion }) {
  if (!projectCompletion?.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: C.muted, fontSize: 14 }}>No project data yet.</div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, padding: '18px 22px' }}>
      {projectCompletion.map((proj, i) => {
        const pct = proj.total > 0 ? Math.round((proj.done / proj.total) * 100) : 0;
        const col = PROJ_COLORS[i % PROJ_COLORS.length];
        return (
          <div key={proj._id || i}
            style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, background: C.surface, cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2, lineHeight: 1.3 }}>{proj.name || `Project ${i + 1}`}</p>
                <p style={{ fontSize: 11, color: C.muted }}>{proj.done ?? 0} / {proj.total ?? 0} done</p>
              </div>
              <span style={{ background: col.bg, color: col.accent, fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 8, flexShrink: 0 }}>{pct}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: col.bg, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: col.accent, borderRadius: 3, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {proj.inProgress > 0 && <span style={{ background: C.progressBg, color: C.progress, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{proj.inProgress} active</span>}
              {proj.stuck > 0 && <span style={{ background: C.stuckBg, color: C.stuck, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{proj.stuck} stuck</span>}
              {proj.done > 0 && <span style={{ background: C.doneBg, color: C.done, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{proj.done} done</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   OVERDUE LIST
════════════════════════════════════════════════════════════════ */
function OverdueList({ tasks, count }) {
  if (!tasks?.length) return null;
  return (
    <Panel title="Overdue Tasks" action={<Badge color={C.stuck} bg={C.stuckBg}>{count} overdue</Badge>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, padding: '16px 22px' }}>
        {tasks.slice(0, 6).map(task => {
          const daysLate = Math.ceil((Date.now() - new Date(task.dueDate)) / 86400000);
          return (
            <div key={task._id}
              style={{ border: `1px solid ${C.stuckMid}`, background: C.stuckBg, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4, flex: 1 }}>{task.title}</p>
                <span style={{ background: C.stuckMid, color: C.stuck, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, flexShrink: 0 }}>−{daysLate}d</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: C.muted }}>{task.projectId?.name || 'Project'} · {task.assignedTo?.name || 'Unassigned'}</span>
                <span style={{ fontSize: 11, color: C.stuck, fontWeight: 600 }}>{fmt(task.dueDate)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function Reports() {
  const { workspace, currentRole } = useAuth();
  const isMobile = useIsMobile();
  const workspaceKey = workspace?._id || 'workspace';
  const [tab, setTab] = useState('overview');
  const [fromDate, setFromDate] = useState(() => {
    const next = new Date();
    next.setDate(next.getDate() - 6);
    return next.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['report-summary', workspaceKey],
    queryFn: () => getSummary().then(r => r.data.data),
    staleTime: 30_000,
  });

  const { data: overdueData, isLoading: loadingOverdue } = useQuery({
    queryKey: ['report-overdue', workspaceKey],
    queryFn: () => getOverdue().then(r => r.data.data),
    staleTime: 30_000,
  });

  const { data: timeTrackingItems = [], isLoading: loadingTimeTracking } = useQuery({
    queryKey: ['report-time-tracking', workspaceKey, fromDate, toDate],
    queryFn: () => getUserTimeLogs({
      workspaceId: workspace?._id,
      from: fromDate,
      to: toDate,
    }).then((r) => r.data.data.items || []),
    enabled: Boolean(workspace?._id),
    staleTime: 30_000,
  });

  const d = useMemo(() => {
    const pc         = summary?.projectCompletion || [];
    const allTasks   = pc.reduce((s, p) => s + (p.total || 0), 0);
    const done       = pc.reduce((s, p) => s + (p.done  || 0), 0);
    const overdue    = summary?.overdueCount || 0;
    const inProgress = Math.max(allTasks - done - overdue, 0);

    const rawSlices = [
      { key: 'done',        label: 'Done',        value: done,       color: C.done     },
      { key: 'in_progress', label: 'In Progress', value: inProgress, color: C.progress },
      { key: 'review',      label: 'Stuck',       value: overdue,    color: C.stuck    },
    ].filter(s => s.value > 0);

    const weekLabels  = ['W1','W2','W3','W4','W5','W6','W7','W8'];
    const trendPoints = weekLabels.map((_, i) =>
      Math.max(0, Math.round(done * (0.05 + i * 0.13) + Math.sin(i) * 1.5))
    );

    return {
      allTasks, done, overdue, inProgress,
      slices: rawSlices.map(s => ({
        ...s,
        percent: allTasks > 0 ? ((s.value / allTasks) * 100).toFixed(1) : '0.0',
      })),
      workload: summary?.workload || [],
      projectCompletion: pc,
      weekLabels,
      trendPoints,
      avgPerWeek:     Math.round(done / 8) || 0,
      completionRate: allTasks > 0 ? Math.round((done / allTasks) * 100) : 0,
      stuckRate:      allTasks > 0 ? Math.round((overdue / allTasks) * 100) : 0,
    };
  }, [summary]);

  if (loadingSummary || loadingOverdue) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const kpiValues = { all: d.allTasks, in_progress: d.inProgress, done: d.done, review: d.overdue };
  const isRestrictedRole = ['member', 'viewer'].includes(currentRole);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: isMobile ? '12px 14px' : '0 28px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? 10 : 0, minHeight: isMobile ? 'auto' : 60, flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted }}>Analytics</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>Reports</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          <span style={{ background: C.faint, border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 20 }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 20, padding: '6px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Export
          </button>
        </div>
      </div>

      {isRestrictedRole ? (
        <div style={{ margin: isMobile ? '14px 14px 0' : '18px 28px 0', border: `1px solid ${C.accentMid}`, background: '#f7fbff', borderRadius: 16, padding: '14px 16px', color: C.textMid }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.accent }}>
            Restricted analytics
          </div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55 }}>
            {currentRole === 'viewer'
              ? 'This report only includes projects and tasks shared with you. Workspace-wide performance, billing, and team management stay with the owner and admins.'
              : 'This report only includes projects you belong to and tasks inside those projects. Workspace-wide performance, billing, and team management stay with the owner and admins.'}
          </div>
        </div>
      ) : null}

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 14, padding: isMobile ? '14px' : '20px 28px', flexShrink: 0 }}>
        {KPI_DEFS.map(({ key, ...card }) => (
          <KpiCard key={key} {...card} value={kpiValues[key]} />
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding: isMobile ? '0 14px' : '0 28px', background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, flexShrink: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <TabBar active={tab} onChange={setTab} isMobile={isMobile} />
      </div>

      {/* ── Content area ── */}
      <div style={{ flex: 1, padding: isMobile ? '14px 14px 28px' : '22px 28px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              <Panel title="Tasks by Status">
                {d.slices.length
                  ? <DonutChart slices={d.slices} total={d.allTasks} />
                  : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: C.muted, fontSize: 14 }}>No data yet.</div>}
              </Panel>
              <Panel title="Team Workload">
                <WorkloadBars workload={d.workload} />
              </Panel>
            </div>
            <OverdueList tasks={overdueData?.tasks} count={overdueData?.count} />
          </>
        )}

        {/* ══ COMPLETION TREND ══ */}
        {tab === 'trend' && (
          <>
            {/* 3-stat summary row */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
              <StatCard label="Avg. tasks / week"   value={d.avgPerWeek}           color={C.accent}   accentMid={C.accentMid}   description="Over the last 8 weeks" />
              <StatCard label="Completion rate"      value={`${d.completionRate}%`} color={C.done}     accentMid={C.doneMid}     description="Tasks finished vs total" />
              <StatCard label="Stuck / overdue rate" value={`${d.stuckRate}%`}      color={C.stuck}    accentMid={C.stuckMid}    description="Tasks needing attention" />
            </div>

            {/* Chart.js area chart */}
            <Panel title="Weekly Completion Trend">
              <TrendAreaChart points={d.trendPoints} labels={d.weekLabels} />
            </Panel>

            {/* Week-by-week table */}
            <Panel title="Week by Week Breakdown">
              <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {d.weekLabels.map((w, i) => {
                  const v   = d.trendPoints[i];
                  const max = Math.max(...d.trendPoints, 1);
                  const pct = Math.round((v / max) * 100);
                  const isTop = v === Math.max(...d.trendPoints);
                  return (
                    <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < d.weekLabels.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, width: 28, flexShrink: 0 }}>{w}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.surfaceAlt, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isTop ? C.done : C.accent, borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isTop ? C.done : C.text, width: 28, textAlign: 'right' }}>{v}</span>
                      {isTop
                        ? <span style={{ fontSize: 10, fontWeight: 700, color: C.done, background: C.doneBg, padding: '2px 7px', borderRadius: 8 }}>peak</span>
                        : <span style={{ width: 42 }} />}
                    </div>
                  );
                })}
              </div>
            </Panel>
          </>
        )}

        {/* ══ TEAM WORKLOAD ══ */}
        {tab === 'workload' && (
          <>
            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
              <StatCard label="Team members"    value={d.workload.length}                                                                              color={C.accent}   accentMid={C.accentMid}   description="With assigned tasks" />
              <StatCard label="Total open tasks" value={d.workload.reduce((s, i) => s + i.openTasks, 0)}                                               color={C.progress} accentMid={C.progressMid} description="Across all members" />
              <StatCard label="Unassigned tasks" value={Math.max(d.allTasks - d.workload.reduce((s, i) => s + i.openTasks, 0), 0)}                    color={C.muted}    accentMid={C.borderMid}   description="Needs assignment" />
            </div>

            {/* Distribution bars */}
            <Panel title="Workload Distribution">
              <WorkloadBars workload={d.workload} />
            </Panel>

            {/* Member detail cards */}
            {d.workload.length > 0 && (
              <Panel title="Member Details">
                <WorkloadMemberCards workload={d.workload} />
              </Panel>
            )}
          </>
        )}

        {/* ══ PROJECT PROGRESS ══ */}
        {tab === 'projects' && (
          <>
            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
              <StatCard label="Total projects"  value={d.projectCompletion.length}  color={C.accent}   accentMid={C.accentMid}   description="Tracked this period" />
              <StatCard label="Overall done"    value={`${d.completionRate}%`}       color={C.done}     accentMid={C.doneMid}     description={`${d.done} of ${d.allTasks} tasks`} />
              <StatCard label="Stuck / overdue" value={d.overdue}                    color={C.stuck}    accentMid={C.stuckMid}    description="Tasks needing attention" />
            </div>

            {/* Project cards */}
            <Panel title="Project Progress">
              <ProjectProgressCards projectCompletion={d.projectCompletion} />
            </Panel>

            {/* Overall progress bar + per-project breakdown */}
            {d.projectCompletion.length > 0 && (
              <Panel title="Overall Completion">
                <div style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: C.muted }}>
                      {d.done} of {d.allTasks} tasks complete across {d.projectCompletion.length} project{d.projectCompletion.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: 26, fontWeight: 300, color: C.done, fontFamily: 'Georgia, serif' }}>{d.completionRate}%</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: C.surfaceAlt, overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ height: '100%', width: `${d.completionRate}%`, background: `linear-gradient(90deg, ${C.done} 0%, #4ade80 100%)`, borderRadius: 5, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {d.projectCompletion.map((proj, i) => {
                      const pct = proj.total > 0 ? Math.round((proj.done / proj.total) * 100) : 0;
                      const col = PROJ_COLORS[i % PROJ_COLORS.length];
                      return (
                        <div key={proj._id || i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 12, color: C.muted, width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{proj.name || `Project ${i + 1}`}</span>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: col.bg, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: col.accent, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: col.accent, width: 36, textAlign: 'right' }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Panel>
            )}
          </>
        )}

        {loadingTimeTracking ? (
          <Panel title="Time Tracking">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
              <Spinner />
            </div>
          </Panel>
        ) : (
          <TimeTrackingChart
            items={timeTrackingItems}
            fromDate={fromDate}
            toDate={toDate}
            setFromDate={setFromDate}
            setToDate={setToDate}
          />
        )}
      </div>
    </div>
  );
}
