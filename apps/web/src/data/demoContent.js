// Demo content for the public marketing surface. This is intentionally kept
// separate from application logic so it can be swapped for live PocketBase
// records in a later phase. NOT persisted, NOT used by authenticated flows.

export const demoPodcasts = [
  { id: 'p1', title: 'The Operating Room', host: 'Dana Whitfield', category: 'Business', gradient: 'from-[#8B7CF6] to-[#4c3fb0]', episodes: 84, followers: '128k' },
  { id: 'p2', title: 'Zero to Scale', host: 'Marcus Bell', category: 'Entrepreneurship', gradient: 'from-[#A99AF8] to-[#5a4fb5]', episodes: 152, followers: '210k' },
  { id: 'p3', title: 'Signal & Model', host: 'Priya Nair', category: 'AI', gradient: 'from-[#6d5de0] to-[#2c2744]', episodes: 61, followers: '96k' },
  { id: 'p4', title: 'The Capital Desk', host: 'Elena Vasquez', category: 'Finance', gradient: 'from-[#9488f0] to-[#403764]', episodes: 203, followers: '340k' },
  { id: 'p5', title: 'Ledger & Lease', host: 'Tom Okafor', category: 'Real Estate', gradient: 'from-[#8B7CF6] to-[#27204a]', episodes: 47, followers: '54k' },
  { id: 'p6', title: 'The Long Game', host: 'Sara Lindqvist', category: 'Leadership', gradient: 'from-[#b0a4fa] to-[#5045a0]', episodes: 118, followers: '175k' },
];

export const demoEpisodes = [
  { id: 'e1', title: 'Rebuilding trust after a layoff', show: 'The Long Game', duration: '48 min', plays: '32k' },
  { id: 'e2', title: 'What LLM agents change about hiring', show: 'Signal & Model', duration: '54 min', plays: '61k' },
  { id: 'e3', title: 'The unit economics nobody checks', show: 'Zero to Scale', duration: '39 min', plays: '44k' },
  { id: 'e4', title: 'Reading a term sheet in 20 minutes', show: 'The Capital Desk', duration: '61 min', plays: '88k' },
  { id: 'e5', title: 'Commercial leases in a high-rate market', show: 'Ledger & Lease', duration: '35 min', plays: '19k' },
];

export const demoCategories = [
  { name: 'Business', slug: 'business', icon: 'Briefcase', count: 1240 },
  { name: 'Entrepreneurship', slug: 'entrepreneurship', icon: 'Rocket', count: 980 },
  { name: 'Technology', slug: 'technology', icon: 'Cpu', count: 1510 },
  { name: 'AI', slug: 'ai', icon: 'Sparkles', count: 620 },
  { name: 'Finance', slug: 'finance', icon: 'LineChart', count: 1100 },
  { name: 'Leadership', slug: 'leadership', icon: 'Users', count: 760 },
  { name: 'Real Estate', slug: 'real-estate', icon: 'Building2', count: 430 },
  { name: 'Career', slug: 'career', icon: 'TrendingUp', count: 690 },
];

export const demoCreators = [
  { id: 'c1', name: 'Priya Nair', tagline: 'AI researcher & host of Signal & Model', shows: 2, gradient: 'from-[#8B7CF6] to-[#3b3170]' },
  { id: 'c2', name: 'Marcus Bell', tagline: 'Three-time founder, now teaching operators', shows: 3, gradient: 'from-[#A99AF8] to-[#453a85]' },
  { id: 'c3', name: 'Elena Vasquez', tagline: 'Former buy-side analyst turned educator', shows: 1, gradient: 'from-[#6d5de0] to-[#2c2744]' },
];

export const demoTestimonials = [
  { quote: 'We launched our whole show in a weekend. The studio and distribution just worked.', name: 'Sara Lindqvist', role: 'Host, The Long Game' },
  { quote: 'The analytics finally tell me which segments actually retain listeners.', name: 'Tom Okafor', role: 'Host, Ledger & Lease' },
  { quote: 'Carrion made it trivial to bring on guest editors without sharing passwords.', name: 'Marcus Bell', role: 'Host, Zero to Scale' },
];
