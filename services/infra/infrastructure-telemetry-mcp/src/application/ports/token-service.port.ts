import SessionAccessToken from "../../domain/session/value-objects/session-access-token.vo";
import UserId from "../../domain/user/value-objects/user-id.vo";

export interface TokenService {
    verifyAccessToken(
        token: SessionAccessToken,
    ): UserId;
}

export default TokenService;
