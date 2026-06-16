import { Category, TimelineDay } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat_artist_videos',
    name: 'ARTIST VIDEOS',
    items: [
      { id: 'av_1', person: 'Chamara Weerasinha', name: 'Video Clip', status: 'TO SHOOT' },
      { id: 'av_2', person: 'Kasun Kalhara', name: 'Video Clip', status: 'TO SHOOT' },
      { id: 'av_3', person: 'Danith Sri', name: 'Promotional Clip 01', status: 'TO SHOOT' },
      { id: 'av_4', person: 'Danith Sri', name: 'Promotional Clip 02', status: 'TO SHOOT' },
      { id: 'av_5', person: 'Centigrade', name: 'Cinematic Video', status: 'DONE' },
      { id: 'av_6', person: 'Yuki & Ravi Jee', name: 'Performance Footage', status: 'EDIT PENDING' },
      { id: 'av_7', person: 'Raveen Tharuka', name: 'Artist Feature', status: 'EDIT PENDING' },
      { id: 'av_8', person: 'Athula Adikari', name: 'Promotional Clip', status: 'EDIT PENDING' }
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
    date: 'JUNE 12',
    description: 'Planning Phase',
    status: 'Pending',
    tasks: [
      { id: 't_j12_1', section: 'Shoot', text: 'Final Content Planning', status: 'Pending' },
      { id: 't_j12_2', section: 'Shoot', text: 'Artist Schedule Lock', status: 'Pending' },
      { id: 't_j12_3', section: 'Coordination', text: 'Influencer Outreach', status: 'Pending' },
      { id: 't_j12_4', section: 'Coordination', text: 'Asset Alignment', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 13',
    description: 'Campaign Kickoff',
    status: 'Completed',
    tasks: [
      { id: 't_j13_1', section: 'Shoot', text: 'Dinel Walpola Promo Video', status: 'Completed' },
      { id: 't_j13_2', section: 'Shoot', text: 'Apsara Gunathilaka Hype Clip', status: 'Completed' },
      { id: 't_j13_3', section: 'Edit', text: 'Centigrade Final Export', status: 'Completed' }
    ]
  },
  {
    date: 'JUNE 14',
    description: 'Artist Promos Phase 1',
    status: 'Pending',
    tasks: [
      { id: 't_j14_1', section: 'Shoot', text: 'Chamara Weerasinha teaser shoot', status: 'Pending' },
      { id: 't_j14_2', section: 'Edit', text: 'Dinel Walpola Video 01 edit', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 15',
    description: 'Artist Promos Phase 2',
    status: 'Pending',
    tasks: [
      { id: 't_j15_1', section: 'Shoot', text: 'Kasun Kalhara promo clips', status: 'Pending' },
      { id: 't_j15_2', section: 'Edit', text: 'Yuki & Ravi Jee Performance Footage', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 16',
    description: 'Hype Generation',
    status: 'Pending',
    tasks: [
      { id: 't_j16_1', section: 'Shoot', text: 'Danith Sri Promotional Clip 01', status: 'Pending' },
      { id: 't_j16_2', section: 'Coordination', text: 'Phase 2 Ticket Countdown launch', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 17',
    description: 'Draft review 1',
    status: 'Pending',
    tasks: [
      { id: 't_j17_1', section: 'Edit', text: 'Dinel Walpola Video 02 review', status: 'Pending' },
      { id: 't_j17_2', section: 'Edit', text: 'Danith Sri Promo Clip 01 processing', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 18',
    description: 'Artist Feature release',
    status: 'Pending',
    tasks: [
      { id: 't_j18_1', section: 'Shoot', text: 'Raveen Tharuka Artist Feature', status: 'Pending' },
      { id: 't_j18_2', section: 'Edit', text: 'Organizer Intro Talk (Supun Senanayaka)', status: 'Pending' },
      { id: 't_j18_3', section: 'Post', text: 'Release Chamara Weerasinha teaser online', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 19',
    description: 'Teaser rollouts',
    status: 'Pending',
    tasks: [
      { id: 't_j19_1', section: 'Shoot', text: 'Athula Adikari Promotional Clip', status: 'Pending' },
      { id: 't_j19_2', section: 'Edit', text: 'Raveen Tharuka Segment export', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 20',
    description: 'Announcements 2',
    status: 'Pending',
    tasks: [
      { id: 't_j20_1', section: 'Shoot', text: 'Event Announcement Clips (Thisanka Gamage)', status: 'Pending' },
      { id: 't_j20_2', section: 'Edit', text: 'Athula Adikari Promo cut', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 21',
    description: 'Cinematics Prep',
    status: 'Pending',
    tasks: [
      { id: 't_j21_1', section: 'Coordination', text: 'Venue clearance (Air Force Ground)', status: 'Pending' },
      { id: 't_j21_2', section: 'Shoot', text: 'Voice Cut Production Batch', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 22',
    description: 'Bulk edit',
    status: 'Pending',
    tasks: [
      { id: 't_j22_1', section: 'Edit', text: 'Thisanka Gamage Announcement clips', status: 'Pending' },
      { id: 't_j22_2', section: 'Edit', text: 'Voice Cut Batch 01 finalization', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 23',
    description: 'Organizers Panel',
    status: 'Pending',
    tasks: [
      { id: 't_j23_1', section: 'Shoot', text: 'Group Talk Segment (Event Management Team)', status: 'Pending' },
      { id: 't_j23_2', section: 'Edit', text: 'Voice Cut Batch 02 final alignment', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 24',
    description: 'Final checks',
    status: 'Pending',
    tasks: [
      { id: 't_j24_1', section: 'Edit', text: 'Group Talk Segment mixing', status: 'Pending' },
      { id: 't_j24_2', section: 'Edit', text: 'Reaction Campaign reels alignment', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 25',
    description: 'Rigging build',
    status: 'Pending',
    tasks: [
      { id: 't_j25_1', section: 'Coordination', text: 'Stage Construction Starts (Timelapse Rigging)', status: 'Pending' },
      { id: 't_j25_2', section: 'Shoot', text: 'Venue Mood Cinematics (Empty Venue)', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 26',
    description: 'Technical testing',
    status: 'Pending',
    tasks: [
      { id: 't_j26_1', section: 'Shoot', text: 'Drone shots testing at Air Force Ground', status: 'Pending' },
      { id: 't_j26_2', section: 'Edit', text: 'Venue Mood Cinematics & Stage Timelapse Day 1', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 27',
    description: 'Rehearsals Warmup',
    status: 'Pending',
    tasks: [
      { id: 't_j27_1', section: 'Coordination', text: 'Artist Rehearsal Audio tests & alignment', status: 'Pending' },
      { id: 't_j27_2', section: 'Shoot', text: 'Pre-event buildup & fan interviews', status: 'Pending' },
      { id: 't_j27_3', section: 'Edit', text: 'Timelapse build final assembly segment', status: 'Pending' }
    ]
  },
  {
    date: 'JUNE 28',
    description: 'EVENT DAY',
    status: 'LIVE EVENT',
    isEventDay: true,
    tasks: [
      { id: 't_j28_1', section: 'Shoot', text: 'Live Production Coverage', status: 'Pending' },
      { id: 't_j28_2', section: 'Shoot', text: 'Crowd Reels Production', status: 'Pending' },
      { id: 't_j28_3', section: 'Shoot', text: 'Aftermovie Capture', status: 'Pending' },
      { id: 't_j28_4', section: 'Shoot', text: 'Stage Coverage', status: 'Pending' },
      { id: 't_j28_5', section: 'Shoot', text: 'Artist Coverage', status: 'Pending' },
      { id: 't_j28_6', section: 'Shoot', text: 'Drone Coverage', status: 'Pending' }
    ]
  }
];
