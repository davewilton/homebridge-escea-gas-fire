/* eslint-disable no-undef */
/* eslint-disable no-console */

import axios from 'axios';

// eslint-disable indent
const ipAddress = 'http://192.168.1.27/';


const config = {
  headers: {
    'Cookie': 'token=9ea2775b1773fa0da76b89fc33c6d148',
  },
};
axios.post(ipAddress, null, config)
  .then((res) => {
    const htmlText = res.data;
    const status = htmlText.slice(htmlText.indexOf('name="ON_OFF_SWITCH" value="') + 28,
      htmlText.indexOf('name="ON_OFF_SWITCH" value="') + 31);
    console.log(status);
  }).catch((err) => {
    console.error(err);
  });