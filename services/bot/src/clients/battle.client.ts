import WebSocket from "ws";
import config from "../config/config";
import gatewayClient from "./gateway.client";
import * as streamingGrpc from "../grpc/generated/streaming";
import * as authGrpc from "../grpc/generated/auth";
import * as profileGrpc from "../grpc/generated/profile";
import logger from "@shared/logger";
import * as battleService from "../services/battle.service";

class BattleClient {
    private auth: authGrpc.AuthObject | null = null;
    private profile: profileGrpc.ProfileObject | null = null;
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectFn: NodeJS.Timeout | null = null;

    async getAuth(): Promise<authGrpc.AuthObject> {
        if (this.auth) {
            // logger.info('this.auth', this.auth);
            return this.auth;
        }
        try {
            const response = await gatewayClient.signIn(config.deviceId);
            if (!response || (response as any).error) {
                logger.error("❌ Auth failed:", response);
                this.auth = null;
                throw new Error("Auth failed");
            }
            this.auth = response as authGrpc.AuthObject;
            return this.auth;
        } catch (err) {
            logger.error("❌ Auth error:", err);
            this.auth = null;
            throw err; // ошибка всплывает, но процесс не падает
        }
    }

    async getProfile(): Promise<profileGrpc.ProfileObject> {
        if (this.profile) return this.profile;
        try {
            const response = await gatewayClient.fetchProfile();

            if (!response || (response as any).error) {
                logger.error("❌ Profile failed:", response);
                this.auth = null;
                throw new Error("Profile failed");
            }
            this.profile = response as profileGrpc.ProfileObject;

            return this.profile;
        } catch (err) {
            logger.error("❌ Profile error:", err);
            this.profile = null;
            throw err; // ошибка всплывает, но процесс не падает
        }
    }

    async getWs(): Promise<WebSocket | null> {
        if (
            this.ws &&
            this.ws.readyState === WebSocket.OPEN
        ) {
            return this.ws;
        }


        if (!this.reconnectFn) {
            this.scheduleReconnect();
        }

        return null;
    }

    async connect(): Promise<WebSocket | null> {
        const auth = await this.getAuth();
        const profile = await this.getProfile();

        // logger.log(`ws://${config.webSocketStreaming}/battle?token=${auth.accessToken}&profileId=${profile.id}`);
        this.ws = new WebSocket(`ws://${config.webSocketStreaming}/battle?token=${auth.accessToken}&profileId=${profile.id}`);

        this.ws.on("message", this.messageHandler);
        this.ws.on("open", this.openHandler);
        this.ws.on("error", this.errorHandler);
        this.ws.on("close", this.closeHandler);

        logger.info("Battle stream was created",);
        return this.ws;
    }


    disconnect(reconnectAttempts = this.reconnectAttempts) {
        if (this.ws) {
            this.ws.close();
            this.ws.removeAllListeners();
            this.ws = null;
        }
        this.auth = null;
        this.profile = null;
        this.cancelReconnect(reconnectAttempts);
    }


    send = async (message: streamingGrpc.BattleRequest): Promise<void> => {
        const ws = await this.getWs();
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.error("⚠️ WebSocket not ready:", ws?.readyState);
            return;
        }

        try {
            logger.log(message);
            ws.send(streamingGrpc.BattleRequest.encode(message).finish());
        } catch (err) {
            logger.error("Failed to send BattleRequest", err);
            throw err;
        }
    };

    cancelReconnect(reconnectAttempts = 0) {
        logger.info("⏹️ Reconnect cancelled");

        this.reconnectAttempts = reconnectAttempts;
        if (this.reconnectFn) {
            clearTimeout(this.reconnectFn);
        }
        this.reconnectFn = null;
    }

    private messageHandler = (data: WebSocket.RawData) => {
        try {
            const buffer = new Uint8Array(data as ArrayBuffer);
            const message = streamingGrpc.BattleResponse.decode(buffer);
            logger.log("📩 Got response:", message);
            battleService.battleMessageHandler(message);
        } catch (err) {
            logger.error("❌ Failed to parse message:", err);
        }
    }

    private errorHandler = (err: unknown) => {
        logger.error("⚠️ WebSocket error:", err);
        this.scheduleReconnect();
    }

    private openHandler = () => {
        this.cancelReconnect();
        logger.info("✅ WebSocket connected");
    };

    private closeHandler = () => {
        logger.warn("❌ Connection closed");
        this.scheduleReconnect();
    };

    private scheduleReconnect() {
        // logger.log('reconnect??');
        if (this.reconnectFn) return; // защита от дублей

        // logger.log('reconnect!!');

        this.disconnect();
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
        logger.info("Schedule reconnect in " + delay / 1000 + "s");

        this.reconnectAttempts++;

        this.reconnectFn = setTimeout(async () => {
            logger.info(`🔄 Reconnecting... attempt ${this.reconnectAttempts}`);

            try {
                await this.connect();
            } catch (err) {
                this.reconnectFn = null;
                logger.error("Reconnect failed:", err);
                this.scheduleReconnect();  // запускаем новый цикл
            }
            this.reconnectFn = null;
        }, delay);
    }

}

const battleClient = new BattleClient();

battleClient.getWs();

export default battleClient;
