#!/usr/bin/env bash
# ===========================================================
#  deploy-aws.sh – One-command deploy / update on EC2
#
#  Run ONCE after first SSH into a fresh Amazon Linux 2023 /
#  Ubuntu 22.04 EC2 instance, then re-run any time you push
#  new code to update the running containers.
#
#  Usage (from your LOCAL machine):
#    scp -i your-key.pem deploy-aws.sh ec2-user@<EC2-IP>:~/
#    ssh -i your-key.pem ec2-user@<EC2-IP> "bash deploy-aws.sh"
#
#  Or, on the EC2 instance directly after git-cloning:
#    bash deploy-aws.sh
# ===========================================================

set -euo pipefail

#####################################################################
# ── CONFIG – edit these before first run ─────────────────────────
REPO_URL="https://github.com/YOUR_USERNAME/YOUR_REPO.git"
APP_DIR="$HOME/mocktest"
BRANCH="main"
#####################################################################

COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
ENV_FILE="$APP_DIR/.env.production"

# ── Colour helpers ───────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Step 1 – Install Docker & Docker Compose (idempotent) ───
install_docker() {
    if command -v docker &>/dev/null; then
        info "Docker already installed ($(docker --version))"
        return
    fi
    info "Installing Docker..."
    # Works for Amazon Linux 2023 and Ubuntu 22.04
    if [ -f /etc/os-release ]; then
        source /etc/os-release
        case "$ID" in
            amzn)
                sudo dnf install -y docker
                sudo systemctl enable --now docker
                sudo usermod -aG docker "$USER"
                ;;
            ubuntu|debian)
                sudo apt-get update -q
                sudo apt-get install -y ca-certificates curl gnupg lsb-release
                curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
                    | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
                echo "deb [arch=$(dpkg --print-architecture) \
                    signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
                    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
                    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
                sudo apt-get update -q
                sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
                sudo systemctl enable --now docker
                sudo usermod -aG docker "$USER"
                ;;
            *)
                error "Unsupported OS: $ID. Install Docker manually."
                ;;
        esac
    fi
    # Docker Compose V2 plugin check
    if ! docker compose version &>/dev/null; then
        info "Installing Docker Compose plugin..."
        COMPOSE_VERSION="v2.24.5"
        sudo mkdir -p /usr/local/lib/docker/cli-plugins
        sudo curl -SL \
            "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-$(uname -m)" \
            -o /usr/local/lib/docker/cli-plugins/docker-compose
        sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    fi
    info "Docker Compose: $(docker compose version)"
}

# ── Step 2 – Clone or pull latest code ──────────────────────
sync_repo() {
    if [ -d "$APP_DIR/.git" ]; then
        info "Pulling latest code from $BRANCH..."
        git -C "$APP_DIR" fetch origin
        git -C "$APP_DIR" reset --hard "origin/$BRANCH"
    else
        info "Cloning repository..."
        git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
    fi
}

# ── Step 3 – Ensure .env.production exists ──────────────────
check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$APP_DIR/.env.production.example" ]; then
            warn ".env.production not found – copying from example."
            warn "Edit $ENV_FILE and re-run this script."
            cp "$APP_DIR/.env.production.example" "$ENV_FILE"
            exit 0
        else
            error ".env.production not found. Create it before deploying."
        fi
    fi
    info "Environment file found: $ENV_FILE"
}

# ── Step 4 – Deploy / update containers ─────────────────────
deploy() {
    info "Building and starting containers..."
    cd "$APP_DIR"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        up -d --build --remove-orphans

    info "Removing dangling images to free disk space..."
    docker image prune -f

    info "Running containers:"
    docker compose -f "$COMPOSE_FILE" ps
}

# ── Step 5 – Open firewall ports (security group reminder) ──
firewall_reminder() {
    echo ""
    warn "╔══════════════════════════════════════════════════════════╗"
    warn "║  REMINDER: AWS Security Group inbound rules required:   ║"
    warn "║    Port 22  (SSH)     – your IP only                    ║"
    warn "║    Port 80  (HTTP)    – 0.0.0.0/0                       ║"
    warn "║    Port 443 (HTTPS)   – 0.0.0.0/0  (when TLS is set up) ║"
    warn "╚══════════════════════════════════════════════════════════╝"
}

# ── Main ─────────────────────────────────────────────────────
info "=== MockTest AWS Deployment Script ==="
install_docker
sync_repo
check_env
deploy
firewall_reminder
info "=== Deployment complete! ==="
