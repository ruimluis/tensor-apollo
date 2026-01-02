import React, { useState, useEffect } from 'react';
import { User, Bell, Clock, CreditCard, Save, Calendar, Plus, X, Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

import { useSettingsStore } from '@/store/useSettingsStore';
import { useToast } from '@/components/ui/Toast';

export function SettingsPage() {
    const { session } = useAuth();
    const { addToast } = useToast();
    const user = session?.user;

    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'capacity' | 'subscription'>('profile');

    // Capacity State from Store
    const {
        dailyLimit,
        weeklyCapacity,
        okrAllocation,
        exceptions,
        updateSettings,
        addException,
        removeException,
        fetchMySettings
    } = useSettingsStore();

    useEffect(() => {
        fetchMySettings();
    }, []);

    const [newException, setNewException] = useState({ date: '', hours: 0, reason: '' });
    const [uploading, setUploading] = useState(false);

    // Profile State
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [savingProfile, setSavingProfile] = useState(false);
    const [updatingEmail, setUpdatingEmail] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);

    useEffect(() => {
        if (user?.user_metadata?.full_name) {
            setFullName(user.user_metadata.full_name);
        }
        if (user?.email) {
            setEmail(user.email);
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        try {
            setSavingProfile(true);
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (error) throw error;
            await supabase.auth.refreshSession();
            addToast({
                type: 'success',
                title: 'Profile Updated',
                message: 'Your profile information has been updated successfully.'
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            addToast({
                type: 'error',
                title: 'Update Failed',
                message: 'Failed to update your profile. Please try again.'
            });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!email || email === user?.email) return;

        try {
            setUpdatingEmail(true);
            const { error } = await supabase.auth.updateUser({ email: email });

            if (error) throw error;
            addToast({
                type: 'success',
                title: 'Confirmation Sent',
                message: 'Check your new email address for a confirmation link.'
            });
        } catch (error: any) {
            console.error('Error updating email:', error);
            addToast({
                type: 'error',
                title: 'Update Failed',
                message: error.message || 'Failed to update email.'
            });
        } finally {
            setUpdatingEmail(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update User Metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) {
                throw updateError;
            }

            // Refresh session to Ensure UI updates
            await supabase.auth.refreshSession();

        } catch (error) {
            console.error('Error uploading avatar:', error);
            addToast({
                type: 'error',
                title: 'Upload Failed',
                message: 'There was an error uploading your avatar.'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            setUploading(true);
            const { error } = await supabase.auth.updateUser({
                data: { avatar_url: null } // Remove avatar_url
            });

            if (error) throw error;
            await supabase.auth.refreshSession();
        } catch (error) {
            console.error('Error removing avatar:', error);
            addToast({
                type: 'error',
                title: 'Action Failed',
                message: 'There was an error removing your avatar.'
            });
        } finally {
            setUploading(false);
        }
    };

    // Password State
    const [passwordState, setPasswordState] = useState({ current: '', new: '', confirm: '' });
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

    const handlePasswordChange = (field: string, value: string) => {
        setPasswordState(prev => ({ ...prev, [field]: value }));
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleUpdatePassword = async () => {
        if (passwordState.new !== passwordState.confirm) {
            addToast({
                type: 'error',
                title: 'Passwords do not match',
                message: 'Please ensure both new password fields match.'
            });
            return;
        }

        if (passwordState.new.length < 6) {
            addToast({
                type: 'error',
                title: 'Password too short',
                message: 'Password must be at least 6 characters long.'
            });
            return;
        }

        try {
            setUpdatingPassword(true);
            const { error } = await supabase.auth.updateUser({ password: passwordState.new });

            if (error) throw error;

            addToast({
                type: 'success',
                title: 'Password Updated',
                message: 'Your password has been changed successfully.'
            });
            setPasswordState({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            console.error('Error updating password:', error);
            addToast({
                type: 'error',
                title: 'Update Failed',
                message: error.message || 'Failed to update password.'
            });
        } finally {
            setUpdatingPassword(false);
        }
    };

    const handleAddException = () => {
        if (!newException.date) return;
        addException(newException);
        setNewException({ date: '', hours: 0, reason: '' });
    };

    const handleDeleteException = (id: string) => {
        removeException(id);
    };



    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'capacity', label: 'Capacity', icon: Clock },
        { id: 'subscription', label: 'Subscription', icon: CreditCard },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
            </div>

            {/* Horizontal Tabs */}
            <div className="border-b border-border">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                                    activeTab === tab.id
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                                )}
                            >
                                <Icon className={cn("mr-2 h-4 w-4", activeTab === tab.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px] animate-in fade-in-50 duration-300">
                {activeTab === 'profile' && (
                    <div className="max-w-3xl space-y-8 animate-in fade-in-50">
                        {/* 1. General Information */}
                        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6 border-b border-border/50">
                                <h3 className="font-semibold leading-none tracking-tight">General Information</h3>
                                <p className="text-sm text-muted-foreground">Manage your public profile and details.</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold ring-4 ring-background shadow-sm shrink-0 overflow-hidden relative">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt="Avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span>{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Profile Picture</h4>
                                        <div className="flex gap-2">
                                            <label className={`text-xs rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 font-medium transition-colors cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                                {uploading ? 'Uploading...' : 'Change Avatar'}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleAvatarUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                            <button
                                                onClick={handleRemoveAvatar}
                                                disabled={uploading || !user?.user_metadata?.avatar_url}
                                                className="text-xs rounded-md hover:bg-destructive/10 text-destructive px-3 py-2 font-medium transition-colors disabled:opacity-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-2 max-w-md">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <input
                                        type="text"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Your name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center p-6 pt-0">
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={savingProfile}
                                    className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors ml-auto disabled:opacity-50"
                                >
                                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {savingProfile ? 'Saving...' : 'Save General Info'}
                                </button>
                            </div>
                        </div>

                        {/* 2. Contact Information (Email) */}
                        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold leading-none tracking-tight">Contact Information</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">This is how we communicate with you.</p>
                            </div>
                            <div className="p-6">
                                <div className="flex items-end gap-4">
                                    <div className="grid gap-2 flex-1 max-w-md">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <input
                                            type="email"
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdateEmail}
                                        disabled={updatingEmail || !email || email === user?.email}
                                        className="h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {updatingEmail && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Change Email
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    To change your email, you will need to verify the new address.
                                </p>
                            </div>
                        </div>

                        {/* 3. Security (Password) */}
                        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold leading-none tracking-tight">Security</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">Manage your password and account security.</p>
                            </div>
                            <div className="p-6 space-y-4 max-w-md">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword.current ? "text" : "password"}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-10 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={passwordState.current}
                                            onChange={(e) => handlePasswordChange('current', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('current')}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword.new ? "text" : "password"}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-10 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={passwordState.new}
                                            onChange={(e) => handlePasswordChange('new', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('new')}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword.confirm ? "text" : "password"}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-10 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={passwordState.confirm}
                                            onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('confirm')}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center p-6 pt-0">
                                <button
                                    onClick={handleUpdatePassword}
                                    disabled={updatingPassword || !passwordState.new || !passwordState.confirm}
                                    className="items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors flex disabled:opacity-50"
                                >
                                    {updatingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Update Password
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="max-w-2xl space-y-8">
                        <div>
                            <h3 className="text-lg font-medium leading-6">Notifications</h3>
                            <p className="text-sm text-muted-foreground mt-1">Configure how you receive alerts.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-card">
                                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                                <div>
                                    <label className="text-sm font-medium block">Email Notifications</label>
                                    <p className="text-xs text-muted-foreground">Receive weekly digests and critical alerts via email.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-card">
                                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                                <div>
                                    <label className="text-sm font-medium block">Task Assignments</label>
                                    <p className="text-xs text-muted-foreground">Get notified when a task is assigned to you.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-card">
                                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                                <div>
                                    <label className="text-sm font-medium block">Mentions</label>
                                    <p className="text-xs text-muted-foreground">Get notified when someone mentions you in a comment.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'capacity' && (
                    <div className="max-w-3xl space-y-8">
                        <div>
                            <h3 className="text-lg font-medium leading-6">Capacity Configuration</h3>
                            <p className="text-sm text-muted-foreground mt-1">Set your working hours and availability.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h4 className="font-medium border-b border-border pb-2">General Settings</h4>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Weekly Capacity (Hours)</label>
                                    <input
                                        type="number"
                                        className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={weeklyCapacity}
                                        onChange={(e) => updateSettings({ weeklyCapacity: Number(e.target.value) })}
                                    />
                                    <p className="text-xs text-muted-foreground">Default available hours per week.</p>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Daily Limit (Hours)</label>
                                    <input
                                        type="number"
                                        className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={dailyLimit}
                                        onChange={(e) => updateSettings({ dailyLimit: Number(e.target.value) })}
                                    />
                                    <p className="text-xs text-muted-foreground">Maximum safe daily workload.</p>
                                </div>

                                {/* OKR Allocation */}
                                <div className="grid gap-2 pt-4">
                                    <label className="text-sm font-medium flex justify-between">
                                        <span>OKR Allocation Strategy</span>
                                        <span className="text-primary font-bold">{okrAllocation}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={okrAllocation}
                                        onChange={(e) => updateSettings({ okrAllocation: Number(e.target.value) })}
                                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <p className="text-xs text-muted-foreground">Percentage of time dedicated specifically to OKR work vs. BAU (Business As Usual).</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="font-medium border-b border-border pb-2">Exceptions & Overrides</h4>
                                <p className="text-xs text-muted-foreground">Adjust capacity for specific dates (Vacations, Holidays, Overtime).</p>

                                <div className="space-y-3">
                                    {/* Add New Exception */}
                                    <div className="flex gap-2 items-end bg-muted/30 p-3 rounded-md border border-border">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-medium uppercase text-muted-foreground">Date</label>
                                            <input
                                                type="date"
                                                value={newException.date}
                                                onChange={(e) => setNewException({ ...newException, date: e.target.value })}
                                                className="w-full px-2 py-1.5 rounded text-xs border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                        <div className="w-20 space-y-1">
                                            <label className="text-[10px] font-medium uppercase text-muted-foreground">Hours</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={newException.hours}
                                                onChange={(e) => setNewException({ ...newException, hours: Number(e.target.value) })}
                                                className="w-full px-2 py-1.5 rounded text-xs border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddException}
                                            disabled={!newException.date}
                                            className="h-[30px] px-3 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="flex-1 space-y-1 px-3">
                                        <label className="text-[10px] font-medium uppercase text-muted-foreground">Reason (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Vacation"
                                            value={newException.reason}
                                            onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                                            className="w-full px-2 py-1.5 rounded text-xs border border-border focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                                        />
                                    </div>

                                    {/* List */}
                                    <div className="space-y-2 mt-4">
                                        {exceptions.map(exc => (
                                            <div key={exc.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-md shadow-sm group">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-secondary/50 p-2 rounded text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">{new Date(exc.date).toLocaleDateString()}</div>
                                                        <div className="text-xs text-muted-foreground">{exc.reason || 'Override'} — <span className="font-semibold text-foreground">{exc.hours}h</span></div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteException(exc.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-600 transition-all"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {exceptions.length === 0 && (
                                            <p className="text-sm text-center text-muted-foreground py-4 italic">No exceptions added.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'subscription' && (
                    <div className="max-w-2xl space-y-6">
                        <div>
                            <h3 className="text-lg font-medium leading-6">Subscription Plan</h3>
                            <p className="text-sm text-muted-foreground mt-1">Manage your billing and plan details.</p>
                        </div>

                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-primary text-lg">Pro Plan</h4>
                                    <p className="text-sm text-muted-foreground mt-1">Unlimited OKRs, Advanced Scheduling, and Priority Support.</p>
                                </div>
                                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">ACTIVE</span>
                            </div>
                            <div className="mt-6 pt-6 border-t border-primary/10 flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Next billing date: <strong className="text-foreground">Jan 15, 2026</strong></span>
                                <button className="text-primary hover:underline font-medium">Manage Subscription</button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h4 className="text-sm font-medium">Payment Method</h4>
                            <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card">
                                <div className="p-2 bg-muted rounded">
                                    <CreditCard className="h-5 w-5 text-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Visa ending in 4242</p>
                                    <p className="text-xs text-muted-foreground">Expires 12/28</p>
                                </div>
                                <button className="ml-auto text-xs text-primary hover:underline font-medium">Update</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
