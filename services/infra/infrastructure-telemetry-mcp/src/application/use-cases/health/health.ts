import * as healthProto from "../../../contracts/proto/common/health";
import MessageService from "../../../infrastructure/message/service";
import DbService from "../../../infrastructure/db/service";
import JobService from "../../../infrastructure/job/service";
import appConfig from "../../../infrastructure/app/config";

export class HealthUseCase {
    constructor(
        private readonly dbService: DbService,
        private readonly messageService: MessageService,
        private readonly jobService: JobService,
    ) {
    }

    async execute(): Promise<healthProto.HealthReport> {
        const [dbOk, messageOk, jobOk] = await Promise.all([this.dbService.check(), this.messageService.check(), this.jobService.check()]);

        const components = {
            db: dbOk,
            message: messageOk,
            job: jobOk,
        };

        return {
            service: appConfig.appName,
            status: this.toHealthStatus(
                Object.values(components).every(Boolean),
            ),
            components: Object.fromEntries(
                Object.entries(components).map(([name, ok]) => [
                    name,
                    this.toHealthStatus(ok),
                ]),
            ),
            timestamp: new Date(),
        };
    }

    private toHealthStatus(ok: boolean): healthProto.HealthStatus {
        return ok
            ? healthProto.HealthStatus.HEALTH_STATUS_OK
            : healthProto.HealthStatus.HEALTH_STATUS_FAIL;
    }
}

export default HealthUseCase;
