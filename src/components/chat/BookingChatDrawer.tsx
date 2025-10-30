import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';
import { Message, Booking } from '../../types';
import { listenToMessages, sendMessage } from '../../services/messages';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface BookingChatDrawerProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  counterpartName?: string;
}

const BookingChatDrawer = ({ booking, isOpen, onClose, currentUserId, counterpartName }: BookingChatDrawerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!booking || !isOpen) {
      setMessages([]);
      return () => undefined;
    }

    const unsubscribe = listenToMessages(booking.id, setMessages);
    return () => unsubscribe();
  }, [booking, isOpen]);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setDraft('');
      setSending(false);
    }
  }, [isOpen]);

  const counterpartId = useMemo(() => {
    if (!booking) return null;
    return booking.renterId === currentUserId ? booking.providerId : booking.renterId;
  }, [booking, currentUserId]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!booking || !draft.trim() || sending || !counterpartId) return;
    setSending(true);

    try {
      await sendMessage({
        bookingId: booking.id,
        senderId: currentUserId,
        receiverId: counterpartId,
        content: draft.trim(),
      });
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && booking ? (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 240, damping: 28 }}
          className="fixed inset-y-0 right-0 z-[95] w-full max-w-md border-l border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-[0_30px_120px_rgba(15,23,42,0.65)]"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Chat</p>
                <h3 className="text-xl font-black text-white">{counterpartName || 'Conversation'}</h3>
                <p className="text-xs text-gray-400">Booking #{booking.id.slice(0, 8)}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="mt-10 flex flex-col items-center gap-3 text-center text-gray-500">
                  <MessageCircle className="h-10 w-10 text-cyan-300" />
                  <p className="font-semibold text-white">Start the conversation</p>
                  <p className="text-sm text-gray-400">Discuss pickup details and timing directly here.</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === currentUserId;
                  return (
                    <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-3xl border px-4 py-2 text-sm shadow-lg ${
                          isOwn
                            ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-50'
                            : 'border-white/10 bg-white/5 text-gray-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
                          {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-white/10 bg-black/25 p-4">
              <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-3 py-2">
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type a message…"
                  className="border-none bg-transparent text-sm shadow-none focus:outline-none focus:ring-0"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="aspect-square rounded-full px-3"
                  disabled={!draft.trim() || sending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default BookingChatDrawer;
