export { PgBossManager } from './manager';

export {
  PgBossConfig,
  WorkerHandler,
  BatchWorkerHandler,
  WorkerRegistration,
  BatchWorkerRegistration,
} from './types';

import { PgBossManager } from './manager';

const pgBossManager = new PgBossManager();

export default pgBossManager;
