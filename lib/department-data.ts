import { categoryLabels } from './utils-civic';

export type DepartmentCode = 'water' | 'roads' | 'electricity' | 'garbage';
export type IssuePriority = 'high' | 'medium' | 'low';
export type IssueStatus = 'pending' | 'in-progress' | 'resolved';

export interface Department {
  id: string;
  code: DepartmentCode;
  name: string;
  description: string;
  email: string;
  aliases?: string[];
}

export interface DepartmentIssue {
  id: string;
  title: string;
  description: string;
  priority: IssuePriority;
  status: IssueStatus;
  location: string;
  reported_at: string;
  resolved_at?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  contact_email?: string;
  contact_phone?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const departments: Department[] = [
  {
    id: 'dept-water',
    code: 'water',
    name: 'Water Department',
    description: 'Manage water supply, leakage repairs, and pipeline maintenance.',
    email: 'water@civic-hub.local',
  },
  {
    id: 'dept-roads',
    code: 'roads',
    name: 'Road Department',
    description: 'Handle pothole fixes, street repairs, and road safety complaints.',
    email: 'roads@civic-hub.local',
    aliases: ['road'],
  },
  {
    id: 'dept-electricity',
    code: 'electricity',
    name: 'Electricity Department',
    description: 'Resolve power outages, streetlight issues, and electrical faults.',
    email: 'electricity@civic-hub.local',
  },
  {
    id: 'dept-garbage',
    code: 'garbage',
    name: 'Garbage Department',
    description: 'Coordinate waste collection, dumping complaints, and recycling initiatives.',
    email: 'garbage@civic-hub.local',
  },
];

const issues: DepartmentIssue[] = [
  {
    id: 'issue-001',
    title: 'Burst pipe flooding street',
    description: 'Water has been leaking continuously from a broken pipe near the market. Neighbors are unable to use the road safely.',
    category: 'water',
    priority: 'high',
    status: 'pending',
    location: 'Rajiv Nagar, Sector 12',
    reportedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    assignedDepartment: 'water',
    image: '/placeholder.jpg',
    latitude: '18.5204',
    longitude: '73.8567',
    remarks: ['Awaiting team dispatch'],
  },
  {
    id: 'issue-002',
    title: 'Pothole on main road',
    description: 'A large pothole has developed along the main road and is causing slow traffic and accidents.',
    category: 'roads',
    priority: 'high',
    status: 'in-progress',
    location: 'Pimple Saudagar flyover',
    reportedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    assignedDepartment: 'roads',
    image: '/placeholder.jpg',
    remarks: ['Crew assigned to patch the hole'],
  },
  {
    id: 'issue-003',
    title: 'Streetlight outage',
    description: 'Multiple streetlights are not working on the eastern side of the park after dusk.',
    category: 'electricity',
    priority: 'medium',
    status: 'pending',
    location: 'Kharadi Park Road',
    reportedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    assignedDepartment: 'electricity',
    image: '/placeholder.jpg',
    remarks: ['Replacement bulbs ordered'],
  },
  {
    id: 'issue-004',
    title: 'Overflowing garbage bin',
    description: 'Waste collection is delayed and the bin at the bus stop is overflowing with trash.',
    category: 'garbage',
    priority: 'medium',
    status: 'resolved',
    location: 'NIBM Road bus stop',
    reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    assignedDepartment: 'garbage',
    image: '/placeholder.jpg',
    resolutionProof: '/placeholder.jpg',
    remarks: ['Picked up by sanitation crew'],
  },
  {
    id: 'issue-005',
    title: 'Water meter malfunction',
    description: 'The water meter shows incorrect consumption and residents are facing billing issues.',
    category: 'water',
    priority: 'low',
    status: 'in-progress',
    location: 'Nagar Road, Block C',
    reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    assignedDepartment: 'water',
    image: '/placeholder.jpg',
    remarks: ['Technician scheduled to inspect'],
  },
  {
    id: 'issue-006',
    title: 'Traffic signal not changing',
    description: 'The traffic signal at the junction has been stuck on red for several minutes.',
    category: 'electricity',
    priority: 'high',
    status: 'pending',
    location: 'Koregaon Park Junction',
    reportedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    assignedDepartment: 'electricity',
    image: '/placeholder.jpg',
    remarks: [],
  },
];

function normalizeDepartmentCode(code: string) {
  return code?.toString().trim().toLowerCase();
}

export function getDepartmentByCode(code: string) {
  const normalizedCode = normalizeDepartmentCode(code);
  if (!normalizedCode) return undefined;

  return departments.find((department) => {
    const matchesCode = department.code === normalizedCode;
    const matchesAlias = department.aliases?.some((alias) => normalizeDepartmentCode(alias) === normalizedCode);
    const matchesSingular = department.code.endsWith('s')
      ? department.code.slice(0, -1) === normalizedCode
      : department.code === `${normalizedCode}s`;

    return matchesCode || matchesAlias || matchesSingular;
  });
}

export function getAllDepartments() {
  return departments;
}

export function getIssuesForDepartment(code: string) {
  return issues.filter((issue) => issue.assignedDepartment === code);
}

export function getIssueById(id: string) {
  return issues.find((issue) => issue.id === id);
}

export function getDepartmentStats(code: string) {
  const assignedIssues = getIssuesForDepartment(code);
  const total = assignedIssues.length;
  const pending = assignedIssues.filter((issue) => issue.status === 'pending').length;
  const inProgress = assignedIssues.filter((issue) => issue.status === 'in-progress').length;
  const resolved = assignedIssues.filter((issue) => issue.status === 'resolved').length;
  const priority = {
    high: assignedIssues.filter((issue) => issue.priority === 'high').length,
    medium: assignedIssues.filter((issue) => issue.priority === 'medium').length,
    low: assignedIssues.filter((issue) => issue.priority === 'low').length,
  };

  return {
    total,
    pending,
    inProgress,
    resolved,
    priority,
    latest: assignedIssues
      .slice()
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
      .slice(0, 3),
  };
}

export function getIssueTrend(code: string) {
  const assignedIssues = getIssuesForDepartment(code);
  const now = new Date();
  const weekly = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index));
    const label = day.toLocaleDateString('en-US', { weekday: 'short' });
    const count = assignedIssues.filter((issue) => {
      const created = new Date(issue.reportedAt);
      return (
        created.getDate() === day.getDate() &&
        created.getMonth() === day.getMonth() &&
        created.getFullYear() === day.getFullYear()
      );
    }).length;
    return { label, count };
  });

  const monthly = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const label = month.toLocaleDateString('en-US', { month: 'short' });
    const count = assignedIssues.filter((issue) => {
      const created = new Date(issue.reportedAt);
      return created.getMonth() === month.getMonth() && created.getFullYear() === month.getFullYear();
    }).length;
    return { label, count };
  });

  return { weekly, monthly };
}

/**
 * Calculate average resolution time for resolved issues in days
 * @param code - Department code
 * @returns Average resolution time in days rounded to 1 decimal place
 */
export function getAverageResolutionTime(code: string): number {
  const assignedIssues = getIssuesForDepartment(code);
  const resolvedIssues = assignedIssues.filter((issue) => issue.status === 'resolved' && issue.resolvedAt);

  if (resolvedIssues.length === 0) {
    return 0;
  }

  const totalResolutionTime = resolvedIssues.reduce((sum, issue) => {
    const reportedDate = new Date(issue.reportedAt);
    const resolvedDate = new Date(issue.resolvedAt!);
    const differenceInMs = resolvedDate.getTime() - reportedDate.getTime();
    const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);
    return sum + differenceInDays;
  }, 0);

  return Math.round((totalResolutionTime / resolvedIssues.length) * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate closure rate as a percentage
 * @param code - Department code
 * @returns Closure rate percentage
 */
export function getClosureRate(code: string): { resolved: number; total: number; percentage: number } {
  const assignedIssues = getIssuesForDepartment(code);
  const resolved = assignedIssues.filter((issue) => issue.status === 'resolved').length;
  const total = assignedIssues.length;
  const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return { resolved, total, percentage };
}

export function updateIssueStatus(id: string, status: IssueStatus, remark?: string) {
  const issue = getIssueById(id);
  if (!issue) return null;
  issue.status = status;
  if (status === 'resolved' && !issue.resolvedAt) {
    issue.resolvedAt = new Date().toISOString();
  }
  if (remark) {
    issue.remarks = [...(issue.remarks || []), remark];
  }
  return issue;
}
