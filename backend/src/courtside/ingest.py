"""Download and validate historical NBA team game logs."""

from pathlib import Path

import pandas as pd
from nba_api.stats.endpoints import leaguegamelog

PROJECT_ROOT = Path(__file__).resolve().parents[3]
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"

CORE_COLUMNS = {
    "GAME_ID",
    "TEAM_ID",
    "TEAM_NAME",
    "GAME_DATE",
    "MATCHUP",
    "WL",
    "PTS",
}

OPTIONAL_STAT_COLUMNS = {
    "MIN",
    "FGM",
    "FGA",
    "FG_PCT",
    "FG3M",
    "FG3A",
    "FG3_PCT",
    "FTM",
    "FTA",
    "FT_PCT",
    "OREB",
    "DREB",
    "REB",
    "AST",
    "STL",
    "BLK",
    "TOV",
    "PF",
    "PLUS_MINUS",
}


def validate_game_logs(
    df: pd.DataFrame,
    season: str,
) -> pd.DataFrame:
    """Validate game logs while preserving unavailable historical statistics."""

    if df.empty:
        raise ValueError(f"No game records returned for {season}.")

    missing = CORE_COLUMNS.difference(df.columns)

    if missing:
        raise ValueError(f"Missing essential columns for {season}: {sorted(missing)}")

    df = df.copy()

    for column in OPTIONAL_STAT_COLUMNS:
        if column not in df.columns:
            df[column] = pd.NA

    df["GAME_DATE"] = pd.to_datetime(
        df["GAME_DATE"],
        errors="raise",
    )

    df["SEASON"] = season

    if df["GAME_ID"].isna().any():
        raise ValueError("Null game IDs found.")

    if df["TEAM_ID"].isna().any():
        raise ValueError("Null team IDs found.")

    if df["PTS"].isna().any():
        raise ValueError("Missing point totals found.")

    if df.duplicated(["GAME_ID", "TEAM_ID"]).any():
        raise ValueError("Duplicate game/team records found.")

    if not df["WL"].isin(["W", "L"]).all():
        raise ValueError("Unexpected game outcome values.")

    return df.sort_values(["GAME_DATE", "GAME_ID", "TEAM_ID"]).reset_index(drop=True)


def fetch_season(season: str = "2024-25") -> pd.DataFrame:
    """Fetch one NBA regular season of team-level game logs."""

    response = leaguegamelog.LeagueGameLog(
        counter=0,
        direction="ASC",
        league_id="00",
        player_or_team_abbreviation="T",
        season=season,
        season_type_all_star="Regular Season",
        sorter="DATE",
        timeout=60,
    )

    df = response.get_data_frames()[0]

    return validate_game_logs(df, season)


def save_raw_data(df: pd.DataFrame, season: str) -> Path:
    """Save validated source data without feature transformations."""

    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

    output_path = RAW_DATA_DIR / f"nba_team_game_logs_{season}.csv"
    df.to_csv(output_path, index=False)

    return output_path


def main() -> None:
    season = "2024-25"

    print(f"Fetching NBA {season} regular-season data...")

    df = fetch_season(season)
    output_path = save_raw_data(df, season)

    print("\nData successfully downloaded!")
    print(f"Records: {len(df):,}")
    print(f"Games: {df['GAME_ID'].nunique():,}")
    print(f"Teams: {df['TEAM_ID'].nunique():,}")
    print(f"Date range: {df['GAME_DATE'].min()} to {df['GAME_DATE'].max()}")
    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    main()
