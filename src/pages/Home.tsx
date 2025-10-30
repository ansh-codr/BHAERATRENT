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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-400/8 via-teal-400/6 to-indigo-500/6 backdrop-blur-xl border-b-2 border-white/10"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <Package className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-2xl font-black text-white">BharatRent</h1>
            </div>

            <div className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  <Link to={currentUser.role === 'provider' ? '/provider' : '/renter'}>
                    <Button size="sm">Dashboard</Button>
                  </Link>
                  <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-emerald-400 rounded-full border-2 border-black flex items-center justify-center">
                    <span className="text-black font-bold">
                      {currentUser.displayName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-x-3">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
            Smart Renting for Indian Campuses — <span className="text-amber-400">Share</span>, <span className="text-teal-300">Save</span>, and <span className="text-indigo-400">Earn</span>.
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Connect with fellow students to rent and lend everyday essentials — books, gadgets, bicycles and more.
          </p>

          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border-2 border-white/20 rounded-2xl text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all backdrop-blur-sm"
            />
          </div>
        </motion.div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-cyan-400" />
            Browse Categories
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/marketplace?category=${category.value}`}>
                  <Card hover className="p-6 text-center cursor-pointer">
                    <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${category.color} rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center`}>
                      <category.icon className="w-8 h-8 text-black" />
                    </div>
                    <h4 className="font-bold text-white">{category.name}</h4>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-white mb-6">Featured Items</h3>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="h-64 animate-pulse"><div className="h-full" /></Card>
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/item/${item.id}`}>
                    <Card hover className="overflow-hidden">
                      <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                        {(() => {
                          const first = item.images?.[0];
                          const src = first ? (typeof first === 'string' ? first : (first as any).thumb || (first as any).url) : null;
                          return src ? (
                            <img src={src} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-16 h-16 text-gray-600" />
                          );
                        })()}
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-white mb-1 truncate">{item.title}</h4>
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-400 font-bold text-lg">₹{item.price}/day</span>
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
              <p className="text-gray-400">No items available yet. Be the first to list!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
