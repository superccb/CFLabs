# Cloud Docker Mock Monitoring Lab Quick Start

This lab is suitable for Google Cloud Shell, Linux, Mac, and Windows, helping you experience "secure read-only Docker monitoring services" in the simplest way, and make them externally accessible through cloudflared.
With the gcloud command line, you can start test applications anytime, close them when not needed, and it's very convenient for temporary application needs, whether using Cloudflare or Google's own test domains.
Google test domains can be used anytime by changing ports.
---

## 1. Environment Preparation

- Requires Python 3.7 or higher
- Recommended environments: Google Cloud Shell, Linux, Mac, Windows (Python installation required)

---

## 2. Get the Code

```bash
# Enter the lab directory
cd docs/cloud-shell-lab
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Start Mock Monitoring Service

```bash
python3 mock_docker_monitor.py
```

- After startup, the following services will run simultaneously:
  - API Service: http://localhost:5000
  - Dashboard: http://localhost:8080
  - Prometheus Metrics: http://localhost:9000

---

## 5. Access Services

### A. Google Cloud Shell

1. After starting the service, click the "Web Preview" button above Cloud Shell, select port 8080 (Dashboard), 5000 (API), or 9000 (Metrics) to access.
2. Port descriptions:
   - 8080: Visual Dashboard
   - 5000: API Interface
   - 9000: Prometheus monitoring metrics

### B. Local Linux/Mac/Windows

- Directly access http://localhost:8080 in your browser
- If external access is needed, continue to the next step with cloudflared

---

## 6. Expose Services to Public Network with cloudflared

### Install cloudflared

#### Linux/Mac
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
mv cloudflared-linux-amd64 cloudflared
```

#### Windows
- Visit the [cloudflared official website](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) to download the corresponding version.

### Start Public Tunnel (using Dashboard port as example)

```bash
./cloudflared tunnel --url http://localhost:8080
```

- The terminal will output a public address like https://xxxx.trycloudflare.com that anyone can access your Dashboard from.
- Close the tunnel: Press Ctrl+C

> **Note:**
> - Some network environments in Google Cloud Shell may not support cloudflared tunnels (if it fails, please use Cloud Run deployment).
> - Only for temporary demonstrations, for production environments please use Cloud Run or your own servers.

---

## 7. Cloud Run Deployment (Optional)

For long-term public access, you can deploy using Cloud Run:

```bash
gcloud run deploy docker-monitor-mock \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

---

## 8. Run with Docker (Zero Dependency Experience)

No need to install Python/dependencies locally, experience directly with Docker:

```bash
# Build image (only needed once)
docker build -t mock-docker-monitor .

# Run container (map ports, run in background)
docker run -d \
  -p 5000:5000 \
  -p 8080:8080 \
  -p 9000:9000 \
  --name mock-docker-monitor \
  mock-docker-monitor
```

- Access method is the same as above (http://localhost:8080, etc.)
- Stop and remove container:
  ```bash
  docker stop mock-docker-monitor && docker rm mock-docker-monitor
  ```

---

## 9. Common Issues

- **Cannot access ports?**
  - Confirm the service has started and ports are not occupied.
  - For Cloud Shell, please use Web Preview to access.
- **cloudflared tunnel fails?**
  - Check network environment, or try Cloud Run.
- **Windows users**
  - Recommend using WSL or PowerShell, commands may differ slightly.

---

## 10. Advanced Usage and Original Documentation

- For detailed principles and advanced usage, see `google-cloud-shell-lab.md`
- Code is secure and read-only, no need to worry about leaks or misoperations

---

Enjoy your lab experience! 