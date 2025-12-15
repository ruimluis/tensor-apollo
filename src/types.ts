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
    organizationId: string; // New field
    children?: OKRNode[];
    expanded?: boolean;
    createdAt: string;
    updatedAt: string;
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
