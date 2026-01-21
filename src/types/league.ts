export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  gender: 'male' | 'female';
  playtomicLevel: number;
  teamId?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  creatorId: string;
  memberIds: string[];
  league: 'mens' | 'womens';
  position: number;
  previousPosition?: number;
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  teamId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Challenge {
  id: string;
  challengerTeamId: string;
  challengedTeamId: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  score?: {
    challengerSets: number[];
    challengedSets: number[];
  };
  scoreSubmittedBy?: string;
  scoreValidated: boolean;
  winnerId?: string;
  createdAt: string;
}

export interface LeagueSettings {
  challengeRestrictionDate: string;
  maxPositionDifference: number;
}
