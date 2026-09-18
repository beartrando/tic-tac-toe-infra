import DomainError from "./domain.error";
import * as errorProto from "../contracts/proto/common/error";

export class InvalidResponseError extends DomainError {
    readonly code = errorProto.ErrorCode.INVALID_RESPONSE;

    constructor(serviceName: string) {
        super(serviceName + " service returned invalid response");
    }
}

export default InvalidResponseError;
