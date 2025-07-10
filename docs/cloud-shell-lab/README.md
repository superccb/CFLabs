# 云端 Docker Mock 监控 Lab 快速上手（Quick Start）

本实验适用于 Google Cloud Shell、Linux、Mac、Windows，帮助你用最简单的方式体验“安全只读的 Docker 监控服务”，并通过 cloudflared 让外部可访问。

---

## 1. 环境准备

- 需要 Python 3.7 及以上
- 推荐环境：Google Cloud Shell、Linux、Mac、Windows（需安装 Python）

---

## 2. 获取代码

```bash
# 进入实验目录
cd docs/cloud-shell-lab
```

---

## 3. 安装依赖

```bash
pip install -r requirements.txt
```

---

## 4. 启动 Mock 监控服务

```bash
python3 mock_docker_monitor.py
```

- 启动后会同时运行：
  - API 服务：http://localhost:5000
  - Dashboard：http://localhost:8080
  - Prometheus Metrics：http://localhost:9000

---

## 5. 访问服务

### A. Google Cloud Shell

1. 启动服务后，点击 Cloud Shell 上方“Web Preview”按钮，选择端口 8080（Dashboard）、5000（API）、9000（Metrics）即可访问。
2. 端口说明：
   - 8080：可视化 Dashboard
   - 5000：API 接口
   - 9000：Prometheus 监控指标

### B. 本地 Linux/Mac/Windows

- 直接在浏览器访问 http://localhost:8080
- 若需让外部访问，继续下一步 cloudflared

---

## 6. 用 cloudflared 暴露服务到公网

### 安装 cloudflared

#### Linux/Mac
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
mv cloudflared-linux-amd64 cloudflared
```

#### Windows
- 访问 [cloudflared 官网](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) 下载对应版本。

### 启动公网隧道（以 Dashboard 端口为例）

```bash
./cloudflared tunnel --url http://localhost:8080
```

- 终端会输出一个 https://xxxx.trycloudflare.com 的公网地址，任何人都可以访问你的 Dashboard。
- 关闭隧道：按 Ctrl+C

> **注意：**
> - Google Cloud Shell 某些网络环境可能不支持 cloudflared 隧道（如遇失败请用 Cloud Run 部署）。
> - 仅用于临时演示，生产环境请用 Cloud Run 或自有服务器。

---

## 7. Cloud Run 部署（可选）

如需长期公网访问，可用 Cloud Run 部署：

```bash
gcloud run deploy docker-monitor-mock \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

---

## 7. 用 Docker 运行（零依赖体验）

无需本地安装 Python/依赖，直接用 Docker 体验：

```bash
# 构建镜像（仅需一次）
docker build -t mock-docker-monitor .

# 运行容器（映射端口，后台运行）
docker run -d \
  -p 5000:5000 \
  -p 8080:8080 \
  -p 9000:9000 \
  --name mock-docker-monitor \
  mock-docker-monitor
```

- 访问方式同上（http://localhost:8080 等）
- 停止并移除容器：
  ```bash
  docker stop mock-docker-monitor && docker rm mock-docker-monitor
  ```

---

## 8. 常见问题

- **端口无法访问？**
  - 确认服务已启动，端口未被占用。
  - Cloud Shell 请用 Web Preview 访问。
- **cloudflared 隧道失败？**
  - 检查网络环境，或尝试 Cloud Run。
- **Windows 用户**
  - 建议用 WSL 或 PowerShell，命令略有差异。

---

## 9. 进阶与原始文档

- 详细原理、进阶用法见 `google-cloud-shell-lab.md`
- 代码安全、只读，无需担心泄露或误操作

---

祝你实验愉快！ 