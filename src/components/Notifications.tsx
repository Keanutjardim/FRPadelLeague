import { useAuth } from '@/contexts/AuthContext';
import { useLeague } from '@/contexts/LeagueContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, Check, X } from 'lucide-react';

export function Notifications() {
  const { user } = useAuth();
  const { getTeamById, getTeamJoinRequests, respondToJoinRequest, getUserById } = useLeague();
  const { toast } = useToast();

  if (!user?.teamId) return null;

  const myTeam = getTeamById(user.teamId);
  if (!myTeam) return null;

  const isTeamCreator = myTeam.creatorId === user.id;
  const pendingRequests = isTeamCreator ? getTeamJoinRequests(user.teamId) : [];

  if (pendingRequests.length === 0) return null;

  const handleResponse = (requestId: string, accept: boolean) => {
    respondToJoinRequest(requestId, accept);
    toast({
      title: accept ? 'Player accepted!' : 'Request declined',
      description: accept ? 'The player has joined your team.' : 'The join request was declined.',
    });
  };

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          Join Requests
          <Badge>{pendingRequests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-3">
          {pendingRequests.map((request) => {
            const requester = getUserById(request.userId);
            if (!requester) return null;

            return (
              <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                <div>
                  <div className="font-medium text-xs sm:text-sm">{requester.name} wants to join</div>
                  <div className="text-xs text-muted-foreground">
                    Level: {requester.playtomicLevel?.toFixed(1) || 'N/A'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleResponse(request.id, true)} className="text-xs">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleResponse(request.id, false)} className="text-xs">
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
