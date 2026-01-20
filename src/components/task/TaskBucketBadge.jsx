'use client';

import { FiFolder } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';

/**
 * TaskBucketBadge - Display bucket name on task cards
 */
export default function TaskBucketBadge({ bucket }) {
  if (!bucket) {
    return (
      <Badge variant="secondary" className="text-xs">
        <FiFolder className="w-3 h-3 mr-1" />
        General
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="text-xs">
      <FiFolder className="w-3 h-3 mr-1" />
      {bucket.name}
    </Badge>
  );
}
