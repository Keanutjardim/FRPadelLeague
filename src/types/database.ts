export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          phone: string
          name: string
          gender: 'male' | 'female'
          playtomic_level: number
          team_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          phone: string
          name: string
          gender: 'male' | 'female'
          playtomic_level: number
          team_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string
          name?: string
          gender?: 'male' | 'female'
          playtomic_level?: number
          team_id?: string | null
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          creator_id: string
          league: 'mens' | 'womens'
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          creator_id: string
          league: 'mens' | 'womens'
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          league?: 'mens' | 'womens'
          position?: number
          updated_at?: string
        }
      }
      join_requests: {
        Row: {
          id: string
          user_id: string
          team_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          team_id: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'declined'
          updated_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          challenger_team_id: string
          challenged_team_id: string
          status: 'pending' | 'accepted' | 'declined' | 'completed'
          challenger_sets: number[] | null
          challenged_sets: number[] | null
          score_validated: boolean
          winner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          challenger_team_id: string
          challenged_team_id: string
          status?: 'pending' | 'accepted' | 'declined' | 'completed'
          challenger_sets?: number[] | null
          challenged_sets?: number[] | null
          score_validated?: boolean
          winner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'declined' | 'completed'
          challenger_sets?: number[] | null
          challenged_sets?: number[] | null
          score_validated?: boolean
          winner_id?: string | null
          updated_at?: string
        }
      }
      league_settings: {
        Row: {
          id: string
          challenge_restriction_date: string
          max_position_difference: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          challenge_restriction_date: string
          max_position_difference: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          challenge_restriction_date?: string
          max_position_difference?: number
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
