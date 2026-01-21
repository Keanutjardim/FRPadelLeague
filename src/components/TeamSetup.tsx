import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeague } from '@/contexts/LeagueContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus } from 'lucide-react';

interface TeamSetupProps {
  onComplete: () => void;
}

export function TeamSetup({ onComplete }: TeamSetupProps) {
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const { createTeam, getAvailableTeams, requestToJoin } = useLeague();
  const { toast } = useToast();

  if (!user) return null;

  const league = user.gender === 'male' ? 'mens' : 'womens';
  const availableTeams = getAvailableTeams(league);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast({ title: 'Error', description: 'Please enter a team name.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const team = await createTeam(teamName, user.id, league);
    if (team) {
      await updateUser({ teamId: team.id });
      toast({ title: 'Team created!', description: `${teamName} has been created.` });
      onComplete();
    } else {
      toast({ title: 'Error', description: 'Failed to create team.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleJoinRequest = async (teamId: string) => {
    setIsLoading(true);
    await requestToJoin(user.id, teamId);
    toast({ title: 'Request sent!', description: 'The team captain will review your request.' });
    setIsLoading(false);
    onComplete();
  };

  if (!mode) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Join the {league === 'mens' ? "Men's" : "Women's"} League</CardTitle>
          <CardDescription>Would you like to create or join a team?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-20 flex items-center gap-4"
            onClick={() => setMode('create')}
          >
            <Users className="h-8 w-8" />
            <div className="text-left">
              <div className="font-semibold">Create a Team</div>
              <div className="text-sm text-muted-foreground">Start your own team and invite players</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-20 flex items-center gap-4"
            onClick={() => setMode('join')}
            disabled={availableTeams.length === 0}
          >
            <UserPlus className="h-8 w-8" />
            <div className="text-left">
              <div className="font-semibold">Join a Team</div>
              <div className="text-sm text-muted-foreground">
                {availableTeams.length > 0
                  ? `${availableTeams.length} team${availableTeams.length > 1 ? 's' : ''} available`
                  : 'No teams available'}
              </div>
            </div>
          </Button>

          <Button variant="ghost" className="w-full" onClick={onComplete}>
            Skip for now
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'create') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create Your Team</CardTitle>
          <CardDescription>Choose a name for your {league === 'mens' ? "men's" : "women's"} team</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="The Padel Kings"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Team'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setMode(null)} disabled={isLoading}>
              Back
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Join a Team</CardTitle>
        <CardDescription>Select a team to request to join</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableTeams.map((team) => (
          <div
            key={team.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <div className="font-semibold">{team.name}</div>
              <div className="text-sm text-muted-foreground">
                {team.memberIds.length}/4 players
              </div>
            </div>
            <Button size="sm" onClick={() => handleJoinRequest(team.id)} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Request'}
            </Button>
          </div>
        ))}

        <Button variant="ghost" className="w-full" onClick={() => setMode(null)}>
          Back
        </Button>
      </CardContent>
    </Card>
  );
}
