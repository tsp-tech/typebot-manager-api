export const getTypebotInfo = async (apikey: string) => {
    const options = { method: 'GET', headers: { apikey } };
  
    try {
      const res = await fetch('http://localhost:8080/typebot/find/TesteWpp', options)
      const data = await res.json();
  
      if (!data) throw res;
  
      return data;
    } catch (e) {
      console.log(e);
    }
};

export const changeTypebotStatus = async (remoteJid: string, instanceName: string, apikey: string, newStatus: 'opened' | 'closed' | 'paused' = 'paused') => {
    const status = newStatus || 'paused';
  
    const options = {
      method: 'POST',
      headers: {apikey, 'Content-Type': 'application/json'},
      body: `{"remoteJid":"${remoteJid}","status":"${status}"}`
    };

    const res = await fetch(`http://localhost:8080/typebot/changeStatus/${instanceName}`, options);

    const data = await res.json();
    if (!data) throw res;

    return data;
}