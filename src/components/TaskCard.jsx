'use client';

import { cn, getPriorityColor, getStatusColor, formatDate } from '@/lib/utils';
import { FiCalendar, FiUser, FiMoreVertical } from 'react-icons/fi';
import UserAvatar from './UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

/**
 * Task card component with modern styling
 */
export default function TaskCard({ task, onClick, onMenuClick }) {
  // Check if task is overdue
  const isOverdue = task.status === 'OVERDUE';
  const isPastDue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  // Map priority to badge variant
  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'secondary';
    }
  };

  // Map status to badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'default';
      case 'OVERDUE': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 hover:shadow-card hover:-translate-y-0.5",
        isOverdue 
          ? "border-destructive/50 bg-destructive/5" 
          : "hover:border-primary/30"
      )}
    >
      {/* Overdue Badge */}
      {isOverdue && (
        <div className="mb-2">
          <Badge variant="danger" className="gap-1">
            ⚠️ OVERDUE
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold truncate",
            isOverdue ? "text-destructive" : "text-foreground"
          )}>{task.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
        </div>
        {onMenuClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick(task);
            }}
            className="p-1.5 hover:bg-accent rounded-lg transition-colors ml-2 flex-shrink-0"
          >
            <FiMoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant={getPriorityVariant(task.priority)}>
          {task.priority}
        </Badge>
        <Badge variant={getStatusVariant(task.status)}>
          {task.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {Array.isArray(task.assignedTo) ? (
            <>
              <div className="flex -space-x-2">
                {task.assignedTo.slice(0, 3).map((user) => (
                  <div key={user._id} className="ring-2 ring-background rounded-full">
                    <UserAvatar user={user} size="sm" />
                  </div>
                ))}
              </div>
              <span className="text-foreground/80">
                {task.assignedTo.length === 1
                  ? task.assignedTo[0].name
                  : `${task.assignedTo.length} assignees`}
              </span>
            </>
          ) : (
            <>
              <UserAvatar user={task.assignedTo} size="sm" />
              <span className="text-foreground/80">{task.assignedTo?.name}</span>
            </>
          )}
        </div>
        {task.dueDate && (
          <div className={cn(
            "flex items-center gap-1 font-medium",
            (isOverdue || isPastDue) 
              ? "text-destructive" 
              : "text-muted-foreground"
          )}>
            <FiCalendar className="w-4 h-4" />
            <span>{formatDate(task.dueDate)}</span>
            {(isOverdue || isPastDue) && <span className="text-xs">⚠️</span>}
          </div>
        )}
      </div>
    </Card>
  );
}
