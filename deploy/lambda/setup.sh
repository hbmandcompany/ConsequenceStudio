#!/bin/bash
# Consequence Conductor on Lambda Labs — Qwen2.5-72B-Instruct + vLLM
# Run as root on a fresh Ubuntu GPU instance (A100 80GB+ recommended).
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y docker.io docker-compose-plugin git curl python3-pip

systemctl enable docker
systemctl start docker

# Hugging Face token (required for gated models; Qwen2.5-72B is open but set anyway)
if [ -z "${HF_TOKEN:-}" ]; then
  echo "Set HF_TOKEN before running: export HF_TOKEN=hf_..."
  exit 1
fi

mkdir -p /opt/consequence
cd /opt/consequence

# vLLM serves Qwen2.5-72B on port 8001
docker run -d --name vllm --gpus all --restart unless-stopped \
  -p 8001:8000 \
  -e HF_TOKEN="$HF_TOKEN" \
  -v /root/.cache/huggingface:/root/.cache/huggingface \
  --ipc=host \
  vllm/vllm-openai:latest \
  --model Qwen/Qwen2.5-72B-Instruct \
  --max-model-len 8192 \
  --dtype auto

echo "Waiting for vLLM to load (5-15 min for 72B)..."
until curl -sf http://127.0.0.1:8001/health; do sleep 30; done

# Conductor (clone or scp deploy/conductor from studio repo)
if [ ! -f /opt/consequence/conductor/server.mjs ]; then
  echo "Copy deploy/conductor and deploy/doctor from studio-2 to /opt/consequence/"
  exit 1
fi

cd /opt/consequence/conductor
npm install --omit=dev

# Doctor stub on 8082
cd /opt/consequence/doctor
npm init -y >/dev/null 2>&1
npm install ws@8 --omit=dev --silent

cat >/etc/systemd/system/consequence-doctor.service <<'EOF'
[Unit]
Description=Consequence Doctor
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/consequence/doctor
ExecStart=/usr/bin/node server.mjs
Restart=always
Environment=DOCTOR_PORT=8082

[Install]
WantedBy=multi-user.target
EOF

cat >/etc/systemd/system/consequence-conductor.service <<EOF
[Unit]
Description=Consequence Conductor (Qwen orchestrator)
After=network.target docker.service consequence-doctor.service

[Service]
Type=simple
WorkingDirectory=/opt/consequence/conductor
ExecStart=/usr/bin/node server.mjs
Restart=always
Environment=CONDUCTOR_PORT=8000
Environment=VLLM_BASE_URL=http://127.0.0.1:8001
Environment=MODEL_ID=Qwen/Qwen2.5-72B-Instruct
Environment=THEORY_HTTP_URL=${THEORY_HTTP_URL:-http://168.144.12.221}
Environment=THEORY_AUTH_TOKEN=${THEORY_AUTH_TOKEN:-a2c1d096fbe48357}
Environment=DOCTOR_HTTP_URL=http://127.0.0.1:8082
Environment=CONDUCTOR_AUTH_TOKEN=${CONDUCTOR_AUTH_TOKEN:-dev-secret-change-in-production}

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable consequence-doctor consequence-conductor
systemctl start consequence-doctor consequence-conductor

ufw allow 8000/tcp || true

PUBLIC_IP=$(curl -sf ifconfig.me || hostname -I | awk '{print $1}')
echo ""
echo "Conductor ready at http://${PUBLIC_IP}:8000"
echo "Studio .env:"
echo "  VITE_STUDIO_CONDUCTOR_HTTP_URL=http://${PUBLIC_IP}:8000"
echo "  VITE_STUDIO_POET_WS_URL=ws://${PUBLIC_IP}:8000"
echo "  VITE_STUDIO_POET_HTTP_URL=http://${PUBLIC_IP}:8000"
echo "  VITE_STUDIO_CONDUCTOR_AUTH_TOKEN=dev-secret-change-in-production"
