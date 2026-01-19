'use client';

/**
 * Button loader component
 */
export default function ButtonLoader({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
