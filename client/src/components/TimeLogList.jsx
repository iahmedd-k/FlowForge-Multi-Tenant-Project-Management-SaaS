import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { getTaskTimeLogs } from '../api/timelogs.api';

function formatDuration(seconds = 0) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function TimeLogList({ taskId }) {
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['task-time-logs', taskId],
    queryFn: () => {
      console.log('[TimeLogList] Fetching time logs for task:', taskId);
      return getTaskTimeLogs(taskId).then((res) => {
        console.log('[TimeLogList] Received data:', res.data.data);
        return res.data.data;
      });
    },
    enabled: Boolean(taskId),
  });

  const logs = data?.logs || [];
  const totalSeconds = data?.totalSeconds || 0;

  return (
    <div className="rounded-[14px] border border-[#e3e8f4] bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a94ad]">Time Logs</p>
        <span className="text-[12px] font-medium text-[#1f2a44]">Total tracked: {formatDuration(totalSeconds)}</span>
      </div>

      {isError && (
        <div className="flex items-start gap-2 rounded-[8px] bg-red-50 p-3 mb-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
          <p className="text-[12px] text-red-600">{error?.response?.data?.message || 'Failed to load time logs'}</p>
        </div>
      )}

      {isLoading ? (
        <p className="text-[13px] text-[#7b86a2]">Loading time logs...</p>
      ) : !logs.length ? (
        <p className="text-[13px] text-[#7b86a2]">No time logged yet</p>
      ) : (
        <div className="space-y-2">
          {logs.map((entry) => (
            <div key={entry._id} className="flex items-center justify-between gap-3 rounded-[10px] border border-[#e4e9f4] px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[#1f2a44]">{entry.userId?.name || 'User'}</p>
                <p className="text-[11px] text-[#7b86a2]">
                  {entry.startTime ? new Date(entry.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </p>
              </div>
              <span className="shrink-0 text-[12px] font-medium text-[#1f2a44]">{formatDuration(entry.duration || 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
