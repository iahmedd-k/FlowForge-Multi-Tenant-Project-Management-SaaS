import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';

export function useTimeTracker(workspaceId) {
  const [activeLog, setActiveLog] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!workspaceId) {
      console.warn('[useTimeTracker] No workspaceId provided:', workspaceId);
      return;
    }

    api.get('/timelogs/active', { params: { workspaceId } })
      .then((res) => {
        const nextLog = res.data?.data?.timeLog || null;
        if (nextLog) {
          setActiveLog(nextLog);
          const secs = Math.floor((Date.now() - new Date(nextLog.startTime)) / 1000);
          setElapsed(secs);
        } else {
          setActiveLog(null);
          setElapsed(0);
        }
        setError(null);
      })
      .catch((err) => {
        console.error('[useTimeTracker] Failed to fetch active time log:', err?.response?.data || err.message);
        setError(err?.response?.data?.message || 'Failed to load active time log');
      });
  }, [workspaceId]);

  useEffect(() => {
    if (activeLog) {
      intervalRef.current = setInterval(() => setElapsed((value) => value + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [activeLog]);

  const start = async (taskId, projectId, note = '') => {
    try {
      if (!workspaceId) {
        throw new Error('Workspace ID is required to start timer');
      }
      if (!taskId) {
        throw new Error('Task ID is required to start timer');
      }
      if (!projectId) {
        throw new Error('Project ID is required to start timer');
      }
      console.log('[useTimeTracker] Starting timer for task:', { taskId, projectId, workspaceId, note });
      const res = await api.post('/timelogs/start', { taskId, projectId, workspaceId, note });
      const nextLog = res.data?.data?.timeLog || null;
      setActiveLog(nextLog);
      setElapsed(0);
      setError(null);
      console.log('[useTimeTracker] Timer started successfully:', nextLog);
      return nextLog;
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to start timer';
      console.error('[useTimeTracker] Failed to start timer:', errMsg);
      setError(errMsg);
      throw err;
    }
  };

  const stop = async () => {
    try {
      if (!activeLog) {
        console.warn('[useTimeTracker] No active log to stop');
        return null;
      }
      console.log('[useTimeTracker] Stopping timer:', activeLog._id);
      const res = await api.post(`/timelogs/stop/${activeLog._id}`);
      setActiveLog(null);
      setError(null);
      console.log('[useTimeTracker] Timer stopped successfully:', res.data?.data?.timeLog);
      return res.data?.data?.timeLog || null;
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to stop timer';
      console.error('[useTimeTracker] Failed to stop timer:', errMsg);
      setError(errMsg);
      throw err;
    }
  };

  const formatElapsed = (secs = elapsed) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return { activeLog, elapsed, start, stop, formatElapsed, error };
}
