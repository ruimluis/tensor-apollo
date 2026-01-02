import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Exception {
    id: string; // generated client side usually
    date: string;
    hours: number;
    reason: string;
}

export interface CapacitySettings {
    userId: string;
    weeklyCapacity: number;
    dailyLimit: number;
    okrAllocation: number;
    exceptions: Exception[];
}

interface SettingsState {
    // Current User State (for Settings Page) - keeping flat structure for compatibility
    weeklyCapacity: number;
    dailyLimit: number;
    okrAllocation: number;
    exceptions: Exception[];

    // Scheduler State
    allCapacities: Record<string, CapacitySettings>; // userId -> Settings

    // Actions
    fetchMySettings: () => Promise<void>;
    fetchAllSettings: () => Promise<void>;

    updateSettings: (settings: Partial<CapacitySettings>) => Promise<void>;
    addException: (exception: Omit<Exception, 'id'>) => Promise<void>;
    removeException: (id: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    weeklyCapacity: 40,
    dailyLimit: 8,
    okrAllocation: 20,
    exceptions: [],
    allCapacities: {},

    fetchMySettings: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch or Create
        let { data, error } = await supabase
            .from('user_capacity_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code === 'PGRST116') {
            // Not found, create default
            const { data: newData, error: createError } = await supabase
                .from('user_capacity_settings')
                .insert([{ user_id: user.id }])
                .select()
                .single();
            data = newData;
        }

        if (data) {
            set({
                weeklyCapacity: data.weekly_capacity,
                dailyLimit: data.daily_limit,
                okrAllocation: data.okr_allocation,
                exceptions: data.exceptions || []
            });
        }
    },

    fetchAllSettings: async () => {
        const { data, error } = await supabase
            .from('user_capacity_settings')
            .select('*');

        if (data) {
            const map: Record<string, CapacitySettings> = {};
            data.forEach((row: any) => {
                map[row.user_id] = {
                    userId: row.user_id,
                    weeklyCapacity: row.weekly_capacity,
                    dailyLimit: row.daily_limit,
                    okrAllocation: row.okr_allocation,
                    exceptions: row.exceptions || []
                };
            });
            set({ allCapacities: map });
        }
    },

    updateSettings: async (updates) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic Update local state
        set((state) => ({ ...state, ...updates }));

        // DB Update
        const dbPayload: any = {};
        if (updates.weeklyCapacity !== undefined) dbPayload.weekly_capacity = updates.weeklyCapacity;
        if (updates.dailyLimit !== undefined) dbPayload.daily_limit = updates.dailyLimit;
        if (updates.okrAllocation !== undefined) dbPayload.okr_allocation = updates.okrAllocation;
        if (updates.exceptions !== undefined) dbPayload.exceptions = updates.exceptions;

        await supabase
            .from('user_capacity_settings')
            .update(dbPayload)
            .eq('user_id', user.id);

        // Refresh global cache if needed, or update local map entry
        get().fetchAllSettings();
    },

    addException: async (exception) => {
        const newException = { ...exception, id: Math.random().toString(36).substring(7) };
        const currentExceptions = get().exceptions;
        const updated = [...currentExceptions, newException];

        await get().updateSettings({ exceptions: updated });
    },

    removeException: async (id) => {
        const currentExceptions = get().exceptions;
        const updated = currentExceptions.filter(e => e.id !== id);

        await get().updateSettings({ exceptions: updated });
    }
}));
