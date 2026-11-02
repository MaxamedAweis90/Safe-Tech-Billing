import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: string;
  className?: string;
}

/**
 * Base skeleton placeholder rectangle styled with the deep dark theme tokens.
 */
export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = '1rem',
  rounded = 'rounded-md',
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-bg-surface border border-border-subtle/40',
        rounded,
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

/**
 * Multi-line skeleton text generator.
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
  lastLineWidth = '60%',
}) => {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 bg-bg-surface border border-border-subtle/30 rounded animate-pulse"
          style={{ width: i === lines - 1 ? lastLineWidth : '100%' }}
        />
      ))}
    </div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
}

/**
 * Tabular skeleton loader for document and ledger views.
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  cols = 4,
  className = '',
}) => {
  return (
    <div className={cn('w-full space-y-2.5', className)} aria-hidden="true">
      <div className="flex gap-4 p-3 bg-bg-subtle rounded-lg border border-border-strong">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-bg-surface rounded animate-pulse flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-3 border-b border-border-subtle items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3.5 bg-bg-surface/70 rounded animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

