import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: "Low" | "Moderate" | "High" | "Critical";
  className?: string;
}

export default function RiskBadge({ level, className }: RiskBadgeProps) {
  const variants = {
    Low: "bg-risk-low/20 text-risk-low hover:bg-risk-low/30 border-risk-low/50",
    Moderate: "bg-risk-moderate/20 text-risk-moderate hover:bg-risk-moderate/30 border-risk-moderate/50",
    High: "bg-risk-high/20 text-risk-high hover:bg-risk-high/30 border-risk-high/50",
    Critical: "bg-risk-critical/20 text-risk-critical hover:bg-risk-critical/30 border-risk-critical/50",
  };

  return (
    <Badge variant="outline" className={cn("font-semibold", variants[level], className)}>
      {level}
    </Badge>
  );
}
