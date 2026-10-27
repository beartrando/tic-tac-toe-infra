include tools/make/main.mk

#GIT_SERVICES     := server/auth server/battle server/bot server/engine front server/gateway server/orchestration server/profile server/matchmaking server/streaming infra/devorc
#NODE_SERVICES    := server/auth server/battle server/bot server/engine       server/gateway server/orchestration server/profile server/matchmaking server/streaming infra/devorc
#PRISMA_SERVICES  := server/auth server/battle server/bot server/engine                      server/orchestration server/profile server/matchmaking server/streaming infra/devorc
FLUTTER_SERVICES :=                                                    front

GIT_BASE := services/server/auth services/server/gateway services/server/profile services/infra/devorc

PROJECT_PREFIX := ttt
