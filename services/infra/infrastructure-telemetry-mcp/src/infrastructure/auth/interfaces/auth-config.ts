import jwt from "jsonwebtoken";

export interface AuthConfig {
    accessSecret: jwt.Secret;
}

export default AuthConfig;
