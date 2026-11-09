const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export interface AvailableSeasonsResponse {
  count: number;
  seasons: string[];
}

export interface SeasonSummary {
  SEASON: string;
  TOTAL_GAMES: number;
  TEAM_COUNT: number;
  AVG_GAME_PTS: number;
  AVG_TEAM_PTS: number;
  HIGHEST_SCORING_TEAM: string;
  BEST_TEAM: string;
  BEST_TEAM_WIN_PCT: number;
  BEST_TEAM_POINT_DIFF: number;
}

export interface TeamPerformance {
  TEAM_ID: number;
  TEAM_NAME: string;
  GP: number;
  W: number;
  L: number;
  PTS: number;
  PTS_ALLOWED: number;
  WIN_PCT: number;
  POINT_DIFF: number;
  SEASON: string;
}

export interface SeasonComparison {
  METRIC: string;
  SEASON_A: string;
  VALUE_A: number;
  SEASON_B: string;
  VALUE_B: number;
  DIFFERENCE: number;
  PCT_CHANGE: number | null;
}

export interface EraAdjustedTeamPerformance extends TeamPerformance {
  LEAGUE_AVG_PTS: number;
  PTS_INDEX: number;
  PTS_ABOVE_LEAGUE_AVG: number;
  LEAGUE_AVG_PTS_ALLOWED: number;
  DEF_INDEX: number;
  PTS_PREVENTED_ABOVE_LEAGUE_AVG: number;
  ERA_STRENGTH: number;
}

async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

export function getAvailableSeasons() {
  return apiGet<AvailableSeasonsResponse>("/seasons");
}

export function getSeasonSummaries() {
  return apiGet<SeasonSummary[]>("/seasons/summary");
}

export function getTeamPerformance(season: string) {
  return apiGet<TeamPerformance[]>(`/seasons/${season}/teams`);
}

export function compareSeasons(seasonA: string, seasonB: string) {
  return apiGet<SeasonComparison[]>(
    `/seasons/compare?season_a=${encodeURIComponent(seasonA)}&season_b=${encodeURIComponent(seasonB)}`,
  );
}

export function getEraAdjustedTeamPerformance(season: string) {
  return apiGet<EraAdjustedTeamPerformance[]>(
    `/seasons/${encodeURIComponent(season)}/teams/era-adjusted`,
  );
}
