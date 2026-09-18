import * as errorProto from "../contracts/proto/common/error";
import DomainError from "./domain.error";

export class UnknownError extends DomainError {
    readonly code = errorProto.ErrorCode.UNKNOWN;
}

export default UnknownError;

