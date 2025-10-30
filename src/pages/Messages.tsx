import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import {
  MessageSquare,
  MessageCircle,
  Loader2,
  ArrowRight,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { Booking } from '../types';
import BookingChatDrawer from '../components/chat/BookingChatDrawer';
import UserProfileModal from '../components/users/UserProfileModal';

type SnapshotHandler = QueryDocumentSnapshot<DocumentData>;

const normalizeBooking = (docSnapshot: SnapshotHandler): Booking => {
  const data = docSnapshot.data();
  const toDate = (value: unknown): Date | undefined => {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    return undefined;
  };

  const normalized: Partial<Booking> = {
    ...data,
    id: docSnapshot.id,
    startDate: toDate(data.startDate) || new Date(),
    endDate: toDate(data.endDate) || new Date(),
  createdAt: toDate(data.createdAt) || new Date(),
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
};

const sortThreads = (threads: Booking[]) => {
  return [...threads].sort((a, b) => {
    const aTime = (a.lastMessageAt ? a.lastMessageAt.getTime() : undefined) ?? a.lastMessageAtMs ?? a.createdAt.getTime();
    const bTime = (b.lastMessageAt ? b.lastMessageAt.getTime() : undefined) ?? b.lastMessageAtMs ?? b.createdAt.getTime();
    return bTime - aTime;
  });
};

export const Messages = () => {
  const { currentUser } = useAuth();
  const [threads, setThreads] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileHeading, setProfileHeading] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setThreads([]);
      setLoading(false);
      return () => undefined;
    }

    let providerBookings: Booking[] = [];
    let renterBookings: Booking[] = [];
    let unsubscribers: Array<() => void> = [];
    let isMounted = true;

    const mergeAndSet = () => {
      if (!isMounted) return;
      const map = new Map<string, Booking>();
      [...providerBookings, ...renterBookings].forEach((booking) => {
        map.set(booking.id, booking);
      });

      const filtered = Array.from(map.values()).filter((booking) => booking.chatEnabled || booking.lastMessagePreview);
      setThreads(sortThreads(filtered));
      setLoading(false);
    };

    setLoading(true);

    const providerQuery = query(collection(db, 'bookings'), where('providerId', '==', currentUser.uid));
    const renterQuery = query(collection(db, 'bookings'), where('renterId', '==', currentUser.uid));

    const unsubProvider = onSnapshot(
      providerQuery,
      (snapshot) => {
        providerBookings = snapshot.docs.map((docSnapshot) => normalizeBooking(docSnapshot));
        mergeAndSet();
      },
      (error) => {
        console.error('Messages provider thread error:', error);
        providerBookings = [];
        mergeAndSet();
      }
    );

    const unsubRenter = onSnapshot(
      renterQuery,
      (snapshot) => {
        renterBookings = snapshot.docs.map((docSnapshot) => normalizeBooking(docSnapshot));
        mergeAndSet();
      },
      (error) => {
        console.error('Messages renter thread error:', error);
        renterBookings = [];
        mergeAndSet();
      }
    );

    unsubscribers = [unsubProvider, unsubRenter];

    return () => {
      isMounted = false;
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [currentUser]);

  const conversations = useMemo(() => threads, [threads]);

  const handleOpenChat = (booking: Booking) => {
    setSelectedBooking(booking);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setSelectedBooking(null);
  };

  const handleOpenProfile = (userId: string, heading?: string) => {
    setProfileUserId(userId);
    setProfileHeading(heading || 'Profile');
    setProfileOpen(true);
  };

  const handleCloseProfile = () => {
    setProfileOpen(false);
    setProfileUserId(null);
    setProfileHeading('');
  };

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-purple-500 text-black shadow-[6px_6px_0_rgba(0,0,0,0.7)]">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white">Messages</h2>
              <p className="text-sm text-gray-400">Sign in to view your conversations.</p>
            </div>
          </div>
        </motion.div>

        <Card className="p-10 text-center text-gray-400">
          <p className="text-lg">Please log in to start messaging with providers and renters.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-purple-500 text-black shadow-[6px_6px_0_rgba(0,0,0,0.7)]">
            <MessageSquare className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">Messages</h2>
            <p className="text-sm text-gray-400">All your renter and provider conversations in one place.</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <Card className="flex items-center justify-center gap-3 p-10 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading conversations…
        </Card>
      ) : conversations.length === 0 ? (
        <Card className="p-10 text-center text-gray-400">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/5">
            <MessageCircle className="h-7 w-7 text-cyan-300" />
          </div>
          <p className="text-lg font-semibold text-white">No conversations yet</p>
          <p className="mt-2 text-sm text-gray-400">
            Once you book an item and payments clear, your chat history will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((booking) => {
            const isProvider = booking.providerId === currentUser.uid;
            const counterpartId = isProvider ? booking.renterId : booking.providerId;
            const counterpartName = isProvider
              ? booking.renterName || booking.renterEmail || 'Renter'
              : booking.providerName || 'Provider';
            const referenceItem = booking.itemTitle || 'Listing';
            const lastActivity = booking.lastMessageAt || (booking.lastMessageAtMs ? new Date(booking.lastMessageAtMs) : booking.createdAt);
            const lastPreview = booking.lastMessagePreview || 'Start chatting to coordinate handoff details.';

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="flex flex-col gap-4 border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-lg font-bold text-white">
                      <UserIcon className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenProfile(counterpartId, counterpartName)}
                          className="text-left text-base font-semibold text-white transition hover:text-cyan-200"
                        >
                          {counterpartName}
                        </button>
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-gray-400">
                          {referenceItem}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {lastActivity ? formatDistanceToNow(lastActivity, { addSuffix: true }) : 'moments ago'}
                        </span>
                      </div>
                      <p className="max-w-2xl text-sm text-gray-300">{lastPreview}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 sm:w-auto sm:min-w-[180px]">
                    <Button onClick={() => handleOpenChat(booking)} className="inline-flex items-center justify-center gap-2">
                      Continue chat <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-sm"
                      onClick={() => handleOpenProfile(counterpartId, counterpartName)}
                    >
                      View profile
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedBooking && chatOpen ? (
          <BookingChatDrawer
            isOpen={chatOpen}
            booking={selectedBooking}
            onClose={handleCloseChat}
            currentUserId={currentUser.uid}
            counterpartName={
              selectedBooking.providerId === currentUser.uid
                ? selectedBooking.renterName || selectedBooking.renterEmail || 'Renter'
                : selectedBooking.providerName || 'Provider'
            }
            currentUserName={currentUser.displayName || currentUser.email || undefined}
            onOpenCounterpartProfile={(userId) =>
              handleOpenProfile(
                userId,
                selectedBooking.providerId === currentUser.uid
                  ? selectedBooking.renterName || selectedBooking.renterEmail || 'Renter'
                  : selectedBooking.providerName || 'Provider'
              )
            }
          />
        ) : null}
      </AnimatePresence>

      <UserProfileModal
        userId={profileUserId}
        isOpen={profileOpen}
        heading={profileHeading || undefined}
        onClose={handleCloseProfile}
      />
    </div>
  );
};

export default Messages;
