import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
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
    fetchItems();
  }, [selectedCategory]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const itemsRef = collection(db, 'items');
      let q = query(itemsRef, where('available', '==', true), orderBy('createdAt', 'desc'));

      if (selectedCategory !== 'all') {
        q = query(itemsRef, where('available', '==', true), where('category', '==', selectedCategory), orderBy('createdAt', 'desc'));
      }

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-white mb-2">Marketplace</h1>
          <p className="text-gray-400">Discover items available for rent</p>
        </motion.div>

        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400 font-semibold">Filter by category:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-xl border-2 font-semibold transition-all ${
                  selectedCategory === category
                    ? 'bg-cyan-400 text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-gray-800/50 text-gray-300 border-white/20 hover:border-white/40'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="h-80 animate-pulse"><div className="h-full" /></Card>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/item/${item.id}`}>
                  <Card hover className="overflow-hidden">
                    <div className="h-56 bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                      {(() => {
                        const first = item.images?.[0];
                        const src = first ? (typeof first === 'string' ? first : (first as any).thumb || (first as any).url) : null;
                        return src ? (
                          <img src={src} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-20 h-20 text-gray-600" />
                        );
                      })()}
                    </div>
                    <div className="p-4">
                      <div className="mb-2">
                        <span className="px-2 py-1 bg-purple-400/20 border border-purple-400 rounded-lg text-purple-400 text-xs font-semibold">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-bold text-xl">₹{item.price}/day</span>
                        <span className="px-2 py-1 bg-lime-400/20 border border-lime-400 rounded-lg text-lime-400 text-xs font-semibold">
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
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg mb-2">No items found</p>
            <p className="text-gray-500">Try selecting a different category</p>
          </Card>
        )}
      </div>
    </div>
  );
};
