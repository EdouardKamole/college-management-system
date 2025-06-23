"use client"

import { useOffline } from "@/hooks/use-offline"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { WifiOff, FolderSyncIcon as Sync, CheckCircle } from "lucide-react"

export function OfflineIndicator() {
  const { isOnline, pendingSyncCount } = useOffline()

  if (isOnline && pendingSyncCount === 0) return null

  return (
    <div className="fixed top-16 left-4 right-4 z-40 md:top-4 md:left-auto md:right-4 md:w-80">
      {!isOnline && (
        <Alert className="mb-2 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            You're offline. Changes will sync when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {pendingSyncCount > 0 && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <Sync className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between text-blue-800 dark:text-blue-200">
            <span>
              {pendingSyncCount} item{pendingSyncCount > 1 ? "s" : ""} pending sync
            </span>
            <Badge variant="secondary" className="ml-2">
              {pendingSyncCount}
            </Badge>
          </AlertDescription>
        </Alert>
      )}

      {isOnline && pendingSyncCount === 0 && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            All data synced successfully
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
