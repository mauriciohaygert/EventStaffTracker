import { 
  User, 
  UserCheck, 
  Coffee, 
  UserX,
  TrendingUp,
  TrendingDown,
  LucideIcon
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: "user" | "userCheck" | "coffee" | "userX";
  color: "primary" | "success" | "warning" | "danger";
  trend: string;
  trendLabel: string;
  trendUp: boolean | null; // true = up, false = down, null = neutral
}

const StatCard = ({ title, value, icon, color, trend, trendLabel, trendUp }: StatCardProps) => {
  // Map icon string to Lucide icon component
  const getIcon = () => {
    switch (icon) {
      case "user":
        return <User className="text-primary" />;
      case "userCheck":
        return <UserCheck className="text-success" />;
      case "coffee":
        return <Coffee className="text-warning" />;
      case "userX":
        return <UserX className="text-danger" />;
      default:
        return <User className="text-primary" />;
    }
  };

  // Get color classes
  const getColorClasses = () => {
    switch (color) {
      case "primary":
        return {
          border: "border-primary",
          bg: "bg-blue-100",
        };
      case "success":
        return {
          border: "border-success",
          bg: "bg-green-100",
        };
      case "warning":
        return {
          border: "border-warning",
          bg: "bg-orange-100",
        };
      case "danger":
        return {
          border: "border-danger",
          bg: "bg-red-100",
        };
      default:
        return {
          border: "border-primary",
          bg: "bg-blue-100",
        };
    }
  };

  // Get trend color classes
  const getTrendClasses = () => {
    if (trendUp === true) {
      return "text-success";
    } else if (trendUp === false) {
      return "text-danger";
    }
    return "text-gray-600";
  };

  const colorClasses = getColorClasses();

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${colorClasses.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
        <div className={`${colorClasses.bg} p-3 rounded-full`}>
          {getIcon()}
        </div>
      </div>
      <div className="mt-4 text-sm flex items-center">
        <span className={`font-medium ${getTrendClasses()}`}>
          {trendUp !== null && (
            trendUp ? <TrendingUp className="inline h-3 w-3 mr-1" /> : <TrendingDown className="inline h-3 w-3 mr-1" />
          )}
          {trend}
        </span>
        <span className="text-gray-600 ml-1">{trendLabel}</span>
      </div>
    </div>
  );
};

export default StatCard;
