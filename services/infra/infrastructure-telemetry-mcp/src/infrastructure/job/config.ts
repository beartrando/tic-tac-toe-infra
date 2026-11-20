export const jobConfig = {
    max: Number(process.env.PG_BOSS_MAX ?? 5),
    maintenanceIntervalSeconds: Number(process.env.PG_BOSS_MAINTENANCE_INTERVAL_SECONDS ?? 60),
    applicationName: process.env.PG_BOSS_APPLICATION_NAME ?? 'infrastructure-telemetry-mcp-pg-boss',
};

export default jobConfig;
