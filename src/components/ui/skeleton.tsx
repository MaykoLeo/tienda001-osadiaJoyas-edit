import { cn } from "@/lib/utils"

/**
 * Skeleton — Osadía Joyas Design System v1.0
 * 
 * Uses --skeleton-base and --skeleton-shine CSS custom properties
 * defined in globals.css for both light and dark modes:
 *   Light: #E8E4DC shimmer (Champagne Cream tint)
 *   Dark:  #292929 shimmer (Carbon surface tint)
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[hsl(var(--skeleton-base))]", className)}
      {...props}
    />
  )
}

/**
 * ProductCardSkeleton — Used while product grid loads.
 * Matches the exact layout of ProductCard to avoid layout shift.
 */
function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] shadow-lg border border-border h-full">
      {/* Image placeholder */}
      <div className="w-full aspect-square bg-[hsl(var(--skeleton-base))] animate-pulse" />
      {/* Content */}
      <div className="flex-1 flex flex-col gap-3 p-4 bg-card">
        {/* Title */}
        <div className="h-5 w-3/4 rounded bg-[hsl(var(--skeleton-base))] animate-pulse" />
        {/* Description */}
        <div className="h-3 w-full rounded bg-[hsl(var(--skeleton-base))] animate-pulse opacity-70" />
        <div className="h-3 w-1/2 rounded bg-[hsl(var(--skeleton-base))] animate-pulse opacity-50" />
        {/* Price */}
        <div className="h-7 w-1/3 rounded bg-[hsl(var(--skeleton-base))] animate-pulse mt-1" />
      </div>
      {/* CTA Button */}
      <div className="p-4 pt-0 bg-card">
        <div className="h-9 w-full rounded-[4px] bg-[hsl(var(--skeleton-base))] animate-pulse" />
      </div>
    </div>
  );
}

export { Skeleton, ProductCardSkeleton }
