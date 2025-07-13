'use client';

/**
 * NotificationBadge Component
 * 
 * Displays notification count badges throughout the UI.
 * Features:
 * - Different sizes and variants
 * - Accessible with screen reader support
 * - Consistent styling with design system
 */

import React from 'react';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  variant?: 'default' | 'urgent' | 'warning' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  variant = 'default',
  size = 'md',
  className = '',
  ariaLabel
}) => {
  // Don't render if count is 0
  if (count === 0) {
    return null;
  }

  // Format count display
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'urgent':
        return 'bg-red-500 text-white border-red-600';
      case 'warning':
        return 'bg-amber-500 text-white border-amber-600';
      case 'success':
        return 'bg-green-500 text-white border-green-600';
      default:
        return 'bg-primary text-primary-foreground border-primary';
    }
  };

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs min-w-[1rem] h-4 px-1';
      case 'lg':
        return 'text-sm min-w-[1.5rem] h-6 px-2';
      default:
        return 'text-xs min-w-[1.25rem] h-5 px-1.5';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        rounded-full border font-medium
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${className}
      `}
      aria-label={ariaLabel || `${count} notification${count !== 1 ? 's' : ''}`}
      role="status"
    >
      {displayCount}
    </span>
  );
};

export default NotificationBadge; 