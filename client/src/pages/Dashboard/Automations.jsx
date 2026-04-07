import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Zap, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getMembers } from '../../api/workspace.api';
import {
  createAutomation,
  deleteAutomation,
  getAutomations,
  toggleAutomation,
  updateAutomation,
} from '../../api/automations.api';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TRIGGER_OPTIONS = [
  { value: 'status_change', label: 'Status change' },
  { value: 'due_date_approaching', label: 'Due date approaching' },
  { value: 'task_assigned', label: 'Task assigned' },
  { value: 'task_created', label: 'Task created' },
];

const ACTION_OPTIONS = [
  { value: 'send_notification', label: 'Send notification' },
  { value: 'change_status', label: 'Change status' },
  { value: 'assign_user', label: 'Assign user' },
  { value: 'fire_webhook', label: 'Fire webhook' },
];

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const EMPTY_FORM = {
  name: '',
  triggerType: 'status_change',
  triggerStatus: 'done',
  hoursBeforeDue: '24',
  actionType: 'send_notification',
  actionMessage: '',
  actionStatus: 'done',
  actionAssignTo: '',
  actionWebhookUrl: '',
};

function toFormValues(rule) {
  if (!rule) return EMPTY_FORM;
  return {
    name: rule.name || '',
    triggerType: rule.trigger?.type || 'status_change',
    triggerStatus: rule.trigger?.conditions?.status || 'done',
    hoursBeforeDue: String(rule.trigger?.conditions?.hoursBeforeDue || 24),
    actionType: rule.action?.type || 'send_notification',
    actionMessage: rule.action?.params?.message || '',
    actionStatus: rule.action?.params?.status || 'done',
    actionAssignTo: rule.action?.params?.assignTo || '',
    actionWebhookUrl: rule.action?.params?.webhookUrl || '',
  };
}

function toPayload(workspaceId, values) {
  const trigger = {
    type: values.triggerType,
    conditions: {},
  };

  if (values.triggerType === 'status_change') {
    trigger.conditions.status = values.triggerStatus;
  }
  if (values.triggerType === 'due_date_approaching') {
    trigger.conditions.hoursBeforeDue = Number(values.hoursBeforeDue || 24);
  }

  const action = {
    type: values.actionType,
    params: {},
  };

  if (values.actionType === 'send_notification') {
    action.params.message = values.actionMessage;
  }
  if (values.actionType === 'change_status') {
    action.params.status = values.actionStatus;
  }
  if (values.actionType === 'assign_user') {
    action.params.assignTo = values.actionAssignTo;
  }
  if (values.actionType === 'fire_webhook') {
    action.params.webhookUrl = values.actionWebhookUrl;
  }

  return {
    workspaceId,
    name: values.name,
    trigger,
    action,
  };
}

function triggerSummary(rule) {
  if (rule.trigger?.type === 'status_change') {
    const label = STATUS_OPTIONS.find((option) => option.value === rule.trigger?.conditions?.status)?.label || 'selected status';
    return `When status changes to ${label}`;
  }
  if (rule.trigger?.type === 'due_date_approaching') {
    return `When due date is approaching in ${rule.trigger?.conditions?.hoursBeforeDue || 24} hours`;
  }
  if (rule.trigger?.type === 'task_assigned') {
    return 'When a task is assigned';
  }
  return 'When a task is created';
}

function actionSummary(rule, members) {
  if (rule.action?.type === 'send_notification') {
    return 'Send notification';
  }
  if (rule.action?.type === 'change_status') {
    const label = STATUS_OPTIONS.find((option) => option.value === rule.action?.params?.status)?.label || 'status';
    return `Change status to ${label}`;
  }
  if (rule.action?.type === 'assign_user') {
    const member = members.find((item) => String(item._id) === String(rule.action?.params?.assignTo));
    return `Assign user${member ? `: ${member.name}` : ''}`;
  }
  return 'Fire webhook';
}

export default function Automations() {
  const { workspace, currentRole } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const workspaceId = workspace?._id || '';
  const canAccess = ['owner', 'admin'].includes(currentRole);

  const { data: automations = [] } = useQuery({
    queryKey: ['automations', workspaceId],
    queryFn: () => getAutomations(workspaceId).then((res) => res.data.data.automations || []),
    enabled: canAccess && Boolean(workspaceId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['workspace-members', 'automations', workspaceId],
    queryFn: () => getMembers().then((res) => res.data.data.members || []),
    enabled: canAccess && Boolean(workspaceId),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['automations', workspaceId] });

  const createMutation = useMutation({
    mutationFn: (payload) => createAutomation(payload),
    onSuccess: () => {
      refresh();
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAutomation(id, payload),
    onSuccess: () => {
      refresh();
      setOpen(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => toggleAutomation(id),
    onSuccess: refresh,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAutomation(id),
    onSuccess: refresh,
  });

  const modalTitle = editingRule ? 'Edit Rule' : 'Create Rule';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const sortedMembers = useMemo(() => [...members].sort((a, b) => (a.name || '').localeCompare(b.name || '')), [members]);

  if (!canAccess) {
    return <Navigate to="/settings" replace />;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-5">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[#1f2a44]">Automation Rules</h1>
          <p className="mt-1 text-[14px] text-[#6c7898]">Create rules that react to task events inside this workspace.</p>
        </div>
        <Button
          onClick={() => {
            setEditingRule(null);
            setFormValues(EMPTY_FORM);
            setOpen(true);
          }}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <div className="space-y-4">
        {automations.length ? automations.map((rule) => (
          <div key={rule._id} className="rounded-[18px] border border-[#d9e1f4] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[17px] font-semibold text-[#1f2a44]">{rule.name}</p>
                <p className="mt-1 text-[13px] text-[#5f6d8b]">{triggerSummary(rule)}</p>
                <p className="mt-1 text-[13px] text-[#5f6d8b]">→ {actionSummary(rule, members)}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-[12px] border border-[#dbe3f2] px-3 py-2">
                  <span className="text-[13px] text-[#1f2a44]">{rule.isActive ? 'Active' : 'Inactive'}</span>
                  <Switch
                    checked={Boolean(rule.isActive)}
                    onCheckedChange={() => toggleMutation.mutate(rule._id)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingRule(rule);
                    setFormValues(toFormValues(rule));
                    setOpen(true);
                  }}
                  className="gap-2"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRuleToDelete(rule)}
                  className="gap-2 text-[#b5374b]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )) : (
          <div className="rounded-[18px] border border-dashed border-[#d9e1f4] bg-white p-8 text-center text-[14px] text-[#6c7898]">
            No automation rules yet.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>Define the trigger and action for this workspace automation rule.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="rule-name">Rule name</Label>
              <Input id="rule-name" value={formValues.name} onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))} />
            </div>

            <div className="grid gap-2">
              <Label>Trigger type</Label>
              <Select value={formValues.triggerType} onValueChange={(value) => setFormValues((current) => ({ ...current, triggerType: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {formValues.triggerType === 'status_change' ? (
              <div className="grid gap-2">
                <Label>Trigger condition</Label>
                <Select value={formValues.triggerStatus} onValueChange={(value) => setFormValues((current) => ({ ...current, triggerStatus: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {formValues.triggerType === 'due_date_approaching' ? (
              <div className="grid gap-2">
                <Label htmlFor="hours-before-due">Hours before due</Label>
                <Input id="hours-before-due" type="number" value={formValues.hoursBeforeDue} onChange={(event) => setFormValues((current) => ({ ...current, hoursBeforeDue: event.target.value }))} />
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label>Action type</Label>
              <Select value={formValues.actionType} onValueChange={(value) => setFormValues((current) => ({ ...current, actionType: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {formValues.actionType === 'send_notification' ? (
              <div className="grid gap-2">
                <Label htmlFor="action-message">Message</Label>
                <Input id="action-message" value={formValues.actionMessage} onChange={(event) => setFormValues((current) => ({ ...current, actionMessage: event.target.value }))} />
              </div>
            ) : null}

            {formValues.actionType === 'change_status' ? (
              <div className="grid gap-2">
                <Label>Target status</Label>
                <Select value={formValues.actionStatus} onValueChange={(value) => setFormValues((current) => ({ ...current, actionStatus: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {formValues.actionType === 'assign_user' ? (
              <div className="grid gap-2">
                <Label>Assign user</Label>
                <Select value={formValues.actionAssignTo || undefined} onValueChange={(value) => setFormValues((current) => ({ ...current, actionAssignTo: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select workspace member" /></SelectTrigger>
                  <SelectContent>
                    {sortedMembers.map((member) => <SelectItem key={member._id} value={member._id}>{member.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {formValues.actionType === 'fire_webhook' ? (
              <div className="grid gap-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input id="webhook-url" value={formValues.actionWebhookUrl} onChange={(event) => setFormValues((current) => ({ ...current, actionWebhookUrl: event.target.value }))} />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={!formValues.name.trim() || isSaving}
              onClick={() => {
                const payload = toPayload(workspaceId, formValues);
                if (editingRule) {
                  updateMutation.mutate({ id: editingRule._id, payload });
                  return;
                }
                createMutation.mutate(payload);
              }}
            >
              {isSaving ? 'Saving...' : editingRule ? 'Save changes' : 'Create rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(ruleToDelete)} onOpenChange={(nextOpen) => { if (!nextOpen) setRuleToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete automation rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {ruleToDelete?.name || 'this rule'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (ruleToDelete?._id) {
                  deleteMutation.mutate(ruleToDelete._id);
                }
                setRuleToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
