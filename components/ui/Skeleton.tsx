"use client";

interface SkeletonProps {
  className?: string;
}

/** شريط تحميل بسيط */
export function Skeleton({ className = "h-4 w-full" }: SkeletonProps) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

/** بطاقة تحميل */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[#16161A] border border-[rgba(198,145,76,0.09)] p-5 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/** شبكة بطاقات تحميل */
export function SkeletonGrid({ count = 4, cols = 2 }: { count?: number; cols?: number }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** قائمة تحميل */
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

/** تحميل صفحة كاملة */
export function PageSkeleton() {
  return (
    <div dir="rtl" className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonGrid count={4} cols={4} />
      <SkeletonCard />
    </div>
  );
}
