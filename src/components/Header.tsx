import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeague } from '@/contexts/LeagueContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Loader2 } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const { getTeamById } = useLeague();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const team = user?.teamId ? getTeamById(user.teamId) : null;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <img src="/logofr.png" alt="Padel League Logo" className="h-8 sm:h-10 w-auto flex-shrink-0" />
          <span className="text-2xl sm:text-3xl font-normal tracking-tight whitespace-nowrap" style={{ fontFamily: 'Lora, Georgia, serif' }}>Padel League</span>
        </div>

        {user && (
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{user.name}</span>
              {team && (
                <Badge variant="secondary" className="text-xs">{team.name}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              {isLoggingOut ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
