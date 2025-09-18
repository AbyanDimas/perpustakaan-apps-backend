import express from 'express';

let clients: { id: number; res: express.Response }[] = [];

export const addClient = (client: { id: number; res: express.Response }) => {
  clients.push(client);
  console.log(`Client ${client.id} connected to SSE stream.`);
};

export const removeClient = (clientId: number) => {
  clients = clients.filter(client => client.id !== clientId);
  console.log(`Client ${clientId} disconnected.`);
};

export const sendEventToClients = (data: any) => {
  console.log('Sending event to all clients:', data);
  clients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}

`));
};
