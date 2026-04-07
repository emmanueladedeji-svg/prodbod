export interface MockUser {
  id: string;
  name: string;
  initials: string;
  department: string;
  avatarColor: string;
}

export const MOCK_TEAM_DIRECTORY: MockUser[] = [
  { id: 'u-1', name: 'Sarah Johnson', initials: 'SJ', department: 'Product', avatarColor: 'from-violet-500 to-purple-600' },
  { id: 'u-2', name: 'David Kim', initials: 'DK', department: 'Engineering', avatarColor: 'from-blue-500 to-cyan-600' },
  { id: 'u-3', name: 'Aisha Bello', initials: 'AB', department: 'Design', avatarColor: 'from-pink-500 to-rose-600' },
  { id: 'u-4', name: 'Michael Chen', initials: 'MC', department: 'Engineering', avatarColor: 'from-emerald-500 to-teal-600' },
  { id: 'u-5', name: 'Daniel Okafor', initials: 'DO', department: 'QA', avatarColor: 'from-orange-500 to-amber-600' },
  { id: 'u-6', name: 'Priya Sharma', initials: 'PS', department: 'Product', avatarColor: 'from-indigo-500 to-blue-600' },
  { id: 'u-7', name: 'James Adeyemi', initials: 'JA', department: 'Engineering', avatarColor: 'from-red-500 to-pink-600' },
  { id: 'u-8', name: 'Nina Petrov', initials: 'NP', department: 'Design', avatarColor: 'from-teal-500 to-green-600' },
];

export const OPTIONAL_ROLES = ['Contributor', 'Designer', 'Engineer', 'QA', 'Other'] as const;
export type OptionalRole = typeof OPTIONAL_ROLES[number];

export interface ProductTeamData {
  selectedMemberIds: string[];
  productManager: string | null;
  scrumMaster: string | null;
  leadDeveloper: string | null;
  leadDesigner: string | null;
  memberRoles: Record<string, OptionalRole | null>;
}

export const EMPTY_TEAM_DATA: ProductTeamData = {
  selectedMemberIds: [],
  productManager: null,
  scrumMaster: null,
  leadDeveloper: null,
  leadDesigner: null,
  memberRoles: {},
};

// ── Product team storage (localStorage — prototype only) ──────────────────

const STORAGE_KEY = 'rest-product-teams';

export function saveProductTeam(productId: string, data: ProductTeamData) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    all[productId] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* noop */ }
}

export function loadProductTeam(productId: string): ProductTeamData | null {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return all[productId] ?? null;
  } catch {
    return null;
  }
}

// ── Organization member storage (localStorage — prototype only) ───────────

const ORG_MEMBERS_KEY = 'rest-org-members';

export function saveOrgMembers(orgId: string, memberIds: string[]) {
  try {
    const all = JSON.parse(localStorage.getItem(ORG_MEMBERS_KEY) || '{}');
    all[orgId] = memberIds;
    localStorage.setItem(ORG_MEMBERS_KEY, JSON.stringify(all));
  } catch { /* noop */ }
}

export function loadOrgMembers(orgId: string): string[] {
  try {
    const all = JSON.parse(localStorage.getItem(ORG_MEMBERS_KEY) || '{}');
    return all[orgId] ?? [];
  } catch {
    return [];
  }
}

export function getUserById(id: string): MockUser | undefined {
  return MOCK_TEAM_DIRECTORY.find(u => u.id === id);
}
