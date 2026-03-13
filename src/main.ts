import { createApp } from "./app";
import { initLogger } from "./config/logger";
import { initPrisma } from "./config/prisma";
import { initRedis } from "./config/redis";
import { registerConsumers } from "./infrastructure/consumers";
import { setPrismaClient } from "./infrastructure/persistence/mysql/PrismaClient";
import { setRedisClient } from "./infrastructure/persistence/redis/RedisClient";
import { createServer } from "http";
import { initWS } from "./infrastructure/ws/websocket";
import { bifastList } from "./config/bifastlist";

async function bootstrap() {
    const logger = initLogger();
    // const redis = await initRedis();
    // if (redis != undefined) {
    //     logger.info('Redis initialized')
    //     setRedisClient(redis);
    // }

    const prisma = await initPrisma();
    setPrismaClient(prisma);

    try {
        await prisma.$connect()
        await prisma.$executeRaw`DELETE FROM incidents`
        await prisma.$executeRaw`DELETE FROM monitoring_state`
        await prisma.$executeRaw`DELETE FROM monitoring_events`
        // await prisma.$executeRaw`CREATE TABLE test(row1 VARCHAR(255), row2 VARCHAR(255))`
        const result = await prisma.$queryRaw`SELECT * FROM monitoring_state`
        console.log(result);
        // const describe = await prisma.$queryRaw`DESC test`
        // console.log(describe);
        const values = bifastList.map((bank) => `('BIFAST', '${bank.nama_bank}', 'OPEN', UNIX_TIMESTAMP() * 1000)`).join(",")
        const query = `INSERT INTO monitoring_state (source, entity, last_status, last_changed_at) VALUES ${values}`
        await prisma.$executeRawUnsafe(query)
    } catch (error) {
        await prisma.$disconnect()
        console.error(error);
    }

    const app = createApp();
    const port = Number(process.env.PORT || 3000);
    const server = createServer(app);
    server.listen(port, () => logger.info(`listening ${port}`));
    initWS(server, logger) // webhook

    // wire consumers (whatsapp, fetch jobs) after infra init
    await registerConsumers(
        logger
    )
}

bootstrap().catch(err => {
    console.error("bootstrap fail", err);
    process.exit(1);
})