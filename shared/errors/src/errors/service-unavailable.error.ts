import * as errorProto from "../contracts/proto/common/error";
import DomainError from "./domain.error";

export class ServiceUnavailableError extends DomainError {
    readonly code = errorProto.ErrorCode.SERVICE_UNAVAILABLE;

    constructor(serviceName?: string) {
        super((serviceName ?? '') + " service unavailable");
    }
}

export default ServiceUnavailableError;

