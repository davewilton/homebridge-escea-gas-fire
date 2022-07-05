/* eslint-disable no-undef */
/* eslint-disable no-console */

// import axios from 'axios';

// // eslint-disable indent
// const ipAddress = 'http://192.168.1.27/';


// const config = {
//   headers: {
//     'Cookie': 'token=9ea2775b1773fa0da76b89fc33c6d148',
//   },
// };
// axios.post(ipAddress, null, config)
//   .then((res) => {
//     const htmlText = res.data;
//     const status = htmlText.slice(htmlText.indexOf('name="ON_OFF_SWITCH" value="') + 28,
//       htmlText.indexOf('name="ON_OFF_SWITCH" value="') + 31);
//     console.log(status);
//   }).catch((err) => {
//     console.error(err);
//   });

import dgram from 'node:dgram';

const server = dgram.createSocket('udp4');
const UDP_PORT = 3300;
const ip = '192.168.1.27';
const STATUS_PLEASE = '473100000000000000000000003146';
server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

const readBufferAsInt = (buffer, start, end)=>{
  return parseInt(buffer.slice(start, end).toString('hex'), 16);
};

const readBufferAsBool = (buffer, start, end)=>{
  return readBufferAsInt(buffer, start, end) === 1;
};

const readBufferAsStr = (buffer, start, end)=>{
  return buffer.slice(start, end).toString();
};


server.on('message', (msg, rinfo) => {
  const m = Buffer.from(msg, 'hex');
  // check the start byte
  console.log(rinfo);
  console.log('Start byte is', readBufferAsStr(m, 0, 1));
  console.log('fire status on ===', readBufferAsBool(m, 4, 5));
  console.log('fan boost status on === ' + readBufferAsBool(m, 5, 6));
  console.log('flame effect status on === ' + readBufferAsBool(m, 6, 7));
  console.log('Desired temperature is ' +readBufferAsInt(m, 7, 8));
  console.log('Room temperature is ' + readBufferAsInt(m, 8, 9));
  console.log(`server got: ${msg.toString('hex')} from ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(UDP_PORT);

// const m = Buffer.from(STATUS_PLEASE, 'hex');
// server.send(m, UDP_PORT, ip);

const setTemp= (temp)=>{
  temp = Math.ceil(temp); // must be an int
  if(temp < 3 || temp > 31){
    resolve(false); // outside range
  }
  temp = temp -6; // how do you convert this to the correct hex? -6 works
  const POWER_ON = `475701${temp}0000000000000000003146`;
  console.log(POWER_ON);
  const m = Buffer.from(POWER_ON, 'hex');
  server.send(m, UDP_PORT, ip);
};
console.log('setTemp');
setTemp(22);

setTimeout(()=>{
  server.close();
}, 1000);
