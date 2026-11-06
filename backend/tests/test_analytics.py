
"""Tests for NBA analytics functions."""

import pandas as pd
import pytest

from courtside.analytics import (
    calculate_era_adjusted_team_performance,
    calculate_season_summary,
    calculate_team_performance,
    compare_seasons,
)


@pytest.fixture
def sample_game_logs():
    return pd.DataFrame(
        [
            {
                "SEASON": "2025-26",
                "GAME_ID": "001",
                "TEAM_ID": 1,
                "TEAM_NAME": "Team A",
                "WL": "W",
                "PTS": 110,
            },
            {
                "SEASON": "2025-26",
                "GAME_ID": "001",
                "TEAM_ID": 2,
                "TEAM_NAME": "Team B",
                "WL": "L",
                "PTS": 100,
            },
            {
                "SEASON": "2025-26",
                "GAME_ID": "002",
                "TEAM_ID": 1,
                "TEAM_NAME": "Team A",
                "WL": "L",
                "PTS": 95,
            },
            {
                "SEASON": "2025-26",
                "GAME_ID": "002",
                "TEAM_ID": 2,
                "TEAM_NAME": "Team B",
                "WL": "W",
                "PTS": 105,
            },
        ]
    )


def test_calculates_team_performance(sample_game_logs):
    result = calculate_team_performance(sample_game_logs, "2025-26")

    team_a = result.loc[result["TEAM_ID"] == 1].iloc[0]
    team_b = result.loc[result["TEAM_ID"] == 2].iloc[0]

    assert team_a["GP"] == 2
    assert team_a["W"] == 1
    assert team_a["L"] == 1
    assert team_a["WIN_PCT"] == 0.5
    assert team_a["PTS"] == 102.5
    assert team_a["PTS_ALLOWED"] == 102.5
    assert team_a["POINT_DIFF"] == 0

    assert team_b["GP"] == 2
    assert team_b["W"] == 1
    assert team_b["L"] == 1
    assert team_b["PTS"] == 102.5


def test_ranks_teams_by_win_percentage(sample_game_logs):
    result = calculate_team_performance(sample_game_logs, "2025-26")

    assert result.iloc[0]["TEAM_ID"] == 1
    assert result.iloc[1]["TEAM_ID"] == 2


def test_rejects_unknown_season(sample_game_logs):
    with pytest.raises(ValueError, match="No game data"):
        calculate_team_performance(sample_game_logs, "1946-47")


def test_rejects_missing_required_columns(sample_game_logs):
    incomplete = sample_game_logs.drop(columns=["PTS"])

    with pytest.raises(ValueError, match="Missing required columns"):
        calculate_team_performance(incomplete, "2025-26")


def test_rejects_duplicate_game_team_records(sample_game_logs):
    duplicate = pd.concat(
        [sample_game_logs, sample_game_logs.iloc[[0]]],
        ignore_index=True,
    )

    with pytest.raises(ValueError, match="Duplicate"):
        calculate_team_performance(duplicate, "2025-26")


def test_rejects_games_with_incorrect_team_count(sample_game_logs):
    incomplete = sample_game_logs.drop(index=1)

    with pytest.raises(ValueError, match="exactly two teams"):
        calculate_team_performance(incomplete, "2025-26")


def test_calculates_season_summary(sample_game_logs):
    summary = calculate_season_summary(sample_game_logs)

    assert len(summary) == 1

    season = summary.iloc[0]

    assert season["SEASON"] == "2025-26"
    assert season["TOTAL_GAMES"] == 2
    assert season["TEAM_COUNT"] == 2
    assert season["AVG_GAME_PTS"] == 205.0
    assert season["AVG_TEAM_PTS"] == 102.5
    assert season["HIGHEST_SCORING_TEAM"] == "Team A"
    assert season["BEST_TEAM"] == "Team A"


def test_rejects_missing_season_column(sample_game_logs):
    df = sample_game_logs.drop(columns=["SEASON"])

    with pytest.raises(ValueError, match="Missing required column"):
        calculate_season_summary(df)

    with pytest.raises(ValueError, match="Missing required column"):
        calculate_season_summary(df)

def test_compares_two_seasons(sample_game_logs):
    df = pd.concat(
        [
            sample_game_logs,
            sample_game_logs.assign(SEASON="2024-25"),
        ],
        ignore_index=True,
    )

    comparison = compare_seasons(df, "2024-25", "2025-26")

    assert len(comparison) == 5

    team_points = comparison.loc[
        comparison["METRIC"] == "AVG_TEAM_PTS"
    ].iloc[0]

    assert team_points["VALUE_A"] == 102.5
    assert team_points["VALUE_B"] == 102.5
    assert team_points["DIFFERENCE"] == 0
    assert team_points["PCT_CHANGE"] == 0


def test_rejects_comparing_same_season(sample_game_logs):
    with pytest.raises(ValueError, match="different seasons"):
        compare_seasons(sample_game_logs, "2025-26", "2025-26")


def test_rejects_unknown_comparison_season(sample_game_logs):
    with pytest.raises(ValueError, match="No game data available"):
        compare_seasons(sample_game_logs, "2025-26", "2030-31")

def test_calculates_era_adjusted_team_performance(sample_game_logs):
    performance = calculate_era_adjusted_team_performance(
        sample_game_logs,
        "2025-26",
    )

    assert "PTS_INDEX" in performance.columns
    assert "LEAGUE_AVG_PTS" in performance.columns
    assert "PTS_ABOVE_LEAGUE_AVG" in performance.columns

    assert performance["PTS_INDEX"].eq(100).all()
    assert performance["LEAGUE_AVG_PTS"].eq(102.5).all()
    assert performance["PTS_ABOVE_LEAGUE_AVG"].eq(0).all()


def test_rejects_unknown_era_adjusted_season(sample_game_logs):
    with pytest.raises(ValueError, match="No game data available"):
        calculate_era_adjusted_team_performance(
            sample_game_logs,
            "2030-31",
        )

def test_calculates_era_adjusted_defensive_performance(
    sample_game_logs,
):
    performance = calculate_era_adjusted_team_performance(
        sample_game_logs,
        "2025-26",
    )

    assert "DEF_INDEX" in performance.columns
    assert "LEAGUE_AVG_PTS_ALLOWED" in performance.columns
    assert "PTS_PREVENTED_ABOVE_LEAGUE_AVG" in performance.columns

    assert performance["DEF_INDEX"].eq(100).all()
    assert performance["LEAGUE_AVG_PTS_ALLOWED"].eq(102.5).all()
    assert performance["PTS_PREVENTED_ABOVE_LEAGUE_AVG"].eq(0).all()

    assert "ERA_STRENGTH" in performance.columns
    assert performance["ERA_STRENGTH"].eq(100).all()