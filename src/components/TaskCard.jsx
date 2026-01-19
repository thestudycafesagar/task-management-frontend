'use client';

import { cn, getPriorityColor, getStatusColor, formatDate } from '@/lib/utils';
import { FiCalendar, FiUser, FiMoreVertical } from 'react-icons/fi';
import UserAvatar from './UserAvatar';

/**
 * Task card component
 */
export default function TaskCard({ task, onClick, onMenuClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
        </div>
        {onMenuClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick(task);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <FiMoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-full border',
            getPriorityColor(task.priority)
          )}
        >
          {task.priority}
        </span>
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-full border',
            getStatusColor(task.status)
          )}
        >
          {task.status.replace('_', ' ')}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          {Array.isArray(task.assignedTo) ? (
            <>
              <div className="flex -space-x-2">
                {task.assignedTo.slice(0, 3).map((user) => (
                  <div key={user._id} className="ring-2 ring-white rounded-full">
                    <UserAvatar user={user} size="sm" />
                  </div>
                ))}
              </div>
              <span>
                {task.assignedTo.length === 1
                  ? task.assignedTo[0].name
                  : `${task.assignedTo.length} assignees`}
              </span>
            </>
          ) : (
            <>
              <UserAvatar user={task.assignedTo} size="sm" />
              <span>{task.assignedTo?.name}</span>
            </>
          )}
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <FiCalendar className="w-4 h-4" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
