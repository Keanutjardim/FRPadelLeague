import { useLeague } from '@/contexts/LeagueContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to truncate name to first two words
function formatPlayerName(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length <= 2) return name;
  return words.slice(0, 2).join(' ');
}

interface LeagueTableProps {
  league: 'mens' | 'womens';
}

function PositionChange({ current, previous }: { current: number; previous?: number }) {
  const prev = previous ?? current;
  const change = prev - current;

  if (change > 0) {
    return (
      <div className="flex items-center gap-0.5 text-emerald-500">
        <TrendingUp className="h-3 w-3" />
        <span className="text-[10px] font-semibold">+{change}</span>
      </div>
    );
  }

  if (change < 0) {
    return (
      <div className="flex items-center gap-0.5 text-red-500">
        <TrendingDown className="h-3 w-3" />
        <span className="text-[10px] font-semibold">{change}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-muted-foreground/40">
      <Minus className="h-2.5 w-2.5" />
    </div>
  );
}

function PositionBadge({ position }: { position: number }) {
  const isTop3 = position <= 3;

  return (
    <div
      className={cn(
        "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm shrink-0",
        position === 1 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-white",
        position === 2 && "bg-gradient-to-br from-slate-300 to-slate-400 text-white",
        position === 3 && "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
        !isTop3 && "bg-muted text-muted-foreground"
      )}
    >
      {position}
    </div>
  );
}

export function LeagueTable({ league }: LeagueTableProps) {
  const { teams, getUserById } = useLeague();

  const leagueTeams = teams
    .filter(t => t.league === league)
    .sort((a, b) => a.position - b.position);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4 sm:px-6 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <Trophy className="h-4 w-4 text-primary" />
            {league === 'mens' ? "Men's" : "Women's"} League
          </div>
          <Badge variant="secondary" className="text-[10px] sm:text-xs font-medium">
            {leagueTeams.length} teams
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {leagueTeams.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">No teams yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {/* Header Row - 30/70 split with player sub-columns */}
            <div className="grid grid-cols-[auto_1fr_2.5fr] sm:grid-cols-[auto_minmax(80px,1fr)_2.5fr] gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-muted/30 text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="w-7 sm:w-8">#</div>
              <div>Team</div>
              <div className="grid grid-cols-[1rem_minmax(60px,100px)_2.5rem_1fr] gap-x-1 sm:gap-x-2">
                <div></div>
                <div className="text-center">Name</div>
                <div className="text-center">Lvl</div>
                <div className="text-center">Phone</div>
              </div>
            </div>

            {/* Team Rows */}
            {leagueTeams.map((team, index) => (
              <div
                key={team.id}
                className={cn(
                  "grid grid-cols-[auto_1fr_2.5fr] sm:grid-cols-[auto_minmax(80px,1fr)_2.5fr] gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 items-center transition-colors hover:bg-muted/30",
                  index === 0 && "bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-950/20"
                )}
              >
                {/* Position */}
                <PositionBadge position={team.position} />

                {/* Team Name & Movement */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs sm:text-sm truncate">
                      {team.name}
                    </span>
                    <PositionChange current={team.position} previous={team.previousPosition} />
                  </div>
                </div>

                {/* Players - aligned columns */}
                <div className="min-w-0">
                  {team.memberIds.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No players</span>
                  ) : (
                    <div className="space-y-1">
                      {team.memberIds.map((memberId, playerIndex) => {
                        const member = getUserById(memberId);
                        if (!member) return null;

                        return (
                          <div key={memberId} className="grid grid-cols-[1rem_minmax(60px,100px)_2.5rem_1fr] gap-x-1 sm:gap-x-2 items-center">
                            {/* Number */}
                            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium text-center">
                              {playerIndex + 1}.
                            </span>
                            {/* Name */}
                            <span className="text-[11px] sm:text-xs font-medium truncate text-center">
                              {formatPlayerName(member.name)}
                            </span>
                            {/* Level */}
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[9px] sm:text-[10px] px-1 py-0 h-4 font-semibold shrink-0 justify-center mx-auto",
                                member.playtomicLevel >= 4 && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                member.playtomicLevel >= 3 && member.playtomicLevel < 4 && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                member.playtomicLevel < 3 && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              )}
                            >
                              {member.playtomicLevel?.toFixed(1) || 'N/A'}
                            </Badge>
                            {/* Phone */}
                            <a
                              href={`tel:${member.phone}`}
                              className="text-[10px] sm:text-[11px] text-muted-foreground hover:text-primary transition-colors whitespace-nowrap text-center"
                            >
                              {member.phone || 'N/A'}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
