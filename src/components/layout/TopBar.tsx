import { useState } from 'react';
import { Menu, Bell, ChevronDown, LogOut, Repeat, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface TopBarProps {
  onToggleSidebar: () => void;
  pageTitle: string;
  showAddButton: boolean;
  onAddItem?: () => void;
}

export const TopBar = ({ onToggleSidebar, pageTitle, showAddButton, onAddItem }: TopBarProps) => {
  const { currentUser, signOut, switchRole } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

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

  const avatarInitial = currentUser?.displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U';

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

        <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-300 transition hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

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
      </div>
    </header>
  );
};

export default TopBar;
