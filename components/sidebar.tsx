"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import {
  Home,
  BookOpen,
  FileText,
  GraduationCap,
  Users,
  FolderOpen,
  Calendar,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Shield,
} from "lucide-react"

interface SidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, roles: ["admin", "instructor", "student"] },
    { id: "courses", label: "Courses", icon: BookOpen, roles: ["admin", "instructor", "student"] },
    { id: "exams", label: "Examinations", icon: FileText, roles: ["admin", "instructor", "student"] },
    { id: "grades", label: "Grades", icon: GraduationCap, roles: ["admin", "instructor", "student"] },
    { id: "attendance", label: "Attendance", icon: Users, roles: ["admin", "instructor", "student"] },
    { id: "resources", label: "Resources", icon: FolderOpen, roles: ["admin", "instructor", "student"] },
    { id: "schedules", label: "Schedules", icon: Calendar, roles: ["admin", "instructor", "student"] },
    { id: "users", label: "User Management", icon: Shield, roles: ["admin"] },
  ]

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user?.role || ""))

  return (
    <div
      className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } flex flex-col h-screen`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="font-bold text-lg">UAFC</h1>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeModule === item.id

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start ${isCollapsed ? "px-2" : "px-3"}`}
              onClick={() => onModuleChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">{item.label}</span>}
            </Button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <Button
          variant="ghost"
          className={`w-full justify-start ${isCollapsed ? "px-2" : "px-3"}`}
          onClick={toggleTheme}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {!isCollapsed && <span className="ml-2">Toggle Theme</span>}
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start ${isCollapsed ? "px-2" : "px-3"} text-red-600 hover:text-red-700 hover:bg-red-50`}
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  )
}
