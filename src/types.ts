export type CreateInstanceDTO = {
    name: string
};

export type CreateBotDTO = {
  id: string;
  name: string;
  instanceName: string;
};

export type CreateInboxDTO = {
    name: string;
    inboxId: number;
    instanceName: string;
};

export type SwitchBotDTO = {
    botId: string;
    inboxId: number;
    instanceName: string;
};

export type GetBotBySessionDTO = {
    remoteJid: string;
};

export type InstanceDTO = {
    name: string;
}

export type BotDTO = {
    id: string;
    name: string;
    instanceName: string;
    instance: InstanceDTO;
};

export type TypebotSessionDTO = {
    id: number;
    bot: BotDTO;
    botId: string;
    remoteJid: string;
}
