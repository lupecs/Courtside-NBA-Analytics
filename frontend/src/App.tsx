import { useEffect, useState } from "react";

import Plot from "react-plotly.js";

import {
  Activity,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Menu,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import {
  getAvailableSeasons,
  getSeasonSummaries,
  getTeamPerformance,
  type AvailableSeasonsResponse,
  type SeasonSummary,
  type TeamPerformance,
} from "./api";

import "./App.css";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Season Explorer", image: "/icons/season-ticket.png" },
  { label: "Season Comparison", image: "/icons/season-comparison.png" },
  { label: "Era Analysis", image: "/icons/era-analysis.png" },
];

function BasketballMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="19" fill="#f0a45b" />
      <g fill="none" stroke="#5d321b" strokeWidth="2.2" strokeLinecap="round">
        <path d="M5 24h38" />
        <path d="M24 5v38" />
        <path d="M24 5C14 14 14 34 24 43" />
        <path d="M24 5c10 9 10 29 0 38" />
      </g>
    </svg>
  );
}

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [availableSeasons, setAvailableSeasons] =
    useState<AvailableSeasonsResponse | null>(null);
  const [seasonSummaries, setSeasonSummaries] = useState<
    SeasonSummary[] | null
  >(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState("2025-26");
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setDashboardLoading(true);
        setDashboardError(null);

        const [seasons, summaries] = await Promise.all([
          getAvailableSeasons(),
          getSeasonSummaries(),
        ]);

        if (!cancelled) {
          setAvailableSeasons(seasons);
          setSeasonSummaries(summaries);
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardError(
            error instanceof Error
              ? error.message
              : "Unable to load dashboard data.",
          );
        }
      } finally {
        if (!cancelled) {
          setDashboardLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTeamPerformance() {
      try {
        setTeamsLoading(true);
        setTeamsError(null);

        const teams = await getTeamPerformance(selectedSeason);

        if (!cancelled) {
          setTeamPerformance(teams);
        }
      } catch (error) {
        if (!cancelled) {
          setTeamsError(
            error instanceof Error
              ? error.message
              : "Unable to load team performance.",
          );
        }
      } finally {
        if (!cancelled) {
          setTeamsLoading(false);
        }
      }
    }

    loadTeamPerformance();

    return () => {
      cancelled = true;
    };
  }, [selectedSeason]);

  const quickLinks = [
    {
      label: "Season Explorer",
      description: "Explore team performance",
      image: "/icons/season-ticket.png",
    },
    {
      label: "Season Comparison",
      description: "Discover historical differences",
      image: "/icons/season-comparison.png",
    },
    {
      label: "Era Analysis",
      description: "Compare performance by era",
      image: "/icons/era-analysis.png",
    },
  ];

  const totalGames =
    seasonSummaries?.reduce((total, season) => total + season.TOTAL_GAMES, 0) ??
    0;

  const largestSeasonTeamCount = Math.max(
    ...(seasonSummaries?.map((season) => season.TEAM_COUNT) ?? [0]),
  );

  const latestSeason =
    availableSeasons?.seasons[availableSeasons.seasons.length - 1] ?? "—";

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <BasketballMark />
          </div>

          <div className="brand-name">
            <span>COURTSIDE</span>
            <small>NBA ANALYTICS</small>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">WORKSPACE</p>

          <nav className="sidebar-nav">
            {navigation.map(({ label, icon: Icon, image }) => (
              <button
                key={label}
                className={`nav-item ${activePage === label ? "active" : ""}`}
                onClick={() => {
                  setActivePage(label);
                  setSidebarOpen(false);
                }}
              >
                {image ? (
                  <img
                    className={`nav-custom-icon ${
                      label === "Season Explorer" || label === "Era Analysis"
                        ? "nav-custom-icon-bold"
                        : ""
                    }`}
                    src={image}
                    alt=""
                  />
                ) : (
                  Icon && <Icon size={19} />
                )}

                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="status-indicator" />
            <span>Analytics workspace</span>
          </div>

          <p>SEE THE GAME BEYOND THE SCOREBOARD</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            <span>Courtside</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <button className="icon-button" aria-label="Search">
              <Search size={19} />
            </button>

            <button className="icon-button" aria-label="Notifications">
              <Bell size={19} />
            </button>

            <div className="topbar-divider" />

            <div className="season-control">
              <span>DATA RANGE</span>
              <button disabled>
                Historical seasons
                <ChevronDown size={15} />
              </button>
            </div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">NBA HISTORICAL ANALYTICS</p>
              <h1>{activePage}</h1>
              <p className="page-description">
                Explore the numbers, trends, and stories behind the game.
              </p>
            </div>

            <div className="heading-mark">
              <Activity size={25} />
            </div>
          </section>

          {activePage === "Overview" ? (
            <>
              <section className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">SEASONS AVAILABLE</span>
                  <strong>
                    {dashboardLoading ? "—" : (availableSeasons?.count ?? "—")}
                  </strong>
                  <small>Historical seasons loaded</small>
                </div>

                <div className="stat-card">
                  <span className="stat-label">GAMES ANALYZED</span>
                  <strong>
                    {dashboardLoading
                      ? "—"
                      : totalGames.toLocaleString("en-US")}
                  </strong>
                  <small>Across available seasons</small>
                </div>

                <div className="stat-card">
                  <span className="stat-label">TEAMS IN LARGEST SEASON</span>
                  <strong>
                    {dashboardLoading ? "—" : largestSeasonTeamCount || "—"}
                  </strong>
                  <small>Teams in a single season</small>
                </div>

                <div className="stat-card">
                  <span className="stat-label">LATEST SEASON</span>
                  <strong>{dashboardLoading ? "—" : latestSeason}</strong>
                  <small>Most recent season available</small>
                </div>
              </section>

              {dashboardError && (
                <p className="page-description" role="alert">
                  Unable to load dashboard data: {dashboardError}
                </p>
              )}

              <section className="dashboard-grid">
                <div className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">LEAGUE-WIDE TRENDS</p>
                      <h2>Scoring Through the Eras</h2>
                    </div>

                    <span className="panel-tag">HISTORICAL</span>
                  </div>

                  <div className="chart-visualization">
                    {dashboardLoading ? (
                      <div className="chart-placeholder">
                        <Activity size={34} />
                        <strong>Loading scoring data...</strong>
                      </div>
                    ) : seasonSummaries && seasonSummaries.length > 0 ? (
                      <Plot
                        data={[
                          {
                            type: "scatter",
                            mode: "lines+markers",
                            x: seasonSummaries.map((season) => season.SEASON),
                            y: seasonSummaries.map(
                              (season) => season.AVG_TEAM_PTS,
                            ),
                            name: "Average team points",
                            line: {
                              color: "#f0a45b",
                              width: 3,
                            },
                            marker: {
                              size: 9,
                            },
                          },
                        ]}
                        layout={{
                          autosize: true,
                          paper_bgcolor: "rgba(0,0,0,0)",
                          plot_bgcolor: "rgba(0,0,0,0)",
                          font: {
                            color: "#dce3ed",
                            family: "DM Sans, sans-serif",
                          },
                          margin: {
                            l: 55,
                            r: 20,
                            t: 20,
                            b: 55,
                          },
                          xaxis: {
                            title: { text: "NBA Season" },
                            gridcolor: "rgba(255,255,255,0.08)",
                            zeroline: false,
                          },
                          yaxis: {
                            title: { text: "Average Points per Team" },
                            gridcolor: "rgba(255,255,255,0.08)",
                            zeroline: false,
                          },
                          showlegend: false,
                        }}
                        config={{
                          responsive: true,
                          displayModeBar: false,
                        }}
                        useResizeHandler
                        style={{
                          width: "100%",
                          height: "360px",
                        }}
                      />
                    ) : (
                      <div className="chart-placeholder">
                        <strong>No scoring data available.</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel highlights-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">EXPLORE THE DATA</p>
                      <h2>Quick Access</h2>
                    </div>
                  </div>

                  {quickLinks.map((link) => (
                    <button
                      key={link.label}
                      className="quick-link"
                      onClick={() => setActivePage(link.label)}
                    >
                      <div className="quick-link-icon">
                        <img
                          className={`quick-custom-icon ${
                            link.label === "Season Explorer" ||
                            link.label === "Era Analysis"
                              ? "quick-custom-icon-bold"
                              : ""
                          }`}
                          src={link.image}
                          alt=""
                        />
                      </div>

                      <div>
                        <strong>{link.label}</strong>
                        <span>{link.description}</span>
                      </div>

                      <ChevronDown size={17} className="quick-arrow" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel performance-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">TEAM ANALYTICS</p>
                    <h2>Season Performance</h2>
                  </div>

                  <span className="panel-tag">COMING FROM API</span>
                </div>

                <div className="empty-state">
                  Team standings and performance metrics will appear here once
                  the API is connected.
                </div>
              </section>
            </>
          ) : activePage === "Season Explorer" ? (
            <section className="panel performance-panel">
              <div className="panel-heading performance-heading">
                <div>
                  <p className="eyebrow">TEAM ANALYTICS</p>
                  <h2>Season Standings</h2>
                  <p className="page-description">
                    Explore team performance throughout NBA history.
                  </p>
                </div>

                <div className="season-select-control">
                  <label htmlFor="season-select">SELECT SEASON</label>
                  <select
                    id="season-select"
                    value={selectedSeason}
                    onChange={(event) => setSelectedSeason(event.target.value)}
                    disabled={dashboardLoading || !availableSeasons}
                  >
                    {availableSeasons?.seasons.map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="standings-summary">
                <span>
                  <strong>{selectedSeason}</strong> Regular Season
                </span>
                <span>
                  {teamsLoading
                    ? "Loading standings..."
                    : `${teamPerformance.length} teams`}
                </span>
              </div>

              {teamsLoading ? (
                <div className="empty-state">Loading team performance...</div>
              ) : teamsError ? (
                <div className="empty-state" role="alert">
                  Unable to load standings: {teamsError}
                </div>
              ) : teamPerformance.length === 0 ? (
                <div className="empty-state">
                  No team performance data available for this season.
                </div>
              ) : (
                <div className="standings-table-wrapper">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>TEAM</th>
                        <th>GP</th>
                        <th>W</th>
                        <th>L</th>
                        <th>WIN %</th>
                        <th>PTS/G</th>
                        <th>PA/G</th>
                        <th>+/-</th>
                      </tr>
                    </thead>

                    <tbody>
                      {teamPerformance.map((team, index) => (
                        <tr key={team.TEAM_ID}>
                          <td className="standings-rank">{index + 1}</td>
                          <td className="standings-team">{team.TEAM_NAME}</td>
                          <td>{team.GP}</td>
                          <td>{team.W}</td>
                          <td>{team.L}</td>
                          <td>{(team.WIN_PCT * 100).toFixed(1)}%</td>
                          <td>{team.PTS.toFixed(1)}</td>
                          <td>{team.PTS_ALLOWED.toFixed(1)}</td>
                          <td
                            className={
                              team.POINT_DIFF > 0
                                ? "point-diff-positive"
                                : team.POINT_DIFF < 0
                                  ? "point-diff-negative"
                                  : ""
                            }
                          >
                            {team.POINT_DIFF > 0 ? "+" : ""}
                            {team.POINT_DIFF.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : (
            <section className="panel section-placeholder">
              <div className="placeholder-icon">
                <Activity size={30} />
              </div>

              <h2>{activePage}</h2>

              <p>
                This workspace is being built. It will use the historical NBA
                data served by the Courtside API.
              </p>
            </section>
          )}

          <footer className="page-footer">
            <span>COURTSIDE NBA ANALYTICS</span>
            <span>SEE THE GAME BEYOND THE SCOREBOARD.</span>

            <div className="asset-credits">
              Icons by{" "}
              <a
                href="https://www.flaticon.com/"
                target="_blank"
                rel="noreferrer"
              >
                Flaticon
              </a>
              {" · "}
              Background photo by{" "}
              <a
                href="https://unsplash.com/photos/people-sitting-on-chairs-watching-game-nu8RYv2ugA8"
                target="_blank"
                rel="noreferrer"
              >
                Logan Weaver / Unsplash
              </a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
