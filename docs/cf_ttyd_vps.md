# Cloudflare Tunnel + ttyd VPS Secure Terminal Access Solution

## Overview

This document introduces how to establish secure VPS terminal access using Cloudflare Tunnel and ttyd, with Google OAuth authentication, achieving zero port exposure for secure remote access. It also provides an alternative deployment solution using Docker + Nginx.

### Technology Stack

- **ttyd**: Provides web terminal interface
- **cloudflared**: Establishes Cloudflare Tunnel
- **Cloudflare Zero Trust**: Authentication and access control
- **Google OAuth**: Authentication provider
- **Docker + Nginx**: Optional containerized deployment solution
- **Supervisor**: Process management and auto-restart

### Core Features

- ✅ Zero port exposure, all services only bind to localhost
- ✅ Google OAuth authentication
- ✅ Low-privilege user execution, enhanced security
- ✅ Multi-device access support (computer, phone, tablet)
- ✅ HTTPS encrypted transmission
- ✅ Containerized deployment support
- ✅ Process auto-restart and monitoring

## Architecture Design

### System Architecture Diagram

```
┌─────────────────────────────────┐
│    User Device (Browser)        │
└─────────────┬───────────────────┘
              │ HTTPS + OAuth Authentication
              ▼
┌─────────────────────────────────┐
│   Cloudflare Access (Zero Trust) │
└─────────────┬───────────────────┘
              │ Tunnel Proxy
              ▼
┌─────────────────────────────────┐
│   cloudflared tunnel            │
│   → localhost:7681              │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│   ttyd (Low-privilege User)     │
│   Bind 127.0.0.1:7681          │
└─────────────────────────────────┘
```

### Docker + Nginx Architecture (Alternative Solution)

```
┌─────────────────────────────────┐
│    User Device (Browser)        │
└─────────────┬───────────────────┘
              │ HTTPS + OAuth Authentication
              ▼
┌─────────────────────────────────┐
│   Cloudflare Access (Zero Trust) │
└─────────────┬───────────────────┘
              │ Tunnel Proxy
              ▼
┌─────────────────────────────────┐
│   cloudflared tunnel            │
│   → localhost:8080              │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│   Docker Nginx (Auth Proxy)     │
│   → Unix Socket                 │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│   ttyd (Unix Socket Mode)       │
│   Bind /tmp/ttyd.sock           │
└─────────────────────────────────┘
```

### Security Mechanisms

1. **Network Layer Security**: All services only bind to localhost, no external port exposure
2. **Authentication**: Dual authentication through Cloudflare Access + Google OAuth
3. **Permission Control**: Use dedicated low-privilege user to run ttyd service
4. **Transport Encryption**: Full HTTPS encrypted communication
5. **Basic Authentication**: Optional HTTP Basic Auth as additional protection
6. **Process Monitoring**: Auto-restart and health checks

## Deployment Guide

### Environment Requirements

- Operating System: Ubuntu 22.04 LTS or newer
- System Permissions: sudo privileges
- Network Requirements: Access to GitHub and Cloudflare
- Domain: Domain already added to Cloudflare
- Docker (Optional): For containerized deployment

## Solution One: Traditional Deployment Method

### Step One: Install ttyd

#### Method 1: Compile Installation

```bash
# Install dependencies
sudo apt update && sudo apt install -y \
    cmake \
    g++ \
    libjson-c-dev \
    libwebsockets-dev \
    git \
    build-essential

# Download source code
git clone https://github.com/tsl0922/ttyd.git
cd ttyd

# Compile and install
mkdir build && cd build
cmake ..
make && sudo make install
```

#### Method 2: Direct Binary Download

According to [Su Yang's blog recommendation](https://soulteary.com/2023/03/12/stable-web-terminal-services-using-docker-nginx-and-ttyd.html), you can directly download pre-compiled binary files:

```bash
# Download latest version of ttyd (choose based on system architecture)
sudo curl -sL -o /usr/local/bin/ttyd "https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64"
sudo chmod +x /usr/local/bin/ttyd
```

#### Verify Installation

```bash
ttyd --version
```

### Step Two: Create System User

To enhance security, create a dedicated low-privilege user to run ttyd:

```bash
sudo adduser --disabled-password --gecos "" webuser
```

### Step Three: Configure ttyd System Service

#### Create Service File

```bash
sudo nano /etc/systemd/system/ttyd.service
```

#### Service Configuration Content

```ini
[Unit]
Description=ttyd terminal on localhost
After=network.target

[Service]
ExecStart=/usr/local/bin/ttyd -p 7681 -i 127.0.0.1 -u webuser bash
Restart=always
User=webuser
WorkingDirectory=/home/webuser

[Install]
WantedBy=multi-user.target
```

#### Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable ttyd
sudo systemctl start ttyd
```

#### Check Service Status

```bash
sudo systemctl status ttyd
```

### Step Four: Install and Configure cloudflared

#### Install cloudflared

```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

#### Login to Cloudflare

```bash
cloudflared tunnel login
```

#### Create Tunnel

```bash
cloudflared tunnel create vps-terminal
```

#### Configure Tunnel

```bash
# Create tunnel configuration file
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

Configuration content:

```yaml
tunnel: your-tunnel-id
credentials-file: /home/your-user/.cloudflared/your-tunnel-id.json

ingress:
  - hostname: terminal.yourdomain.com
    service: http://127.0.0.1:7681
  - service: http_status:404
```

#### Set DNS Record

```bash
cloudflared tunnel route dns vps-terminal terminal.yourdomain.com
```

#### Install as System Service

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### Step Five: Configure Cloudflare Access

#### Create Access Application

1. Login to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Go to **Access** → **Applications** → **Add Application**
3. Select **Self-hosted**
4. Configure application:
   - **Name**: `VPS Terminal`
   - **Domain**: `terminal.yourdomain.com`
   - **Session Duration**: `24h`

#### Create Access Policy

1. Go to **Access** → **Applications** → **VPS Terminal** → **Policies**
2. Click **Add Policy**
3. Configure policy:
   - **Policy Name**: `Google OAuth Users`
   - **Decision**: `Allow`
   - **Rules**: 
     - Include: `Email` → `your-email@domain.com`
     - Or use **Email Domain** → `yourdomain.com`

#### Configure Identity Provider

1. Go to **Access** → **Authentication** → **Login Methods**
2. Enable **Google** provider
3. Configure Google OAuth:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
   - **Redirect URL**: `https://your-team-domain.cloudflareaccess.com/cdn-cgi/access/callback`

## Solution Two: Docker + Nginx Deployment

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: ttyd-nginx
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./htpasswd:/etc/nginx/htpasswd:ro
    depends_on:
      - ttyd
    restart: unless-stopped

  ttyd:
    image: tsl0922/ttyd:latest
    container_name: ttyd-terminal
    command: ttyd -p 7681 -c username:password bash
    volumes:
      - /home:/home:ro
    restart: unless-stopped
    expose:
      - "7681"
```

### Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream ttyd {
        server ttyd:7681;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            auth_basic "Restricted Access";
            auth_basic_user_file /etc/nginx/htpasswd;
            
            proxy_pass http://ttyd;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

### Create Password File

```bash
# Install htpasswd utility
sudo apt install apache2-utils

# Create password file
htpasswd -c htpasswd username
```

### Start Services

```bash
docker-compose up -d
```

## Security Enhancements

### 1. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Only allow SSH (adjust port as needed)
sudo ufw allow ssh

# No need to open ttyd port as it's only accessible via tunnel
```

### 2. System Hardening

```bash
# Disable root login
sudo passwd -l root

# Configure SSH security
sudo nano /etc/ssh/sshd_config
```

SSH configuration:

```bash
# Disable root login
PermitRootLogin no

# Use key-based authentication only
PasswordAuthentication no
PubkeyAuthentication yes

# Change default port (optional)
Port 2222

# Restrict users
AllowUsers your-username
```

### 3. Process Monitoring

```bash
# Create monitoring script
sudo nano /usr/local/bin/monitor-ttyd.sh
```

Monitoring script content:

```bash
#!/bin/bash

# Check if ttyd is running
if ! systemctl is-active --quiet ttyd; then
    echo "$(date): ttyd service is down, restarting..." >> /var/log/ttyd-monitor.log
    systemctl restart ttyd
fi

# Check if cloudflared is running
if ! systemctl is-active --quiet cloudflared; then
    echo "$(date): cloudflared service is down, restarting..." >> /var/log/ttyd-monitor.log
    systemctl restart cloudflared
fi
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/monitor-ttyd.sh

# Add to crontab
sudo crontab -e

# Check every 5 minutes
*/5 * * * * /usr/local/bin/monitor-ttyd.sh
```

## Usage Instructions

### Access Terminal

1. Open browser and go to: `https://terminal.yourdomain.com`
2. Complete Google OAuth authentication
3. Enter terminal interface

### Terminal Features

- **Full Terminal**: Complete bash shell access
- **File Transfer**: Support for file upload/download
- **Session Persistence**: Maintains session state
- **Mobile Support**: Responsive design for mobile devices

### Common Commands

```bash
# Check system status
htop
df -h
free -h

# Check service status
systemctl status ttyd
systemctl status cloudflared

# View logs
journalctl -u ttyd -f
journalctl -u cloudflared -f
```

## Troubleshooting

### Common Issues

1. **ttyd Service Won't Start**
   ```bash
   # Check service status
   sudo systemctl status ttyd
   
   # Check logs
   sudo journalctl -u ttyd -f
   
   # Check port binding
   sudo netstat -tlnp | grep 7681
   ```

2. **Cloudflare Tunnel Connection Issues**
   ```bash
   # Check tunnel status
   cloudflared tunnel info vps-terminal
   
   # Check tunnel logs
   cloudflared tunnel logs vps-terminal
   
   # Test tunnel connection
   cloudflared tunnel test vps-terminal
   ```

3. **Access Authentication Problems**
   - Verify Google OAuth configuration
   - Check domain settings in Cloudflare Access
   - Ensure email is in the allowed list

4. **Performance Issues**
   ```bash
   # Check system resources
   top
   iostat
   
   # Check network connectivity
   ping 1.1.1.1
   traceroute 1.1.1.1
   ```

### Debug Mode

```bash
# Enable debug logging for ttyd
sudo systemctl stop ttyd
sudo /usr/local/bin/ttyd -p 7681 -i 127.0.0.1 -u webuser -d 1 bash

# Enable debug logging for cloudflared
cloudflared tunnel --loglevel debug run vps-terminal
```

## Performance Optimization

### 1. Resource Limits

```bash
# Set memory limits for ttyd
sudo nano /etc/systemd/system/ttyd.service
```

Add to service file:

```ini
[Service]
MemoryMax=512M
CPUQuota=50%
```

### 2. Connection Pooling

```bash
# Configure ttyd with connection limits
ExecStart=/usr/local/bin/ttyd -p 7681 -i 127.0.0.1 -u webuser -c 10 bash
```

### 3. Monitoring and Metrics

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Create performance monitoring script
sudo nano /usr/local/bin/performance-monitor.sh
```

## Alternative Solutions

### 1. Using noVNC + VNC

```bash
# Install VNC server
sudo apt install tightvncserver

# Install noVNC
git clone https://github.com/novnc/noVNC.git
cd noVNC
./utils/launch.sh --vnc localhost:5901 --listen 8080
```

### 2. Using Guacamole

```dockerfile
# Docker setup for Apache Guacamole
version: '3.8'
services:
  guacamole:
    image: guacamole/guacamole:latest
    ports:
      - "8080:8080"
    environment:
      GUACD_HOSTNAME: guacd
    depends_on:
      - guacd
      - postgres
```

### 3. Using Shellngn

```bash
# Install Shellngn
curl -sSL https://shellngn.com/install.sh | bash

# Configure Shellngn
shellngn config set auth.method oauth
shellngn config set oauth.provider google
```

## Best Practices

### 1. Security

- Regularly update ttyd and cloudflared
- Use strong passwords for basic auth
- Monitor access logs
- Implement IP whitelisting if needed
- Use certificate pinning

### 2. Maintenance

- Regular system updates
- Monitor disk space
- Backup configurations
- Test disaster recovery procedures

### 3. Monitoring

- Set up alerting for service failures
- Monitor resource usage
- Track user access patterns
- Log security events

## Conclusion

This Cloudflare Tunnel + ttyd solution provides:

- **Security**: Zero port exposure, OAuth authentication
- **Accessibility**: Web-based terminal access from anywhere
- **Reliability**: Auto-restart and monitoring
- **Scalability**: Easy to deploy and manage
- **Cost-effective**: Uses Cloudflare's free tier

The solution is suitable for:
- Remote server management
- Development environments
- Emergency access scenarios
- Educational purposes

Remember to:
- Regularly update all components
- Monitor system resources
- Backup important configurations
- Test the setup regularly

