import { create } from 'zustand';
import { OKRNode } from '@/types';
import { supabase } from '@/lib/supabase';

interface OKRState {
    nodes: OKRNode[];
    loading: boolean;
    error: string | null;
    organizationId: string | null;

    fetchNodes: () => Promise<void>;
    addNode: (node: Partial<OKRNode>) => Promise<void>;
    updateNode: (id: string, updates: Partial<OKRNode>) => Promise<void>;
    deleteNode: (id: string) => Promise<void>;
    addCheckIn: (nodeId: string, update: { value: number | null, progress: number, comment: string, date: string, checklist?: any[] }) => Promise<void>;
    updateTaskDependencies: (taskId: string, dependencyIds: string[]) => Promise<void>;
    toggleExpand: (id: string) => Promise<void>;
    focusedNodeId: string | null;
    setFocusedNodeId: (id: string | null) => void;
}

export const useOKRStore = create<OKRState>((set, get) => ({
    nodes: [],
    loading: false,
    error: null,
    organizationId: null,
    focusedNodeId: null,

    setFocusedNodeId: (id) => set({ focusedNodeId: id }),

    fetchNodes: async () => {
        set({ loading: true, error: null });
        try {
            // 1. Get Current User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ loading: false });
                return;
            }

            // 1b. SELF-HEALING: Profile Check
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            if (!profile) {
                console.log("Missing profile found. Restoring...");
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: user.id,
                        full_name: user.user_metadata?.full_name || user.email,
                        avatar_url: user.user_metadata?.avatar_url
                    }]);
                if (profileError) console.error(profileError);
            }

            // 2. Get User's Organization (Single Tenant Mode)
            let { data: members } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', user.id)
                .limit(1);

            let orgId = members?.[0]?.organization_id;

            // 3. AUTO-ONBOARDING
            if (!orgId) {
                console.log("No organization found. Creating default...");
                // Use Name from SignUp if available
                const orgName = user.user_metadata?.org_name || `${user.email?.split('@')[0]}'s Organization`;

                const { data: newOrg, error: orgError } = await supabase
                    .rpc('create_organization_for_user', { org_name: orgName });

                if (orgError) throw orgError;
                // RPC allows returning 1 row
                const created = Array.isArray(newOrg) ? newOrg[0] : newOrg;
                if (created) orgId = created.org_id;
            }

            set({ organizationId: orgId });

            if (orgId) {
                // 4. Fetch OKRs
                const { data, error } = await supabase
                    .from('okrs')
                    .select('*, teams(name), profiles:user_id(full_name)')
                    .eq('organization_id', orgId)
                    .order('created_at', { ascending: true });

                if (error) throw error;

                // 4b. Fetch Read Status (Safe Check)
                let readMap = new Map<string, number>();
                try {
                    const { data: readData, error: readError } = await supabase
                        .from('okr_comment_reads')
                        .select('okr_id, last_read_at')
                        .eq('user_id', user.id);

                    if (!readError && readData) {
                        readData.forEach((r: any) => {
                            readMap.set(r.okr_id, new Date(r.last_read_at).getTime());
                        });
                    }
                } catch (e) {
                    console.warn("Could not fetch read status", e);
                }

                // 4c. Fetch Dependencies
                let depMap = new Map<string, string[]>();
                try {
                    const { data: depData, error: depError } = await supabase
                        .from('task_dependencies')
                        .select('task_id, dependency_id');

                    if (!depError && depData) {
                        depData.forEach((row: any) => {
                            const current = depMap.get(row.task_id) || [];
                            depMap.set(row.task_id, [...current, row.dependency_id]);
                        });
                    }
                } catch (e) {
                    console.warn("Could not fetch dependencies", e);
                }

                const mappedNodes: OKRNode[] = (data || []).map((row: any) => {
                    const lastCommentTime = row.last_comment_at ? new Date(row.last_comment_at).getTime() : 0;
                    const lastReadTime = readMap.get(row.id) || 0;
                    const isUnread = lastCommentTime > lastReadTime;

                    return {
                        id: row.id,
                        type: row.type,
                        title: row.title,
                        description: row.description,
                        parentId: row.parent_id,
                        status: row.status,
                        progress: row.progress,
                        owner: row.user_id,
                        ownerName: row.profiles?.full_name,
                        organizationId: row.organization_id,
                        teamId: row.team_id,
                        teamName: row.teams?.name,
                        startDate: row.start_date,
                        endDate: row.end_date,
                        metricType: row.metric_type,
                        metricStart: row.metric_start,
                        metricTarget: row.metric_target,
                        metricUnit: row.metric_unit,
                        metricAsc: row.metric_asc,
                        checklist: row.checklist,
                        currentValue: row.current_value,
                        lastCheckinDate: row.last_checkin_date,
                        lastCommentAt: row.last_comment_at,
                        unread: isUnread,
                        createdAt: row.created_at,
                        updatedAt: row.updated_at,
                        expanded: row.expanded,
                        estimatedHours: row.estimated_hours,
                        dependencies: depMap.get(row.id) || []
                    };
                });

                console.log("OKRs Fetched:", mappedNodes.length);
                set({ nodes: mappedNodes, loading: false });
            } else {
                console.log("No Organization Found - stopping load.");
                set({ loading: false });
            }
        } catch (err: any) {
            console.error("Error fetching nodes:", err);
            set({ error: err.message, loading: false });
        }
    },

    addNode: async (node) => {
        const { organizationId } = get();
        if (!organizationId) {
            alert("No organization found.");
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('okrs')
                .insert([{
                    user_id: node.owner || user.id, // Default to creator if no owner
                    organization_id: organizationId,
                    team_id: node.teamId || null, // Convert "" to null
                    type: node.type,
                    title: node.title,
                    description: node.description,
                    parent_id: node.parentId,
                    status: node.status || 'pending',
                    progress: node.progress || 0,
                    start_date: node.startDate || null,
                    end_date: node.endDate || null,
                    metric_type: node.metricType || null,
                    metric_start: node.metricStart || null,
                    metric_target: node.metricTarget || null,
                    metric_unit: node.metricUnit || null,
                    metric_asc: node.metricAsc !== undefined ? node.metricAsc : true,
                    checklist: node.checklist || null,
                    expanded: true,
                    estimated_hours: node.estimatedHours || null
                }])
                .select()
                .single();

            if (error) throw error;

            const newNode: OKRNode = {
                id: data.id,
                type: data.type,
                title: data.title,
                description: data.description,
                parentId: data.parent_id,
                status: data.status,
                progress: data.progress,
                owner: data.user_id,
                organizationId: data.organization_id,
                teamId: data.team_id,
                startDate: data.start_date,
                endDate: data.end_date,
                metricType: data.metric_type,
                metricStart: data.metric_start,
                metricTarget: data.metric_target,
                metricUnit: data.metric_unit,
                metricAsc: data.metric_asc,
                checklist: data.checklist,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                expanded: data.expanded,
                estimatedHours: data.estimated_hours
            };

            set((state) => ({ nodes: [...state.nodes, newNode] }));
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    },

    updateNode: async (id, updates) => {
        set((state) => ({
            nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        }));

        try {
            const dbUpdates: any = {};
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
            if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
            if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
            if (updates.metricType !== undefined) dbUpdates.metric_type = updates.metricType;
            if (updates.metricStart !== undefined) dbUpdates.metric_start = updates.metricStart;
            if (updates.metricTarget !== undefined) dbUpdates.metric_target = updates.metricTarget;
            if (updates.metricUnit !== undefined) dbUpdates.metric_unit = updates.metricUnit;
            if (updates.metricAsc !== undefined) dbUpdates.metric_asc = updates.metricAsc;
            if (updates.checklist !== undefined) dbUpdates.checklist = updates.checklist;
            if (updates.teamId !== undefined) dbUpdates.team_id = updates.teamId || null;
            if (updates.owner !== undefined) dbUpdates.user_id = updates.owner || null;
            if (updates.expanded !== undefined) dbUpdates.expanded = updates.expanded;
            if (updates.estimatedHours !== undefined) dbUpdates.estimated_hours = updates.estimatedHours;

            const { error } = await supabase.from('okrs').update(dbUpdates).eq('id', id);
            if (error) throw error;
        } catch (err: any) {
            console.error(err);
        }
    },

    deleteNode: async (id) => {
        set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== id),
        }));

        try {
            const { error } = await supabase.from('okrs').delete().eq('id', id);
            if (error) throw error;
        } catch (err: any) {
            console.error(err);
        }
    },

    addCheckIn: async (nodeId, checkIn) => {
        const { value, progress, comment, date, checklist } = checkIn;
        const user = await supabase.auth.getUser();
        const userId = user.data.user?.id;

        if (!userId) throw new Error('User not authenticated');

        // 1. Insert Update Record
        // (We don't currently store the checklist snapshot in okr_updates, strictly the node state)
        // If we wanted history of checklist, we'd add a column to okr_updates. 
        // For now, prompt implies updating the node's current state.
        const { error: updateError } = await supabase
            .from('okr_updates')
            .insert([{
                okr_id: nodeId,
                user_id: userId,
                progress_value: progress,
                current_value: value,
                comment: comment,
                checkin_date: date
            }]);

        if (updateError) throw updateError;

        // 2. Update OKR Node
        const updatePayload: any = {
            progress: progress,
            current_value: value,
            last_checkin_date: date,
            updated_at: new Date().toISOString()
        };
        if (checklist) {
            updatePayload.checklist = checklist;
        }

        const { error: nodeError } = await supabase
            .from('okrs')
            .update(updatePayload)
            .eq('id', nodeId);

        if (nodeError) throw nodeError;

        // 3. Update Local State & Perform Optimistic Rollup
        set((state) => {
            const updatedNodes = state.nodes.map((n) =>
                n.id === nodeId
                    ? {
                        ...n,
                        progress: progress,
                        currentValue: value !== null ? value : undefined,
                        lastCheckinDate: date,
                        checklist: checklist || n.checklist,
                        updatedAt: new Date().toISOString()
                    }
                    : n
            );

            // Recursive function to rollup progress up the tree
            const rollupProgress = (nodes: OKRNode[], childId: string): OKRNode[] => {
                const child = nodes.find(n => n.id === childId);
                if (!child || !child.parentId) return nodes;

                const parentId = child.parentId;
                const siblings = nodes.filter(n => n.parentId === parentId);

                // Calculate new parent progress (Average of children)
                const totalProgress = siblings.reduce((sum, n) => sum + (n.progress || 0), 0);
                const avgProgress = siblings.length > 0 ? Math.round(totalProgress / siblings.length) : 0;

                const parentIndex = nodes.findIndex(n => n.id === parentId);
                if (parentIndex === -1) return nodes;

                // Create new nodes array with updated parent
                const newNodes = [...nodes];
                const oldParent = newNodes[parentIndex];

                // Only update if progress actually changed to avoid unnecessary recursion/rendering
                if (oldParent.progress !== avgProgress) {
                    newNodes[parentIndex] = {
                        ...oldParent,
                        progress: avgProgress,
                        updatedAt: new Date().toISOString()
                    };
                    // Recursively update grandparent
                    return rollupProgress(newNodes, parentId);
                }

                return nodes;
            };

            return {
                nodes: rollupProgress(updatedNodes, nodeId)
            };
        });
    },

    updateTaskDependencies: async (taskId, dependencyIds) => {
        // Optimistic Update
        set((state) => ({
            nodes: state.nodes.map((n) => (n.id === taskId ? { ...n, dependencies: dependencyIds } : n)),
        }));

        try {
            // 1. Delete existing
            await supabase.from('task_dependencies').delete().eq('task_id', taskId);

            // 2. Insert new
            if (dependencyIds.length > 0) {
                const rows = dependencyIds.map(depId => ({
                    task_id: taskId,
                    dependency_id: depId
                }));
                const { error } = await supabase.from('task_dependencies').insert(rows);
                if (error) throw error;
            }
        } catch (err: any) {
            console.error("Error updating dependencies:", err);
            // Revert on error? For now just log.
        }
    },

    toggleExpand: async (id) => {
        const node = get().nodes.find(n => n.id === id);
        if (node) {
            get().updateNode(id, { expanded: !node.expanded });
        }
    }
}));
