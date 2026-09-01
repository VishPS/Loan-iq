import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export default function MetricCard({ title, value, description, trend, icon, className }: MetricCardProps) {
  return (
    <Card className={cn("bg-slate-900/50 border-slate-800 backdrop-blur-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground h-4 w-4">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-slate-100">{value}</div>
        {(description || trend) && (
          <div className="flex items-center mt-1 text-xs">
            {trend && (
              <span className={cn("mr-2 font-medium flex items-center", trend.isPositive ? "text-risk-low" : "text-risk-high")}>
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </span>
            )}
            {description && <span className="text-muted-foreground">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
