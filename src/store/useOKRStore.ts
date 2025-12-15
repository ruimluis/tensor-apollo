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
    toggleExpand: (id: string) => Promise<void>;
}

export const useOKRStore = create<OKRState>((set, get) => ({
    nodes: [],
    loading: false,
    error: null,
    organizationId: null,

    fetchNodes: async () => {
        set({ loading: true, error: null });
        try {
            // 1. Get Current User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

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
                    .select('*')
                    .eq('organization_id', orgId)
                    .order('created_at', { ascending: true });

                if (error) throw error;

                const mappedNodes: OKRNode[] = (data || []).map((row: any) => ({
                    id: row.id,
                    type: row.type,
                    title: row.title,
                    description: row.description,
                    parentId: row.parent_id,
                    status: row.status,
                    progress: row.progress,
                    owner: row.user_id,
                    organizationId: row.organization_id,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    expanded: row.expanded
                }));

                set({ nodes: mappedNodes, loading: false });
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
                    user_id: user.id,
                    organization_id: organizationId,
                    type: node.type,
                    title: node.title,
                    description: node.description,
                    parent_id: node.parentId,
                    status: node.status || 'pending',
                    progress: node.progress || 0,
                    expanded: true
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
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                expanded: data.expanded
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
            if (updates.expanded !== undefined) dbUpdates.expanded = updates.expanded;

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

    toggleExpand: async (id) => {
        const node = get().nodes.find(n => n.id === id);
        if (node) {
            get().updateNode(id, { expanded: !node.expanded });
        }
    }
}));
