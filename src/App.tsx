/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Home, 
  Search, 
  MessageCircle, 
  Users, 
  User, 
  PlusSquare, 
  Heart, 
  Share2, 
  MoreHorizontal,
  Send,
  Camera,
  Layers,
  Hexagon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeSocialPulse } from './services/geminiService';

// --- Types ---
type Tab = 'feed' | 'chat' | 'communities' | 'profile';

interface SocialPost {
  id: string;
  user: {
    name: string;
    avatar: string;
    handle: string;
  };
  image: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

interface ChatGroup {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  messages: ChatMessage[];
}

const CIRCLE_DIGEST = {
  summary: "The hexagonal lattice is vibrating. Alex Rivera just initialized a new spatial post in the Design Circle, and the Nexus Pulse indicates a 220% surge in creative synchronization today."
};

const MOCK_POSTS: SocialPost[] = [
  {
    id: '1',
    user: { name: 'Alex Rivera', handle: '@arivera', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    image: 'https://picsum.photos/seed/hex1/800/800',
    caption: 'Exploring the new hexagonal dimensions 🧊 #Hexagram #Future',
    likes: 1240,
    comments: 42,
    timestamp: '2h ago',
    isLiked: false
  },
  {
    id: '2',
    user: { name: 'Sarah Chen', handle: '@schen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    image: 'https://picsum.photos/seed/hex2/800/800',
    caption: 'The speed of this messenger is insane! 🚀',
    likes: 890,
    comments: 12,
    timestamp: '4h ago',
    isLiked: true
  }
];

const MOCK_CHATS: ChatGroup[] = [
  { 
    id: 'c1', 
    name: 'Design Geeks', 
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DG', 
    lastMessage: 'Check out the new wireframes', 
    unread: 3,
    messages: [
      { id: '1', text: 'Hey guys!', sender: 'them', time: '10:00 AM' },
      { id: '2', text: 'Did you see the new Hexagram update?', sender: 'them', time: '10:02 AM' },
      { id: '3', text: 'Yeah, it looks amazing!', sender: 'me', time: '10:05 AM' },
    ]
  },
  { 
    id: 'c2', 
    name: 'Sarah Chen', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 
    lastMessage: 'See you at the meet?', 
    unread: 0,
    messages: []
  }
];

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: Tab, setActiveTab: (t: Tab) => void }) => {
  const menuItems = [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'chat', icon: MessageCircle, label: 'Chats' },
    { id: 'communities', icon: Users, label: 'Circles' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex justify-between items-center z-50 md:left-0 md:top-0 md:w-20 md:h-full md:flex-col md:border-r md:border-t-0 md:pt-10">
      <div className="hidden md:flex mb-10 text-white">
        <Hexagon className="w-8 h-8 text-indigo-500 fill-indigo-500/20" />
      </div>
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id as Tab)}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === item.id ? 'text-indigo-400 scale-110' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <item.icon className="w-6 h-6" />
          <span className="text-[10px] md:hidden">{item.label}</span>
        </button>
      ))}
      <div className="hidden md:mt-auto md:mb-6">
         <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">H</div>
      </div>
    </nav>
  );
};

const Header = ({ onSearchClick, onCreateClick }: { onSearchClick: () => void, onCreateClick: () => void }) => (
  <header className="fixed top-0 left-0 w-full bg-black/80 backdrop-blur-md z-40 border-bottom border-white/5 md:pl-24 h-16 flex items-center justify-between px-4">
    <div className="flex items-center gap-2">
      <Hexagon className="w-6 h-6 text-indigo-500 md:hidden" />
      <h1 className="text-xl font-black tracking-tighter text-white">HEXAGRAM</h1>
      <div className="hidden sm:flex items-center gap-1 ml-4 bg-zinc-900 px-2 py-1 rounded-full border border-white/5">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nexus Pulse: Highly Active</span>
      </div>
    </div>
    <div className="flex items-center gap-4 text-white">
      <button onClick={onSearchClick} className="p-2 hover:bg-white/10 rounded-full transition-colors">
        <Search className="w-5 h-5 opacity-60" />
      </button>
      <button onClick={onCreateClick} className="p-2 hover:bg-white/10 rounded-full transition-colors">
        <PlusSquare className="w-5 h-5 opacity-60" />
      </button>
    </div>
  </header>
);

const CreateModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-zinc-900 w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h3 className="text-xl font-black text-white">INITIALIZE POST</h3>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><PlusSquare className="w-6 h-6 rotate-45 text-gray-500" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="aspect-video bg-zinc-800 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-indigo-500/50 transition-colors cursor-pointer group">
                 <Camera className="w-12 h-12 text-gray-600 group-hover:text-indigo-400 transition-colors mb-2" />
                 <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Upload Spatial Media</p>
              </div>
              <textarea 
                placeholder="Synchronize your thoughts..." 
                className="w-full bg-transparent text-white text-lg outline-none resize-none h-24 placeholder:text-gray-700"
              ></textarea>
              <div className="flex items-center gap-4">
                 <div className="flex -space-x-2">
                   {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800"></div>)}
                 </div>
                 <span className="text-[10px] text-gray-500 font-bold uppercase">Tag your Circle</span>
              </div>
            </div>
            <div className="p-6 bg-black/40 flex gap-4">
              <button className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-4 rounded-2xl transition-colors uppercase tracking-widest text-xs" onClick={onClose}>Abort</button>
              <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 active:scale-95">Deploy</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SearchOverlay = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSearch = () => {
    if (!query) return;
    setIsThinking(true);
    setTimeout(() => setIsThinking(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-[100] backdrop-blur-2xl flex flex-col items-center pt-20 px-6"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white">
            <PlusSquare className="w-8 h-8 rotate-45" />
          </button>
          
          <div className="w-full max-w-2xl space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tighter">AI DISCOVERY</h2>
              <p className="text-gray-500 text-sm">Ask Gemini to find people, circles, or trending posts.</p>
            </div>

            <div className="relative group">
              <input 
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                type="text" 
                placeholder="Find some digital art from last week..." 
                className="w-full bg-zinc-900/50 border-2 border-white/5 rounded-3xl px-6 py-5 text-xl text-white outline-none focus:border-indigo-500/50 transition-all shadow-2xl"
              />
              <button 
                onClick={handleSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 p-3 rounded-2xl hover:bg-indigo-500"
              >
                {isThinking ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Hexagon className="w-5 h-5" /></motion.div> : <Send className="w-5 h-5 text-white" />}
              </button>
            </div>

            {isThinking && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ height: [10, 30, 10] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                      className="w-1 bg-indigo-500 rounded-full"
                    />
                  ))}
                </div>
                <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase">Gemini is exploring Hexagram...</p>
              </div>
            )}

            {!isThinking && !query && (
              <div className="grid grid-cols-2 gap-4">
                {['Trending Now', 'Nearby Circles', 'Digital Artists', 'UI Inspiration'].map(tag => (
                  <div key={tag} className="p-4 bg-zinc-900 rounded-2xl border border-white/5 hover:border-indigo-500/30 cursor-pointer transition-all">
                    <p className="text-white font-bold text-sm"># {tag}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FeedTab = ({ onStoryClick }: { onStoryClick: (index: number) => void }) => {
  const [pulse, setPulse] = useState(CIRCLE_DIGEST.summary);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [posts, setPosts] = useState(MOCK_POSTS);

  const refreshPulse = async () => {
    setIsAnalyzing(true);
    const newPulse = await analyzeSocialPulse(posts);
    setPulse(newPulse);
    setIsAnalyzing(false);
  };

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { 
          ...p, 
          isLiked: !p.isLiked, 
          likes: p.isLiked ? p.likes - 1 : p.likes + 1 
        };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-8 pb-32">
      {/* AI Digest Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] p-6 relative overflow-hidden group shadow-2xl shadow-indigo-500/5"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Hexagon className="w-24 h-24 rotate-12" />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2 h-2 bg-indigo-500 rounded-full ${isAnalyzing ? 'animate-bounce' : 'animate-ping'}`}></div>
          <span className="text-[10px] font-black tracking-[0.2em] text-indigo-400 uppercase">Nexus Intelligence</span>
        </div>
        <p className="text-white text-base leading-relaxed font-medium">
          {isAnalyzing ? "Gemini is decrypting the social lattice..." : pulse}
        </p>
        <div 
          onClick={refreshPulse}
          className="mt-6 flex items-center gap-3 text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em] cursor-pointer hover:text-white transition-all group/btn"
        >
          <div className="w-8 h-[1px] bg-indigo-500/30 group-hover/btn:w-12 transition-all"></div>
          Recalibrate Lattice <Share2 className="w-3 h-3 rotate-90" />
        </div>
      </motion.div>

      {/* Stories */}
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide px-2">
        <div className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
          <div className="w-20 h-20 rounded-[2rem] p-[3px] bg-zinc-800 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 transition-all">
             <PlusSquare className="w-6 h-6 text-gray-500" />
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">You</span>
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} onClick={() => onStoryClick(i)} className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
            <div className="w-20 h-20 rounded-[2rem] p-[3.5px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 group-hover:rotate-6 transition-transform">
              <div className="w-full h-full rounded-[1.8rem] bg-black p-[2px]">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} 
                  alt="Story"
                  className="w-full h-full rounded-[1.7rem] object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Sync_{i}</span>
          </div>
        ))}
      </div>

    {/* Posts */}
    {posts.map((post) => (
      <motion.article 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={post.id} 
        className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/5"
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={post.user.avatar} className="w-10 h-10 rounded-full" alt={post.user.name} referrerPolicy="no-referrer" />
            <div>
              <p className="text-white font-semibold text-sm">{post.user.name}</p>
              <p className="text-gray-500 text-xs">{post.user.handle}</p>
            </div>
          </div>
          <MoreHorizontal className="text-gray-500 w-5 h-5 cursor-pointer hover:text-white transition-colors" />
        </div>
        <div className="aspect-square bg-zinc-800 relative group overflow-hidden">
          <img 
            src={post.image} 
            alt="Post content" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            referrerPolicy="no-referrer"
          />
          <AnimatePresence>
            {post.isLiked && (
               <motion.div 
                 initial={{ scale: 0, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0, opacity: 0 }}
                 className="absolute inset-0 flex items-center justify-center pointer-events-none"
               >
                 <Heart className="w-24 h-24 text-red-500/80 fill-red-500/80" />
               </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-4 text-white">
            <button onClick={() => toggleLike(post.id)}>
              <Heart className={`w-6 h-6 transition-all ${post.isLiked ? 'text-red-500 fill-red-500' : 'hover:scale-110 active:scale-95 text-white'}`} />
            </button>
            <MessageCircle className="w-6 h-6 hover:scale-110 active:scale-95 transition-transform cursor-pointer" />
            <Share2 className="w-6 h-6 hover:scale-110 active:scale-95 transition-transform cursor-pointer" />
            <div className="ml-auto">
              <Hexagon className="w-6 h-6 opacity-40 hover:opacity-100 transition-opacity cursor-pointer text-indigo-400" />
            </div>
          </div>
          <p className="text-white font-bold text-sm">
            <motion.span
              key={post.likes}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {post.likes.toLocaleString()}
            </motion.span> likes
          </p>
          <p className="text-gray-300 text-sm">
            <span className="font-bold mr-2 text-white">{post.user.handle}</span> {post.caption}
          </p>
          <p className="text-gray-500 text-xs cursor-pointer hover:text-gray-400 transition-colors">View all {post.comments} comments</p>
          <p className="text-[10px] text-gray-600 uppercase font-medium tracking-wider">{post.timestamp} • Encrypted</p>
        </div>
      </motion.article>
    ))}
  </div>
  );
};

const ChatTab = ({ onSelectChat }: { onSelectChat: (id: string) => void }) => (
  <div className="space-y-4 pb-32">
    <div className="flex bg-zinc-900 rounded-xl p-3 items-center gap-3 border border-white/5 mx-2">
      <Search className="w-4 h-4 text-gray-500" />
      <input type="text" placeholder="Search chats..." className="bg-transparent text-white text-sm outline-none w-full" />
    </div>
    <div className="space-y-1">
      {MOCK_CHATS.map((chat) => (
        <div 
          key={chat.id} 
          onClick={() => onSelectChat(chat.id)}
          className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-2xl transition-all cursor-pointer group active:scale-[0.98]"
        >
          <div className="relative flex-shrink-0">
            <img src={chat.avatar} className="w-14 h-14 rounded-2xl object-cover" alt={chat.name} referrerPolicy="no-referrer" />
            {chat.unread > 0 && (
              <div className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold h-5 min-w-5 flex items-center justify-center rounded-full border-2 border-black px-1">
                {chat.unread}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-0.5">
              <h3 className="text-white font-bold truncate">{chat.name}</h3>
              <span className="text-[10px] text-gray-600 font-medium">12:45 PM</span>
            </div>
            <p className="text-gray-400 text-xs truncate leading-relaxed">{chat.lastMessage}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MessageView = ({ chatId, onBack }: { chatId: string, onBack: () => void }) => {
  const chat = MOCK_CHATS.find(c => c.id === chatId) || MOCK_CHATS[0];
  const [inputText, setInputText] = useState('');

  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed inset-0 bg-black z-50 md:left-20 flex flex-col"
    >
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 bg-zinc-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-white">
            <Share2 className="w-5 h-5 rotate-180" />
          </button>
          <div className="relative">
            <img src={chat.avatar} className="w-10 h-10 rounded-xl" alt={chat.name} referrerPolicy="no-referrer" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-black"></div>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm leading-none flex items-center gap-2">
              {chat.name}
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Layers className="w-3 h-3 text-indigo-400" />
              </motion.div>
            </h3>
            <span className="text-[9px] text-gray-500 font-medium tracking-wide uppercase">E2E Encrypted Port 8080</span>
          </div>
        </div>
        <MoreHorizontal className="text-gray-500 w-5 h-5 cursor-pointer" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {chat.messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
              m.sender === 'me' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-zinc-800 text-gray-200 rounded-bl-none'
            }`}>
              <p>{m.text}</p>
              <p className={`text-[9px] mt-1 opacity-50 ${m.sender === 'me' ? 'text-right' : 'text-left'}`}>
                {m.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10 bg-black">
        <div className="flex gap-2 items-center bg-zinc-900 rounded-2xl px-4 py-2">
          <PlusSquare className="w-5 h-5 text-gray-500 cursor-pointer" />
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write a message..." 
            className="flex-1 bg-transparent text-white text-sm outline-none" 
          />
          <button className="text-indigo-500 font-bold p-2">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const CommunitiesTab = () => {
  const [selectedCircle, setSelectedCircle] = useState<string | null>(null);

  const circles = [
    { id: '1', name: 'Web Dev Collective', members: '12k', image: 'https://picsum.photos/seed/web/400/400', theme: 'indigo' },
    { id: '2', name: 'Lo-Fi Chill Beats', members: '56k', image: 'https://picsum.photos/seed/beats/400/400', theme: 'purple' },
    { id: '3', name: 'Art & Motion', members: '8k', image: 'https://picsum.photos/seed/art/400/400', theme: 'fuchsia' },
  ];

  if (selectedCircle) {
    const circle = circles.find(c => c.id === selectedCircle);
    return (
      <div className="space-y-6 pb-32">
        <button 
          onClick={() => setSelectedCircle(null)}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-4 group"
        >
          <Share2 className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Circles</span>
        </button>
        
        <div className="relative h-48 rounded-[2.5rem] overflow-hidden border border-white/10">
          <img src={circle?.image} className="w-full h-full object-cover blur-sm opacity-50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
             <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{circle?.name}</h2>
             <p className="text-indigo-400 font-bold text-xs mt-2 uppercase tracking-widest">{circle?.members} Syncing Now</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 border-b border-white/5 font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500">
           <span className="text-white border-b-2 border-indigo-500 pb-2">Lattice Feed</span>
           <span>Files</span>
           <span>Members</span>
           <span>Events</span>
        </div>

        <div className="space-y-4 pt-4">
           {[1, 2, 3].map(i => (
             <div key={i} className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 space-y-4">
               <div className="flex items-center gap-3">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=member${i}`} className="w-8 h-8 rounded-full" />
                 <div>
                   <p className="text-white font-bold text-xs">Architect_{i}</p>
                   <p className="text-gray-500 text-[10px]">Lattice Node • 2h ago</p>
                 </div>
               </div>
               <p className="text-gray-300 text-sm leading-relaxed">
                 Just pushed the new hexagonal protocol to the main branch. Let's sync on the performance gains tomorrow during the standup. ⚡️
               </p>
               <div className="flex gap-4 text-gray-500">
                  <div className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer capitalize text-xs">
                    <Heart className="w-4 h-4 text-indigo-400" /> 12
                  </div>
                  <div className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer capitalize text-xs">
                    <MessageCircle className="w-4 h-4" /> 5
                  </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-indigo-600/20 border border-indigo-500/30 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
          <Users className="w-12 h-12 text-indigo-400" />
          <div>
            <h3 className="text-white font-black text-lg">Discover Circles</h3>
            <p className="text-xs text-indigo-300 opacity-60 max-w-[200px] mt-1">Join communities based on your interest lattice.</p>
          </div>
          <button className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs py-2 px-6 rounded-full transition-colors">Explorer</button>
        </motion.div>
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-zinc-900 border border-white/5 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center gap-4"
        >
          <PlusSquare className="w-12 h-12 text-gray-500" />
          <div>
            <h3 className="text-white font-black text-lg">Create Circle</h3>
            <p className="text-xs text-gray-500 max-w-[200px] mt-1">Start your own hub in the hexagonal ecosystem.</p>
          </div>
          <button className="bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-xs py-2 px-6 rounded-full transition-colors border border-white/5">Initialize</button>
        </motion.div>
      </div>
      
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-white font-black text-xl tracking-tight">Active Lattice</h2>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Live Sync</span>
        </div>
        
        <div className="grid gap-4">
          {circles.map((group, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedCircle(group.id)}
              className="group flex flex-col sm:flex-row items-center gap-6 p-5 bg-zinc-900/40 hover:bg-zinc-800/50 rounded-[2.5rem] border border-white/5 transition-all cursor-pointer overflow-hidden"
            >
              <div className="relative flex-shrink-0">
                <img 
                  src={group.image} 
                  className="w-32 h-32 sm:w-20 sm:h-20 rounded-[1.5rem] object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={group.name} 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 ring-1 ring-white/10 rounded-[1.5rem] group-hover:ring-white/20 transition-all"></div>
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-white font-black text-lg group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{group.name}</h4>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">{group.members} Syncing</p>
                <div className="flex justify-center sm:justify-start -space-x-2 mt-4 hover:translate-x-1 transition-transform">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-zinc-800 ring-1 ring-white/5 overflow-hidden">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=comm${idx}${i}`} 
                        className="w-full h-full" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-black bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">
                    +
                  </div>
                </div>
              </div>
              
              <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                <button className="flex-1 sm:w-24 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black px-4 py-3 rounded-2xl transition-all shadow-lg active:scale-95 uppercase tracking-widest">Connect</button>
                <button className="flex-1 sm:w-24 bg-white/5 hover:bg-white/10 text-gray-500 text-[10px] font-black px-4 py-3 rounded-2xl transition-all border border-white/5 uppercase tracking-widest">Details</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileTab = () => (
  <div className="pb-32">
    <div className="relative mb-20">
      <div className="h-32 w-full bg-gradient-to-r from-indigo-900 to-purple-900 rounded-b-3xl"></div>
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="w-32 h-32 rounded-3xl bg-zinc-900 p-1 border-4 border-black relative rotate-3">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Hasan" 
            className="w-full h-full rounded-2xl object-cover -rotate-3" 
            alt="Profile" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-2 -right-2 bg-indigo-500 p-2 rounded-xl shadow-lg border border-black">
            <Camera className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
    
    <div className="text-center mt-4">
      <h1 className="text-2xl font-black text-white">Pathan Hasan</h1>
      <p className="text-indigo-400 font-medium text-sm">@hasan_pathan</p>
      
      <div className="flex justify-center gap-2 mt-3">
        {['Focus', 'Building', 'Chillin'].map((status, idx) => (
          <span key={status} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            idx === 1 ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-transparent border-white/10 text-gray-500'
          }`}>
            {status}
          </span>
        ))}
      </div>

      <p className="text-gray-400 text-sm mt-4 px-10">Building the future of social convergence with Hexagram. 🌌 #Web3 #Design</p>
    </div>

    <div className="flex justify-center gap-10 mt-8 py-4 border-y border-white/5 bg-zinc-900/20 px-4">
      <div className="text-center">
        <p className="text-white font-black text-xl">42</p>
        <p className="text-gray-600 text-[10px] uppercase font-bold tracking-widest">Posts</p>
      </div>
      <div className="text-center">
        <p className="text-white font-black text-xl">1.2k</p>
        <p className="text-gray-600 text-[10px] uppercase font-bold tracking-widest">Followers</p>
      </div>
      <div className="text-center relative">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-500 text-[8px] font-black px-2 py-0.5 rounded-full text-white animate-bounce">TOP 1%</div>
        <p className="text-indigo-400 font-black text-xl">854</p>
        <p className="text-gray-600 text-[10px] uppercase font-bold tracking-widest">Hex-Score</p>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2 mt-6">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <motion.div 
          key={i} 
          whileHover={{ scale: 1.05, zIndex: 10 }}
          className="aspect-square relative group cursor-pointer"
          style={{
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
          }}
        >
          <img 
            src={`https://picsum.photos/seed/userpost${i}/400/400`} 
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/20 transition-colors"></div>
        </motion.div>
      ))}
    </div>
  </div>
);

const StoryViewer = ({ index, onClose }: { index: number, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-4 md:p-10"
    >
      <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white z-50">
        <PlusSquare className="w-8 h-8 rotate-45" />
      </button>
      
      <div className="w-full max-w-lg aspect-[9/16] bg-zinc-900 rounded-[3rem] overflow-hidden relative shadow-2xl shadow-indigo-500/20 border border-white/10">
        <div className="absolute top-0 left-0 w-full p-4 flex gap-1 z-20">
          <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: '100%' }}
               transition={{ duration: 5, ease: "linear" }}
               onAnimationComplete={onClose}
               className="h-full bg-white"
             />
          </div>
        </div>
        
        <div className="absolute top-8 left-4 flex items-center gap-3 z-20">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${index}`} className="w-8 h-8 rounded-full border border-white/20" alt="user" />
          <span className="text-white text-xs font-bold uppercase tracking-widest">Sync_{index}</span>
          <span className="text-white/40 text-[10px]">42m</span>
        </div>

        <img 
          src={`https://picsum.photos/seed/hexstory${index}/1080/1920`} 
          className="w-full h-full object-cover" 
          alt="Story content" 
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute bottom-6 left-0 w-full px-6 flex gap-4 items-center">
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
            <input type="text" placeholder="Send a reaction..." className="bg-transparent text-white text-xs outline-none w-full" />
          </div>
          <Heart className="w-6 h-6 text-white" />
          <Send className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-indigo-500 selection:text-white">
      <Header 
        onSearchClick={() => setIsSearchOpen(true)} 
        onCreateClick={() => setIsCreateOpen(true)}
      />
      <Sidebar activeTab={activeTab} setActiveTab={(t) => {
        setActiveTab(t);
        setSelectedChat(null);
      }} />

      <AnimatePresence>
        {selectedStory !== null && (
          <StoryViewer index={selectedStory} onClose={() => setSelectedStory(null)} />
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      
      <main className="pt-20 px-4 md:pl-28 md:pr-10 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!selectedChat ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2, ease: "circOut" }}
              className="w-full"
            >
              {activeTab === 'feed' && <FeedTab onStoryClick={setSelectedStory} />}
              {activeTab === 'chat' && <ChatTab onSelectChat={setSelectedChat} />}
              {activeTab === 'communities' && <CommunitiesTab />}
              {activeTab === 'profile' && <ProfileTab />}
            </motion.div>
          ) : (
            <MessageView chatId={selectedChat!} onBack={() => setSelectedChat(null)} />
          )}
        </AnimatePresence>
      </main>

      {/* Hexagonal Glow Decor */}
      <div className="fixed top-[-5%] right-[-5%] w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full -z-10 animate-pulse"></div>
      <div className="fixed bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-fuchsia-600/10 blur-[100px] rounded-full -z-10"></div>
    </div>
  );
}
