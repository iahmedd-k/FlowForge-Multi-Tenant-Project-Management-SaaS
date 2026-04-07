import { useEffect, useMemo, useState, forwardRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask } from '../../../api/tasks.api';
import { DatePicker } from '../../../components/ui/DatePicker';

const schema = z.object({
  title: z.string().trim(),
  projectId: z.string().optional(),
  groupId: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(['backlog', 'in_progress', 'review', 'done']),
  dueDate: z.string().optional(),
  priority: z.enum(['', 'low', 'medium', 'high', 'urgent']),
  budget: z.string().optional(),
  description: z.string().optional(),
});

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Not Started' },
  { value: 'in_progress', label: 'Working on it' },
  { value: 'review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'Auto' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function initials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function IconTile({ className, children }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] items-center justify-center rounded-[6px] text-[10px] font-medium text-white ${className}`}
    >
      {children}
    </span>
  );
}

function Row({ icon, label, error, children }) {
  return (
    <div className="grid grid-cols-[104px_1fr] items-start gap-2.5">
      <div className="flex items-center gap-2.5 pt-1 text-[12px] text-[#1f2a44]">
        {icon}
        <span>{label}</span>
      </div>
      <div>
        {children}
        {error ? <p className="mt-1 text-[11px] text-[#e2445c]">{error}</p> : null}
      </div>
    </div>
  );
}

function BaseField({ as = 'input', className = '', children, ...props }, ref) {
  const shared =
    'w-full rounded-[8px] border border-[#e3e8f4] bg-[#fafbfe] px-3 text-[12px] text-[#1f2a44] outline-none transition placeholder:text-[#90a0bf] focus:border-[#9ec5ff] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,115,234,0.08)]';

  if (as === 'textarea') {
    return <textarea ref={ref} {...props} className={`${shared} min-h-[36px] resize-none py-2 ${className}`} />;
  }

  if (as === 'select') {
    return (
      <select ref={ref} {...props} className={`${shared} h-[36px] appearance-none pr-8 ${className}`}>
        {children}
      </select>
    );
  }

  return <input ref={ref} {...props} className={`${shared} h-[36px] ${className}`} />;
}

export const BaseFieldForwarded = forwardRef(BaseField);

function SelectChevron() {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-[#73819f]">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6.5 8 10l4-3.5" />
      </svg>
    </span>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export default function CreateTaskModal({
  open,
  onClose,
  projectId,
  projects = [],
  members = [],
  groupOptions = [],
  defaultGroupId = '',
  defaultStatus = 'backlog',
  onCreateTask,
}) {
  const qc = useQueryClient();
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingExternal, setSubmittingExternal] = useState(false);
  const [serverError, setServerError] = useState('');

  const resolvedProjects = useMemo(() => {
    if (projects.length) return projects;
    if (!projectId) return [];
    return [{ _id: projectId, name: 'Current project', members }];
  }, [members, projectId, projects]);

  const {
    register,
    getValues,
    reset,
    setValue,
    trigger,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      projectId: projectId || '',
      groupId: defaultGroupId || groupOptions[0]?.id || '',
      assignedTo: '',
      status: defaultStatus,
      dueDate: '',
      priority: '',
      budget: '',
      description: '',
    },
  });

  const watchedProjectId = watch('projectId');
  const watchedAssignee = watch('assignedTo');

  const selectedProject = resolvedProjects.find((project) => project._id === watchedProjectId);
  const effectiveProjectId = watchedProjectId || projectId || resolvedProjects[0]?._id || '';

  const availableMembers = useMemo(() => {
    const combined = [...(selectedProject?.members || []), ...members];
    const seen = new Set();

    return combined.filter((member) => {
      if (!member?._id || seen.has(member._id)) return false;
      seen.add(member._id);
      return true;
    });
  }, [members, selectedProject]);

  const selectedMember = availableMembers.find((member) => member._id === watchedAssignee);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose();
    };

    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const resolvedProjectId = projectId || resolvedProjects[0]?._id || '';

    reset({
      title: '',
      projectId: resolvedProjectId,
      groupId: defaultGroupId || groupOptions[0]?.id || '',
      assignedTo: '',
      status: defaultStatus,
      dueDate: '',
      priority: '',
      budget: '',
      description: '',
    });
    setAttachments([]);
    setServerError('');
  }, [defaultGroupId, defaultStatus, groupOptions, open, projectId, reset, resolvedProjects]);

  useEffect(() => {
    if (!open) return;

    if (!watchedProjectId && resolvedProjects[0]?._id) {
      setValue('projectId', projectId || resolvedProjects[0]._id, { shouldValidate: true });
    }
  }, [open, projectId, resolvedProjects, setValue, watchedProjectId]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => createTask(data),
    onSuccess: (_response, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', variables.projectId] });
      qc.invalidateQueries({ queryKey: ['calendar-tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['report-summary'] });
      qc.invalidateQueries({ queryKey: ['report-overdue'] });
      setServerError('');
      onClose();
    },
    onError: (err) => {
      setServerError(err.response?.data?.message || 'Unable to create task right now.');
    },
  });

  const onSubmit = (values) => {
    const resolvedProjectId = values.projectId || projectId || resolvedProjects[0]?._id;
    if (!resolvedProjectId) {
      setServerError('Please select a project before creating the task.');
      return;
    }

    setServerError('');

    const payload = {
      projectId: resolvedProjectId,
      groupId: values.groupId || defaultGroupId || groupOptions[0]?.id || '',
      title: values.title.trim(),
      description: values.description?.trim() || '',
      assignedTo: values.assignedTo || null,
      priority: values.priority || undefined,
      status: values.status,
      dueDate: values.dueDate || null,
      tags: [],
      attachments: attachments.map((file) => ({
        dataUrl: file.dataUrl,
        fileName: file.fileName,
      })),
    };

    if (onCreateTask) {
      setSubmittingExternal(true);
      Promise.resolve(onCreateTask(payload))
        .then(() => {
          setServerError('');
          onClose();
        })
        .catch((err) => {
          setServerError(err?.response?.data?.message || err?.message || 'Unable to create task right now.');
        })
        .finally(() => setSubmittingExternal(false));
      return;
    }

    mutate(payload);
  };

  const submitTask = async () => {
    setServerError('');

    const valid = await trigger();
    if (!valid) {
      if (errors.title?.message) {
        setServerError(errors.title.message);
        return;
      }

      if (!effectiveProjectId) {
        setServerError('Please choose a project before creating the task.');
        return;
      }

      setServerError('Please complete the required fields before creating the task.');
      return;
    }

    onSubmit(getValues());
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploadingFiles(true);
    setServerError('');

    try {
      const preparedFiles = [];

      for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file);
        preparedFiles.push({
          fileName: file.name,
          filename: file.name,
          dataUrl,
        });
      }

      setAttachments((current) => [...current, ...preparedFiles]);
    } catch (err) {
      setServerError(err.message || 'Unable to prepare files right now.');
    } finally {
      event.target.value = '';
      setUploadingFiles(false);
    }
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setAttachments((current) => current.filter((_, index) => index !== indexToRemove));
  };

  if (!open) return null;

  const isSubmitting = isPending || submittingExternal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#4f5878]/42 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative max-h-[min(88vh,860px)] w-full max-w-[500px] overflow-y-auto rounded-[12px] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-[16px] font-semibold text-[#1f2a44]">New Task</h2>
          <div className="flex items-center gap-2.5 text-[#1f2a44]">
            <button
              type="button"
              onClick={onClose}
              className="text-[20px] leading-none transition hover:text-[#0073ea]"
              aria-label="Close task dialog"
            >
              x
            </button>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitTask();
          }}
          className="px-5 pb-0 pt-4"
        >
          <input type="hidden" {...register('projectId')} />

          <div className="space-y-2">
            <Row
              label="Task name"
              error={errors.title?.message}
              icon={<IconTile className="bg-[#0073ea]">T</IconTile>}
            >
              <BaseFieldForwarded placeholder="Enter task title" {...register('title')} />
            </Row>

            {groupOptions.length ? (
              <Row
                label="Group"
                icon={<IconTile className="bg-[#52607d]">G</IconTile>}
              >
                <div className="relative">
                  <BaseFieldForwarded as="select" {...register('groupId')}>
                    {groupOptions.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.title}
                      </option>
                    ))}
                  </BaseFieldForwarded>
                  <SelectChevron />
                </div>
              </Row>
            ) : null}

            <Row
              label="Owner"
              icon={<IconTile className="bg-[#66ccff]">U</IconTile>}
            >
              <div className="relative">
                <BaseFieldForwarded as="select" className="pl-11" {...register('assignedTo')}>
                  <option value="">Unassigned</option>
                  {availableMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </BaseFieldForwarded>
                <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                      selectedMember ? 'bg-black text-white' : 'border border-[#d7deed] bg-white text-[#94a0b8]'
                    }`}
                  >
                    {selectedMember ? initials(selectedMember.name) : 'U'}
                  </div>
                </div>
                <SelectChevron />
              </div>
            </Row>

            <Row
              label="Status"
              icon={<IconTile className="bg-[#00c875]">S</IconTile>}
            >
              <div className="relative">
                <BaseFieldForwarded as="select" {...register('status')}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </BaseFieldForwarded>
                <SelectChevron />
              </div>
            </Row>

            <Row
              label="Due date"
              icon={<IconTile className="bg-[#a25ddc]">D</IconTile>}
              error={errors.dueDate?.message}
            >
              <Controller
                control={control}
                name="dueDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Row>

            <Row
              label="Priority"
              icon={<IconTile className="bg-[#00c875]">P</IconTile>}
            >
              <div className="relative">
                <BaseFieldForwarded as="select" {...register('priority')}>
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </BaseFieldForwarded>
                <SelectChevron />
              </div>
            </Row>

            <Row
              label="Budget"
              icon={<IconTile className="bg-[#ffcb00]">1</IconTile>}
            >
              <BaseFieldForwarded placeholder="Optional budget note" {...register('budget')} />
            </Row>

            <Row
              label="Files"
              icon={<IconTile className="bg-[#ff7575]">F</IconTile>}
            >
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center justify-center rounded-[8px] border border-dashed border-[#cfd8ec] bg-[#fafbfe] px-3 py-3 text-[12px] text-[#52607d] transition hover:border-[#9ec5ff] hover:bg-white">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <span>{uploadingFiles ? 'Uploading files...' : 'Choose files to upload'}</span>
                </label>

                {attachments.length ? (
                  <div className="space-y-1">
                    {attachments.map((file, index) => (
                      <div
                        key={`${file.fileName || file.filename}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-[8px] border border-[#e3e8f4] bg-white px-3 py-2 text-[12px] text-[#1f2a44]"
                      >
                        <span className="truncate">{file.filename}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(index)}
                          className="shrink-0 text-[#7f8aa5] transition hover:text-[#d1435b]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#8a96b3]">No files added yet.</p>
                )}
              </div>
            </Row>

            <Row
              label="Notes"
              icon={<IconTile className="bg-[#ffcb00]">T</IconTile>}
            >
              <BaseFieldForwarded
                as="textarea"
                rows={3}
                className="min-h-[78px]"
                placeholder="Add description or notes"
                {...register('description')}
              />
            </Row>
          </div>

          {serverError ? (
            <div className="mt-4 rounded-[8px] border border-[#f1c8d0] bg-[#fff6f8] px-3 py-2 text-[12px] text-[#c23d52]">
              {serverError}
            </div>
          ) : null}

          <div className="mx-[-20px] mt-4 border-t border-[#d8dff3] px-5 py-3">
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-[13px] text-[#1f2a44]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitTask}
                disabled={isSubmitting}
                className="pointer-events-auto relative z-10 rounded-[8px] bg-[#0073ea] px-4 py-1.5 text-[13px] font-medium text-white transition hover:bg-[#0060c0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Creating...' : 'Create task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
