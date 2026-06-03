import React from 'react';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800/80 ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
      <Skeleton className="h-6 w-1/4" />
      <div className="h-64 flex items-end justify-between space-x-2 pt-4">
        <Skeleton className="h-[20%] w-full rounded-t-lg" />
        <Skeleton className="h-[40%] w-full rounded-t-lg" />
        <Skeleton className="h-[60%] w-full rounded-t-lg" />
        <Skeleton className="h-[30%] w-full rounded-t-lg" />
        <Skeleton className="h-[80%] w-full rounded-t-lg" />
        <Skeleton className="h-[50%] w-full rounded-t-lg" />
      </div>
    </div>
  );
}

export function SkeletonList({ items = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center space-x-3 w-2/3">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}
