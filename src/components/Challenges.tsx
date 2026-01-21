import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeague } from '@/contexts/LeagueContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Swords, Check, Edit2, Loader2 } from 'lucide-react';

// Tennis/Padel score validation
const isValidSetScore = (winnerGames: number, loserGames: number): boolean => {
  // Winner must have 6 or 7 games
  if (winnerGames === 6) {
    // 6-0, 6-1, 6-2, 6-3, 6-4 are valid
    return loserGames >= 0 && loserGames <= 4;
  }
  if (winnerGames === 7) {
    // 7-5 or 7-6 (tiebreak) are valid
    return loserGames === 5 || loserGames === 6;
  }
  return false;
};

const validateSetScores = (challengerScore: number, challengedScore: number): { valid: boolean; error?: string } => {
  // Empty scores are allowed (for optional 3rd set)
  if (isNaN(challengerScore) && isNaN(challengedScore)) {
    return { valid: true };
  }

  // Both must be provided if one is
  if (isNaN(challengerScore) || isNaN(challengedScore)) {
    return { valid: false, error: 'Both scores must be entered for a set' };
  }

  // Scores must be non-negative
  if (challengerScore < 0 || challengedScore < 0) {
    return { valid: false, error: 'Scores cannot be negative' };
  }

  // Check if it's a valid winning score
  if (challengerScore > challengedScore) {
    if (!isValidSetScore(challengerScore, challengedScore)) {
      return { valid: false, error: `Invalid score: ${challengerScore}-${challengedScore}. Valid: 6-0 to 6-4, 7-5, 7-6` };
    }
  } else if (challengedScore > challengerScore) {
    if (!isValidSetScore(challengedScore, challengerScore)) {
      return { valid: false, error: `Invalid score: ${challengerScore}-${challengedScore}. Valid: 0-6 to 4-6, 5-7, 6-7` };
    }
  } else {
    // Tie - not valid in tennis
    return { valid: false, error: 'Sets cannot end in a tie' };
  }

  return { valid: true };
};

export function Challenges() {
  const { user } = useAuth();
  const { teams, getTeamById, getTeamChallenges, createChallenge, submitScore, validateScore, canChallenge } = useLeague();
  const { toast } = useToast();
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [scores, setScores] = useState({ set1c: '', set1d: '', set2c: '', set2d: '', set3c: '', set3d: '' });
  const [challengingTeamId, setChallengingTeamId] = useState<string | null>(null);

  if (!user?.teamId) return null;

  const myTeam = getTeamById(user.teamId);
  if (!myTeam) return null;

  const challenges = getTeamChallenges(user.teamId);

  // Get active (non-completed/validated) challenges
  const activeChallenges = challenges.filter(c =>
    c.status === 'accepted' || (c.status === 'completed' && !c.scoreValidated)
  );

  // Check if there's an active challenge with a specific team
  const hasActiveChallenge = (teamId: string) => {
    return challenges.some(c =>
      (c.challengerTeamId === teamId || c.challengedTeamId === teamId) &&
      (c.status === 'accepted' || (c.status === 'completed' && !c.scoreValidated))
    );
  };

  // Get challengeable teams (exclude teams with active challenges)
  const challengeableTeams = teams.filter(t =>
    t.league === myTeam.league &&
    canChallenge(myTeam, t) &&
    !hasActiveChallenge(t.id)
  );

  const handleChallenge = async (teamId: string) => {
    // Prevent double-clicks with loading state
    if (challengingTeamId) return;

    setChallengingTeamId(teamId);
    console.log('[Challenges] Sending challenge to team:', teamId);

    try {
      // Add timeout to prevent infinite loading
      const challengePromise = createChallenge(user.teamId!, teamId);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Challenge request timed out. Please try again.')), 15000)
      );

      await Promise.race([challengePromise, timeoutPromise]);
      console.log('[Challenges] Challenge sent successfully');
      toast({ title: 'Challenge sent!', description: 'Match is on! Enter scores after playing.' });
    } catch (error: any) {
      console.error('[Challenges] Error sending challenge:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create challenge. Please try again.',
        variant: 'destructive'
      });
    } finally {
      console.log('[Challenges] Resetting loading state');
      setChallengingTeamId(null);
    }
  };

  const openScoreDialog = (challengeId: string, existingScore?: { challengerSets: number[], challengedSets: number[] }) => {
    setSelectedChallenge(challengeId);
    if (existingScore) {
      setScores({
        set1c: existingScore.challengerSets[0]?.toString() || '',
        set1d: existingScore.challengedSets[0]?.toString() || '',
        set2c: existingScore.challengerSets[1]?.toString() || '',
        set2d: existingScore.challengedSets[1]?.toString() || '',
        set3c: existingScore.challengerSets[2]?.toString() || '',
        set3d: existingScore.challengedSets[2]?.toString() || '',
      });
    } else {
      setScores({ set1c: '', set1d: '', set2c: '', set2d: '', set3c: '', set3d: '' });
    }
    setScoreDialogOpen(true);
  };

  const handleSubmitScore = () => {
    if (!selectedChallenge || !user.teamId) return;

    const set1c = parseInt(scores.set1c);
    const set1d = parseInt(scores.set1d);
    const set2c = parseInt(scores.set2c);
    const set2d = parseInt(scores.set2d);
    const set3c = parseInt(scores.set3c);
    const set3d = parseInt(scores.set3d);

    // Validate Set 1 (required)
    const set1Validation = validateSetScores(set1c, set1d);
    if (!set1Validation.valid) {
      toast({ title: 'Invalid Set 1 Score', description: set1Validation.error, variant: 'destructive' });
      return;
    }

    // Validate Set 2 (required)
    const set2Validation = validateSetScores(set2c, set2d);
    if (!set2Validation.valid) {
      toast({ title: 'Invalid Set 2 Score', description: set2Validation.error, variant: 'destructive' });
      return;
    }

    // Validate Set 3 (optional, but if one score is entered, both must be)
    const set3Validation = validateSetScores(set3c, set3d);
    if (!set3Validation.valid) {
      toast({ title: 'Invalid Set 3 Score', description: set3Validation.error, variant: 'destructive' });
      return;
    }

    // Count sets won by each team
    let challengerSetsWon = 0;
    let challengedSetsWon = 0;

    if (set1c > set1d) challengerSetsWon++;
    else challengedSetsWon++;

    if (set2c > set2d) challengerSetsWon++;
    else challengedSetsWon++;

    // Check if 3rd set is needed
    const hasThirdSet = !isNaN(set3c) && !isNaN(set3d);
    if (hasThirdSet) {
      if (set3c > set3d) challengerSetsWon++;
      else challengedSetsWon++;
    }

    // Validate match result - must have a winner (best of 3)
    if (challengerSetsWon === challengedSetsWon) {
      toast({ title: 'Invalid Match Result', description: 'Match must have a winner. Enter 3rd set if needed.', variant: 'destructive' });
      return;
    }

    // If someone won 2-0, 3rd set shouldn't be entered
    if ((challengerSetsWon === 2 || challengedSetsWon === 2) && hasThirdSet) {
      // Actually this is fine - some matches record all 3 sets played even if one team won first 2
      // But in best of 3, you wouldn't play a 3rd set after someone won 2. Let's enforce this:
      const firstTwoSetsWinner = (set1c > set1d ? 1 : 0) + (set2c > set2d ? 1 : 0);
      const firstTwoSetsLosses = (set1c < set1d ? 1 : 0) + (set2c < set2d ? 1 : 0);
      if (firstTwoSetsWinner === 2 || firstTwoSetsLosses === 2) {
        toast({ title: 'Invalid Match', description: 'No 3rd set needed if one team already won 2 sets.', variant: 'destructive' });
        return;
      }
    }

    // If sets are 1-1, 3rd set is required
    if (challengerSetsWon === 1 && challengedSetsWon === 1 && !hasThirdSet) {
      toast({ title: 'Match Incomplete', description: 'Sets are 1-1, please enter 3rd set score.', variant: 'destructive' });
      return;
    }

    const challengerSets = [set1c, set2c];
    const challengedSets = [set1d, set2d];

    if (hasThirdSet) {
      challengerSets.push(set3c);
      challengedSets.push(set3d);
    }

    submitScore(selectedChallenge, challengerSets, challengedSets, user.teamId);
    setScoreDialogOpen(false);
    setScores({ set1c: '', set1d: '', set2c: '', set2d: '', set3c: '', set3d: '' });
    setSelectedChallenge(null);
    toast({ title: 'Score submitted!', description: 'Awaiting opponent confirmation.' });
  };

  const handleValidateScore = (challengeId: string) => {
    validateScore(challengeId, true);
    toast({ title: 'Score confirmed!', description: 'Match result recorded.' });
  };

  // Completed challenges (validated)
  const completedChallenges = challenges.filter(c => c.scoreValidated);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Challenge a Team */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Swords className="h-4 w-4 sm:h-5 sm:w-5" />
            Challenge a Team
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {challengeableTeams.length === 0 ? (
            <p className="text-muted-foreground text-sm">No teams available to challenge</p>
          ) : (
            <div className="space-y-2">
              {challengeableTeams.map((team) => {
                const isLoading = challengingTeamId === team.id;
                return (
                  <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-xs sm:text-sm truncate block">#{team.position} {team.name}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleChallenge(team.id)}
                      className="flex-shrink-0 text-xs"
                      disabled={isLoading || challengingTeamId !== null}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Challenge'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Matches - Enter Scores */}
      {activeChallenges.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Active Matches</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-3">
              {activeChallenges.map((challenge) => {
                const challengerTeam = getTeamById(challenge.challengerTeamId);
                const challengedTeam = getTeamById(challenge.challengedTeamId);
                const isChallenger = challenge.challengerTeamId === user.teamId;
                const opponent = isChallenger ? challengedTeam : challengerTeam;
                const myTeamInMatch = isChallenger ? challengerTeam : challengedTeam;

                // Determine if we submitted the score or opponent did
                const weSubmittedScore = challenge.scoreSubmittedBy === user.teamId;
                const hasScore = challenge.status === 'completed' && challenge.score;
                const waitingForOpponent = hasScore && weSubmittedScore;
                const needToRespond = hasScore && !weSubmittedScore;

                return (
                  <div key={challenge.id} className="p-3 sm:p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-xs sm:text-sm block">
                          vs {opponent?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isChallenger ? 'You challenged them' : 'They challenged you'}
                        </span>
                      </div>
                      <Badge variant={hasScore ? "secondary" : "default"} className="text-xs">
                        {hasScore ? 'Score Submitted' : 'Awaiting Score'}
                      </Badge>
                    </div>

                    {/* No score yet - show Enter Score button */}
                    {!hasScore && (
                      <Button
                        size="sm"
                        onClick={() => openScoreDialog(challenge.id)}
                        className="w-full text-xs"
                      >
                        Enter Score
                      </Button>
                    )}

                    {/* Score submitted - show score and actions */}
                    {hasScore && challenge.score && (
                      <div className="space-y-2">
                        <div className="bg-muted p-2 rounded text-center">
                          <div className="text-xs text-muted-foreground mb-1">
                            {challengerTeam?.name} vs {challengedTeam?.name}
                          </div>
                          <div className="font-mono text-sm font-bold">
                            {challenge.score.challengerSets.map((s, i) =>
                              `${s}-${challenge.score!.challengedSets[i]}`
                            ).join('  ')}
                          </div>
                        </div>

                        {waitingForOpponent && (
                          <p className="text-xs text-muted-foreground text-center">
                            Awaiting {opponent?.name}'s confirmation...
                          </p>
                        )}

                        {needToRespond && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleValidateScore(challenge.id)}
                              className="flex-1 text-xs"
                            >
                              <Check className="h-3 w-3 mr-1" /> Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openScoreDialog(challenge.id, challenge.score)}
                              className="flex-1 text-xs"
                            >
                              <Edit2 className="h-3 w-3 mr-1" /> Modify
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score Entry Dialog */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Enter Match Score</DialogTitle>
          </DialogHeader>
          {selectedChallenge && (() => {
            const challenge = challenges.find(c => c.id === selectedChallenge);
            const challengerTeam = challenge ? getTeamById(challenge.challengerTeamId) : null;
            const challengedTeam = challenge ? getTeamById(challenge.challengedTeamId) : null;

            return (
              <div className="space-y-3 sm:space-y-4">
                <p className="text-xs text-muted-foreground text-center">
                  Best of 3 sets • Valid scores: 6-0 to 6-4, 7-5, 7-6
                </p>
                <div className="grid grid-cols-3 gap-1 sm:gap-2 items-center">
                  <span className="text-xs sm:text-sm font-medium">Set</span>
                  <span className="text-xs sm:text-sm font-medium text-center truncate">{challengerTeam?.name}</span>
                  <span className="text-xs sm:text-sm font-medium text-center truncate">{challengedTeam?.name}</span>
                </div>
                {[1, 2, 3].map((set) => (
                  <div key={set} className="grid grid-cols-3 gap-1 sm:gap-2 items-center">
                    <span className="text-xs sm:text-sm">Set {set} {set === 3 && <span className="text-muted-foreground">(if needed)</span>}</span>
                    <Input
                      type="number"
                      min="0"
                      max="7"
                      placeholder="0"
                      value={scores[`set${set}c` as keyof typeof scores]}
                      onChange={(e) => setScores({ ...scores, [`set${set}c`]: e.target.value })}
                      className="text-center h-9 text-sm"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="7"
                      placeholder="0"
                      value={scores[`set${set}d` as keyof typeof scores]}
                      onChange={(e) => setScores({ ...scores, [`set${set}d`]: e.target.value })}
                      className="text-center h-9 text-sm"
                    />
                  </div>
                ))}
                <Button onClick={handleSubmitScore} className="w-full text-sm">
                  Submit Score
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Completed Matches History */}
      {completedChallenges.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Match History</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-2">
              {completedChallenges.map((challenge) => {
                const challengerTeam = getTeamById(challenge.challengerTeamId);
                const challengedTeam = getTeamById(challenge.challengedTeamId);
                const winnerTeam = challenge.winnerId ? getTeamById(challenge.winnerId) : null;
                const isWinner = challenge.winnerId === user.teamId;
                const matchDate = new Date(challenge.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div key={challenge.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-xs sm:text-sm">
                        <span className="font-medium">{challengerTeam?.name}</span>
                        <span className="text-muted-foreground"> vs </span>
                        <span className="font-medium">{challengedTeam?.name}</span>
                      </div>
                      <Badge variant={isWinner ? "default" : "secondary"} className="text-xs">
                        {isWinner ? 'Won' : 'Lost'}
                      </Badge>
                    </div>
                    {challenge.score && (
                      <div className="flex justify-center gap-2 mt-2">
                        {challenge.score.challengerSets.map((s, i) => {
                          const challengerWon = s > challenge.score!.challengedSets[i];
                          return (
                            <div
                              key={i}
                              className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg px-3 py-2 min-w-[60px]"
                            >
                              <div className="font-mono text-lg font-bold text-center tracking-wide">
                                <span className={challengerWon ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                                  {s}
                                </span>
                                <span className="text-muted-foreground mx-1">-</span>
                                <span className={!challengerWon ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                                  {challenge.score!.challengedSets[i]}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 text-[10px] sm:text-xs text-muted-foreground">
                      <span>{matchDate}</span>
                      {winnerTeam && <span>Winner: <span className="font-medium text-foreground">{winnerTeam.name}</span></span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
