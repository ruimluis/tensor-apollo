import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useOKRStore } from '@/store/useOKRStore';
import { useToast } from '@/components/ui/Toast';
import { TeamCard, Team } from './TeamCard';
import { Drawer } from '@/components/ui/Drawer';
import { Plus, Loader2, Search, X, Check, Globe } from 'lucide-react';

interface TeamsListProps {
    isAdmin: boolean;
    currentUserId: string | null;
}

export function TeamsList({ isAdmin, currentUserId }: TeamsListProps) {
    const { organizationId } = useOKRStore();
    const { addToast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [mission, setMission] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Member Management State
    const [teamMembers, setTeamMembers] = useState<any[]>([]); // Members of selected team
    const [availableMembers, setAvailableMembers] = useState<any[]>([]); // All org members
    const [memberSearch, setMemberSearch] = useState('');

    useEffect(() => {
        if (organizationId) fetchTeams();
    }, [organizationId]);

    const fetchTeams = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('teams')
            .select('*, team_members(count)')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) {
            addToast({ type: 'error', title: 'Error', message: error.message });
        } else {
            setTeams(data as any);
        }
        setLoading(false);
    };

    const fetchTeamMembers = async (teamId: string) => {
        // Fetch members currently in the team
        const { data: teamData } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId);

        const teamUserIds = teamData?.map((m: any) => m.user_id) || [];

        // Fetch all org members (with profiles)
        const { data: orgData } = await supabase
            .from('organization_members')
            .select('user_id, status, profile:profiles(full_name, avatar_url)')
            .eq('organization_id', organizationId)
            .eq('status', 'active'); // Only active members can be in teams? User said "have to be active"

        if (orgData) {
            // Map to include "isInTeam" flag
            const mapped = orgData.map((m: any) => ({
                user_id: m.user_id,
                full_name: m.profile.full_name,
                avatar_url: m.profile.avatar_url,
                isInTeam: teamUserIds.includes(m.user_id)
            }));
            setAvailableMembers(mapped);
            setTeamMembers(mapped.filter((m: any) => m.isInTeam));
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const { error } = await supabase
                .from('teams')
                .insert([{
                    organization_id: organizationId,
                    name,
                    mission
                }]);

            if (error) throw error;
            addToast({ type: 'success', title: 'Success', message: 'Team created successfully.' });
            setIsCreateModalOpen(false);
            setName('');
            setMission('');
            fetchTeams();
        } catch (err: any) {
            addToast({ type: 'error', title: 'Error', message: err.message });
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTeam) return;
        setFormLoading(true);
        try {
            const { error } = await supabase
                .from('teams')
                .update({ name, mission })
                .eq('id', currentTeam.id);

            if (error) throw error;
            addToast({ type: 'success', title: 'Success', message: 'Team updated.' });
            setIsEditModalOpen(false);
            fetchTeams();
        } catch (err: any) {
            addToast({ type: 'error', title: 'Error', message: err.message });
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (teamId: string) => {
        if (!confirm("Are you sure you want to delete this team?")) return;
        try {
            const { error } = await supabase.from('teams').delete().eq('id', teamId);
            if (error) throw error;
            addToast({ type: 'info', title: 'Deleted', message: 'Team deleted.' });
            fetchTeams();
        } catch (err: any) {
            addToast({ type: 'error', title: 'Error', message: err.message });
        }
    };

    const toggleMember = async (userId: string, isAdding: boolean) => {
        if (!currentTeam) return;
        try {
            if (isAdding) {
                const { error } = await supabase.from('team_members').insert({ team_id: currentTeam.id, user_id: userId });
                if (error) throw error;
            } else {
                const { error } = await supabase.from('team_members').delete().eq('team_id', currentTeam.id).eq('user_id', userId);
                if (error) throw error;
            }
            // Refresh local state
            setAvailableMembers(prev => prev.map(m => m.user_id === userId ? { ...m, isInTeam: isAdding } : m));
            fetchTeams();
        } catch (err: any) {
            addToast({ type: 'error', title: 'Error', message: err.message });
        }
    };

    const openCreate = () => {
        setName('');
        setMission('');
        setIsCreateModalOpen(true);
    };

    const openEdit = (team: Team) => {
        setCurrentTeam(team);
        setName(team.name);
        setMission(team.mission);
        fetchTeamMembers(team.id);
        setIsEditModalOpen(true);
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in-50">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Teams</h2>
                    <p className="text-sm text-muted-foreground">Manage sub-groups and squads within your organization.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm font-medium"
                >
                    <Plus className="h-4 w-4" />
                    New Team
                </button>
            </div>

            {teams.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/50">
                    <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium">No teams yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first team to start organizing members.</p>
                    <button onClick={openCreate} className="text-primary font-medium hover:underline">Create a Team</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(team => (
                        <TeamCard
                            key={team.id}
                            team={team}
                            memberCount={(team as any).team_members[0]?.count || 0}
                            isAdmin={isAdmin} // Or allow all to edit? User said "users can CRUD Teams". I'll allow edit for all for now in logic, pass true? Or respect schema policies. Schema allows all org members. So yes.
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onClick={openEdit}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Drawer isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Team">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Team Name</label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Engineering" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mission</label>
                        <textarea value={mission} onChange={e => setMission(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none" placeholder="What is this team's primary goal?" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md">Cancel</button>
                        <button type="submit" disabled={formLoading} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                            {formLoading && <Loader2 className="h-4 w-4 animate-spin" />} Create Team
                        </button>
                    </div>
                </form>
            </Drawer>

            {/* Edit / Manage Modal */}
            <Drawer isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Manage Team" width="max-w-xl">
                <div className="space-y-6">
                    {/* Details Form */}
                    <form onSubmit={handleUpdate} className="space-y-4 border-b border-border pb-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Team Name</label>
                            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Mission</label>
                            <textarea value={mission} onChange={e => setMission(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none" />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={formLoading} className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                                {formLoading && <Loader2 className="h-3 w-3 animate-spin" />} Save Details
                            </button>
                        </div>
                    </form>

                    {/* Member Management */}
                    <div className="space-y-3">
                        <h3 className="font-medium text-sm flex items-center justify-between">
                            Team Members
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{availableMembers.filter(m => m.isInTeam).length} Active</span>
                        </h3>

                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search organization members..."
                                value={memberSearch}
                                onChange={e => setMemberSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md bg-muted/50 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                            {availableMembers
                                .filter(m => m.full_name?.toLowerCase().includes(memberSearch.toLowerCase()))
                                .map(member => (
                                    <div key={member.user_id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {(member.full_name || '?')[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium">{member.full_name}</span>
                                        </div>
                                        <button
                                            onClick={() => toggleMember(member.user_id, !member.isInTeam)}
                                            className={`h-7 w-7 flex items-center justify-center rounded-full border transition-all ${member.isInTeam
                                                ? 'bg-primary border-primary text-primary-foreground hover:bg-primary/90'
                                                : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                                                }`}
                                        >
                                            {member.isInTeam ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        </button>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </Drawer>
        </div>
    );
}
