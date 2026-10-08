import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import crypto from "crypto";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Pagina di test del backend
app.get("/", (req, res) => {
  res.json({
    name: "DevLens API",
    status: "online",
  });
});

// Inizia il login con GitHub
app.get("/auth/github", (req, res) => {
  const state = crypto.randomBytes(32).toString("hex");

  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `http://localhost:${PORT}/auth/github/callback`,
    scope: "read:user user:email",
    state,
  });

  res.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
});

// GitHub ci rimanda qui dopo l'autorizzazione
app.get("/auth/github/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state || state !== req.session.oauthState) {
    return res.status(400).send("OAuth state non valido.");
  }

  delete req.session.oauthState;

  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `http://localhost:${PORT}/auth/github/callback`,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("Errore token:", tokenData);
      return res.status(400).send("Impossibile ottenere il token GitHub.");
    }

    // Il token resta sul server, non viene mandato al browser
    req.session.githubToken = tokenData.access_token;

    res.redirect(CLIENT_URL);
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante il login con GitHub.");
  }
});

// Restituisce i dati dell'utente autenticato
app.get("/api/me", async (req, res) => {
  if (!req.session.githubToken) {
    return res.status(401).json({
      authenticated: false,
    });
  }

  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${req.session.githubToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "DevLens",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Errore GitHub API",
      });
    }

    const user = await response.json();

    res.json({
      authenticated: true,
      user: {
        login: user.login,
        name: user.name,
        avatar: user.avatar_url,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        publicRepos: user.public_repos,
        profileUrl: user.html_url,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Errore interno del server",
    });
  }
});

// Repository dell'utente autenticato
app.get("/api/repos", async (req, res) => {
  if (!req.session.githubToken) {
    return res.status(401).json({
      authenticated: false,
    });
  }

  try {
    const response = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      {
        headers: {
          Authorization: `Bearer ${req.session.githubToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "DevLens",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Errore durante il recupero dei repository",
      });
    }

    const repos = await response.json();

    const formattedRepos = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      updatedAt: repo.updated_at,
      private: repo.private,
      fork: repo.fork,
    }));

    res.json({
      repositories: formattedRepos,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Errore interno del server",
    });
  }
});

// Health Score dei repository
app.get("/api/repos/health", async (req, res) => {
  if (!req.session.githubToken) {
    return res.status(401).json({
      authenticated: false,
    });
  }

  const token = req.session.githubToken;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "DevLens",
  };

  try {
    // Recuperiamo i repository dell'utente
    const reposResponse = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      {
        headers,
      }
    );

    if (!reposResponse.ok) {
      return res.status(reposResponse.status).json({
        error: "Impossibile recuperare i repository",
      });
    }

    const repos = await reposResponse.json();

    // Analizziamo ogni repository
    const analyzedRepos = await Promise.all(
      repos.map(async (repo) => {
        const owner = repo.owner.login;
        const repoName = repo.name;

        // README
        const readmeResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/readme`,
          {
            headers,
          }
        );

        const hasReadme = readmeResponse.ok;

        // LICENSE
        const licenseResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/license`,
          {
            headers,
          }
        );

        const hasLicense = licenseResponse.ok;

        // Controlliamo se esiste .github/workflows
        const workflowsResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/contents/.github/workflows`,
          {
            headers,
          }
        );

        const hasActions = workflowsResponse.ok;

        // Controlliamo quanto è recente l'ultimo push
        const pushedDate = repo.pushed_at
          ? new Date(repo.pushed_at)
          : null;

        const now = new Date();

        const daysSinceLastPush = pushedDate
          ? Math.floor(
              (now - pushedDate) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        const recentlyUpdated =
          daysSinceLastPush !== null &&
          daysSinceLastPush <= 90;

        const hasDescription =
          Boolean(repo.description?.trim());

        const hasTopics =
          Array.isArray(repo.topics) &&
          repo.topics.length > 0;

        const hasHomepage =
          Boolean(repo.homepage?.trim());

        const isOriginal = !repo.fork;

        // Calcolo score
        let score = 0;

        if (hasReadme) score += 20;
        if (hasLicense) score += 15;
        if (hasActions) score += 15;
        if (recentlyUpdated) score += 20;
        if (hasDescription) score += 10;
        if (hasTopics) score += 10;
        if (hasHomepage) score += 5;
        if (isOriginal) score += 5;

        return {
          id: repo.id,
          name: repo.name,
          url: repo.html_url,
          score,

          checks: {
            readme: hasReadme,
            license: hasLicense,
            actions: hasActions,
            recentActivity: recentlyUpdated,
            description: hasDescription,
            topics: hasTopics,
            homepage: hasHomepage,
            originalRepository: isOriginal,
          },

          details: {
            lastPush: repo.pushed_at,
            daysSinceLastPush,
            topics: repo.topics || [],
          },
        };
      })
    );

    res.json({
      repositories: analyzedRepos,
    });
  } catch (error) {
    console.error("Health analysis error:", error);

    res.status(500).json({
      error: "Errore durante l'analisi dei repository",
    });
  }
});

// Logout
app.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({
      success: true,
    });
  });
});

app.listen(PORT, () => {
  console.log(`DevLens API avviata su http://localhost:${PORT}`);
});