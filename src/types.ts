export type OKRType = 'GOAL' | 'OBJECTIVE' | 'KEY_RESULT' | 'TASK';

export interface OKRNode {
    id: string;
    type: OKRType;
    title: string;
    description?: string;
    parentId: string | null;
    status: 'pending' | 'in-progress' | 'completed';
    progress: number;
    owner: string;
    ownerName?: string;
    organizationId: string; // New field
    teamId?: string;
    teamName?: string;
    children?: OKRNode[];
    expanded?: boolean;
    startDate?: string;
    endDate?: string;
    metricType?: 'boolean' | 'percentage' | 'value' | 'checklist';
    metricStart?: number;
    metricTarget?: number;
    metricUnit?: string;
    metricAsc?: boolean;
    checklist?: { text: string; checked: boolean }[];
    currentValue?: number;
    lastCheckinDate?: string;
    lastCommentAt?: string;
    unread?: boolean;
    estimatedHours?: number;
    // Runtime props
    onFocus?: (id: string) => void;
    createdAt: string;
    updatedAt: string;
}

export interface OKRUpdate {
    id: string;
    okrId: string;
    userId: string; // ID of user who made update
    progressValue: number; // % progress or 0-1 for boolean
    currentValue?: number; // Raw value (e.g. $ amount)
    comment?: string;
    checkinDate: string;
    createdAt: string;
}

export interface Organization {
    id: string;
    name: string;
    createdAt: string;
}

export interface OrganizationMember {
    id: string;
    organizationId: string;
    userId: string;
    role: 'admin' | 'member';
}

export const NODE_COLORS: Record<OKRType, string> = {
    GOAL: 'bg-purple-600',
    OBJECTIVE: 'bg-blue-600',
    KEY_RESULT: 'bg-green-600',
    TASK: 'bg-slate-500'
};

export const NODE_LABELS: Record<OKRType, string> = {
    GOAL: 'Goal',
    OBJECTIVE: 'Objective',
    KEY_RESULT: 'Key Result',
    TASK: 'Task'
};
