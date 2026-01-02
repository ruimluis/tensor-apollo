import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, UserPlus, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export function JoinPage() {
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [mode, setMode] = useState<'signup' | 'signin'>('signup');

    // Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    // Invitation State
    const [inviteData, setInviteData] = useState<any>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        setToken(t);

        if (t) {
            checkInvite(t);
        } else {
            setLoading(false);
            setMessage({ type: 'error', text: 'No invitation token found.' });
        }
    }, []);

    const checkInvite = async (t: string) => {
        // Use RPC to fetch details securely bypassing RLS for anon users
        const { data, error } = await supabase
            .rpc('get_invite_details', { lookup_token: t });

        if (error) {
            console.error("Error fetching invite:", error);
        } else if (data && data.length > 0) {
            // RPC returns an array
            const invite = data[0];
            setInviteData({
                name: invite.name,
                email: invite.email,
                organization: { name: invite.org_name }
            });
            setEmail(invite.email);
            if (invite.name) setFullName(invite.name);
        } else {
            console.log("No invite found or invalid token");
        }
        setLoading(false);
    };

    const handleAuthAndJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // 1. Authenticate (Sign Up or Sign In)
            if (mode === 'signup') {
                const { data: upData, error: upError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } }
                });
                if (upError) throw upError;
                // If email confirmation is off, we are logged in.
                if (!upData.session) {
                    setMessage({ type: 'success', text: 'Account created! Please check your email to confirm, then return here.' });
                    setLoading(false);
                    return;
                }
            } else {
                const { error: inError } = await supabase.auth.signInWithPassword({ email, password });
                if (inError) throw inError;
            }

            // 2. Accept Invitation (RPC)
            if (!token) throw new Error("Missing token");

            const { data: rpcData, error: rpcError } = await supabase.rpc('accept_invitation', { invite_token: token });
            if (rpcError) throw rpcError;

            if (rpcData.success) {
                // Success! Redirect to home/dashboard
                window.location.href = '/';
            } else {
                throw new Error(rpcData.error || 'Failed to join organization.');
            }

        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
            setLoading(false);
        }
    };

    if (loading && !inviteData && !message) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 animate-in fade-in-50">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-md">
                <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4 text-primary">
                        <UserPlus className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {inviteData ? `Join ${inviteData.organization.name}` : 'Join Organization'}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {inviteData
                            ? `You've been invited by ${inviteData.name || 'a team member'} to collaborate.`
                            : 'Enter your credentials to accept the invitation.'}
                    </p>
                </div>

                <div className="flex rounded-md bg-muted p-1">
                    <button
                        onClick={() => { setMode('signup'); setMessage(null); }}
                        className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${mode === 'signup' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Create Account
                    </button>
                    <button
                        onClick={() => { setMode('signin'); setMessage(null); }}
                        className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${mode === 'signin' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Log In
                    </button>
                </div>

                <form className="space-y-4" onSubmit={handleAuthAndJoin}>
                    {mode === 'signup' && (
                        <div>
                            <label className="text-sm font-medium text-foreground">Full Name</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={!!inviteData?.name} // Lock if name exists
                                className={`mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${inviteData?.name ? 'opacity-60 bg-muted cursor-not-allowed' : ''}`}
                                placeholder="John Doe"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!!inviteData} // Always lock email if invite exists
                            className={`mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${inviteData ? 'opacity-60 bg-muted cursor-not-allowed' : ''}`}
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">Password</label>
                        <div className="relative mt-1">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="••••••••"
                                autoFocus // Focus password automatically
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className={`text-sm p-3 rounded-md flex items-start gap-2 ${message.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                            {message.type === 'error' ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> : <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                            <span>{message.text}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading && !message} // Disable only if loading 
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {loading && !message && <Loader2 className="h-4 w-4 animate-spin" />}
                        {mode === 'signup' ? 'Create Account & Join' : 'Log In & Join'}
                    </button>

                    {message?.type === 'success' && (
                        <div className="text-center">
                            <a href="/" className="text-sm text-primary hover:underline">Go to Login</a>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
