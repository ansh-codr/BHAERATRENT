import { MessageSquare } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';

export const Messages = () => {
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
            <p className="text-sm text-gray-400">Real-time chat between providers and renters is coming soon.</p>
          </div>
        </div>
      </motion.div>

      <Card className="p-10 text-center text-gray-400">
        <p className="text-lg">Hang tight! The in-app chat experience will land in the next milestone.</p>
      </Card>
    </div>
  );
};

export default Messages;
