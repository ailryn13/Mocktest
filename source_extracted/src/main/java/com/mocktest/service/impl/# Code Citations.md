# Code Citations

## License: unknown
https://github.com/Alles-im-Rudel/strapi-docker/blob/4e3ca64586ffc617a7a3dfb36e2b82dfa090a342/nginx.conf

```
Here's the complete step-by-step deployment guide for your MockTest platform on an EC2 m7i.flex.large instance with DuckDNS.

---

## EC2 Instance Specs & Storage

| Resource | Value |
|---|---|
| Instance | m7i.flex.large (2 vCPU, 8 GB RAM) |
| OS | Ubuntu 24.04 LTS (ami) |
| Storage | **25 GB gp3** (OS ~5 GB + Java/Node/PostgreSQL ~4 GB + App ~1 GB + DB growth ~10 GB + headroom ~5 GB) |

> 25 GB is comfortable for a mock-test platform. If you expect heavy file uploads or thousands of exams, go 40 GB.

---

## Step 1 — Launch the EC2 Instance

1. Go to **AWS Console > EC2 > Launch Instance**
2. **Name**: `mocktest-server`
3. **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
4. **Instance type**: `m7i.flex.large`
5. **Key pair**: Create new or select existing (download the `.pem` file)
6. **Network settings** — Create a security group with these **Inbound Rules**:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP (or 0.0.0.0/0 temporarily) |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

7. **Storage**: 25 GB, gp3
8. Click **Launch Instance**

---

## Step 2 — Connect to the Instance

```bash
# From your local machine (replace with your .pem path and public IP)
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

---

## Step 3 — Install All Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# ──── Java 21 ────
sudo apt install -y openjdk-21-jdk
java -version

# ──── Maven ────
sudo apt install -y maven
mvn -version

# ──── Node.js 22 LTS (for Next.js 16) ────
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v

# ──── PostgreSQL 16 ────
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ──── Nginx (reverse proxy) ────
sudo apt install -y nginx
sudo systemctl enable nginx

# ──── Certbot (SSL) ────
sudo apt install -y certbot python3-certbot-nginx

# ──── Git ────
sudo apt install -y git
```

---

## Step 4 — Configure PostgreSQL

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell:

```sql
CREATE USER mocktest_user WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE mocktest_db OWNER mocktest_user;
GRANT ALL PRIVILEGES ON DATABASE mocktest_db TO mocktest_user;
\q
```

---

## Step 5 — Clone & Build the Application

```bash
# Clone your repo (or scp/rsync your code to the server)
cd /home/ubuntu
git clone <YOUR_REPO_URL> mocktest
cd mocktest
```

### 5a — Build the Spring Boot Backend

Create a production properties file:

```bash
sudo mkdir -p /etc/mocktest
sudo nano /etc/mocktest/application-prod.properties
```

Paste this content:

```properties
# -------------------- Server --------------------
server.port=8080

# -------------------- PostgreSQL --------------------
spring.datasource.url=jdbc:postgresql://localhost:5432/mocktest_db
spring.datasource.username=mocktest_user
spring.datasource.password=YourStrongPassword123!
spring.datasource.driver-class-name=org.postgresql.Driver

# -------------------- JPA / Hibernate --------------------
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# -------------------- JWT --------------------
app.jwt.secret=GENERATE_A_NEW_BASE64_SECRET_HERE
app.jwt.expiration-ms=86400000

# -------------------- Malpractice --------------------
app.malpractice.max-violations=3
```

> Generate a strong JWT secret: `openssl rand -base64 64`

Build the JAR:

```bash
cd /home/ubuntu/mocktest
mvn clean package -DskipTests
```

The JAR will be at `target/mocktest-0.0.1-SNAPSHOT.jar`.

### 5b — Build the Next.js Frontend

First, update the API base URL to point to your domain:

```bash
cd /home/ubuntu/mocktest/frontend
nano src/lib/api.ts
```

Change line 1 to:

```typescript
const API_BASE = "https://yourdomain.duckdns.org/api";
```

Then build:

```bash
npm install
npm run build
```

---

## Step 6 — Create systemd Services

### 6a — Backend Service

```bash
sudo nano /etc/systemd/system/mocktest-backend.service
```

```ini
[Unit]
Description=MockTest Spring Boot Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest
ExecStart=/usr/bin/java -Xms512m -Xmx1536m -jar target/mocktest-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --spring.config.additional-location=file:/etc/mocktest/application-prod.properties
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6b — Frontend Service

```bash
sudo nano /etc/systemd/system/mocktest-frontend.service
```

```ini
[Unit]
Description=MockTest Next.js Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest/frontend
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Start both services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mocktest-backend mocktest-frontend
sudo systemctl start mocktest-backend
sudo systemctl start mocktest-frontend

# Check status
sudo systemctl status mocktest-backend
sudo systemctl status mocktest-frontend

# View logs if needed
sudo journalctl -u mocktest-backend -f
sudo journalctl -u mocktest-frontend -f
```

---

## Step 7 — Configure DuckDNS

1. Go to [https://www.duckdns.org](https://www.duckdns.org) and log in
2. Create a subdomain (e.g., `mocktest`) → you get `mocktest.duckdns.org`
3. Set the **IP** to your EC2 instance's **public IP** (Elastic IP recommended — see below)

### Allocate an Elastic IP (important — EC2 public IPs change on reboot):

1. AWS Console > EC2 > **Elastic IPs** > **Allocate Elastic IP address**
2. Select the Elastic IP > **Actions** > **Associate** > pick your instance
3. Update DuckDNS with this Elastic IP

### Auto-update DuckDNS (cron job):

```bash
mkdir -p ~/duckdns
nano ~/duckdns/duck.sh
```

Paste (replace with your values):

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=mocktest&token=YOUR_DUCKDNS_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod +x ~/duckdns/duck.sh

# Add cron job (runs every 5 minutes)
crontab -e
# Add this line:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## Step 8 — Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/mocktest
```

```nginx
server {
    listen 80;
    server_name mocktest.duckdns.org;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (everything else)
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo
```


## License: unknown
https://github.com/Alles-im-Rudel/strapi-docker/blob/4e3ca64586ffc617a7a3dfb36e2b82dfa090a342/nginx.conf

```
Here's the complete step-by-step deployment guide for your MockTest platform on an EC2 m7i.flex.large instance with DuckDNS.

---

## EC2 Instance Specs & Storage

| Resource | Value |
|---|---|
| Instance | m7i.flex.large (2 vCPU, 8 GB RAM) |
| OS | Ubuntu 24.04 LTS (ami) |
| Storage | **25 GB gp3** (OS ~5 GB + Java/Node/PostgreSQL ~4 GB + App ~1 GB + DB growth ~10 GB + headroom ~5 GB) |

> 25 GB is comfortable for a mock-test platform. If you expect heavy file uploads or thousands of exams, go 40 GB.

---

## Step 1 — Launch the EC2 Instance

1. Go to **AWS Console > EC2 > Launch Instance**
2. **Name**: `mocktest-server`
3. **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
4. **Instance type**: `m7i.flex.large`
5. **Key pair**: Create new or select existing (download the `.pem` file)
6. **Network settings** — Create a security group with these **Inbound Rules**:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP (or 0.0.0.0/0 temporarily) |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

7. **Storage**: 25 GB, gp3
8. Click **Launch Instance**

---

## Step 2 — Connect to the Instance

```bash
# From your local machine (replace with your .pem path and public IP)
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

---

## Step 3 — Install All Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# ──── Java 21 ────
sudo apt install -y openjdk-21-jdk
java -version

# ──── Maven ────
sudo apt install -y maven
mvn -version

# ──── Node.js 22 LTS (for Next.js 16) ────
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v

# ──── PostgreSQL 16 ────
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ──── Nginx (reverse proxy) ────
sudo apt install -y nginx
sudo systemctl enable nginx

# ──── Certbot (SSL) ────
sudo apt install -y certbot python3-certbot-nginx

# ──── Git ────
sudo apt install -y git
```

---

## Step 4 — Configure PostgreSQL

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell:

```sql
CREATE USER mocktest_user WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE mocktest_db OWNER mocktest_user;
GRANT ALL PRIVILEGES ON DATABASE mocktest_db TO mocktest_user;
\q
```

---

## Step 5 — Clone & Build the Application

```bash
# Clone your repo (or scp/rsync your code to the server)
cd /home/ubuntu
git clone <YOUR_REPO_URL> mocktest
cd mocktest
```

### 5a — Build the Spring Boot Backend

Create a production properties file:

```bash
sudo mkdir -p /etc/mocktest
sudo nano /etc/mocktest/application-prod.properties
```

Paste this content:

```properties
# -------------------- Server --------------------
server.port=8080

# -------------------- PostgreSQL --------------------
spring.datasource.url=jdbc:postgresql://localhost:5432/mocktest_db
spring.datasource.username=mocktest_user
spring.datasource.password=YourStrongPassword123!
spring.datasource.driver-class-name=org.postgresql.Driver

# -------------------- JPA / Hibernate --------------------
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# -------------------- JWT --------------------
app.jwt.secret=GENERATE_A_NEW_BASE64_SECRET_HERE
app.jwt.expiration-ms=86400000

# -------------------- Malpractice --------------------
app.malpractice.max-violations=3
```

> Generate a strong JWT secret: `openssl rand -base64 64`

Build the JAR:

```bash
cd /home/ubuntu/mocktest
mvn clean package -DskipTests
```

The JAR will be at `target/mocktest-0.0.1-SNAPSHOT.jar`.

### 5b — Build the Next.js Frontend

First, update the API base URL to point to your domain:

```bash
cd /home/ubuntu/mocktest/frontend
nano src/lib/api.ts
```

Change line 1 to:

```typescript
const API_BASE = "https://yourdomain.duckdns.org/api";
```

Then build:

```bash
npm install
npm run build
```

---

## Step 6 — Create systemd Services

### 6a — Backend Service

```bash
sudo nano /etc/systemd/system/mocktest-backend.service
```

```ini
[Unit]
Description=MockTest Spring Boot Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest
ExecStart=/usr/bin/java -Xms512m -Xmx1536m -jar target/mocktest-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --spring.config.additional-location=file:/etc/mocktest/application-prod.properties
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6b — Frontend Service

```bash
sudo nano /etc/systemd/system/mocktest-frontend.service
```

```ini
[Unit]
Description=MockTest Next.js Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest/frontend
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Start both services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mocktest-backend mocktest-frontend
sudo systemctl start mocktest-backend
sudo systemctl start mocktest-frontend

# Check status
sudo systemctl status mocktest-backend
sudo systemctl status mocktest-frontend

# View logs if needed
sudo journalctl -u mocktest-backend -f
sudo journalctl -u mocktest-frontend -f
```

---

## Step 7 — Configure DuckDNS

1. Go to [https://www.duckdns.org](https://www.duckdns.org) and log in
2. Create a subdomain (e.g., `mocktest`) → you get `mocktest.duckdns.org`
3. Set the **IP** to your EC2 instance's **public IP** (Elastic IP recommended — see below)

### Allocate an Elastic IP (important — EC2 public IPs change on reboot):

1. AWS Console > EC2 > **Elastic IPs** > **Allocate Elastic IP address**
2. Select the Elastic IP > **Actions** > **Associate** > pick your instance
3. Update DuckDNS with this Elastic IP

### Auto-update DuckDNS (cron job):

```bash
mkdir -p ~/duckdns
nano ~/duckdns/duck.sh
```

Paste (replace with your values):

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=mocktest&token=YOUR_DUCKDNS_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod +x ~/duckdns/duck.sh

# Add cron job (runs every 5 minutes)
crontab -e
# Add this line:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## Step 8 — Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/mocktest
```

```nginx
server {
    listen 80;
    server_name mocktest.duckdns.org;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (everything else)
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo
```


## License: unknown
https://github.com/Alles-im-Rudel/strapi-docker/blob/4e3ca64586ffc617a7a3dfb36e2b82dfa090a342/nginx.conf

```
Here's the complete step-by-step deployment guide for your MockTest platform on an EC2 m7i.flex.large instance with DuckDNS.

---

## EC2 Instance Specs & Storage

| Resource | Value |
|---|---|
| Instance | m7i.flex.large (2 vCPU, 8 GB RAM) |
| OS | Ubuntu 24.04 LTS (ami) |
| Storage | **25 GB gp3** (OS ~5 GB + Java/Node/PostgreSQL ~4 GB + App ~1 GB + DB growth ~10 GB + headroom ~5 GB) |

> 25 GB is comfortable for a mock-test platform. If you expect heavy file uploads or thousands of exams, go 40 GB.

---

## Step 1 — Launch the EC2 Instance

1. Go to **AWS Console > EC2 > Launch Instance**
2. **Name**: `mocktest-server`
3. **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
4. **Instance type**: `m7i.flex.large`
5. **Key pair**: Create new or select existing (download the `.pem` file)
6. **Network settings** — Create a security group with these **Inbound Rules**:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP (or 0.0.0.0/0 temporarily) |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

7. **Storage**: 25 GB, gp3
8. Click **Launch Instance**

---

## Step 2 — Connect to the Instance

```bash
# From your local machine (replace with your .pem path and public IP)
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

---

## Step 3 — Install All Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# ──── Java 21 ────
sudo apt install -y openjdk-21-jdk
java -version

# ──── Maven ────
sudo apt install -y maven
mvn -version

# ──── Node.js 22 LTS (for Next.js 16) ────
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v

# ──── PostgreSQL 16 ────
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ──── Nginx (reverse proxy) ────
sudo apt install -y nginx
sudo systemctl enable nginx

# ──── Certbot (SSL) ────
sudo apt install -y certbot python3-certbot-nginx

# ──── Git ────
sudo apt install -y git
```

---

## Step 4 — Configure PostgreSQL

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell:

```sql
CREATE USER mocktest_user WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE mocktest_db OWNER mocktest_user;
GRANT ALL PRIVILEGES ON DATABASE mocktest_db TO mocktest_user;
\q
```

---

## Step 5 — Clone & Build the Application

```bash
# Clone your repo (or scp/rsync your code to the server)
cd /home/ubuntu
git clone <YOUR_REPO_URL> mocktest
cd mocktest
```

### 5a — Build the Spring Boot Backend

Create a production properties file:

```bash
sudo mkdir -p /etc/mocktest
sudo nano /etc/mocktest/application-prod.properties
```

Paste this content:

```properties
# -------------------- Server --------------------
server.port=8080

# -------------------- PostgreSQL --------------------
spring.datasource.url=jdbc:postgresql://localhost:5432/mocktest_db
spring.datasource.username=mocktest_user
spring.datasource.password=YourStrongPassword123!
spring.datasource.driver-class-name=org.postgresql.Driver

# -------------------- JPA / Hibernate --------------------
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# -------------------- JWT --------------------
app.jwt.secret=GENERATE_A_NEW_BASE64_SECRET_HERE
app.jwt.expiration-ms=86400000

# -------------------- Malpractice --------------------
app.malpractice.max-violations=3
```

> Generate a strong JWT secret: `openssl rand -base64 64`

Build the JAR:

```bash
cd /home/ubuntu/mocktest
mvn clean package -DskipTests
```

The JAR will be at `target/mocktest-0.0.1-SNAPSHOT.jar`.

### 5b — Build the Next.js Frontend

First, update the API base URL to point to your domain:

```bash
cd /home/ubuntu/mocktest/frontend
nano src/lib/api.ts
```

Change line 1 to:

```typescript
const API_BASE = "https://yourdomain.duckdns.org/api";
```

Then build:

```bash
npm install
npm run build
```

---

## Step 6 — Create systemd Services

### 6a — Backend Service

```bash
sudo nano /etc/systemd/system/mocktest-backend.service
```

```ini
[Unit]
Description=MockTest Spring Boot Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest
ExecStart=/usr/bin/java -Xms512m -Xmx1536m -jar target/mocktest-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --spring.config.additional-location=file:/etc/mocktest/application-prod.properties
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6b — Frontend Service

```bash
sudo nano /etc/systemd/system/mocktest-frontend.service
```

```ini
[Unit]
Description=MockTest Next.js Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest/frontend
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Start both services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mocktest-backend mocktest-frontend
sudo systemctl start mocktest-backend
sudo systemctl start mocktest-frontend

# Check status
sudo systemctl status mocktest-backend
sudo systemctl status mocktest-frontend

# View logs if needed
sudo journalctl -u mocktest-backend -f
sudo journalctl -u mocktest-frontend -f
```

---

## Step 7 — Configure DuckDNS

1. Go to [https://www.duckdns.org](https://www.duckdns.org) and log in
2. Create a subdomain (e.g., `mocktest`) → you get `mocktest.duckdns.org`
3. Set the **IP** to your EC2 instance's **public IP** (Elastic IP recommended — see below)

### Allocate an Elastic IP (important — EC2 public IPs change on reboot):

1. AWS Console > EC2 > **Elastic IPs** > **Allocate Elastic IP address**
2. Select the Elastic IP > **Actions** > **Associate** > pick your instance
3. Update DuckDNS with this Elastic IP

### Auto-update DuckDNS (cron job):

```bash
mkdir -p ~/duckdns
nano ~/duckdns/duck.sh
```

Paste (replace with your values):

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=mocktest&token=YOUR_DUCKDNS_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod +x ~/duckdns/duck.sh

# Add cron job (runs every 5 minutes)
crontab -e
# Add this line:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## Step 8 — Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/mocktest
```

```nginx
server {
    listen 80;
    server_name mocktest.duckdns.org;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (everything else)
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo
```


## License: unknown
https://github.com/Alles-im-Rudel/strapi-docker/blob/4e3ca64586ffc617a7a3dfb36e2b82dfa090a342/nginx.conf

```
Here's the complete step-by-step deployment guide for your MockTest platform on an EC2 m7i.flex.large instance with DuckDNS.

---

## EC2 Instance Specs & Storage

| Resource | Value |
|---|---|
| Instance | m7i.flex.large (2 vCPU, 8 GB RAM) |
| OS | Ubuntu 24.04 LTS (ami) |
| Storage | **25 GB gp3** (OS ~5 GB + Java/Node/PostgreSQL ~4 GB + App ~1 GB + DB growth ~10 GB + headroom ~5 GB) |

> 25 GB is comfortable for a mock-test platform. If you expect heavy file uploads or thousands of exams, go 40 GB.

---

## Step 1 — Launch the EC2 Instance

1. Go to **AWS Console > EC2 > Launch Instance**
2. **Name**: `mocktest-server`
3. **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
4. **Instance type**: `m7i.flex.large`
5. **Key pair**: Create new or select existing (download the `.pem` file)
6. **Network settings** — Create a security group with these **Inbound Rules**:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP (or 0.0.0.0/0 temporarily) |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

7. **Storage**: 25 GB, gp3
8. Click **Launch Instance**

---

## Step 2 — Connect to the Instance

```bash
# From your local machine (replace with your .pem path and public IP)
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

---

## Step 3 — Install All Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# ──── Java 21 ────
sudo apt install -y openjdk-21-jdk
java -version

# ──── Maven ────
sudo apt install -y maven
mvn -version

# ──── Node.js 22 LTS (for Next.js 16) ────
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v

# ──── PostgreSQL 16 ────
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ──── Nginx (reverse proxy) ────
sudo apt install -y nginx
sudo systemctl enable nginx

# ──── Certbot (SSL) ────
sudo apt install -y certbot python3-certbot-nginx

# ──── Git ────
sudo apt install -y git
```

---

## Step 4 — Configure PostgreSQL

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell:

```sql
CREATE USER mocktest_user WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE mocktest_db OWNER mocktest_user;
GRANT ALL PRIVILEGES ON DATABASE mocktest_db TO mocktest_user;
\q
```

---

## Step 5 — Clone & Build the Application

```bash
# Clone your repo (or scp/rsync your code to the server)
cd /home/ubuntu
git clone <YOUR_REPO_URL> mocktest
cd mocktest
```

### 5a — Build the Spring Boot Backend

Create a production properties file:

```bash
sudo mkdir -p /etc/mocktest
sudo nano /etc/mocktest/application-prod.properties
```

Paste this content:

```properties
# -------------------- Server --------------------
server.port=8080

# -------------------- PostgreSQL --------------------
spring.datasource.url=jdbc:postgresql://localhost:5432/mocktest_db
spring.datasource.username=mocktest_user
spring.datasource.password=YourStrongPassword123!
spring.datasource.driver-class-name=org.postgresql.Driver

# -------------------- JPA / Hibernate --------------------
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# -------------------- JWT --------------------
app.jwt.secret=GENERATE_A_NEW_BASE64_SECRET_HERE
app.jwt.expiration-ms=86400000

# -------------------- Malpractice --------------------
app.malpractice.max-violations=3
```

> Generate a strong JWT secret: `openssl rand -base64 64`

Build the JAR:

```bash
cd /home/ubuntu/mocktest
mvn clean package -DskipTests
```

The JAR will be at `target/mocktest-0.0.1-SNAPSHOT.jar`.

### 5b — Build the Next.js Frontend

First, update the API base URL to point to your domain:

```bash
cd /home/ubuntu/mocktest/frontend
nano src/lib/api.ts
```

Change line 1 to:

```typescript
const API_BASE = "https://yourdomain.duckdns.org/api";
```

Then build:

```bash
npm install
npm run build
```

---

## Step 6 — Create systemd Services

### 6a — Backend Service

```bash
sudo nano /etc/systemd/system/mocktest-backend.service
```

```ini
[Unit]
Description=MockTest Spring Boot Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest
ExecStart=/usr/bin/java -Xms512m -Xmx1536m -jar target/mocktest-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --spring.config.additional-location=file:/etc/mocktest/application-prod.properties
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6b — Frontend Service

```bash
sudo nano /etc/systemd/system/mocktest-frontend.service
```

```ini
[Unit]
Description=MockTest Next.js Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest/frontend
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Start both services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mocktest-backend mocktest-frontend
sudo systemctl start mocktest-backend
sudo systemctl start mocktest-frontend

# Check status
sudo systemctl status mocktest-backend
sudo systemctl status mocktest-frontend

# View logs if needed
sudo journalctl -u mocktest-backend -f
sudo journalctl -u mocktest-frontend -f
```

---

## Step 7 — Configure DuckDNS

1. Go to [https://www.duckdns.org](https://www.duckdns.org) and log in
2. Create a subdomain (e.g., `mocktest`) → you get `mocktest.duckdns.org`
3. Set the **IP** to your EC2 instance's **public IP** (Elastic IP recommended — see below)

### Allocate an Elastic IP (important — EC2 public IPs change on reboot):

1. AWS Console > EC2 > **Elastic IPs** > **Allocate Elastic IP address**
2. Select the Elastic IP > **Actions** > **Associate** > pick your instance
3. Update DuckDNS with this Elastic IP

### Auto-update DuckDNS (cron job):

```bash
mkdir -p ~/duckdns
nano ~/duckdns/duck.sh
```

Paste (replace with your values):

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=mocktest&token=YOUR_DUCKDNS_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod +x ~/duckdns/duck.sh

# Add cron job (runs every 5 minutes)
crontab -e
# Add this line:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## Step 8 — Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/mocktest
```

```nginx
server {
    listen 80;
    server_name mocktest.duckdns.org;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (everything else)
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo
```


## License: unknown
https://github.com/Alles-im-Rudel/strapi-docker/blob/4e3ca64586ffc617a7a3dfb36e2b82dfa090a342/nginx.conf

```
Here's the complete step-by-step deployment guide for your MockTest platform on an EC2 m7i.flex.large instance with DuckDNS.

---

## EC2 Instance Specs & Storage

| Resource | Value |
|---|---|
| Instance | m7i.flex.large (2 vCPU, 8 GB RAM) |
| OS | Ubuntu 24.04 LTS (ami) |
| Storage | **25 GB gp3** (OS ~5 GB + Java/Node/PostgreSQL ~4 GB + App ~1 GB + DB growth ~10 GB + headroom ~5 GB) |

> 25 GB is comfortable for a mock-test platform. If you expect heavy file uploads or thousands of exams, go 40 GB.

---

## Step 1 — Launch the EC2 Instance

1. Go to **AWS Console > EC2 > Launch Instance**
2. **Name**: `mocktest-server`
3. **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
4. **Instance type**: `m7i.flex.large`
5. **Key pair**: Create new or select existing (download the `.pem` file)
6. **Network settings** — Create a security group with these **Inbound Rules**:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP (or 0.0.0.0/0 temporarily) |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

7. **Storage**: 25 GB, gp3
8. Click **Launch Instance**

---

## Step 2 — Connect to the Instance

```bash
# From your local machine (replace with your .pem path and public IP)
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

---

## Step 3 — Install All Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# ──── Java 21 ────
sudo apt install -y openjdk-21-jdk
java -version

# ──── Maven ────
sudo apt install -y maven
mvn -version

# ──── Node.js 22 LTS (for Next.js 16) ────
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v

# ──── PostgreSQL 16 ────
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ──── Nginx (reverse proxy) ────
sudo apt install -y nginx
sudo systemctl enable nginx

# ──── Certbot (SSL) ────
sudo apt install -y certbot python3-certbot-nginx

# ──── Git ────
sudo apt install -y git
```

---

## Step 4 — Configure PostgreSQL

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell:

```sql
CREATE USER mocktest_user WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE mocktest_db OWNER mocktest_user;
GRANT ALL PRIVILEGES ON DATABASE mocktest_db TO mocktest_user;
\q
```

---

## Step 5 — Clone & Build the Application

```bash
# Clone your repo (or scp/rsync your code to the server)
cd /home/ubuntu
git clone <YOUR_REPO_URL> mocktest
cd mocktest
```

### 5a — Build the Spring Boot Backend

Create a production properties file:

```bash
sudo mkdir -p /etc/mocktest
sudo nano /etc/mocktest/application-prod.properties
```

Paste this content:

```properties
# -------------------- Server --------------------
server.port=8080

# -------------------- PostgreSQL --------------------
spring.datasource.url=jdbc:postgresql://localhost:5432/mocktest_db
spring.datasource.username=mocktest_user
spring.datasource.password=YourStrongPassword123!
spring.datasource.driver-class-name=org.postgresql.Driver

# -------------------- JPA / Hibernate --------------------
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# -------------------- JWT --------------------
app.jwt.secret=GENERATE_A_NEW_BASE64_SECRET_HERE
app.jwt.expiration-ms=86400000

# -------------------- Malpractice --------------------
app.malpractice.max-violations=3
```

> Generate a strong JWT secret: `openssl rand -base64 64`

Build the JAR:

```bash
cd /home/ubuntu/mocktest
mvn clean package -DskipTests
```

The JAR will be at `target/mocktest-0.0.1-SNAPSHOT.jar`.

### 5b — Build the Next.js Frontend

First, update the API base URL to point to your domain:

```bash
cd /home/ubuntu/mocktest/frontend
nano src/lib/api.ts
```

Change line 1 to:

```typescript
const API_BASE = "https://yourdomain.duckdns.org/api";
```

Then build:

```bash
npm install
npm run build
```

---

## Step 6 — Create systemd Services

### 6a — Backend Service

```bash
sudo nano /etc/systemd/system/mocktest-backend.service
```

```ini
[Unit]
Description=MockTest Spring Boot Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest
ExecStart=/usr/bin/java -Xms512m -Xmx1536m -jar target/mocktest-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --spring.config.additional-location=file:/etc/mocktest/application-prod.properties
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6b — Frontend Service

```bash
sudo nano /etc/systemd/system/mocktest-frontend.service
```

```ini
[Unit]
Description=MockTest Next.js Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest/frontend
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Start both services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mocktest-backend mocktest-frontend
sudo systemctl start mocktest-backend
sudo systemctl start mocktest-frontend

# Check status
sudo systemctl status mocktest-backend
sudo systemctl status mocktest-frontend

# View logs if needed
sudo journalctl -u mocktest-backend -f
sudo journalctl -u mocktest-frontend -f
```

---

## Step 7 — Configure DuckDNS

1. Go to [https://www.duckdns.org](https://www.duckdns.org) and log in
2. Create a subdomain (e.g., `mocktest`) → you get `mocktest.duckdns.org`
3. Set the **IP** to your EC2 instance's **public IP** (Elastic IP recommended — see below)

### Allocate an Elastic IP (important — EC2 public IPs change on reboot):

1. AWS Console > EC2 > **Elastic IPs** > **Allocate Elastic IP address**
2. Select the Elastic IP > **Actions** > **Associate** > pick your instance
3. Update DuckDNS with this Elastic IP

### Auto-update DuckDNS (cron job):

```bash
mkdir -p ~/duckdns
nano ~/duckdns/duck.sh
```

Paste (replace with your values):

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=mocktest&token=YOUR_DUCKDNS_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod +x ~/duckdns/duck.sh

# Add cron job (runs every 5 minutes)
crontab -e
# Add this line:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## Step 8 — Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/mocktest
```

```nginx
server {
    listen 80;
    server_name mocktest.duckdns.org;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (everything else)
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo
```


## License: unknown
https://github.com/Alles-im-Rudel/strapi-docker/blob/4e3ca64586ffc617a7a3dfb36e2b82dfa090a342/nginx.conf

```
Here's the complete step-by-step deployment guide for your MockTest platform on an EC2 m7i.flex.large instance with DuckDNS.

---

## EC2 Instance Specs & Storage

| Resource | Value |
|---|---|
| Instance | m7i.flex.large (2 vCPU, 8 GB RAM) |
| OS | Ubuntu 24.04 LTS (ami) |
| Storage | **25 GB gp3** (OS ~5 GB + Java/Node/PostgreSQL ~4 GB + App ~1 GB + DB growth ~10 GB + headroom ~5 GB) |

> 25 GB is comfortable for a mock-test platform. If you expect heavy file uploads or thousands of exams, go 40 GB.

---

## Step 1 — Launch the EC2 Instance

1. Go to **AWS Console > EC2 > Launch Instance**
2. **Name**: `mocktest-server`
3. **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
4. **Instance type**: `m7i.flex.large`
5. **Key pair**: Create new or select existing (download the `.pem` file)
6. **Network settings** — Create a security group with these **Inbound Rules**:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP (or 0.0.0.0/0 temporarily) |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

7. **Storage**: 25 GB, gp3
8. Click **Launch Instance**

---

## Step 2 — Connect to the Instance

```bash
# From your local machine (replace with your .pem path and public IP)
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

---

## Step 3 — Install All Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# ──── Java 21 ────
sudo apt install -y openjdk-21-jdk
java -version

# ──── Maven ────
sudo apt install -y maven
mvn -version

# ──── Node.js 22 LTS (for Next.js 16) ────
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v

# ──── PostgreSQL 16 ────
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ──── Nginx (reverse proxy) ────
sudo apt install -y nginx
sudo systemctl enable nginx

# ──── Certbot (SSL) ────
sudo apt install -y certbot python3-certbot-nginx

# ──── Git ────
sudo apt install -y git
```

---

## Step 4 — Configure PostgreSQL

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell:

```sql
CREATE USER mocktest_user WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE mocktest_db OWNER mocktest_user;
GRANT ALL PRIVILEGES ON DATABASE mocktest_db TO mocktest_user;
\q
```

---

## Step 5 — Clone & Build the Application

```bash
# Clone your repo (or scp/rsync your code to the server)
cd /home/ubuntu
git clone <YOUR_REPO_URL> mocktest
cd mocktest
```

### 5a — Build the Spring Boot Backend

Create a production properties file:

```bash
sudo mkdir -p /etc/mocktest
sudo nano /etc/mocktest/application-prod.properties
```

Paste this content:

```properties
# -------------------- Server --------------------
server.port=8080

# -------------------- PostgreSQL --------------------
spring.datasource.url=jdbc:postgresql://localhost:5432/mocktest_db
spring.datasource.username=mocktest_user
spring.datasource.password=YourStrongPassword123!
spring.datasource.driver-class-name=org.postgresql.Driver

# -------------------- JPA / Hibernate --------------------
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# -------------------- JWT --------------------
app.jwt.secret=GENERATE_A_NEW_BASE64_SECRET_HERE
app.jwt.expiration-ms=86400000

# -------------------- Malpractice --------------------
app.malpractice.max-violations=3
```

> Generate a strong JWT secret: `openssl rand -base64 64`

Build the JAR:

```bash
cd /home/ubuntu/mocktest
mvn clean package -DskipTests
```

The JAR will be at `target/mocktest-0.0.1-SNAPSHOT.jar`.

### 5b — Build the Next.js Frontend

First, update the API base URL to point to your domain:

```bash
cd /home/ubuntu/mocktest/frontend
nano src/lib/api.ts
```

Change line 1 to:

```typescript
const API_BASE = "https://yourdomain.duckdns.org/api";
```

Then build:

```bash
npm install
npm run build
```

---

## Step 6 — Create systemd Services

### 6a — Backend Service

```bash
sudo nano /etc/systemd/system/mocktest-backend.service
```

```ini
[Unit]
Description=MockTest Spring Boot Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest
ExecStart=/usr/bin/java -Xms512m -Xmx1536m -jar target/mocktest-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --spring.config.additional-location=file:/etc/mocktest/application-prod.properties
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6b — Frontend Service

```bash
sudo nano /etc/systemd/system/mocktest-frontend.service
```

```ini
[Unit]
Description=MockTest Next.js Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest/frontend
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Start both services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mocktest-backend mocktest-frontend
sudo systemctl start mocktest-backend
sudo systemctl start mocktest-frontend

# Check status
sudo systemctl status mocktest-backend
sudo systemctl status mocktest-frontend

# View logs if needed
sudo journalctl -u mocktest-backend -f
sudo journalctl -u mocktest-frontend -f
```

---

## Step 7 — Configure DuckDNS

1. Go to [https://www.duckdns.org](https://www.duckdns.org) and log in
2. Create a subdomain (e.g., `mocktest`) → you get `mocktest.duckdns.org`
3. Set the **IP** to your EC2 instance's **public IP** (Elastic IP recommended — see below)

### Allocate an Elastic IP (important — EC2 public IPs change on reboot):

1. AWS Console > EC2 > **Elastic IPs** > **Allocate Elastic IP address**
2. Select the Elastic IP > **Actions** > **Associate** > pick your instance
3. Update DuckDNS with this Elastic IP

### Auto-update DuckDNS (cron job):

```bash
mkdir -p ~/duckdns
nano ~/duckdns/duck.sh
```

Paste (replace with your values):

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=mocktest&token=YOUR_DUCKDNS_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod +x ~/duckdns/duck.sh

# Add cron job (runs every 5 minutes)
crontab -e
# Add this line:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## Step 8 — Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/mocktest
```

```nginx
server {
    listen 80;
    server_name mocktest.duckdns.org;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (everything else)
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo
```


## License: unknown
https://github.com/Alles-im-Rudel/strapi-docker/blob/4e3ca64586ffc617a7a3dfb36e2b82dfa090a342/nginx.conf

```
Here's the complete step-by-step deployment guide for your MockTest platform on an EC2 m7i.flex.large instance with DuckDNS.

---

## EC2 Instance Specs & Storage

| Resource | Value |
|---|---|
| Instance | m7i.flex.large (2 vCPU, 8 GB RAM) |
| OS | Ubuntu 24.04 LTS (ami) |
| Storage | **25 GB gp3** (OS ~5 GB + Java/Node/PostgreSQL ~4 GB + App ~1 GB + DB growth ~10 GB + headroom ~5 GB) |

> 25 GB is comfortable for a mock-test platform. If you expect heavy file uploads or thousands of exams, go 40 GB.

---

## Step 1 — Launch the EC2 Instance

1. Go to **AWS Console > EC2 > Launch Instance**
2. **Name**: `mocktest-server`
3. **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
4. **Instance type**: `m7i.flex.large`
5. **Key pair**: Create new or select existing (download the `.pem` file)
6. **Network settings** — Create a security group with these **Inbound Rules**:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP (or 0.0.0.0/0 temporarily) |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

7. **Storage**: 25 GB, gp3
8. Click **Launch Instance**

---

## Step 2 — Connect to the Instance

```bash
# From your local machine (replace with your .pem path and public IP)
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

---

## Step 3 — Install All Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# ──── Java 21 ────
sudo apt install -y openjdk-21-jdk
java -version

# ──── Maven ────
sudo apt install -y maven
mvn -version

# ──── Node.js 22 LTS (for Next.js 16) ────
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v

# ──── PostgreSQL 16 ────
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ──── Nginx (reverse proxy) ────
sudo apt install -y nginx
sudo systemctl enable nginx

# ──── Certbot (SSL) ────
sudo apt install -y certbot python3-certbot-nginx

# ──── Git ────
sudo apt install -y git
```

---

## Step 4 — Configure PostgreSQL

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell:

```sql
CREATE USER mocktest_user WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE mocktest_db OWNER mocktest_user;
GRANT ALL PRIVILEGES ON DATABASE mocktest_db TO mocktest_user;
\q
```

---

## Step 5 — Clone & Build the Application

```bash
# Clone your repo (or scp/rsync your code to the server)
cd /home/ubuntu
git clone <YOUR_REPO_URL> mocktest
cd mocktest
```

### 5a — Build the Spring Boot Backend

Create a production properties file:

```bash
sudo mkdir -p /etc/mocktest
sudo nano /etc/mocktest/application-prod.properties
```

Paste this content:

```properties
# -------------------- Server --------------------
server.port=8080

# -------------------- PostgreSQL --------------------
spring.datasource.url=jdbc:postgresql://localhost:5432/mocktest_db
spring.datasource.username=mocktest_user
spring.datasource.password=YourStrongPassword123!
spring.datasource.driver-class-name=org.postgresql.Driver

# -------------------- JPA / Hibernate --------------------
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# -------------------- JWT --------------------
app.jwt.secret=GENERATE_A_NEW_BASE64_SECRET_HERE
app.jwt.expiration-ms=86400000

# -------------------- Malpractice --------------------
app.malpractice.max-violations=3
```

> Generate a strong JWT secret: `openssl rand -base64 64`

Build the JAR:

```bash
cd /home/ubuntu/mocktest
mvn clean package -DskipTests
```

The JAR will be at `target/mocktest-0.0.1-SNAPSHOT.jar`.

### 5b — Build the Next.js Frontend

First, update the API base URL to point to your domain:

```bash
cd /home/ubuntu/mocktest/frontend
nano src/lib/api.ts
```

Change line 1 to:

```typescript
const API_BASE = "https://yourdomain.duckdns.org/api";
```

Then build:

```bash
npm install
npm run build
```

---

## Step 6 — Create systemd Services

### 6a — Backend Service

```bash
sudo nano /etc/systemd/system/mocktest-backend.service
```

```ini
[Unit]
Description=MockTest Spring Boot Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest
ExecStart=/usr/bin/java -Xms512m -Xmx1536m -jar target/mocktest-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --spring.config.additional-location=file:/etc/mocktest/application-prod.properties
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6b — Frontend Service

```bash
sudo nano /etc/systemd/system/mocktest-frontend.service
```

```ini
[Unit]
Description=MockTest Next.js Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest/frontend
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Start both services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mocktest-backend mocktest-frontend
sudo systemctl start mocktest-backend
sudo systemctl start mocktest-frontend

# Check status
sudo systemctl status mocktest-backend
sudo systemctl status mocktest-frontend

# View logs if needed
sudo journalctl -u mocktest-backend -f
sudo journalctl -u mocktest-frontend -f
```

---

## Step 7 — Configure DuckDNS

1. Go to [https://www.duckdns.org](https://www.duckdns.org) and log in
2. Create a subdomain (e.g., `mocktest`) → you get `mocktest.duckdns.org`
3. Set the **IP** to your EC2 instance's **public IP** (Elastic IP recommended — see below)

### Allocate an Elastic IP (important — EC2 public IPs change on reboot):

1. AWS Console > EC2 > **Elastic IPs** > **Allocate Elastic IP address**
2. Select the Elastic IP > **Actions** > **Associate** > pick your instance
3. Update DuckDNS with this Elastic IP

### Auto-update DuckDNS (cron job):

```bash
mkdir -p ~/duckdns
nano ~/duckdns/duck.sh
```

Paste (replace with your values):

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=mocktest&token=YOUR_DUCKDNS_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod +x ~/duckdns/duck.sh

# Add cron job (runs every 5 minutes)
crontab -e
# Add this line:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## Step 8 — Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/mocktest
```

```nginx
server {
    listen 80;
    server_name mocktest.duckdns.org;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (everything else)
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo
```


## License: unknown
https://github.com/Alles-im-Rudel/strapi-docker/blob/4e3ca64586ffc617a7a3dfb36e2b82dfa090a342/nginx.conf

```
Here's the complete step-by-step deployment guide for your MockTest platform on an EC2 m7i.flex.large instance with DuckDNS.

---

## EC2 Instance Specs & Storage

| Resource | Value |
|---|---|
| Instance | m7i.flex.large (2 vCPU, 8 GB RAM) |
| OS | Ubuntu 24.04 LTS (ami) |
| Storage | **25 GB gp3** (OS ~5 GB + Java/Node/PostgreSQL ~4 GB + App ~1 GB + DB growth ~10 GB + headroom ~5 GB) |

> 25 GB is comfortable for a mock-test platform. If you expect heavy file uploads or thousands of exams, go 40 GB.

---

## Step 1 — Launch the EC2 Instance

1. Go to **AWS Console > EC2 > Launch Instance**
2. **Name**: `mocktest-server`
3. **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
4. **Instance type**: `m7i.flex.large`
5. **Key pair**: Create new or select existing (download the `.pem` file)
6. **Network settings** — Create a security group with these **Inbound Rules**:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP (or 0.0.0.0/0 temporarily) |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

7. **Storage**: 25 GB, gp3
8. Click **Launch Instance**

---

## Step 2 — Connect to the Instance

```bash
# From your local machine (replace with your .pem path and public IP)
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

---

## Step 3 — Install All Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# ──── Java 21 ────
sudo apt install -y openjdk-21-jdk
java -version

# ──── Maven ────
sudo apt install -y maven
mvn -version

# ──── Node.js 22 LTS (for Next.js 16) ────
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v

# ──── PostgreSQL 16 ────
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ──── Nginx (reverse proxy) ────
sudo apt install -y nginx
sudo systemctl enable nginx

# ──── Certbot (SSL) ────
sudo apt install -y certbot python3-certbot-nginx

# ──── Git ────
sudo apt install -y git
```

---

## Step 4 — Configure PostgreSQL

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell:

```sql
CREATE USER mocktest_user WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE mocktest_db OWNER mocktest_user;
GRANT ALL PRIVILEGES ON DATABASE mocktest_db TO mocktest_user;
\q
```

---

## Step 5 — Clone & Build the Application

```bash
# Clone your repo (or scp/rsync your code to the server)
cd /home/ubuntu
git clone <YOUR_REPO_URL> mocktest
cd mocktest
```

### 5a — Build the Spring Boot Backend

Create a production properties file:

```bash
sudo mkdir -p /etc/mocktest
sudo nano /etc/mocktest/application-prod.properties
```

Paste this content:

```properties
# -------------------- Server --------------------
server.port=8080

# -------------------- PostgreSQL --------------------
spring.datasource.url=jdbc:postgresql://localhost:5432/mocktest_db
spring.datasource.username=mocktest_user
spring.datasource.password=YourStrongPassword123!
spring.datasource.driver-class-name=org.postgresql.Driver

# -------------------- JPA / Hibernate --------------------
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# -------------------- JWT --------------------
app.jwt.secret=GENERATE_A_NEW_BASE64_SECRET_HERE
app.jwt.expiration-ms=86400000

# -------------------- Malpractice --------------------
app.malpractice.max-violations=3
```

> Generate a strong JWT secret: `openssl rand -base64 64`

Build the JAR:

```bash
cd /home/ubuntu/mocktest
mvn clean package -DskipTests
```

The JAR will be at `target/mocktest-0.0.1-SNAPSHOT.jar`.

### 5b — Build the Next.js Frontend

First, update the API base URL to point to your domain:

```bash
cd /home/ubuntu/mocktest/frontend
nano src/lib/api.ts
```

Change line 1 to:

```typescript
const API_BASE = "https://yourdomain.duckdns.org/api";
```

Then build:

```bash
npm install
npm run build
```

---

## Step 6 — Create systemd Services

### 6a — Backend Service

```bash
sudo nano /etc/systemd/system/mocktest-backend.service
```

```ini
[Unit]
Description=MockTest Spring Boot Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest
ExecStart=/usr/bin/java -Xms512m -Xmx1536m -jar target/mocktest-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --spring.config.additional-location=file:/etc/mocktest/application-prod.properties
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6b — Frontend Service

```bash
sudo nano /etc/systemd/system/mocktest-frontend.service
```

```ini
[Unit]
Description=MockTest Next.js Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest/frontend
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Start both services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mocktest-backend mocktest-frontend
sudo systemctl start mocktest-backend
sudo systemctl start mocktest-frontend

# Check status
sudo systemctl status mocktest-backend
sudo systemctl status mocktest-frontend

# View logs if needed
sudo journalctl -u mocktest-backend -f
sudo journalctl -u mocktest-frontend -f
```

---

## Step 7 — Configure DuckDNS

1. Go to [https://www.duckdns.org](https://www.duckdns.org) and log in
2. Create a subdomain (e.g., `mocktest`) → you get `mocktest.duckdns.org`
3. Set the **IP** to your EC2 instance's **public IP** (Elastic IP recommended — see below)

### Allocate an Elastic IP (important — EC2 public IPs change on reboot):

1. AWS Console > EC2 > **Elastic IPs** > **Allocate Elastic IP address**
2. Select the Elastic IP > **Actions** > **Associate** > pick your instance
3. Update DuckDNS with this Elastic IP

### Auto-update DuckDNS (cron job):

```bash
mkdir -p ~/duckdns
nano ~/duckdns/duck.sh
```

Paste (replace with your values):

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=mocktest&token=YOUR_DUCKDNS_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod +x ~/duckdns/duck.sh

# Add cron job (runs every 5 minutes)
crontab -e
# Add this line:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## Step 8 — Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/mocktest
```

```nginx
server {
    listen 80;
    server_name mocktest.duckdns.org;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (everything else)
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo
```


## License: unknown
https://github.com/Alles-im-Rudel/strapi-docker/blob/4e3ca64586ffc617a7a3dfb36e2b82dfa090a342/nginx.conf

```
Here's the complete step-by-step deployment guide for your MockTest platform on an EC2 m7i.flex.large instance with DuckDNS.

---

## EC2 Instance Specs & Storage

| Resource | Value |
|---|---|
| Instance | m7i.flex.large (2 vCPU, 8 GB RAM) |
| OS | Ubuntu 24.04 LTS (ami) |
| Storage | **25 GB gp3** (OS ~5 GB + Java/Node/PostgreSQL ~4 GB + App ~1 GB + DB growth ~10 GB + headroom ~5 GB) |

> 25 GB is comfortable for a mock-test platform. If you expect heavy file uploads or thousands of exams, go 40 GB.

---

## Step 1 — Launch the EC2 Instance

1. Go to **AWS Console > EC2 > Launch Instance**
2. **Name**: `mocktest-server`
3. **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
4. **Instance type**: `m7i.flex.large`
5. **Key pair**: Create new or select existing (download the `.pem` file)
6. **Network settings** — Create a security group with these **Inbound Rules**:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP (or 0.0.0.0/0 temporarily) |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

7. **Storage**: 25 GB, gp3
8. Click **Launch Instance**

---

## Step 2 — Connect to the Instance

```bash
# From your local machine (replace with your .pem path and public IP)
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

---

## Step 3 — Install All Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# ──── Java 21 ────
sudo apt install -y openjdk-21-jdk
java -version

# ──── Maven ────
sudo apt install -y maven
mvn -version

# ──── Node.js 22 LTS (for Next.js 16) ────
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v

# ──── PostgreSQL 16 ────
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ──── Nginx (reverse proxy) ────
sudo apt install -y nginx
sudo systemctl enable nginx

# ──── Certbot (SSL) ────
sudo apt install -y certbot python3-certbot-nginx

# ──── Git ────
sudo apt install -y git
```

---

## Step 4 — Configure PostgreSQL

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell:

```sql
CREATE USER mocktest_user WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE mocktest_db OWNER mocktest_user;
GRANT ALL PRIVILEGES ON DATABASE mocktest_db TO mocktest_user;
\q
```

---

## Step 5 — Clone & Build the Application

```bash
# Clone your repo (or scp/rsync your code to the server)
cd /home/ubuntu
git clone <YOUR_REPO_URL> mocktest
cd mocktest
```

### 5a — Build the Spring Boot Backend

Create a production properties file:

```bash
sudo mkdir -p /etc/mocktest
sudo nano /etc/mocktest/application-prod.properties
```

Paste this content:

```properties
# -------------------- Server --------------------
server.port=8080

# -------------------- PostgreSQL --------------------
spring.datasource.url=jdbc:postgresql://localhost:5432/mocktest_db
spring.datasource.username=mocktest_user
spring.datasource.password=YourStrongPassword123!
spring.datasource.driver-class-name=org.postgresql.Driver

# -------------------- JPA / Hibernate --------------------
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# -------------------- JWT --------------------
app.jwt.secret=GENERATE_A_NEW_BASE64_SECRET_HERE
app.jwt.expiration-ms=86400000

# -------------------- Malpractice --------------------
app.malpractice.max-violations=3
```

> Generate a strong JWT secret: `openssl rand -base64 64`

Build the JAR:

```bash
cd /home/ubuntu/mocktest
mvn clean package -DskipTests
```

The JAR will be at `target/mocktest-0.0.1-SNAPSHOT.jar`.

### 5b — Build the Next.js Frontend

First, update the API base URL to point to your domain:

```bash
cd /home/ubuntu/mocktest/frontend
nano src/lib/api.ts
```

Change line 1 to:

```typescript
const API_BASE = "https://yourdomain.duckdns.org/api";
```

Then build:

```bash
npm install
npm run build
```

---

## Step 6 — Create systemd Services

### 6a — Backend Service

```bash
sudo nano /etc/systemd/system/mocktest-backend.service
```

```ini
[Unit]
Description=MockTest Spring Boot Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest
ExecStart=/usr/bin/java -Xms512m -Xmx1536m -jar target/mocktest-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --spring.config.additional-location=file:/etc/mocktest/application-prod.properties
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6b — Frontend Service

```bash
sudo nano /etc/systemd/system/mocktest-frontend.service
```

```ini
[Unit]
Description=MockTest Next.js Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mocktest/frontend
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Start both services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mocktest-backend mocktest-frontend
sudo systemctl start mocktest-backend
sudo systemctl start mocktest-frontend

# Check status
sudo systemctl status mocktest-backend
sudo systemctl status mocktest-frontend

# View logs if needed
sudo journalctl -u mocktest-backend -f
sudo journalctl -u mocktest-frontend -f
```

---

## Step 7 — Configure DuckDNS

1. Go to [https://www.duckdns.org](https://www.duckdns.org) and log in
2. Create a subdomain (e.g., `mocktest`) → you get `mocktest.duckdns.org`
3. Set the **IP** to your EC2 instance's **public IP** (Elastic IP recommended — see below)

### Allocate an Elastic IP (important — EC2 public IPs change on reboot):

1. AWS Console > EC2 > **Elastic IPs** > **Allocate Elastic IP address**
2. Select the Elastic IP > **Actions** > **Associate** > pick your instance
3. Update DuckDNS with this Elastic IP

### Auto-update DuckDNS (cron job):

```bash
mkdir -p ~/duckdns
nano ~/duckdns/duck.sh
```

Paste (replace with your values):

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=mocktest&token=YOUR_DUCKDNS_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod +x ~/duckdns/duck.sh

# Add cron job (runs every 5 minutes)
crontab -e
# Add this line:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## Step 8 — Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/mocktest
```

```nginx
server {
    listen 80;
    server_name mocktest.duckdns.org;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (everything else)
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo
```

