import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Package,
  BadgeCheck,
  Coins,
  BarChart3,
  Plus,
  Images,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';

import uploadImage, { validateImageFile } from '../lib/imageUploader';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Item, Booking, Transaction } from '../types';
import { TutorialCards } from '../components/TutorialCards';
import TransactionDetailsModal from '../components/payments/TransactionDetailsModal';
import { listenToTransactionsByProvider } from '../services/transactions';
import BookingChatDrawer from '../components/chat/BookingChatDrawer';
import { createNotification } from '../services/notifications';
import UserProfileModal from '../components/users/UserProfileModal';

const formSteps = [
  {
    title: 'Item details',
    description: 'Give your listing a strong title and description so renters know exactly what they receive.',
  },
  {
    title: 'Upload images',
    description: 'Show the item from different angles. High-quality photos build trust.',
  },
  {
    title: 'Category & pricing',
    description: 'Categorise the item and set a fair daily renting price in rupees.',
  },
  {
    title: 'Availability',
    description: 'Optionally set a date window when the item can be rented out.',
  },
];

const initialFormState = {
  title: '',
  description: '',
  price: '',
  category: 'gadgets' as Item['category'],
  availableFrom: '',
  availableTo: '',
};

const statusBadges: Record<Booking['status'], string> = {
  pending: 'bg-amber-400/15 border-amber-400 text-amber-200',
  confirmed: 'bg-emerald-400/15 border-emerald-400 text-emerald-200',
  active: 'bg-cyan-400/15 border-cyan-400 text-cyan-200',
  completed: 'bg-purple-400/15 border-purple-400 text-purple-200',
  cancelled: 'bg-rose-400/15 border-rose-400 text-rose-200',
};

export const ProviderDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'listings' | 'bookings' | 'analytics'>('listings');
  const [items, setItems] = useState<Item[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileHeading, setProfileHeading] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormState);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const bookingsSectionRef = useRef<HTMLDivElement | null>(null);
  const [highlightBookings, setHighlightBookings] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const itemsRef = collection(db, 'items');
    const itemsQuery = query(itemsRef, where('providerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const fetchedItems: Item[] = snapshot.docs.map((itemDoc) => ({
          id: itemDoc.id,
          ...itemDoc.data(),
          createdAt: itemDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: itemDoc.data().updatedAt?.toDate() || new Date(),
        })) as Item[];
        setItems(fetchedItems);
        setLoadingItems(false);
      },
      (error) => {
        console.error('Realtime items error:', error);
        setLoadingItems(false);
        toast.error('Unable to fetch listings in real time.');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const bookingsRef = collection(db, 'bookings');
    const bookingsQuery = query(bookingsRef, where('providerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const fetchedBookings: Booking[] = snapshot.docs.map((bookingDoc) => {
          const data = bookingDoc.data();
          const toDate = (value: unknown): Date | undefined => {
            if (value instanceof Timestamp) return value.toDate();
            if (value instanceof Date) return value;
            return undefined;
          };

          const normalized = {
            ...(data as Partial<Booking>),
            id: bookingDoc.id,
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
          };

          return normalized as Booking;
        });
        setBookings(fetchedBookings);
        setLoadingBookings(false);
      },
      (error) => {
        console.error('Realtime bookings error:', error);
        setLoadingBookings(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = listenToTransactionsByProvider(currentUser.uid, setTransactions);
    return () => unsubscribe();
  }, [currentUser]);

  const itemLookup = useMemo(
    () =>
      items.reduce<Record<string, Item>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {}),
    [items]
  );

  const transactionLookup = useMemo(
    () =>
      transactions.reduce<Record<string, Transaction>>((acc, transaction) => {
        acc[transaction.bookingId] = transaction;
        return acc;
      }, {}),
    [transactions]
  );

  const totalEarnings = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.status === 'success')
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions]
  );

  const mostRentedItem = useMemo(() => {
    if (bookings.length === 0) return null;
    const map = new Map<string, number>();
    bookings.forEach((booking) => {
      map.set(booking.itemId, (map.get(booking.itemId) || 0) + 1);
    });
    let topItemId: string | null = null;
    let topCount = 0;
    map.forEach((count, id) => {
      if (count > topCount) {
        topCount = count;
        topItemId = id;
      }
    });
    if (!topItemId) return null;
    const item = itemLookup[topItemId];
    if (!item) return null;
    return {
      ...item,
      rentals: topCount,
    };
  }, [bookings, itemLookup]);

  const openProfile = (userId: string, label?: string) => {
    setProfileUserId(userId);
    setProfileHeading(label || 'User profile');
    setProfileOpen(true);
  };

  const closeProfile = () => {
    setProfileOpen(false);
    setProfileHeading('');
    setProfileUserId(null);
  };

  const handleConfirmReturn = async (booking: Booking) => {
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'completed',
        returnRequested: false,
        returnConfirmed: true,
        itemReturned: true,
        returnConfirmedAt: Timestamp.now(),
        chatEnabled: false,
        updatedAt: Timestamp.now(),
      });

      if (booking.itemId) {
        try {
          await updateDoc(doc(db, 'items', booking.itemId), {
            available: true,
            updatedAt: Timestamp.now(),
          });
        } catch (itemError) {
          console.warn('Failed to update item availability after return confirmation:', itemError);
        }
      }

      await createNotification({
        userId: booking.renterId,
        title: 'Return confirmed',
        body: `${booking.providerName || 'Your lender'} confirmed the return of ${booking.itemTitle || 'the item'}.`,
        type: 'booking',
        metadata: {
          bookingId: booking.id,
          providerId: booking.providerId,
          renterId: booking.renterId,
        },
      });

      toast.success('Return confirmed and booking completed.');
    } catch (error) {
      console.error('Failed to confirm item return:', error);
      toast.error('Could not confirm the item return. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setImageFiles([]);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setCurrentStep(0);
    setUploadProgress(0);
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleOpenModal = useCallback(() => {
    setShowAddModal(true);
    setCurrentStep(0);
    setActiveTab('listings');
  }, []);

  useEffect(() => {
    window.addEventListener('provider:add-item', handleOpenModal);
    return () => window.removeEventListener('provider:add-item', handleOpenModal);
  }, [handleOpenModal]);

  useEffect(() => {
    let timer: number | undefined;
    const handleShowBookings = () => {
      setActiveTab('bookings');
      if (bookingsSectionRef.current) {
        bookingsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHighlightBookings(true);
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => setHighlightBookings(false), 2200);
      }
    };

    window.addEventListener('provider:show-bookings', handleShowBookings);
    return () => {
      window.removeEventListener('provider:show-bookings', handleShowBookings);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('section') === 'bookings') {
      window.dispatchEvent(new CustomEvent('provider:show-bookings'));
      navigate('/provider', { replace: true });
    }
  }, [location.search, navigate]);

  const canProceedStep = useMemo(() => {
    switch (currentStep) {
      case 0:
        return Boolean(formData.title.trim()) && Boolean(formData.description.trim());
      case 1:
        return imageFiles.length > 0;
      case 2:
        return Boolean(formData.price) && Number(formData.price) > 0;
      default:
        return true;
    }
  }, [currentStep, formData.description, formData.price, formData.title, imageFiles.length]);

  const handleImageSelection = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);

    const validFiles: File[] = [];
    selected.forEach((file) => {
      try {
        validateImageFile(file);
        validFiles.push(file);
      } catch (error) {
        toast.error((error as Error).message);
      }
    });

    if (validFiles.length === 0) {
      return;
    }

    const mergedFiles = [...imageFiles, ...validFiles].slice(0, 6);
    setImageFiles(mergedFiles);

    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    const previews = mergedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== index));
    setImagePreviews((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed);
      return next;
    });
  };

  const goNext = () => {
    if (!canProceedStep) {
      toast.error('Please complete this step before continuing.');
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, formSteps.length - 1));
  };

  const goPrevious = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    if (!canProceedStep) {
      toast.error('Please finish the required fields.');
      return;
    }

    if (imageFiles.length === 0) {
      setCurrentStep(1);
      toast.error('Add at least one image for the listing.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      const uploaded: { url: string; thumb?: string }[] = [];

      for (let i = 0; i < imageFiles.length; i += 1) {
        const file = imageFiles[i];
        const result = await uploadImage(file, {
          pathPrefix: `items/${currentUser.uid}`,
          onProgress: (progress) => {
            const completed = (i + progress / 100) / imageFiles.length;
            setUploadProgress(Math.round(completed * 100));
          },
        });
        uploaded.push({ url: result.url, thumb: result.thumb });
      }

      const payload = {
        providerId: currentUser.uid,
        providerName: currentUser.displayName || currentUser.email,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: Number(formData.price),
        images: uploaded,
        available: true,
        availableFrom: formData.availableFrom ? Timestamp.fromDate(new Date(formData.availableFrom)) : null,
        availableTo: formData.availableTo ? Timestamp.fromDate(new Date(formData.availableTo)) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'items'), payload);
      toast.success('Item added successfully!');
      closeModal();
    } catch (error) {
      console.error('Failed to add item:', error);
      toast.error('Could not add item. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'items', itemId), {
        available: !currentStatus,
        updatedAt: Timestamp.now(),
      });
      toast.success(`Listing marked as ${!currentStatus ? 'available' : 'unavailable'}.`);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability.');
    }
  };

  const handleBookingStatus = async (bookingId: string, status: Booking['status']) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status,
        updatedAt: Timestamp.now(),
      });
      toast.success(`Booking ${status === 'confirmed' ? 'approved' : 'rejected'}.`);
    } catch (error) {
      console.error('Failed to update booking status:', error);
      toast.error('Unable to update booking status.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Input
              label="Listing title"
              placeholder="Eg. DJI Osmo Action Camera"
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Description</label>
              <textarea
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                rows={4}
                placeholder="Describe the condition, what's included, and any usage guidelines."
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-200">Upload photos</label>
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-black/40 p-6 text-center">
              <Images className="mb-3 h-10 w-10 text-cyan-300" />
              <p className="text-sm text-gray-300">
                Drag & drop or
                <button
                  type="button"
                  className="ml-1 text-cyan-300 underline"
                  onClick={() => document.getElementById('provider-image-input')?.click()}
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-gray-500">PNG or JPG up to 5MB each. Maximum 6 photos.</p>
              <input
                id="provider-image-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleImageSelection(event.target.files)}
                className="hidden"
              />
            </div>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imagePreviews.map((preview, index) => (
                  <div key={preview} className="group relative overflow-hidden rounded-2xl border border-white/10">
                    <img src={preview} alt="Preview" className="h-32 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 hidden rounded-full bg-black/70 p-1 text-xs text-white transition group-hover:flex"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Category</label>
              <select
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                value={formData.category}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, category: event.target.value as Item['category'] }))
                }
              >
                <option value="gadgets">Gadgets</option>
                <option value="books">Books</option>
                <option value="clothes">Clothes</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
            <Input
              label="Price per day (₹)"
              type="number"
              min="1"
              step="1"
              placeholder="Enter price"
              value={formData.price}
              onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
              required
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Available from"
                type="date"
                value={formData.availableFrom}
                onChange={(event) => setFormData((prev) => ({ ...prev, availableFrom: event.target.value }))}
              />
              <Input
                label="Available until"
                type="date"
                min={formData.availableFrom || undefined}
                value={formData.availableTo}
                onChange={(event) => setFormData((prev) => ({ ...prev, availableTo: event.target.value }))}
              />
            </div>
            <p className="text-xs text-gray-400">
              Leave dates empty if the item is available on demand. You can always update availability later.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderListings = () => {
    if (loadingItems) {
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="h-64 animate-pulse bg-white/10">
              <div className="h-full w-full rounded-2xl bg-white/5" />
            </Card>
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center text-gray-400">
          <Package className="h-12 w-12 text-gray-500" />
          <p className="text-lg font-semibold">No listings yet</p>
          <p className="text-sm text-gray-500">Create your first listing to start earning on campus.</p>
          <Button onClick={handleOpenModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden border-white/10 bg-black/40">
              <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
                {(() => {
                  const firstImage = item.images?.[0];
                  const src = firstImage
                    ? typeof firstImage === 'string'
                      ? firstImage
                      : firstImage.thumb || firstImage.url
                    : null;
                  if (!src) {
                    return <Package className="h-12 w-12 text-gray-600" />;
                  }
                  return <img src={src} alt={item.title} className="h-full w-full object-cover" />;
                })()}
              </div>
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="truncate text-lg font-bold text-white">{item.title}</h3>
                  <span
                    className={`rounded-lg border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                      item.available
                        ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200'
                        : 'border-rose-400/60 bg-rose-400/10 text-rose-200'
                    }`}
                  >
                    {item.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-gray-400">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-cyan-300">₹{item.price}/day</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="border-white/15"
                    onClick={() => toggleAvailability(item.id, item.available)}
                  >
                    {item.available ? 'Mark unavailable' : 'Mark available'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderBookings = () => {
    if (loadingBookings) {
      return (
        <div className="spacey-4 space-y-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="h-32 animate-pulse bg-white/10">
              <div className="h-full w-full rounded-2xl bg-white/5" />
            </Card>
          ))}
        </div>
      );
    }

    if (bookings.length === 0) {
      return (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center text-gray-400">
          <Clock className="h-12 w-12 text-gray-500" />
          <p className="text-lg font-semibold">No booking requests yet</p>
          <p className="text-sm text-gray-500">Share your listings link to get your first renter.</p>
        </Card>
      );
    }

    return (
      <div className="space-y-4" ref={bookingsSectionRef}>
        {bookings.map((booking, index) => {
          const item = itemLookup[booking.itemId];
          const transaction = transactionLookup[booking.id];
          const paymentStatus = booking.paymentStatus || 'pending';
          const renterDisplayName = booking.renterName || booking.renterEmail || booking.renterId;
          const canOpenChat = Boolean(booking.chatEnabled) && booking.status !== 'completed';
          const canConfirmReturn = Boolean(booking.returnRequested) && booking.status !== 'completed';
          const openRenterProfile = () => openProfile(booking.renterId, renterDisplayName);
          const openChat = () => {
            if (!currentUser) {
              toast.error('Please log in to chat.');
              return;
            }
            setChatBooking(booking);
            setChatOpen(true);
          };
          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`p-6 transition-shadow ${
                  highlightBookings ? 'shadow-[0_0_0_3px_rgba(250,204,21,0.35)]' : ''
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-white">
                        {item?.title || booking.itemTitle || 'Listing removed'}
                      </h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                          statusBadges[booking.status]
                        }`}
                      >
                        {booking.status}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                          paymentStatus === 'success'
                            ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200'
                            : paymentStatus === 'failed'
                            ? 'border-rose-400 bg-rose-400/15 text-rose-200'
                            : 'border-amber-400 bg-amber-400/15 text-amber-200'
                        }`}
                      >
                        {paymentStatus === 'success'
                          ? 'Payment received'
                          : paymentStatus === 'failed'
                          ? 'Payment failed'
                          : 'Awaiting payment'}
                      </span>
                      {booking.returnRequested ? (
                        <span className="rounded-full border border-amber-400 bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
                          Return requested
                        </span>
                      ) : null}
                      {booking.itemReturned && booking.status === 'completed' ? (
                        <span className="rounded-full border border-emerald-400 bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                          Returned
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-400">
                      Renter:{' '}
                      <button
                        type="button"
                        onClick={openRenterProfile}
                        className="font-semibold text-cyan-300 transition hover:text-cyan-200"
                      >
                        {renterDisplayName}
                      </button>
                    </p>
                    <div className="flex flex-wrap gap-6 text-sm text-gray-300">
                      <div>
                        <span className="block text-xs uppercase tracking-wide text-gray-500">Start</span>
                        <span className="font-semibold text-white">
                          {format(booking.startDate, 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-wide text-gray-500">End</span>
                        <span className="font-semibold text-white">
                          {format(booking.endDate, 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-wide text-gray-500">Total</span>
                        <span className="font-semibold text-cyan-300">₹{booking.totalPrice}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 lg:items-end">
                    {booking.status === 'pending' ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleBookingStatus(booking.id, 'confirmed')}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleBookingStatus(booking.id, 'cancelled')}
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Last updated {format(booking.createdAt, 'MMM dd, yyyy')}
                      </p>
                    )}
                    {item ? (
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/item/${item.id}`)}>
                        View listing
                      </Button>
                    ) : null}
                    {canOpenChat ? (
                      <Button size="sm" variant="ghost" onClick={openChat}>
                        Open chat
                      </Button>
                    ) : null}
                    {canConfirmReturn ? (
                      <Button size="sm" variant="secondary" onClick={() => handleConfirmReturn(booking)}>
                        Confirm return
                      </Button>
                    ) : null}
                    {transaction ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setTransactionModalOpen(true);
                        }}
                      >
                        View transaction
                      </Button>
                    ) : null}
                    {!transaction && paymentStatus !== 'pending' ? (
                      <p className="text-xs text-gray-500">Transaction syncing…</p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-gray-400 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-300" />
                    {paymentStatus === 'success'
                      ? `Paid via ${(booking.paymentMethod || transaction?.method || 'card').toUpperCase()} · Ref ${transaction?.referenceId || booking.transactionId}`
                      : paymentStatus === 'failed'
                      ? 'Renter payment attempt failed. Awaiting new payment.'
                      : 'Waiting for renter to complete payment.'}
                  </div>
                  {transaction?.status === 'success' ? (
                    <div className="flex items-center gap-2 text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Amount received ₹{transaction.amount}
                    </div>
                  ) : null}
                </div>
                {booking.returnRequested ? (
                  <div className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                    <Clock className="h-4 w-4" />
                    Renter marked the item as returned. Confirm once inspected to free the listing.
                  </div>
                ) : null}
                {booking.lastMessagePreview ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-300">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Latest message</p>
                    <p className="mt-1 text-sm text-white/90">{booking.lastMessagePreview}</p>
                  </div>
                ) : null}
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total earnings</p>
            <p className="mt-2 text-3xl font-black text-white">₹{totalEarnings}</p>
          </div>
          <Coins className="h-10 w-10 text-emerald-300" />
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Completed rentals</p>
            <p className="mt-2 text-3xl font-black text-white">
              {bookings.filter((booking) => booking.status === 'completed').length}
            </p>
          </div>
          <BadgeCheck className="h-10 w-10 text-cyan-300" />
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Most rented item</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {mostRentedItem ? mostRentedItem.title : 'Not enough data yet'}
            </p>
            {mostRentedItem ? (
              <p className="text-xs text-gray-500">{mostRentedItem.rentals} total rentals</p>
            ) : null}
          </div>
          <BarChart3 className="h-10 w-10 text-purple-300" />
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-10">
      <TutorialCards />

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-[0_15px_80px_rgba(15,23,42,0.55)]"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Provider hub</p>
            <h1 className="mt-2 text-3xl font-black text-white">Manage your BharatRent listings</h1>
            <p className="mt-2 text-sm text-gray-400">
              Track bookings, earnings, and keep your inventory fresh for students on campus.
            </p>
          </div>
          <Button onClick={handleOpenModal} className="self-start">
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-400">Total listings</p>
              <p className="mt-2 text-3xl font-black text-white">{items.length}</p>
            </div>
            <Package className="h-10 w-10 text-cyan-300" />
          </Card>
          <Card className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-400">Active listings</p>
              <p className="mt-2 text-3xl font-black text-white">{items.filter((item) => item.available).length}</p>
            </div>
            <BadgeCheck className="h-10 w-10 text-emerald-300" />
          </Card>
          <Card className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-400">Pending bookings</p>
              <p className="mt-2 text-3xl font-black text-white">
                {bookings.filter((booking) => booking.status === 'pending').length}
              </p>
            </div>
            <CalendarDays className="h-10 w-10 text-amber-300" />
          </Card>
        </div>
      </motion.section>

      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={activeTab === 'listings' ? 'primary' : 'ghost'}
            className={activeTab === 'listings' ? '' : 'border-white/20 text-gray-300'}
            onClick={() => setActiveTab('listings')}
          >
            Listings
          </Button>
          <Button
            variant={activeTab === 'bookings' ? 'primary' : 'ghost'}
            className={activeTab === 'bookings' ? '' : 'border-white/20 text-gray-300'}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'primary' : 'ghost'}
            className={activeTab === 'analytics' ? '' : 'border-white/20 text-gray-300'}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </Button>
        </div>

        <div className="mt-6">
          {activeTab === 'listings' && renderListings()}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </Card>

      <AnimatePresence>
        {showAddModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-3xl"
              onClick={(event) => event.stopPropagation()}
            >
              <Card className="border-white/10 bg-black/85 p-8 backdrop-blur-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Create listing</p>
                    <h2 className="mt-2 text-2xl font-black text-white">Add a new rental item</h2>
                    <p className="text-sm text-gray-400">{formSteps[currentStep].description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-2xl border border-white/10 bg-white/5 px-2 py-1 text-gray-300 transition hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="mb-6 flex items-center gap-3">
                  {formSteps.map((step, index) => (
                    <div key={step.title} className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                          index === currentStep
                            ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200'
                            : index < currentStep
                            ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200'
                            : 'border-white/15 bg-white/5 text-gray-400'
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index < formSteps.length - 1 ? <div className="h-px w-14 bg-white/15" /> : null}
                    </div>
                  ))}
                </div>

                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  {renderStepContent()}
                </motion.div>

                {uploadProgress > 0 && submitting ? (
                  <div className="mt-4">
                    <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">Uploading images</p>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={closeModal} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button variant="ghost" onClick={goPrevious} disabled={currentStep === 0 || submitting}>
                      Previous
                    </Button>
                  </div>
                  {currentStep === formSteps.length - 1 ? (
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting ? 'Publishing…' : 'Publish listing'}
                    </Button>
                  ) : (
                    <Button onClick={goNext} disabled={!canProceedStep}>
                      Continue
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
        counterpartName={chatBooking?.renterName}
        currentUserName={currentUser?.displayName || currentUser?.email || undefined}
        onOpenCounterpartProfile={(userId) =>
          openProfile(userId, chatBooking?.renterName || chatBooking?.renterEmail || 'Renter')
        }
      />
      <UserProfileModal
        userId={profileUserId}
        isOpen={profileOpen}
        heading={profileHeading || undefined}
        onClose={closeProfile}
      />
    </div>
  );
};

export default ProviderDashboard;
