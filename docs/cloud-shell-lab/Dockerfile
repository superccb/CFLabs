FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 默认启动 mock 监控服务
CMD ["python", "mock_docker_monitor.py"] 