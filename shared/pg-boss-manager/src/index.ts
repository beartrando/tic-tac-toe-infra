export * from './types';
import {PgBossManager} from './pg-boss-manager';
export type { SqlExecutor } from "./internal/interfaces";

const pgBossManager = new PgBossManager();

export default pgBossManager;
