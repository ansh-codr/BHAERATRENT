import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Package, Shirt, Smartphone, BookOpen, Watch, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Item } from '../types';

const categories = [
  { name: 'Clothes', icon: Shirt, color: 'from-pink-400 to-rose-500', value: 'clothes' },
  { name: 'Gadgets', icon: Smartphone, color: 'from-cyan-400 to-blue-500', value: 'gadgets' },
  { name: 'Books', icon: BookOpen, color: 'from-amber-400 to-orange-500', value: 'books' },
  { name: 'Accessories', icon: Watch, color: 'from-purple-400 to-indigo-500', value: 'accessories' },
];

export const Home = () => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const itemsRef = collection(db, 'items');
      const q = query(itemsRef, where('available', '==', true), limit(8));
      const snapshot = await getDocs(q);

      const fetchedItems: Item[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Item));

      setItems(fetchedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <motion.section
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-2xl shadow-[0_16px_80px_rgba(15,23,42,0.45)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.4),_transparent_55%)]" aria-hidden="true" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300" />
              Trusted marketplace for Indian campuses
            </div>
            <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl">
              Share smarter. Earn faster. <span className="text-cyan-300">Rent anything</span> across your campus.
            </h2>
            <p className="max-w-2xl text-lg text-gray-300">
              Discover verified listings from students near you or lend your own gear with confidence. BharatRent keeps your rentals organized, secure, and profitable.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/marketplace">
                <Button size="lg" className="shadow-[6px_6px_0_rgba(0,0,0,0.6)]">Explore Marketplace</Button>
              </Link>
              {currentUser ? (
                <Link to={currentUser.role === 'provider' ? '/provider' : '/renter'}>
                  <Button size="lg" variant="secondary" className="shadow-[6px_6px_0_rgba(0,0,0,0.6)]">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/signup">
                  <Button size="lg" variant="ghost" className="border-white/30 px-6 text-white">
                    Join with University Email
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />
            <Card className="relative overflow-hidden border-white/20 bg-black/30 p-6 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-400">Marketplace Snapshot</p>
                  <p className="text-3xl font-black text-white">Top Categories</p>
                </div>
                <TrendingUp className="h-10 w-10 text-cyan-300" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                {categories.map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${category.color} text-black`}>
                      <category.icon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">{category.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </motion.section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-3xl font-black text-white">Browse Categories</h3>
            <p className="text-sm text-gray-400">Tap into curated collections tailored for student life.</p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-black/40 py-3 pl-12 pr-4 text-sm text-white shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Link to={`/marketplace?category=${category.value}`}>
                <Card hover className="cursor-pointer p-6 text-center">
                  <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-black bg-gradient-to-br ${category.color} text-black shadow-[6px_6px_0_rgba(0,0,0,0.7)]`}>
                    <category.icon className="h-9 w-9" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">{category.name}</h4>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-3xl font-black text-white">Featured Listings</h3>
          <Link to="/marketplace" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-white/10">
                <div className="h-full" />
              </Card>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <Link to={`/item/${item.id}`}>
                  <Card hover className="overflow-hidden">
                    <div className="flex h-48 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                      {(() => {
                        const first = item.images?.[0];
                        const src = first ? (typeof first === 'string' ? first : (first as any).thumb || (first as any).url) : null;
                        return src ? (
                          <img src={src} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-16 w-16 text-gray-600" />
                        );
                      })()}
                    </div>
                    <div className="space-y-2 p-4">
                      <h4 className="truncate text-lg font-bold text-white">{item.title}</h4>
                      <p className="line-clamp-2 text-sm text-gray-400">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-cyan-300">₹{item.price}/day</span>
                        <span className="rounded-lg border border-emerald-400/60 bg-emerald-400/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                          Available
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center text-gray-400">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            No items available yet. Be the first to list!
          </Card>
        )}
      </section>
    </div>
  );
};
