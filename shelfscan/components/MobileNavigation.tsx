'use client';

/**
 * Mobile Navigation Component
 * 
 * Provides a mobile-friendly navigation experience with:
 * - Hamburger menu for mobile devices
 * - Full-screen overlay navigation
 * - Touch-friendly buttons and spacing
 * - Smooth animations and transitions
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Home, 
  Bell, 
  Activity,
  Settings,
  BarChart3,
  MapPin,
  Package
} from 'lucide-react';
import { useAlerts } from '../lib/context/AppContext';

// ============================================================================
// NAVIGATION ITEM TYPE
// ============================================================================

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
  description?: string;
}

// ============================================================================
// MOBILE NAVIGATION HOOK
// ============================================================================

const useMobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { alerts } = useAlerts();
  
  // Track mount state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Only calculate urgent alerts after mount to prevent hydration mismatch
  const urgentAlerts = isMounted ? alerts.filter(alert => !alert.acknowledged) : [];
  
  const navItems: NavItem[] = [
    {
      href: '/',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview of all shelves'
    },
    {
      href: '/alerts',
      label: 'Alerts',
      icon: Bell,
      badge: urgentAlerts.length,
      description: 'Inventory alerts and notifications'
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Performance metrics and trends'
    },
    {
      href: '/locations',
      label: 'Locations',
      icon: MapPin,
      description: 'Store layout and shelf mapping'
    },
    {
      href: '/inventory',
      label: 'Inventory',
      icon: Package,
      description: 'Product catalog and stock levels'
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      description: 'App configuration and preferences'
    }
  ];
  
  return {
    isOpen,
    setIsOpen,
    navItems,
    currentPath: pathname,
    isMounted
  };
};

// ============================================================================
// MOBILE MENU OVERLAY COMPONENT
// ============================================================================

interface MobileMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  currentPath: string;
}

const MobileMenuOverlay: React.FC<MobileMenuOverlayProps> = ({
  isOpen,
  onClose,
  navItems,
  currentPath
}) => {
  if (!isOpen) return null;
  
  return (
    <>
      {/* BACKDROP */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* MENU PANEL */}
      <div className="fixed inset-x-0 top-0 bottom-0 z-50 bg-white transform transition-transform duration-300 ease-in-out">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <Activity size={24} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">ShelfScan AI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="Close navigation menu"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* NAVIGATION ITEMS */}
        <nav className="flex-1 overflow-y-auto py-6">
          <div className="px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = currentPath === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl transition-all duration-200 touch-manipulation
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent hover:border-gray-200'
                    }
                    active:scale-95 active:bg-gray-100
                  `}
                >
                  <div className="relative">
                    <Icon size={24} className={isActive ? 'text-blue-600' : 'text-gray-500'} />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-medium animate-pulse">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                  
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
        
        {/* FOOTER */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="text-center">
            <div className="text-sm text-gray-600">ShelfScan AI</div>
            <div className="text-xs text-gray-500 mt-1">Real-time inventory management</div>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// MOBILE NAVIGATION BUTTON COMPONENT
// ============================================================================

interface MobileNavButtonProps {
  isOpen: boolean;
  onClick: () => void;
  badgeCount?: number;
  isMounted?: boolean;
}

const MobileNavButton: React.FC<MobileNavButtonProps> = ({
  isOpen,
  onClick,
  badgeCount = 0,
  isMounted = true
}) => {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 touch-manipulation md:hidden active:scale-95"
      aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={isOpen}
    >
      <div className="relative">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
        
        {/* NOTIFICATION BADGE - Only show after mount to prevent hydration mismatch */}
        {isMounted && badgeCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium animate-pulse">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </div>
    </button>
  );
};

// ============================================================================
// MAIN MOBILE NAVIGATION COMPONENT
// ============================================================================

export const MobileNavigation: React.FC = () => {
  const { isOpen, setIsOpen, navItems, currentPath, isMounted } = useMobileNavigation();
  const { alerts } = useAlerts();
  
  // Only calculate urgent alerts after mount to prevent hydration mismatch
  const urgentAlerts = isMounted ? alerts.filter(alert => !alert.acknowledged) : [];
  
  return (
    <>
      <MobileNavButton 
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        badgeCount={urgentAlerts.length}
        isMounted={isMounted}
      />
      
      <MobileMenuOverlay
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        navItems={navItems}
        currentPath={currentPath}
      />
    </>
  );
};

// ============================================================================
// DESKTOP NAVIGATION COMPONENT
// ============================================================================

export const DesktopNavigation: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { alerts } = useAlerts();
  
  // Track mount state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Only calculate urgent alerts after mount to prevent hydration mismatch
  const urgentAlerts = isMounted ? alerts.filter(alert => !alert.acknowledged) : [];
  
  return (
    <nav className="hidden md:flex items-center gap-6">
      <Link
        href="/"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          pathname === '/' 
            ? 'bg-blue-50 text-blue-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <Home size={18} />
        <span className="text-sm font-medium">Dashboard</span>
      </Link>
      
      <Link
        href="/alerts"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors relative ${
          pathname === '/alerts' 
            ? 'bg-blue-50 text-blue-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <Bell size={18} />
        <span className="text-sm font-medium">Alerts</span>
        {/* Only show badge after mount to prevent hydration mismatch */}
        {isMounted && urgentAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium">
            {urgentAlerts.length}
          </span>
        )}
      </Link>
    </nav>
  );
};

export default MobileNavigation; 