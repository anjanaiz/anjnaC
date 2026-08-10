import { Category, TimelineDay, BudgetItem } from './types';

export const CHAKRA_OFFICIAL_ARTIST_LINEUP = [
  'Wasthi',
  'Chamara Weerasinghe',
  'Yuki & Ravi J',
  'Centigradz',
  'Umaria',
  'Raveen Tharuka',
  'Rookantha Goonatillake',
  'B&S (Bathiya & Santhush)'
];

export const CHAKRA_INITIAL_BUDGET: BudgetItem[] = [
  {
    id: 'chbg_1',
    category: 'Artist Lineup',
    title: 'Artist Lineup',
    type: 'Expense',
    estimatedAmount: 2500000,
    actualAmount: 2500000,
    paidAmount: 1250000,
    paymentStatus: 'Partial',
    vendorOrSource: 'Main Artist Pool (Wasthi, Chamara, B&S, etc.)',
    dueDate: '2026-08-08',
    notes: 'Official performing artists honorarium advance'
  },
  {
    id: 'chbg_2',
    category: 'Band',
    title: 'Band',
    type: 'Expense',
    estimatedAmount: 800000,
    actualAmount: 800000,
    paidAmount: 400000,
    paymentStatus: 'Partial',
    vendorOrSource: 'Official Backing Band & Sound Crew',
    dueDate: '2026-08-08',
    notes: 'Full live band setup & rehearsals'
  },
  {
    id: 'chbg_3',
    category: 'Stage, LED Wall, Fire & Lighting',
    title: 'Stage, LED Wall, Fire & Lighting',
    type: 'Expense',
    estimatedAmount: 2000000,
    actualAmount: 2000000,
    paidAmount: 1000000,
    paymentStatus: 'Partial',
    vendorOrSource: 'Pro Light & Stage Systems',
    dueDate: '2026-08-08',
    notes: '360 LED Wall, stage trussing, laser & SFX pyrotechnics'
  },
  {
    id: 'chbg_4',
    category: 'Location',
    title: 'Location',
    type: 'Expense',
    estimatedAmount: 1200000,
    actualAmount: 1200000,
    paidAmount: 1200000,
    paymentStatus: 'Paid',
    vendorOrSource: 'Air Force Ground Colombo',
    dueDate: '2026-08-08',
    notes: 'Venue rental fee & grounds management'
  },
  {
    id: 'chbg_5',
    category: 'Audience Table Seating & Barricade Gates',
    title: 'Audience Table Seating & Barricade Gates',
    type: 'Expense',
    estimatedAmount: 600000,
    actualAmount: 600000,
    paidAmount: 300000,
    paymentStatus: 'Partial',
    vendorOrSource: 'Event Infrastructure Supplier',
    dueDate: '2026-08-08',
    notes: 'VIP table chairs, crowd barricades & control gates'
  },
  {
    id: 'chbg_6',
    category: 'Bouncers',
    title: 'Bouncers',
    type: 'Expense',
    estimatedAmount: 350000,
    actualAmount: 350000,
    paidAmount: 175000,
    paymentStatus: 'Partial',
    vendorOrSource: 'Security Force & Bouncers Agency',
    dueDate: '2026-08-08',
    notes: 'Crowd management & stage security bouncers'
  },
  {
    id: 'chbg_7',
    category: 'Marketing',
    title: 'Marketing',
    type: 'Expense',
    estimatedAmount: 750000,
    actualAmount: 750000,
    paidAmount: 500000,
    paymentStatus: 'Partial',
    vendorOrSource: 'Digital & Offline Marketing Agency',
    dueDate: '2026-08-08',
    notes: 'Social media ads, banners & PR release'
  },
  {
    id: 'chbg_8',
    category: 'Estimated Government Tax',
    title: 'Estimated Government Tax',
    type: 'Expense',
    estimatedAmount: 400000,
    actualAmount: 400000,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: 'Inland Revenue & Municipal Council',
    dueDate: '2026-08-08',
    notes: 'Government entertainment tax & local council permits'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat_artist_videos',
    name: 'ARTIST VIDEOS',
    items: [
      { id: 'av_1', person: 'Wasthi', name: 'Performance Footage & Promo', status: 'TO SHOOT' },
      { id: 'av_2', person: 'Chamara Weerasinghe', name: 'Headline Promo Video', status: 'TO SHOOT' },
      { id: 'av_3', person: 'Yuki & Ravi J', name: 'Special Feature Clip', status: 'EDIT PENDING' },
      { id: 'av_4', person: 'Centigradz', name: 'Cinematic Teaser', status: 'DONE' },
      { id: 'av_5', person: 'Umaria', name: 'Vocal Performance Clip', status: 'TO SHOOT' },
      { id: 'av_6', person: 'Raveen Tharuka', name: 'Artist Feature', status: 'EDIT PENDING' },
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
