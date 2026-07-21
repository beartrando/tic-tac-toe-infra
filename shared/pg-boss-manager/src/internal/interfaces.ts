import {PgBoss} from "pg-boss";

export interface BossProvider {
    getBoss(): PgBoss;
}
