"""Utilities for managing historical NBA season downloads."""

import time
from pathlib import Path

import pandas as pd

from courtside.coverage import (
    PROCESSED_DATA_DIR,
    build_coverage_report,
    save_coverage_report,
)
from courtside.ingest import RAW_DATA_DIR, fetch_season, save_raw_data

FIRST_NBA_SEASON = 1946

def generate_seasons(start_year: int, end_year: int) -> list[str]:
    """Generate NBA season identifiers for an inclusive year range."""

    if start_year < FIRST_NBA_SEASON:
        raise ValueError(
            f"Start year cannot be earlier than {FIRST_NBA_SEASON}."
        )

    if end_year < start_year:
        raise ValueError("End year cannot be earlier than start year.")

    seasons = []

    for year in range(start_year, end_year + 1):
        next_year = str(year + 1)[-2:]
        seasons.append(f"{year}-{next_year}")

    return seasons

def get_season_file_path(season: str) -> Path:
    """Return the expected raw CSV path for a season."""

    return RAW_DATA_DIR / f"nba_team_game_logs_{season}.csv"

def is_season_downloaded(season: str) -> bool:
    """Check whether a season has a valid downloaded CSV."""

    file_path = get_season_file_path(season)

    if not file_path.exists() or file_path.stat().st_size == 0:
        return False

    try:
        df = pd.read_csv(file_path)
        return not df.empty and {
            "GAME_ID",
            "TEAM_ID",
            "GAME_DATE",
            "PTS",
            "SEASON",
        }.issubset(df.columns)

    except (OSError, pd.errors.ParserError, UnicodeDecodeError):
        return False
def collect_historical_data(
        start_year: int,
        end_year: int,
        max_attempts: int = 3,
        retry_delay: int = 5,
) -> dict:
    """Download historical NBA seasons, skipping existing files and retrying failed requests.

    Args:
        start_year (int): The starting year of the NBA seasons to download.
        end_year (int): The ending year of the NBA seasons to download.
        max_attempts (int, optional): Maximum number of attempts to download each season. Defaults to 3.
        retry_delay (int, optional): Delay in seconds between retry attempts. Defaults to 5.

    Returns:
        dict: A dictionary containing the status of each season download.
    """

    if max_attempts < 1:
        raise ValueError("max_attempts must be at least 1.")

    if retry_delay < 0:
        raise ValueError("retry_delay cannot be negative.")

    seasons = generate_seasons(start_year, end_year)

    results = {
    "downloaded": [],
    "skipped": [],
    "failed": []
}

    total = len(seasons)

    for index, season in enumerate(seasons, start=1):
        print(f"\n[{index}/{total}] Processing {season}...")

        if is_season_downloaded(season):
            print(f"Already downloaded. Skipping {season}.")
            results["skipped"].append(season)
            continue

        for attempt in range(1, max_attempts + 1):
            try:
                print(f"Attempt {attempt}/{max_attempts}...")

                df = fetch_season(season)
                output_path = save_raw_data(df, season)

                print(f"Successfully saved {season}: {output_path}")

                results["downloaded"].append(season)
                break

            except Exception as error:  # noqa: BLE001
                print(f"Failed to download {season}: {error}")

                if attempt < max_attempts:
                    wait_time = retry_delay * attempt
                    print(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    print(f"Giving up on {season} after {max_attempts} attempts.")

                    results["failed"].append({
                        "season": season,
                        "error": str(error),
                    })

    print("\nHistorical ingestion summary")
    print("----------------------------")
    print(f"Downloaded: {len(results['downloaded'])}")
    print(f"Skipped:    {len(results['skipped'])}")
    print(f"Failed:     {len(results['failed'])}")

    return results


def load_historical_data() -> pd.DataFrame:
    """Load and combine all downloaded historical season CSV files."""

    season_files = sorted(RAW_DATA_DIR.glob("nba_team_game_logs_*.csv"))

    if not season_files:
        raise FileNotFoundError(
            "No historical season files found in the raw data directory."
        )

    dataframes = []

    for file_path in season_files:
        print(f"Loading {file_path.name}...")
        season_df = pd.read_csv(file_path)
        dataframes.append(season_df)

    historical_df = pd.concat(
        dataframes,
        ignore_index=True,
        sort=False,
    )

    historical_df["GAME_DATE"] = pd.to_datetime(
        historical_df["GAME_DATE"],
        errors="raise",
    )

    return historical_df


def process_historical_data() -> dict:
    """Combine historical data and generate a statistical coverage report."""

    historical_df = load_historical_data()

    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    dataset_path = (
        PROCESSED_DATA_DIR / "nba_historical_team_game_logs.csv"
    )

    historical_df.to_csv(dataset_path, index=False)

    coverage_report = build_coverage_report(historical_df)
    coverage_path = save_coverage_report(coverage_report)

    summary = {
        "records": len(historical_df),
        "games": historical_df["GAME_ID"].nunique(),
        "teams": historical_df["TEAM_ID"].nunique(),
        "seasons": historical_df["SEASON"].nunique(),
        "dataset_path": dataset_path,
        "coverage_path": coverage_path,
    }

    print("\nHistorical dataset successfully generated!")
    print("------------------------------------------")
    print(f"Seasons: {summary['seasons']:,}")
    print(f"Games:   {summary['games']:,}")
    print(f"Teams:   {summary['teams']:,}")
    print(f"Records: {summary['records']:,}")
    print(f"Dataset: {dataset_path}")
    print(f"Coverage report: {coverage_path}")

    return summary


def main() -> None:
    results = collect_historical_data(
        start_year=1946,
        end_year=2025,
        max_attempts=3,
        retry_delay=5,
    )

    if results["failed"]:
        print("\nSome seasons could not be downloaded:")
        for failure in results["failed"]:
            print(f"{failure['season']}: {failure['error']}")

    if results["downloaded"] or results["skipped"]:
         process_historical_data()

if __name__ == "__main__":
    main()