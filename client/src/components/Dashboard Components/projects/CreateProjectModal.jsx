import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
import { createProject } from '../../../api/projects.api';
import { getMembers } from '../../../api/workspace.api';
import { useBillingLimits } from '../../../hooks/useBillingLimits';
import { LimitLockedBadge } from '../../BillingComponents/LimitLockedBadge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { DatePicker } from '../../../components/ui/DatePicker';

const schema = z.object({
  name: z.string(),
  description: z.string().optional(),
  deadline: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

export default function CreateProjectModal({
  open,
  onClose,
  onCreated,
  includeMembers = true,
  title = 'New project',
  submitLabel = 'Create project',
}) {
  const qc = useQueryClient();
  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: () => getMembers().then((res) => res.data.data.members),
    staleTime: 30_000,
  });

  const members = membersData || [];
  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { memberIds: [] },
  });
  const selectedMemberIds = watch('memberIds') || [];

  const { canCreateProject, getProjectQuota, usageData } = useBillingLimits();
  const projectQuota = getProjectQuota();
  const isLimitReached = !canCreateProject();

  const { mutate, isPending, isError, error: mutationError } = useMutation({
    mutationFn: createProject,
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['workspace-usage'] });
      reset();
      onCreated?.(response.data.data.project);
      toast.success('✅ Project created successfully!');
      onClose();
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to create project';
      if (err?.response?.status === 403) {
        toast.error('🚫 ' + message);
      } else {
        toast.error(message);
      }
    },
  });

  const submitDisabled = isPending || isLimitReached || !watch('name')?.trim();

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit((d) => mutate(d))} className="flex flex-col gap-4">
        {isLimitReached && projectQuota && (
          <LimitLockedBadge 
            isLocked={true}
            resourceType="projects"
            tier={usageData?.tier || 'free'}
            message={`You've used ${projectQuota.used}/${projectQuota.limit} projects. Upgrade to create more.`}
          />
        )}
        {isError && mutationError?.response?.status === 403 && (
          <div className="rounded-md border-l-4 border-red-400 bg-red-50 p-3 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-900">Unable to create project</p>
              <p className="text-red-800">{mutationError?.response?.data?.message || 'Billing limit prevents this action.'}</p>
            </div>
          </div>
        )}
        <Input
          label="Project name"
          placeholder="Website redesign"
          error={errors.name?.message}
          {...register('name')}
          disabled={isLimitReached}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
            rows={3}
            placeholder="What is this project about?"
            {...register('description')}
            disabled={isLimitReached}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Deadline (optional)</label>
          <Controller
            control={control}
            name="deadline"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                disabled={isLimitReached}
              />
            )}
          />
          {errors.deadline?.message && (
            <p className="text-sm text-red-500">{errors.deadline.message}</p>
          )}
        </div>
        {includeMembers ? (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Members</label>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              {!members.length ? (
                <p className="text-sm text-gray-500">No workspace members available yet.</p>
              ) : (
                <div className="grid max-h-44 grid-cols-1 gap-2 overflow-y-auto pr-1">
                  {members.map((member) => {
                    const active = selectedMemberIds.includes(member._id);
                    return (
                      <label key={member._id} className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm transition ${active ? 'border-blue-300 bg-blue-50 text-gray-900' : 'border-transparent bg-white text-gray-600 hover:border-gray-200'}`}>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(event) => {
                            const next = event.target.checked
                              ? [...selectedMemberIds, member._id]
                              : selectedMemberIds.filter((id) => id !== member._id);
                            setValue('memberIds', next, { shouldDirty: true });
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                          disabled={isLimitReached}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition">
            Cancel
          </button>
          <Button 
            loading={isPending} 
            disabled={submitDisabled}
            title={isLimitReached ? `Project limit reached (${projectQuota?.limit || 3} projects max)` : ''}
            className="flex-1"
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
