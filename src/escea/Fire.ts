/* eslint-disable no-console */
import dgram from 'node:dgram';
import { readBufferAsStr, readBufferAsBool, readBufferAsInt } from './Util';

export class Fire {

  UDP_PORT = 3300;


  constructor(public ip: string) {
    //
  }

  private sendRequest(message: string): Promise<Buffer> {

    return new Promise((resolve, reject) => {
      const server = dgram.createSocket('udp4');


      server.on('message', (msg, rinfo) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = msg;
        const m = Buffer.from(res, 'hex');
        console.log(`server got: ${msg.toString('hex')} from ${rinfo.address}:${rinfo.port}`);
        resolve(m);
      });


      server.bind(this.UDP_PORT);

      const m = Buffer.from(message, 'hex');
      server.send(m, this.UDP_PORT, this.ip);



      // any longer than 3 seconds close it
      setTimeout(() => {
        server.close();
        reject('timeout');
      }, 3000);
    });

  }

  getStatus(): Promise<FireStatus> {
    return new Promise((resolve, reject) => {
      const STATUS_PLEASE = '473100000000000000000000003146';
      this.sendRequest(STATUS_PLEASE).then((m) => {
        // check the start byte
        const status = new FireStatus(
          readBufferAsBool(m, 4, 5),
          readBufferAsBool(m, 5, 6),
          readBufferAsBool(m, 6, 7),
          readBufferAsInt(m, 7, 8),
          readBufferAsInt(m, 8, 9),
        );
        resolve(status);
      }, (e)=>{
        reject(e);
      });
    });
  }
}

class FireStatus {
  constructor(public status: boolean, public fanBoost: boolean, public flameEffect: boolean,
    public desiredTemp: number, public roomTemp: number){
  }
}