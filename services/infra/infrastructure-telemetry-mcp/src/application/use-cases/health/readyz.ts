import * as healthProto from "../../../contracts/proto/common/health";

export class ReadyzUseCase {
    async execute(): Promise<healthProto.ReadyStatus> {
        return {ready: true};
    }
}

export default ReadyzUseCase;
