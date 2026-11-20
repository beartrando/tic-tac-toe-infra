import logger from "@shared/logger";
import GrpcService from "../infrastructure/grpc/service";
import DbService from "../infrastructure/db/service";
import JobService from "../infrastructure/job/service";
import MessageService from "../infrastructure/message/service";

export class Application {
    constructor(
        private readonly grpcService: GrpcService,
        private readonly dbService: DbService,
        private readonly jobService: JobService,
        private readonly messageService: MessageService,
    ) {
    }

    async start(): Promise<void> {
        const shutdown = async () => {
            logger.info("🛑 Shutting down...");

            await this.stop();

            process.exit(0);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        try {
            await this.messageService.start();
            await this.jobService.start();
            await this.dbService.start();
            await this.grpcService.start();
            logger.info(
                '🚀 InfrastructureTelemetryMcp service started',
            );
        } catch (err) {
            logger.error(
                {err},
                '💥 Failed to start InfrastructureTelemetryMcp service',
            );
            process.exit(1);
        }
    }

    async stop() {
        await this.grpcService.stop();
        await this.dbService.stop();
        await this.jobService.stop();
        await this.messageService.stop();
    }
}

export default Application;
