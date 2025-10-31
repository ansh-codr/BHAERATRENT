import { useEffect, useMemo, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Calendar, Clock, CheckCircle, Wallet, CreditCard, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { TutorialCards } from '../components/TutorialCards';
import { Booking, Transaction, Activity } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import PaymentModal from '../components/payments/PaymentModal';
import TransactionDetailsModal from '../components/payments/TransactionDetailsModal';
import { listenToTransactionsByRenter } from '../services/transactions';
import { listenToActivities } from '../services/activities';
import { createNotification } from '../services/notifications';
import { Button } from '../components/ui/Button';
import BookingChatDrawer from '../components/chat/BookingChatDrawer';
import toast from 'react-hot-toast';
import UserProfileModal from '../components/users/UserProfileModal';

export const RenterDashboard = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'payments'>('orders');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileHeading, setProfileHeading] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('renterId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedBookings: Booking[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          const toDate = (value: unknown): Date | undefined => {
            if (value instanceof Timestamp) return value.toDate();
            if (value instanceof Date) return value;
            return undefined;
          };

          const normalized = {
            ...(data as Partial<Booking>),
            id: docSnapshot.id,
            startDate: toDate(data.startDate) || new Date(),
            endDate: toDate(data.endDate) || new Date(),
            createdAt: toDate(data.createdAt) || new Date(),
            updatedAt: toDate(data.updatedAt) || undefined,
            paymentStatus: data.paymentStatus || 'pending',
            paymentMethod: data.paymentMethod,
            transactionId: data.transactionId,
            chatEnabled: Boolean(data.chatEnabled),
            itemReceived: Boolean(data.itemReceived),
            returnRequested: Boolean(data.returnRequested),
            returnConfirmed: Boolean(data.returnConfirmed),
            itemReturned: Boolean(data.itemReturned),
            returnRequestedAt: toDate(data.returnRequestedAt),
            returnConfirmedAt: toDate(data.returnConfirmedAt),
            lastMessageAt: toDate(data.lastMessageAt),
            lastMessagePreview: data.lastMessagePreview,
            lastMessageSenderId: data.lastMessageSenderId,
            lastMessageAtMs: typeof data.lastMessageAtMs === 'number' ? data.lastMessageAtMs : undefined,
          };

          return normalized as Booking;
        });

        setBookings(fetchedBookings);
        setLoading(false);
      },
      (err) => {
        console.error('Realtime bookings error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setLoadingPayments(false);
      return;
    }

    setLoadingPayments(true);
    const unsubscribe = listenToTransactionsByRenter(currentUser.uid, (entries) => {
      setTransactions(entries);
      setLoadingPayments(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setActivities([]);
      setActivitiesLoading(false);
      return;
    }

    setActivitiesLoading(true);
    const unsubscribe = listenToActivities(currentUser.uid, (entries) => {
      setActivities(entries);
      setActivitiesLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-lime-400/20 border-lime-400 text-lime-400';
      case 'active':
        return 'bg-cyan-400/20 border-cyan-400 text-cyan-400';
      case 'completed':
        return 'bg-purple-400/20 border-purple-400 text-purple-400';
      case 'cancelled':
        return 'bg-red-400/20 border-red-400 text-red-400';
      default:
        return 'bg-gray-400/20 border-gray-400 text-gray-400';
    }
  };

  const getPaymentBadge = (status: NonNullable<Booking['paymentStatus']>) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-400/15 border-emerald-400 text-emerald-200';
      case 'failed':
        return 'bg-rose-400/15 border-rose-400 text-rose-200';
      default:
        return 'bg-amber-400/15 border-amber-400 text-amber-200';
    }
  };

  const totals = useMemo(() => {
    const totalSpent = transactions
      .filter((transaction) => transaction.status === 'success')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      totalSpent,
    };
  }, [transactions]);

  const bookingLookup = useMemo(
    () =>
      bookings.reduce<Record<string, Booking>>((acc, booking) => {
        acc[booking.id] = booking;
        return acc;
      }, {}),
    [bookings]
  );

  const openPaymentModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setPaymentModalOpen(true);
  };

  const openTransactionModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionModalOpen(true);
  };

  const openProfileModal = (userId: string, label?: string) => {
    setProfileUserId(userId);
    setProfileHeading(label || 'User profile');
    setProfileOpen(true);
  };

  const closeProfileModal = () => {
    setProfileOpen(false);
    setProfileUserId(null);
    setProfileHeading('');
  };

  const openChat = (booking: Booking) => {
    if (!currentUser) {
      toast.error('Please log in to chat.');
      return;
    }
    setChatBooking(booking);
    setChatOpen(true);
  };

  const handleConfirmReceived = async (booking: Booking) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'active',
        itemReceived: true,
        updatedAt: Timestamp.now(),
      });
      await createNotification({
        userId: booking.providerId,
        title: 'Item handed over',
        body: `${booking.renterName || 'Your renter'} confirmed they received ${booking.itemTitle || 'the item'}.`,
        type: 'booking',
        metadata: {
          bookingId: booking.id,
          renterId: booking.renterId,
        },
      });
      toast.success('Great! Enjoy your rental.');
    } catch (error) {
      console.error('Failed to confirm receipt:', error);
      toast.error('Could not update booking. Please retry.');
    }
  };

  const handleReturnRequest = async (booking: Booking) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        returnRequested: true,
        returnRequestedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await createNotification({
        userId: booking.providerId,
        title: 'Return requested',
        body: `${booking.renterName || 'Your renter'} marked ${booking.itemTitle || 'the item'} as ready for pickup.`,
        type: 'booking',
        metadata: {
          bookingId: booking.id,
          renterId: booking.renterId,
          providerId: booking.providerId,
        },
      });

      toast.success('Return requested. The provider has been notified.');
    } catch (error) {
      console.error('Failed to request return:', error);
      toast.error('Could not request the return. Please try again.');
    }
  };

  const renderOrders = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse">
              <div className="h-full" />
            </Card>
          ))}
        </div>
      );
    }

    if (bookings.length === 0) {
      return (
        <Card className="p-12 text-center space-y-3">
          <Calendar className="w-16 h-16 mx-auto text-gray-600" />
          <p className="text-gray-400 text-lg font-semibold">No bookings yet</p>
          <p className="text-gray-500">Start exploring items to rent!</p>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {bookings.map((booking, index) => {
          const providerDisplayName = booking.providerName || booking.providerId;
          const canOpenChat = booking.chatEnabled !== false && !['cancelled', 'completed'].includes(booking.status);
          const canRequestReturn =
            booking.paymentStatus === 'success' && Boolean(booking.itemReceived) && !booking.returnRequested;
          const providerProfile = () => openProfileModal(booking.providerId, providerDisplayName);

          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-bold text-white text-lg">Booking #{booking.id.slice(0, 8)}</h4>
                      <span className={`px-3 py-1 border rounded-lg text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status.toUpperCase()}
                      </span>
                      <span
                        className={`px-3 py-1 border rounded-lg text-xs font-semibold ${getPaymentBadge(
                          booking.paymentStatus || 'pending'
                        )}`}
                      >
                        {booking.paymentStatus === 'success'
                          ? 'PAID'
                          : booking.paymentStatus === 'failed'
                          ? 'PAYMENT FAILED'
                          : 'PAYMENT PENDING'}
                      </span>
                      {booking.returnRequested ? (
                        <span className="px-3 py-1 border rounded-lg text-xs font-semibold border-amber-400/60 bg-amber-400/15 text-amber-100">
                          RETURN REQUESTED
                        </span>
                      ) : null}
                      {booking.itemReturned && booking.status === 'completed' ? (
                        <span className="px-3 py-1 border rounded-lg text-xs font-semibold border-emerald-400/60 bg-emerald-400/15 text-emerald-200">
                          RETURNED
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-400">
                      Provider:{' '}
                      <button
                        type="button"
                        onClick={providerProfile}
                        className="font-semibold text-cyan-300 transition hover:text-cyan-200"
                      >
                        {providerDisplayName}
                      </button>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Start Date</p>
                        <p className="text-white font-semibold">
                          {format(booking.startDate, 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">End Date</p>
                        <p className="text-white font-semibold">
                          {format(booking.endDate, 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Total Price</p>
                        <p className="text-cyan-400 font-bold text-lg">₹{booking.totalPrice}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <CreditCard className="h-4 w-4 text-cyan-300" />
                    {booking.paymentStatus === 'success'
                      ? `Paid via ${(booking.paymentMethod || 'card').toUpperCase()}`
                      : booking.paymentStatus === 'failed'
                      ? 'Last attempt failed. Please retry payment.'
                      : 'Complete payment to confirm this booking.'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {booking.paymentStatus !== 'success' ? (
                      <Button
                        size="sm"
                        onClick={() => openPaymentModal(booking)}
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 text-black shadow-[4px_4px_0_rgba(0,0,0,0.55)]"
                      >
                        Pay Now
                      </Button>
                    ) : null}
                    {canOpenChat ? (
                      <Button size="sm" variant="ghost" onClick={() => openChat(booking)}>
                        Open Chat
                      </Button>
                    ) : null}
                    {booking.transactionId ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const transaction = transactions.find(
                            (entry) => entry.id === booking.transactionId || entry.bookingId === booking.id
                          );
                          if (transaction) {
                            openTransactionModal(transaction);
                          } else {
                            openTransactionModal({
                              id: 'temporary',
                              bookingId: booking.id,
                              amount: booking.totalPrice,
                              renterId: booking.renterId,
                              providerId: booking.providerId,
                              method: booking.paymentMethod || 'card',
                              status: 'pending',
                              referenceId: booking.transactionId || 'N/A',
                              createdAt: booking.createdAt,
                              itemTitle: booking.itemTitle,
                              renterName: booking.renterName,
                              providerName: booking.providerName,
                            });
                          }
                        }}
                      >
                        View Transaction
                      </Button>
                    ) : null}
                    {booking.paymentStatus === 'success' && !booking.itemReceived ? (
                      <Button size="sm" variant="secondary" onClick={() => handleConfirmReceived(booking)}>
                        Confirm Item Received
                      </Button>
                    ) : null}
                    {canRequestReturn ? (
                      <Button size="sm" variant="secondary" onClick={() => handleReturnRequest(booking)}>
                        Request Return
                      </Button>
                    ) : null}
                  </div>
                </div>

                {booking.returnRequested ? (
                  <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-100">
                    Waiting for {booking.providerName || 'the provider'} to confirm the return.
                  </div>
                ) : null}

                {booking.lastMessagePreview ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-gray-200">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Latest message</p>
                    <p className="mt-1 text-white/90">{booking.lastMessagePreview}</p>
                  </div>
                ) : null}
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderPaymentsSection = () => {
    if (loadingPayments) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="h-28 animate-pulse">
              <div className="h-full" />
            </Card>
          ))}
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <Card className="p-12 text-center space-y-3 text-gray-400">
          <Wallet className="mx-auto h-16 w-16 text-gray-600" />
          <p className="text-lg font-semibold">No payments recorded yet</p>
          <p className="text-sm text-gray-500">Successful transactions will appear here once processed.</p>
        </Card>
      );
    }

    const badgeClasses = (status: Transaction['status']) => {
      switch (status) {
        case 'success':
          return 'border-emerald-400/60 bg-emerald-400/15 text-emerald-200';
        case 'failed':
          return 'border-rose-400/60 bg-rose-400/15 text-rose-200';
        default:
          return 'border-amber-400/60 bg-amber-400/15 text-amber-200';
      }
    };

    return (
      <div className="space-y-4">
        {transactions.map((transaction, index) => {
          const booking = bookingLookup[transaction.bookingId];
          const itemTitle = booking?.itemTitle || booking?.itemId || 'Listing';
          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="flex flex-col gap-4 border-white/10 bg-black/40 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-white">₹{transaction.amount}</h3>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClasses(transaction.status)}`}>
                      {transaction.status === 'success'
                        ? 'Payment completed'
                        : transaction.status === 'failed'
                        ? 'Payment failed'
                        : 'Payment pending'}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-300">
                      {transaction.method.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {booking?.providerName || 'Provider'} · {itemTitle}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {format(transaction.createdAt, 'MMM dd, yyyy • HH:mm')}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 text-sm text-gray-400 md:items-end">
                  <span className="font-semibold text-white">Reference: {transaction.referenceId}</span>
                  <span>Booking ID: {transaction.bookingId.slice(0, 8)}</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <TutorialCards />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-white mb-2">Renter Dashboard</h1>
          <p className="text-gray-400">Track your rentals and bookings</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Bookings</p>
                <p className="text-3xl font-black text-white">{bookings.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-cyan-400" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Active</p>
                <p className="text-3xl font-black text-white">
                  {bookings.filter(b => b.status === 'active').length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-lime-400" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Completed</p>
                <p className="text-3xl font-black text-white">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-purple-400" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Spent</p>
                <p className="text-3xl font-black text-white">₹{totals.totalSpent}</p>
              </div>
              <Wallet className="w-12 h-12 text-pink-400" />
            </div>
          </Card>
        </div>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold text-white">Orders & Payments</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === 'orders' ? 'primary' : 'ghost'}
              className={activeTab === 'orders' ? '' : 'border-white/20 text-gray-300'}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </Button>
            <Button
              variant={activeTab === 'payments' ? 'primary' : 'ghost'}
              className={activeTab === 'payments' ? '' : 'border-white/20 text-gray-300'}
              onClick={() => setActiveTab('payments')}
            >
              Payments
            </Button>
          </div>
        </div>

        {activeTab === 'orders' ? renderOrders() : renderPaymentsSection()}

        <div className="mt-12">
          <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Recent activity</p>
                <h2 className="mt-2 text-xl font-bold text-white">Your latest actions</h2>
                <p className="text-sm text-gray-400">Bookings you create and updates you trigger will appear here.</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan-300 sm:flex">
                <History className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {activitiesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
                  ))}
                </div>
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan-300">
                      <History className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{activity.title}</p>
                      <p className="text-sm text-gray-400">{activity.description}</p>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-gray-400">
                  No activity logged yet. Create a booking or complete a rental to populate this feed.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        booking={selectedBooking}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedBooking(null);
        }}
      />

      <TransactionDetailsModal
        isOpen={transactionModalOpen}
        transaction={selectedTransaction}
        onClose={() => {
          setTransactionModalOpen(false);
          setSelectedTransaction(null);
        }}
      />

      <BookingChatDrawer
        isOpen={chatOpen}
        booking={chatBooking}
        onClose={() => {
          setChatOpen(false);
          setChatBooking(null);
        }}
        currentUserId={currentUser?.uid || ''}
        counterpartName={chatBooking?.providerName}
        currentUserName={currentUser?.displayName || currentUser?.email || undefined}
        onOpenCounterpartProfile={(userId) =>
          openProfileModal(userId, chatBooking?.providerName || 'Provider')
        }
      />
      <UserProfileModal
        userId={profileUserId}
        isOpen={profileOpen}
        heading={profileHeading || undefined}
        onClose={closeProfileModal}
      />
    </div>
  );
};
