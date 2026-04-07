import {
  Organization,
  Product,
  Team,
  TeamMember,
  MarketModel,
  MarketSegment,
  Vision,
  BusinessObjective,
  Strategy,
  ProductObjective,
  Feature,
  Task,
  Feedback,
  Release,
} from '@/types';

// Team Members
export const mockTeamMembers: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Sarah Chen',
    email: 'sarah@company.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
  {
    id: 'tm-2',
    name: 'Michael Torres',
    email: 'michael@company.com',
    role: 'manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
  },
  {
    id: 'tm-3',
    name: 'Emma Johnson',
    email: 'emma@company.com',
    role: 'member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
  },
  {
    id: 'tm-4',
    name: 'David Kim',
    email: 'david@company.com',
    role: 'member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
  },
];

// Organizations
export const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'TechCorp Inc.',
    description: 'Enterprise software solutions',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'org-2',
    name: 'StartupXYZ',
    description: 'Innovative SaaS platform',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
];

// Teams
export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Product Team',
    organizationId: 'org-1',
    members: [mockTeamMembers[0], mockTeamMembers[1]],
  },
  {
    id: 'team-2',
    name: 'Engineering',
    organizationId: 'org-1',
    members: [mockTeamMembers[2], mockTeamMembers[3]],
  },
];

// Products
export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    organizationId: 'org-1',
    name: 'CloudSync Pro',
    url: 'https://cloudsync.pro',
    description: 'Enterprise cloud synchronization platform for seamless team collaboration',
    productManagerId: 'tm-1',
    teamIds: ['team-1', 'team-2'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'prod-2',
    organizationId: 'org-1',
    name: 'DataVault',
    url: 'https://datavault.io',
    description: 'Secure data management and analytics solution',
    productManagerId: 'tm-2',
    teamIds: ['team-2'],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-05-20'),
  },
];

// Market Segments
export const mockMarketSegments: MarketSegment[] = [
  {
    id: 'seg-1',
    productId: 'prod-1',
    name: 'Enterprise (1000+ employees)',
    population: 50000,
    size: 2500000000,
    notes: 'Focus on Fortune 500 companies',
    assumptions: 'Average deal size $50k/year',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'seg-2',
    productId: 'prod-1',
    name: 'Mid-Market (100-999 employees)',
    population: 200000,
    size: 4000000000,
    notes: 'High growth potential',
    assumptions: 'Average deal size $20k/year',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'seg-3',
    productId: 'prod-1',
    name: 'SMB (10-99 employees)',
    population: 500000,
    size: 2500000000,
    notes: 'Self-serve focus',
    assumptions: 'Average deal size $5k/year',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

// Market Model
export const mockMarketModel: MarketModel = {
  id: 'mm-1',
  productId: 'prod-1',
  totalAddressableMarket: 15000000000,
  serviceableAddressableMarket: 9000000000,
  serviceableObtainableMarket: 900000000,
  timeHorizonYears: 5,
  currency: 'USD',
  segments: mockMarketSegments,
  createdAt: new Date('2024-01-20'),
  updatedAt: new Date('2024-06-01'),
};

// Vision
export const mockVision: Vision = {
  id: 'vis-1',
  productId: 'prod-1',
  statement: 'To become the leading cloud collaboration platform that enables teams worldwide to work seamlessly across any device, anywhere.',
  targetCustomer: 'Growing businesses with distributed teams who need reliable, secure, and intuitive collaboration tools.',
  coreProblem: 'Teams waste hours daily searching for files, managing versions, and coordinating work across disconnected tools.',
  longTermImpact: 'Every knowledge worker can focus on meaningful work instead of file management and coordination overhead.',
  differentiation: [
    'Real-time sync with offline-first architecture',
    'Enterprise-grade security with consumer-grade simplicity',
    'AI-powered organization and search',
    'Seamless integration with 200+ business tools',
  ],
  createdAt: new Date('2024-01-20'),
  updatedAt: new Date('2024-06-01'),
};

// Business Objectives
export const mockBusinessObjectives: BusinessObjective[] = [
  {
    id: 'bo-1',
    productId: 'prod-1',
    statement: 'Capture 5% of the mid-market segment through self-serve acquisition',
    quarter: 'Q2',
    year: 2024,
    targetSegmentIds: ['seg-2'],
    metrics: [
      {
        id: 'bm-1',
        name: 'Monthly Recurring Revenue',
        type: 'revenue',
        baselineValue: 500000,
        targetValue: 750000,
        currentValue: 620000,
        unit: 'USD',
      },
      {
        id: 'bm-2',
        name: 'New Customer Acquisition',
        type: 'adoption',
        baselineValue: 100,
        targetValue: 250,
        currentValue: 180,
        unit: 'customers',
      },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'bo-2',
    productId: 'prod-1',
    statement: 'Improve customer retention to 95% through enhanced user experience',
    quarter: 'Q2',
    year: 2024,
    targetSegmentIds: ['seg-1', 'seg-2'],
    metrics: [
      {
        id: 'bm-3',
        name: 'Customer Retention Rate',
        type: 'retention',
        baselineValue: 88,
        targetValue: 95,
        currentValue: 92,
        unit: '%',
      },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
  },
];

// Strategies
export const mockStrategies: Strategy[] = [
  {
    id: 'str-1',
    businessObjectiveId: 'bo-1',
    statement: 'Launch self-serve onboarding flow with free trial conversion optimization',
    rationale: 'Mid-market buyers prefer to evaluate software independently before engaging sales',
    primaryMetrics: ['Trial-to-paid conversion rate', 'Time-to-value'],
    leadingIndicators: ['Trial signups', 'Feature adoption in first 7 days'],
    riskAssumptions: ['Competitors may copy our approach', 'Self-serve may cannibalize enterprise sales'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'str-2',
    businessObjectiveId: 'bo-2',
    statement: 'Implement proactive customer success program with health scoring',
    rationale: 'Early intervention prevents churn; data-driven approach scales better than reactive support',
    primaryMetrics: ['Customer health score', 'NPS'],
    leadingIndicators: ['Support ticket volume', 'Feature usage patterns'],
    riskAssumptions: ['Health scoring model accuracy', 'Customer willingness to engage'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-01'),
  },
];

// Product Objectives
export const mockProductObjectives: ProductObjective[] = [
  {
    id: 'po-1',
    strategyId: 'str-1',
    statement: 'Enable users to experience core value within 5 minutes of signup',
    successMetrics: ['Time to first sync < 5 min', 'First-week retention > 60%'],
    measurementMethod: 'Analytics tracking of onboarding milestones',
    timeframe: 'Q2 2024',
    priority: 'critical',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'po-2',
    strategyId: 'str-1',
    statement: 'Provide clear upgrade path with compelling value demonstration',
    successMetrics: ['Trial-to-paid conversion > 15%', 'Upgrade page CTR > 25%'],
    measurementMethod: 'Conversion funnel analytics',
    timeframe: 'Q2 2024',
    priority: 'high',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'po-3',
    strategyId: 'str-2',
    statement: 'Surface usage insights that help customers maximize product value',
    successMetrics: ['Dashboard engagement > 40%', 'Feature discovery +30%'],
    measurementMethod: 'In-app analytics and user surveys',
    timeframe: 'Q2 2024',
    priority: 'high',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-06-01'),
  },
];

// Features
export const mockFeatures: Feature[] = [
  {
    id: 'feat-1',
    productObjectiveId: 'po-1',
    name: 'Quick Start Wizard',
    description: 'Guided onboarding flow that helps users set up their first project and sync files within minutes',
    category: 'new',
    source: 'strategy',
    ownerId: 'tm-1',
    teamIds: ['team-1', 'team-2'],
    status: 'in_progress',
    priority: 'critical',
    expectedOutcome: 'Reduce time-to-first-sync from 15 min to under 5 min',
    successMetrics: ['Onboarding completion rate > 80%', 'Time to first sync < 5 min'],
    dueDate: new Date('2024-07-15'),
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'feat-2',
    productObjectiveId: 'po-1',
    name: 'Template Gallery',
    description: 'Pre-built templates for common use cases to accelerate initial setup',
    category: 'new',
    source: 'feedback',
    ownerId: 'tm-2',
    teamIds: ['team-1'],
    status: 'backlog',
    priority: 'high',
    expectedOutcome: 'Provide instant value for 70% of use cases',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'feat-3',
    productObjectiveId: 'po-2',
    name: 'Usage-Based Upgrade Prompts',
    description: 'Contextual prompts that appear when users hit free tier limits',
    category: 'improvement',
    source: 'strategy',
    ownerId: 'tm-1',
    teamIds: ['team-1', 'team-2'],
    status: 'in_review',
    priority: 'high',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'feat-4',
    productObjectiveId: 'po-3',
    name: 'Customer Health Dashboard',
    description: 'Admin dashboard showing usage patterns, engagement metrics, and health indicators',
    category: 'new',
    source: 'strategy',
    ownerId: 'tm-3',
    teamIds: ['team-2'],
    status: 'done',
    priority: 'high',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-05-15'),
  },
];

// Tasks
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    featureId: 'feat-1',
    name: 'Design onboarding flow wireframes',
    description: 'Create low-fidelity wireframes for the 5-step onboarding wizard',
    ownerIds: ['tm-1'],
    status: 'done',
    priority: 'high',
    startDate: new Date('2024-05-01'),
    dueDate: new Date('2024-05-10'),
    dependencies: [],
    attachments: [],
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-05-10'),
  },
  {
    id: 'task-2',
    featureId: 'feat-1',
    name: 'Implement step 1: Account setup',
    description: 'Build the first step of the wizard with name, team size, and use case selection',
    ownerIds: ['tm-3', 'tm-4'],
    status: 'in_progress',
    priority: 'high',
    startDate: new Date('2024-05-11'),
    dueDate: new Date('2024-05-25'),
    dependencies: ['task-1'],
    attachments: [],
    createdAt: new Date('2024-05-11'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'task-3',
    featureId: 'feat-1',
    name: 'Implement step 2: First project creation',
    ownerIds: ['tm-3'],
    status: 'todo',
    priority: 'high',
    dueDate: new Date('2024-06-05'),
    dependencies: ['task-2'],
    attachments: [],
    createdAt: new Date('2024-05-11'),
    updatedAt: new Date('2024-05-11'),
  },
  {
    id: 'task-4',
    featureId: 'feat-3',
    name: 'Define upgrade prompt trigger rules',
    ownerIds: ['tm-1', 'tm-2'],
    status: 'done',
    priority: 'medium',
    dueDate: new Date('2024-05-20'),
    dependencies: [],
    attachments: [],
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-05-18'),
  },
];

// Feedback
export const mockFeedback: Feedback[] = [
  {
    id: 'fb-1',
    productId: 'prod-1',
    featureIds: [],
    customer: 'Acme Corp',
    segmentId: 'seg-1',
    type: 'request',
    content: 'Would love to see template library for common folder structures',
    frequencyCount: 12,
    createdAt: new Date('2024-04-15'),
    updatedAt: new Date('2024-05-20'),
  },
  {
    id: 'fb-2',
    productId: 'prod-1',
    featureIds: ['feat-4'],
    customer: 'TechStart Inc',
    segmentId: 'seg-2',
    type: 'praise',
    content: 'The new health dashboard is exactly what we needed to track team adoption',
    frequencyCount: 1,
    createdAt: new Date('2024-05-18'),
    updatedAt: new Date('2024-05-18'),
  },
  {
    id: 'fb-3',
    productId: 'prod-1',
    featureIds: [],
    type: 'bug',
    content: 'Sync gets stuck when folder has more than 10,000 files',
    frequencyCount: 5,
    createdAt: new Date('2024-05-25'),
    updatedAt: new Date('2024-06-01'),
  },
];

// Releases
export const mockReleases: Release[] = [
  {
    id: 'rel-1',
    productId: 'prod-1',
    version: '2.4.0',
    releaseDate: new Date('2024-05-15'),
    featureIds: ['feat-4'],
    notes: 'Customer Health Dashboard release',
    createdAt: new Date('2024-05-15'),
  },
];

// Helper to get all mock data
export const getMockData = () => ({
  organizations: mockOrganizations,
  teams: mockTeams,
  teamMembers: mockTeamMembers,
  products: mockProducts,
  marketModel: mockMarketModel,
  marketSegments: mockMarketSegments,
  vision: mockVision,
  businessObjectives: mockBusinessObjectives,
  strategies: mockStrategies,
  productObjectives: mockProductObjectives,
  features: mockFeatures,
  tasks: mockTasks,
  feedback: mockFeedback,
  releases: mockReleases,
});
