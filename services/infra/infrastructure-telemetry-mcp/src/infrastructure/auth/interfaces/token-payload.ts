import {JwtPayload} from "jsonwebtoken";

interface TokenPayload extends JwtPayload {
    sub: string;
}

export default TokenPayload;
