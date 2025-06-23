"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useOffline } from "@/hooks/use-offline"
import {
  Home,
  BookOpen,
  FileText,
  GraduationCap,
  Users,
  FolderOpen,
  Calendar,
  Menu,
  Wifi,
  WifiOff,
  FolderSyncIcon as Sync,
  Settings,
  LogOut,
} from "lucide-react"

interface MobileNavigationProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

export function MobileNavigation({ activeModule, onModuleChange }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const isMobile = useIsMobile()
  const { isOnline, pendingSyncCount } = useOffline()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, roles: ["admin", "instructor", "student"] },
    { id: "courses", label: "Courses", icon: BookOpen, roles: ["admin", "instructor", "student"] },
    { id: "exams", label: "Examinations", icon: FileText, roles: ["admin", "instructor", "student"] },
    { id: "grades", label: "Grades", icon: GraduationCap, roles: ["admin", "instructor", "student"] },
    { id: "attendance", label: "Attendance", icon: Users, roles: ["admin", "instructor", "student"] },
    { id: "resources", label: "Resources", icon: FolderOpen, roles: ["admin", "instructor", "student"] },
    { id: "schedules", label: "Schedules", icon: Calendar, roles: ["admin", "instructor", "student"] },
  ]

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user?.role || ""))

  if (!isMobile) return null

  const handleMenuItemClick = (moduleId: string) => {
    onModuleChange(moduleId)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* User Profile Section */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {user?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user?.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Menu */}
                  <nav className="flex-1 p-4 space-y-2">
                    {filteredMenuItems.map((item) => {
                      const Icon = item.icon
                      const isActive = activeModule === item.id

                      return (
                        <Button
                          key={item.id}
                          variant={isActive ? "default" : "ghost"}
                          className="w-full justify-start h-12"
                          onClick={() => handleMenuItemClick(item.id)}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          <span>{item.label}</span>
                        </Button>
                      )
                    })}
                  </nav>

                  {/* Footer Actions */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <Button variant="ghost" className="w-full justify-start h-12">
                      <Settings className="h-5 w-5 mr-3" />
                      <span>Settings</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={logout}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="font-bold text-lg">UAFC</h1>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-2">
            {/* Sync Status */}
            {pendingSyncCount > 0 && (
              <div className="relative">
                <Sync className="h-5 w-5 text-orange-500" />
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  {pendingSyncCount}
                </Badge>
              </div>
            )}

            {/* Network Status */}
            <div className="flex items-center">
              {isOnline ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
            </div>

            {/* User Avatar */}
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-1 p-2">
          {filteredMenuItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = activeModule === item.id

            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`flex flex-col items-center justify-center h-16 space-y-1 ${
                  isActive ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
                onClick={() => handleMenuItemClick(item.id)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            )
          })}
        </div>
      </div>
    </>
  )
}
