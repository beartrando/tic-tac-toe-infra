import jwt from "jsonwebtoken";

import SessionAccessToken from "../../domain/session/value-objects/session-access-token.vo";

import TokenService from "../../application/ports/token-service.port";
import AuthConfig from "./interfaces/auth-config";
import TokenPayload from "./interfaces/token-payload";
import UserId from "../../domain/user/value-objects/user-id.vo";
import {TokenExpiredError} from "@shared/errors";


export class AuthService implements TokenService {
    constructor(private readonly config: AuthConfig) {
    }

    verifyAccessToken(token: SessionAccessToken): UserId {
        // logger.log(new Error().stack)
        const payload = this.payload(token, this.config.accessSecret);

        return new UserId(payload.sub);
    }

    private payload(
        token: SessionAccessToken,
        secret: jwt.Secret,
    ): TokenPayload {
        try {
            const payload = jwt.verify(token.value, secret) as TokenPayload;

            if (!payload.sub) {
                throw new Error("JWT payload missing sub");
            }

            return payload;
        } catch (e) {
            if (e instanceof jwt.TokenExpiredError) {
                throw new TokenExpiredError();
            }

            throw e;
        }
    }
}

export default AuthService;
