import { Play, Square, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTimeTracker } from '../hooks/useTimeTracker';

export default function TimeTrackerButton({ taskId, projectId, workspaceId }) {
  const qc = useQueryClient();
  const { activeLog, elapsed, start, stop, formatElapsed, error } = useTimeTracker(workspaceId);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const isTrackingThis = String(activeLog?.taskId || '') === String(taskId || '');

  const handleClick = async () => {
    // Validate required fields
    if (!taskId || !projectId || !workspaceId) {
      const missing = [];
      if (!taskId) missing.push('taskId');
      if (!projectId) missing.push('projectId');
      if (!workspaceId) missing.push('workspaceId');
      setLocalError(`Required data missing: ${missing.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setLocalError(null);
    try {
      if (isTrackingThis) {
        await stop();
        qc.invalidateQueries({ queryKey: ['task-time-logs', taskId] });
        qc.invalidateQueries({ queryKey: ['task', taskId] });
        return;
      }
      await start(taskId, projectId);
      qc.invalidateQueries({ queryKey: ['task-time-logs', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    } catch (err) {
      console.error('[TimeTrackerButton] Error:', err);
      setLocalError(err?.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={isTrackingThis ? 'destructive' : 'outline'}
        size="sm"
        onClick={handleClick}
        disabled={isLoading || !workspaceId}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {isTrackingThis ? 'Stopping...' : 'Starting...'}
          </>
        ) : isTrackingThis ? (
          <>
            <Square className="h-3 w-3" />
            {formatElapsed(elapsed)}
          </>
        ) : (
          <>
            <Play className="h-3 w-3" />
            Track time
          </>
        )}
      </Button>
      {displayError && (
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
          <p className="text-[12px] text-red-600">{displayError}</p>
        </div>
      )}
    </div>
  );
}
