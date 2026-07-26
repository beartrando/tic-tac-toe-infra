import config from "../config/config";
import http from "node:http";
import * as grpcAuth from "../grpc/generated/auth";
import * as grpcProfile from "../grpc/generated/profile";
import logger from "@shared/logger";

export class GatewayClient {
    private host = config.httpGatewayHost;
    private port = Number(config.httpGatewayPort);
    private jwt = '';

    public getJwt() {
        return this.jwt;
    }

    async signIn(deviceId: string): Promise<grpcAuth.AuthObject> {
        // logger.info('signIn', deviceId);
        const resp = await this.request("auth/anonymousSignIn", {deviceId}, "POST") as grpcAuth.AuthObject;
        // logger.info('signIn', resp);

        this.jwt = resp.accessToken;
        return resp;
    }

    async fetchProfile(): Promise<grpcProfile.ProfileObject> {
        return await this.request("profile/getMe") as grpcProfile.ProfileObject;
    }

    private async request(
        uri: string,
        request?: object,
        method: string = "GET"
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            // logger.info(
            //   uri,
            //   request,
            //   method,
            // );

            const headers: Record<string, string | number> = {
                "Content-Type": "application/json",
            };

            let data = '';
            if (request) {
                data = JSON.stringify(request);
                headers["Content-Length"] = Buffer.byteLength(data);

            }

            if (this.jwt) {
                headers["Authorization"] = "Bearer " + this.jwt;
            }

            const options = {
                hostname: this.host,
                port: this.port,
                path: `/${uri}`,
                method,
                headers,
            };

            const req = http.request(options, (res) => {
                let body = "";
                res.on("data", (chunk) => (body += chunk));
                res.on("end", () => {
                    try {
                        const response = JSON.parse(body);
                        resolve(response);
                    } catch (err) {
                        logger.error(body);
                        reject(err);
                    }
                });
            });

            // logger.log(options);

            req.on("error", (err) => {
                if ((err as NodeJS.ErrnoException).code === "ECONNREFUSED") {
                    reject(new Error(`Gateway unavailable at ${this.host}:${this.port}`));
                } else {
                    reject(err);
                }
            });

            if (request) {
                req.write(data);
            }
            req.end();
        });
    }
}

const gatewayClient = new GatewayClient();

export default gatewayClient;

