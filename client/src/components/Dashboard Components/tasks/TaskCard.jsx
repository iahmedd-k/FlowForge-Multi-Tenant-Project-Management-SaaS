import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '../ui/Badge';
import AssigneeIcon from '../ui/AssigneeIcon';

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task._id });

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.4 : 1,
  };

  const isOverdue = task.dueDate &&
    task.status !== 'done' &&
    new Date() > new Date(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer
                 hover:border-brand-300 hover:shadow-sm transition-all duration-150
                 select-none"
    >
      <p className="text-sm font-medium text-gray-900 leading-snug mb-2">
        {task.title}
      </p>

      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag) => (
            <span key={tag}
              className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <Badge value={task.priority} />
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {isOverdue ? '⚠ ' : ''}
              {new Date(task.dueDate).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
            </span>
          )}
          <AssigneeIcon
            assigned={Boolean(task.assignedTo?.name)}
            size="sm"
            title={task.assignedTo?.name || 'Unassigned'}
          />
        </div>
      </div>

      {task.comments?.length > 0 && (
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
          <span>💬</span>
          <span>{task.comments.length}</span>
        </div>
      )}
    </div>
  );
}
