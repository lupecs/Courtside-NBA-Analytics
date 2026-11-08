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
