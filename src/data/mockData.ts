import { OKRNode } from '@/types';

export const initialData: OKRNode[] = [
    // Top Level Goal
    {
        id: 'g-1',
        type: 'GOAL',
        title: 'Reduce Churn to < 10% by end of 2026',
        parentId: null,
        status: 'in-progress',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expanded: true,
    },

    // Objective 1
    {
        id: 'o-1',
        type: 'OBJECTIVE',
        title: 'Augment AI Discovery and Recommendation Engine',
        parentId: 'g-1',
        status: 'in-progress',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expanded: true,
    },

    // Key Result 1.1
    {
        id: 'kr-1',
        type: 'KEY_RESULT',
        title: 'Achieve a 15% goal completion rate for AI-supported objectives',
        parentId: 'o-1',
        status: 'in-progress',
        progress: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expanded: true,
    },

    // Tasks for KR 1.1
    {
        id: 't-1',
        type: 'TASK',
        title: 'Develop Initial "How-To" Content and Best Practices',
        parentId: 'kr-1',
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 't-2',
        type: 'TASK',
        title: 'Conduct Bi-Weekly Data Review',
        parentId: 'kr-1',
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },

    // Key Result 1.2
    {
        id: 'kr-2',
        type: 'KEY_RESULT',
        title: 'Increase user engagement with recommended goals',
        parentId: 'o-1',
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expanded: false,
    },

    // Objective 2
    {
        id: 'o-2',
        type: 'OBJECTIVE',
        title: 'Elevate AI-Driven Personalization for User...',
        parentId: 'g-1',
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expanded: false,
    },
];
