import * as healthProto from "../../../contracts/proto/common/health";
import appConfig from "../../../infrastructure/app/config";

const startedAt = Date.now();

export class StatusUseCase {
    async execute(): Promise<healthProto.ServiceStatus> {
        const uptimeMs = Date.now() - startedAt;

        return {
            name: appConfig.appName,
            version: appConfig.appVersion,
            env: appConfig.appEnv,
            uptime: {
                seconds: Math.floor(uptimeMs / 1000),
                nanos: (uptimeMs % 1000) * 1_000_000,
            },
            timestamp: new Date(),
        };

    }
}


export default StatusUseCase;
