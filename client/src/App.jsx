import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [health, setHealth] = useState([]);
  const [expandedRepo, setExpandedRepo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const userResponse = await fetch(
          "http://localhost:3000/api/me",
          {
            credentials: "include",
          }
        );

        if (!userResponse.ok) {
          setUser(null);
          return;
        }

        const userData = await userResponse.json();

        if (!userData.authenticated) {
          setUser(null);
          return;
        }

        setUser(userData.user);

        const [reposResponse, healthResponse] = await Promise.all([
          fetch("http://localhost:3000/api/repos", {
            credentials: "include",
          }),

          fetch("http://localhost:3000/api/repos/health", {
            credentials: "include",
          }),
        ]);

        if (reposResponse.ok) {
          const reposData = await reposResponse.json();
          setRepos(reposData.repositories);
        }

        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setHealth(healthData.repositories);
        }
      } catch (error) {
        console.error(
          "Errore durante il caricamento:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function login() {
    window.location.href =
      "http://localhost:3000/auth/github";
  }

  async function logout() {
    await fetch("http://localhost:3000/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    setRepos([]);
    setHealth([]);
    setExpandedRepo(null);
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getHealthForRepo(repoId) {
    return health.find((item) => item.id === repoId);
  }

  function getScoreLabel(score) {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Needs work";

    return "Poor";
  }

  function getHealthBreakdown(repoHealth) {
    const checks = [
      {
        key: "readme",
        label: "README",
        points: 20,
      },
      {
        key: "license",
        label: "License",
        points: 15,
      },
      {
        key: "actions",
        label: "GitHub Actions",
        points: 15,
      },
      {
        key: "recentActivity",
        label: "Recent activity",
        points: 20,
      },
      {
        key: "description",
        label: "Description",
        points: 10,
      },
      {
        key: "topics",
        label: "Topics",
        points: 10,
      },
      {
        key: "homepage",
        label: "Homepage",
        points: 5,
      },
      {
        key: "originalRepository",
        label: "Original repository",
        points: 5,
      },
    ];

    return checks.map((check) => ({
      ...check,
      passed: Boolean(
        repoHealth.checks?.[check.key]
      ),
    }));
  }

  if (loading) {
    return (
      <div className="center">
        <p>Loading DevLens...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="center">
        <div className="login-card">
          <h1>DevLens</h1>

          <p>
            Understand your GitHub profile and repositories.
          </p>

          <button onClick={login}>
            Continue with GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h2>DevLens</h2>

        <div className="header-user">
          <img
            src={user.avatar}
            alt={user.login}
          />

          <span>{user.login}</span>

          <button
            className="logout"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <main>
        <section className="profile">
          <img
            className="avatar"
            src={user.avatar}
            alt={user.login}
          />

          <div>
            <h1>{user.name || user.login}</h1>

            <a
              href={user.profileUrl}
              target="_blank"
              rel="noreferrer"
            >
              @{user.login}
            </a>

            <p>
              {user.bio ||
                "No GitHub bio available."}
            </p>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <span>Repositories</span>
            <strong>{user.publicRepos}</strong>
          </div>

          <div className="stat-card">
            <span>Followers</span>
            <strong>{user.followers}</strong>
          </div>

          <div className="stat-card">
            <span>Following</span>
            <strong>{user.following}</strong>
          </div>
        </section>

        <section className="repositories-section">
          <div className="section-title">
            <div>
              <h2>Repository Analytics</h2>

              <p>
                Health, activity and repository quality.
              </p>
            </div>

            <span className="repo-count">
              {repos.length} repositories
            </span>
          </div>

          <div className="repositories-grid">
            {repos.map((repo) => {
              const repoHealth =
                getHealthForRepo(repo.id);

              return (
                <div
                  key={repo.id}
                  className="repo-card"
                >
                  <div className="repo-header">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <h3>{repo.name}</h3>
                    </a>

                    {repo.private && (
                      <span className="badge">
                        Private
                      </span>
                    )}

                    {repo.fork && (
                      <span className="badge">
                        Fork
                      </span>
                    )}
                  </div>

                  <p className="repo-description">
                    {repo.description ||
                      "No description available."}
                  </p>

                  {repoHealth && (
                    <div className="health">

                      <button
                        className="health-summary"
                        onClick={() =>
                          setExpandedRepo(
                            expandedRepo === repo.id
                              ? null
                              : repo.id
                          )
                        }
                        aria-expanded={
                          expandedRepo === repo.id
                        }
                      >
                        <div className="health-header">
                          <span>
                            Health Score
                          </span>

                          <strong>
                            {repoHealth.score}/100
                          </strong>
                        </div>

                        <div className="health-bar">
                          <div
                            className="health-progress"
                            style={{
                              width: `${repoHealth.score}%`,
                            }}
                          />
                        </div>

                        <div className="health-bottom">
                          <span className="health-label">
                            {getScoreLabel(
                              repoHealth.score
                            )}
                          </span>

                          <span className="health-expand">
                            {expandedRepo === repo.id
                              ? "Hide details ↑"
                              : "View details ↓"}
                          </span>
                        </div>
                      </button>

                      {expandedRepo === repo.id && (
                        <div className="health-details">

                          {getHealthBreakdown(
                            repoHealth
                          ).map((check) => (
                            <div
                              key={check.key}
                              className={`health-check ${
                                check.passed
                                  ? "passed"
                                  : "failed"
                              }`}
                            >
                              <div className="health-check-name">
                                <span className="check-icon">
                                  {check.passed
                                    ? "✓"
                                    : "✕"}
                                </span>

                                <span>
                                  {check.label}
                                </span>
                              </div>

                              <span className="check-points">
                                {check.passed
                                  ? `+${check.points}`
                                  : "+0"}
                              </span>
                            </div>
                          ))}

                        </div>
                      )}

                    </div>
                  )}

                  <div className="repo-info">
                    <span>
                      {repo.language || "Unknown"}
                    </span>

                    <span>
                      ★ {repo.stars}
                    </span>

                    <span>
                      ⑂ {repo.forks}
                    </span>

                    <span>
                      Issues {repo.openIssues}
                    </span>
                  </div>

                  <div className="repo-date">
                    Updated{" "}
                    {formatDate(repo.updatedAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;