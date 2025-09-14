import { DynamicIcon } from "@/components/DynamicIcon";
import { cn } from "@/lib/utils";

export default function ThemeBadge({
  icon,
  iconClassName,
  text,
}: {
  icon: string;
  iconClassName?: string;
  text: string;
}) {
  return (
    <div className="inline-flex items-center rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-indigo-200 dark:border-gray-700 overflow-hidden mb-6">
      <div className="flex items-center px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30">
        <DynamicIcon
          name={icon}
          className={cn(
            "h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-2",
            iconClassName
          )}
        />
        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
          {text}
        </span>
      </div>
    </div>
  );
}
