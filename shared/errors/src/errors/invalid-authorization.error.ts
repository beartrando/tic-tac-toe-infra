import DomainError from "./domain.error";
import * as errorProto from "../contracts/proto/common/error";

export class InvalidAuthorizationError extends DomainError {
    readonly code = errorProto.ErrorCode.ACCESS_DENIED;

    constructor() {
        super("Missing or invalid Authorization header");
    }
}

export default InvalidAuthorizationError;
