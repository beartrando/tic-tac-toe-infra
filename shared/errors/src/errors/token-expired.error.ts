import * as errorProto from "../contracts/proto/common/error";
import DomainError from "./domain.error";

export class TokenExpiredError extends DomainError {
    readonly code = errorProto.ErrorCode.TOKEN_EXPIRED;

    constructor() {
        super(`Token expired`);
    }
}

export default TokenExpiredError;
