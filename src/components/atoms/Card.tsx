import { type FC, type ReactNode } from 'react';
import clsx from 'clsx';

export interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const Card: FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  className,
  hover = false,
  padding = 'md',
  onClick,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        hover && 'hover:shadow-md transition-shadow',
        onClick && 'cursor-pointer',
        paddingClasses[padding],
        className
      )}
      onClick={onClick}
    >
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {action && <div className="ml-4">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
