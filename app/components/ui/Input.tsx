import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "~/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full rounded-lg border px-4 py-2.5 text-sm transition",
            "bg-white dark:bg-gray-900",
            "border-gray-300 dark:border-gray-700",
            "text-gray-900 dark:text-gray-100",
            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
            "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:border-indigo-400 dark:focus:ring-indigo-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);