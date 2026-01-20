'use client';

import { FiSearch } from 'react-icons/fi';
import { Input } from '@/components/ui/input';

/**
 * BucketSearch - Search input for filtering buckets
 */
export default function BucketSearch({ value, onChange }) {
  return (
    <div className="relative px-3">
      <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search buckets..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 h-9 text-sm"
      />
    </div>
  );
}
