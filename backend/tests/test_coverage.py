# build_coverage reports function should calculate statistical coverage correctly
# If 8 out of 10 records contain assists, the result should be 80%
# No need to contact NBA API to test

import pandas as pd
import pytest 

from courtside.coverage import build_coverage_report

def make_game_logs() -> pd.DataFrame:
    """Create sample game logs for testing"""

    return pd.DataFrame(
        [
            {
                "SEASON": "1946-47",
                "GAME_ID": "G001",
                "TEAM_ID": 1,
                "GAME_DATE": "1946-11-01",
                "FGM": 10,
                "AST": 20,
            },
             {
                "SEASON": "1946-47",
                "GAME_ID": "G001",
                "TEAM_ID": 2,
                "GAME_DATE": "1946-11-01",
                "FGM": 12,
                "AST": None,
            },
            {
                "SEASON": "2024-25",
                "GAME_ID": "G002",
                "TEAM_ID": 3,
                "GAME_DATE": "2024-10-22",
                "FGM": 15,
                "AST": 25,
            },
            {
                "SEASON": "2024-25",
                "GAME_ID": "G002",
                "TEAM_ID": 4,
                "GAME_DATE": "2024-10-22",
                "FGM": 18,
                "AST": 30,
            },
        ]
    )

def test_coverage_report_counts_games_and_teams():
    df = make_game_logs()

    report = build_coverage_report(df)

    historical = report[report["SEASON"] == "1946-47"].iloc[0]

    assert historical["RECORDS"] == 2
    assert historical["GAMES"] == 1
    assert historical["TEAMS"] == 2

def test_coverage_report_calculates_statistics_correctly():
    df = make_game_logs()

    report = build_coverage_report(df)

    historical = report[report["SEASON"] == "1946-47"].iloc[0]

    assert historical["AST_NON_NULL"] == 1
    assert historical["AST_COVERAGE_PCT"] == 50.0

    assert historical["FGM_NON_NULL"] == 2
    assert historical["FGM_COVERAGE_PCT"] == 100.0

def test_coverage_report_handles_multiple_seasons():
    df = make_game_logs()

    report = build_coverage_report(df)

    assert len(report) == 2
    assert report["SEASON"].tolist() == ["1946-47", "2024-25"]

def test_coverage_report_handles_missing_optional_columns():
    df = make_game_logs().drop(columns=["FGM", "AST"])

    report = build_coverage_report(df)

    historical = report[report["SEASON"] == "1946-47"].iloc[0]

    assert historical["FGM_NON_NULL"] == 0
    assert historical["FGM_COVERAGE_PCT"] == 0.0

def test_coverage_report_rejects_empty_data():
    df = pd.DataFrame()

    with pytest.raises(ValueError, match="empty data"):
        build_coverage_report(df)

def test_coverage_report_rejects_missing_required_columns():
    df = make_game_logs().drop(columns=["GAME_ID"])

    with pytest.raises(ValueError, match="GAME_ID"):
        build_coverage_report(df)


def test_coverage_report_converts_dates():
    df = make_game_logs()

    report = build_coverage_report(df)

    assert pd.api.types.is_datetime64_any_dtype(
        report["START_DATE"]
    )


def test_coverage_report_rejects_invalid_dates():
    df = make_game_logs()
    df.loc[0, "GAME_DATE"] = "not-a-date"

    with pytest.raises(ValueError):
        build_coverage_report(df)
