/** @type {import('pnpm').Hooks} */
module.exports = {
    hooks: {
        readPackage(pkg) {
            // Одобряем безопасные скрипты
            const allowList = [
                '@prisma/client',
                'bcrypt',
                'protobufjs',
                'prisma',
                'unrs-resolver',
            ];

            if (pkg.scripts && pkg.scripts.install) {
                if (!allowList.includes(pkg.name)) {
                    console.warn(`⚠️ Скрипт install у ${pkg.name} будет проигнорирован`);
                    delete pkg.scripts.install;
                }
            }

            return pkg;
        },
    },
};
