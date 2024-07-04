import { Injectable } from '@nestjs/common';
import { Client } from 'rustrcon';
import { ServersService } from '../servers/servers.service';

@Injectable()
export class RconService {
  private rcon: Client;

  // constructor(private serversService: ServersService) {}
  startChecking() {
    const rcon_host = '62.122.215.98';
    const rcon_port = 38015;
    const rcon_password = 'kGkMdsdWersajwsUc1H';
    console.log(123);

    this.rcon = new Client({
      ip: rcon_host,
      port: rcon_port,
      password: rcon_password,
    });
    try {
      this.rcon.login();
    } catch (error) {
      console.log(error);
    }

    this.rcon.on('connected', () => {
      console.log(`Connected to ${this.rcon.ws.ip}:${this.rcon.ws.port}`);

      // ПОЛУЧЕНИЕ КАРТЫ СЕРВЕРА
      this.rcon.send('serverinfo', 'M3RCURRRY', 333);
      // ПОЛУЧЕНИЕ ИНФЫ О СЕРВЕРЕ
      this.rcon.send('server.levelurl', 'M3RCURRRY', 333);
    });

    this.rcon.on('error', (err) => {
      console.error(err);
    });

    this.rcon.on('disconnect', () => {
      console.log('Disconnected from RCON websocket');
    });

    this.rcon.on('message', (message) => {
      console.log(message);

      if (message.Identifier === 333) {
        // this.serversService.setMap(rcon_host + ':' + rcon_port, '123');
        console.log('Server info:', message);
      } else if (message.Identifier === 222) {
        console.log('Level URL:', message);
      }
    });
  }
}
