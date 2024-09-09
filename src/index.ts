import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import express, { Express, Request, Response, json } from 'express';
import { CreateInstanceDTO, CreateBotDTO, SwitchBotDTO, BotDTO, TypebotSessionDTO, CreateInboxDTO } from './types';
import { changeTypebotStatus } from './utils';
import { EVOLUTION_API_TOKEN, LOG_FILE, LOG_FILE_OPTIONS, LOG_PREFFIX, PORT, log, logger } from './util';
import { readFile } from 'fs';

const app: Express = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(json());

/** Registers an EvolutionAPI instance */
app.post('/instances', logger, async (req: Request<unknown, unknown, CreateInstanceDTO>, res: Response) => {
  const { body } = req;

  try {
    const { name } = body;
    await prisma.evolutionInstance.create({ data: { name } });

    log(`Instance "${name}" created successfully`, true);
    res.status(201).send();
  } catch (e) {
    log(e, true, 'error');
    res.status(400).send(e);
  }
});

/** Registers a Chatwoot Inbox */
app.post('/inboxes', logger, async (req: Request<unknown, unknown, CreateInboxDTO>, res: Response) => {
  const { body } = req;

  try {
    const { instanceName } = body;

    const instance = await prisma.evolutionInstance.findFirst({ where: { name: instanceName } });

    if (!instance) {
      const message = `Instance "${instanceName}" does not exist`;

      log(message, true, 'error');
      return res.status(404).send({ reason: 'Instance not found', message });
    }

    await prisma.chatwootInbox.create({ data: body });
    log(`Successfully created inbox "${body.name}" (${body.inboxId}) of instance "${instanceName}"`);

    res.status(201).send();
  } catch (e) {
    log(e, true, 'error');
    res.status(400).send({ reason: '', message: (e as Error)?.message || String(e) });
  }
});

/** Get all bots; optionally filtered by their respective instances */
app.get(
  '/bots/:instanceName?',
  logger,
  async (req: Request<{ instanceName: string }>, res: Response<BotDTO[] | unknown>) => {
    const { params } = req;

    try {
      const { instanceName } = params;
      const where = instanceName ? { instance: { name: instanceName } } : undefined;

      const bots = (await prisma.bot.findMany({ where, include: { instance: true } })) ?? [];

      log(`Successfully retrieved ${bots.length} bots`, true);
      res.status(200).send(bots);
    } catch (e) {
      log(e, true, 'error');
      res.status(500).send({ reason: 'Internal server error', message: String((e as Error)?.message || e) });
    }
  },
);

/** Registers a Typebot bot */
app.post('/bots', logger, async (req: Request<unknown, unknown, CreateBotDTO>, res: Response) => {
  const { body } = req;

  try {
    const { id, name, instanceName } = body;
    await prisma.bot.create({ data: { id, name, instanceName } });

    log(`Bot "${name}" in instance "${instanceName}" created successfully`, true);
    res.status(201).send();
  } catch (e) {
    log(e, true, 'error');
    res.status(400).send(e);
  }
});

/** Removes a session, if it exists */
app.delete('/sessions/:remoteJid', logger, async (req: Request<{ remoteJid: string }>, res: Response) => {
  const { params } = req;

  try {
    const { remoteJid } = params;

    await prisma.typebotSession.delete({ where: { remoteJid } });

    log(`Successfully delete session for ${remoteJid}`, true);
  } catch (e) {
    log(e, true, 'error');
    res.status(400).send(e);
  }
});

/** Get all relevant info regarding a session/chat, including which bot is currently assigned to it */
app.get(
  '/sessions/:remoteJid',
  logger,
  async (req: Request<{ remoteJid: string }>, res: Response<TypebotSessionDTO | unknown>) => {
    const { params } = req;

    try {
      const { remoteJid } = params;

      const bot = await prisma.bot.findFirst({
        where: { sessions: { some: { remoteJid } } },
        include: { sessions: true },
      });
      if (!bot) {
        log(`Bot for session "${remoteJid}"`, true, 'error');
        return res.status(404).send();
      }

      res.status(200).send(bot);
    } catch (e) {
      log(e, true, 'error');
      res.status(400).send(e);
    }
  },
);

/** Pauses the Typebot bot associated to an EvolutionAPI
 * **Beware, EvolutionAPI is only capable of pausing the bot directly associated with an instance**
 */
app.post(
  '/sessions/:remoteJid/bot/toogle',
  logger,
  async (req: Request<{ remoteJid: string }, unknown, { instanceName: string }>, res: Response) => {
    const { body, params } = req;

    try {
      const { remoteJid } = params;
      const { instanceName } = body;
      await changeTypebotStatus(remoteJid, instanceName, EVOLUTION_API_TOKEN);

      log(`Paused bot successfully`, true);
      res.sendStatus(200);
    } catch (e) {
      log(`An error has occurred. ${String(e)}`, true, 'error');
      res.status(500).send({ reason: '', message: String(e) });
    }
  },
);

app.post(
  '/sessions/:remoteJid/bot',
  logger,
  async (req: Request<{ remoteJid: string }, SwitchBotDTO, SwitchBotDTO>, res: Response<SwitchBotDTO | unknown>) => {
    const { body, params } = req;

    try {
      const { remoteJid } = params;
      const { botId, inboxId, instanceName } = body;

      const inbox = await prisma.chatwootInbox.findFirst({ where: { inboxId } });
      const bot = await prisma.bot.findFirst({ where: { AND: { id: botId, instanceName } } });

      if (!bot) {
        const message = `Bot "${botId}" of instance ${instanceName} not found`;

        log(message, true, 'error');
        return res.status(404).send({ reason: 'Not found', message });
      }

      if (!inbox) {
        const relatedInboxes = (await prisma.chatwootInbox.count({ where: { instanceName } })) + 1;

        const name = `${instanceName} ${relatedInboxes}`;

        log(
          `Inbox of id ${inboxId} does not exist yet. Creating inbox "${name}" of id ${inboxId} for instance "${instanceName}"...`,
        );

        await prisma.chatwootInbox.create({ data: { inboxId, name, instanceName } });
      }

      const session = await prisma.typebotSession.findFirst({ where: { remoteJid } });

      const message = session
        ? `Session for "${remoteJid}" already exists. Updating...`
        : `Session for "${remoteJid}" does not exist. Creating a new one...`;
      log(message);

      if (session) {
        await prisma.typebotSession.update({ where: { remoteJid }, data: { botId } });
      } else {
        await prisma.typebotSession.create({
          data: { remoteJid, instanceName, botId, inboxId },
        });
      }

      log(`Session for user "${remoteJid}" is now using bot "${bot.name}" ("${botId}")`, true);
      res.status(200).send(body);
    } catch (e) {
      log(e, true, 'error');
      res.status(400).send(e);
    }
  },
);

app.get('/health', logger, (_, res) => {
  res.send(`${LOG_PREFFIX}: I'm ok!`);
});

app.get('/logs', logger, (_, res) => {
  readFile(LOG_FILE, (err, data) => {
    if (err) {
      return log(err, true, 'error', 'LOG');
    }

    return res.status(200).send(data.toString(LOG_FILE_OPTIONS.encoding));
  });
});

app.listen(PORT, () => {
  log('Started successfully');
  log(`Now listening to port "::${PORT}"`, true, 'log', 'inf');
});
