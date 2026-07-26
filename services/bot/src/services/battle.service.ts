import * as streamingGrpc from "../grpc/generated/streaming";
import logger from "@shared/logger";
import {makeMove, startBattle} from "../handlers/battle.handler";

export const connectToBattle = async (req: streamingGrpc.BattleStart) => {
    startBattle(req);
};

export const battleMessageHandler = (message: streamingGrpc.BattleResponse) => {
    if (message.battle) {

        makeMove(message.battle);
    }

    if (message.error) {
        logger.error(message.error);
    }
};
