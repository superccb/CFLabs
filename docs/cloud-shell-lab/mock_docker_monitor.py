#!/usr/bin/env python3
"""
Safe Read-Only Mock Docker Monitor
Designed for use in Google Cloud Shell or Cloud Run.
"""

import threading
import time
from flask import Flask, jsonify, render_template_string
import psutil
import platform
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)

# Main API Service (Port 5000)
api_app = Flask(__name__)

@api_app.route('/health')
def health():
    return jsonify({
        'service': 'docker-monitor-api',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'docker_available': False,
        'mode': 'read-only-mock'
    })

@api_app.route('/containers')
def containers():
    # Only return mock data
    return jsonify({
        'containers': [
            {
                'id': 'mock123456',
                'name': 'mock-nginx',
                'image': 'nginx:latest',
                'status': 'running',
                'created': '2024-01-01T00:00:00Z',
                'ports': {'80/tcp': [{'HostPort': '8080'}]},
                'stats': {'cpu_percent': 2.5, 'memory_usage': 104857600}
            }
        ],
        'total_containers': 1,
        'timestamp': datetime.now().isoformat(),
        'note': 'Mock data - Docker access disabled'
    })

@api_app.route('/system')
def system():
    return jsonify({
        'hostname': platform.node(),
        'platform': platform.platform(),
        'cpu_count': psutil.cpu_count(),
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory': {
            'total': psutil.virtual_memory().total,
            'available': psutil.virtual_memory().available,
            'percent': psutil.virtual_memory().percent
        },
        'timestamp': datetime.now().isoformat()
    })

# Dashboard (Port 8080)
dashboard_app = Flask(__name__)

DASHBOARD_HTML = '''
<!DOCTYPE html>
<html>
<head>
    <title>Docker Monitor (Mock)</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .card { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
        .status { padding: 2px 8px; border-radius: 3px; font-weight: bold; }
        .running { background: #28a745; color: white; }
        .stopped { background: #dc3545; color: white; }
    </style>
</head>
<body>
    <h1>🐳 Docker Monitor (Mock)</h1>
    <button onclick="loadData()">Refresh</button>

    <div class="card" id="system">Loading system info...</div>
    <div class="card" id="containers">Loading container info...</div>

    <script>
        async function loadData() {
            const s = await fetch('/api/system').then(r => r.json());
            document.getElementById('system').innerHTML = `
                <strong>Hostname:</strong> ${s.hostname}<br>
                <strong>CPU:</strong> ${s.cpu_count} cores, ${s.cpu_percent}%<br>
                <strong>Memory:</strong> ${s.memory.percent}% used
            `;

            const c = await fetch('/api/containers').then(r => r.json());
            document.getElementById('containers').innerHTML = `
                <strong>Total Containers:</strong> ${c.total_containers}<br><br>
                ${c.containers.map(container => `
                    <div>
                        <strong>${container.name}</strong> -
                        <span class="status ${container.status === 'running' ? 'running' : 'stopped'}">${container.status}</span><br>
                        <small>Image: ${container.image}</small>
                    </div>
                `).join('<br>')}
            `;
        }
        loadData();
    </script>
</body>
</html>
'''

@dashboard_app.route('/')
def dashboard():
    return render_template_string(DASHBOARD_HTML)

@dashboard_app.route('/api/system')
def dashboard_system():
    return system()

@dashboard_app.route('/api/containers')
def dashboard_containers():
    return containers()

# Metrics Service (Port 9000)
metrics_app = Flask(__name__)

@metrics_app.route('/metrics')
def metrics():
    memory = psutil.virtual_memory()
    cpu = psutil.cpu_percent(interval=1)

    lines = [
        f"system_cpu_percent {cpu}",
        f"system_memory_percent {memory.percent}",
        f"system_memory_total {memory.total}",
        f"system_memory_available {memory.available}",
        "docker_containers_total 1",
        "docker_containers_running 1",
        "docker_containers_stopped 0"
    ]
    return '\n'.join(lines), 200, {'Content-Type': 'text/plain'}

@metrics_app.route('/health')
def metrics_health():
    return jsonify({
        'service': 'metrics-service',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'mode': 'mock'
    })

def run_service(app, port, name):
    logging.info(f"Starting {name} on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)

if __name__ == '__main__':
    services = [
        (api_app, 5000, 'API'),
        (dashboard_app, 8080, 'Dashboard'),
        (metrics_app, 9000, 'Metrics')
    ]
    threads = []
    for app, port, name in services:
        thread = threading.Thread(target=run_service, args=(app, port, name))
        thread.daemon = True
        thread.start()
        threads.append(thread)

    print("🚀 Mock Docker Monitor (Read-Only) Started!")
    print("📊 API: http://localhost:5000")
    print("🖥️ Dashboard: http://localhost:8080")
    print("📈 Metrics: http://localhost:9000")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n�� Shutting down...") 