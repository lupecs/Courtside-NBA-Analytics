from fastapi.testclient import TestClient

from courtside.api import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_get_available_seasons():
    response = client.get("/seasons")

    assert response.status_code == 200

    data = response.json()

    assert data["count"] == 4
    assert data["seasons"] == [
        "1946-47",
        "1979-80",
        "1996-97",
        "2025-26",
    ]


def test_get_season_summaries():
    response = client.get("/seasons/summary")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 4
    assert data[0]["SEASON"] == "1946-47"
    assert data[0]["TOTAL_GAMES"] == 331
    assert data[0]["TEAM_COUNT"] == 11


def test_get_team_performance():
    response = client.get("/seasons/1946-47/teams")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 11
    assert data[0]["SEASON"] == "1946-47"
    assert "WIN_PCT" in data[0]
    assert "POINT_DIFF" in data[0]


def test_compare_seasons():
    response = client.get(
        "/seasons/compare",
        params={
            "season_a": "1946-47",
            "season_b": "2025-26",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 5
    assert data[0]["SEASON_A"] == "1946-47"
    assert data[0]["SEASON_B"] == "2025-26"
    assert "DIFFERENCE" in data[0]
    assert "PCT_CHANGE" in data[0]


def test_get_era_adjusted_team_performance():
    response = client.get("/seasons/2025-26/teams/era-adjusted")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 30
    assert data[0]["SEASON"] == "2025-26"
    assert "PTS_INDEX" in data[0]
    assert "DEF_INDEX" in data[0]
    assert "ERA_STRENGTH" in data[0]


def test_get_team_performance_invalid_season():
    response = client.get("/seasons/2030-31/teams")

    assert response.status_code == 404
    assert "season" in response.json()["detail"].lower()
