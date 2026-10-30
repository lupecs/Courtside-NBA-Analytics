
"""Test NBA API coverage across different historical eras."""

import time

from nba_api.stats.endpoints import leaguegamelog

TEST_SEASONS = [
    "1946-47",
    "1949-50",
    "1979-80",
    "1996-97",
    "2024-25",
]


def probe_season(season: str) -> None:
    print(f"\n{'=' * 50}")
    print(f"Testing season: {season}")
    print("=" * 50)

    try:
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

        print(f"Records returned: {len(df):,}")
        print(f"Games returned: {df['GAME_ID'].nunique():,}")
        print(f"Teams returned: {df['TEAM_ID'].nunique():,}")

        if not df.empty:
            print(
                f"Date range: {df['GAME_DATE'].min()} "
                f"to {df['GAME_DATE'].max()}"
            )

        print("\nAvailable columns:")
        print(", ".join(df.columns))

        print("\nMissing values:")
        print(df.isna().sum().to_string())

    except Exception as error:
        print(f"API request failed: {error}")


def main() -> None:
    for season in TEST_SEASONS:
        probe_season(season)
        time.sleep(3)


if __name__ == "__main__":
    main()
