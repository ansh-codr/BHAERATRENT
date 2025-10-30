import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, Timestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Package, User, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Item } from '../types';
import WishlistToggle from '../components/items/WishlistToggle';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

export const ItemDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    if (!id) return;

    try {
      const itemDoc = await getDoc(doc(db, 'items', id));
      if (itemDoc.exists()) {
        setItem({
          id: itemDoc.id,
          ...itemDoc.data(),
          createdAt: itemDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: itemDoc.data().updatedAt?.toDate() || new Date(),
        } as Item);
      }
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!currentUser || !item || !startDate || !endDate) {
      toast.error('Please fill in all fields');
      return;
    }

    if (currentUser.uid === item.providerId) {
      toast.error('You cannot book your own item');
      return;
    }

    if (!currentUser.role) {
      navigate('/onboarding');
      return;
    }

    setBooking(true);

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = differenceInDays(end, start) + 1;
      const totalPrice = days * item.price;

      if (days <= 0) {
        toast.error('End date must be after start date');
        return;
      }

      const existingSnapshot = await getDocs(
        query(
          collection(db, 'bookings'),
          where('itemId', '==', item.id),
          where('renterId', '==', currentUser.uid)
        )
      );

      const hasActiveBooking = existingSnapshot.docs.some((docSnapshot) => {
        const data = docSnapshot.data();
        const existingEnd = data.endDate?.toDate() || new Date();
        const status = data.status;
        const blockedStatuses = ['pending', 'confirmed', 'active'];
        return blockedStatuses.includes(status) && existingEnd >= new Date();
      });

      if (hasActiveBooking) {
        toast.error('You already have an upcoming booking for this item. Please wait until it ends.');
        return;
      }

      const bookingData = {
        itemId: item.id,
        renterId: currentUser.uid,
        providerId: item.providerId,
        renterName: currentUser.displayName || currentUser.email,
        renterEmail: currentUser.email,
        providerName: item.providerName,
        itemTitle: item.title,
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        totalPrice,
        status: 'pending',
        paymentStatus: 'pending',
        chatEnabled: false,
        itemReceived: false,
        returnRequested: false,
        returnConfirmed: false,
        itemReturned: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      toast.success('Booking created! Complete payment from your dashboard to confirm.');
      navigate('/renter');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const calculateTotal = () => {
    if (!startDate || !endDate || !item) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = differenceInDays(end, start) + 1;
    return days > 0 ? days * item.price : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">Item not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="relative overflow-hidden">
              {(!currentUser || currentUser.uid !== item.providerId) && (
                <div className="absolute right-4 top-4 z-10">
                  <WishlistToggle itemId={item.id} itemTitle={item.title} />
                </div>
              )}
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                {(() => {
                  const first = item.images?.[0];
                  const src = first ? (typeof first === 'string' ? first : (first as any).thumb || (first as any).url) : null;
                  return src ? (
                    <img src={src} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-32 h-32 text-gray-600" />
                  );
                })()}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-8">
              <div className="mb-4">
                <span className="px-3 py-1 bg-purple-400/20 border-2 border-purple-400 rounded-xl text-purple-400 text-sm font-semibold">
                  {item.category}
                </span>
              </div>

              <h1 className="text-4xl font-black text-white mb-4">{item.title}</h1>

              <div className="flex items-center space-x-2 mb-6">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">Listed by {item.providerName}</span>
              </div>

              <p className="text-gray-300 text-lg mb-6">{item.description}</p>

              <div className="mb-8">
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-black text-cyan-400">₹{item.price}</span>
                  <span className="text-gray-400 text-lg">per day</span>
                </div>
              </div>

              {currentUser && currentUser.uid !== item.providerId && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-4 py-3 bg-gray-900/50 border-2 border-white/20 rounded-xl text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-4 py-3 bg-gray-900/50 border-2 border-white/20 rounded-xl text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  {startDate && endDate && calculateTotal() > 0 && (
                    <div className="p-4 bg-cyan-400/10 border-2 border-cyan-400 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Total Cost:</span>
                        <span className="text-2xl font-black text-cyan-400">
                          ₹{calculateTotal()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {differenceInDays(new Date(endDate), new Date(startDate)) + 1} days
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleBooking}
                    disabled={!startDate || !endDate || booking || !item.available}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    {booking ? 'Processing...' : item.available ? 'Book Now' : 'Unavailable'}
                  </Button>
                </div>
              )}

              {!currentUser && (
                <Button className="w-full" onClick={() => navigate('/login')}>
                  Login to Book
                </Button>
              )}

              {currentUser && currentUser.uid === item.providerId && (
                <div className="p-4 bg-purple-400/10 border-2 border-purple-400 rounded-xl text-center">
                  <p className="text-purple-400 font-semibold">This is your listing</p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
