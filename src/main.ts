import { createApp } from "./app";
import { initLogger } from "./config/logger";
import { initPrisma } from "./config/prisma";
import { initRedis } from "./config/redis";
import { registerConsumers } from "./infrastructure/consumers";
import { setPrismaClient } from "./infrastructure/persistence/mysql/PrismaClient";
import { setRedisClient } from "./infrastructure/persistence/redis/RedisClient";

async function bootstrap() {
    const logger = initLogger();
    const redis = await initRedis();
    if (redis != undefined) {
        logger.info('Redis initialized')
        setRedisClient(redis);
    }

    const prisma = await initPrisma();
    setPrismaClient(prisma);

    const app = createApp();
    const port = Number(process.env.PORT || 3000);
    app.listen(port, () => logger.info(`listening ${port}`));

    // wire consumers (whatsapp, fetch jobs) after infra init
    await registerConsumers(
        logger
    )
}

bootstrap().catch(err => {
    console.error("bootstrap fail", err);
    process.exit(1);
})