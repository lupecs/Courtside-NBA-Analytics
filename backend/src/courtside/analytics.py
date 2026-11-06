
"""Analytics functions for historical NBA game data."""

import pandas as pd


def calculate_team_performance(
    df: pd.DataFrame,
    season: str,
) -> pd.DataFrame:
    """Calculate team performance metrics for a selected season."""

    required_columns = {
        "SEASON",
        "GAME_ID",
        "TEAM_ID",
        "TEAM_NAME",
        "WL",
        "PTS",
    }

    missing_columns = required_columns.difference(df.columns)

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {sorted(missing_columns)}"
        )

    season_df = df.loc[df["SEASON"] == season].copy()

    if season_df.empty:
        raise ValueError(f"No game data available for season {season}.")

    if season_df[list(required_columns)].isna().any().any():
        raise ValueError("Required game data contains missing values.")

    if season_df.duplicated(["GAME_ID", "TEAM_ID"]).any():
        raise ValueError("Duplicate game/team records found.")

    if not season_df["WL"].isin(["W", "L"]).all():
        raise ValueError("Unexpected game outcome values.")

    # Each game must contain exactly two teams.
    games_per_game = season_df.groupby("GAME_ID")["TEAM_ID"].nunique()

    if not games_per_game.eq(2).all():
        raise ValueError("Each game must contain exactly two teams.")

    # Calculate points allowed using the opposing team's score.
    points_by_game = season_df[
        ["GAME_ID", "TEAM_ID", "PTS"]
    ].copy()

    game_totals = points_by_game.groupby("GAME_ID")["PTS"].transform(
        "sum"
    )

    points_by_game["PTS_ALLOWED"] = (
        game_totals - points_by_game["PTS"]
    )

    season_df = season_df.merge(
        points_by_game[["GAME_ID", "TEAM_ID", "PTS_ALLOWED"]],
        on=["GAME_ID", "TEAM_ID"],
        how="left",
        validate="one_to_one",
    )

    performance = (
        season_df.groupby(["TEAM_ID", "TEAM_NAME"], as_index=False)
        .agg(
            GP=("GAME_ID", "nunique"),
            W=("WL", lambda values: (values == "W").sum()),
            L=("WL", lambda values: (values == "L").sum()),
            PTS=("PTS", "mean"),
            PTS_ALLOWED=("PTS_ALLOWED", "mean"),
        )
    )

    performance["WIN_PCT"] = performance["W"] / performance["GP"]
    performance["POINT_DIFF"] = (
        performance["PTS"] - performance["PTS_ALLOWED"]
    )

    performance["PTS"] = performance["PTS"].round(2)
    performance["PTS_ALLOWED"] = performance["PTS_ALLOWED"].round(2)
    performance["WIN_PCT"] = performance["WIN_PCT"].round(3)
    performance["POINT_DIFF"] = performance["POINT_DIFF"].round(2)

    performance["SEASON"] = season

    return performance.sort_values(
        ["WIN_PCT", "POINT_DIFF"],
        ascending=[False, False],
    ).reset_index(drop=True)


def calculate_season_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate league-wide summary metrics for every available season."""

    if "SEASON" not in df.columns:
        raise ValueError("Missing required column: SEASON")

    if df["SEASON"].isna().any():
        raise ValueError("Season data contains missing values.")

    summaries = []

    for season in sorted(df["SEASON"].unique()):
        season_df = df.loc[df["SEASON"] == season].copy()

        team_performance = calculate_team_performance(df, season)

        # Calculate the average combined score across games.
        game_scores = season_df.groupby("GAME_ID")["PTS"].sum()

        # Identify the highest-scoring team by average points per game.
        highest_scoring_team = team_performance.loc[
            team_performance["PTS"].idxmax()
        ]

        # Team performance is already sorted by win percentage
        # and point differential.
        best_team = team_performance.iloc[0]

        summaries.append(
            {
                "SEASON": season,
                "TOTAL_GAMES": season_df["GAME_ID"].nunique(),
                "TEAM_COUNT": season_df["TEAM_ID"].nunique(),
                "AVG_GAME_PTS": round(game_scores.mean(), 2),
                "AVG_TEAM_PTS": round(season_df["PTS"].mean(), 2),
                "HIGHEST_SCORING_TEAM": highest_scoring_team["TEAM_NAME"],
                "BEST_TEAM": best_team["TEAM_NAME"],
                "BEST_TEAM_WIN_PCT": best_team["WIN_PCT"],
                "BEST_TEAM_POINT_DIFF": best_team["POINT_DIFF"],
            }
        )

    return pd.DataFrame(summaries)

def compare_seasons(
    df: pd.DataFrame,
    season_a: str,
    season_b: str,
) -> pd.DataFrame:
    """Compare league-wide metrics between two NBA seasons."""

    if season_a == season_b:
        raise ValueError("Please select two different seasons.")

    summaries = calculate_season_summary(df)

    available_seasons = summaries["SEASON"].tolist()

    for season in [season_a, season_b]:
        if season not in available_seasons:
            raise ValueError(
                f"No game data available for season {season}."
            )

    summary_a = summaries.loc[
        summaries["SEASON"] == season_a
    ].iloc[0]

    summary_b = summaries.loc[
        summaries["SEASON"] == season_b
    ].iloc[0]

    metrics = [
        "TOTAL_GAMES",
        "TEAM_COUNT",
        "AVG_GAME_PTS",
        "AVG_TEAM_PTS",
        "BEST_TEAM_WIN_PCT",
    ]

    comparisons = []

    for metric in metrics:
        value_a = summary_a[metric]
        value_b = summary_b[metric]

        difference = value_b - value_a

        pct_change = (
            (difference / value_a) * 100
            if value_a != 0
            else pd.NA
        )

        comparisons.append(
            {
                "METRIC": metric,
                "SEASON_A": season_a,
                "VALUE_A": value_a,
                "SEASON_B": season_b,
                "VALUE_B": value_b,
                "DIFFERENCE": round(difference, 2),
                "PCT_CHANGE": (
                    round(pct_change, 2)
                    if pd.notna(pct_change)
                    else pd.NA
                ),
            }
        )

    return pd.DataFrame(comparisons)

def calculate_era_adjusted_team_performance(
    df: pd.DataFrame,
    season: str,
) -> pd.DataFrame:
    """Calculate team scoring relative to the league average for an era."""

    performance = calculate_team_performance(df, season)

    league_average = df.loc[
    df["SEASON"] == season,
    "PTS",
    ].mean()

    performance["LEAGUE_AVG_PTS"] = round(league_average, 2)

    # Scoring Index = (Team PPG / League Average PPG) * 100
    performance["PTS_INDEX"] = (
        performance["PTS"] / league_average * 100
    ).round(2)

    performance["PTS_ABOVE_LEAGUE_AVG"] = (
        performance["PTS"] - league_average
    ).round(2)

    league_average_allowed = performance["PTS_ALLOWED"].mean()

    performance["LEAGUE_AVG_PTS_ALLOWED"] = round(
        league_average_allowed,
        2,
    )

    # Defensive Index = (League Average PTS Allowed / Team PTS Allowed) * 100
    performance["DEF_INDEX"] = (
        league_average_allowed / performance["PTS_ALLOWED"] * 100
    ).round(2)

    performance["PTS_PREVENTED_ABOVE_LEAGUE_AVG"] = (
        league_average_allowed - performance["PTS_ALLOWED"]
    ).round(2)

    # ERA STRENGTH INDEX = (PTS_INDEX + DEF_INDEX) / 2
    performance["ERA_STRENGTH"] = (
        performance["PTS_INDEX"] + performance["DEF_INDEX"]
    ).div(2).round(2)

    return performance

