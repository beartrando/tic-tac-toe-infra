import {PrismaClient} from "@prisma/client";

export class DbService {
    private readonly prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    get client(): PrismaClient {
        return this.prisma;
    }

    async start(): Promise<void> {
    }

    async stop(): Promise<void> {
    }

    async check(): Promise<boolean> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return true;
        } catch {
            return false;
        }
    }
}

export default DbService;
