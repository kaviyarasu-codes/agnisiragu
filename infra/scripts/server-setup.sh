#!/bin/bash
# infra/scripts/server-setup.sh
# Run ONCE on a fresh Ubuntu 22.04 VPS as root
# Usage: curl -fsSL https://raw.githubusercontent.com/your-repo/main/infra/scripts/server-setup.sh | bash

set -euo pipefail

DOMAIN="api.agnisiragu.in"
APP_USER="agnisiragu"
APP_DIR="/opt/agnisiragu"

echo "=== Agnisiragu Server Setup ==="

# ── 1. System updates ─────────────────────────────────────────────────────
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git ufw fail2ban \
  ca-certificates gnupg lsb-release \
  htop ncdu unzip jq

# ── 2. Create app user ────────────────────────────────────────────────────
if ! id "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash -G sudo "$APP_USER"
  echo "Created user: $APP_USER"
fi

# ── 3. Firewall (UFW) ─────────────────────────────────────────────────────
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    comment "SSH"
ufw allow 80/tcp    comment "HTTP"
ufw allow 443/tcp   comment "HTTPS"
ufw --force enable
echo "UFW firewall configured"

# ── 4. Fail2ban (brute-force protection) ─────────────────────────────────
cat > /etc/fail2ban/jail.local << 'FAIL2BAN'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s
backend = %(syslog_backend)s
FAIL2BAN
systemctl enable fail2ban && systemctl restart fail2ban
echo "Fail2ban configured"

# ── 5. Install Docker ─────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  usermod -aG docker "$APP_USER"
  echo "Docker installed"
fi

# ── 6. App directory ──────────────────────────────────────────────────────
mkdir -p "$APP_DIR/infra"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ── 7. SSL certificate (Let's Encrypt) ───────────────────────────────────
if ! command -v certbot &>/dev/null; then
  apt-get install -y -qq certbot
fi
# First-time SSL — run after nginx is up:
# certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email admin@agnisiragu.in --agree-tos --no-eff-email

# ── 8. Swap (prevent OOM on small VPS) ───────────────────────────────────
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "2GB swap created"
fi

# ── 9. Kernel tuning for production ──────────────────────────────────────
cat >> /etc/sysctl.conf << 'SYSCTL'
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
vm.swappiness = 10
fs.file-max = 100000
SYSCTL
sysctl -p

echo ""
echo "=== Server setup complete ==="
echo "Next steps:"
echo "1. Copy your .env file to $APP_DIR/.env"
echo "2. Copy infra/ to $APP_DIR/infra/"
echo "3. Run: cd $APP_DIR && docker compose -f infra/docker-compose.prod.yml up -d"
echo "4. Get SSL: certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email admin@agnisiragu.in --agree-tos"
echo "5. Reload nginx: docker exec agnisiragu_nginx nginx -s reload"
