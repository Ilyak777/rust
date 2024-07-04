const express = require('express');
const { Client } = require('rustrcon');

const app = express();
const port = 3000;

const rcon_host = '62.122.215.98';
const rcon_port = 38015;
const rcon_password = 'kGkMdsdWersajwsUc1H';

export const rcon = new Client({
  ip: rcon_host,
  port: rcon_port,
  password: rcon_password,
});

rcon.login();

rcon.on('connected', () => {
  console.log(`Connected to ${rcon.ws.ip}:${rcon.ws.port}`);

  // ПОЛУЧЕНИЕ КАРТЫ СЕРВЕРА
  rcon.send('serverinfo', 'M3RCURRRY', 333);
  // ПОЛУЧЕНИЕ ИНФЫ О СЕРВЕРЕ
  rcon.send('server.levelurl', 'M3RCURRRY', 222);
});

rcon.on('error', (err) => {
  console.error(err);
});

rcon.on('disconnect', () => {
  console.log('Disconnected from RCON websocket');
});

rcon.on('message', (message) => {
  if (message.Identifier === 333) {
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
