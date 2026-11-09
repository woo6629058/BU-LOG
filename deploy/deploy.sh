#!/usr/bin/env bash
# EC2에서 실행하는 배포 스크립트. GitHub Actions가 SSM으로 호출한다.
# 사용법: deploy.sh <이미지 태그>   (예: deploy.sh 3f2c1ab)
set -euo pipefail

IMAGE_REPO="ghcr.io/woo6629058/bu-log"
TAG="${1:-latest}"
IMAGE="${IMAGE_REPO}:${TAG}"
CONTAINER="bulog"
ENV_FILE="/opt/bulog/.env"
HEALTH_URL="http://127.0.0.1:8080/"

echo "[deploy] pull ${IMAGE}"
docker pull "${IMAGE}"

echo "[deploy] replace container"
docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true
docker run -d \
  --name "${CONTAINER}" \
  --restart unless-stopped \
  --env-file "${ENV_FILE}" \
  --memory 700m \
  -p 127.0.0.1:8080:8080 \
  "${IMAGE}"

echo "[deploy] health check"
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null "${HEALTH_URL}"; then
    echo "[deploy] healthy after $((i * 3))s"
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 3
done

echo "[deploy] health check failed" >&2
docker logs --tail 100 "${CONTAINER}" >&2 || true
exit 1
