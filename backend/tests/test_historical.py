"""Tests for historical season management."""

import pandas as pd
import pytest

from courtside.historical import (
    generate_seasons,
    get_season_file_path,
)


def test_generate_seasons():
    seasons = generate_seasons(2020, 2024)

    assert seasons == [
        "2020-21",
        "2021-22",
        "2022-23",
        "2023-24",
        "2024-25",
    ]

def test_generate_seasons_includes_first_nba_season():
    seasons = generate_seasons(1946, 1948)

    assert seasons == ["1946-47", "1947-48", "1948-49"]

def test_generate_seasons_rejects_year_before_nba():
    with pytest.raises(ValueError):
        generate_seasons(1945, 1950)

def test_generate_seasons_rejects_invalid_range():
    with pytest.raises(ValueError):
        generate_seasons(2025, 2020)

def test_get_season_file_path():
    path = get_season_file_path("2024-25")

    assert path.name == "nba_team_game_logs_2024-25.csv"

def test_is_season_downloaded_returns_true_for_existing_file(tmp_path, monkeypatch):
    from courtside import historical

    monkeypatch.setattr(historical, "RAW_DATA_DIR", tmp_path)

    file_path = tmp_path / "nba_team_game_logs_2024-25.csv"
    file_path.write_text(
    "GAME_ID,TEAM_ID,GAME_DATE,PTS,SEASON\n"
    "001,100,2024-10-22,110,2024-25",
    encoding="utf-8",
)

    assert historical.is_season_downloaded("2024-25") is True

def test_is_season_downloaded_returns_false_for_missing_file(tmp_path, monkeypatch):
    from courtside import historical

    monkeypatch.setattr(historical, "RAW_DATA_DIR", tmp_path)

    file_path = tmp_path / "nba_team_game_logs_2024-25.csv"
    file_path.write_text("", encoding="utf-8")

    assert historical.is_season_downloaded("2024-25") is False

def test_is_season_downloaded_returns_false_for_empty_file(tmp_path, monkeypatch):
    from courtside import historical

    monkeypatch.setattr(historical, "RAW_DATA_DIR", tmp_path)

    file_path = tmp_path / "nba_team_game_logs_2024-25.csv"
    file_path.write_text("", encoding="utf-8")

    assert historical.is_season_downloaded("2024-25") is False


def test_collect_historical_data_downloads_season(monkeypatch):
    from courtside import historical

    saved = []

    monkeypatch.setattr(
        historical, "is_season_downloaded", lambda season: False
    )
    monkeypatch.setattr(
        historical, "fetch_season", lambda season: f"data-{season}"
    )
    monkeypatch.setattr(
        historical,
        "save_raw_data",
        lambda df, season: saved.append(season),
    )

    results = historical.collect_historical_data(
        2020, 2020, retry_delay=0
    )

    assert results["downloaded"] == ["2020-21"]
    assert results["skipped"] == []
    assert results["failed"] == []
    assert saved == ["2020-21"]


def test_collect_historical_data_skips_existing_season(monkeypatch):
    from courtside import historical

    monkeypatch.setattr(
        historical, "is_season_downloaded", lambda season: True
    )

    def unexpected_fetch(season):
        raise AssertionError("Existing season should not be fetched.")

    monkeypatch.setattr(historical, "fetch_season", unexpected_fetch)

    results = historical.collect_historical_data(2020, 2020)

    assert results["downloaded"] == []
    assert results["skipped"] == ["2020-21"]
    assert results["failed"] == []


def test_collect_historical_data_retries_failed_request(monkeypatch):
    from courtside import historical

    attempts = []
    waits = []

    monkeypatch.setattr(
        historical, "is_season_downloaded", lambda season: False
    )

    def mock_fetch(season):
        attempts.append(season)

        if len(attempts) < 3:
            raise RuntimeError("Temporary API error")

        return f"data-{season}"

    monkeypatch.setattr(historical, "fetch_season", mock_fetch)
    monkeypatch.setattr(
        historical, "save_raw_data", lambda df, season: None
    )
    monkeypatch.setattr(
        historical.time, "sleep", lambda seconds: waits.append(seconds)
    )

    results = historical.collect_historical_data(
        2020, 2020, max_attempts=3, retry_delay=5
    )

    assert len(attempts) == 3
    assert waits == [5, 10]
    assert results["downloaded"] == ["2020-21"]
    assert results["failed"] == []


def test_collect_historical_data_continues_after_failure(monkeypatch):
    from courtside import historical

    monkeypatch.setattr(
        historical, "is_season_downloaded", lambda season: False
    )

    def mock_fetch(season):
        if season == "2020-21":
            raise RuntimeError("API unavailable")

        return f"data-{season}"

    monkeypatch.setattr(historical, "fetch_season", mock_fetch)
    monkeypatch.setattr(
        historical, "save_raw_data", lambda df, season: None
    )
    monkeypatch.setattr(historical.time, "sleep", lambda seconds: None)

    results = historical.collect_historical_data(
        2020, 2021, max_attempts=2, retry_delay=0
    )

    assert results["failed"][0]["season"] == "2020-21"
    assert results["downloaded"] == ["2021-22"]


def test_collect_historical_data_rejects_invalid_retry_settings():
    from courtside import historical

    with pytest.raises(ValueError):
        historical.collect_historical_data(
            2020, 2020, max_attempts=0
        )

    with pytest.raises(ValueError):
        historical.collect_historical_data(
            2020, 2020, retry_delay=-1
        )


def test_load_historical_data_combines_seasons(tmp_path, monkeypatch):
    from courtside import historical

    monkeypatch.setattr(historical, "RAW_DATA_DIR", tmp_path)

    first_season = pd.DataFrame({
        "SEASON": ["2020-21"],
        "GAME_ID": ["001"],
        "TEAM_ID": [100],
        "GAME_DATE": ["2021-01-01"],
        "PTS": [110],
    })

    second_season = pd.DataFrame({
        "SEASON": ["2021-22"],
        "GAME_ID": ["002"],
        "TEAM_ID": [200],
        "GAME_DATE": ["2022-01-01"],
        "PTS": [105],
    })

    first_season.to_csv(
        tmp_path / "nba_team_game_logs_2020-21.csv",
        index=False,
    )
    second_season.to_csv(
        tmp_path / "nba_team_game_logs_2021-22.csv",
        index=False,
    )

    result = historical.load_historical_data()

    assert len(result) == 2
    assert result["SEASON"].nunique() == 2
    assert pd.api.types.is_datetime64_any_dtype(result["GAME_DATE"])


def test_load_historical_data_rejects_missing_files(tmp_path, monkeypatch):
    from courtside import historical

    monkeypatch.setattr(historical, "RAW_DATA_DIR", tmp_path)

    with pytest.raises(FileNotFoundError):
        historical.load_historical_data()
