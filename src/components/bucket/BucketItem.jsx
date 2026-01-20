'use client';

import { FiFolder, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useAuthStore from '@/store/authStore';

/**
 * BucketItem - Individual bucket item in the list
 */
export default function BucketItem({ bucket, isSelected, onClick, onEdit, onDelete }) {
  const { hasAdminPrivileges } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onEdit) onEdit(bucket);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete) onDelete(bucket);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer',
        isSelected
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FiFolder className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate">{bucket.name}</span>
      </div>

      {/* Admin Actions */}
      {hasAdminPrivileges && (
        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                isSelected ? 'hover:bg-primary-foreground/20' : 'hover:bg-accent'
              )}
            >
              <FiMoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <FiEdit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <FiTrash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
