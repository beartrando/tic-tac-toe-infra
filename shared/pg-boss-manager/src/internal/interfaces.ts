import { PgBoss } from 'pg-boss';

export interface BossProvider {

    /**
     * Returns active PgBoss instance.
     *
     * @throws Error if PgBoss is not connected.
     */
    getBoss(): PgBoss;

}
