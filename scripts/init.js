const apiUrl = 'http://localhost:8083';

const evolutionInstances = [{ name: 'TesteWpp' }];
const bots = [{ id: 1, name: 'Bot 1', instanceName: evolutionInstances[0].name }];
const inboxes = [{ inboxId: 1, name: 'TesteWpp', instanceName: evolutionInstances[0].name }];

async function createInstances() {
    for (const instance of evolutionInstances) {
        await fetch(`${apiUrl}/instance`, {
            method: 'POST',
            body: instance,
        });
    }
}

async function createBots() {
    for (const bot of bots) {
        await fetch(`${apiUrl}/bots`, {
            method: 'POST',
            body: bot,
        });
    }
}

async function createInboxes() {
    for (const inbox of inboxes) {
        await fetch(`${apiUrl}/inboxes`, {
            method: 'POST',
            body: inbox,
        });
    }
}

async function sync() {
    await createInstances();
    
    await createBots();
    await createInboxes();
}

sync();
