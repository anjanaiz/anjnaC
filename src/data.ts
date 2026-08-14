import { Category, TimelineDay, BudgetItem } from './types';

export const CHAKRA_OFFICIAL_ARTIST_LINEUP = [
  'Chamara Weerasinghe',
  'Yuki & Ravi J',
  'Centigradz',
  'Umaria',
  'Raveen Tharuka',
  'Wasthi',
  'Rookantha Goonatillake',
  'B&S (Bathiya & Santhush)'
];

export const CHAKRA_INITIAL_BUDGET: BudgetItem[] = [
  // --- ARTIST COST BREAKDOWN ---
  {
    id: 'chbg_art_1',
    category: 'Artist Cost Breakdown',
    title: 'Chamara Weerasinghe',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Chamara Weerasinghe Management',
    dueDate: '2026-08-08',
    notes: 'Headline Artist Performance Fee'
  },
  {
    id: 'chbg_art_2',
    category: 'Artist Cost Breakdown',
    title: 'Yuki & Ravi J',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Yuki & Ravi J Duo',
    dueDate: '2026-08-08',
    notes: 'Main Stage Performance Fee'
  },
  {
    id: 'chbg_art_3',
    category: 'Artist Cost Breakdown',
    title: 'Centigradz',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Centigradz Band / Management',
    dueDate: '2026-08-08',
    notes: 'Live Band & Vocal Performance'
  },
  {
    id: 'chbg_art_4',
    category: 'Artist Cost Breakdown',
    title: 'Umaria',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Umaria Sinhawansa Official',
    dueDate: '2026-08-08',
    notes: 'Featured Female Vocalist Performance'
  },
  {
    id: 'chbg_art_5',
    category: 'Artist Cost Breakdown',
    title: 'Raveen Tharuka',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Raveen Tharuka Management',
    dueDate: '2026-08-08',
    notes: 'Artist Performance Fee'
  },
  {
    id: 'chbg_art_6',
    category: 'Artist Cost Breakdown',
    title: 'Wasthi',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Wasthi Productions',
    dueDate: '2026-08-08',
    notes: 'Live Performance Act & Hype Segment'
  },
  {
    id: 'chbg_art_7',
    category: 'Artist Cost Breakdown',
    title: 'Rookantha Goonatillake',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Rookantha Goonatillake Official',
    dueDate: '2026-08-08',
    notes: 'Legendary Performance Feature'
  },
  {
    id: 'chbg_art_8',
    category: 'Artist Cost Breakdown',
    title: 'B&S (Bathiya & Santhush)',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Saregama Music / B&S Management',
    dueDate: '2026-08-08',
    notes: 'Main Stage Special Headline Performance'
  },

  // --- OTHER EVENT COSTS ---
  {
    id: 'chbg_oth_10',
    category: 'Other Event Costs',
    title: 'Band & Sound',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Official Backing Band & Sound System Engineers',
    dueDate: '2026-08-08',
    notes: 'Line array sound, backline instruments & monitoring'
  },
  {
    id: 'chbg_oth_11',
    category: 'Other Event Costs',
    title: 'Stage & Lighting',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Stage Structure & Pro Light Tech',
    dueDate: '2026-08-08',
    notes: 'Trussing stage, moving beams, lasers & LED screens'
  },
  {
    id: 'chbg_oth_12',
    category: 'Other Event Costs',
    title: 'Furniture & Event Structures',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Event Structures & Tent Suppliers',
    dueDate: '2026-08-08',
    notes: 'VIP sofas, chairs, barricade gates, canopies & stalls'
  },
  {
    id: 'chbg_oth_13',
    category: 'Other Event Costs',
    title: 'Generator & Power',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Industrial Power Generators Sri Lanka',
    dueDate: '2026-08-08',
    notes: 'Heavy-duty backup diesel generators & distribution boards'
  },
  {
    id: 'chbg_oth_14',
    category: 'Other Event Costs',
    title: 'Ground / Venue',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Air Force Ground Colombo Authorities',
    dueDate: '2026-08-08',
    notes: 'Ground reservation, electricity access & ground management'
  },
  {
    id: 'chbg_oth_15',
    category: 'Other Event Costs',
    title: 'Hotel & Accommodation',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Hospitality Partner Hotel',
    dueDate: '2026-08-08',
    notes: 'Artist suites, VIP lodging & crew room stays'
  },
  {
    id: 'chbg_oth_16',
    category: 'Other Event Costs',
    title: 'Marketing & Promotion',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Digital PR & Billboard Agency',
    dueDate: '2026-08-08',
    notes: 'Meta ad campaigns, road banners, press releases & radio promos'
  },
  {
    id: 'chbg_oth_17',
    category: 'Other Event Costs',
    title: 'Dancing Team',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Choreography & Dance Troupe',
    dueDate: '2026-08-08',
    notes: 'Opening act and backing dancers choreography'
  },
  {
    id: 'chbg_oth_18',
    category: 'Other Event Costs',
    title: 'Tickets & Web',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Ticketing Platform & Web Server Hosting',
    dueDate: '2026-08-08',
    notes: 'Online ticket gateway, printed tickets & web registration'
  },
  {
    id: 'chbg_oth_19',
    category: 'Other Event Costs',
    title: 'Security',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Security Services & Bouncer Group',
    dueDate: '2026-08-08',
    notes: 'Event bouncers, crowd control, VIP stage guards'
  },
  {
    id: 'chbg_oth_20',
    category: 'Other Event Costs',
    title: 'Tax',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Inland Revenue Dept / Municipal Council',
    dueDate: '2026-08-08',
    notes: 'Entertainment tax, municipal council permit fees & VAT'
  },
  {
    id: 'chbg_oth_21',
    category: 'Other Event Costs',
    title: 'Media',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Media Production Crew & Broadcasters',
    dueDate: '2026-08-08',
    notes: 'Photo & video coverage, live streaming & PR shoots'
  },
  {
    id: 'chbg_oth_22',
    category: 'Other Event Costs',
    title: 'Management',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'SAS Production Management Core',
    dueDate: '2026-08-08',
    notes: 'Event directors, backstage coordinators & operations staff'
  },
  {
    id: 'chbg_oth_23',
    category: 'Other Event Costs',
    title: 'Wash Room',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Mobile Sanitation & Portable Washroom Services',
    dueDate: '2026-08-08',
    notes: 'VIP & General mobile restrooms + water supply maintenance'
  },
  {
    id: 'chbg_oth_24',
    category: 'Other Event Costs',
    title: 'Wristbands',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Wristband Printing & RFID Supplier',
    dueDate: '2026-08-08',
    notes: 'VIP, backstage pass, and general crowd wristbands'
  },
  {
    id: 'chbg_oth_25',
    category: 'Other Event Costs',
    title: 'Flags',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Event Branding & Flag Printers',
    dueDate: '2026-08-08',
    notes: 'Entrance feather flags, perimeter banners & stage branding'
  },
  {
    id: 'chbg_oth_26',
    category: 'Other Event Costs',
    title: 'Cleaning',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Ground Janitorial & Post-Event Cleaning Service',
    dueDate: '2026-08-08',
    notes: 'Pre-event, live continuous sweeping, and post-event cleanup'
  },
  {
    id: 'chbg_oth_27',
    category: 'Other Event Costs',
    title: 'Announcing',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Official Emcees / Presenters',
    dueDate: '2026-08-08',
    notes: 'Stage hosts & live event announcers honorarium'
  },
  {
    id: 'chbg_oth_28',
    category: 'Other Event Costs',
    title: 'Manuja Drone',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Manuja Aerial Cinematography',
    dueDate: '2026-08-08',
    notes: '4K Aerial drone live feed & concert cinematic shots'
  },
  {
    id: 'chbg_oth_29',
    category: 'Other Event Costs',
    title: 'Food & Hospitality',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Catering & Hospitality Crew',
    dueDate: '2026-08-08',
    notes: 'Artist greenroom food, crew meals & VIP hospitality lounge'
  },
  {
    id: 'chbg_oth_30',
    category: 'Other Event Costs',
    title: 'VIP Box',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'VIP Lounge & Decor Fabricators',
    dueDate: '2026-08-08',
    notes: 'Exclusive VIP box enclosure, bar setup & premium ambiance'
  },
  {
    id: 'chbg_oth_31',
    category: 'Other Event Costs',
    title: 'Transport',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Fleet & Logistics Transport Provider',
    dueDate: '2026-08-08',
    notes: 'Artist luxury transport, band equipment trucks & crew shuttles'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat_artist_videos',
    name: 'ARTIST VIDEOS',
    items: [
      { id: 'av_1', person: 'Chamara Weerasinghe', name: 'Headline Promo Video', status: 'TO SHOOT' },
      { id: 'av_2', person: 'Yuki & Ravi J', name: 'Special Feature Clip', status: 'EDIT PENDING' },
      { id: 'av_3', person: 'Centigradz', name: 'Cinematic Teaser', status: 'DONE' },
      { id: 'av_4', person: 'Umaria', name: 'Vocal Performance Clip', status: 'TO SHOOT' },
      { id: 'av_5', person: 'Raveen Tharuka', name: 'Artist Feature', status: 'EDIT PENDING' },
      { id: 'av_6', person: 'Wasthi', name: 'Performance Footage & Promo', status: 'TO SHOOT' },
      { id: 'av_7', person: 'Rookantha Goonatillake', name: 'Legendary Performance Feature', status: 'TO SHOOT' },
      { id: 'av_8', person: 'B&S (Bathiya & Santhush)', name: 'Main Stage Highlight Promo', status: 'TO SHOOT' }
    ]
  },
  {
    id: 'cat_organizers_content',
    name: 'ORGANIZERS CONTENT',
    items: [
      { id: 'oc_1', person: 'Supun Senanayaka', name: 'Organizer Intro Talk', status: 'EDIT PENDING' },
      { id: 'oc_2', person: 'Thisanka Gamage', name: 'Event Announcement Clip 01', status: 'EDIT PENDING' },
      { id: 'oc_3', person: 'Thisanka Gamage', name: 'Event Announcement Clip 02', status: 'EDIT PENDING' },
      { id: 'oc_4', person: 'Event Management Team', name: 'Group Talk Segment', status: 'TO SHOOT' }
    ]
  },
  {
    id: 'cat_influencers_reaction',
    name: 'INFLUENCERS & REACTION CAMPAIGN',
    items: [
      { id: 'ir_1', person: 'Dinel Walpola', name: 'Video 01', status: 'DONE' },
      { id: 'ir_2', person: 'Dinel Walpola', name: 'Video 02', status: 'EDIT PENDING' },
      { id: 'ir_3', person: 'Dinel Walpola', name: 'Video 03', status: 'TO SHOOT' },
      { id: 'ir_4', person: 'Dinel Walpola', name: 'Video 04', status: 'TO SHOOT' },
      { id: 'ir_5', person: 'Dinel Walpola', name: 'Video 05', status: 'TO SHOOT' },
      { id: 'ir_6', person: 'Apsara Gunathilaka', name: 'Hype Clip', status: 'DONE' },
      { id: 'ir_7', person: 'Sahange Reaction Campaign', name: 'Reaction Clip 01', status: 'EDIT PENDING' },
      { id: 'ir_8', person: 'Sahange Reaction Campaign', name: 'Reaction Clip 02', status: 'EDIT PENDING' },
      { id: 'ir_9', person: 'React With Sahange', name: 'Fan Reaction Assets', status: 'DONE' },
      { id: 'ir_10', person: 'Other Influencer Hype Reels', name: 'Auxiliary Content', status: 'TO SHOOT' }
    ]
  },
  {
    id: 'cat_cinematic_assets',
    name: 'CINEMATIC ASSETS & OTHER CONTENT',
    items: [
      { id: 'ca_1', person: 'Air Force Ground', name: 'Drone Shots', status: 'TO SHOOT' },
      { id: 'ca_2', person: 'Stage Setup Sequence', name: 'Timelapse Build', status: 'TO SHOOT' },
      { id: 'ca_3', person: 'Crowd POV Experience', name: 'Walking Content', status: 'TO SHOOT' },
      { id: 'ca_4', person: 'Empty Venue', name: 'Mood Cinematics', status: 'TO SHOOT' },
      { id: 'ca_5', person: 'Voice Cut Production Batch', name: 'Clip Batch 01', status: 'DONE' },
      { id: 'ca_6', person: 'Voice Cut Production Batch', name: 'Clip Batch 02', status: 'EDIT PENDING' },
      { id: 'ca_7', person: 'Voice Cut Production Batch', name: 'Clip Batch 03', status: 'TO SHOOT' },
      { id: 'ca_8', person: 'Crowd Audio Engineering', name: 'Ambient Crowd Audio', status: 'TO SHOOT' },
      { id: 'ca_9', person: 'Ticket Urgency Countdown Audio', name: 'Sales Countdown Audio', status: 'TO SHOOT' }
    ]
  }
];

export const INITIAL_TIMELINE: TimelineDay[] = [
  {
    date: 'AUGUST 08',
    description: 'Planning & Setup Kickoff',
    status: 'Pending',
    tasks: [
      { id: 't_a08_1', section: 'Shoot', text: 'Final Content Planning & Artist Schedule Lock', status: 'Pending' },
      { id: 't_a08_2', section: 'Coordination', text: 'Influencer Outreach & Asset Alignment', status: 'Pending' }
    ]
  },
  {
    date: 'AUGUST 09',
    description: 'Campaign Kickoff',
    status: 'Completed',
    tasks: [
      { id: 't_a09_1', section: 'Shoot', text: 'Wasthi & Chamara Weerasinghe Promo Teaser Shoot', status: 'Completed' },
      { id: 't_a09_2', section: 'Shoot', text: 'Apsara Gunathilaka Hype Clip', status: 'Completed' },
      { id: 't_a09_3', section: 'Edit', text: 'Centigradz Final Export', status: 'Completed' }
    ]
  },
  {
    date: 'AUGUST 10',
    description: 'Artist Promos Phase 1',
    status: 'Pending',
    tasks: [
      { id: 't_a10_1', section: 'Shoot', text: 'Yuki & Ravi J performance footage shoot', status: 'Pending' },
      { id: 't_a10_2', section: 'Edit', text: 'Wasthi Promo video edit', status: 'Pending' }
    ]
  },
  {
    date: 'AUGUST 11',
    description: 'Artist Promos Phase 2',
    status: 'Pending',
    tasks: [
      { id: 't_a11_1', section: 'Shoot', text: 'Umaria & B&S promo clips', status: 'Pending' },
      { id: 't_a11_2', section: 'Edit', text: 'Rookantha Goonatillake performance footage', status: 'Pending' }
    ]
  },
  {
    date: 'AUGUST 12',
    description: 'Hype Generation',
    status: 'Pending',
    tasks: [
      { id: 't_a12_1', section: 'Shoot', text: 'Raveen Tharuka Promotional Clip', status: 'Pending' },
      { id: 't_a12_2', section: 'Coordination', text: 'Ticket Countdown launch', status: 'Pending' }
    ]
  },
  {
    date: 'AUGUST 13',
    description: 'Technical Rigging',
    status: 'Pending',
    tasks: [
      { id: 't_a13_1', section: 'Coordination', text: 'Air Force Ground venue setup & sound test', status: 'Pending' },
      { id: 't_a13_2', section: 'Shoot', text: '360 LED Wall & Fire Lighting tests', status: 'Pending' }
    ]
  },
  {
    date: 'AUGUST 14',
    description: 'Rehearsals Warmup',
    status: 'Pending',
    tasks: [
      { id: 't_a14_1', section: 'Coordination', text: 'Full Artist Lineup audio rehearsal', status: 'Pending' },
      { id: 't_a14_2', section: 'Shoot', text: 'Pre-event buildup & fan interviews', status: 'Pending' }
    ]
  },
  {
    date: 'AUGUST 15',
    description: 'MAIN CONCERT DAY',
    status: 'LIVE EVENT',
    isEventDay: true,
    tasks: [
      { id: 't_a15_1', section: 'Shoot', text: 'Live Production Coverage', status: 'Pending' },
      { id: 't_a15_2', section: 'Shoot', text: 'Crowd Reels & Artist Coverage', status: 'Pending' },
      { id: 't_a15_3', section: 'Shoot', text: 'Aftermovie & Drone Capture', status: 'Pending' }
    ]
  }
];
