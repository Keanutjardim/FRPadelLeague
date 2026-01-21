import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLeague } from '@/contexts/LeagueContext';
import { Trophy, Users, Swords, Calendar, Target, Shield } from 'lucide-react';

export function Rules() {
  const { settings } = useLeague();

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Overview */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <CardTitle className="text-lg sm:text-2xl">League Overview</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Welcome to the Padel League! Compete with teams to climb the rankings and become champions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <p className="text-muted-foreground text-sm sm:text-base">
            Our league is divided into two divisions: Men's and Women's. Teams compete by challenging each other
            to matches, with the winner taking the higher position on the league table.
          </p>
        </CardContent>
      </Card>

      {/* Team Formation */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <CardTitle className="text-base sm:text-lg">Team Formation</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base flex-wrap">
              Team Size
              <Badge variant="outline" className="text-xs">2-4 Players</Badge>
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Each team must have between 2 and 4 players. Teams compete in the league corresponding to their gender
              (Men's or Women's).
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-sm sm:text-base">Creating or Joining a Team</h4>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground">
              <li>Create your own team and invite other players</li>
              <li>Request to join an existing team (team captain must approve)</li>
              <li>New teams start at the bottom of the league table</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Challenge Rules */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <CardTitle className="text-base sm:text-lg">Challenge Rules</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm sm:text-base">Who Can You Challenge?</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Teams can only challenge other teams that are ranked <strong>higher</strong> than them in the same league.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base">
              Challenge Restrictions
              {settings && (
                <Badge variant="secondary" className="text-xs w-fit">
                  After {new Date(settings.challengeRestrictionDate).toLocaleDateString()}
                </Badge>
              )}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Starting from <strong>{settings ? new Date(settings.challengeRestrictionDate).toLocaleDateString() : 'the restriction date'}</strong>,
              teams can only challenge opponents within <strong>{settings?.maxPositionDifference || 4} positions</strong> above them.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Before this date, teams can challenge any higher-ranked team.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-sm sm:text-base">Challenge Process</h4>
            <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-muted-foreground">
              <li>Send a challenge to a higher-ranked team</li>
              <li>The challenged team must accept or decline</li>
              <li>If accepted, teams play their match</li>
              <li>Either team submits the match score</li>
              <li>The opposing team validates or disputes the score</li>
              <li>If validated, positions update automatically</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Match Rules */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <CardTitle className="text-base sm:text-lg">Match & Scoring</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm sm:text-base">Match Format</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Matches are played as best-of-3 sets. The team that wins 2 sets wins the match.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-sm sm:text-base">Score Submission</h4>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground">
              <li>Either team can submit the match score after playing</li>
              <li>The opposing team must validate the submitted score</li>
              <li>If disputed, teams should resolve and resubmit the correct score</li>
              <li>Only validated scores count toward league standings</li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-sm sm:text-base">Position Changes</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              If the <strong>challenging team wins</strong>, they swap positions with the challenged team.
              All teams between those positions shift down by one spot.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              If the <strong>challenged team wins</strong>, all positions remain unchanged.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fair Play */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <CardTitle className="text-base sm:text-lg">Fair Play & Sportsmanship</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span>✓</span>
              <span>Always submit accurate scores honestly</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Validate opponent scores fairly</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Respond to challenges in a timely manner</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Treat all players with respect</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Have fun and enjoy the competition!</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Season Info */}
      <Card className="border-primary/20">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <CardTitle className="text-base sm:text-lg">Season Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm font-medium">Challenge Restriction Date:</span>
            <Badge variant="secondary" className="text-xs w-fit">
              {settings ? new Date(settings.challengeRestrictionDate).toLocaleDateString() : 'Not set'}
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm font-medium">Max Position Difference:</span>
            <Badge variant="secondary" className="text-xs w-fit">
              {settings?.maxPositionDifference || 4} positions
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
