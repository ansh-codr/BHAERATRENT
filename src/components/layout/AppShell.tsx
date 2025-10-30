import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, NavItem } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, ShoppingBag, MessageCircle, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const pageTitleMap: Record<string, string> = {
  '/': 'Home',
  '/marketplace': 'Marketplace',
  '/provider': 'Provider Dashboard',
  '/renter': 'Renter Dashboard',
  '/messages': 'Messages',
  '/profile': 'Profile',
};

export const AppShell = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const dashboardPath = useMemo(() => {
    if (!currentUser) return '/';
    return currentUser.role === 'provider' ? '/provider' : '/renter';
  }, [currentUser]);

  const navItems: NavItem[] = useMemo(() => {
    return [
      {
        label: 'Dashboard',
        to: dashboardPath,
        icon: LayoutDashboard,
      },
      {
        label: 'Marketplace',
        to: '/marketplace',
        icon: ShoppingBag,
      },
      {
        label: 'Messages',
        to: '/messages',
        icon: MessageCircle,
      },
      {
        label: 'Profile',
        to: '/profile',
        icon: UserCircle,
      },
    ];
  }, [dashboardPath]);

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith('/provider')) return 'Provider Dashboard';
    if (location.pathname.startsWith('/renter')) return 'Renter Dashboard';
    if (location.pathname.startsWith('/marketplace')) return 'Marketplace';
    if (location.pathname.startsWith('/messages')) return 'Messages';
    if (location.pathname.startsWith('/profile')) return 'Profile';
    if (location.pathname.startsWith('/item')) return 'Listing Details';
    return pageTitleMap[location.pathname] || 'Welcome';
  }, [location.pathname]);

  const emitAddItemEvent = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('provider:add-item'));
    if (!location.pathname.startsWith('/provider')) {
      navigate('/provider');
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen bg-[#05070f] text-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={navItems}
        showAddItem={currentUser?.role === 'provider'}
        onAddItem={emitAddItemEvent}
      />

      <div className="flex min-h-screen flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_45%),_radial-gradient(circle_at_bottom,_rgba(6,182,212,0.12),_transparent_50%),_#05070f]">
        <TopBar
          onToggleSidebar={() => setSidebarOpen(true)}
          pageTitle={pageTitle}
          showAddButton={currentUser?.role === 'provider'}
          onAddItem={emitAddItemEvent}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
          <motion.div
            key={location.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mx-auto w-full max-w-7xl"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
