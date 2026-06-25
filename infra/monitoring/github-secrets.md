# GitHub Secrets Required for CI/CD
Go to: GitHub repo → Settings → Secrets and variables → Actions

## Repository Secrets
| Secret Name        | Value                              |
|--------------------|------------------------------------|
| SERVER_HOST        | Your VPS IP (e.g. 165.22.xxx.xxx)  |
| SERVER_USER        | agnisiragu                         |
| SERVER_SSH_KEY     | Contents of ~/.ssh/id_rsa (private)|
| SERVER_PORT        | 22                                 |

## Environment Secrets (production environment)
Go to: Settings → Environments → production → Add secret
| Secret Name        | Value                              |
|--------------------|------------------------------------|
| SENTRY_DSN         | https://xxx@sentry.io/xxx          |

## Note
GITHUB_TOKEN is automatically provided by GitHub Actions — no setup needed.
