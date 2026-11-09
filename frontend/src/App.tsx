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
  compareSeasons,
  getEraAdjustedTeamPerformance,
  type AvailableSeasonsResponse,
  type SeasonSummary,
  type TeamPerformance,
  type SeasonComparison,
  type EraAdjustedTeamPerformance,
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
  const [comparisonSeasonA, setComparisonSeasonA] = useState("1946-47");
  const [comparisonSeasonB, setComparisonSeasonB] = useState("2025-26");
  const [seasonComparison, setSeasonComparison] = useState<SeasonComparison[]>(
    [],
  );
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [eraPerformance, setEraPerformance] = useState<
    EraAdjustedTeamPerformance[]
  >([]);
  const [eraLoading, setEraLoading] = useState(false);
  const [eraError, setEraError] = useState<string | null>(null);
  const [eraSeason, setEraSeason] = useState("2025-26");

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

  useEffect(() => {
    let cancelled = false;

    async function loadSeasonComparison() {
      try {
        setComparisonLoading(true);
        setComparisonError(null);

        const comparison = await compareSeasons(
          comparisonSeasonA,
          comparisonSeasonB,
        );

        if (!cancelled) {
          setSeasonComparison(comparison);
        }
      } catch (error) {
        if (!cancelled) {
          setComparisonError(
            error instanceof Error
              ? error.message
              : "Unable to load season comparison.",
          );
        }
      } finally {
        if (!cancelled) {
          setComparisonLoading(false);
        }
      }
    }

    loadSeasonComparison();

    return () => {
      cancelled = true;
    };
  }, [comparisonSeasonA, comparisonSeasonB]);

  useEffect(() => {
    let cancelled = false;

    async function loadEraPerformance() {
      try {
        setEraLoading(true);
        setEraError(null);

        const performance = await getEraAdjustedTeamPerformance(eraSeason);

        if (!cancelled) {
          setEraPerformance(performance);
        }
      } catch (error) {
        if (!cancelled) {
          setEraError(
            error instanceof Error
              ? error.message
              : "Unable to load era analysis.",
          );
        }
      } finally {
        if (!cancelled) {
          setEraLoading(false);
        }
      }
    }

    loadEraPerformance();

    return () => {
      cancelled = true;
    };
  }, [eraSeason]);

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
          ) : activePage === "Season Comparison" ? (
            <section className="panel performance-panel">
              <div className="panel-heading performance-heading">
                <div>
                  <p className="eyebrow">HISTORICAL ANALYTICS</p>
                  <h2>Season Comparison</h2>
                  <p className="page-description">
                    Compare NBA seasons across different eras.
                  </p>
                </div>

                <div className="comparison-selectors">
                  <div className="season-select-control">
                    <label htmlFor="comparison-season-a">SEASON A</label>
                    <select
                      id="comparison-season-a"
                      value={comparisonSeasonA}
                      onChange={(event) =>
                        setComparisonSeasonA(event.target.value)
                      }
                    >
                      {availableSeasons?.seasons.map((season) => (
                        <option key={season} value={season}>
                          {season}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="comparison-vs">VS</span>

                  <div className="season-select-control">
                    <label htmlFor="comparison-season-b">SEASON B</label>
                    <select
                      id="comparison-season-b"
                      value={comparisonSeasonB}
                      onChange={(event) =>
                        setComparisonSeasonB(event.target.value)
                      }
                    >
                      {availableSeasons?.seasons.map((season) => (
                        <option key={season} value={season}>
                          {season}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {comparisonLoading ? (
                <div className="empty-state">Comparing seasons...</div>
              ) : comparisonError ? (
                <div className="empty-state" role="alert">
                  Unable to compare seasons: {comparisonError}
                </div>
              ) : seasonComparison.length === 0 ? (
                <div className="empty-state">No comparison data available.</div>
              ) : (
                <div className="comparison-grid">
                  {seasonComparison.map((metric) => {
                    const isPercentage = metric.METRIC === "BEST_TEAM_WIN_PCT";
                    const valueA = isPercentage
                      ? `${(metric.VALUE_A * 100).toFixed(1)}%`
                      : metric.METRIC.includes("PTS")
                        ? metric.VALUE_A.toFixed(1)
                        : metric.VALUE_A.toLocaleString();

                    const valueB = isPercentage
                      ? `${(metric.VALUE_B * 100).toFixed(1)}%`
                      : metric.METRIC.includes("PTS")
                        ? metric.VALUE_B.toFixed(1)
                        : metric.VALUE_B.toLocaleString();

                    return (
                      <div className="comparison-card" key={metric.METRIC}>
                        <p className="eyebrow">
                          {metric.METRIC.replaceAll("_", " ")}
                        </p>

                        <div className="comparison-values">
                          <div>
                            <span>{comparisonSeasonA}</span>
                            <strong>{valueA}</strong>
                          </div>
                          <span className="comparison-divider">VS</span>
                          <div>
                            <span>{comparisonSeasonB}</span>
                            <strong>{valueB}</strong>
                          </div>
                        </div>

                        <div className="comparison-difference">
                          <span>
                            Difference: {metric.DIFFERENCE.toFixed(2)}
                          </span>
                          <strong
                            className={
                              metric.PCT_CHANGE === null
                                ? ""
                                : metric.PCT_CHANGE > 0
                                  ? "point-diff-positive"
                                  : metric.PCT_CHANGE < 0
                                    ? "point-diff-negative"
                                    : ""
                            }
                          >
                            {metric.PCT_CHANGE === null
                              ? "N/A"
                              : `${metric.PCT_CHANGE > 0 ? "+" : ""}${metric.PCT_CHANGE.toFixed(2)}%`}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ) : activePage === "Era Analysis" ? (
            <section className="panel performance-panel">
              <div className="panel-heading performance-heading">
                <div>
                  <span className="eyebrow">HISTORICAL CONTEXT</span>
                  <h2>Era Analysis</h2>
                  <p>
                    Compare team scoring and defensive performance against their
                    league's average.
                  </p>
                </div>

                <div className="season-select-control">
                  <label htmlFor="era-season">Season</label>
                  <select
                    id="era-season"
                    value={eraSeason}
                    onChange={(event) => setEraSeason(event.target.value)}
                  >
                    {availableSeasons?.seasons.map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {eraLoading && (
                <p className="status-message">Loading era analysis...</p>
              )}

              {eraError && <p className="error-message">{eraError}</p>}

              {!eraLoading && !eraError && eraPerformance.length > 0 && (
                <>
                  <div className="section-heading">
                    <div>
                      <h3>Team Era Strength</h3>
                      <p>
                        Combined scoring and defensive indices. 100 represents
                        league-average performance.
                      </p>
                    </div>
                  </div>

                  <div className="era-summary-grid">
                    {(() => {
                      const strongestTeam = [...eraPerformance].sort(
                        (a, b) => b.ERA_STRENGTH - a.ERA_STRENGTH,
                      )[0];

                      const bestOffense = [...eraPerformance].sort(
                        (a, b) => b.PTS_INDEX - a.PTS_INDEX,
                      )[0];

                      const bestDefense = [...eraPerformance].sort(
                        (a, b) => b.DEF_INDEX - a.DEF_INDEX,
                      )[0];

                      return (
                        <>
                          <div className="era-summary-card">
                            <span className="eyebrow">TOP ERA STRENGTH</span>
                            <h3>{strongestTeam.TEAM_NAME}</h3>
                            <strong>
                              {strongestTeam.ERA_STRENGTH.toFixed(2)}
                            </strong>
                            <p>Highest combined index</p>
                          </div>

                          <div className="era-summary-card">
                            <span className="eyebrow">BEST OFFENSE</span>
                            <h3>{bestOffense.TEAM_NAME}</h3>
                            <strong>{bestOffense.PTS_INDEX.toFixed(2)}</strong>
                            <p>Highest scoring index</p>
                          </div>

                          <div className="era-summary-card">
                            <span className="eyebrow">BEST DEFENSE</span>
                            <h3>{bestDefense.TEAM_NAME}</h3>
                            <strong>{bestDefense.DEF_INDEX.toFixed(2)}</strong>
                            <p>Highest defensive index</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="chart-panel era-chart-panel">
                    <div className="chart-header">
                      <div>
                        <h3>Era Strength Rankings</h3>
                        <p>
                          Scoring and defensive performance relative to league
                          average
                        </p>
                      </div>
                    </div>

                    <div className="era-chart-guide">
                      <div className="era-guide-intro">
                        <strong>Understanding the rankings</strong>
                        <p>
                          These indices compare each team's scoring and defense
                          with the average team in its own season. A score of
                          100 represents league-average performance.
                        </p>
                      </div>

                      <div className="era-guide-grid">
                        <div className="era-guide-item">
                          <span className="era-guide-label">PTS INDEX</span>
                          <strong>Offensive performance</strong>
                          <p>
                            Measures points scored per game against the league
                            average. Higher than 100 means above-average
                            scoring.
                          </p>
                        </div>

                        <div className="era-guide-item">
                          <span className="era-guide-label">DEF INDEX</span>
                          <strong>Defensive performance</strong>
                          <p>
                            Measures points allowed per game against the league
                            average. Higher than 100 means fewer points allowed.
                          </p>
                        </div>

                        <div className="era-guide-item">
                          <span className="era-guide-label">ERA STRENGTH</span>
                          <strong>Combined performance</strong>
                          <p>
                            The equally weighted average of PTS Index and DEF
                            Index. Higher values indicate stronger combined
                            performance.
                          </p>
                        </div>
                      </div>

                      <p className="era-guide-note">
                        Note: Era Strength is an experimental descriptive
                        metric, not an official NBA rating. It does not account
                        for pace, strength of schedule, or opponent quality.
                      </p>
                    </div>

                    <Plot
                      data={[
                        {
                          type: "bar",
                          orientation: "h",
                          x: [...eraPerformance]
                            .sort((a, b) => b.ERA_STRENGTH - a.ERA_STRENGTH)
                            .map((team) => team.ERA_STRENGTH - 90),
                          base: 90,
                          y: [...eraPerformance]
                            .sort((a, b) => b.ERA_STRENGTH - a.ERA_STRENGTH)
                            .map((team) => team.TEAM_NAME),
                          customdata: [...eraPerformance]
                            .sort((a, b) => b.ERA_STRENGTH - a.ERA_STRENGTH)
                            .map((team) => team.ERA_STRENGTH),
                          marker: {
                            color: [...eraPerformance]
                              .sort((a, b) => b.ERA_STRENGTH - a.ERA_STRENGTH)
                              .map((_, index) =>
                                index < 3 ? "#f0a45b" : "rgba(240,164,91,0.55)",
                              ),
                            line: {
                              width: 0,
                            },
                          },
                          width: 0.62,
                          hovertemplate:
                            "%{y}<br>Era Strength: %{customdata:.2f}<extra></extra>",
                        },
                      ]}
                      layout={{
                        autosize: true,
                        height: 680,
                        margin: { l: 165, r: 35, t: 25, b: 55 },
                        paper_bgcolor: "rgba(0,0,0,0)",
                        plot_bgcolor: "rgba(0,0,0,0)",
                        font: {
                          color: "#dce3ed",
                          family: "Arial, sans-serif",
                          size: 11,
                        },
                        bargap: 0.28,
                        xaxis: {
                          title: {
                            text: "Era Strength Index",
                            font: { size: 12, color: "#aebbd0" },
                          },
                          range: [90, 110],
                          tickvals: [90, 95, 100, 105, 110],
                          gridcolor: "rgba(255,255,255,0.07)",
                          zeroline: false,
                          fixedrange: true,
                        },
                        yaxis: {
                          autorange: "reversed",
                          automargin: true,
                          fixedrange: true,
                          tickfont: { size: 11 },
                        },
                        shapes: [
                          {
                            type: "line",
                            x0: 100,
                            x1: 100,
                            y0: 0,
                            y1: 1,
                            yref: "paper",
                            line: {
                              color: "#ffffff",
                              width: 1.5,
                              dash: "dash",
                            },
                          },
                        ],
                        annotations: [
                          {
                            x: 100,
                            y: 1.02,
                            xref: "x",
                            yref: "paper",
                            text: "LEAGUE AVERAGE",
                            showarrow: false,
                            font: {
                              size: 9,
                              color: "#f0a45b",
                            },
                          },
                        ],
                        showlegend: false,
                      }}
                      config={{
                        responsive: true,
                        displayModeBar: false,
                      }}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div className="era-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Team</th>
                          <th>PTS Index</th>
                          <th>DEF Index</th>
                          <th>Era Strength</th>
                          <th>PTS Above Avg.</th>
                          <th>PTS Prevented</th>
                        </tr>
                      </thead>

                      <tbody>
                        {eraPerformance.map((team, index) => (
                          <tr key={team.TEAM_ID}>
                            <td>{index + 1}</td>
                            <td className="team-name">{team.TEAM_NAME}</td>
                            <td>{team.PTS_INDEX.toFixed(2)}</td>
                            <td>{team.DEF_INDEX.toFixed(2)}</td>
                            <td className="era-strength-value">
                              {team.ERA_STRENGTH.toFixed(2)}
                            </td>
                            <td
                              className={
                                team.PTS_ABOVE_LEAGUE_AVG >= 0
                                  ? "point-diff-positive"
                                  : "point-diff-negative"
                              }
                            >
                              {team.PTS_ABOVE_LEAGUE_AVG > 0 ? "+" : ""}
                              {team.PTS_ABOVE_LEAGUE_AVG.toFixed(2)}
                            </td>
                            <td
                              className={
                                team.PTS_PREVENTED_ABOVE_LEAGUE_AVG >= 0
                                  ? "point-diff-positive"
                                  : "point-diff-negative"
                              }
                            >
                              {team.PTS_PREVENTED_ABOVE_LEAGUE_AVG > 0
                                ? "+"
                                : ""}
                              {team.PTS_PREVENTED_ABOVE_LEAGUE_AVG.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!eraLoading && !eraError && eraPerformance.length === 0 && (
                <p className="status-message">
                  No era analysis data is available for this season.
                </p>
              )}
            </section>
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
