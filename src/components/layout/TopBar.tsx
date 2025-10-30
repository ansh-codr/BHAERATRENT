import { useState } from 'react';
import { Menu, Bell, ChevronDown, LogOut, Repeat, User, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

interface TopBarProps {
  onToggleSidebar: () => void;
  pageTitle: string;
  showAddButton: boolean;
  onAddItem?: () => void;
}

export const TopBar = ({ onToggleSidebar, pageTitle, showAddButton, onAddItem }: TopBarProps) => {
  const { currentUser, signOut, switchRole } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out failed', err);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const handleSwitchRole = async () => {
    if (!currentUser) return;
    const nextRole = currentUser.role === 'provider' ? 'renter' : 'provider';
    const confirmed = window.confirm(`Switch to ${nextRole === 'provider' ? 'Provider' : 'Renter'} dashboard?`);
    if (!confirmed) return;
    try {
      await switchRole(nextRole);
      navigate(nextRole === 'provider' ? '/provider' : '/renter');
      toast.success(`Now browsing as ${nextRole}.`);
    } catch (err) {
      console.error('Role switch failed', err);
      toast.error('Unable to switch roles right now.');
    }
  };

  const isAuthenticated = Boolean(currentUser);
  const avatarInitial = currentUser?.displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U';

  const handleNotificationClick = async (notificationId: string, metadata?: Record<string, unknown>) => {
    await markAsRead(notificationId);
    setNotificationsOpen(false);

    if (metadata?.bookingId) {
      if (currentUser?.role === 'provider') {
        navigate('/provider?section=bookings');
      } else if (currentUser?.role === 'renter') {
        navigate('/renter');
      }
    }
  };

  const badgeLabel = unreadCount > 9 ? '9+' : unreadCount.toString();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-4 backdrop-blur-2xl">
      <div className="flex items-center gap-4">
        <button
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">BharatRent</p>
          <h1 className="text-2xl font-black text-white">{pageTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {showAddButton ? (
          <Button onClick={onAddItem} className="hidden items-center gap-2 lg:flex">
            Add New Item
          </Button>
        ) : null}

        {isAuthenticated ? (
          <>
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-300 transition hover:text-white ${
                  notificationsOpen ? 'ring-2 ring-cyan-400/60' : ''
                }`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-[5px] text-[10px] font-bold text-white">
                    {badgeLabel}
                  </span>
                ) : null}
              </button>

              <AnimatePresence>
                {notificationsOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-80 max-w-[90vw] rounded-2xl border border-white/10 bg-black/90 p-4 backdrop-blur-2xl shadow-2xl"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Notifications</p>
                        <p className="text-sm font-semibold text-white">Stay in the loop</p>
                      </div>
                      {unreadCount > 0 ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                          onClick={() => markAllAsRead()}
                        >
                          Mark all read
                        </button>
                      ) : null}
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
                          You're all caught up!
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification.id, notification.metadata)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                              notification.read
                                ? 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
                                : 'border-cyan-400/60 bg-cyan-400/10 text-white shadow-[0_12px_45px_rgba(34,211,238,0.2)]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">{notification.title}</p>
                              <span className="text-[10px] uppercase tracking-wide text-gray-400">
                                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-300">{notification.body}</p>
                            <span className="mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-cyan-200">
                              View details <ArrowRight className="h-3 w-3" />
                            </span>
                          </button>
                        ))
                      )}
                    </div>

                    {notifications.length > 6 ? (
                      <p className="mt-2 text-center text-[11px] uppercase tracking-wide text-gray-500">
                        Showing latest 6 updates
                      </p>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left text-white transition hover:bg-white/10"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/80 to-purple-500/80 text-lg font-bold text-black">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Profile avatar'}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    avatarInitial
                  )}
                </div>
                <div className="hidden text-left lg:block">
                  <p className="text-sm font-semibold text-white">
                    {currentUser?.displayName || 'Student'}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-gray-400">{currentUser?.role || 'guest'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              <AnimatePresence>
                {menuOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-60 rounded-2xl border border-white/10 bg-black/90 p-3 backdrop-blur-2xl shadow-2xl"
                  >
                    <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Signed in as</p>
                      <p className="truncate text-sm font-semibold text-white">{currentUser?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <User className="h-4 w-4" /> Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleSwitchRole();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <Repeat className="h-4 w-4" /> Switch Role
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleSignOut();
                      }}
                      className="mt-2 flex w-full items-center gap-3 rounded-xl bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/25 hover:text-rose-100"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="border-white/20 px-4 py-2 text-sm"
              onClick={() => navigate('/login')}
            >
              Log In
            </Button>
            <Button className="px-4 py-2 text-sm" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
