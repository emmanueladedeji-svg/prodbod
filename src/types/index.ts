// Core Types for REST Product Intelligence ERP

export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  avatar?: string;
}

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  url?: string;
  description?: string;
  productManagerId?: string;
  teamIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketSegment {
  id: string;
  productId: string;
  name: string;
  population: number;
  size: number; // TAM slice in currency
  notes?: string;
  assumptions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketModel {
  id: string;
  productId: string;
  totalAddressableMarket: number;
  serviceableAddressableMarket?: number;
  serviceableObtainableMarket?: number;
  timeHorizonYears: number;
  currency: string;
  segments: MarketSegment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Vision {
  id: string;
  productId: string;
  statement: string;
  targetCustomer: string;
  coreProblem: string;
  longTermImpact: string;
  differentiation: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessObjective {
  id: string;
  productId: string;
  statement: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  targetSegmentIds: string[];
  metrics: BusinessMetric[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessMetric {
  id: string;
  name: string;
  type: 'revenue' | 'adoption' | 'retention' | 'market_penetration' | 'custom';
  baselineValue: number;
  targetValue: number;
  currentValue?: number;
  unit: string;
}

export interface Strategy {
  id: string;
  businessObjectiveId: string;
  statement: string;
  rationale: string;
  primaryMetrics: string[];
  leadingIndicators: string[];
  riskAssumptions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductObjective {
  id: string;
  strategyId: string;
  statement: string;
  successMetrics: string[];
  measurementMethod: string;
  timeframe: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

export interface Feature {
  id: string;
  productObjectiveId: string;
  parentFeatureId?: string; // For sub-features
  name: string;
  description: string;
  category: 'new' | 'improvement' | 'experiment' | 'technical';
  source: 'strategy' | 'feedback' | 'internal';
  ownerId?: string;
  teamIds: string[];
  status: FeatureStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedOutcome?: string;
  successMetrics?: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type FeatureStatus = 
  | 'idea' 
  | 'discovery' 
  | 'in_development' 
  | 'in_testing' 
  | 'live' 
  | 'closed';

export const FEATURE_STATUSES: Array<{
  key: FeatureStatus;
  label: string;
  color: string;       // hex, used for chart segments and badges
  bgColor: string;     // light bg for badge chips, e.g. '#F3F4F6'
}> = [
  { key: 'idea',           label: 'Idea / Problem',   color: '#8B5CF6', bgColor: '#EDE9FE' },
  { key: 'discovery',      label: 'Discovery',         color: '#3B82F6', bgColor: '#DBEAFE' },
  { key: 'in_development', label: 'In Development',    color: '#F59E0B', bgColor: '#FEF3C7' },
  { key: 'in_testing',     label: 'In Testing',        color: '#EC4899', bgColor: '#FCE7F3' },
  { key: 'live',           label: 'Live',              color: '#10B981', bgColor: '#D1FAE5' },
  { key: 'closed',         label: 'Closed',            color: '#6B7280', bgColor: '#F3F4F6' },
];

export interface ProductRole {
  userId: string;
  name: string;        // display name from profiles table
  initials: string;    // computed: first letter of first + last name
  avatarColor: string; // deterministic color from userId hash
}

export interface FeatureWithAssignee {
  id: string;
  name: string;
  status: FeatureStatus;
  is_sub_feature: boolean;
  parent_feature_id: string | null;
  assignee: ProductRole | null;
}

export interface Task {
  id: string;
  featureId: string;
  name: string;
  description?: string;
  ownerIds: string[]; // Multiple owners
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  dueDate?: Date;
  dependencies: string[]; // Task IDs
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface TestCase {
  id: string;
  featureId: string;
  title: string;
  description: string;
  preconditions?: string;
  expectedOutcome: string;
  actualOutcome?: string;
  status: 'not_run' | 'passed' | 'failed';
  environment: 'local' | 'staging' | 'pilot' | 'production';
  createdAt: Date;
  updatedAt: Date;
}

export interface Release {
  id: string;
  productId: string;
  version?: string;
  releaseDate: Date;
  featureIds: string[];
  notes?: string;
  createdAt: Date;
}

export interface Feedback {
  id: string;
  productId: string;
  featureIds: string[];
  customer?: string;
  segmentId?: string;
  type: 'bug' | 'request' | 'improvement' | 'praise';
  content: string;
  frequencyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// View types
export type ViewMode = 'list' | 'kanban' | 'calendar' | 'timeline';

// Navigation
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}
