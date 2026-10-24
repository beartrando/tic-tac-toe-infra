include tools/make/main.mk

GIT_SERVICES     := auth battle bot engine front gateway orchestration profile matchmaking streaming devorc
NODE_SERVICES    := auth battle bot engine       gateway orchestration profile matchmaking streaming devorc
PRISMA_SERVICES  := auth battle bot engine               orchestration profile matchmaking streaming devorc
FLUTTER_SERVICES :=                        front

GIT_BASE := services/auth services/gateway services/profile

PROJECT_PREFIX := ttt
