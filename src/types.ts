export interface CricketMatch {
  matchId: number;
  matchDescription: string;
  matchFormat: string;
  matchType: string;
  status: string;
  team1: {
    name: string;
    shortName: string;
    score?: string;
  };
  team2: {
    name: string;
    shortName: string;
    score?: string;
  };
  venue: string;
}
