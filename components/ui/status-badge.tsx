import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, Scale, Archive, Trash2, CircleDot } from "lucide-react"

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig = {
  stored: {
    label: "Stored",
    icon: Archive,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
  },
  in_analysis: {
    label: "In Analysis",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
  },
  in_court: {
    label: "In Court",
    icon: Scale,
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
  },
  released: {
    label: "Released",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
  },
  disposed: {
    label: "Disposed",
    icon: Trash2,
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
  },
  destroyed: {
    label: "Destroyed",
    icon: Trash2,
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
  }
} as const

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    icon: CircleDot,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
  }
  
  const Icon = config.icon
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
      config.className,
      className
    )}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
