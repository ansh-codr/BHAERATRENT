import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import uploadImage, { validateImageFile } from '../lib/imageUploader';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Package, Plus, DollarSign, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Item, Booking } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import { TutorialCards } from '../components/TutorialCards';
export const ProviderDashboard = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'gadgets' as Item['category'],
    price: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const bookingsSectionRef = useRef<HTMLDivElement | null>(null);
  const [highlightBookings, setHighlightBookings] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('providerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems: Item[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Item));

      setItems(fetchedItems);
      setLoading(false);
    }, (err) => {
      console.error('Realtime items error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    setBookingsLoading(true);
    const bookingsRef = collection(db, 'bookings');
    const bookingsQuery = query(bookingsRef, where('providerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const fetchedBookings: Booking[] = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data(),
        startDate: docItem.data().startDate?.toDate() || new Date(),
        endDate: docItem.data().endDate?.toDate() || new Date(),
        createdAt: docItem.data().createdAt?.toDate() || new Date(),
      } as Booking));

      setBookings(fetchedBookings);
      setBookingsLoading(false);
    }, (err) => {
      console.error('Realtime bookings error:', err);
      setBookingsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const itemLookup = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, Item>);
  }, [items]);

  useEffect(() => {
    const handleOpenModal = () => setShowAddModal(true);
    window.addEventListener('provider:add-item', handleOpenModal);
    return () => window.removeEventListener('provider:add-item', handleOpenModal);
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const handleShowBookings = () => {
      if (bookingsSectionRef.current) {
        bookingsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHighlightBookings(true);
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => setHighlightBookings(false), 2000);
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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSubmitting(true);

    try {
      let imageObjs: { url: string; thumb?: string }[] = [];

      if (imageFiles && imageFiles.length > 0) {
        for (const f of imageFiles) {
          try {
            validateImageFile(f);
          } catch (err) {
            throw err;
          }
        }

        const uploaded: { url: string; thumb?: string }[] = [];
        for (const f of imageFiles) {
          const res = await uploadImage(f, `items`);
          uploaded.push(res);
        }
        imageObjs = uploaded.map(u => ({ url: u.url, thumb: u.thumb }));
      }

      const newItem = {
        providerId: currentUser.uid,
        providerName: currentUser.displayName,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        images: imageObjs.length > 0 ? imageObjs : [],
        available: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'items'), newItem);

      setFormData({ title: '', description: '', category: 'gadgets', price: '' });
      setImageFiles([]);
      setShowAddModal(false);
      toast.success('Item added');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error((error as Error).message || 'Failed to add item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'items', itemId), {
        available: !currentStatus,
        updatedAt: Timestamp.now(),
      });
      // realtime listener will update items automatically
    } catch (error) {
      console.error('Error updating availability:', error);
    }
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
          <h1 className="text-4xl font-black text-white mb-2">Provider Dashboard</h1>
          <p className="text-gray-400">Manage your items and earnings</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Items</p>
                <p className="text-3xl font-black text-white">{items.length}</p>
              </div>
              <Package className="w-12 h-12 text-cyan-400" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Active Listings</p>
                <p className="text-3xl font-black text-white">
                  {items.filter(item => item.available).length}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-lime-400" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Earnings</p>
                <p className="text-3xl font-black text-white">₹0</p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-400" />
            </div>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">My Items</h2>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add New Item
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-64 animate-pulse"><div className="h-full" /></Card>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                    {(() => {
                      const first = item.images?.[0];
                      const src = first
                        ? (typeof first === 'string' ? first : (first as any).thumb || (first as any).url)
                        : null;

                      return src ? (
                        <img src={src} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                      <Package className="w-16 h-16 text-gray-600" />
                      );
                    })()}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-cyan-400 font-bold text-lg">₹{item.price}/day</span>
                      <span className={`px-2 py-1 border rounded-lg text-xs font-semibold ${
                        item.available
                          ? 'bg-lime-400/20 border-lime-400 text-lime-400'
                          : 'bg-red-400/20 border-red-400 text-red-400'
                      }`}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => toggleAvailability(item.id, item.available)}
                    >
                      {item.available ? 'Mark Unavailable' : 'Mark Available'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg mb-4">No items listed yet</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Item
            </Button>
          </Card>
        )}

        <div
          ref={bookingsSectionRef}
          className={`mt-12 rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm transition-shadow duration-300 ${
            highlightBookings ? 'shadow-[0_0_0_3px_rgba(250,204,21,0.45)]' : 'shadow-none'
          }`}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Incoming Bookings</h2>
              <p className="text-gray-300 text-sm">
                Keep tabs on renter requests and tweak availability without leaving the dashboard.
              </p>
            </div>
          </div>

          {bookingsLoading ? (
            <div className="mt-6 space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="h-28 animate-pulse bg-white/10">
                  <div className="h-full w-full rounded-2xl bg-white/10" />
                </Card>
              ))}
            </div>
          ) : bookings.length > 0 ? (
            <div className="mt-6 space-y-4">
              {bookings.map((booking, index) => {
                const item = itemLookup[booking.itemId];
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-lg font-bold text-white">
                              {item?.title || booking.itemTitle || 'Listing unavailable'}
                            </h4>
                            <span className={`px-3 py-1 text-xs font-semibold border rounded-lg ${getStatusColor(booking.status)}`}>
                              {booking.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">
                            Renter: {booking.renterName || booking.renterEmail || 'Pending details'}
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
                              <span className="font-semibold text-cyan-400">₹{booking.totalPrice}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 md:items-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!item}
                            onClick={() => item && toggleAvailability(item.id, item.available)}
                          >
                            {item?.available ? 'Mark Unavailable' : 'Mark Available'}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/item/${booking.itemId}`)}
                          >
                            View Listing
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="mt-6 border-dashed border-white/20 bg-transparent p-10 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-500" />
              <p className="text-gray-400">No bookings yet. Share your listings to get your first rental!</p>
            </Card>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">Add New Item</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAddItem} className="space-y-4">
                  <Input
                    label="Title"
                    placeholder="Item name"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-4 py-3 bg-gray-900/50 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all backdrop-blur-sm"
                      rows={3}
                      placeholder="Describe your item"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Category
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-gray-900/50 border-2 border-white/20 rounded-xl text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all backdrop-blur-sm"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as Item['category'] })}
                    >
                      <option value="clothes">Clothes</option>
                      <option value="gadgets">Gadgets</option>
                      <option value="books">Books</option>
                      <option value="accessories">Accessories</option>
                    </select>
                  </div>

                  <Input
                    label="Price per Day (₹)"
                    type="number"
                    placeholder="50"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="1"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                      className="w-full px-4 py-3 bg-gray-900/50 border-2 border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-400 file:text-black hover:file:bg-cyan-500 transition-all"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1" disabled={submitting}>
                      {submitting ? 'Adding...' : 'Add Item'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAddModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
