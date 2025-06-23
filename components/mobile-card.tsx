"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

interface MobileCardProps {
  title: string
  description?: string
  children?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  onClick?: () => void
  className?: string
}

export function MobileCard({ title, description, children, action, onClick, className = "" }: MobileCardProps) {
  const isClickable = onClick || action

  return (
    <Card
      className={`${className} ${isClickable ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >
      <CardHeader className={`${children ? "pb-3" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium truncate">{title}</CardTitle>
            {description && <CardDescription className="text-sm mt-1 line-clamp-2">{description}</CardDescription>}
          </div>
          {(onClick || action) && <ChevronRight className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />}
        </div>
      </CardHeader>

      {children && <CardContent className="pt-0">{children}</CardContent>}

      {action && !onClick && (
        <CardContent className="pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              action.onClick()
            }}
            className="w-full"
          >
            {action.label}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
