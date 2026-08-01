import * as errorProto from "./contracts/proto/common/error";
import DomainError from "./domain.error";

export class NotFoundError extends DomainError {
    readonly code = errorProto.ErrorCode.NOT_FOUND;

    constructor(entity: string) {
        super(`${entity} not found`);
    }
}

export default NotFoundError;
