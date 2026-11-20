export class SessionAccessToken {
    constructor(
        readonly value: string,
    ) {
        if (!value) {
            throw new Error("SessionAccessToken cannot be empty");
        }
    }

    equals(other: SessionAccessToken): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

export default SessionAccessToken;
