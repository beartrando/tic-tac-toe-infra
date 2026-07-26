import * as battleGrpc from "../../src/grpc/generated/battle";
import * as streamingGrpc from "../../src/grpc/generated/streaming";
import config from "../../src/config/config";
import jwt from "jsonwebtoken";
import WebSocket from "ws";
import * as gatewayClient from "../../src/clients/gateway.client";
import {GatewayClient} from "../../src/clients/gateway.client";

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("Gateway Service", () => {

    test("Game story functional", async () => {

        const deviceId1 = `device1-${Math.random().toString(36).substring(2, 8)}`;
        const deviceId2 = `device2-${Math.random().toString(36).substring(2, 8)}`;

        // console.log(deviceId1);
        // console.log(deviceId2);

        const gatewayClient1 = new GatewayClient();
        const gatewayClient2 = new GatewayClient();

        await gatewayClient1.signIn(deviceId1);
        await gatewayClient2.signIn(deviceId2);

        expect(gatewayClient1.getJwt()).toBeDefined();
        expect(gatewayClient2.getJwt()).toBeDefined();

        //------------------------------------------------------------------------------------------------------------------

        // await delay(5000);

        const profile1 = await gatewayClient1.fetchProfile();
        const profile2 = await gatewayClient2.fetchProfile();

        expect(profile1).toBeDefined();

        // console.log(profile1);

        const ws1 = new WebSocket(`ws://${config.webSocketStreaming}/battle?profileId=${profile1.id}`, {
            headers: {
                Authorization: `Bearer ${gatewayClient1.getJwt()}`,
            },
        });

        const ws2 = new WebSocket(`ws://${config.webSocketStreaming}/battle?profileId=${profile2.id}`, {
            headers: {
                Authorization: `Bearer ${gatewayClient2.getJwt()}`,
            },
        });


        const start = new Promise<void>(async (resolve) => {
            let counter = 0;
            const gameplay = async (battleObject?: battleGrpc.BattleObject | null) => {
                console.log(battleObject);

                // console.log('=====================================================================step ', counter);
                if (!battleObject) {
                    const req = streamingGrpc.BattleRequest.create({start: {}});
                    const buffer = streamingGrpc.BattleRequest.encode(req).finish();
                    ws1.send(buffer);
                } else if (counter === 1) {
                    const req = streamingGrpc.BattleRequest.create({start: {}});
                    const buffer = streamingGrpc.BattleRequest.encode(req).finish();
                    ws2.send(buffer);
                } else if (counter === 3) {
                    const req = streamingGrpc.BattleRequest.create({
                        move: {
                            battleId: battleObject.id,
                            cellIdx: 4
                        }
                    });
                    const buffer = streamingGrpc.BattleRequest.encode(req).finish();
                    ws1.send(buffer);
                } else if (counter === 5) {
                    const req = streamingGrpc.BattleRequest.create({
                        move: {
                            battleId: battleObject.id,
                            cellIdx: 1
                        }
                    });
                    const buffer = streamingGrpc.BattleRequest.encode(req).finish();
                    ws2.send(buffer);
                } else if (counter === 7) {
                    const req = streamingGrpc.BattleRequest.create({
                        move: {
                            battleId: battleObject.id,
                            cellIdx: 0
                        }
                    });
                    const buffer = streamingGrpc.BattleRequest.encode(req).finish();
                    ws1.send(buffer);
                } else if (counter === 9) {
                    const req = streamingGrpc.BattleRequest.create({
                        move: {
                            battleId: battleObject.id,
                            cellIdx: 2
                        }
                    });
                    const buffer = streamingGrpc.BattleRequest.encode(req).finish();
                    ws2.send(buffer);
                } else if (counter === 11) {
                    const req = streamingGrpc.BattleRequest.create({
                        move: {
                            battleId: battleObject.id,
                            cellIdx: 8
                        }
                    });
                    const buffer = streamingGrpc.BattleRequest.encode(req).finish();
                    ws1.send(buffer);
                } else if (counter >= 13) {
                    resolve();
                }
                // console.log("-------------------------------------------------------------------------------------------------------------------------------");

                counter++;
            };


            ws1.on("message", (data: streamingGrpc.BattleResponse) => {
                // console.log("------------------------------------------------------------------------------=1=- Got battle update:");
                const buffer = new Uint8Array(data as ArrayBuffer);
                const res = streamingGrpc.BattleResponse.decode(buffer);

                // console.log(res)
                const battleObject = battleGrpc.BattleObject.create(res.battle);

                gameplay(battleObject);
            });

            ws2.on("message", (data: streamingGrpc.BattleResponse) => {
                // console.log("------------------------------------------------------------------------------=2=- Got battle update:");
                const buffer = new Uint8Array(data as ArrayBuffer);
                const res = streamingGrpc.BattleResponse.decode(buffer);

                // console.log(res);
                const battleObject = battleGrpc.BattleObject.create(res.battle);
                gameplay(battleObject);
            });

            await Promise.all([
                new Promise(resolve => ws1.on('open', resolve)),
                new Promise(resolve => ws2.on('open', resolve)),
            ]);

            await gameplay();
        });


        await start;

        await ws1.close();
        await ws2.close();


        ///
        // console.log('streams are closed')


        // });
    }, 30000);

});

