import { Category, BudgetItem, Sponsor, Stall } from './types';

export const KATHAWAK_INITIAL_CATEGORIES: Category[] = [
  {
    id: 'kcat_film_score_promos',
    name: 'FILM SCORE & ORCHESTRA PROMOS',
    items: [
      { id: 'kav_1', person: 'Orchestral Ensemble', name: 'Behind The Scenes Rehearsal 01', status: 'EDIT PENDING' },
      { id: 'kav_2', person: 'Lead Composer & Director', name: 'Story of Music Theme Intro', status: 'DONE' },
      { id: 'kav_3', person: 'Violin Soloist', name: 'Cinematic Solo Teaser', status: 'TO SHOOT' },
      { id: 'kav_4', person: 'Brass Section', name: 'Live Symphony Teaser', status: 'TO SHOOT' }
    ]
  },
  {
    id: 'kcat_featured_singers',
    name: 'FEATURED VOCALISTS & ARTISTS',
    items: [
      { id: 'kav_5', person: 'Lead Vocalist 01', name: 'Kathawak Main Theme Vocal Teaser', status: 'DONE' },
      { id: 'kav_6', person: 'Guest Artist 01', name: 'Concert Invitation Video', status: 'EDIT PENDING' },
      { id: 'kav_7', person: 'Guest Artist 02', name: 'Acoustic Medley Clip', status: 'TO SHOOT' },
      { id: 'kav_8', person: 'Duet Ensemble', name: 'Rehearsal Live Audio Cut', status: 'TO SHOOT' }
    ]
  },
  {
    id: 'kcat_cinema_trailers',
    name: 'FILM CLIPS & VISUAL PROJECTIONS',
    items: [
      { id: 'kav_9', person: 'Visual Effects Team', name: 'Stage LED Screen Film Reel', status: 'EDIT PENDING' },
      { id: 'kav_10', person: 'Sound Engineer Team', name: 'Surround Sound Intro Audio Teaser', status: 'DONE' },
      { id: 'kav_11', person: 'Cinematography Crew', name: 'Venue Projection Mapping Preview', status: 'TO SHOOT' }
    ]
  },
  {
    id: 'kcat_promotional_campaign',
    name: 'TICKET CAMPAIGN & INFLUENCERS',
    items: [
      { id: 'kav_12', person: 'Film Critics & Influencers', name: 'VIP Concert Teaser 01', status: 'DONE' },
      { id: 'kav_13', person: 'Media Partner Team', name: 'Ticket Launch Announcement', status: 'DONE' },
      { id: 'kav_14', person: 'Social Media Campaign', name: 'Countdown Reel Batch 01', status: 'TO SHOOT' }
    ]
  }
];

export const KATHAWAK_INITIAL_BUDGET: BudgetItem[] = [
  {
    id: 'kbg_1',
    category: 'Venue & Security',
    title: 'Nelum Pokuna Grand Auditorium / Outdoor Complex Rental',
    type: 'Expense',
    estimatedAmount: 850000,
    actualAmount: 850000,
    paidAmount: 400000,
    paymentStatus: 'Partial',
    vendorOrSource: 'Nelum Pokuna Management',
    dueDate: '2026-08-10',
    notes: 'Advance deposit paid. Balance due 5 days prior to show.'
  },
  {
    id: 'kbg_2',
    category: 'Sound & Stage',
    title: 'Symphonic Sound & Line Array Audio Rig',
    type: 'Expense',
    estimatedAmount: 1200000,
    actualAmount: 1150000,
    paidAmount: 500000,
    paymentStatus: 'Partial',
    vendorOrSource: 'ProSound Audio Systems',
    dueDate: '2026-08-12',
    notes: 'Includes 48-channel orchestra mixing desk & IEM system.'
  },
  {
    id: 'kbg_3',
    category: 'Artist & Performance',
    title: 'Orchestra & Guest Singers Honorarium',
    type: 'Expense',
    estimatedAmount: 1500000,
    actualAmount: 1500000,
    paidAmount: 750000,
    paymentStatus: 'Partial',
    vendorOrSource: 'Musicians Association',
    dueDate: '2026-08-14'
  },
  {
    id: 'kbg_4',
    category: 'Media & Marketing',
    title: 'LED Screen Visual Projections & Cinema Teasers',
    type: 'Expense',
    estimatedAmount: 450000,
    actualAmount: 420000,
    paidAmount: 420000,
    paymentStatus: 'Paid',
    vendorOrSource: 'CineVision FX Studio',
    dueDate: '2026-08-01'
  },
  {
    id: 'kbg_5',
    category: 'Sponsorship & Revenue',
    title: 'Title Sponsorship - Ceylon Cinema & Bank Partnership',
    type: 'Income',
    estimatedAmount: 2500000,
    actualAmount: 2500000,
    paidAmount: 1500000,
    paymentStatus: 'Partial',
    vendorOrSource: 'Commercial Bank / Main Sponsor',
    dueDate: '2026-08-05'
  },
  {
    id: 'kbg_6',
    category: 'Sponsorship & Revenue',
    title: 'VIP & General Box Office Ticket Revenue',
    type: 'Income',
    estimatedAmount: 3500000,
    actualAmount: 3200000,
    paidAmount: 1800000,
    paymentStatus: 'Partial',
    vendorOrSource: 'Mytickets.lk Platform',
    dueDate: '2026-08-16'
  }
];

export const KATHAWAK_INITIAL_SPONSORS: Sponsor[] = [
  {
    id: 'kspon_1',
    name: 'Commercial Bank PLC',
    brandName: 'Commercial Bank',
    tier: 'Title Sponsor',
    contactPerson: 'Saman Jayasinghe (Head of Marketing)',
    phone: '+94 77 123 4567',
    email: 'saman.j@combank.lk',
    contractValue: 2500000,
    amountReceived: 1500000,
    paymentStatus: 'Partial',
    status: 'Confirmed',
    logoUrl: '/kathawak_logo.png',
    deliverables: [
      { id: 'del_1', text: 'Main Stage Backdrop Logo Placement (Gold Foil)', completed: true },
      { id: 'del_2', text: 'VIP Entrance Photo Booth branding', completed: true },
      { id: 'del_3', text: '10x VIP Passes & Reserved Lounge', completed: false },
      { id: 'del_4', text: '30-second LED Video Commercial loop before show', completed: false }
    ],
    notes: 'Main title sponsor contract signed. Balance Rs. 1,000,000 to be settled upon hall setup.'
  },
  {
    id: 'kspon_2',
    name: 'Dialog Television / Film Club',
    brandName: 'Dialog TV',
    tier: 'Media Partner',
    contactPerson: 'Nimali Perera',
    phone: '+94 71 987 6543',
    email: 'nimali@dialog.lk',
    contractValue: 800000,
    amountReceived: 800000,
    paymentStatus: 'Completed',
    status: 'Signed',
    logoUrl: '/kathawak_logo.png',
    deliverables: [
      { id: 'del_5', text: 'TV Trailer Airtime (50 slots across primetime)', completed: true },
      { id: 'del_6', text: 'Official Broadcast & Aftermovie rights', completed: true }
    ]
  },
  {
    id: 'kspon_3',
    name: 'Elephant House / Beverage Corp',
    brandName: 'Elephant House Refreshments',
    tier: 'Beverage Partner',
    contactPerson: 'Kishan Silva',
    phone: '+94 70 333 4455',
    contractValue: 500000,
    amountReceived: 250000,
    paymentStatus: 'Partial',
    status: 'Confirmed',
    deliverables: [
      { id: 'del_7', text: 'Exclusive Beverage Stalls inside venue', completed: true },
      { id: 'del_8', text: 'Branded Reusable Cups for Audience', completed: false }
    ]
  }
];

export const KATHAWAK_INITIAL_STALLS: Stall[] = [
  {
    id: 'kstall_1',
    name: 'Stall #01 - Movie Merchandise & Vinyl Corner',
    vendorName: '',
    whatsappNumber: '',
    advancePayment: 0,
    remainingBalance: 0,
    items: ['Collector Film Posters', 'Vinyl LPs', 'Concert T-Shirts', 'Keychains'],
    notes: 'Requires 1x 13A Power Outlet and 2x Spotlights'
  },
  {
    id: 'kstall_2',
    name: 'Stall #02 - Gourmet Coffee & Artisanal Snacks',
    vendorName: '',
    whatsappNumber: '',
    advancePayment: 0,
    remainingBalance: 0,
    items: ['Espresso Bar', 'Gourmet Sandwiches', 'Popcorn Sets'],
    notes: 'Requires high-power outlet for espresso machine.'
  }
];
