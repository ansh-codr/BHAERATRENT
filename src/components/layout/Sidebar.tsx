import { Fragment } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LucideIcon, PlusCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  showAddItem: boolean;
  onAddItem?: () => void;
}

const baseNavClasses =
  'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-150';

const getNavClasses = (isActive: boolean) =>
  `${baseNavClasses} ${
    isActive
      ? 'bg-white/15 text-white shadow-[0_0_25px_rgba(59,130,246,0.15)]'
      : 'text-gray-400 hover:bg-white/10 hover:text-white'
  }`;

export const Sidebar = ({ isOpen, onClose, navItems, showAddItem, onAddItem }: SidebarProps) => {
  const location = useLocation();

  const renderNav = () => (
    <nav className="flex flex-1 flex-col gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              getNavClasses(
                isActive || location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
            {item.badge ? (
              <span className="ml-auto rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-300">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        );
      })}
    </nav>
  );

  const renderAddButton = () => {
    if (!showAddItem) return null;
    return (
      <Button
        onClick={onAddItem}
        className="mt-6 w-full justify-center bg-gradient-to-r from-emerald-400 to-cyan-400 text-black"
      >
        <PlusCircle className="mr-2 h-5 w-5" />
        Add New Item
      </Button>
    );
  };

  return (
    <Fragment>
      <aside className="relative hidden w-72 flex-col border-r border-white/10 bg-black/40 px-4 py-6 backdrop-blur-2xl lg:flex">
        <div className="flex items-center gap-3 px-2 pb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-[6px_6px_0_rgba(0,0,0,0.8)]">
            <span className="text-xl font-black text-black">BR</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400">BharatRent</p>
            <p className="text-lg font-extrabold text-white">Campus Rentals</p>
          </div>
        </div>

        {renderNav()}
        {renderAddButton()}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-black/80 px-4 py-6 backdrop-blur-3xl shadow-2xl lg:hidden"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3 px-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-[6px_6px_0_rgba(0,0,0,0.8)]">
                  <span className="text-xl font-black text-black">BR</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400">BharatRent</p>
                  <p className="text-lg font-extrabold text-white">Campus Rentals</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {renderNav()}
            {renderAddButton()}
          </motion.aside>
        )}
      </AnimatePresence>

      {isOpen ? (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      ) : null}
    </Fragment>
  );
};

export default Sidebar;
