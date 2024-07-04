// declare function require(moduleName: string): any;
const { Client } = require('rustrcon');

const rcon = new Client({
  ip: '136.243.75.253',
  port: 28016,
  password: 'mO8yE3B5',
});

rcon.login();
rcon.on('connected', () => {
  console.log(`Connected to ${rcon.ws.ip}:${rcon.ws.port}`);

  // ПОЛУЧЕНИЕ КАРТЫ СЕРВЕРА
  rcon.send('serverinfo', 'M3RCURRRY', 3);
  // ПОЛУЧЕНИЕ ИНФЫ О СЕРВЕРЕ
  rcon.send('server.levelurl', 'M3RCURRRY', 3);
});

rcon.on('error', (err) => {
  console.error(err);
});

rcon.on('disconnect', () => {
  console.log('Disconnected from RCON websocket');
});

rcon.on('message', (message) => {
  console.log(message);
});
