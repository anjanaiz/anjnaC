import React, { useState, useEffect, useRef } from 'react';
import savedMarkers from '../github-repo/markers.json';
import savedCategories from '../github-repo/custom_categories.json';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { 
  Sparkles, 
  Sliders, 
  Ticket, 
  Flame, 
  Film, 
  Shield, 
  MapPin, 
  Search, 
  Navigation,
  Layers,
  Plus,
  Compass,
  Calendar,
  Info,
  Trash2,
  Radio,
  Tv,
  Utensils,
  Store,
  Music,
  Crosshair,
  HelpCircle,
  HelpCircle as CheckCircle, // using fallback safe name
  Beer,
  Bath,
  Package,
  ClipboardList
} from 'lucide-react';

export const autoResolveIcon = (title: string, category: string): string => {
  const text = title.toLowerCase();
  
  // Washrooms, toilets, bathrooms (check before general 'room' match)
  // Ensure we do not accidentally match "Band Rest Room," "Artists Rest Room," or "Crew Rest Room" as standard toilets
  const isLounge = text.includes('band') || text.includes('artist') || text.includes('crew');
  if (!isLounge && (text.includes('wash room') || text.includes('washroom') || text.includes('toilet') || text.includes('wc') || text.includes('bathroom') || text.includes('restroom') || text.includes('rest room'))) {
    return 'washroom';
  }

  // Beer & Liquor (check before general stalls)
  if (text.includes('beer') || text.includes('liquor')) {
    return 'beer';
  }

  // Stalls, markets, food, stalls
  if (text.includes('food') || text.includes('kottu') || text.includes('juice') || text.includes('beverage') || text.includes('drink') || text.includes('cafe') || text.includes('eat') || text.includes('canteen') || text.includes('dining') || text.includes('rest') || text.includes('bazaar') || text.includes('stall') || text.includes('shop') || text.includes('market') || text.includes('lunch') || text.includes('dinner') || text.includes('plate') || text.includes('dish') || text.includes('rice') || text.includes('curry') || text.includes('bar') || text.includes('burger') || text.includes('tea') || text.includes('coffee') || text.includes('bakery')) {
    return 'stall';
  }
  
  // Music, sound, speaker, mic
  if (text.includes('music') || text.includes('dj') || text.includes('band') || text.includes('sound') || text.includes('speaker') || text.includes('audio') || text.includes('concert') || text.includes('mic') || text.includes('singer') || text.includes('live') || text.includes('shout') || text.includes('voice') || text.includes('karaoke') || text.includes('instrument') || text.includes('flute') || text.includes('guitar') || text.includes('pa system') || text.includes('acoustic') || text.includes('drum') || text.includes('subwoofer')) {
    return 'music';
  }
  
  // TV, visual, camera, screen
  if (text.includes('screen') || text.includes('led') || text.includes('visual') || text.includes('tv') || text.includes('camera') || text.includes('photo') || text.includes('media') || text.includes('video') || text.includes('film') || text.includes('stream') || text.includes('press') || text.includes('broad') || text.includes('projector') || text.includes('display')) {
    return 'tv';
  }
  
  // Security, guard, police, command, health, medical, safe, first aid
  if (text.includes('security') || text.includes('guard') || text.includes('police') || text.includes('command') || text.includes('safe') || text.includes('aid') || text.includes('medic') || text.includes('health') || text.includes('first') || text.includes('doctor') || text.includes('nurse') || text.includes('fire') || text.includes('emergency') || text.includes('help') || text.includes('dr.') || text.includes('ambulance') || text.includes('clinic') || text.includes('hospital') || text.includes('policeman') || text.includes('cop') || text.includes('checkpoint')) {
    return 'security';
  }
  
  // Entrance, gate, pass, registration, ticket
  if (text.includes('gate') || text.includes('entrance') || text.includes('exit') || text.includes('ticket') || text.includes('pass') || text.includes('registration') || text.includes('door') || text.includes('lobby') || text.includes('reception') || text.includes('counter') || text.includes('check-in') || text.includes('booth') || text.includes('reg') || text.includes('admissions') || text.includes('barrier')) {
    return 'entrance';
  }
  
  // VIP, lounge, suite, greenroom
  if (text.includes('vip') || text.includes('lounge') || text.includes('sofa') || text.includes('lux') || text.includes('room') || text.includes('artist') || text.includes('chamara') || text.includes('kasun') || text.includes('weerasinha') || text.includes('backroom') || text.includes('chair') || text.includes('suite') || text.includes('v.i.p') || text.includes('comfort') || text.includes('greenroom') || text.includes('makeup')) {
    return 'vip';
  }
  
  // Stage, setup, truss, performance
  if (text.includes('stage') || text.includes('performance') || text.includes('dome') || text.includes('show') || text.includes('spotlight') || text.includes('auditorium') || text.includes('stg') || text.includes('rig') || text.includes('truss') || text.includes('scaffold') || text.includes('platform') || text.includes('orchestra') || text.includes('podium') || text.includes('catwalk') || text.includes('theatre') || text.includes('deck') || text.includes('setup')) {
    return 'stage';
  }
  
  // FOH, control, console, mixer
  if (text.includes('mix') || text.includes('control') || text.includes('hub') || text.includes('focal') || text.includes('console') || text.includes('foh') || text.includes('wire') || text.includes('technical') || text.includes('board') || text.includes('dimmer') || text.includes('power') || text.includes('generator') || text.includes('electricity') || text.includes('distribution')) {
    return 'foh';
  }
  
  // Category defaults fallback
  if (category === 'stall') {
    return 'stall';
  }
  if (category === 'production') {
    return 'stage';
  }
  if (category === 'access') {
    return 'entrance';
  }
  if (category === 'health_and_security') {
    return 'security';
  }
  if (category === 'hospitality') {
    return 'vip';
  }
  return 'custom';
};

const DEFAULT_CATEGORIES = ['production', 'stall', 'access', 'health_and_security', 'hospitality'];

export interface MapResource {
  id: string;
  name: string;
  quantity: number;
}

export interface MapMarker {
  id: string;
  title: string;
  category: string;
  x: number; // Percentage coordinate on map layout (0 - 100)
  y: number; // Percentage coordinate on map layout (0 - 100)
  iconName: string;
  description: string;
  notes?: string;
  capacity?: string;
  powerLoad?: string;
  resources?: MapResource[];
}

const INITIAL_MARKERS: MapMarker[] = [
  {
    id: 'm_stage_setup',
    title: 'Stage Setup',
    category: 'production',
    x: 50,
    y: 18,
    iconName: 'stage',
    description: 'The main performance stage positioned perfectly at the center of the SLAF Grounds layout plan.',
    notes: 'Epicenter of full-field performance aesthetics and audio alignment.',
    capacity: 'Performance cast & crew (150 max)',
    powerLoad: '120kW Stable',
    resources: [
      { id: 'res_stage_1', name: 'Stage Truss Support Grid', quantity: 1 },
      { id: 'res_stage_2', name: 'Line Array Audio Towers', quantity: 2 },
      { id: 'res_stage_3', name: 'LED Video Panel Backdrop', quantity: 1 },
      { id: 'res_stage_4', name: 'Security Barricades', quantity: 12 },
      { id: 'res_stage_5', name: 'Stage Monitors & Mic Stands', quantity: 8 }
    ]
  },
  {
    id: 'm_foh',
    title: 'FOH',
    category: 'production',
    x: 50,
    y: 75,
    iconName: 'foh',
    description: 'Front Of House technical control unit, situated safely outside the main 30-unit circular seated audience zone.',
    notes: 'Synchronizes audio mixers, projection consoles, and visual feeds.',
    capacity: '5 Sound Experts max',
    powerLoad: '30kW stable',
    resources: [
      { id: 'res_foh_1', name: 'Digital Audio Mixing Console', quantity: 1 },
      { id: 'res_foh_2', name: 'DMX Lighting Controller Board', quantity: 1 },
      { id: 'res_foh_3', name: 'Production Talkback Intercoms', quantity: 5 }
    ]
  },
  {
    id: 'm_artists_green_room',
    title: 'Artists Green Room',
    category: 'hospitality',
    x: 25,
    y: 12,
    iconName: 'vip',
    description: 'Exclusive air-conditioned waiting room and preparation lounge for featured concert artists and guest singers.',
    notes: 'Located backstage on the left side with direct performance stage entrance.',
    capacity: '20 VIP Guests',
    powerLoad: '15kW Stable',
    resources: [
      { id: 'res_agr_1', name: 'Comfortable Sofas', quantity: 4 },
      { id: 'res_agr_2', name: 'Lighted Makeup Desks with Mirrors', quantity: 2 },
      { id: 'res_agr_3', name: 'Water Dispenser & Beverages', quantity: 1 },
      { id: 'res_agr_4', name: 'Split AC Unit 24000BTU', quantity: 1 }
    ]
  },
  {
    id: 'm_band_rest_room',
    title: 'Band Rest Room',
    category: 'hospitality',
    x: 75,
    y: 12,
    iconName: 'vip',
    description: 'Spacious relaxation room for backing bands, musicians, and stage instrumentation crew.',
    notes: 'Located backstage on the right side. Close to heavy technical loading bays.',
    capacity: '25 Crew Members',
    powerLoad: '12kW Stable',
    resources: [
      { id: 'res_brr_1', name: 'Refreshment Tables', quantity: 2 },
      { id: 'res_brr_2', name: 'Executive Chairs', quantity: 10 },
      { id: 'res_brr_3', name: 'Acoustic Tuning Station', quantity: 1 }
    ]
  },
  {
    id: 'm_main_gate',
    title: 'Main Gate Entrance',
    category: 'access',
    x: 50,
    y: 95,
    iconName: 'entrance',
    description: 'Primary public admission terminal with multi-lane scanning gates for General and VIP queue lines.',
    notes: 'Monitored by SLAF security personnel and ticketing agents.',
    capacity: '3000 entrants / hour',
    powerLoad: '5kW UPS Backed',
    resources: [
      { id: 'res_mg_1', name: 'Barcode Ticket Scanners', quantity: 6 },
      { id: 'res_mg_2', name: 'Pedestrian Crowd Control Barricades', quantity: 20 },
      { id: 'res_mg_3', name: 'High-visibility Entrance Signage', quantity: 1 }
    ]
  },
  {
    id: 'm_vip_gate',
    title: 'VIP Entrance Gate',
    category: 'access',
    x: 15,
    y: 95,
    iconName: 'entrance',
    description: 'Fast-track premium entrance gate exclusive for VIP pass holders, sponsors, and guest delegates.',
    notes: 'Features carpeted walk path and direct line to VIP hospitality booths.',
    capacity: '800 entrants / hour',
    powerLoad: '3kW Stable',
    resources: [
      { id: 'res_vg_1', name: 'Ticketing Counters', quantity: 2 },
      { id: 'res_vg_2', name: 'Red Carpet Walkway Strip', quantity: 1 },
      { id: 'res_vg_3', name: 'VIP Wristbands Bin', quantity: 2 }
    ]
  },
  {
    id: 'm_prod_gate',
    title: 'Production Support Gate',
    category: 'access',
    x: 93,
    y: 18,
    iconName: 'entrance',
    description: 'Heavy vehicle entry gate designed exclusively for logistics trucks, equipment loaders, catering, and service staff.',
    notes: 'Strict ID checking area, active 24/7 during setup and pulldown phases.',
    capacity: 'Vehicular logistics ONLY',
    powerLoad: '2kW Stable',
    resources: [
      { id: 'res_pg_1', name: 'Vehicular Boom Gate Barrier', quantity: 1 },
      { id: 'res_pg_2', name: 'Security Guard Outpost canopy', quantity: 1 }
    ]
  },
  {
    id: 'm_ticket_counter',
    title: 'Ticket Counter & Registry',
    category: 'access',
    x: 42,
    y: 88,
    iconName: 'entrance',
    description: 'On-site ticket sales desk, reservation claims desk, and helper registration station.',
    notes: 'Equipped with offline local network switches for secure claims database check.',
    capacity: '10 Agents max',
    powerLoad: '8kW Generators',
    resources: [
      { id: 'res_tc_1', name: 'Laptop Computer Sets', quantity: 4 },
      { id: 'res_tc_2', name: 'Thermal Receipt Ticket Printers', quantity: 4 },
      { id: 'res_tc_3', name: 'SLAF Field Tables', quantity: 2 }
    ]
  },
  {
    id: 'm_food_court_1',
    title: 'Main Food Stall - Kottu Hub',
    category: 'stall',
    x: 12,
    y: 42,
    iconName: 'stall',
    description: 'Popular vendor stall offering hot kottu and street snacks to the audience belt.',
    notes: 'Strict fire safety compliance: gas cylinders chained outside the vendor canopy bounds.',
    capacity: '4 Culinary workers',
    powerLoad: '10kW Stable',
    resources: [
      { id: 'res_fc1_1', name: 'Heavy Duty Canopy 10x10', quantity: 1 },
      { id: 'res_fc1_2', name: 'Hot Plates / Grills', quantity: 2 },
      { id: 'res_fc1_3', name: 'Dry Powder Fire Extinguisher', quantity: 1 }
    ]
  },
  {
    id: 'm_food_court_2',
    title: 'Beverage & Soft Drinks Stall',
    category: 'stall',
    x: 12,
    y: 52,
    iconName: 'stall',
    description: 'Beverage kiosk serving soft drinks, fruit juices, milkshakes, and bottled water.',
    notes: 'Equipped with cold storage chest freezers for rapid cooling.',
    capacity: '3 Staff members',
    powerLoad: '7kW Stable',
    resources: [
      { id: 'res_fc2_1', name: 'Beverage Chest Freezers', quantity: 2 },
      { id: 'res_fc2_2', name: 'Plastic Dispenser Pitchers', quantity: 5 },
      { id: 'res_fc2_3', name: 'Waste Disposal Bins', quantity: 2 }
    ]
  },
  {
    id: 'm_sponsor_stall',
    title: 'Sponsor Activation Stall',
    category: 'stall',
    x: 88,
    y: 45,
    iconName: 'stall',
    description: 'Merchandise distribution, interactive brand games, and promo giveaway stalls.',
    notes: 'Features corporate backdrop flyers and ambient speaker.',
    capacity: '6 Brand partners',
    powerLoad: '6kW Standard',
    resources: [
      { id: 'res_ss_1', name: 'Branded Backdrop Truss', quantity: 1 },
      { id: 'res_ss_2', name: 'Pillar Speakers with Mic', quantity: 2 },
      { id: 'res_ss_3', name: 'Flyer Pamphlet Holders', quantity: 4 }
    ]
  },
  {
    id: 'm_beer_garden',
    title: 'Beer Garden Lounge',
    category: 'stall',
    x: 88,
    y: 58,
    iconName: 'beer',
    description: 'Restricted 21+ adult beverage garden, serving liquor and premium hops.',
    notes: 'Security checked entrance. Wristbands compulsory before purchase.',
    capacity: '120 Patrons max',
    powerLoad: '12kW Stable',
    resources: [
      { id: 'res_bg_1', name: 'High-top Beer Tables', quantity: 6 },
      { id: 'res_bg_2', name: 'Draught Beer Chilled Coolers', quantity: 2 },
      { id: 'res_bg_3', name: 'Safety Guard Rails', quantity: 15 }
    ]
  },
  {
    id: 'm_security_command',
    title: 'Main Security Command',
    category: 'health_and_security',
    x: 35,
    y: 84,
    iconName: 'security',
    description: 'Central operations hub for SLAF guards and event security managers.',
    notes: 'Receives radio updates from across the Grounds; directs field responses.',
    capacity: '8 Officers max',
    powerLoad: '4kW UPS Core',
    resources: [
      { id: 'res_sc_1', name: 'VHF Handheld Radios', quantity: 15 },
      { id: 'res_sc_2', name: 'Operations Map Table Board', quantity: 1 },
      { id: 'res_sc_3', name: 'High-intensity Spotlights', quantity: 2 }
    ]
  },
  {
    id: 'm_police_checkpoint',
    title: 'Police Support Outpost',
    category: 'health_and_security',
    x: 65,
    y: 84,
    iconName: 'security',
    description: 'Civil security liaison command, assisting with perimeter checks and traffic regulations.',
    notes: 'Handles public order and external road traffic flows.',
    capacity: '6 Police Officers',
    powerLoad: '2kW Standard',
    resources: [
      { id: 'res_pc_1', name: 'Traffic Guidance Batons', quantity: 4 },
      { id: 'res_pc_2', name: 'Metal Detector Wands', quantity: 4 }
    ]
  },
  {
    id: 'm_first_aid',
    title: 'First Aid & Ambulance Bay',
    category: 'health_and_security',
    x: 88,
    y: 75,
    iconName: 'security',
    description: 'Fully-equipped medical tent with live standby paramedics and active SLAF Ambulance.',
    notes: 'Direct escape route available through Logistical Support Gate in case of emergency transfers.',
    capacity: '12 Emergency victims',
    powerLoad: '5kW Generator UPS',
    resources: [
      { id: 'res_fa_1', name: 'Emergency Beds & Stretchers', quantity: 3 },
      { id: 'res_fa_2', name: 'Oxygen Cylinders & Masks', quantity: 2 },
      { id: 'res_fa_3', name: 'First Aid Medical Kit Boxes', quantity: 4 },
      { id: 'res_fa_4', name: 'Standby Medical Ambulance', quantity: 1 }
    ]
  },
  {
    id: 'm_vip_washrooms',
    title: 'VIP Restrooms',
    category: 'hospitality',
    x: 14,
    y: 12,
    iconName: 'washroom',
    description: 'State-of-the-art premium washrooms configured with continuous water and sanitization supplies.',
    notes: 'Located adjacent to the VIP Green Room. Checked regularly for cleanliness.',
    capacity: '5 Stations max',
    powerLoad: '3kW Standard',
    resources: [
      { id: 'res_vw_1', name: 'Running Water Tank (1000L)', quantity: 1 },
      { id: 'res_vw_2', name: 'Hand Wash Soap Dispensers', quantity: 4 },
      { id: 'res_vw_3', name: 'Exhaust Fan Ventilators', quantity: 2 }
    ]
  },
  {
    id: 'm_gen_washrooms_a',
    title: 'General Washrooms (Left Wing)',
    category: 'hospitality',
    x: 8,
    y: 72,
    iconName: 'washroom',
    description: 'Multi-cubicle general public restrooms situated in the left perimeter zone.',
    notes: 'Dedicated waste pipelines connected securely.',
    capacity: '12 cubicles',
    powerLoad: '4kW Standard',
    resources: [
      { id: 'res_gwa_1', name: 'Water Tank Tower', quantity: 1 },
      { id: 'res_gwa_2', name: 'Towel & Tissue Dispensers', quantity: 6 }
    ]
  },
  {
    id: 'm_gen_washrooms_b',
    title: 'General Washrooms (Right Wing)',
    category: 'hospitality',
    x: 92,
    y: 72,
    iconName: 'washroom',
    description: 'Multi-cubicle general public restrooms situated in the right perimeter zone.',
    notes: 'Fully lit up for evening convenience.',
    capacity: '12 cubicles',
    powerLoad: '4kW Standard',
    resources: [
      { id: 'res_gwb_1', name: 'Water Tank Tower', quantity: 1 },
      { id: 'res_gwb_2', name: 'Towel & Tissue Dispensers', quantity: 6 }
    ]
  },
  {
    id: 'm_crew_catering',
    title: 'Crew Dining Hall',
    category: 'hospitality',
    x: 82,
    y: 22,
    iconName: 'vip',
    description: 'Dedicated dining hall and buffet point for event workers, dancers, and security forces.',
    notes: 'Catering meals served in batches. Open 11:00 AM to 11:30 PM.',
    capacity: '80 seats concurrently',
    powerLoad: '12kW Food warmers',
    resources: [
      { id: 'res_cc_1', name: 'Buffet Warmers', quantity: 4 },
      { id: 'res_cc_2', name: 'Large Wooden Benches', quantity: 12 },
      { id: 'res_cc_3', name: 'Industrial Drinking Water Coolers', quantity: 2 }
    ]
  },
  {
    id: 'm_led_backdrop',
    title: 'LED Screen Setup',
    category: 'production',
    x: 50,
    y: 9,
    iconName: 'tv',
    description: 'Huge scenic LED background panel delivering dynamic backdrops and artist custom visuals.',
    notes: 'Rigged to structural heavy trusses.',
    capacity: 'Visual technicians only',
    powerLoad: '90kW Stable',
    resources: [
      { id: 'res_led_1', name: 'P3 Outdoor LED Modules', quantity: 280 },
      { id: 'res_led_2', name: 'LED Video Processor Engine', quantity: 2 }
    ]
  },
  {
    id: 'm_delay_left',
    title: 'Audio Delay Tower - Left',
    category: 'production',
    x: 32,
    y: 52,
    iconName: 'music',
    description: 'Supplementary sound amplification tower positioned on the left side of the audience belt to correct acoustic travel.',
    notes: 'Delay time configured to 42 milliseconds.',
    capacity: 'N/A Standalone',
    powerLoad: '15kW Stable',
    resources: [
      { id: 'res_dl_1', name: 'Dual 12-inch Line Array Elements', quantity: 4 },
      { id: 'res_dl_2', name: 'Power Amplifiers Cabinet', quantity: 1 }
    ]
  },
  {
    id: 'm_delay_right',
    title: 'Audio Delay Tower - Right',
    category: 'production',
    x: 68,
    y: 52,
    iconName: 'music',
    description: 'Supplementary sound amplification tower positioned on the right side of the audience belt to correct acoustic travel.',
    notes: 'Delay time configured to 42 milliseconds.',
    capacity: 'N/A Standalone',
    powerLoad: '15kW Stable',
    resources: [
      { id: 'res_dr_1', name: 'Dual 12-inch Line Array Elements', quantity: 4 },
      { id: 'res_dr_2', name: 'Power Amplifiers Cabinet', quantity: 1 }
    ]
  },
  {
    id: 'm_instrument_storage',
    title: 'Instrument Vault Room',
    category: 'hospitality',
    x: 32,
    y: 22,
    iconName: 'vip',
    description: 'Highly secure climatized container room storing artist guitars, drums, keyboards, and acoustic kits.',
    notes: 'Requires dual-custody access (crew chief + band lead).',
    capacity: 'Strict secure vault',
    powerLoad: '5kW AC unit',
    resources: [
      { id: 'res_iv_1', name: 'Air Dehumidifier Machine', quantity: 1 },
      { id: 'res_iv_2', name: 'Heavy Instrument Flight Cases', quantity: 10 }
    ]
  },
  {
    id: 'm_media_press',
    title: 'Media & Press Lounge',
    category: 'hospitality',
    x: 20,
    y: 32,
    iconName: 'vip',
    description: 'Designated media lounge for journalists, interview sessions, and event live stream operators.',
    notes: 'Equipped with dedicated fiber line internet access points.',
    capacity: '30 Journalists',
    powerLoad: '10kW Stable internet',
    resources: [
      { id: 'res_mp_1', name: 'Fiber Optic Router Point', quantity: 1 },
      { id: 'res_mp_2', name: 'Interview Branding Press Backdrop', quantity: 1 }
    ]
  },
  {
    id: 'm_vip_lounge',
    title: 'VIP Seating Lounge',
    category: 'hospitality',
    x: 28,
    y: 38,
    iconName: 'vip',
    description: 'Elevated premium spectator section with comfortable seating, exclusive amenities, and pristine stage visibility.',
    notes: 'Restricted access via active VIP ticket validator gate.',
    capacity: '150 VIP Patrons',
    powerLoad: '4kW Ambient lights',
    resources: [
      { id: 'res_vl_1', name: 'Luxury Cushioned Chairs', quantity: 80 },
      { id: 'res_vl_2', name: 'Premium Coffee Tables', quantity: 10 }
    ]
  },
  {
    id: 'm_backstage_gate',
    title: 'Backstage Security Gate',
    category: 'access',
    x: 38,
    y: 12,
    iconName: 'entrance',
    description: 'Access checkpoint dividing Backstage Production belt from spectator audience zone.',
    notes: 'Guarded continuously by military staff.',
    capacity: 'Credential scanning ONLY',
    powerLoad: '2kW Standby',
    resources: [
      { id: 'res_bsg_1', name: 'ID Credential scanners', quantity: 2 },
      { id: 'res_bsg_2', name: 'Double Metal Barrier Gates', quantity: 1 }
    ]
  }
];

export const getZoneStatus = (x: number, y: number, category: string) => {
  const dx = x - 50;
  const dy = y - 50;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (category === 'production') {
    return {
      inside: dist < 30,
      radius: Math.round(dist),
      zone: dist < 30 ? 'Seated Audience Area' : 'Standing/Outer Area',
      safe: true,
      hint: 'Production structures can be positioned as needed.'
    };
  }
  
  if (dist < 30) {
    return {
      inside: true,
      radius: Math.round(dist),
      zone: 'Seated Audience Area',
      safe: false,
      hint: '⚠️ WARNING: Stalls & facilities MUST be placed outside the circular audience zone (Radius: 30 units).'
    };
  }
  
  return {
    inside: false,
    radius: Math.round(dist),
    zone: dist <= 44 ? 'Standing Audience Area' : 'External Facilities Belt',
    safe: true,
    hint: 'Safe: Facility is positioned outside the circular audience zone.'
  };
};

export const EventMapTab: React.FC = () => {
  const [markers, setMarkersRaw] = useState<MapMarker[]>(() => {
    const saved = localStorage.getItem('chakra_event_layout_markers_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: MapMarker) => ({
            ...m,
            resources: m.resources ? m.resources.filter(r => !r.id.startsWith('res_df_')) : []
          }));
        }
      } catch (_) {}
    }
    return INITIAL_MARKERS;
  });

  const [customCategories, setCustomCategoriesRaw] = useState<string[]>(() => {
    const saved = localStorage.getItem('chakra_event_custom_categories_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return [];
  });

  const setMarkers = (updater: MapMarker[] | ((prev: MapMarker[]) => MapMarker[])) => {
    const nextMarkers = typeof updater === 'function' ? updater(markers) : updater;
    setMarkersRaw(nextMarkers);
    localStorage.setItem('chakra_event_layout_markers_v4', JSON.stringify(nextMarkers));
    
    // Dispatch event to notify layout modifications
    window.dispatchEvent(new Event('chakra_map_data_changed'));

    const sync = async () => {
      const oldIds = new Set(markers.map(m => m.id));
      const newIds = new Set(nextMarkers.map(m => m.id));

      // Deleted
      for (const id of oldIds) {
        if (!newIds.has(id)) {
          try {
            await deleteDoc(doc(db, 'map_markers', id));
          } catch (err) {
            console.error("Failed to delete marker from Firestore:", err);
          }
        }
      }

      // New or Modified
      for (const m of nextMarkers) {
        const oldVal = markers.find(o => o.id === m.id);
        if (!oldVal || JSON.stringify(oldVal) !== JSON.stringify(m)) {
          try {
            await setDoc(doc(db, 'map_markers', m.id), m);
          } catch (err) {
            console.error("Failed to update marker in Firestore:", err);
          }
        }
      }
    };
    sync();
  };

  const setCustomCategories = (updater: string[] | ((prev: string[]) => string[])) => {
    const nextCats = typeof updater === 'function' ? updater(customCategories) : updater;
    setCustomCategoriesRaw(nextCats);
    localStorage.setItem('chakra_event_custom_categories_v4', JSON.stringify(nextCats));

    const sync = async () => {
      const oldSet = new Set(customCategories);
      const newSet = new Set(nextCats);

      for (const cat of oldSet) {
        if (!newSet.has(cat)) {
          try {
            await deleteDoc(doc(db, 'map_categories', cat));
          } catch (err) {
            console.error("Failed to delete category from Firestore:", err);
          }
        }
      }

      for (const cat of newSet) {
        if (!oldSet.has(cat)) {
          try {
            await setDoc(doc(db, 'map_categories', cat), {});
          } catch (err) {
            console.error("Failed to add category to Firestore:", err);
          }
        }
      }
    };
    sync();
  };

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>('m_stage_setup');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time synchronization unconditionally
  useEffect(() => {
    const unsubMarkers = onSnapshot(collection(db, 'map_markers'), (snapshot) => {
      const list: MapMarker[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as MapMarker;
        list.push({
          ...data,
          resources: data.resources ? data.resources.filter(r => !r.id.startsWith('res_df_')) : []
        });
      });
      if (list.length > 0) {
        setMarkersRaw(list);
        localStorage.setItem('chakra_event_layout_markers_v4', JSON.stringify(list));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'map_markers');
    });

    const unsubCats = onSnapshot(collection(db, 'map_categories'), (snapshot) => {
      const list: string[] = [];
      snapshot.forEach(doc => {
        list.push(doc.id);
      });
      const uniqueCats = Array.from(new Set(list)).filter(Boolean);
      if (uniqueCats.length > 0) {
        setCustomCategoriesRaw(uniqueCats);
        localStorage.setItem('chakra_event_custom_categories_v4', JSON.stringify(uniqueCats));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'map_categories');
    });

    const seedMapDataIfEmpty = async () => {
      try {
        let markerSnap;
        try {
          markerSnap = await getDocs(collection(db, 'map_markers'));
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, 'map_markers');
          return;
        }

        if (markerSnap.empty) {
          // Sync with local fallback / INITIAL_MARKERS
          let initialData: MapMarker[] = [];
          if (markers.length > 0) {
            initialData = markers;
          } else {
            const saved = localStorage.getItem('chakra_event_layout_markers_v4');
            if (saved) {
              try {
                initialData = JSON.parse(saved);
              } catch (_) {}
            }
          }
          if (!initialData || initialData.length === 0) {
            initialData = INITIAL_MARKERS;
          }

          const defaultMarkers = initialData.map(m => ({
            ...m,
            resources: m.resources ? m.resources.filter(r => !r.id.startsWith('res_df_')) : []
          }));

          for (const m of defaultMarkers) {
            try {
              await setDoc(doc(db, 'map_markers', m.id), m);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `map_markers/${m.id}`);
            }
          }
        }

        let catSnap;
        try {
          catSnap = await getDocs(collection(db, 'map_categories'));
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, 'map_categories');
          return;
        }

        if (catSnap.empty) {
          let initialCats: string[] = [];
          if (customCategories.length > 0) {
            initialCats = customCategories;
          } else {
            const savedCats = localStorage.getItem('chakra_event_custom_categories_v4');
            if (savedCats) {
              try {
                initialCats = JSON.parse(savedCats);
              } catch (_) {}
            }
          }

          for (const cat of initialCats) {
            try {
              await setDoc(doc(db, 'map_categories', cat), {});
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `map_categories/${cat}`);
            }
          }
        }
      } catch (err) {
        console.error("Failed to seed layout map data:", err);
      }
    };
    seedMapDataIfEmpty();

    return () => {
      unsubMarkers();
      unsubCats();
    };
  }, []);

  useEffect(() => {
    const fetchGitDataOnMount = async () => {
      try {
        const res = await fetch("/api/github/data");
        const json = await res.json();
        if (json.success) {
          if (json.markers && json.markers.length > 0) {
            setMarkers(json.markers);
          }
          if (json.customCategories && json.customCategories.length > 0) {
            setCustomCategories(json.customCategories);
          }
        }
      } catch (e) {
        console.error("Failed to load initial GitHub map data on mount", e);
      }
    };
    fetchGitDataOnMount();
  }, []);

  useEffect(() => {
    localStorage.setItem('chakra_event_custom_categories_v4', JSON.stringify(customCategories));
    window.dispatchEvent(new Event('chakra_map_data_changed'));
  }, [customCategories]);

  // Custom marker configuration state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>('production');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newX, setNewX] = useState<number>(50);
  const [newY, setNewY] = useState<number>(50);
  const [newCapacity, setNewCapacity] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Edit marker states
  const [isEditingMarker, setIsEditingMarker] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('production');
  const [editCustomCategoryName, setEditCustomCategoryName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editPowerLoad, setEditPowerLoad] = useState('');
  const [editX, setEditX] = useState<number>(50);
  const [editY, setEditY] = useState<number>(50);

  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  // Keyboard controls for fine-tuning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeMarkerId) return;

      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!arrowKeys.includes(e.key)) return;

      e.preventDefault();

      let diffX = 0;
      let diffY = 0;
      // Normal arrow moves by 1 unit, Shift+Arrow moves by 0.2 units for fine-tuning!
      const step = e.shiftKey ? 0.2 : 1.0;

      if (e.key === 'ArrowUp') diffY = -step;
      if (e.key === 'ArrowDown') diffY = step;
      if (e.key === 'ArrowLeft') diffX = -step;
      if (e.key === 'ArrowRight') diffX = step;

      setMarkers(prev =>
        prev.map(m => {
          if (m.id === activeMarkerId) {
            let nextX = m.x + diffX;
            let nextY = m.y + diffY;

            nextX = Math.min(Math.max(nextX, 3), 97);
            nextY = Math.min(Math.max(nextY, 3), 97);

            nextX = Number(nextX.toFixed(1));
            nextY = Number(nextY.toFixed(1));

            // Also synchronize edit coordinates input fields if editing this marker
            if (isEditingMarker) {
              setEditX(nextX);
              setEditY(nextY);
            }

            return { ...m, x: nextX, y: nextY };
          }
          return m;
        })
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMarkerId, isEditingMarker, setMarkers]);

  // Mouse and touch drag handlers
  useEffect(() => {
    if (!draggingMarkerId) return;

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!mapContainerRef.current) return;
      isDraggingRef.current = true;

      const rect = mapContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      let x = ((clientX - rect.left) / rect.width) * 100;
      let y = ((clientY - rect.top) / rect.height) * 100;

      x = Math.min(Math.max(x, 3), 97);
      y = Math.min(Math.max(y, 3), 97);

      x = Math.round(x);
      y = Math.round(y);

      setMarkersRaw(prev =>
        prev.map(m => (m.id === draggingMarkerId ? { ...m, x, y } : m))
      );
    };

    const handleGlobalUp = () => {
      if (isDraggingRef.current) {
        setMarkers(prev => {
          const draggedMarker = prev.find(m => m.id === draggingMarkerId);
          if (draggedMarker && activeMarkerId === draggingMarkerId) {
            setEditX(draggedMarker.x);
            setEditY(draggedMarker.y);
          }
          return [...prev]; // returns new reference to trigger Firestore sync
        });

        // Delay resetting isDraggingRef.current to false so button clicks are suppressed
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 50);
      }

      setDraggingMarkerId(null);
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [draggingMarkerId, activeMarkerId, setMarkers]);

  // Custom iframe-safe dialog confirmation state replacing browser-native blockable dialogues
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = "Confirm",
    cancelText = "Cancel"
  ) => {
    setConfirmDialog({ title, message, onConfirm, confirmText, cancelText });
  };

  // Track map cursor for futuristic digital crosshair HUD
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic list of categories combined with original and custom ones
  const getUniqueCategories = () => {
    const uniques = new Set<string>();
    DEFAULT_CATEGORIES.forEach(c => uniques.add(c));
    customCategories.forEach(c => uniques.add(c));
    markers.forEach(m => {
      if (m.category && m.category !== '_new_') uniques.add(m.category);
    });
    return Array.from(uniques);
  };

  // Synchronize local storage
  useEffect(() => {
    localStorage.setItem('chakra_event_layout_markers_v4', JSON.stringify(markers));
    window.dispatchEvent(new Event('chakra_map_data_changed'));
  }, [markers]);

  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const finalCategory = newCategory === '_new_' 
      ? (customCategoryName.trim().toLowerCase() || 'custom') 
      : newCategory;

    // If they specified a custom category in the form, persist it to customCategories
    if (newCategory === '_new_' && customCategoryName.trim()) {
      const formatted = customCategoryName.trim().toLowerCase().replace(/\s+/g, '_');
      if (!DEFAULT_CATEGORIES.includes(formatted) && !customCategories.includes(formatted)) {
        setCustomCategories(prev => [...prev, formatted]);
      }
    }

    const performAdd = () => {
      const defaultResourcesFor = (title: string, cat: string): MapResource[] => {
        const markerId = 'm_' + Date.now();
        return [
          { id: `res_default_cnp_${markerId}_${Math.random().toString(36).substr(2, 4)}`, name: 'Canopy 10x10', quantity: 1 },
          { id: `res_default_tbl_${markerId}_${Math.random().toString(36).substr(2, 4)}`, name: 'Table', quantity: 1 },
          { id: `res_default_chr_${markerId}_${Math.random().toString(36).substr(2, 4)}`, name: 'Chairs', quantity: 2 },
          { id: `res_default_led_${markerId}_${Math.random().toString(36).substr(2, 4)}`, name: 'LED Bulb', quantity: 1 },
          { id: `res_default_s13_${markerId}_${Math.random().toString(36).substr(2, 4)}`, name: '13A Power Socket', quantity: 1 },
          { id: `res_default_s15_${markerId}_${Math.random().toString(36).substr(2, 4)}`, name: '15A Power Socket', quantity: 1 }
        ];
      };

      const newMarker: MapMarker = {
        id: 'm_' + Date.now(),
        title: newTitle.trim(),
        category: finalCategory,
        x: Math.min(Math.max(newX, 3), 97),
        y: Math.min(Math.max(newY, 3), 97),
        iconName: autoResolveIcon(newTitle.trim(), finalCategory),
        description: newDescription.trim() || 'Event operational infrastructure unit/stall.',
        notes: newNotes.trim() || 'Established in real-time layout board.',
        capacity: newCapacity.trim() || 'Standard unit',
        powerLoad: '10kW peak estimate',
        resources: defaultResourcesFor(newTitle.trim(), finalCategory)
      };

      setMarkers(prev => [...prev, newMarker]);
      setActiveMarkerId(newMarker.id);
      setNewTitle('');
      setNewCategory('production');
      setCustomCategoryName('');
      setNewDescription('');
      setNewNotes('');
      setNewCapacity('');
      setShowAddForm(false);
    };

    // Interactive circular zone check
    const zoneInfo = getZoneStatus(newX, newY, finalCategory);
    if (!zoneInfo.safe) {
      triggerConfirm(
        "🚨 RESTRICTION WARNING",
        `"${newTitle.trim()}" is positioned inside the seated audience circle (Distance: ${zoneInfo.radius} units from stage).\n\nAll non-production facilities must be placed outside the circular audience zone (Radius: 30 units).\n\nAre you sure you want to pin this anyway?`,
        performAdd,
        "Pin Stall Anyway",
        "Cancel"
      );
    } else {
      performAdd();
    }
  };

  const handleDeleteMarker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerConfirm(
      "CONFIRM DISMISSAL",
      "Are you sure you want to permanently dismiss this item from the active Event Layout plan?",
      () => {
        setMarkers(prev => prev.filter(m => m.id !== id));
        if (activeMarkerId === id) setActiveMarkerId(null);
      },
      "Dismiss Item",
      "Cancel"
    );
  };

  // Safe reset to blueprint schema template
  const handleResetToTemplate = () => {
    triggerConfirm(
      "REVERT LAYOUT",
      "Are you sure you want to revert the layout to the master template? This will remove all of your custom added stalls and data points.",
      () => {
        setMarkers(INITIAL_MARKERS);
        setActiveMarkerId('m_stage_setup');
      },
      "Revert Layout",
      "Cancel"
    );
  };

  const handleAddResource = (markerId: string, name: string, qty: number = 1) => {
    if (!name.trim()) return;
    setMarkers(prev => prev.map(m => {
      if (m.id === markerId) {
        const resources = m.resources || [];
        const existing = resources.find(r => r.name.toLowerCase() === name.trim().toLowerCase());
        if (existing) {
          return {
            ...m,
            resources: resources.map(r => r.id === existing.id ? { ...r, quantity: r.quantity + qty } : r)
          };
        } else {
          return {
            ...m,
            resources: [...resources, { id: 'res_' + Date.now() + Math.random().toString(36).substr(2, 4), name: name.trim(), quantity: qty }]
          };
        }
      }
      return m;
    }));
  };

  const handleUpdateResourceQty = (markerId: string, resourceId: string, qty: number) => {
    setMarkers(prev => prev.map(m => {
      if (m.id === markerId && m.resources) {
        return {
          ...m,
          resources: m.resources.map(r => r.id === resourceId ? { ...r, quantity: Math.max(1, qty) } : r)
        };
      }
      return m;
    }));
  };

  const handleUpdateResourceName = (markerId: string, resourceId: string, name: string) => {
    setMarkers(prev => prev.map(m => {
      if (m.id === markerId && m.resources) {
        return {
          ...m,
          resources: m.resources.map(r => r.id === resourceId ? { ...r, name } : r)
        };
      }
      return m;
    }));
  };

  const handleDeleteResource = (markerId: string, resourceId: string) => {
    setMarkers(prev => prev.map(m => {
      if (m.id === markerId && m.resources) {
        return {
          ...m,
          resources: m.resources.filter(r => r.id !== resourceId)
        };
      }
      return m;
    }));
  };

  // Capture user click directly onto map to position elements beautifully!
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) return;
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    // If add form is active, update form placement coordinates!
    if (showAddForm) {
      setNewX(clickX);
      setNewY(clickY);
    } else if (isEditingMarker) {
      // If edit mode is active, update the active coordinates for edit!
      setEditX(clickX);
      setEditY(clickY);
    } else {
      // Find if clicking near an existing marker to select it
      const clickedNear = markers.find(m => {
        const dx = m.x - clickX;
        const dy = m.y - clickY;
        return Math.sqrt(dx * dx + dy * dy) < 4; // click tolerance radius
      });
      if (clickedNear) {
        setActiveMarkerId(clickedNear.id);
      } else {
        // Switch to add form and preset coordinate beautifully
        setNewX(clickX);
        setNewY(clickY);
        setNewTitle(`Stall/Structure #${markers.length + 1}`);
        setShowAddForm(true);
      }
    }
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setHoveredCoords({ x, y });
  };

  const handleMapMouseLeave = () => {
    setHoveredCoords(null);
  };

  const getOverriddenColorClass = (title?: string, resolvedName?: string) => {
    if (!title) return null;
    const text = title.toLowerCase().trim();
    if (text.includes('beer') || text.includes('liquor') || resolvedName === 'beer') {
      return 'text-red-500';
    }
    if (
      text === 'band rest room' || text === 'artists rest room' || text === 'crew rest room' ||
      text.includes('band rest room') || text.includes('artists rest room') || text.includes('crew rest room') ||
      text.includes('artist rest room') || text === 'artist rest room'
    ) {
      return 'text-blue-500 font-bold';
    }
    return null;
  };

  const getMarkerIcon = (iconName: string, category: string, title?: string) => {
    const resolvedName = iconName === 'custom' || !iconName ? autoResolveIcon(title || '', category) : iconName;
    const overrideColor = getOverriddenColorClass(title, resolvedName);

    const renderIcon = (iconEl: React.ReactElement) => {
      if (overrideColor) {
        return React.cloneElement(iconEl, { 
          className: overrideColor 
        });
      }
      return iconEl;
    };

    switch (resolvedName) {
      case 'stage': 
        return renderIcon(<Sparkles size={14} className="text-[#FF6B00]" />);
      case 'foh': 
        return renderIcon(<Sliders size={14} className="text-cyan-400" />);
      case 'entrance': 
        return renderIcon(<Ticket size={14} className="text-amber-400" />);
      case 'vip': 
        return renderIcon(<Flame size={14} className="text-purple-400 animate-pulse" />);
      case 'media': 
        return renderIcon(<Film size={14} className="text-[#FF6B00]" />);
      case 'security': 
        return renderIcon(<Shield size={14} className="text-emerald-400" />);
      case 'stall': 
        return renderIcon(<Store size={14} className="text-[#FF6B00]" />);
      case 'utensils':
        return renderIcon(<Utensils size={14} className="text-yellow-400" />);
      case 'music':
        return renderIcon(<Music size={14} className="text-blue-400" />);
      case 'tv':
        return renderIcon(<Tv size={14} className="text-pink-400" />);
      case 'radio':
        return renderIcon(<Radio size={14} className="text-purple-400" />);
      case 'beer':
        return renderIcon(<Beer size={14} className="text-red-500" />);
      case 'washroom':
        return renderIcon(<Bath size={14} className="text-indigo-400" />);
      default: 
        if (category === 'stall') {
          return renderIcon(<Store size={14} className="text-orange-300" />);
        }
        if (category === 'production') {
          return renderIcon(<Sparkles size={14} className="text-[#FF6B00]" />);
        }
        if (category === 'access') {
          return renderIcon(<Ticket size={14} className="text-amber-400" />);
        }
        if (category === 'health_and_security') {
          return renderIcon(<Shield size={14} className="text-emerald-400" />);
        }
        if (category === 'hospitality') {
          return renderIcon(<Flame size={14} className="text-purple-400" />);
        }
        return renderIcon(<MapPin size={14} className="text-[#FF6B00]" />);
    }
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'production': 
        return { bg: 'bg-[#FF6B00]/10', border: 'border-[#FF6B00]/30', text: 'text-[#FF6B00]', label: 'Production' };
      case 'stall': 
        return { bg: 'bg-orange-400/10', border: 'border-orange-400/30', text: 'text-orange-300', label: 'Stall' };
      case 'access': 
        return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Access' };
      case 'health_and_security': 
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Health and Security' };
      case 'hospitality': 
        return { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', label: 'Hospitality' };
      default: 
        const label = category
          .replace(/[_-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        return { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-400', label: label || 'Custom Category' };
    }
  };

  const filteredMarkers = markers.filter(marker => {
    const matchesCategory = activeCategory === 'all' || marker.category === activeCategory;
    const matchesSearch = marker.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          marker.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedMarker = markers.find(m => m.id === activeMarkerId);

  // Calculation of consolidated resources
  const resourceSummaryList = (() => {
    const summaryMap: { [name: string]: { total: number; locations: { title: string; qty: number }[] } } = {};
    
    markers.forEach(marker => {
      if (marker.resources && Array.isArray(marker.resources)) {
        marker.resources.forEach(res => {
          const rawName = res.name.trim();
          if (!rawName) return;
          
          // Match case-insensitively but keep first capitalized name we encounter for key
          const normalized = rawName.toUpperCase();
          const matchedKey = Object.keys(summaryMap).find(k => k.toUpperCase() === normalized);
          const key = matchedKey || rawName;
          
          if (!summaryMap[key]) {
            summaryMap[key] = { total: 0, locations: [] };
          }
          
          summaryMap[key].total += res.quantity;
          summaryMap[key].locations.push({
            title: marker.title,
            qty: res.quantity
          });
        });
      }
    });

    return Object.entries(summaryMap).map(([name, data]) => ({
      name,
      total: data.total,
      locations: data.locations
    })).sort((a, b) => b.total - a.total); // Sort highest quantity first
  })();

  const categoryTotals = (() => {
    const counts: { [cat: string]: number } = {};
    markers.forEach(m => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return counts;
  })();

  return (
    <div className="space-y-6" id="event-blueprint-and-summary-wrapper">
      <div className="flex flex-col xl:flex-row gap-6 min-h-[580px]" id="event-layout-container">
      {/* LEFT SECTION: Layout Directory Panel */}
      <div className="w-full xl:w-80 bg-[#0C0C0C] rounded-3xl border border-white/10 p-5 flex flex-col justify-between overflow-hidden" id="layout-directory-panel">
        
        {/* Upper Search and Filtering Area */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
            <div>
              <h3 className="text-sm font-bold font-display text-white tracking-tight">Layout & Stalls Directory</h3>
              <span className="text-[9px] font-mono text-white/40 uppercase block tracking-wider">Chakra 360 Site Blueprint</span>
            </div>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setIsEditingMarker(false);
              }}
              className={`p-1.5 px-2.5 rounded-xl text-[9px] font-mono font-black transition flex items-center gap-1 cursor-pointer select-none border shrink-0 ${
                showAddForm
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20 hover:bg-[#FF6B00]/20'
              }`}
            >
              {showAddForm ? 'Close' : 'Add Item'}
            </button>
          </div>

          {/* New Item Inline Form */}
          {showAddForm && (
            <form onSubmit={handleAddMarker} className="space-y-2 bg-[#FF6B00]/5 p-3 rounded-2xl border border-[#FF6B00]/20 text-[10px] animate-fade-in">
              <span className="font-mono text-[8px] uppercase text-[#FF6B00] font-black tracking-widest block mb-0.5">✨ PIN NEW STALL / UNIT</span>
              
              <div>
                <label className="text-white/40 block font-mono mb-0.5 text-[8px] uppercase">Title / Name</label>
                <input 
                  type="text" 
                  required 
                  value={newTitle} 
                  autoFocus
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="e.g. Ceylon Spicy Kottu"
                  className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-white text-[10px] focus:outline-none focus:border-[#FF6B00]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/40 block font-mono mb-0.5 text-[8px] uppercase">Category</label>
                  <select 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-2 py-1 text-white text-[9px] focus:outline-none focus:border-[#FF6B00]/30"
                  >
                    {getUniqueCategories().map(cat => (
                      <option key={cat} value={cat}>
                        {getCategoryTheme(cat).label}
                      </option>
                    ))}
                    <option value="_new_">⟨Create New...⟩</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/40 block font-mono mb-0.5 text-[8px] uppercase">Capacity</label>
                  <input 
                    type="text" 
                    value={newCapacity} 
                    onChange={(e) => setNewCapacity(e.target.value)}
                    placeholder="e.g. 100 Pax"
                    className="w-full bg-black border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-[#FF6B00]/30"
                  />
                </div>
              </div>

              {newCategory === '_new_' && (
                <div className="bg-white/[0.02] border border-[#FF6B00]/20 p-2.5 rounded-xl space-y-1 animate-slide-down">
                  <label className="text-[#FF6B00] block font-mono mb-0.5 text-[8px] uppercase font-bold">Write Custom Category</label>
                  <input 
                    type="text"
                    required
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="e.g. fast_food, sponsors"
                    className="w-full bg-black border border-white/15 rounded-lg px-2 py-1 text-white text-[10px] focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/40 block font-mono mb-0.5 text-[8px] uppercase">Grid X (%)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={100}
                    value={newX} 
                    onChange={(e) => setNewX(parseInt(e.target.value) || 50)}
                    className="w-full bg-black border border-white/10 rounded-lg px-2 py-1 text-white text-[9px] font-mono"
                  />
                </div>
                <div>
                  <label className="text-white/40 block font-mono mb-0.5 text-[8px] uppercase">Grid Y (%)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={100}
                    value={newY} 
                    onChange={(e) => setNewY(parseInt(e.target.value) || 50)}
                    className="w-full bg-black border border-white/10 rounded-lg px-2 py-1 text-white text-[9px] font-mono"
                  />
                </div>
              </div>

              {/* REAL-TIME AUDIENCE CIRCLE BOUNDS DETECTOR */}
              {(() => {
                const info = getZoneStatus(newX, newY, newCategory === '_new_' ? (customCategoryName.trim().toLowerCase() || 'custom') : newCategory);
                if (!info.safe) {
                  return (
                    <div className="bg-red-650/10 border border-red-500/30 p-2 rounded-xl text-[8.5px] font-mono text-red-400 tracking-tight leading-normal animate-pulse">
                      {info.hint}
                    </div>
                  );
                }
                return (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-2 rounded-xl text-[8px] font-mono text-emerald-400/80 tracking-tight">
                    🎯 Boundary Check: {info.zone} - Safe Outside Zone (Distance: {info.radius} units)
                  </div>
                );
              })()}

              <div>
                <label className="text-white/40 block font-mono mb-0.5 text-[8px] uppercase">Description</label>
                <textarea 
                  value={newDescription} 
                  onChange={(e) => setNewDescription(e.target.value)} 
                  placeholder="Stall specifications and dimensions..."
                  rows={2}
                  className="w-full bg-black border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none text-[9px]"
                />
              </div>

              <div className="flex gap-2 pt-1 font-mono">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 py-1.5 rounded-lg text-white/50 text-[9px] font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[#FF6B00] text-black font-extrabold py-1.5 rounded-lg hover:brightness-110 text-[9px]"
                >
                  Pin Anchor
                </button>
              </div>
            </form>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-white/30" size={13} />
            <input 
              type="text" 
              placeholder="Filter stages and stalls..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B00]/40 transition"
              id="search-stalls"
            />
          </div>

          {/* Staging Categories */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest block font-bold">Filter Layout Category</span>
              <button 
                type="button"
                onClick={() => {
                  const name = prompt("Enter a name for the new category (e.g. VIP, Sponsors):");
                  if (name && name.trim()) {
                    const formatted = name.trim().toLowerCase().replace(/\s+/g, '_');
                    if (DEFAULT_CATEGORIES.includes(formatted) || customCategories.includes(formatted)) {
                      alert("This category already exists!");
                    } else {
                      setCustomCategories(prev => [...prev, formatted]);
                    }
                  }
                }}
                className="text-[8px] font-mono text-[#FF6B00] hover:underline flex items-center gap-0.5 cursor-pointer bg-[#FF6B00]/5 px-1.5 py-0.5 rounded border border-[#FF6B00]/20"
              >
                + Add Cat
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {['all', ...getUniqueCategories()].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-1 rounded text-[9px] font-mono uppercase font-bold transition cursor-pointer border ${
                    activeCategory === cat 
                      ? 'bg-[#FF6B00]/15 border-[#FF6B00]/40 text-[#FF6B00]' 
                      : 'bg-white/5 border-transparent text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat === 'all' ? 'All' : getCategoryTheme(cat).label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 my-2" />

          {/* Interactive Site Directory Points */}
          <div className="space-y-1.5 max-h-[180px] xl:max-h-[310px] overflow-y-auto scrollbar-thin">
            {filteredMarkers.length === 0 ? (
              <div className="text-center py-6 text-xs text-white/30 font-mono">
                No active stages or stalls match.
              </div>
            ) : (
              filteredMarkers.map(marker => {
                const theme = getCategoryTheme(marker.category);
                const isSelected = activeMarkerId === marker.id;
                return (
                  <div
                    key={marker.id}
                    onClick={() => {
                      setActiveMarkerId(marker.id);
                      setShowAddForm(false);
                    }}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                      isSelected 
                        ? 'bg-[#FF6B00]/10 border-[#FF6B00]/30 shadow-[0_0_12px_rgba(255,107,0,0.05)]' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex gap-2 min-w-0 flex-1">
                      <div className={`p-1.5 rounded-lg border shrink-0 ${theme.bg} ${theme.border} ${theme.text} self-center`}>
                        {getMarkerIcon(marker.iconName, marker.category, marker.title)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[11px] font-bold text-white truncate">{marker.title}</h4>
                        <div className="flex items-center gap-1 text-[8px] font-mono mt-0.5" onClick={(e) => e.stopPropagation()}>
                          <span className="text-white/40">Grid:</span>
                          <span className="text-zinc-500">X</span>
                          <input 
                            type="number"
                            min={1}
                            max={100}
                            value={marker.x}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                              setMarkers(prev => prev.map(m => m.id === marker.id ? { ...m, x: val } : m));
                            }}
                            className="w-8 bg-black border border-white/10 rounded px-1 text-center font-bold text-[#FF6B00] focus:outline-none focus:border-[#FF6B00]"
                            title="Edit X Coordinate"
                          />
                          <span className="text-zinc-500">Y</span>
                          <input 
                            type="number"
                            min={1}
                            max={100}
                            value={marker.y}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                              setMarkers(prev => prev.map(m => m.id === marker.id ? { ...m, y: val } : m));
                            }}
                            className="w-8 bg-black border border-white/10 rounded px-1 text-center font-bold text-[#FF6B00] focus:outline-none focus:border-[#FF6B00]"
                            title="Edit Y Coordinate"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <span className={`text-[8px] px-1.5 rounded uppercase font-mono border ${theme.border} ${theme.text} max-w-[80px] truncate`}>
                        {theme.label}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteMarker(marker.id, e)}
                        className="text-red-400/60 hover:text-red-400 p-1 rounded hover:bg-white/5 transition cursor-pointer"
                        title="Remove custom marker"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="pt-4 border-t border-white/5 space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setIsEditingMarker(false);
              }}
              className="py-2.5 bg-[#FF6B00]/5 hover:bg-[#FF6B00]/15 border border-[#FF6B00]/20 rounded-xl text-[10px] font-mono text-[#FF6B00] transition cursor-pointer flex items-center justify-center gap-1 uppercase font-bold"
            >
              <Plus size={11} /> {showAddForm ? 'Hide Form' : 'Pin Stall / Zone'}
            </button>
            <button
              onClick={handleResetToTemplate}
              className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-mono text-white/50 hover:text-white transition cursor-pointer uppercase font-bold flex items-center justify-center gap-1"
            >
              Reset Layout
            </button>
          </div>

          <div className="text-[8px] font-mono text-zinc-500 leading-relaxed bg-white/5 p-2.5 rounded-xl">
            <span className="text-[#FF6B00] font-bold block mb-0.5">📍 Visual Placing Tool:</span>
            Click directly on any blank region of the schema blueprint on the right to auto-position a new stall pin at that location.
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Deeply Stylized Interactive 2D Schematic Blueprint Grid Layout */}
      <div 
        className="flex-1 bg-[#090909] rounded-3xl border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden" 
        id="layout-canvas-panel"
      >
        {/* Background Decorative Tech Coordinates and Grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        
        {/* Top telemetry status bar */}
        <div className="flex items-center justify-between z-10 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-ping" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/80 font-bold flex items-center gap-1.5">
              <Compass className="text-[#FF6B00] animate-spin-slow" size={12} />
              SLAF Grounds Colombo 2D Layout Plan
            </span>
          </div>

          <div className="flex items-center gap-4 text-[9px] font-mono text-white/40">
            <span>Projection: 2D Blueprint Ortho</span>
            {hoveredCoords && (
              <span className="text-white/70 bg-white/5 px-2 py-0.5 rounded border border-white/15">
                CUR COORDS: <strong className="text-[#FF6B00]">X:{hoveredCoords.x} Y:{hoveredCoords.y}</strong>
              </span>
            )}
          </div>
        </div>

        {/* THE SCHEMATIC VECTOR GROUND PLAN (Interactive clicking enabled) */}
        <div 
          ref={mapContainerRef}
          onClick={handleMapClick}
          onMouseMove={handleMapMouseMove}
          onMouseLeave={handleMapMouseLeave}
          className="relative w-full aspect-square max-w-[480px] xl:max-w-[500px] mx-auto bg-zinc-950 rounded-2xl border border-white/5 overflow-hidden my-4 cursor-crosshair group shadow-2xl shadow-black"
          id="event-blueprint-map"
        >
          {/* SVG Map Schematics Infrastructure Grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="minorGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              </pattern>
              <pattern id="majorGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                <rect width="50" height="50" fill="url(#minorGrid)" />
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,107,0,0.08)" strokeWidth="1" />
              </pattern>
            </defs>
            {/* Grid overlay */}
            <rect width="100%" height="100%" fill="url(#majorGrid)" />

            {/* Circular Seated Audience Area with 30-unit radius (30% radius on 100% canvas) in SVG */}
            <circle cx="50%" cy="50%" r="30%" fill="rgba(255,107,0,0.02)" stroke="rgba(255,107,0,0.3)" strokeWidth="1.5" strokeDasharray="6,4" />
            
            {/* Standing Audience outer boundary circle */}
            <circle cx="50%" cy="50%" r="43%" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1" strokeDasharray="4,4" />
            
            {/* Concentric helper distances loops from Stage */}
            <circle cx="50%" cy="50%" r="15%" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="1,5" />

            {/* Outer Security & Event boundaries */}
            <rect x="3%" y="3%" width="94%" height="94%" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
            <rect x="4%" y="4%" width="92%" height="92%" fill="none" stroke="rgba(16,185,129,0.1)" strokeWidth="1" strokeDasharray="10,6" />

            {/* Axis helper alignment crosshairs */}
            <line x1="50%" y1="4%" x2="50%" y2="96%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,12" />
            <line x1="4%" y1="50%" x2="96%" y2="50%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,12" />

            {/* Layout labels printed in mono style */}
            <text x="50%" y="38%" fill="rgba(255,107,0,0.3)" fontSize="8" fontFamily="monospace" textAnchor="middle" letterSpacing="1" fontWeight="bold">📌 SEATED AUDIENCE SECTION</text>
            <text x="50%" y="42%" fill="rgba(255,107,0,0.2)" fontSize="6.5" fontFamily="monospace" textAnchor="middle" letterSpacing="0.5">INNER ZONE (RADIUS 30 UNITS)</text>
            
            <text x="50%" y="12%" fill="rgba(6,182,212,0.3)" fontSize="8" fontFamily="monospace" textAnchor="middle" letterSpacing="1.5" fontWeight="bold">👥 STANDING AUDIENCE ZONE</text>
            <text x="50%" y="16%" fill="rgba(6,182,212,0.2)" fontSize="6.5" fontFamily="monospace" textAnchor="middle" letterSpacing="0.5">OUTSIDE THE CIRCULAR SEATED BELT</text>
            
            <text x="53%" y="97.5%" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="monospace" textAnchor="middle" letterSpacing="0.5">STALLS & FACILITIES MUST BE OUTSIDE SEATED BELT (COORDS DIST &gt; 30)</text>
          </svg>

          {/* Center Stage Arena performance backplate */}
          <div className="absolute top-[42%] left-[42%] w-[16%] h-[16%] bg-gradient-radial from-[#FF6B00]/15 via-black to-transparent border border-[#FF6B00]/30 rounded-full flex flex-col items-center justify-center pointer-events-none z-0">
            <div className="w-[85%] h-[85%] border border-[#FF6B00]/20 rounded-full border-dashed animate-spin-slow flex items-center justify-center">
              <Sparkles className="text-[#FF6B00]/70 animate-pulse" size={12} />
            </div>
            <span className="text-[6px] text-[#FF6B00] font-mono tracking-widest uppercase font-extrabold absolute -top-4 px-1 py-0.5 bg-black/90 border border-[#FF6B00]/20 rounded shadow-lg">CENTER STAGE</span>
          </div>

          {/* Seated Area visual circular bounds */}
          <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] border border-dashed border-[#FF6B00]/10 rounded-full bg-[#FF6B00]/[0.005] pointer-events-none flex items-center justify-center">
            <span className="text-[6px] text-[#FF6B00]/25 font-mono tracking-widest uppercase font-black absolute bottom-4">SEATED AUDIENCE OUTER CIRCLE</span>
          </div>

          {/* Visual Compass design */}
          <div className="absolute bottom-4 right-4 pointer-events-none opacity-40">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
              <Compass className="text-white animate-spin-slow" size={18} />
              <div className="absolute text-[6px] font-mono text-white/50 -top-1 left-4">N</div>
            </div>
          </div>

          {/* Dynamic Helper Overlay when in Placement Mode */}
          {showAddForm && (
            <div className="absolute inset-0 bg-[#FF6B00]/5 border-2 border-dashed border-[#FF6B00]/25 pointer-events-none flex items-center justify-center">
              <div className="bg-black/90 p-3 rounded-xl border border-[#FF6B00]/40 text-center space-y-1">
                <Crosshair className="text-[#FF6B00] animate-pulse mx-auto" size={16} />
                <span className="text-[10px] font-mono font-bold text-white block uppercase">Interactive Position Mode</span>
                <p className="text-[8px] text-zinc-400">Click anywhere on the schematic layout to reposition the new anchor!</p>
                <div className="inline-block px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-mono text-white">
                  Target Coords: X{newX}Y{newY}
                </div>
              </div>
            </div>
          )}

          {isEditingMarker && (
            <div className="absolute inset-0 bg-[#FF6B00]/5 border-2 border-dashed border-[#FF6B00]/20 pointer-events-none flex items-center justify-center">
              <div className="bg-black/95 p-3 rounded-xl border border-[#FF6B00]/30 text-center space-y-1 max-w-[240px] shadow-lg shadow-black">
                <Crosshair className="text-[#FF6B00] animate-pulse mx-auto" size={16} />
                <span className="text-[10px] font-mono font-bold text-white block uppercase">Interactive Relocate Mode</span>
                <p className="text-[8px] text-zinc-400">Click anywhere on the schematic blueprint layout plan to immediately reposition this item!</p>
                <div className="inline-block px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-mono text-[#FF6B00] font-bold">
                  Target Coords: X{editX} Y{editY}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE MAP PINS INTERACTIVE RENDER */}
          {filteredMarkers.map(m => {
            const theme = getCategoryTheme(m.category);
            const isSelected = activeMarkerId === m.id;
            const isDragged = draggingMarkerId === m.id;
            
            return (
              <button
                key={m.id}
                onMouseDown={(e) => {
                  if (e.button !== 0) return; // Only drag with left click
                  e.stopPropagation();
                  setActiveMarkerId(m.id);
                  setDraggingMarkerId(m.id);
                  isDraggingRef.current = false;
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setActiveMarkerId(m.id);
                  setDraggingMarkerId(m.id);
                  isDraggingRef.current = false;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDraggingRef.current) return;
                  setActiveMarkerId(m.id);
                  setShowAddForm(false);
                  setIsEditingMarker(false);
                }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 focus:outline-none z-10 hover:z-30 select-none ${
                  isDragged
                    ? 'cursor-grabbing scale-110 z-50'
                    : isSelected
                    ? 'cursor-grab scale-105 z-30'
                    : 'cursor-grab transition-all duration-300'
                }`}
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
              >
                {/* Visual marker container with custom category colors */}
                <div className="relative flex items-center justify-center">
                  
                  {/* Outer breathing ring for selected or special items */}
                  {isSelected && (
                    <span className="absolute w-8 h-8 rounded-full border border-dashed border-[#FF6B00] animate-spin-slow" />
                  )}
                  {(isSelected || m.id === 'm_stage') && (
                    <span className={`absolute w-10 h-10 rounded-full opacity-65 animate-ping ${
                      isSelected ? 'bg-[#FF6B00]/10' : 'bg-cyan-500/[0.03]'
                    }`} />
                  )}

                  {/* Core Icon Circular Badge - group/icon hover trigger to show tooltip ONLY on direct hover of this specific badge */}
                  <div className={`p-1.5 rounded-xl border shadow-2xl relative transition-all duration-300 group/icon ${
                    isSelected 
                      ? 'bg-[#FF6B00] border-white shadow-[0_0_15px_rgba(255,107,0,0.5)] text-black' 
                      : `bg-black/95 border-white/15 hover:border-white/50 text-white ${theme.bg}`
                  }`}>
                    {getMarkerIcon(m.iconName, m.category, m.title)}

                    {/* Micro floating tooltip on direct hover of the icon badge */}
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2.5 px-2 py-1 bg-black border border-white/20 text-[8px] text-white rounded shadow-2xl opacity-0 group-hover/icon:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none font-mono uppercase tracking-wider z-50">
                      {m.title}
                    </span>
                  </div>

                  {/* Tiny pulsing indicator */}
                  {isSelected && (
                    <span className="absolute -bottom-1 h-2 w-2 rounded-full bg-white border border-black shadow" />
                  )}

                  {/* Premium real-time dynamic coordinates overlay while active/dragged */}
                  {(isDragged || isSelected) && (
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/95 text-[8px] text-[#FF6B00] font-mono font-bold px-1.5 py-0.5 rounded border border-[#FF6B00]/40 z-50 whitespace-nowrap shadow-lg shadow-black">
                      X:{Math.round(m.x)} Y:{Math.round(m.y)}
                    </div>
                  )}
                </div>

              </button>
            );
          })}
        </div>

        {/* BOTTOM HUD PANEL: Detailed Staging Specification Block */}
        <div className="bg-[#0C0C0C] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-stretch justify-between gap-4 z-10" id="bottom-hud-details-panel">
          
          {selectedMarker ? (
            isEditingMarker ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const updatedCategory = editCategory === '_new_' 
                    ? (editCustomCategoryName.trim().toLowerCase() || 'custom') 
                    : editCategory;
                  
                  const performSave = () => {
                    setMarkers(prev => prev.map(m => {
                      if (m.id === selectedMarker.id) {
                        return {
                          ...m,
                          title: editTitle.trim(),
                          category: updatedCategory,
                          iconName: autoResolveIcon(editTitle.trim(), updatedCategory),
                          description: editDescription.trim() || 'Custom operational infrastructure.',
                          notes: editNotes.trim() || undefined,
                          capacity: editCapacity.trim() || undefined,
                          powerLoad: editPowerLoad.trim() || undefined,
                          x: Math.min(Math.max(editX, 3), 97),
                          y: Math.min(Math.max(editY, 3), 97)
                        };
                      }
                      return m;
                    }));
                    setIsEditingMarker(false);
                  };

                  // Interactive circular zone check during edit submission
                  const zoneInfo = getZoneStatus(editX, editY, updatedCategory);
                  if (!zoneInfo.safe) {
                    triggerConfirm(
                      "🚨 RESTRICTION WARNING",
                      `"${editTitle.trim()}" is positioned inside the seated audience circle (Distance: ${zoneInfo.radius} units from stage).\n\nAll non-production facilities must be placed outside the circular audience zone (Radius: 30 units).\n\nDo you want to apply these coordinates anyway?`,
                      performSave,
                      "Apply Coordinates",
                      "Cancel"
                    );
                  } else {
                    performSave();
                  }
                }}
                className="flex-1 space-y-3 p-1 text-[10px]"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
                    <span className="font-mono font-black text-white uppercase tracking-wider">🛠️ Edit Stall / Anchor Details</span>
                  </div>
                  <div className="flex gap-2 font-mono">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingMarker(false)} 
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/50 text-[9px] font-bold transition select-none cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-2.5 py-1 bg-[#FF6B00] text-black font-extrabold rounded-lg hover:brightness-110 text-[9px] transition select-none cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-white/40 block font-mono text-[8px] uppercase">Title / Anchor Name</label>
                    <input 
                      type="text" 
                      required 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#FF6B00]/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/40 block font-mono text-[8px] uppercase">Category</label>
                    <select 
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-[#FF6B00]/30"
                    >
                      {getUniqueCategories().map(cat => (
                        <option key={cat} value={cat}>
                          {getCategoryTheme(cat).label}
                        </option>
                      ))}
                      <option value="_new_">⟨Create New Category...⟩</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-white/40 block font-mono text-[8px] uppercase">Capacity</label>
                      <input 
                        type="text" 
                        value={editCapacity}
                        onChange={(e) => setEditCapacity(e.target.value)}
                        placeholder="e.g. 15,000 Pax"
                        className="w-full bg-black border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-[#FF6B00]/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-white/40 block font-mono text-[8px] uppercase">Power Load</label>
                      <input 
                        type="text" 
                        value={editPowerLoad}
                        onChange={(e) => setEditPowerLoad(e.target.value)}
                        placeholder="e.g. 50kW Stable"
                        className="w-full bg-black border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-[#FF6B00]/30"
                      />
                    </div>
                  </div>
                </div>

                {editCategory === '_new_' && (
                  <div className="bg-white/[0.02] border border-[#FF6B00]/20 p-2.5 rounded-xl space-y-1 animate-slide-down">
                    <label className="text-[#FF6B00] block font-mono text-[8px] uppercase font-bold">Write Custom Category</label>
                    <input 
                      type="text"
                      required
                      value={editCustomCategoryName}
                      onChange={(e) => setEditCustomCategoryName(e.target.value)}
                      placeholder="e.g. lounge, showcase"
                      className="w-full bg-black border border-white/15 rounded-lg px-2 py-1 text-white text-[9px] focus:outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-white/40 block font-mono text-[8px] uppercase">Description</label>
                    <textarea 
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-black border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none text-[9px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/40 block font-mono text-[8px] uppercase">Instructions & Notes</label>
                    <textarea 
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-black border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none text-[9px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 bg-white/[0.01] p-2 border border-white/5 rounded-xl font-mono text-[8.5px]">
                    <div>
                      <div className="flex justify-between mb-1 items-center">
                        <span className="text-zinc-500 uppercase">Coordinate X (%)</span>
                        <input 
                          type="number"
                          min={1}
                          max={100}
                          value={editX}
                          onChange={(e) => setEditX(Math.min(100, Math.max(1, parseInt(e.target.value) || 50)))}
                          className="w-12 bg-black border border-white/10 rounded px-1.5 py-0.5 text-center font-bold text-[#FF6B00]"
                        />
                      </div>
                      <input 
                        type="range" 
                        min={1} 
                        max={100} 
                        value={editX}
                        onChange={(e) => setEditX(parseInt(e.target.value))}
                        className="w-full accent-[#FF6B00] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 items-center">
                        <span className="text-zinc-500 uppercase">Coordinate Y (%)</span>
                        <input 
                          type="number"
                          min={1}
                          max={100}
                          value={editY}
                          onChange={(e) => setEditY(Math.min(100, Math.max(1, parseInt(e.target.value) || 50)))}
                          className="w-12 bg-black border border-white/10 rounded px-1.5 py-0.5 text-center font-bold text-[#FF6B00]"
                        />
                      </div>
                      <input 
                        type="range" 
                        min={1} 
                        max={100} 
                        value={editY}
                        onChange={(e) => setEditY(parseInt(e.target.value))}
                        className="w-full accent-[#FF6B00] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="text-[7.5px] font-mono text-zinc-500 leading-normal text-center select-none bg-white/[0.02] py-1 px-2 rounded-lg border border-white/5">
                    💡 <span className="text-[#FF6B00] font-bold">Pro Tip:</span> With this edit form open, you can click <span className="text-white hover:underline transition duration-150">anywhere on the schematic layout plan</span> at any time to instantly reposition this item to those exact coordinates.
                  </div>

                  {/* REAL-TIME EDITING AUDIENCE ZONE DETECTOR */}
                  {(() => {
                    const info = getZoneStatus(editX, editY, editCategory === '_new_' ? (editCustomCategoryName.trim().toLowerCase() || 'custom') : editCategory);
                    if (!info.safe) {
                      return (
                        <div className="bg-red-500/10 border border-red-500/30 p-2 rounded-xl text-[8.5px] font-mono text-red-400 tracking-tight leading-normal text-center animate-pulse">
                          {info.hint} (Relative distance: {info.radius} units)
                        </div>
                      );
                    }
                    return (
                      <div className="bg-emerald-500/5 border border-emerald-500/15 p-2 rounded-xl text-[8px] font-mono text-emerald-400/80 tracking-tight text-center">
                        🎯 Boundary Check: {info.zone} - Safe Outside Zone (Distance: {info.radius} units)
                      </div>
                    );
                  })()}
                </div>
              </form>
            ) : (
              <div className="flex-1 space-y-2 flex flex-col justify-between">
                
                {/* Category tag & metadata */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                      getCategoryTheme(selectedMarker.category).border
                    } ${getCategoryTheme(selectedMarker.category).text}`}>
                      {getCategoryTheme(selectedMarker.category).label}
                    </span>
                    
                    {/* Stalls identifier icon */}
                    {selectedMarker.category === 'stall' && (
                      <span className="text-[8px] text-[#FF6B00] font-mono flex items-center gap-0.5 uppercase bg-[#FF6B00]/5 px-1.5 py-0.5 rounded border border-[#FF6B00]/10">
                        Chakra Marketplace Approved
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setIsEditingMarker(true);
                        setEditTitle(selectedMarker.title);
                        setEditCategory(selectedMarker.category);
                        setEditCustomCategoryName('');
                        setEditDescription(selectedMarker.description);
                        setEditNotes(selectedMarker.notes || '');
                        setEditCapacity(selectedMarker.capacity || '');
                        setEditPowerLoad(selectedMarker.powerLoad || '');
                        setEditX(selectedMarker.x);
                        setEditY(selectedMarker.y);
                      }}
                      className="px-2 py-1 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/20 rounded text-[9px] font-mono uppercase font-black transition cursor-pointer select-none"
                    >
                      Edit details
                    </button>
                    <button
                      onClick={(e) => handleDeleteMarker(selectedMarker.id, e)}
                      className="px-2 py-1 bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-500/20 rounded text-[9px] font-mono uppercase font-black transition cursor-pointer select-none"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-xs font-black text-white hover:text-[#FF6B00] transition duration-200 flex items-center gap-1.5 font-display uppercase tracking-tight">
                    {selectedMarker.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-normal">
                    {selectedMarker.description}
                  </p>
                </div>

                {/* Technical Specifications Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white/[0.01] p-2.5 rounded-xl border border-white/5 text-[9px] font-mono">
                  <div>
                    <span className="text-zinc-600 block">DESIGNATED CAPACITY</span>
                    <span className="text-white font-bold">{selectedMarker.capacity || 'Flexible'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block">GRID CALIBRATION</span>
                    <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                      <span className="text-zinc-500">X</span>
                      <input 
                        type="number"
                        min={1}
                        max={100}
                        value={selectedMarker.x}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                          setMarkers(prev => prev.map(m => m.id === selectedMarker.id ? { ...m, x: val } : m));
                        }}
                        className="w-10 bg-black border border-white/10 rounded px-1.5 py-0.5 text-center font-bold text-[#FF6B00] focus:outline-none focus:border-[#FF6B00]/40"
                        title="Click and type to update X coordinate"
                      />
                      <span className="text-zinc-500">Y</span>
                      <input 
                        type="number"
                        min={1}
                        max={100}
                        value={selectedMarker.y}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                          setMarkers(prev => prev.map(m => m.id === selectedMarker.id ? { ...m, y: val } : m));
                        }}
                        className="w-10 bg-black border border-white/10 rounded px-1.5 py-0.5 text-center font-bold text-[#FF6B00] focus:outline-none focus:border-[#FF6B00]/40"
                        title="Click and type to update Y coordinate"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-600 block">ESTIMATED POWER DRAW</span>
                    <span className="text-cyan-400 font-bold">{selectedMarker.powerLoad || '10kW stable'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block">OPERATIONAL STATUS</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                      Layout Stage OK
                    </span>
                  </div>
                </div>

                {/* Real-time boundary check within the selected point display */}
                {(() => {
                  const info = getZoneStatus(selectedMarker.x, selectedMarker.y, selectedMarker.category);
                  if (!info.safe) {
                    return (
                      <div className="text-[9px] bg-red-950/20 border border-red-500/30 p-2.5 rounded-xl flex items-start gap-2 text-red-400">
                        <Info size={12} className="text-red-400 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="text-[8px] uppercase font-mono font-bold block mb-0.5 text-red-400 animate-pulse">⚠️ AUDIENCE ZONE COMPLIANCE FAILURE:</strong>
                          <span>This item sits inside the 30-unit circular seated audience zone. Please edit or relocate this layout piece to avoid seating obstructions!</span>
                        </div>
                      </div>
                    );
                  }
                  return null; // Removed compliance OK warning per user request
                })()}

                {/* Special staging instructions - removed default instructions per user request */}
                {selectedMarker.notes && selectedMarker.notes.trim().toLowerCase() !== 'established in real-time layout board.' && (
                  <div className="text-[9px] bg-[#FF6B00]/5 border border-[#FF6B00]/15 p-2 rounded-xl flex items-start gap-2">
                    <Info size={11} className="text-[#FF6B00] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[8px] uppercase font-mono font-bold text-[#FF6B00] block">Production & Stall Instructions:</span>
                      <span className="text-zinc-300 italic">{selectedMarker.notes}</span>
                    </div>
                  </div>
                )}

                {/* Locations Resources & Equipment Manager Section */}
                <div className="border border-white/10 rounded-xl p-3 bg-white/[0.01] space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5" onClick={(e) => e.stopPropagation()}>
                    <h5 className="text-[10px] font-mono font-bold text-white uppercase flex items-center gap-1.5">
                      <Layers size={12} className="text-[#FF6B00]" />
                      Resources & Equipment Needed
                    </h5>
                    <span className="text-[8px] font-mono text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded-full">
                      {(selectedMarker.resources || []).length} unique items
                    </span>
                  </div>

                  {/* Resource List */}
                  <div className="space-y-1 rounded-lg" onClick={(e) => e.stopPropagation()}>
                    {(!selectedMarker.resources || selectedMarker.resources.length === 0) ? (
                      <div className="text-center py-4 bg-zinc-950/20 border border-dashed border-white/5 rounded-xl text-zinc-600 text-[9px] font-mono italic">
                        No equipment/resources assigned to this location yet.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {selectedMarker.resources.map((res) => (
                          <div key={res.id} className="flex items-center justify-between p-1.5 bg-zinc-950/40 border border-white/5 rounded-lg text-[9px] font-mono hover:bg-zinc-950 transition">
                            <div className="flex-1 min-w-0 pr-2">
                              <input
                                type="text"
                                value={res.name}
                                onChange={(e) => handleUpdateResourceName(selectedMarker.id, res.id, e.target.value)}
                                className="bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-[#FF6B00]/40 focus:outline-none focus:ring-0 text-zinc-300 font-medium py-0 px-1 w-full text-[9px] font-mono transition"
                                title="Click to rename"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Minus Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateResourceQty(selectedMarker.id, res.id, res.quantity - 1);
                                }}
                                className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-zinc-400 hover:text-white transition cursor-pointer select-none font-bold text-[10px]"
                              >
                                -
                              </button>
                              
                              {/* Quantity Editable Input */}
                              <input
                                type="number"
                                min="1"
                                value={res.quantity}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  handleUpdateResourceQty(selectedMarker.id, res.id, val);
                                }}
                                className="w-8 bg-black border border-white/15 rounded text-center text-white py-0.5 text-[9px] font-mono font-bold focus:outline-none focus:border-[#FF6B00]/40"
                              />

                              {/* Plus Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateResourceQty(selectedMarker.id, res.id, res.quantity + 1);
                                }}
                                className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-zinc-400 hover:text-white transition cursor-pointer select-none font-bold text-[10px]"
                              >
                                +
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteResource(selectedMarker.id, res.id);
                                }}
                                className="w-5 h-5 flex items-center justify-center bg-red-950/20 hover:bg-red-900/40 border border-red-500/20 rounded-md text-red-400 hover:text-red-300 transition ml-1 cursor-pointer select-none"
                                title="Delete item"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add New Resource Form */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-white/5" onClick={(e) => { e.stopPropagation(); }}>
                    <input
                      type="text"
                      placeholder="e.g. Canopy, Table, Chair"
                      id="new-resource-name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const el = document.getElementById('new-resource-name') as HTMLInputElement;
                          const qtyEl = document.getElementById('new-resource-qty') as HTMLInputElement;
                          if (el && el.value.trim()) {
                            const val = el.value.trim();
                            const qty = Math.max(1, parseInt(qtyEl?.value || '1') || 1);
                            handleAddResource(selectedMarker.id, val, qty);
                            el.value = '';
                            if (qtyEl) qtyEl.value = '1';
                          }
                        }
                      }}
                      className="flex-1 bg-black border border-white/10 rounded-lg px-2 py-1 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 text-[9px] font-mono"
                    />
                    <input
                      type="number"
                      min="1"
                      defaultValue="1"
                      id="new-resource-qty"
                      className="w-10 bg-black border border-white/10 rounded-lg py-1 text-center text-white focus:outline-none focus:border-white/20 text-[9px] font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const el = document.getElementById('new-resource-name') as HTMLInputElement;
                        const qtyEl = document.getElementById('new-resource-qty') as HTMLInputElement;
                        if (el && el.value.trim()) {
                          const val = el.value.trim();
                          const qty = Math.max(1, parseInt(qtyEl?.value || '1') || 1);
                          handleAddResource(selectedMarker.id, val, qty);
                          el.value = '';
                          if (qtyEl) qtyEl.value = '1';
                        }
                      }}
                      className="px-2.5 py-1 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/30 rounded-lg text-[9px] font-mono text-[#FF6B00] hover:text-[#FF8533] uppercase font-bold transition flex items-center gap-1 cursor-pointer select-none shrink-0"
                    >
                      <Plus size={10} /> Add
                    </button>
                  </div>
                </div>

              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
              <Compass size={28} className="text-white/20 animate-pulse mb-1.5" />
              <h5 className="text-[11px] font-bold font-mono text-white/50 uppercase tracking-widest">Select an Event Point</h5>
              <p className="text-[9px] text-zinc-500 max-w-sm mt-0.5 leading-normal">
                Choose a stall, performance dome, or gate from the directory roster or tap directly on the vector schematic map above to inspect staging properties.
              </p>
            </div>
          )}

        </div>

      </div>

      </div> {/* This closes #event-layout-container */}

      {/* GLOBAL EVENT RESOURCE SUMMARY SECTION */}
      <div 
        className="w-full bg-[#0C0C0C] rounded-3xl border border-white/10 p-6 space-y-6 shadow-xl relative overflow-hidden" 
        id="global-event-resource-summary-panel"
      >
        <div className="absolute inset-0 bg-[#FF6B00]/[0.01] pointer-events-none" />
        
        {/* Header content */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/25 rounded-lg text-[#FF6B00]">
                <ClipboardList size={16} />
              </span>
              <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider">
                Event Logistics & Resource Summary
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono leading-normal">
              Consolidated tallies of physical items, props, utilities, and assets deployed across all mapped blueprint locations.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-3 py-2 rounded-xl text-[10px] font-mono shrink-0 select-none">
            <div className="text-center">
              <span className="text-zinc-500 uppercase text-[8px] block">Total Map Anchors</span>
              <span className="text-white font-extrabold text-xs">{markers.length}</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <span className="text-zinc-500 uppercase text-[8px] block">Unique Resources</span>
              <span className="text-[#FF6B00] font-extrabold text-xs">{resourceSummaryList.length}</span>
            </div>
          </div>
        </div>

        {/* Bento/Grid style breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Map Anchors Category Registry */}
          <div className="bg-black/20 border border-white/5 rounded-2xl p-4 space-y-4">
            <h4 className="text-[11px] font-bold font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5">
              <Package size={12} className="text-[#FF6B00]" />
              Anchor Point Densities
            </h4>
            
            {markers.length === 0 ? (
              <div className="text-zinc-600 font-mono text-[9px] italic py-8 text-center bg-black/10 rounded-xl border border-dashed border-white/5">
                No stages or stalls pinned on the blueprint yet.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  {Object.entries(categoryTotals).map(([cat, count]) => {
                    const theme = getCategoryTheme(cat);
                    return (
                      <div key={cat} className="flex items-center justify-between text-[9px] font-mono p-1.5 bg-white/[0.01] border border-white/5 rounded-lg hover:border-white/10 transition">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${theme.text} bg-current`} />
                          <span className="text-zinc-300 font-medium">{theme.label}</span>
                        </span>
                        <span className="text-white bg-white/10 px-2 py-0.5 rounded font-bold font-mono">
                          {count} {count === 1 ? 'unit' : 'units'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-[8px] leading-relaxed text-zinc-500 bg-black/25 p-2 rounded-lg border border-white/5 text-center font-mono select-none">
                  💡 Power Grid load distribution is automatically tracked across each category. See blueprint tooltips for localized constraints.
                </div>
              </div>
            )}
          </div>

          {/* Card 2 & 3: Master Consolidated Resource Sheet */}
          <div className="lg:col-span-2 bg-[#080808] border border-white/5 rounded-2xl p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5 justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers size={12} className="text-[#FF6B00]" />
                  Combined Equipment & Asset Tallies
                </div>
                <span className="text-[8px] font-mono font-black text-[#FF6B00] uppercase bg-[#FF6B00]/5 px-2 py-0.5 rounded border border-[#FF6B00]/10 tracking-widest animate-pulse">
                  Live Consolidated
                </span>
              </h4>

              {resourceSummaryList.length === 0 ? (
                <div className="text-zinc-600 font-mono text-[9px] italic py-12 text-center bg-black/20 rounded-xl border border-dashed border-white/5">
                  No resources or equipment assigned to any event points yet.<br />
                  Select a pinned location above and use the Resources & Equipment Manager to allocate supplies.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                  {resourceSummaryList.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between hover:border-[#FF6B00]/30 hover:bg-black/60 transition group"
                    >
                      <span className="text-[11px] font-bold text-zinc-200 truncate pr-2 font-mono uppercase tracking-tight font-sans">
                        {item.name}
                      </span>
                      <div className="text-[10px] font-mono font-black bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] px-2.5 py-1 rounded-full select-none text-right shrink-0">
                        Total: {item.total}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {resourceSummaryList.length > 0 && (
              <div className="pt-2 border-t border-white/5 text-[8px] font-mono text-zinc-500 flex items-center justify-between">
                <span>Auto-compiled logistics ledger</span>
                <span>Active Anchor Registry sync verified ✓</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* GLOWING HIGH-CONTRAST NEON CONFIRMATION DIALOG MODAL */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div 
            className="w-full max-w-sm bg-[#060606] border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl shadow-[#FF6B00]/5 relative"
            id="custom-confirm-dialog"
          >
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-pulse shrink-0" />
              <h3 className="text-[12px] font-mono font-black text-white uppercase tracking-wider">
                {confirmDialog.title}
              </h3>
            </div>
            
            <p className="text-[10px] text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
              {confirmDialog.message}
            </p>
            
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-mono text-zinc-400 hover:text-white uppercase font-bold transition cursor-pointer select-none"
              >
                {confirmDialog.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="py-2 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/40 rounded-xl text-[10px] font-mono text-[#FF6B00] hover:text-[#FF8533] uppercase font-bold transition cursor-pointer select-none"
              >
                {confirmDialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
