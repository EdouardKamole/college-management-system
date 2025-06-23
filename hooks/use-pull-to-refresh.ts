"use client"

import { useState, useEffect, useRef } from "react"

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  resistance?: number
}

export function usePullToRefresh({ onRefresh, threshold = 80, resistance = 2.5 }: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)

  const startY = useRef(0)
  const currentY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let isAtTop = true

    const handleScroll = () => {
      isAtTop = container.scrollTop === 0
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (!isAtTop || isRefreshing) return

      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || !isAtTop || isRefreshing) return

      currentY.current = e.touches[0].clientY
      const distance = Math.max(0, (currentY.current - startY.current) / resistance)

      if (distance > 0) {
        e.preventDefault()
        setPullDistance(distance)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return

      setIsPulling(false)

      if (pullDistance > threshold) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }

      setPullDistance(0)
    }

    container.addEventListener("scroll", handleScroll)
    container.addEventListener("touchstart", handleTouchStart, { passive: false })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("scroll", handleScroll)
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isPulling, pullDistance, threshold, resistance, onRefresh, isRefreshing])

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    isPulling,
  }
}
