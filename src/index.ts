import cors from "cors";
import { PrismaClient } from '@prisma/client';
import express, { Express, Handler, Request, Response, json } from "express";
import { CreateInstanceDTO, CreateBotDTO, SwitchBotDTO, BotDTO, TypebotSessionDTO, GetBotBySessionDTO, CreateInboxDTO } from "./types";
import { changeTypebotStatus } from "./utils";

const PORT = process.env.PORT || 8083;
const EVOLUTION_API_TOKEN = '';
const LOG_PREFFIX = process.env.LOG_PREFFIX || "[Typebot manager]";

function log(msg: unknown, severity: "log" | "warn" | "error" = "log", driver: ('console')[] = ['console']) {
  if (driver.includes('console')) console[severity]?.(`${LOG_PREFFIX}: ${String(msg)}`);
}

const logger: Handler = (req, _, next) => {
    const { method, path } = req;
    
    log(`Received "${method}" request to "${path}"`);
    next();
};

const app: Express = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(json());

app.post('/instances', logger, async (req: Request<unknown, unknown, CreateInstanceDTO>, res: Response) => {
    const { body } = req;

    try {
        const { name } = body
        await prisma.evolutionInstance.create({ data: { name } });

        log(`Instance "${name}" created successfully`);
        res.status(201).send();
    } catch (e) {
        log(e, 'error');
        res.status(400).send(e);
    }
});

app.post('/inboxes', logger, async (req: Request<unknown, unknown, CreateInboxDTO>, res: Response) => {
    const { body } = req;

    try {
        const { instanceName } = body;

        const instance = await prisma.evolutionInstance.findFirst({ where: { name: instanceName } });
        
        if (!instance) {
            const message = `Instance "${instanceName}" does not exist`;

            log(message, 'error');
            return res.status(404).send({ reason: 'Instance not found', message });
        }

        await prisma.chatwootInbox.create({ data: body })
        log(`Successfully created inbox "${body.name}" (${body.inboxId}) of instance "${instanceName}"`);

        res.status(201).send();
    } catch (e) {
        log(e, 'error');
        res.status(400).send({ reason: '', message: (e as Error)?.message || String(e) });
    }
});

app.get('/bots/:instanceName?', logger, async (req: Request<{ instanceName: string }>, res: Response<BotDTO[] | unknown>) => {
    const { params } = req;

    try {
        const { instanceName } = params;
        const where = instanceName ? { instance: { name: instanceName } } : undefined;

        const bots = (await prisma.bot.findMany({ where, include: { instance: true } })) ?? [];
        
        log(`Successfully retrieved ${bots.length} bots`);
        res.status(200).send(bots);
    } catch (e) {
        log(e, 'error')
        res.status(500).send({ reason: 'Internal server error', message: String((e as Error)?.message || e) });
    }
});

app.post('/bots', logger, async (req: Request<unknown, unknown, CreateBotDTO>, res: Response) => {
    const { body } = req;

    try {
        const { id, name, instanceName } = body;
        await prisma.bot.create({ data: { id, name, instanceName } });

        log(`Bot "${name}" in instance "${instanceName}" created successfully`);
        res.status(201).send();
    } catch (e) {
        log(e, 'error');
        res.status(400).send(e);
    }
});

app.delete('/sessions/:remoteJid', logger, async (req: Request<{ remoteJid: string }>, res: Response) => {
    const { params } = req;
    
    try {
        const { remoteJid } = params;

        await prisma.typebotSession.delete({ where: { remoteJid } });
    } catch (e) {
        log(e, 'error');
        res.status(400).send(e);
    }
});

app.get('/sessions/:remoteJid', logger, async (req: Request<{ remoteJid: string }>, res: Response<TypebotSessionDTO | unknown>) => {
    const { params } = req;
    
    try {
        const { remoteJid } = params;

        const bot = await prisma.bot.findFirst({ where: { sessions: { some: { remoteJid } } }, include: { sessions: true } });
        if (!bot) {
            log(`Bot for session "${remoteJid}"`, 'error');
            return res.status(404).send();
        }

        res.status(200).send(bot);
    } catch (e) {
        log(e, 'error');
        res.status(400).send(e);
    }
});

app.post('/sessions/:remoteJid/bot/toogle', logger, async (req: Request<{ remoteJid: string }, unknown, { instanceName: string }>, res: Response) => {
    const { body, params } = req;
    
    try {
        const { remoteJid } = params;
        const { instanceName } = body;
        await changeTypebotStatus(remoteJid, instanceName, EVOLUTION_API_TOKEN);

        log(`Paused bot successfully`);
        res.sendStatus(200);
    } catch (e) {
        log(`An error has occurred. ${String(e)}`, 'error');
        res.status(500).send({ reason: '', message: String(e) });
    }
});

app.post('/sessions/:remoteJid/bot', logger, async (req: Request<{ remoteJid: string }, SwitchBotDTO, SwitchBotDTO>, res: Response<SwitchBotDTO | unknown>) => {
    const { body, params } = req;

    try {
        const { remoteJid } = params;
        const { botId, inboxId, instanceName } = body;

        const bot = await prisma.bot.findFirst({ where: { AND: { id: botId, instanceName } } });

        if (!bot) {
            const message = `Bot "${botId}" of instance ${instanceName} not found`;

            log(message, 'error');
            return res.status(404).send({ reason: 'Not found', message });
        }

        const session = await prisma.typebotSession.findFirst({ where: { remoteJid } });
        
        const message = session ? `Session for "${remoteJid}" already exists. Updating...` : `Session for "${remoteJid}" does not exist. Creating a new one...`;
        log(message);

        if (session) {
            await prisma.typebotSession.update({ where: { remoteJid }, data: { botId } });
        } else {
            log(botId);
            await prisma.typebotSession.create({ data: { remoteJid, inboxId, instanceName, botId }, include: { bot: false } });
        }

        log(`Session for user "${remoteJid}" is now using bot "${bot.name}" ("${botId}")`);
        res.status(200).send(body);
    } catch (e) {
        log(e, 'error');
        res.status(400).send(e);
    }
});

app.get('/health', logger, (_, res) => {
    res.send(`${LOG_PREFFIX}: I'm ok!`);
});

app.listen(PORT, () => {
  log('Started successfully');
  log(`Now listening to port "::${PORT}"`);
});
