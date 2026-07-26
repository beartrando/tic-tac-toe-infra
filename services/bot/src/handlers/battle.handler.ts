import * as streamingGrpc from "../grpc/generated/streaming";
import * as battleGrpc from "../grpc/generated/battle";
import battleClient from "../clients/battle.client";
import logger from "@shared/logger";
import {pgBossConsumersConfig} from "../config/pg.boss.config";
import pgBossManager from "@shared/pg-boss-manager";


export const startBattle = async (req: streamingGrpc.BattleStart) => {
    const message = streamingGrpc.BattleRequest.create({start: req});
    // logger.log('startBattle');
    // logger.log(pgBossConsumersConfig.websocketSendEvent.topic, message);
    await pgBossManager.queue.enqueue(pgBossConsumersConfig.websocketSendEvent.topic, message);
}

export const makeMove = async (battle: battleGrpc.BattleObject) => {
    if (!await isMyTurn(battle)) {
        logger.info('Not my turn')
        return;
    }
    const cellIdx = await calculateMove(battle);

    if (cellIdx === null) {
        return;
    }

    const battleId = battle.id;
    const req = streamingGrpc.BattleRequest.create({
        move: streamingGrpc.BattleMove.create({
            battleId,
            cellIdx
        })
    });
    await pgBossManager.queue.enqueue(pgBossConsumersConfig.websocketSendEvent.topic, req);
    logger.log('message moved to pgboss')
}

const isMyTurn = async (battle: battleGrpc.BattleObject): Promise<boolean> => {
    const profile = await battleClient.getProfile();

    // считаем количество занятых клеток
    const filledCount = battle.cells.filter(cell => cell !== battleGrpc.BattleCellValue.CELL_EMPTY).length;

    // вычисляем индекс текущего игрока
    const currentPlayerIndex = filledCount % battle.playerIds.length;
    const currentPlayerId = battle.playerIds[currentPlayerIndex];

    // мой ли это ход?
    return currentPlayerId === profile.id;
};


export const calculateMove = async (battle: battleGrpc.BattleObject): Promise<number | null> => {
    const profile = await battleClient.getProfile();
    const myIndex = battle.playerIds.indexOf(profile.id);
    if (myIndex === -1) return null;

    const mySymbol = myIndex === 0 ? battleGrpc.BattleCellValue.CELL_X : battleGrpc.BattleCellValue.CELL_O;

    const oppSymbol = mySymbol === battleGrpc.BattleCellValue.CELL_X
        ? battleGrpc.BattleCellValue.CELL_O
        : battleGrpc.BattleCellValue.CELL_X;

    const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // строки
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // столбцы
        [0, 4, 8], [2, 4, 6]          // диагонали
    ];

    const isWinningMove = (cells: battleGrpc.BattleCellValue[], symbol: battleGrpc.BattleCellValue, idx: number) => {
        const clone = [...cells];
        clone[idx] = symbol;
        return winningCombos.some(combo =>
            combo.every(c => clone[c] === symbol)
        );
    };

    // 1. Попробовать выиграть
    for (let i = 0; i < battle.cells.length; i++) {
        if (battle.cells[i] === battleGrpc.BattleCellValue.CELL_EMPTY) {
            if (isWinningMove(battle.cells, mySymbol, i)) return i;
        }
    }

    // 2. Заблокировать соперника
    for (let i = 0; i < battle.cells.length; i++) {
        if (battle.cells[i] === battleGrpc.BattleCellValue.CELL_EMPTY) {
            if (isWinningMove(battle.cells, oppSymbol, i)) return i;
        }
    }

    // 3. Центр
    if (battle.cells[4] === battleGrpc.BattleCellValue.CELL_EMPTY) return 4;

    // 4. Углы
    const corners = [0, 2, 6, 8];
    for (const c of corners) {
        if (battle.cells[c] === battleGrpc.BattleCellValue.CELL_EMPTY) return c;
    }

    // 5. Любая свободная клетка
    const idx = battle.cells.findIndex(cell => cell === battleGrpc.BattleCellValue.CELL_EMPTY);
    return idx >= 0 ? idx : null;
};


