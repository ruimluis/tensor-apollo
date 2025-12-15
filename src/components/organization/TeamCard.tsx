import { useState } from 'react';
import { Users, Pencil, Trash2, Target, MoreVertical } from 'lucide-react';

export interface Team {
    id: string;
    name: string;
    mission: string;
    organization_id: string;
    created_at: string;
}

interface TeamCardProps {
    team: Team;
    memberCount?: number;
    isAdmin: boolean;
    onEdit: (team: Team) => void;
    onDelete: (teamId: string) => void;
    onClick: (team: Team) => void;
}

export function TeamCard({ team, memberCount = 0, isAdmin, onEdit, onDelete, onClick }: TeamCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div
            onClick={() => onClick(team)}
            className="group relative bg-card hover:bg-muted/10 border border-border rounded-xl p-6 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[180px]"
        >
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Target className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg leading-none tracking-tight">{team.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Created {new Date(team.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className={`relative transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMenuOpen(false);
                                        onEdit(team);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                >
                                    <Pencil className="h-3.5 w-3.5" /> Edit Team
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMenuOpen(false);
                                            onDelete(team.id);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> Delete Team
                                    </button>
                                )}
                            </div>
                        )}
                        {/* Overlay to close menu when clicking outside */}
                        {isMenuOpen && (
                            <div
                                className="fixed inset-0 z-40 bg-transparent"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(false);
                                }}
                            />
                        )}
                    </div>
                </div>

                <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mission</h4>
                    <p
                        className="text-sm text-foreground/80 line-clamp-3"
                        title={team.mission || "No mission statement defined."}
                    >
                        {team.mission || "No mission statement defined."}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{memberCount} Members</span>
                </div>
            </div>
        </div>
    );
}
