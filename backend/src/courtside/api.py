"""FastAPI application for the Courtside analytics platform."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from courtside.analytics import (
    calculate_era_adjusted_team_performance,
    calculate_season_summary,
    calculate_team_performance,
    compare_seasons,
)
from courtside.historical import load_historical_data

app = FastAPI(
    title="Courtside NBA Analytics API",
    description="Historical NBA analytics and team performance.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load historical NBA data when the API starts.
nba_data = load_historical_data()


@app.get("/seasons")
def get_available_seasons():
    """Return all seasons available in the historical dataset."""
    seasons = sorted(nba_data["SEASON"].unique())

    return {
        "count": len(seasons),
        "seasons": seasons,
    }


@app.get("/health")
def health_check():
    """Check whether the API is running."""
    return {"status": "healthy"}


@app.get("/seasons/summary")
def get_season_summaries():
    """Return league-wide summaries for all available seasons."""
    summary = calculate_season_summary(nba_data)

    return summary.to_dict(orient="records")


@app.get("/seasons/{season}/teams")
def get_team_performance(season: str):
    """Return team performance statistics for a selected season."""
    try:
        performance = calculate_team_performance(nba_data, season)
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return performance.to_dict(orient="records")


@app.get("/seasons/compare")
def get_season_comparison(season_a: str, season_b: str):
    """Compare league-wide statistics between two NBA seasons."""
    try:
        comparison = compare_seasons(nba_data, season_a, season_b)
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return comparison.to_dict(orient="records")


@app.get("/seasons/{season}/teams/era-adjusted")
def get_era_adjusted_team_performance(season: str):
    """Return era-adjusted team performance for a selected season."""
    try:
        performance = calculate_era_adjusted_team_performance(nba_data, season)
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return performance.to_dict(orient="records")
