import { cn } from "@/lib/utils"

type StatusType = "success" | "warning" | "danger" | "neutral"

interface StatusBadgeProps {
  status: StatusType
  children: React.ReactNode
  className?: string
}

const statusStyles: Record<StatusType, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
        statusStyles[status],
        className
      )}
    >
      {children}
    </span>
  )
}

export function getStatusColor(
  value: "low" | "medium" | "high" | "normal" | "suspect" | "pathological" | "underdeveloped" | "overgrowth" | null
): StatusType {
  switch (value) {
    case "low":
    case "normal":
      return "success"
    case "medium":
    case "suspect":
      return "warning"
    case "high":
    case "pathological":
    case "underdeveloped":
    case "overgrowth":
      return "danger"
    default:
      return "neutral"
  }
}
