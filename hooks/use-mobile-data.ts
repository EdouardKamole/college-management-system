"use client"

import { useState, useEffect } from "react"
import { useOffline } from "@/hooks/use-offline"
import { offlineStorage } from "@/lib/offline-storage"
import type { AppData } from "@/hooks/use-data"

export function useMobileData() {
  const [data, setData] = useState<Partial<AppData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const { isOnline, queueForSync } = useOffline()

  // Load data from offline storage on mount
  useEffect(() => {
    loadOfflineData()
  }, [])

  // Sync with server when online
  useEffect(() => {
    if (isOnline) {
      syncWithServer()
    }
  }, [isOnline])

  const loadOfflineData = async () => {
    try {
      setIsLoading(true)

      const [courses, grades, exams, schedules] = await Promise.all([
        offlineStorage.getAll("courses"),
        offlineStorage.getAll("grades"),
        offlineStorage.getAll("exams"),
        offlineStorage.getAll("schedules"),
      ])

      setData({
        courses: courses || [],
        grades: grades || [],
        exams: exams || [],
        schedules: schedules || [],
      })

      // Get last sync time
      const syncData = await offlineStorage.get("userPreferences", "lastSync")
      if (syncData) {
        setLastSync(new Date(syncData.value))
      }
    } catch (error) {
      console.error("Failed to load offline data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const syncWithServer = async () => {
    if (!isOnline) return

    try {
      // In a real app, this would fetch from your API
      const response = await fetch("/api/data")
      if (response.ok) {
        const serverData = await response.json()

        // Update offline storage
        await Promise.all([
          ...serverData.courses.map((course: any) => offlineStorage.store("courses", course)),
          ...serverData.grades.map((grade: any) => offlineStorage.store("grades", grade)),
          ...serverData.exams.map((exam: any) => offlineStorage.store("exams", exam)),
          ...serverData.schedules.map((schedule: any) => offlineStorage.store("schedules", schedule)),
        ])

        // Update state
        setData(serverData)

        // Update last sync time
        const now = new Date()
        await offlineStorage.store("userPreferences", {
          key: "lastSync",
          value: now.toISOString(),
        })
        setLastSync(now)
      }
    } catch (error) {
      console.error("Failed to sync with server:", error)
    }
  }

  const updateData = async (updates: Partial<AppData>) => {
    // Update local state immediately
    setData((prev) => ({ ...prev, ...updates }))

    // Store in offline storage
    try {
      for (const [key, value] of Object.entries(updates)) {
        if (Array.isArray(value)) {
          // Clear existing data and store new data
          await offlineStorage.clear(key)
          await Promise.all(value.map((item) => offlineStorage.store(key, item)))
        }
      }

      // Queue for sync if online, otherwise it will sync when connection is restored
      if (isOnline) {
        await queueForSync({
          url: "/api/data",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
      }
    } catch (error) {
      console.error("Failed to update data:", error)
    }
  }

  const refreshData = async () => {
    if (isOnline) {
      await syncWithServer()
    } else {
      await loadOfflineData()
    }
  }

  return {
    data,
    isLoading,
    lastSync,
    updateData,
    refreshData,
    isOnline,
  }
}
