"""Generate historical NBA statistical coverage """

from pathlib import Path

import pandas as pd

from courtside.ingest import OPTIONAL_STAT_COLUMNS

PROJECT_ROOT = Path(__file__).resolve().parents[3]
PROCESSED_DATA_DIR = PROJECT_ROOT / "data" / "processed"


def build_coverage_report(df: pd.DataFrame) -> pd.DataFrame:
    """Summarize game and statistical coverage for each NBA season."""

    if df.empty:
        raise ValueError("Cannot generate a coverage report from empty data.")

    required_columns = {
        "SEASON",
        "GAME_ID",
        "TEAM_ID",
        "GAME_DATE",
    }

    missing = required_columns.difference(df.columns)

    if missing:
        raise ValueError(
            f"Missing required columns: {sorted(missing)}"
        )

    df = df.copy()

    # Validate essential identifiers and dates.
    if df["SEASON"].isna().any():
        raise ValueError("Missing season values found.")

    if df["GAME_ID"].isna().any():
        raise ValueError("Missing game IDs found.")

    if df["TEAM_ID"].isna().any():
        raise ValueError("Missing team IDs found.")

    df["GAME_DATE"] = pd.to_datetime(
        df["GAME_DATE"],
        errors="raise",
    )

    if df["GAME_DATE"].isna().any():
        raise ValueError("Missing game dates found.")

    report_rows = []

    for season, season_df in df.groupby("SEASON", sort=True):
        total_records = len(season_df)

        row = {
            "SEASON": season,
            "RECORDS": total_records,
            "GAMES": season_df["GAME_ID"].nunique(),
            "TEAMS": season_df["TEAM_ID"].nunique(),
            "START_DATE": season_df["GAME_DATE"].min(),
            "END_DATE": season_df["GAME_DATE"].max(),
        }

        for column in sorted(OPTIONAL_STAT_COLUMNS):
            if column in season_df.columns:
                available_records = int(
                    season_df[column].notna().sum()
                )
            else:
                available_records = 0

            coverage_pct = (
                available_records / total_records
            ) * 100

            row[f"{column}_NON_NULL"] = available_records
            row[f"{column}_COVERAGE_PCT"] = round(
                coverage_pct,
                2,
            )

        report_rows.append(row)

    return pd.DataFrame(report_rows)


def save_coverage_report(report: pd.DataFrame) -> Path:
    """Save the historical coverage report to a CSV file."""

    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    output_path = PROCESSED_DATA_DIR / "season_coverage.csv"

    report.to_csv(output_path, index=False)

    return output_path