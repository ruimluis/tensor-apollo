import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useOKRStore } from '@/store/useOKRStore';
import { useToast } from '@/components/ui/Toast';
import { Users, Mail, Copy, Check, Shield, Loader2, Plus, X, Pencil, MoreVertical, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TeamsList } from './TeamsList';

interface Member {
    id: string;
    role: 'admin' | 'member';
    status: 'active' | 'deactivated';
    profile: {
        full_name: string;
        avatar_url: string;
    };
    user_id: string;
}

interface Invitation {
    id: string;
    email: string;
    name: string;
    token: string;
    status: 'pending' | 'accepted';
    created_at: string;
}

export function OrganizationPage() {
    const { organizationId } = useOKRStore();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [orgName, setOrgName] = useState('');
    const [members, setMembers] = useState<Member[]>([]);
    const [invites, setInvites] = useState<Invitation[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Modals
    const [showInviteModal, setShowInviteModal] = useState(false);

    const [showOrgNameModal, setShowOrgNameModal] = useState(false);

    // Dropdown State
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Forms
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [copySuccess, setCopySuccess] = useState(false); // Restored
    const [inviteLoading, setInviteLoading] = useState(false);



    const [newOrgName, setNewOrgName] = useState('');
    const [orgNameLoading, setOrgNameLoading] = useState(false);

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setCurrentUserId(user.id);
        });

        // Close dropdowns on click outside
        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (organizationId) {
            fetchOrgDetails();
            fetchMembers();
            fetchInvites();
        }
    }, [organizationId, currentUserId]);

    const fetchOrgDetails = async () => {
        const { data } = await supabase.from('organizations').select('name').eq('id', organizationId).single();
        if (data) {
            setOrgName(data.name);
            setNewOrgName(data.name);
        }
    };

    const fetchMembers = async () => {
        const { data } = await supabase
            .from('organization_members')
            .select(`
                id,
                role,
                status,
                user_id,
                profile:profiles(full_name, avatar_url)
            `)
            .eq('organization_id', organizationId);

        if (data) {
            const m = data as any;
            setMembers(m);
            // Check Admin
            if (currentUserId) {
                const me = m.find((u: any) => u.user_id === currentUserId);
                if (me) {
                    setIsAdmin(me.role === 'admin');
                }
            }
        }
        setLoading(false);
    };

    const fetchInvites = async () => {
        const { data } = await supabase
            .from('invitations')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('status', 'pending');

        if (data) setInvites(data as any);
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        try {
            const { data, error } = await supabase
                .from('invitations')
                .insert([{
                    organization_id: organizationId,
                    email: inviteEmail,
                    name: inviteName
                }])
                .select()
                .single();

            if (error) throw error;

            const link = `${window.location.origin}/join?token=${data.token}`;
            setGeneratedLink(link);
            fetchInvites();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setInviteLoading(false);
        }
    };

    const handleUpdateOrgName = async (e: React.FormEvent) => {
        e.preventDefault();
        setOrgNameLoading(true);
        try {
            const { error } = await supabase
                .from('organizations')
                .update({ name: newOrgName })
                .eq('id', organizationId);

            if (error) throw error;
            setOrgName(newOrgName);
            setShowOrgNameModal(false);
            addToast({ type: 'success', title: 'Updated', message: 'Organization name updated.' });
        } catch (err: any) {
            addToast({ type: 'error', title: 'Error', message: err.message });
        } finally {
            setOrgNameLoading(false);
        }
    }



    const copyToClipboard = (token: string) => {
        const link = token.includes('http') ? token : `${window.location.origin}/join?token=${token}`;
        navigator.clipboard.writeText(link);
        addToast({ type: 'success', title: 'Link Copied', message: 'Invite link copied to clipboard.' });
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        setDeleteLoading(true);
        try {
            await supabase.from('invitations').delete().eq('id', deleteId);
            fetchInvites();
            addToast({ type: 'info', title: 'Cancelled', message: 'Invitation revoked.' });
            setDeleteId(null);
        } catch (err: any) {
            addToast({ type: 'error', title: 'Error', message: err.message });
        } finally {
            setDeleteLoading(false);
        }
    };

    // Tab State
    const [activeTab, setActiveTab] = useState<'members' | 'teams'>('members');

    // Member Management
    const handleUpdateMember = async (memberId: string, updates: { role?: string, status?: string }) => {
        setLoading(true);
        try {
            const { error } = await supabase.rpc('update_org_member', {
                target_member_id: memberId,
                new_role: updates.role,
                new_status: updates.status
            });

            if (error) throw error;

            addToast({
                type: 'success',
                title: 'Updated',
                message: `Member ${updates.status ? 'status' : 'role'} updated successfully.`
            });
            fetchMembers();
        } catch (err: any) {
            addToast({ type: 'error', title: 'Error', message: err.message });
        } finally {
            setLoading(false);
            setOpenDropdownId(null);
        }
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 group">
                        <h1 className="text-3xl font-bold tracking-tight">{orgName}</h1>
                        {isAdmin && (
                            <button onClick={() => setShowOrgNameModal(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded text-muted-foreground">
                                <Pencil className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <p className="text-muted-foreground mt-1">Manage your organization structure and people.</p>
                </div>
                {activeTab === 'members' && isAdmin && (
                    <button
                        onClick={() => { setShowInviteModal(true); setGeneratedLink(''); setInviteEmail(''); setInviteName(''); }}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        Invite Member
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-border flex gap-6">
                <button
                    onClick={() => setActiveTab('members')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'members' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Members
                </button>
                <button
                    onClick={() => setActiveTab('teams')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'teams' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Teams
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'teams' ? (
                <TeamsList isAdmin={isAdmin} currentUserId={currentUserId} />
            ) : (
                <div className="space-y-8 animate-in fade-in-50">
                    {/* Members Section */}
                    <div className="bg-card rounded-lg border border-border overflow-visible shadow-sm">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                Organization Members ({members.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-border">
                            {members.map(member => (
                                <div key={member.id} className={`px-6 py-4 flex items-center justify-between hover:bg-muted/10 transition-colors ${member.status === 'deactivated' ? 'bg-muted/30' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold relative">
                                            {(member.profile.full_name || '?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-foreground flex items-center gap-2">
                                                {member.profile.full_name || 'Unknown User'}
                                                <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${member.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                                    }`}>
                                                    {member.status === 'active' ? 'Active' : 'Deactivated'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Shield className="h-3 w-3" />
                                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Member Actions Menu */}
                                    {isAdmin && member.user_id !== currentUserId && (
                                        <div className="relative" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownId(openDropdownId === member.id ? null : member.id);
                                                }}
                                                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>

                                            {openDropdownId === member.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                                    <button
                                                        onClick={() => handleUpdateMember(member.id, { role: member.role === 'admin' ? 'member' : 'admin' })}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                                    >
                                                        <Shield className="h-3.5 w-3.5" />
                                                        {member.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                                                    </button>

                                                    {member.status === 'active' ? (
                                                        <button
                                                            onClick={() => handleUpdateMember(member.id, { status: 'deactivated' })}
                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                                        >
                                                            <X className="h-3.5 w-3.5" /> Deactivate User
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUpdateMember(member.id, { status: 'active' })}
                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 text-emerald-600 flex items-center gap-2"
                                                        >
                                                            <Check className="h-3.5 w-3.5" /> Activate User
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Invites Section */}
                    {invites.length > 0 && isAdmin && (
                        <div className="bg-card rounded-lg border border-border shadow-sm animate-in fade-in-50">
                            <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
                                <h2 className="font-semibold flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-amber-500" />
                                    Pending Invitations
                                </h2>
                            </div>
                            <div className="divide-y divide-border">
                                {invites.map(invite => (
                                    <div key={invite.id} className="px-6 py-4 flex items-center justify-between group">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{invite.name || invite.email}</span>
                                            <span className="text-xs text-muted-foreground">{invite.email} • Sent {new Date(invite.created_at).toLocaleDateString()}</span>
                                        </div>

                                        {/* Dropdown Menu */}
                                        <div className="relative" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownId(openDropdownId === invite.id ? null : invite.id);
                                                }}
                                                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>

                                            {openDropdownId === invite.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                                    <button
                                                        onClick={() => { copyToClipboard(invite.token); setOpenDropdownId(null); }}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" /> Copy Link
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteId(invite.id); setOpenDropdownId(null); }}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" /> Revoke Invite
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Invite Modal */}
            <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Member">
                {!generatedLink ? (
                    <form onSubmit={handleInvite} className="space-y-4">
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={inviteName}
                                    onChange={e => setInviteName(e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Jane Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="jane@example.com"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={inviteLoading}
                                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                            >
                                {inviteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Generate Invite Link
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 text-emerald-900 p-4 rounded-md flex items-start gap-3 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900">
                            <Check className="h-5 w-5 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="font-semibold text-sm">Invitation Created!</h3>
                                <p className="text-xs mt-1 opacity-90">Share this link with <strong>{inviteName}</strong>.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-muted-foreground">Invitation Link</label>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={generatedLink}
                                    className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-sm font-mono text-muted-foreground focus:outline-none"
                                />
                                <button
                                    onClick={() => copyToClipboard(generatedLink.split('=')[1])} // hacky extraction but safe given flow
                                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-2 rounded-md border border-border shadow-sm transition-colors"
                                >
                                    {copySuccess ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => { setShowInviteModal(false); setGeneratedLink(''); setInviteEmail(''); setInviteName(''); }}
                                className="px-4 py-2 text-sm font-medium text-primary hover:underline hover:text-primary/80"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Org Name Modal */}
            <Modal isOpen={showOrgNameModal} onClose={() => setShowOrgNameModal(false)} title="Organization Settings">
                <form onSubmit={handleUpdateOrgName} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Organization Name</label>
                        <input
                            required
                            type="text"
                            value={newOrgName}
                            onChange={e => setNewOrgName(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowOrgNameModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={orgNameLoading}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                        >
                            {orgNameLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </Modal>



            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Revoke Invitation">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to revoke this invitation? This action cannot be undone.
                        The link sent to the user will no longer be valid.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setDeleteId(null)}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            disabled={deleteLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm"
                        >
                            {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Revoke Invitation
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
