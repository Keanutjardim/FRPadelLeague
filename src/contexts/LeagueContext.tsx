import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Team, JoinRequest, Challenge, LeagueSettings, User } from '@/types/league';
import { supabase } from '@/lib/supabase';

interface LeagueContextType {
  teams: Team[];
  users: User[];
  joinRequests: JoinRequest[];
  challenges: Challenge[];
  settings: LeagueSettings | null;
  loading: boolean;
  createTeam: (name: string, creatorId: string, league: 'mens' | 'womens') => Promise<Team | null>;
  getAvailableTeams: (league: 'mens' | 'womens') => Team[];
  requestToJoin: (userId: string, teamId: string) => Promise<void>;
  respondToJoinRequest: (requestId: string, accept: boolean) => Promise<void>;
  getUserJoinRequests: (userId: string) => JoinRequest[];
  getTeamJoinRequests: (teamId: string) => JoinRequest[];
  createChallenge: (challengerTeamId: string, challengedTeamId: string) => Promise<void>;
  respondToChallenge: (challengeId: string, accept: boolean) => Promise<void>;
  submitScore: (challengeId: string, challengerSets: number[], challengedSets: number[], submittedByTeamId: string) => Promise<void>;
  validateScore: (challengeId: string, valid: boolean) => Promise<void>;
  getTeamChallenges: (teamId: string) => Challenge[];
  getTeamById: (teamId: string) => Team | undefined;
  getUserById: (userId: string) => User | undefined;
  canChallenge: (challengerTeam: Team, challengedTeam: Team) => boolean;
  updateSettings: (newSettings: Partial<LeagueSettings>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTeams(),
      fetchJoinRequests(),
      fetchChallenges(),
      fetchSettings(),
    ]);
    setLoading(false);
  };

  // Fetch teams with member data
  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        profiles!profiles_team_id_fkey(id, email, phone, name, gender, playtomic_level, team_id, created_at)
      `)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching teams:', error);
      return;
    }

    // Extract all users from teams
    const allUsers: User[] = [];
    const teamsWithMembers: Team[] = data.map((team: any) => {
      const members = team.profiles || [];
      members.forEach((p: any) => {
        if (!allUsers.find(u => u.id === p.id)) {
          allUsers.push({
            id: p.id,
            email: p.email,
            phone: p.phone,
            name: p.name,
            gender: p.gender as 'male' | 'female',
            playtomicLevel: p.playtomic_level,
            teamId: p.team_id || undefined,
            createdAt: p.created_at,
          });
        }
      });

      return {
        id: team.id,
        name: team.name,
        creatorId: team.creator_id,
        memberIds: members.map((p: any) => p.id),
        league: team.league as 'mens' | 'womens',
        position: team.position,
        previousPosition: team.previous_position ?? team.position,
        createdAt: team.created_at,
      };
    });

    setUsers(allUsers);
    setTeams(teamsWithMembers);
  };

  const fetchJoinRequests = async () => {
    const { data, error } = await supabase
      .from('join_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching join requests:', error);
      return;
    }

    const requests: JoinRequest[] = data.map((req: any) => ({
      id: req.id,
      userId: req.user_id,
      teamId: req.team_id,
      status: req.status as 'pending' | 'accepted' | 'declined',
      createdAt: req.created_at,
    }));

    setJoinRequests(requests);
  };

  const fetchChallenges = async () => {
    console.log('[League] Fetching challenges...');
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[League] Error fetching challenges:', error);
        return;
      }

      console.log('[League] Challenges fetched:', data?.length || 0);

      const challengesList: Challenge[] = data.map((ch: any) => ({
        id: ch.id,
        challengerTeamId: ch.challenger_team_id,
        challengedTeamId: ch.challenged_team_id,
        status: ch.status as 'pending' | 'accepted' | 'declined' | 'completed',
        score: ch.challenger_sets && ch.challenged_sets ? {
          challengerSets: ch.challenger_sets,
          challengedSets: ch.challenged_sets,
        } : undefined,
        scoreSubmittedBy: ch.score_submitted_by || undefined,
        scoreValidated: ch.score_validated,
        winnerId: ch.winner_id || undefined,
        createdAt: ch.created_at,
      }));

      setChallenges(challengesList);
    } catch (err) {
      console.error('[League] Exception fetching challenges:', err);
    }
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('league_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return;
    }

    setSettings({
      challengeRestrictionDate: data.challenge_restriction_date,
      maxPositionDifference: data.max_position_difference,
    });
  };

  // Initialize data
  useEffect(() => {
    refreshData();

    // Set up real-time subscriptions with proper status handling
    console.log('[League] Setting up realtime subscriptions...');

    const teamsChannel = supabase
      .channel('teams-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          console.log('[League] Teams change detected:', payload.eventType);
          fetchTeams();
        }
      )
      .subscribe((status) => {
        console.log('[League] Teams channel status:', status);
      });

    const joinRequestsChannel = supabase
      .channel('join-requests-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'join_requests' },
        (payload) => {
          console.log('[League] Join requests change detected:', payload.eventType);
          fetchJoinRequests();
        }
      )
      .subscribe((status) => {
        console.log('[League] Join requests channel status:', status);
      });

    const challengesChannel = supabase
      .channel('challenges-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'challenges' },
        (payload) => {
          console.log('[League] Challenges change detected:', payload.eventType);
          fetchChallenges();
        }
      )
      .subscribe((status) => {
        console.log('[League] Challenges channel status:', status);
      });

    const profilesChannel = supabase
      .channel('profiles-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('[League] Profiles change detected:', payload.eventType);
          fetchTeams(); // Refresh teams when profiles change (team membership)
        }
      )
      .subscribe((status) => {
        console.log('[League] Profiles channel status:', status);
      });

    // Handle visibility change - refresh data when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[League] Tab became visible, refreshing data...');
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('[League] Cleaning up realtime subscriptions...');
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(joinRequestsChannel);
      supabase.removeChannel(challengesChannel);
      supabase.removeChannel(profilesChannel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  const createTeam = async (name: string, creatorId: string, league: 'mens' | 'womens'): Promise<Team | null> => {
    // Get next position
    const leagueTeams = teams.filter(t => t.league === league);
    const nextPosition = leagueTeams.length + 1;

    const { data, error } = await supabase
      .from('teams')
      .insert({
        name,
        creator_id: creatorId,
        league,
        position: nextPosition,
        previous_position: nextPosition,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return null;
    }

    // Update user's team_id
    await supabase
      .from('profiles')
      .update({ team_id: data.id })
      .eq('id', creatorId);

    const newTeam: Team = {
      id: data.id,
      name: data.name,
      creatorId: data.creator_id,
      memberIds: [creatorId],
      league: data.league as 'mens' | 'womens',
      position: data.position,
      previousPosition: data.previous_position ?? data.position,
      createdAt: data.created_at,
    };

    await refreshData();
    return newTeam;
  };

  const getAvailableTeams = (league: 'mens' | 'womens'): Team[] => {
    return teams.filter(t => t.league === league && t.memberIds.length < 4);
  };

  const requestToJoin = async (userId: string, teamId: string): Promise<void> => {
    const { error } = await supabase
      .from('join_requests')
      .insert({
        user_id: userId,
        team_id: teamId,
      });

    if (error) {
      console.error('Error creating join request:', error);
    }
  };

  const respondToJoinRequest = async (requestId: string, accept: boolean): Promise<void> => {
    const request = joinRequests.find(r => r.id === requestId);
    if (!request) {
      console.error('[League] Join request not found:', requestId);
      throw new Error('Join request not found');
    }

    if (accept) {
      // Fetch fresh team data to check current member count
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(`
          *,
          profiles!profiles_team_id_fkey(id)
        `)
        .eq('id', request.teamId)
        .single();

      if (teamError || !teamData) {
        console.error('[League] Error fetching team:', teamError);
        throw new Error('Team not found');
      }

      const currentMemberCount = teamData.profiles?.length || 0;
      if (currentMemberCount >= 4) {
        console.error('[League] Team is full:', currentMemberCount, 'members');
        throw new Error('Team is full (4 players maximum)');
      }

      // Update user's team_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ team_id: request.teamId })
        .eq('id', request.userId);

      if (profileError) {
        console.error('[League] Error updating profile:', profileError);
        throw new Error('Failed to add user to team');
      }

      console.log('[League] User added to team:', request.userId, '->', request.teamId);
    }

    // Update request status
    const { error: requestError } = await supabase
      .from('join_requests')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', requestId);

    if (requestError) {
      console.error('[League] Error updating join request:', requestError);
    }

    // Refresh data to update UI
    await refreshData();
  };

  const getUserJoinRequests = (userId: string): JoinRequest[] => {
    return joinRequests.filter(r => r.userId === userId);
  };

  const getTeamJoinRequests = (teamId: string): JoinRequest[] => {
    return joinRequests.filter(r => r.teamId === teamId && r.status === 'pending');
  };

  const getTeamById = (teamId: string): Team | undefined => {
    return teams.find(t => t.id === teamId);
  };

  const canChallenge = (challengerTeam: Team, challengedTeam: Team): boolean => {
    if (challengerTeam.league !== challengedTeam.league) return false;
    if (challengerTeam.id === challengedTeam.id) return false;
    if (!settings) return false;

    const now = new Date();
    const restrictionDate = new Date(settings.challengeRestrictionDate);

    if (now >= restrictionDate) {
      const positionDiff = challengerTeam.position - challengedTeam.position;
      return positionDiff > 0 && positionDiff <= settings.maxPositionDifference;
    }

    return challengerTeam.position > challengedTeam.position;
  };

  const createChallenge = async (challengerTeamId: string, challengedTeamId: string): Promise<void> => {
    console.log('[League] Creating challenge:', challengerTeamId, '->', challengedTeamId);

    // Check if there's already an active challenge between these teams
    const existingChallenge = challenges.find(c =>
      ((c.challengerTeamId === challengerTeamId && c.challengedTeamId === challengedTeamId) ||
       (c.challengerTeamId === challengedTeamId && c.challengedTeamId === challengerTeamId)) &&
      (c.status === 'pending' || c.status === 'accepted' || (c.status === 'completed' && !c.scoreValidated))
    );

    if (existingChallenge) {
      console.log('[League] Existing challenge found:', existingChallenge.id);
      throw new Error('An active challenge already exists between these teams');
    }

    try {
      console.log('[League] Inserting challenge...');
      // Note: Removed .select().single() as it can cause RLS timeout issues
      const { error } = await supabase
        .from('challenges')
        .insert({
          challenger_team_id: challengerTeamId,
          challenged_team_id: challengedTeamId,
          status: 'accepted', // Auto-accept - challenged team must play
        });

      if (error) {
        console.error('[League] Error creating challenge:', error);
        throw new Error(error.message || 'Failed to create challenge');
      }

      console.log('[League] Challenge inserted successfully');

      // Manually refresh challenges to ensure UI updates immediately
      console.log('[League] Refreshing challenges...');
      await fetchChallenges();
      console.log('[League] Challenge creation complete');
    } catch (err) {
      console.error('[League] Exception in createChallenge:', err);
      throw err;
    }
  };

  const respondToChallenge = async (challengeId: string, accept: boolean): Promise<void> => {
    await supabase
      .from('challenges')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', challengeId);
  };

  const submitScore = async (
    challengeId: string,
    challengerSets: number[],
    challengedSets: number[],
    submittedByTeamId: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('challenges')
      .update({
        challenger_sets: challengerSets,
        challenged_sets: challengedSets,
        score_submitted_by: submittedByTeamId,
        status: 'completed',
      })
      .eq('id', challengeId);

    if (error) {
      console.error('Error submitting score:', error);
      throw new Error(error.message || 'Failed to submit score');
    }

    // Refresh challenges to update UI
    await fetchChallenges();
  };

  const validateScore = async (challengeId: string, valid: boolean): Promise<void> => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.score) return;

    if (!valid) {
      // Dispute - reset score
      await supabase
        .from('challenges')
        .update({
          challenger_sets: null,
          challenged_sets: null,
          status: 'accepted',
          score_submitted_by: null,
        })
        .eq('id', challengeId);
      await refreshData();
      return;
    }

    // Calculate winner
    const challengerWins = challenge.score.challengerSets.filter(
      (s, i) => s > challenge.score!.challengedSets[i]
    ).length;
    const challengedWins = challenge.score.challengedSets.filter(
      (s, i) => s > challenge.score!.challengerSets[i]
    ).length;
    const winnerId = challengerWins > challengedWins ? challenge.challengerTeamId : challenge.challengedTeamId;

    // Update challenge with winner
    const { error: challengeError } = await supabase
      .from('challenges')
      .update({
        score_validated: true,
        winner_id: winnerId,
      })
      .eq('id', challengeId);

    if (challengeError) {
      console.error('[League] Error updating challenge:', challengeError);
    }

    // Update positions if challenger won
    if (winnerId === challenge.challengerTeamId) {
      // Fetch FRESH team data directly from database to avoid stale state issues
      const { data: freshTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, league, position, previous_position')
        .in('id', [challenge.challengerTeamId, challenge.challengedTeamId]);

      if (teamsError || !freshTeams || freshTeams.length < 2) {
        console.error('[League] Error fetching fresh team data:', teamsError);
        await refreshData();
        return;
      }

      const challengerTeam = freshTeams.find(t => t.id === challenge.challengerTeamId);
      const challengedTeam = freshTeams.find(t => t.id === challenge.challengedTeamId);

      if (challengerTeam && challengedTeam && challengerTeam.position > challengedTeam.position) {
        const loserPosition = challengedTeam.position; // The position the winner takes
        const winnerOldPosition = challengerTeam.position;

        console.log('[League] Position update: Winner', challengerTeam.name, 'takes position', loserPosition);
        console.log('[League] Teams from position', loserPosition, 'to', winnerOldPosition - 1, 'shift down by 1');

        // Step 1: Move winner to temp position (99999) to free up their old slot
        const { error: step1Error } = await supabase
          .from('teams')
          .update({ position: 99999 })
          .eq('id', challenge.challengerTeamId);
        if (step1Error) console.error('[League] Step 1 error:', step1Error);

        // Step 2: Shift all teams from loser position to (winner old position - 1) down by 1
        // This includes the loser - they move down 1 spot
        const { data: teamsToShift } = await supabase
          .from('teams')
          .select('id, position')
          .eq('league', challengerTeam.league)
          .gte('position', loserPosition)
          .lt('position', winnerOldPosition)
          .order('position', { ascending: false }); // Process from bottom to top to avoid conflicts

        if (teamsToShift && teamsToShift.length > 0) {
          for (const team of teamsToShift) {
            const { error } = await supabase
              .from('teams')
              .update({
                previous_position: team.position,
                position: team.position + 1
              })
              .eq('id', team.id);
            if (error) console.error('[League] Error shifting team:', team.id, error);
            else console.log('[League] Shifted team from', team.position, 'to', team.position + 1);
          }
        }

        // Step 3: Move winner to the loser's original position
        const { error: step3Error } = await supabase
          .from('teams')
          .update({
            previous_position: winnerOldPosition,
            position: loserPosition
          })
          .eq('id', challenge.challengerTeamId);
        if (step3Error) console.error('[League] Step 3 error:', step3Error);

        console.log('[League] Position update complete');
      } else {
        console.log('[League] No position change needed - challenger already higher or equal rank');
      }
    } else {
      console.log('[League] Challenged team (defender) won - no position change');
    }

    // Always refresh all data to ensure UI is up to date
    await refreshData();
  };

  const getTeamChallenges = (teamId: string): Challenge[] => {
    return challenges.filter(c => c.challengerTeamId === teamId || c.challengedTeamId === teamId);
  };

  const updateSettings = async (newSettings: Partial<LeagueSettings>): Promise<void> => {
    const dbUpdates: any = {};
    if (newSettings.challengeRestrictionDate) {
      dbUpdates.challenge_restriction_date = newSettings.challengeRestrictionDate;
    }
    if (newSettings.maxPositionDifference !== undefined) {
      dbUpdates.max_position_difference = newSettings.maxPositionDifference;
    }

    const { error } = await supabase
      .from('league_settings')
      .update(dbUpdates)
      .limit(1);

    if (!error && settings) {
      setSettings({ ...settings, ...newSettings });
    }
  };

  return (
    <LeagueContext.Provider value={{
      teams,
      users,
      joinRequests,
      challenges,
      settings,
      loading,
      createTeam,
      getAvailableTeams,
      requestToJoin,
      respondToJoinRequest,
      getUserJoinRequests,
      getTeamJoinRequests,
      createChallenge,
      respondToChallenge,
      submitScore,
      validateScore,
      getTeamChallenges,
      getTeamById,
      getUserById,
      canChallenge,
      updateSettings,
      refreshData,
    }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
}
