import DbService from "../infrastructure/db/service";
import MessageService from "../infrastructure/message/service";
import JobService from "../infrastructure/job/service";
import HealthUseCase from "../application/use-cases/health/health";
import StatusUseCase from "../application/use-cases/health/status";
import LivezUseCase from "../application/use-cases/health/livez";
import ReadyzUseCase from "../application/use-cases/health/readyz";
import HealthHandler from "../infrastructure/grpc/handlers/health.handler";
import GrpcService from "../infrastructure/grpc/service";
import grpcConfig from "../infrastructure/grpc/config";
import Application from "../application/application";
import jobConfig from "../infrastructure/job/config";
import authConfig from "../infrastructure/auth/config";
import AuthService from "../infrastructure/auth/service";
import messageConfig from "../infrastructure/message/configs/message.config";
import messageProducersConfig from "../infrastructure/message/configs/producers.config";
import InfrastructureTelemetryMcpHandler from "../infrastructure/grpc/handlers/infrastructure-telemetry-mcp.handler";

function buildApplication() {
    const authService = new AuthService(authConfig);

    const messageService = new MessageService(messageConfig);
    const jobService = new JobService(jobConfig, messageConfig, messageProducersConfig)
    const dbService = new DbService();

    const healthUseCase = new HealthUseCase(dbService, messageService, jobService);
    const statusUseCase = new StatusUseCase;
    const livezUseCase = new LivezUseCase;
    const readyzUseCase = new ReadyzUseCase;

    const InfrastructureTelemetryMcpHandler = new InfrastructureTelemetryMcpHandler();
    const healthHandler = new HealthHandler(healthUseCase, statusUseCase, livezUseCase, readyzUseCase);

    const grpcService = new GrpcService(grpcConfig.port, InfrastructureTelemetryMcpHandler, healthHandler);
    return new Application(grpcService, dbService, jobService, messageService);
}


export default buildApplication;
