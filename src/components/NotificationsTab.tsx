import { useAuth } from '@/contexts/AuthContext';
import { useLeague } from '@/contexts/LeagueContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Bell, UserPlus, Swords, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { User } from '@/types/league';
import { supabase } from '@/lib/supabase';

export function NotificationsTab() {
  const { user } = useAuth();
  const {
    teams,
    joinRequests,
    challenges,
    respondToJoinRequest,
    respondToChallenge,
    validateScore,
    getTeamById,
  } = useLeague();
  const { toast } = useToast();
  const [requestUsers, setRequestUsers] = useState<Record<string, User>>({});
  const [loadingUsers, setLoadingUsers] = useState(false);

  if (!user) return null;

  const myTeam = teams.find(t => t.id === user.teamId);
  const isTeamCaptain = myTeam?.creatorId === user.id;

  // Fetch users for join requests directly from profiles table
  // (since these users don't have a team yet, they won't be in the cached users)
  useEffect(() => {
    const fetchUsers = async () => {
      const pendingRequests = joinRequests.filter(
        r => r.teamId === myTeam?.id && r.status === 'pending'
      );

      if (pendingRequests.length === 0) {
        setRequestUsers({});
        return;
      }

      setLoadingUsers(true);
      const userIds = pendingRequests.map(r => r.userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (error) {
        console.error('Error fetching request users:', error);
        setLoadingUsers(false);
        return;
      }

      const users: Record<string, User> = {};
      for (const profile of data || []) {
        users[profile.id] = {
          id: profile.id,
          email: profile.email,
          phone: profile.phone,
          name: profile.name,
          gender: profile.gender as 'male' | 'female',
          playtomicLevel: profile.playtomic_level,
          teamId: profile.team_id || undefined,
          createdAt: profile.created_at,
        };
      }
      setRequestUsers(users);
      setLoadingUsers(false);
    };

    if (myTeam && isTeamCaptain) {
      fetchUsers();
    }
  }, [joinRequests, myTeam, isTeamCaptain]);

  // Join requests for teams I captain
  const teamJoinRequests = isTeamCaptain && myTeam
    ? joinRequests.filter(r => r.teamId === myTeam.id && r.status === 'pending')
    : [];

  // My own join requests
  const myJoinRequests = joinRequests.filter(r => r.userId === user.id && r.status === 'pending');

  // Challenges where I need to respond (someone challenged my team)
  const incomingChallenges = myTeam
    ? challenges.filter(c =>
        c.challengedTeamId === myTeam.id &&
        c.status === 'pending'
      )
    : [];

  // Challenges where I'm waiting for response
  const outgoingChallenges = myTeam
    ? challenges.filter(c =>
        c.challengerTeamId === myTeam.id &&
        c.status === 'pending'
      )
    : [];

  // Challenges where score needs validation (opponent's team needs to validate)
  const scoreValidationNeeded = myTeam
    ? challenges.filter(c =>
        (c.challengerTeamId === myTeam.id || c.challengedTeamId === myTeam.id) &&
        c.status === 'completed' &&
        !c.scoreValidated &&
        c.score
      )
    : [];

  // Challenges accepted and waiting to be played
  const acceptedChallenges = myTeam
    ? challenges.filter(c =>
        (c.challengerTeamId === myTeam.id || c.challengedTeamId === myTeam.id) &&
        c.status === 'accepted'
      )
    : [];

  const handleJoinRequestResponse = async (requestId: string, accept: boolean, userName: string) => {
    try {
      await respondToJoinRequest(requestId, accept);
      toast({
        title: accept ? 'Request accepted!' : 'Request declined',
        description: accept
          ? `${userName} has been added to your team.`
          : `${userName}'s request has been declined.`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process join request',
        variant: 'destructive'
      });
    }
  };

  const handleChallengeResponse = async (challengeId: string, accept: boolean, teamName: string) => {
    await respondToChallenge(challengeId, accept);
    toast({
      title: accept ? 'Challenge accepted!' : 'Challenge declined',
      description: accept
        ? `You accepted the challenge from ${teamName}. Time to play!`
        : `You declined the challenge from ${teamName}.`
    });
  };

  const handleScoreValidation = async (challengeId: string, valid: boolean) => {
    await validateScore(challengeId, valid);
    toast({
      title: valid ? 'Score confirmed!' : 'Score disputed',
      description: valid
        ? 'The score has been validated and positions updated.'
        : 'The score has been disputed. Please re-submit the correct score.'
    });
  };

  const totalNotifications =
    teamJoinRequests.length +
    myJoinRequests.length +
    incomingChallenges.length +
    scoreValidationNeeded.length;

  if (totalNotifications === 0 && outgoingChallenges.length === 0 && acceptedChallenges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
        <Bell className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-base sm:text-lg font-semibold mb-2">No notifications</h3>
        <p className="text-muted-foreground max-w-md text-sm sm:text-base">
          You're all caught up! Notifications about challenges, join requests, and match results will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Team Join Requests (for captains) */}
      {teamJoinRequests.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2 flex-wrap">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">Join Requests</CardTitle>
              <Badge variant="destructive" className="text-xs">{teamJoinRequests.length}</Badge>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Players want to join your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {loadingUsers ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Loading user details...
              </div>
            ) : (
              teamJoinRequests.map((request) => {
                const requestUser = requestUsers[request.userId];
                return (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg bg-card">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base">
                        {requestUser?.name || 'Unknown User'}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        wants to join {myTeam?.name}
                        {requestUser?.playtomicLevel && (
                          <span className="ml-2">• Level: {requestUser.playtomicLevel.toFixed(1)}</span>
                        )}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleJoinRequestResponse(request.id, true, requestUser?.name || 'User')}
                        disabled={!requestUser}
                        className="text-xs"
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJoinRequestResponse(request.id, false, requestUser?.name || 'User')}
                        disabled={!requestUser}
                        className="text-xs"
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* My Join Requests */}
      {myJoinRequests.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <CardTitle className="text-base sm:text-lg">Your Join Requests</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Waiting for team captains to respond
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {myJoinRequests.map((request) => {
              const team = getTeamById(request.teamId);
              return (
                <div key={request.id} className="p-3 sm:p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <div className="font-medium text-sm sm:text-base">
                      Request to join {team?.name || 'Unknown Team'}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">Pending</Badge>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Incoming Challenges */}
      {incomingChallenges.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Swords className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              <CardTitle className="text-base sm:text-lg">Challenge Requests</CardTitle>
              <Badge variant="destructive" className="text-xs">{incomingChallenges.length}</Badge>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Teams have challenged you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {incomingChallenges.map((challenge) => {
              const challengerTeam = getTeamById(challenge.challengerTeamId);
              return (
                <div key={challenge.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg bg-card">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base">
                      Challenge from {challengerTeam?.name || 'Unknown Team'}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      #{challengerTeam?.position} wants to challenge your position #{myTeam?.position}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {new Date(challenge.createdAt).toLocaleDateString()} at {new Date(challenge.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleChallengeResponse(challenge.id, true, challengerTeam?.name || 'Unknown')}
                      className="text-xs"
                    >
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleChallengeResponse(challenge.id, false, challengerTeam?.name || 'Unknown')}
                      className="text-xs"
                    >
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Outgoing Challenges */}
      {outgoingChallenges.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <CardTitle className="text-base sm:text-lg">Your Challenges</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Waiting for opponents to respond
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {outgoingChallenges.map((challenge) => {
              const challengedTeam = getTeamById(challenge.challengedTeamId);
              return (
                <div key={challenge.id} className="p-3 sm:p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <div className="font-medium text-sm sm:text-base">
                      Challenge to {challengedTeam?.name || 'Unknown Team'}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">Pending</Badge>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {new Date(challenge.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Score Validations Needed */}
      {scoreValidationNeeded.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <CardTitle className="text-base sm:text-lg">Score Validation</CardTitle>
              <Badge variant="destructive" className="text-xs">{scoreValidationNeeded.length}</Badge>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Match scores need your confirmation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {scoreValidationNeeded.map((challenge) => {
              const challengerTeam = getTeamById(challenge.challengerTeamId);
              const challengedTeam = getTeamById(challenge.challengedTeamId);
              const isChallenger = challenge.challengerTeamId === myTeam?.id;
              const opponent = isChallenger ? challengedTeam : challengerTeam;

              return (
                <div key={challenge.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg bg-card">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base">
                      Match vs {opponent?.name || 'Unknown Team'}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Score: {challenge.score?.challengerSets.map((s, i) =>
                        `${s}-${challenge.score!.challengedSets[i]}`
                      ).join(', ')}
                    </div>
                    {isChallenger && (
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        Waiting for opponent to validate
                      </div>
                    )}
                  </div>
                  {!isChallenger && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleScoreValidation(challenge.id, true)}
                        className="text-xs"
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScoreValidation(challenge.id, false)}
                        className="text-xs"
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Dispute
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Accepted Challenges - Ready to Play */}
      {acceptedChallenges.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <CardTitle className="text-base sm:text-lg">Accepted Challenges</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              These matches are ready to be played
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {acceptedChallenges.map((challenge) => {
              const challengerTeam = getTeamById(challenge.challengerTeamId);
              const challengedTeam = getTeamById(challenge.challengedTeamId);
              const isChallenger = challenge.challengerTeamId === myTeam?.id;
              const opponent = isChallenger ? challengedTeam : challengerTeam;

              return (
                <div key={challenge.id} className="p-3 sm:p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="space-y-1">
                    <div className="font-medium text-sm sm:text-base">
                      Match vs {opponent?.name || 'Unknown Team'}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {isChallenger ? 'You challenged this team' : 'This team challenged you'}
                    </div>
                    <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium mt-2">
                      ✓ Accepted - Submit score in Challenges tab after playing
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
