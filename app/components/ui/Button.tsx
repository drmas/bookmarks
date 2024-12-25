import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "~/utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "relative flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          {
            "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500":
              variant === "primary",
            "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500":
              variant === "secondary",
            "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500":
              variant === "danger",
          },
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="absolute left-4 h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);