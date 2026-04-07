import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Siren,
  ShieldAlert,
  TimerReset,
  UserRoundX,
  Zap,
} from 'lucide-react';
import { getAutomations, syncAutomations } from '../../../api/automations.api';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

const FALLBACK_CATALOG = [
  {
    key: 'task_assignment_notification',
    name: 'Task Assignment Notification',
    description: 'If a task is assigned, notify the assignee in-app and by email.',
    isRequired: true,
  },
  {
    key: 'status_change_completion',
    name: 'Status Change Automation',
    description: 'If a task moves to Done, stamp its completion time and keep project progress aligned with task status.',
    isRequired: false,
  },
  {
    key: 'due_date_reminder',
    name: 'Due Date Reminder',
    description: 'Send a reminder 24 hours before due time and auto-flag overdue tasks.',
    isRequired: false,
  },
  {
    key: 'review_stage_alert',
    name: 'Review Stage Alert',
    description: 'When a task moves into Review, notify workspace admins and the project lead.',
    isRequired: false,
  },
  {
    key: 'priority_based_alert',
    name: 'Priority-Based Alerts',
    description: 'If a high-priority or urgent task is created, notify workspace admins and the project owner.',
    isRequired: false,
  },
  {
    key: 'unassigned_task_alert',
    name: 'Unassigned Task Alert',
    description: 'When a task is created without an owner, notify workspace admins so it gets assigned quickly.',
    isRequired: false,
  },
  {
    key: 'project_deadline_warning',
    name: 'Project Deadline Warning',
    description: 'When a project deadline is near, notify all project members.',
    isRequired: false,
  },
  {
    key: 'comment_mention_trigger',
    name: 'Comment Mention Trigger',
    description: 'If someone mentions a teammate in a task comment, notify that user.',
    isRequired: false,
  },
];

const ICONS = {
  task_assignment_notification: BellRing,
  status_change_completion: CheckCircle2,
  due_date_reminder: TimerReset,
  review_stage_alert: Siren,
  priority_based_alert: ShieldAlert,
  unassigned_task_alert: UserRoundX,
  project_deadline_warning: CalendarClock,
  comment_mention_trigger: MessageSquareText,
};

function AutomationCard({ item, enabled, onToggle }) {
  const Icon = ICONS[item.key] || Zap;

  return (
    <div className={`rounded-[22px] border p-5 transition ${
      enabled
        ? 'border-[#b8d4ff] bg-[#f7fbff] shadow-[0_14px_34px_rgba(15,114,240,0.08)]'
        : 'border-[#dbe3f2] bg-white'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] ${
            enabled ? 'bg-[#0f72f0] text-white' : 'bg-[#eef3ff] text-[#35507a]'
          }`}>
            <Icon size={21} strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[17px] font-semibold text-[#1f2a44]">{item.name}</h3>
              {item.isRequired ? (
                <span className="rounded-full bg-[#e8f1ff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0f72f0]">
                  Must have
                </span>
              ) : null}
            </div>
            <p className="mt-2 max-w-[54ch] text-[13px] leading-6 text-[#5f6d8b]">{item.description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-full border border-[#dbe3f2] bg-white px-3 py-2">
          <span className="text-[12px] font-medium text-[#334155]">{enabled ? 'Selected' : 'Off'}</span>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </div>
    </div>
  );
}

export default function AutomationsPanel({ open, onOpenChange }) {
  const { workspace, isManager } = useAuth();
  const qc = useQueryClient();
  const workspaceId = workspace?._id || '';
  const [draft, setDraft] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['automations', workspaceId],
    queryFn: () => getAutomations(workspaceId).then((res) => res.data.data),
    enabled: open && isManager && Boolean(workspaceId),
  });

  const catalog = data?.catalog?.length ? data.catalog : FALLBACK_CATALOG;
  const existingMap = useMemo(
    () => new Map((data?.automations || []).map((item) => [item.key, item])),
    [data]
  );

  useEffect(() => {
    if (!open) return;

    const nextDraft = {};
    catalog.forEach((item) => {
      const existing = existingMap.get(item.key);
      nextDraft[item.key] = existing ? Boolean(existing.isActive) : Boolean(item.isRequired);
    });
    setDraft(nextDraft);
  }, [open, catalog, existingMap]);

  const selectedCount = Object.values(draft).filter(Boolean).length;

  const syncMutation = useMutation({
    mutationFn: (payload) => syncAutomations(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automations', workspaceId] });
      onOpenChange(false);
    },
  });

  if (!isManager) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1120px,96vw)] gap-0 overflow-hidden border border-[#dbe3f2] bg-[#f4f8ff] p-0 sm:rounded-[28px]">
        <div className="flex h-[86vh] flex-col">
          <DialogHeader className="border-b border-[#dbe3f2] bg-white px-7 py-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <DialogTitle className="text-[28px] font-semibold tracking-[-0.03em] text-[#1f2a44]">
                  Automations
                </DialogTitle>
                <p className="mt-2 text-[14px] leading-6 text-[#62708f]">
                  Select the rules this workspace should run.
                </p>
              </div>
              <p className="text-[13px] font-medium text-[#5f6d8b]">{selectedCount} selected</p>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-7 py-6">
            {isLoading ? (
              <div className="flex h-full min-h-[260px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#0f72f0]" />
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {catalog.map((item) => (
                  <AutomationCard
                    key={item.key}
                    item={item}
                    enabled={Boolean(draft[item.key])}
                    onToggle={(nextValue) => {
                      setDraft((current) => ({ ...current, [item.key]: nextValue }));
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#dbe3f2] bg-white px-7 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                <Button
                  className="min-w-[148px]"
                  disabled={syncMutation.isPending || !workspaceId}
                  onClick={() =>
                    syncMutation.mutate({
                      workspaceId,
                      automations: catalog.map((item) => ({
                        key: item.key,
                        isActive: Boolean(draft[item.key]),
                        config: existingMap.get(item.key)?.config || {},
                      })),
                    })
                  }
                >
                  {syncMutation.isPending ? 'Saving...' : 'Save automations'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
