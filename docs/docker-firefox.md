# 🦊 Firefox Remote Desktop via Docker (with NoVNC)

This guide provides two deployment approaches:

- ✅ **Version A: AMD GPU Support (with VA-API acceleration)**
- ✅ **Version B: Standard Version (no GPU support)**

After deployment, you can remotely operate Firefox's graphical interface through a browser, suitable for VPS and cloud hosting environments.

---

## 📁 File Structure

The following three files should be placed in the same folder (e.g., `firefox-remote/`):

```
firefox-remote/
├── Dockerfile
├── startup.sh
└── supervisord.conf
```

---

## 🔧 Version A: AMD GPU Support (Integrated Graphics)

### Dockerfile

```dockerfile
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    firefox \
    fluxbox \
    x11vnc \
    xvfb \
    wget \
    git \
    supervisor \
    mesa-utils \
    mesa-va-drivers \
    vainfo \
    libgl1-mesa-dri \
    libvulkan1 \
    vulkan-tools \
    ttyd \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/novnc/noVNC.git /opt/novnc && \
    git clone https://github.com/novnc/websockify /opt/novnc/utils/websockify && \
    ln -s /opt/novnc/vnc.html /opt/novnc/index.html

COPY startup.sh /opt/startup.sh
RUN chmod +x /opt/startup.sh

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8080 5900 7681

CMD ["/usr/bin/supervisord"]
```

### startup.sh

```bash
#!/bin/bash
# Start Xvfb display server
Xvfb :1 -screen 0 1280x800x24 &
export DISPLAY=:1

# Lightweight window manager
fluxbox &

# Display VA-API status (non-fatal errors can be ignored)
vainfo || echo "VA-API check failed"

# Start Firefox
firefox &

# Start VNC server
x11vnc -display :1 -nopw -forever -shared -rfbport 5900 &

# Start ttyd CLI Web Terminal (for persistent operations)
ttyd -p 7681 bash &

# Start noVNC, convert VNC to WebSocket
/opt/novnc/utils/launch.sh --vnc localhost:5900 --listen 8080
```

### supervisord.conf

```ini
[supervisord]
nodaemon=true

[program:browser]
command=/opt/startup.sh
```

### Launch Commands

```bash
docker build -t firefox-amd .
docker run -d \
  --device /dev/dri \
  -v "$(pwd)":/workspace \
  -p 8080:8080 \
  -p 7681:7681 \
  --name firefox-amd \
  firefox-amd
```

---

## ⚙️ Version B: Standard Version (No GPU / VA-API)

### Differences

* Remove GPU / VA-API package installation
* `vainfo` can be omitted
* No need for `--device /dev/dri` mount

### Launch Commands

```bash
docker build -t firefox-lite .
docker run -d \
  -v "$(pwd)":/workspace \
  -p 8080:8080 \
  -p 7681:7681 \
  --name firefox-lite \
  firefox-lite
```

---

## 🌐 Extended Features

### ✅ 1. Enable Cloudflare Tunnel (Temporary Access)

Install Cloudflare Tunnel ([Official Site](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)):

```bash
curl -fsSL https://developers.cloudflare.com/cloudflare-one/static/downloads/cloudflared-linux-amd64.deb -o cf.deb
sudo dpkg -i cf.deb
```

Start public URL (requires Cloudflare account login once):

```bash
cloudflared tunnel --url http://localhost:8080
```

Access example:

```
https://fancy-fox.trycloudflare.com
```

---

### ✅ 2. Working Directory Persistence (Original Directory Mount)

Docker startup already mounts:

```bash
-v "$(pwd)":/workspace
```

You can access and modify files in `/workspace`, or let Firefox save downloaded content.

---

### ✅ 3. Additional ttyd (Command Line Terminal)

* `ttyd` is already started in the container
* Can be accessed directly at:

```
http://<your-IP>:7681
```

> Recommended to use Cloudflare Tunnel to expose 7681 as well (or only expose 8080 + iframe terminal)

---

## 🔐 Security Recommendations

| Item | Recommended Practice |
|------|---------------------|
| Avoid direct exposure of 8080 | Use Cloudflare Tunnel or NGINX Basic Auth |
| Password protection | noVNC / ttyd default no password, should use Proxy encryption authentication |
| HTTPS | Can use Cloudflare or NGINX Reverse Proxy for HTTPS |

---

## ✅ Firefox Acceleration Verification Method

1. Open Firefox
2. Enter `about:support`
3. Check if the following information is enabled:

| Item | Status |
|------|--------|
| Compositing | WebRender or OpenGL |
| GPU Accelerated Windows | > 0 |
| Video Acceleration Info | Contains VA-API if enabled |

---

## 🚀 Quick Start with Official Image (Recommended)

### ✅ Quick Launch Command (No Dockerfile Required):

```bash
docker run -d \
  --name=firefox \
  -p 5800:5800 \
  -v /docker/appdata/firefox:/config:rw \
  jlesage/firefox
```

- **Web Access**: Open `http://your-VPS-IP:5800` in browser to see Firefox graphical interface (noVNC).
- **Port Description**: 5800 (Web/noVNC), 5900 (VNC client, needs additional opening).
- **Data Persistence**: Firefox configuration and data will be saved in `/docker/appdata/firefox`, customizable path.
- **Resource Requirements**: Recommend VPS with at least 1GB memory.

---

## 🔧 Custom Dockerfile (For Advanced Customization)

If you need complete custom environment, refer to the following Dockerfile:

```dockerfile
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# Install Firefox and necessary components
RUN apt-get update && apt-get install -y \
    firefox \
    x11vnc \
    xvfb \
    fluxbox \
    wget \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Create startup script
RUN mkdir -p /opt/scripts
COPY startup.sh /opt/scripts/startup.sh
RUN chmod +x /opt/scripts/startup.sh

# Supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 5900 6080

CMD ["/usr/bin/supervisord"]
```

#### `startup.sh` (Firefox + VNC Startup Script)

```bash
#!/bin/bash
# Start Xvfb (virtual X server)
Xvfb :1 -screen 0 1024x768x16 &

# Set display variable
export DISPLAY=:1

# Start window manager
fluxbox &

# Start Firefox
firefox &

# Start VNC server
x11vnc -display :1 -forever -nopw -shared &
```

#### `supervisord.conf`

```ini
[supervisord]
nodaemon=true

[program:startup]
command=/opt/scripts/startup.sh
```

#### Build and Run Custom Image

```bash
# Build image
sudo docker build -t myfirefox .

# Run container
sudo docker run -d --name=firefox -p 5900:5900 myfirefox
```

---

## 🔐 Security Reminders

- **Never directly expose ports 5800/5900 to public network**, recommend using Cloudflare Tunnel, SSH tunnel, or setting passwords.
- Default no authentication, please strengthen firewall rules, Nginx Basic Auth, or Cloudflare Zero Trust.
- Refer to [noVNC official documentation](https://novnc.com/info.html) for password setup.

---

## FAQ

**Q1: Cannot access port 5800 after startup?**
- Check if VPS firewall has opened port 5800.
- Check if container is running normally: `docker ps`.

**Q2: Firefox starts slowly or crashes?**
- Check if VPS memory is sufficient (recommend 1GB+).
- Try restarting the container.

**Q3: How to set VNC/noVNC password?**
- Can add `-passwd yourpassword` parameter in startup script.
- Refer to noVNC/x11vnc official documentation.

**Q4: How to customize data save path?**
- Modify the left path in `-v /docker/appdata/firefox:/config:rw`.

---

## 🧪 Test Address (Example)

Assuming your VPS IP is `1.2.3.4`, execute:

```bash
docker run -d -p 5800:5800 jlesage/firefox
```

Then access `http://1.2.3.4:5800` in browser.

### Stop and Clean Up Container

```bash
docker stop firefox && docker rm firefox
```

---

## ✅ Summary

| Method | Recommended | Web Access Support | Difficulty | Notes |
|--------|-------------|-------------------|------------|-------|
| Use jlesage/firefox | ✅ Recommended | ✅ (port 5800) | Simplest | Ready to use |
| Custom Dockerfile + VNC/noVNC | For advanced users | ✅ Can add noVNC | Medium | Highly customizable |
| ttyd + CLI browser (w3m/lynx) | ❌ Not recommended | ❌ No GUI | Lightest | Text-only browsing |

---

## Version and Update Information

- Compatible image version: `jlesage/firefox:latest` (tested 2024-06)
- Last update: 2024-06

