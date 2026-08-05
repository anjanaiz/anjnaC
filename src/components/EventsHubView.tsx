import React from 'react';
import { EventInfo } from '../types';
import { Calendar, MapPin, ArrowRight, Sparkles, Film, ListTodo, DollarSign, Compass, ClipboardList, Store, Award } from 'lucide-react';
import { chakraLogoBase64 as chakraLogo, kathawakLogoBase64 as kathawakLogo } from '../assets/images/logoBase64';

interface EventsHubViewProps {
  onSelectEvent: (eventId: 'chakra360' | 'kathawak') => void;
  eventLogos?: { [key: string]: string };
}

export const EVENTS_LIST: EventInfo[] = [
  {
    id: 'chakra360',
    name: 'Chakra 360 Live in Concert',
    subtitle: 'Chakra 360 Live Production & Media Control',
    date: 'JUNE 28, 2026',
    venue: 'Air Force Grounds Colombo',
    logo: chakraLogo,
    accentColor: '#FF6B00',
    badge: 'LIVE PRODUCTION'
  },
  {
    id: 'kathawak',
    name: 'Kathawak Film in Concert',
    subtitle: 'කතාවක් - The Story of Music Symphonic Production',
    date: 'AUGUST 15, 2026',
    venue: 'Nelum Pokuna Grand Complex Colombo',
    logo: kathawakLogo,
    accentColor: '#EAB308',
    badge: 'NEW PRODUCTION'
  }
];

export const EventsHubView: React.FC<EventsHubViewProps> = ({ 
  onSelectEvent, 
  eventLogos = {}
}) => {
  return (
    <div className="space-y-8 py-4 max-w-6xl mx-auto">
      
      {/* HUB HERO TITLE */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/25 text-[#FF6B00] text-xs font-mono font-bold uppercase tracking-widest">
          <Sparkles size={12} />
          SAS Entertainment Multi-Event Control
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-display text-white tracking-tight">
          Event Production Hub
        </h1>
        <p className="text-zinc-400 text-xs md:text-sm font-mono leading-relaxed">
          Select an active concert production workspace below to manage media shoot lists, task timelines, budget allocations, site layout maps, venue requirements, vendor stalls, and sponsor commitments.
        </p>
      </div>

      {/* EVENT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {EVENTS_LIST.map((evt) => {
          const currentDisplayLogo = eventLogos[evt.id] || evt.logo;

          return (
            <div
              key={evt.id}
              onClick={() => onSelectEvent(evt.id)}
              className="group relative bg-[#0D0D0D] border border-white/10 hover:border-[#FF6B00]/50 rounded-3xl p-7 flex flex-col justify-between space-y-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.15)] cursor-pointer overflow-hidden"
            >
              {/* BACKGROUND GLOW ACCENT */}
              <div 
                className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[90px] pointer-events-none opacity-20 transition-opacity group-hover:opacity-40"
                style={{ backgroundColor: evt.accentColor }}
              />

              <div>
                {/* CARD TOP BADGE & LOGO */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="min-w-20 h-20 px-3 bg-black/60 border border-white/10 rounded-2xl p-2 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={currentDisplayLogo}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        if (evt.id === 'chakra360') e.currentTarget.src = '/chakra_logo.png';
                        else e.currentTarget.src = '/kathawak_logo.png';
                      }}
                      alt={evt.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                    />
                  </div>

                  <span 
                    className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase border"
                    style={{ 
                      backgroundColor: `${evt.accentColor}15`, 
                      color: evt.accentColor,
                      borderColor: `${evt.accentColor}30`
                    }}
                  >
                    {evt.badge}
                  </span>
                </div>

                {/* EVENT TITLE & DESCRIPTION */}
                <h2 className="text-2xl font-bold font-display text-white tracking-tight group-hover:text-[#FF6B00] transition-colors">
                  {evt.name}
                </h2>
                <p className="text-zinc-400 font-mono text-xs mt-1.5 leading-relaxed">
                  {evt.subtitle}
                </p>

                {/* DATE AND VENUE META */}
                <div className="mt-5 space-y-2 border-t border-b border-white/5 py-4 font-mono text-xs text-zinc-300">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={14} className="text-[#FF6B00] shrink-0" />
                    <span>Target Event Date: <strong className="text-white">{evt.date}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin size={14} className="text-[#FF6B00] shrink-0" />
                    <span>Venue: <strong className="text-white">{evt.venue}</strong></span>
                  </div>
                </div>

                {/* MODULES INCLUDED CHIPS */}
                <div className="mt-5 space-y-2">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold tracking-wider">
                    Modules Included
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-zinc-300 flex items-center gap-1 border border-white/5">
                      <Film size={10} className="text-[#FF6B00]" /> Shoot List
                    </span>
                    <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-zinc-300 flex items-center gap-1 border border-white/5">
                      <ListTodo size={10} className="text-[#FF6B00]" /> Tasks
                    </span>
                    <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-zinc-300 flex items-center gap-1 border border-white/5">
                      <DollarSign size={10} className="text-[#FF6B00]" /> Budget Tracker
                    </span>
                    <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-zinc-300 flex items-center gap-1 border border-white/5">
                      <Compass size={10} className="text-[#FF6B00]" /> Event Map
                    </span>
                    <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-zinc-300 flex items-center gap-1 border border-white/5">
                      <ClipboardList size={10} className="text-[#FF6B00]" /> Requirements
                    </span>
                    <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-zinc-300 flex items-center gap-1 border border-white/5">
                      <Store size={10} className="text-[#FF6B00]" /> Stalls
                    </span>
                    <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-zinc-300 flex items-center gap-1 border border-white/5">
                      <Award size={10} className="text-[#FF6B00]" /> Sponsors
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION CTA BUTTON */}
              <div className="pt-2">
                <button
                  style={{ backgroundColor: evt.accentColor }}
                  className="w-full py-3.5 px-5 rounded-2xl text-black font-black font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 group-hover:gap-3 transition-all cursor-pointer shadow-lg"
                >
                  <span>Enter Event Dashboard</span>
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

