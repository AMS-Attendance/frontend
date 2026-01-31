import { type FC, type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline";
  color?: "default" | "success" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loadingText?: string;
}

const Button: FC<ButtonProps> = ({
  variant = "solid",
  color = "default",
  size = "md",
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  loadingText,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    "border rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:cursor-not-allowed";

  const variantStyles: Record<string, string> = {
    solid: "text-white",
    outline: "bg-white",
  };
  type ButtonVariant = NonNullable<ButtonProps["variant"]>;
  type ButtonColor = NonNullable<ButtonProps["color"]>;

  const colors: Record<ButtonColor, Record<ButtonVariant, string>> = {
    default: {
      solid:
        "bg-black text-white hover:bg-white hover:text-black hover:border hover:border-black transition",
      outline:
        "text-black border-black hover:bg-black hover:text-white hover:border-black transition",
    },
    success: {
      solid: "bg-green-600 hover:bg-green-700 text-white border-green-700",
      outline:
        "text-green-700 border-green-700 hover:bg-green-700 hover:text-white",
    },
    danger: {
      solid: "bg-red-600 hover:bg-red-700 text-white border-red-700",
      outline: "text-red-700 border-red-700 hover:bg-red-700 hover:text-white",
    },
    warning: {
      solid: "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600",
      outline:
        "text-yellow-600 border-yellow-600 hover:bg-yellow-600 hover:text-white",
    },
  };

  const sizeStyles = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-5 py-3 text-lg",
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        colors[color][variant],
        sizeStyles[size],
        fullWidth && "w-full",
        loading && "opacity-80 cursor-not-allowed",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Left Icon */}
      {!loading && leftIcon && <span className="flex">{leftIcon}</span>}

      {/* Button Text */}
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="animate-spin w-4 h-4" />
          {loadingText || "Loading..."}
        </span>
      ) : (
        children
      )}

      {/* Right Icon */}
      {!loading && rightIcon && <span className="flex">{rightIcon}</span>}
    </button>
  );
};

export { Button };
