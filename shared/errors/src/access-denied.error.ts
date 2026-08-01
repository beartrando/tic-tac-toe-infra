// import * as errorProto from "./contracts/proto/common/error";
import * as errorProto from "./contracts/proto/common//proto/common/error";

export class AccessDeniedError extends DomainError {
    readonly code = errorProto.ErrorCode.ACCESS_DENIED;

    constructor(message = "Access denied") {
        super(message);
    }
}

export default AccessDeniedError;

