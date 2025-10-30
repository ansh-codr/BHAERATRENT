import { AnimatePresence, motion } from 'framer-motion';
import { X, CalendarClock, CreditCard, Hash, IndianRupee } from 'lucide-react';
import { Transaction } from '../../types';
import { Button } from '../ui/Button';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);

const TransactionDetailsModal = ({ isOpen, transaction, onClose }: TransactionDetailsModalProps) => (
  <AnimatePresence>
    {isOpen && transaction ? (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[92] flex items-center justify-center bg-black/70 backdrop-blur"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/95 via-slate-900/85 to-slate-950/95 p-8 shadow-[0_32px_120px_rgba(15,23,42,0.65)]"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Payment receipt</p>
              <h2 className="mt-2 text-2xl font-black text-white">Transaction details</h2>
              <p className="text-sm text-gray-400">Save this reference for future communication.</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span className="flex items-center gap-2 font-medium text-white">
                  <Hash className="h-4 w-4 text-cyan-300" /> Reference
                </span>
                <span className="font-mono text-sm text-cyan-200">{transaction.referenceId}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span className="flex items-center gap-2 font-medium text-white">
                  <IndianRupee className="h-4 w-4 text-emerald-300" /> Amount
                </span>
                <span className="text-lg font-bold text-emerald-200">₹{transaction.amount}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span className="flex items-center gap-2 font-medium text-white">
                  <CreditCard className="h-4 w-4 text-purple-300" /> Method
                </span>
                <span className="uppercase tracking-wide text-gray-200">{transaction.method}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span className="flex items-center gap-2 font-medium text-white">
                  <CalendarClock className="h-4 w-4 text-blue-300" /> Date
                </span>
                <span>{formatDate(transaction.createdAt)}</span>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span>Booking ID</span>
                <span className="font-mono text-xs text-gray-400">{transaction.bookingId}</span>
              </div>
              {transaction.itemTitle ? (
                <div className="flex items-center justify-between">
                  <span>Item</span>
                  <span className="font-medium text-white">{transaction.itemTitle}</span>
                </div>
              ) : null}
              {transaction.renterName ? (
                <div className="flex items-center justify-between">
                  <span>Renter</span>
                  <span className="font-medium text-white">{transaction.renterName}</span>
                </div>
              ) : null}
              {transaction.providerName ? (
                <div className="flex items-center justify-between">
                  <span>Provider</span>
                  <span className="font-medium text-white">{transaction.providerName}</span>
                </div>
              ) : null}
              <div className="rounded-2xl border border-white/5 bg-white/5 p-3 text-xs text-gray-400">
                Payments processed by BharatRent SimPay. For support, share the reference ID above.
              </div>
            </div>

            <Button variant="ghost" className="w-full justify-center" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export default TransactionDetailsModal;
