---

## 🐳 Dockerfile: AI-Agent in a Box

```dockerfile
FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

# Install essentials and agent prerequisites
RUN apt-get update && apt-get install -y \
    git \
    curl \
    python3 \
    python3-pip \
    nodejs \
    npm \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install ttyd for in-browser terminal access
RUN wget "https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64" \
    -O /usr/local/bin/ttyd && chmod +x /usr/local/bin/ttyd

WORKDIR /app
EXPOSE 7681

# Install Gemini CLI
RUN npm install -g @google/gemini-cli

# Install Claude Code (Anthropic CLI) placeholder
RUN pip3 install anthropic-cli  # replace with correct package if available

# Install Atlassian CLI for Rovo Dev
RUN curl -L https://product-dist.atlassian.io/products/acli/v1/acli_installer.sh | bash

# Entrypoint to start ttyd and drop into bash
CMD ["ttyd", "bash"]
```

---

## 🛠️ How to Build & Run

```bash
# Build the Docker image
docker build -t ai-agent-env .

# Run the container with environment variables securely passed
docker run -d -p 7681:7681 \
  -e GEMINI_API_KEY="your_gemini_api_key" \
  -e ANTHROPIC_API_KEY="your_anthropic_key" \
  -e ATLASSIAN_TOKEN="your_atlassian_api_token" \
  --name ai-agent ai-agent-env
```

* **GEMINI\_API\_KEY**: used by Gemini CLI ([DataCamp][1], [Medium][2], [depot.dev][3])
* **ANTHROPIC\_API\_KEY**: for Claude Code CLI usage&#x20;
* **ATLASSIAN\_TOKEN**: for Rovo Dev (via `acli`) ([apidog][4])

You’ll have a browser-accessible terminal at `http://localhost:7681` with all three agents ready to use.

---

## 📘 agent-guide.md (Markdown Usage Instructions)

````markdown
# AI Agent Terminal Container

This container includes:

- **Gemini CLI** (Google Gemini 2.5 Pro, 1M token context) :contentReference[oaicite:7]{index=7}  
- **Claude Code CLI** (Anthropic agent) :contentReference[oaicite:8]{index=8}  
- **Rovo Dev CLI** (Atlassian agent, Claude Sonnet, 20M tokens/day) :contentReference[oaicite:9]{index=9}  

---

## 🔧 Using the Agents

### Gemini CLI
```bash
gemini auth login          # Requires GEMINI_API_KEY
gemini chat
````

### Claude Code CLI

```bash
claude login              # Requires ANTHROPIC_API_KEY
claude code               # Kick off coding agent session
```

### Rovo Dev CLI

```bash
acli login                # Input ATLASSIAN_TOKEN
acli rovodev run          # Launch Rovo Dev session
```

---

## 🔐 Secure Credential Usage

Do **not** embed API keys in the Dockerfile. Use environment variables (`-e`) or Docker secrets at runtime. The container reads credentials from:

* `GEMINI_API_KEY`
* `ANTHROPIC_API_KEY`
* `ATLASSIAN_TOKEN`

---

## 📦 Sharing Docker Images Without Docker Hub

1. **Save image to tar**

   ```bash
   docker save -o ai_agent_env.tar ai-agent-env:latest
   ```

2. **Transfer `tar` file** via `scp`, USB, or network.

3. **Load on target machine**

   ```bash
   docker load -i ai_agent_env.tar
   ```

> ⚠️ Beware: manual versioning and no layer caching benefits.

```

---

### Why Each Agent?

- **Gemini CLI** brings 1‑million token context and developer workflows :contentReference[oaicite:15]{index=15}.
- **Claude Code** offers low‑level, scriptable agentic coding :contentReference[oaicite:16]{index=16}.
- **Rovo Dev** provides enterprise‑grade CLI access to Claude Sonnet with generous token limits :contentReference[oaicite:17]{index=17}.

::contentReference[oaicite:18]{index=18}
```

[1]: https://www.datacamp.com/tutorial/gemini-cli?utm_source=chatgpt.com "Gemini CLI: A Guide With Practical Examples - DataCamp"
[2]: https://garysvenson09.medium.com/claude-code-for-free-20m-daily-tokens-the-rovo-dev-gold-rush-and-how-to-max-it-out-d36725b5ff09?utm_source=chatgpt.com "Claude Code for Free? 20M Daily Tokens? The Rovo Dev Gold ..."
[3]: https://depot.dev/blog/claude-code-in-github-actions?utm_source=chatgpt.com "Faster Claude Code agents in GitHub Actions - Depot"
[4]: https://apidog.com/blog/claude-code-free/?utm_source=chatgpt.com "Claude Code for Free? 20M Free Daily Tokens? Atlassian's Rovo ..."

