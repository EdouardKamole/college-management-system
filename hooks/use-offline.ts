"use client"

import { useState, useEffect } from "react"
import { networkManager, offlineStorage } from "@/lib/offline-storage"

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  useEffect(() => {
    setIsOnline(networkManager.getStatus())

    const handleNetworkChange = (online: boolean) => {
      setIsOnline(online)
    }

    networkManager.addListener(handleNetworkChange)

    // Check pending sync count
    const checkPendingSync = async () => {
      try {
        const pending = await offlineStorage.getPendingSync()
        setPendingSyncCount(pending.length)
      } catch (error) {
        console.error("Failed to check pending sync:", error)
      }
    }

    checkPendingSync()
    const interval = setInterval(checkPendingSync, 5000) // Check every 5 seconds

    return () => {
      networkManager.removeListener(handleNetworkChange)
      clearInterval(interval)
    }
  }, [])

  const queueForSync = async (data: {
    url: string
    method: string
    headers: Record<string, string>
    body: string
  }) => {
    await networkManager.queueForSync(data)
    setPendingSyncCount((prev) => prev + 1)
  }

  return {
    isOnline,
    pendingSyncCount,
    queueForSync,
  }
}
