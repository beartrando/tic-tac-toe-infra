import * as errorProto from "../contracts/proto/common/error";
import DomainError from "./domain.error";

export class ServiceUnavailableError extends DomainError {
    readonly code = errorProto.ErrorCode.SERVICE_UNAVAILABLE;

    constructor(serviceName?: string) {
        super(serviceName ? `${serviceName} service unavailable` : "Service unavailable");
    }
}

export default ServiceUnavailableError;

