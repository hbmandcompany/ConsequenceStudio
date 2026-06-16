#!/bin/bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y docker.io curl ca-certificates gnupg
systemctl enable docker
systemctl start docker

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

mkdir -p /opt/consequence/conductor /opt/consequence/doctor

docker run -d --name vllm --gpus all --restart unless-stopped \
  -p 8001:8000 \
  -v /root/.cache/huggingface:/root/.cache/huggingface \
  --ipc=host \
  vllm/vllm-openai:latest \
  --model Qwen/Qwen2.5-72B-Instruct \
  --max-model-len 8192 \
  --dtype auto

ufw allow 22/tcp || true
ufw allow 8000/tcp || true
ufw allow 8082/tcp || true
ufw --force enable || true

echo "gpu-bootstrap-done" > /var/log/consequence-bootstrap.done
