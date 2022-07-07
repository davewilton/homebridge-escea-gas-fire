/* eslint-disable no-console */
import dgram from 'node:dgram';
import { decimalToHexString, readBufferAsBool, readBufferAsInt } from './Util';

export class Fire {

  UDP_PORT = 3300;
  server: dgram.Socket | undefined;

  constructor(public ip: string) {
    //
  }

  private sendRequest(message: string): Promise<Buffer> {

    return new Promise((resolve, reject) => {
      try {

        if(!this.server){
          this.server = dgram.createSocket('udp4');

          this.server.on('message', (msg) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = msg;
            const m = Buffer.from(res, 'hex');
            resolve(m);
          });

          this.server.bind(this.UDP_PORT);

          // close the server after 1 second
          setTimeout(()=>{
            if(this.server){
              this.server.close();
              this.server = undefined;
            }
          }, 1000);
        }

        const m = Buffer.from(message, 'hex');
        this.server.send(m, this.UDP_PORT, this.ip);

      } catch (error) {
        reject(error);
      }
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
        console.error(e);
        reject(e);
      });
    });
  }

  setOn() {
    return new Promise((resolve, reject) => {
      const POWER_ON = '473900000000000000000000003146';
      this.sendRequest(POWER_ON).then(() => {
        resolve(true);
      }, (e)=>{
        console.error(e);
        reject(false);
      });
    });
  }

  setOff() {
    return new Promise((resolve, reject) => {
      const POWER_ON = '473A00000000000000000000003146';
      this.sendRequest(POWER_ON).then(() => {
        resolve(true);
      }, (e)=>{
        console.error(e);
        reject(false);
      });
    });
  }

  setTemp(temp: number) {
    temp = Math.ceil(temp); // must be an int
    return new Promise((resolve, reject) => {
      if (temp < 10 || temp > 31) {
        resolve(false); // outside range
      }
      temp = decimalToHexString(temp);
      const SET_TEMP = `475701${temp}0000000000000000003146`;
      this.sendRequest(SET_TEMP).then(() => {
        resolve(true);
      }, (e) => {
        console.log(e);
        reject(false);
      });
    });
  }
}

class FireStatus {
  constructor(public status: boolean, public fanBoost: boolean, public flameEffect: boolean,
    public desiredTemp: number, public roomTemp: number) {
  }
}