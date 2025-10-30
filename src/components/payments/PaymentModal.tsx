import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, Smartphone, Wallet, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Booking, PaymentMethod } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { usePaymentSimulator } from '../../hooks/usePaymentSimulator';

const paymentMethods: Array<{
  id: PaymentMethod;
  label: string;
  description: string;
  icon: typeof CreditCard;
}> = [
  {
    id: 'card',
    label: 'Card',
    description: 'Visa, Mastercard, Rupay, Maestro',
    icon: CreditCard,
  },
  {
    id: 'upi',
    label: 'UPI',
    description: 'PhonePe, Google Pay, BHIM, etc.',
    icon: Smartphone,
  },
  {
    id: 'wallet',
    label: 'Wallet',
    description: 'Paytm, Amazon Pay, Freecharge',
    icon: Wallet,
  },
];

interface PaymentModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  amount?: number;
}

const PaymentModal = ({ isOpen, booking, amount, onClose }: PaymentModalProps) => {
  const { status, processPayment, referenceId, error, reset } = usePaymentSimulator();
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
  });
  const [upiId, setUpiId] = useState('');
  const [walletProvider, setWalletProvider] = useState('Paytm');

  const payableAmount = useMemo(() => amount ?? booking?.totalPrice ?? 0, [amount, booking]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setMethod('card');
      setCardDetails({ name: '', number: '', expiry: '', cvv: '' });
      setUpiId('');
      setWalletProvider('Paytm');
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (status === 'success') {
      toast.success('Payment Successful — Booking Confirmed ✅');
      const timeout = window.setTimeout(() => {
        onClose();
        reset();
      }, 1200);
      return () => window.clearTimeout(timeout);
    }

    if (status === 'failed' && error) {
      toast.error(error);
    }

    return undefined;
  }, [status, error, onClose, reset]);

  if (!isOpen || !booking) {
    return null;
  }

  const isCardValid =
    cardDetails.number.replace(/\s+/g, '').length >= 16 &&
    cardDetails.name.trim().length > 2 &&
    /^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry) &&
    /^\d{3,4}$/.test(cardDetails.cvv);

  const isUpiValid = /.+@.+/.test(upiId);
  const canPay =
    status !== 'processing' &&
    payableAmount > 0 &&
    booking.paymentStatus !== 'success' &&
    ((method === 'card' && isCardValid) || (method === 'upi' && isUpiValid) || method === 'wallet');

  const handlePay = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!booking) return;

    await processPayment({ booking, amount: payableAmount, method });
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/70 to-slate-950/90 shadow-[0_40px_140px_rgba(15,23,42,0.65)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,255,0.18),_transparent_55%)]" />
            <button
              type="button"
              onClick={() => {
                onClose();
                reset();
              }}
              className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10 grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Secure Payment</p>
                  <h2 className="mt-2 text-3xl font-black text-white">Pay for your booking</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    Complete the payment to confirm your rental request instantly.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Choose payment method</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {paymentMethods.map(({ id, label, description, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setMethod(id)}
                        className={`group rounded-2xl border px-4 py-3 text-left transition-all ${
                          method === id
                            ? 'border-cyan-400/80 bg-cyan-400/15 shadow-[0_10px_40px_rgba(34,211,238,0.25)]'
                            : 'border-white/10 bg-white/5 hover:border-cyan-300/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                              method === id
                                ? 'border-cyan-300 bg-cyan-300/25 text-cyan-50'
                                : 'border-white/10 bg-black/40 text-cyan-200'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="font-semibold text-white">{label}</p>
                            <p className="text-xs text-gray-400">{description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handlePay} className="space-y-5">
                  {method === 'card' ? (
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        label="Card holder name"
                        placeholder="Eg. Aman Kumar"
                        value={cardDetails.name}
                        onChange={(event) => setCardDetails((prev) => ({ ...prev, name: event.target.value }))}
                        required
                      />
                      <Input
                        label="Card number"
                        placeholder="4242 4242 4242 4242"
                        value={cardDetails.number}
                        onChange={(event) =>
                          setCardDetails((prev) => ({ ...prev, number: event.target.value.replace(/[^0-9\s]/g, '') }))
                        }
                        maxLength={19}
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Expiry"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(event) => setCardDetails((prev) => ({ ...prev, expiry: event.target.value }))}
                          required
                        />
                        <Input
                          label="CVV"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(event) =>
                            setCardDetails((prev) => ({ ...prev, cvv: event.target.value.replace(/[^0-9]/g, '') }))
                          }
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  ) : null}

                  {method === 'upi' ? (
                    <Input
                      label="UPI ID"
                      placeholder="example@upi"
                      value={upiId}
                      onChange={(event) => setUpiId(event.target.value)}
                      required
                    />
                  ) : null}

                  {method === 'wallet' ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200">Wallet provider</label>
                      <select
                        className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                        value={walletProvider}
                        onChange={(event) => setWalletProvider(event.target.value)}
                      >
                        <option>Paytm</option>
                        <option>Amazon Pay</option>
                        <option>Mobikwik</option>
                        <option>Freecharge</option>
                      </select>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                    <ShieldCheck className="h-5 w-5 text-cyan-300" />
                    Transactions are encrypted and safeguarded by BharatRent Secure Pay.
                  </div>

                  <Button type="submit" disabled={!canPay} className="w-full justify-center">
                    {status === 'processing' ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Processing...
                      </span>
                    ) : (
                      `Pay securely ₹${payableAmount}`
                    )}
                  </Button>

                  {status === 'failed' ? (
                    <p className="text-center text-sm text-rose-300">{error}</p>
                  ) : null}
                </form>
              </div>

              <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.32em] text-gray-500">Summary</p>
                  <h3 className="text-2xl font-black text-white">Booking details</h3>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-gray-300">
                    <div className="flex items-center justify-between">
                      <span>Item</span>
                      <span className="font-semibold text-white">{booking.itemTitle || 'Rental item'}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Duration</span>
                      <span className="font-semibold text-white">
                        {Math.max(1, Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)))}{' '}
                        day(s)
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Total amount</span>
                      <span className="text-lg font-bold text-cyan-300">₹{payableAmount}</span>
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: status === 'success' ? 1 : 0.5, scale: status === 'success' ? 1 : 0.95 }}
                  className={`relative overflow-hidden rounded-3xl border px-5 py-6 ${
                    status === 'success'
                      ? 'border-emerald-400/60 bg-gradient-to-br from-emerald-500/20 via-cyan-400/10 to-transparent'
                      : 'border-white/10 bg-black/20'
                  }`}
                >
                  {status === 'success' ? (
                    <>
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-400/20 blur-xl" />
                      <div className="absolute -bottom-10 left-6 h-20 w-20 rounded-full bg-cyan-400/20 blur-xl" />
                      <div className="relative flex flex-col items-center gap-3 text-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-300" />
                        <p className="text-lg font-semibold text-white">Payment successful</p>
                        <p className="text-sm text-gray-300">
                          Reference <span className="font-mono text-emerald-200">{referenceId}</span>
                        </p>
                        <div className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-left text-gray-300">
                          <p className="uppercase tracking-wide text-gray-500">Receipt</p>
                          <p className="mt-1 font-semibold text-white">Paid ₹{payableAmount} via {method.toUpperCase()}</p>
                          <p className="text-[11px] text-gray-400">{new Date().toLocaleString()}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-sm text-gray-400">
                      Secure payments powered by BharatRent SimPay.
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default PaymentModal;
