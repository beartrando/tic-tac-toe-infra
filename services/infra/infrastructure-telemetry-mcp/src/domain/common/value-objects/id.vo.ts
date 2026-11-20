import {randomUUID} from "crypto";

export abstract class Id<T extends Id<T>> {
    constructor(
        readonly value: string,
    ) {
        if (!value) {
            throw new Error(`${this.constructor.name} cannot be empty`);
        }

        if (/\s/.test(value)) {
            throw new Error(`${this.constructor.name} cannot contain whitespace`);
        }
    }

    static create<T extends Id<T>>(
        this: new (value: string) => T,
        value?: string,
    ): T {
        return new this(value ?? randomUUID());
    }

    equals(other: T): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

export default Id;
