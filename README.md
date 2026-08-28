
VPS
    ставим K3s
    проверяем kubectl
    подключаем kubeconfig
Infrastructure
    PostgreSQL оставляем на VPS
    Kafka оставляем на VPS
    Redis — если нужен отдельно
    MinIO — тоже пока не трогаем без необходимости
Приложения
    gateway
    auth
    profile
    остальные сервисы inbalance
Networking
    Ingress
    домены
    TLS
    маршрутизация gateway → services
Secrets / Config
    Secrets
    ConfigMaps
    env
CI/CD
    GitHub Actions → GHCR → K3s
    автоматический rollout новой версии
Мониторинг
    сначала всё запускаем
    потом Prometheus/Grafana/Sentry


