import DomainError from "./domain.error";
import * as errorProto from "../contracts/proto/common/error";

export class InvalidAuthorizationError extends DomainError {
    readonly code = errorProto.ErrorCode.INVALID_AUTHORIZATION;

    constructor() {
        super("Missing or invalid Authorization header");
    }
}

export default InvalidAuthorizationError;
