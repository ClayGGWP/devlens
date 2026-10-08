\# DevLens



DevLens is a GitHub repository analytics dashboard that helps developers understand the health, activity and quality of their repositories.



It connects securely to GitHub using OAuth and analyzes repository metadata through the GitHub REST API.



> DevLens is currently under active development.



\---



\## Features



\### GitHub Authentication



Sign in securely using GitHub OAuth.



DevLens never exposes the GitHub access token to the frontend. Authentication tokens are stored only in the backend session.



\### Developer Profile



View your GitHub profile information, including:



\- Username

\- Avatar

\- Public repositories

\- Followers

\- Following

\- Profile link



\### Repository Analytics



DevLens automatically retrieves your GitHub repositories and displays:



\- Repository name

\- Description

\- Primary language

\- Stars

\- Forks

\- Open issues

\- Last update

\- Repository visibility

\- Fork status



\### Repository Health Score



Each repository receives a health score from `0` to `100`.



The current scoring system evaluates:



| Check | Points |

|---|---:|

| README | 20 |

| License | 15 |

| GitHub Actions | 15 |

| Recent activity | 20 |

| Description | 10 |

| Topics | 10 |

| Homepage | 5 |

| Original repository | 5 |

| \*\*Total\*\* | \*\*100\*\* |



The score is a DevLens heuristic and is not an official GitHub metric.



\### Health Breakdown



The Health Score can be expanded to show exactly how the score was calculated.



Example:



```text

✓ README                +20

✕ License                +0

✓ GitHub Actions        +15

✓ Recent activity       +20

✓ Description           +10

✕ Topics                 +0

✕ Homepage               +0

✓ Original repository    +5

```



This makes it easier to understand what could be improved in a repository.



\---



\## Tech Stack



\### Frontend



\- React

\- Vite

\- JavaScript

\- CSS



\### Backend



\- Node.js

\- Express

\- express-session

\- CORS

\- dotenv



\### GitHub Integration



\- GitHub OAuth

\- GitHub REST API



\---



\## Architecture



```text

User

&#x20;│

&#x20;▼

React Frontend

localhost:5173

&#x20;│

&#x20;│ HTTP requests

&#x20;▼

Node.js / Express Backend

localhost:3000

&#x20;│

&#x20;├── GitHub OAuth

&#x20;│

&#x20;└── GitHub REST API

&#x20;       │

&#x20;       ▼

&#x20;     GitHub

```



The GitHub access token remains on the backend and is never sent directly to the browser.



\---



\## Project Structure



```text

github-devlens/

│

├── client/

│   ├── public/

│   ├── src/

│   │   ├── App.jsx

│   │   ├── App.css

│   │   ├── index.css

│   │   └── main.jsx

│   │

│   └── package.json

│

├── server/

│   ├── server.js

│   ├── package.json

│   └── .gitignore

│

├── .gitignore

└── README.md

```



\---



\## Running DevLens Locally



\### Requirements



You need:



\- Node.js

\- npm

\- Git

\- A GitHub account

\- A GitHub OAuth App



\### 1. Clone the repository



```bash

git clone https://github.com/ClayGGWP/devlens.git

cd devlens

```



\### 2. Install the frontend



```bash

cd client

npm install

```



\### 3. Install the backend



```bash

cd ../server

npm install

```



\### 4. Configure environment variables



Create:



```text

server/.env

```



Add:



```env

PORT=3000

CLIENT\_URL=http://localhost:5173



GITHUB\_CLIENT\_ID=your\_client\_id

GITHUB\_CLIENT\_SECRET=your\_client\_secret



SESSION\_SECRET=your\_random\_session\_secret

```



Never commit `.env` or your GitHub Client Secret.



\### 5. Configure the GitHub OAuth App



For local development:



```text

Homepage URL

http://localhost:5173



Authorization callback URL

http://localhost:3000/auth/github/callback

```



\### 6. Start the backend



From the `server` directory:



```bash

npm run dev

```



Backend:



```text

http://localhost:3000

```



\### 7. Start the frontend



From another terminal:



```bash

cd client

npm run dev

```



Frontend:



```text

http://localhost:5173

```



\---



\## API Routes



DevLens currently provides:



```text

GET  /auth/github

GET  /auth/github/callback



GET  /api/me

GET  /api/repos

GET  /api/repos/health



POST /auth/logout

```



\---



\## Security



DevLens follows a backend-first OAuth approach.



\- GitHub Client Secrets are never exposed to the frontend.

\- GitHub access tokens remain in the server session.

\- `.env` files are excluded from Git.

\- OAuth requests use a random `state` value to protect the authentication flow.



The current development session store is memory-based and is intended for local development only.



\---



\## Roadmap



Planned features include:



\- Repository improvement recommendations

\- Language statistics

\- Contribution analytics

\- Repository activity charts

\- Better Health Score metrics

\- Persistent sessions

\- Production deployment

\- Responsive dashboard improvements



\---



\## Developer Program



DevLens is an integration built using the GitHub API.



The project is developed as part of participation in the GitHub Developer Program.



\---



\## Author



\*\*Shimei\*\*



GitHub: \[@ClayGGWP](https://github.com/ClayGGWP)



\---



\## Status



DevLens is currently in active development.



More features and repository analytics are coming soon.

