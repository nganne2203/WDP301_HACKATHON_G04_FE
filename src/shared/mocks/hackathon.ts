// Mock data for the SEAL Hackathon Platform

export const mockEvent = {
  id: 'evt-2026a',
  title: 'SEAL Hackathon 2026',
  semester: '2026A',
  status: 'ongoing' as const,
  startDate: '2026-05-01',
  endDate: '2026-05-31',
  maxTeams: 30,
};

export const mockMetrics = {
  participants: 87,
  teams: 28,
  maxTeams: 30,
  checkedIn: 82,
  repoAccess: 28,
  judgingProgress: 65,
  finalists: 6,
  resultsPublished: false,
};

export const lifecycleSteps = [
  { label: 'Registration', status: 'completed' as const },
  { label: 'Team Formation', status: 'completed' as const },
  { label: 'Check-in & Seminar', status: 'completed' as const },
  { label: 'Coding', status: 'active' as const },
  { label: 'Preliminary Judging', status: 'pending' as const },
  { label: 'Final Round', status: 'pending' as const },
  { label: 'Repository Locking', status: 'pending' as const },
  { label: 'Result Publishing', status: 'pending' as const },
];

export const mockTeams = [
  {
    id: 'team-001',
    name: 'Code Wizards',
    leader: 'Alice Chen',
    members: 3,
    track: 'Web Development',
    repoStatus: 'granted' as const,
    submissionStatus: 'submitted' as const,
    board: 1,
    score: 85,
  },
  {
    id: 'team-002',
    name: 'Data Ninjas',
    leader: 'Bob Smith',
    members: 3,
    track: 'AI/ML',
    repoStatus: 'granted' as const,
    submissionStatus: 'submitted' as const,
    board: 1,
    score: 92,
  },
  {
    id: 'team-003',
    name: 'Cloud Architects',
    leader: 'Carol Wang',
    members: 3,
    track: 'Cloud Computing',
    repoStatus: 'granted' as const,
    submissionStatus: 'pending' as const,
    board: 2,
    score: 88,
  },
];

export const mockParticipants = [
  {
    id: 'usr-001',
    name: 'Alice Chen',
    email: 'alice.chen@university.edu',
    status: 'active' as const,
    team: 'Code Wizards',
    role: 'Team Leader',
    checkedIn: true,
    githubAccess: true,
  },
  {
    id: 'usr-002',
    name: 'Bob Smith',
    email: 'bob.smith@university.edu',
    status: 'active' as const,
    team: 'Data Ninjas',
    role: 'Team Leader',
    checkedIn: true,
    githubAccess: true,
  },
  {
    id: 'usr-003',
    name: 'Carol Wang',
    email: 'carol.wang@university.edu',
    status: 'registered' as const,
    team: null,
    role: 'Participant',
    checkedIn: false,
    githubAccess: false,
  },
];

export const mockJudgingBoards = [
  {
    id: 'board-1',
    name: 'Board A',
    teams: 10,
    judges: ['Dr. Johnson', 'Prof. Lee'],
    status: 'scoring' as const,
    progress: 70,
  },
  {
    id: 'board-2',
    name: 'Board B',
    teams: 10,
    judges: ['Dr. Martinez', 'Prof. Zhang'],
    status: 'scoring' as const,
    progress: 65,
  },
  {
    id: 'board-3',
    name: 'Board C',
    teams: 8,
    judges: ['Dr. Anderson', 'Prof. Kumar'],
    status: 'assigned' as const,
    progress: 30,
  },
];

export const mockRubricCriteria = [
  {
    id: 'crit-1',
    name: 'Innovation & Creativity',
    maxScore: 20,
    description: 'Originality of idea and creative approach',
  },
  {
    id: 'crit-2',
    name: 'Technical Implementation',
    maxScore: 25,
    description: 'Code quality, architecture, and technical execution',
  },
  {
    id: 'crit-3',
    name: 'Functionality & Completeness',
    maxScore: 20,
    description: 'Working features and project completeness',
  },
  {
    id: 'crit-4',
    name: 'Presentation & Documentation',
    maxScore: 15,
    description: 'Quality of demo, documentation, and communication',
  },
  {
    id: 'crit-5',
    name: 'Impact & Usability',
    maxScore: 20,
    description: 'Real-world applicability and user experience',
  },
];

export const mockFinalists = [
  { rank: 1, team: 'Data Ninjas', score: 92, board: 'A', prize: 'Gold' },
  { rank: 2, team: 'Cloud Architects', score: 88, board: 'B', prize: 'Silver' },
  { rank: 3, team: 'Code Wizards', score: 85, board: 'A', prize: 'Bronze' },
  { rank: 4, team: 'AI Innovators', score: 83, board: 'C', prize: 'Finalist' },
  { rank: 5, team: 'Security Squad', score: 81, board: 'B', prize: 'Finalist' },
  { rank: 6, team: 'Mobile Masters', score: 79, board: 'C', prize: 'Finalist' },
];
