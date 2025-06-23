"use client"

import type { ReactNode } from "react"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { Loader2, ArrowDown } from "lucide-react"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  threshold?: number
}

export function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const { containerRef, isRefreshing, pullDistance, isPulling } = usePullToRefresh({
    onRefresh,
    threshold,
  })

  const progress = Math.min(pullDistance / threshold, 1)
  const shouldTrigger = pullDistance > threshold

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out z-10"
        style={{
          height: Math.min(pullDistance, 100),
          opacity: isPulling ? 1 : 0,
          transform: `translateY(${isPulling ? 0 : -100}px)`,
        }}
      >
        <div className="flex flex-col items-center space-y-2 text-gray-600 dark:text-gray-400">
          {isRefreshing ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Refreshing...</span>
            </>
          ) : (
            <>
              <div className={`transition-transform duration-200 ${shouldTrigger ? "rotate-180" : "rotate-0"}`}>
                <ArrowDown className="h-6 w-6" />
              </div>
              <span className="text-sm">{shouldTrigger ? "Release to refresh" : "Pull to refresh"}</span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${isPulling ? Math.min(pullDistance, 100) : 0}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
