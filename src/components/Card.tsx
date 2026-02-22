import React from 'react';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const Card = ({ title, subtitle, icon, children, className, ...props }: CardProps) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-2xl border border-black/5 shadow-sm p-6 overflow-hidden relative",
        className
      )} 
      {...props}
    >
      {(title || icon) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">{title}</h3>}
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
          {icon && <div className="text-zinc-400">{icon}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
