include make/main.mk

GIT_SERVICES     := auth battle bot engine front gateway orchestration profile matchmaking streaming service-template
NODE_SERVICES    := auth battle bot engine       gateway orchestration profile matchmaking streaming service-template
PRISMA_SERVICES  := auth battle bot engine               orchestration profile matchmaking streaming service-template
FLUTTER_SERVICES :=                        front

GIT_BASE := services/auth services/gateway services/profile

PROJECT_PREFIX := ttt
