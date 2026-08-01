import DomainError from "./domain.error";
import {ErrorCode} from "./contracts/proto/common/error";

export class InvalidAuthorizationError extends DomainError {
    readonly code = ErrorCode.ACCESS_DENIED;

    constructor() {
        super("Missing or invalid Authorization header");
    }
}

export default InvalidAuthorizationError;
