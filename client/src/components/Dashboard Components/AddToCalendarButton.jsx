import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { exportTaskToCalendar, exportProjectToCalendar } from '../../../api/calendar.api';
import { downloadICS } from '../../../utils/calendar.utils';

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <path d="M9 3v8" />
      <path d="M15 3v8" />
    </svg>
  );
}

export function AddTaskToCalendarButton({ taskId, taskTitle, disabled = false }) {
  const [error, setError] = useState(null);

  const exportMutation = useMutation({
    mutationFn: () => exportTaskToCalendar(taskId),
    onSuccess: (response) => {
      downloadICS(response.data, `flowforge-task-${taskTitle.replace(/\s+/g, '-')}.ics`);
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || 'Failed to export task';
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    },
  });

  return (
    <div className="relative">
      <button
        onClick={() => {
          setError(null);
          exportMutation.mutate();
        }}
        disabled={disabled || exportMutation.isPending}
        className="inline-flex items-center gap-2 rounded-[10px] border border-[#d9e1f4] bg-white px-3 py-2 text-sm font-medium text-[#1f2a44] hover:bg-[#f8faff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Add this task to your calendar"
      >
        <CalendarIcon />
        <span>{exportMutation.isPending ? 'Exporting...' : 'Add to Calendar'}</span>
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-2 rounded-[8px] bg-red-100 border border-red-300 px-3 py-2 text-sm text-red-800 z-10 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}

export function AddProjectToCalendarButton({ projectId, projectName, disabled = false }) {
  const [error, setError] = useState(null);

  const exportMutation = useMutation({
    mutationFn: () => exportProjectToCalendar(projectId),
    onSuccess: (response) => {
      downloadICS(response.data, `flowforge-project-${projectName.replace(/\s+/g, '-')}.ics`);
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || 'Failed to export project';
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    },
  });

  return (
    <div className="relative">
      <button
        onClick={() => {
          setError(null);
          exportMutation.mutate();
        }}
        disabled={disabled || exportMutation.isPending}
        className="inline-flex items-center gap-2 rounded-[10px] border border-[#d9e1f4] bg-white px-3 py-2 text-sm font-medium text-[#1f2a44] hover:bg-[#f8faff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Add project deadline to your calendar"
      >
        <CalendarIcon />
        <span>{exportMutation.isPending ? 'Exporting...' : 'Add to Calendar'}</span>
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-2 rounded-[8px] bg-red-100 border border-red-300 px-3 py-2 text-sm text-red-800 z-10 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
