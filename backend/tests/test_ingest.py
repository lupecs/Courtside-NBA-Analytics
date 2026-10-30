
import pandas as pd
import pytest

from courtside.ingest import (
    CORE_COLUMNS,
    OPTIONAL_STAT_COLUMNS,
    validate_game_logs,
)


def make_game_log():
    """Create a minimal valid NBA game log."""
    return pd.DataFrame(
        [
            {
                "GAME_ID": "0010000001",
                "TEAM_ID": 1610612747,
                "TEAM_NAME": "Los Angeles Lakers",
                "GAME_DATE": "2024-10-22",
                "MATCHUP": "LAL vs. MIN",
                "WL": "W",
                "PTS": 110,
            }
        ]
    )


def test_validator_preserves_missing_historical_statistics():
    df = make_game_log()

    result = validate_game_logs(df, "1946-47")

    assert len(result) == 1
    assert result.loc[0, "SEASON"] == "1946-47"
    assert result.loc[0, "PTS"] == 110

    # Missing statistics must remain missing, not become zero.
    assert pd.isna(result.loc[0, "FG3M"])
    assert pd.isna(result.loc[0, "AST"])


def test_validator_accepts_complete_modern_statistics():
    df = make_game_log()

    for column in OPTIONAL_STAT_COLUMNS:
        df[column] = 0

    result = validate_game_logs(df, "2024-25")

    assert len(result) == 1
    assert result.loc[0, "SEASON"] == "2024-25"
    assert result.loc[0, "FG3M"] == 0
    assert result.loc[0, "AST"] == 0


def test_validator_rejects_missing_core_columns():
    df = make_game_log().drop(columns=["PTS"])

    with pytest.raises(ValueError, match="PTS"):
        validate_game_logs(df, "2024-25")


def test_validator_rejects_duplicate_game_team_records():
    df = pd.concat(
        [make_game_log(), make_game_log()],
        ignore_index=True,
    )

    with pytest.raises(ValueError, match="Duplicate"):
        validate_game_logs(df, "2024-25")


def test_validator_adds_optional_columns_missing_from_source():
    df = make_game_log()

    result = validate_game_logs(df, "1946-47")

    for column in OPTIONAL_STAT_COLUMNS:
        assert column in result.columns


def test_validator_rejects_empty_data():
    df = pd.DataFrame(columns=list(CORE_COLUMNS))

    with pytest.raises(ValueError, match="No game records"):
        validate_game_logs(df, "2024-25")
