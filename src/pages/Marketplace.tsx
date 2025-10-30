import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card } from '../components/ui/Card';
import { Package, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Item } from '../types';

export const Marketplace = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');

  const categories = ['all', 'clothes', 'gadgets', 'books', 'accessories'];

  useEffect(() => {
    setLoading(true);
    const itemsRef = collection(db, 'items');
    const itemsQuery =
      selectedCategory === 'all'
        ? query(itemsRef, where('available', '==', true))
        : query(itemsRef, where('available', '==', true), where('category', '==', selectedCategory));

    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const fetchedItems: Item[] = snapshot.docs
          .map((docRef) => ({
            id: docRef.id,
            ...docRef.data(),
            createdAt: docRef.data().createdAt?.toDate() || new Date(),
            updatedAt: docRef.data().updatedAt?.toDate() || new Date(),
          } as Item))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setItems(fetchedItems);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching items:', error);
        setItems([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedCategory]);

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-[0_20px_80px_rgba(15,23,42,0.45)]"
      >
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-black text-white">Marketplace</h1>
            <p className="text-sm text-gray-400">Discover verified items available to rent from students near you.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-inner">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-300">
            <Filter className="h-4 w-4 text-cyan-300" />
            Filter by category
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-2xl px-5 py-2 text-sm font-semibold transition-all duration-150 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-black shadow-[5px_5px_0_rgba(0,0,0,0.6)]'
                    : 'border border-white/15 bg-white/5 text-gray-300 hover:border-white/30'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="h-80 animate-pulse bg-white/10">
              <div className="h-full" />
            </Card>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/item/${item.id}`}>
                <Card hover className="overflow-hidden">
                  <div className="flex h-56 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
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
                  <div className="space-y-3 p-4">
                    <span className="inline-flex w-max rounded-lg border border-purple-400/40 bg-purple-400/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-purple-200">
                      {item.category}
                    </span>
                    <h4 className="line-clamp-1 text-lg font-bold text-white">{item.title}</h4>
                    <p className="line-clamp-2 text-sm text-gray-400">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-cyan-300">₹{item.price}/day</span>
                      <span className="rounded-md border border-emerald-400/60 bg-emerald-400/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
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
          <p className="text-lg font-semibold">No items found</p>
          <p className="text-sm text-gray-500">Try selecting a different category to explore more gear.</p>
        </Card>
      )}
    </div>
  );
};
