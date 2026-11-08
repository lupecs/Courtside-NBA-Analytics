import { useState } from "react";
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
                  <strong>—</strong>
                  <small>Loading historical coverage</small>
                </div>

                <div className="stat-card">
                  <span className="stat-label">GAMES ANALYZED</span>
                  <strong>—</strong>
                  <small>Across available seasons</small>
                </div>

                <div className="stat-card">
                  <span className="stat-label">TEAMS TRACKED</span>
                  <strong>—</strong>
                  <small>Historical NBA teams</small>
                </div>

                <div className="stat-card">
                  <span className="stat-label">DATA COVERAGE</span>
                  <strong>—</strong>
                  <small>Based on available records</small>
                </div>
              </section>

              <section className="dashboard-grid">
                <div className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">LEAGUE-WIDE TRENDS</p>
                      <h2>Scoring Through the Eras</h2>
                    </div>

                    <span className="panel-tag">HISTORICAL</span>
                  </div>

                  <div className="chart-placeholder">
                    <Activity size={34} />
                    <strong>Scoring trends will appear here</strong>
                    <span>
                      Connect the historical analytics API to load real data.
                    </span>
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
