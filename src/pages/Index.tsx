import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/AuthForm';
import { TeamSetup } from '@/components/TeamSetup';
import { LeagueTable } from '@/components/LeagueTable';
import { Challenges } from '@/components/Challenges';
import { NotificationsTab } from '@/components/NotificationsTab';
import { Header } from '@/components/Header';
import { Rules } from '@/components/Rules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useLeague } from '@/contexts/LeagueContext';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { teams, joinRequests, challenges } = useLeague();
  const [showTeamSetup, setShowTeamSetup] = useState(false);

  useEffect(() => {
    if (user && !user.teamId) {
      setShowTeamSetup(true);
    }
  }, [user]);

  // Calculate notification count
  const myTeam = teams.find(t => t.id === user?.teamId);
  const isTeamCaptain = myTeam?.creatorId === user?.id;

  const teamJoinRequests = isTeamCaptain && myTeam
    ? joinRequests.filter(r => r.teamId === myTeam.id && r.status === 'pending')
    : [];

  const incomingChallenges = myTeam
    ? challenges.filter(c => c.challengedTeamId === myTeam.id && c.status === 'pending')
    : [];

  const scoreValidationNeeded = myTeam
    ? challenges.filter(c =>
        c.challengedTeamId === myTeam.id &&
        c.status === 'completed' &&
        !c.scoreValidated &&
        c.score
      )
    : [];

  const notificationCount = teamJoinRequests.length + incomingChallenges.length + scoreValidationNeeded.length;

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <AuthForm onSuccess={() => {}} />
      </div>
    );
  }

  // Logged in but no team
  if (showTeamSetup && !user.teamId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 px-4">
          <TeamSetup onComplete={() => setShowTeamSetup(false)} />
        </main>
      </div>
    );
  }

  // Full dashboard
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-7xl py-4 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6">
        <Tabs defaultValue="tables" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-3xl mx-auto gap-1 h-auto">
            <TabsTrigger value="tables" className="text-xs sm:text-sm whitespace-nowrap py-2">Tables</TabsTrigger>
            <TabsTrigger value="challenges" className="text-xs sm:text-sm whitespace-nowrap py-2">Challenges</TabsTrigger>
            <TabsTrigger value="notifications" className="relative text-xs sm:text-sm whitespace-nowrap py-2">
              Notifications
              {notificationCount > 0 && (
                <Badge variant="destructive" className="ml-1 px-1 min-w-[18px] h-4 sm:h-5 text-[10px] sm:text-xs">
                  {notificationCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rules" className="text-xs sm:text-sm whitespace-nowrap py-2">Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="tables" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {user.gender === 'female' ? (
                <>
                  <LeagueTable league="womens" />
                  <LeagueTable league="mens" />
                </>
              ) : (
                <>
                  <LeagueTable league="mens" />
                  <LeagueTable league="womens" />
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="mt-4 sm:mt-6">
            {user.teamId ? (
              <Challenges />
            ) : (
              <div className="text-center py-8 sm:py-12 px-4">
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">Join or create a team to participate in challenges</p>
                <button
                  className="text-primary underline text-sm sm:text-base"
                  onClick={() => setShowTeamSetup(true)}
                >
                  Set up your team
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="mt-4 sm:mt-6">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="rules" className="mt-4 sm:mt-6">
            <Rules />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
