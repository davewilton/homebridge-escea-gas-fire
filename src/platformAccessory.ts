
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { Fire } from './escea/Fire';
import { ExampleHomebridgePlatform } from './platform';


/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class EsceaFirePlatformAccessory {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private exampleStates = {
    On: false,
    TargetTemperature: 22,
    HeatingThresholdTemperature: 22,
    CurrentTemperature: 16,
    Active: this.platform.Characteristic.Active.INACTIVE,
  };

  private cookie: { value: string; expires: Date } = {
    value: '',
    expires: new Date(Date.now()),
  };


  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    public readonly ipAddress: string,
    public readonly username: string,
    public readonly password: string,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Escea')
      .setCharacteristic(this.platform.Characteristic.Model, 'Gas Fire')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'NA');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.HeaterCooler) ||
    this.accessory.addService(this.platform.Service.HeaterCooler);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb


    // create handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onGet(this.handleActiveGet.bind(this))
      .onSet(this.handleActiveSet.bind(this));

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))             // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));             // GET - bind to the `getOn` method below

    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .onSet(this.setTargetTemperature.bind(this))
      .onGet(this.getTargetTemperature.bind(this));


    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onSet(this.setCurrentTemperature.bind(this))
      .onGet(this.getCurrentTemperature.bind(this));


    // without this it won't show the temperature dial in iOS
    this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
      .onSet(this.setHeatingThresholdTemperature.bind(this))
      .onGet(this.getHeatingThresholdTemperature.bind(this));


    this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState,
      this.platform.Characteristic.AccessCodeControlPoint.CurrentHeatingCoolingState.HEAT);

    this.service.updateCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState,
      this.platform.Characteristic.AccessCodeControlPoint.TargetHeaterCoolerState.HEAT);


    // once per min we re-check the status. Use get or continue with timeout?
    setInterval(async () => {
      this.updateOnStatus();
    }, 10000);
    this.updateOnStatus();
  }

  async updateOnStatus() {
    // push the new value to HomeKit

    const fire = new Fire(this.ipAddress);
    fire.getStatus().then(status =>{
      this.exampleStates.On = status.status;
      if(status.status){
        this.exampleStates.Active = this.platform.Characteristic.Active.ACTIVE;
      }else{
        this.exampleStates.Active = this.platform.Characteristic.Active.INACTIVE;
      }
      this.exampleStates.CurrentTemperature = status.roomTemp;
      this.exampleStates.TargetTemperature = status.desiredTemp;
      this.exampleStates.HeatingThresholdTemperature = status.desiredTemp;

      this.service.updateCharacteristic(this.platform.Characteristic.On, status.status);
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, status.roomTemp);
      this.service.updateCharacteristic(this.platform.Characteristic.TargetTemperature, status.desiredTemp);
      this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, status.desiredTemp);

      this.platform.log.debug('updateOnStatus ->', status);
    });

  }


  /**
   * Handle requests to get the current value of the "Active" characteristic
   */
  handleActiveGet() {
    this.platform.log.debug('Get Characteristic handleActiveGet ->', this.exampleStates.Active);

    return this.exampleStates.Active;
  }

  /**
     * Handle requests to set the "Active" characteristic
     */
  handleActiveSet(value) {
    this.platform.log.debug('Set handleActiveSet On ->', value);
    this.exampleStates.Active = value;
  }



  async setOn(value: CharacteristicValue) {
    this.platform.log.debug('Set Characteristic On ->', value);
    // implement your own code to turn your device on/off
    this.exampleStates.On = value as boolean;
  }

  async getOn(): Promise<CharacteristicValue> {
    this.platform.log.debug('EsceaFirePlatformAccessory:: getOn:', this.ipAddress);
    return this.exampleStates.On;
  }

  async setTargetTemperature(value: CharacteristicValue) {
    this.platform.log.debug('Set Characteristic TargetTemperature ->', value);
    // implement your own code to turn your device on/off
    this.exampleStates.TargetTemperature = value as number;
  }

  async getTargetTemperature() {
    return this.exampleStates.TargetTemperature;
  }

  async setCurrentTemperature(value: CharacteristicValue) {
    this.platform.log.debug('Set Characteristic TargetTemperature ->', value);
    // implement your own code to turn your device on/off
    this.exampleStates.CurrentTemperature = value as number;
  }

  async getCurrentTemperature() {
    this.platform.log.debug('Set CurrentTemperature::', this.exampleStates.CurrentTemperature);
    return this.exampleStates.CurrentTemperature;
  }

  async setHeatingThresholdTemperature(value: CharacteristicValue) {
    this.platform.log.debug('Set HeatingThresholdTemperature::', value);
    // implement your own code to turn your device on/off
    this.exampleStates.HeatingThresholdTemperature = value as number;
  }

  async getHeatingThresholdTemperature() {
    this.platform.log.debug('get HeatingThresholdTemperature::', this.exampleStates.HeatingThresholdTemperature);
    return this.exampleStates.HeatingThresholdTemperature;
  }

}


// old code tried doing it with html page but was flaky and crashed fire

// async getOn(): Promise<CharacteristicValue> {

//   this.platform.log.debug('EsceaFirePlatformAccessory:: getOn:', this.ipAddress);


//   return new Promise((resolve, reject) => {

//     this.getCookie().then(cookie => {
//       const config = {
//         headers: {
//           'Cookie': 'token=' + cookie,
//         },
//       };
//       axios.post(this.ipAddress, null, config)
//         .then((res) => {
//           const htmlText: string = res.data;
//           this.platform.log.debug('status resp === ' + htmlText);
//           const status = htmlText.indexOf('name="ON_OFF_SWITCH" value="Off" checked') > -1;
//           this.platform.log.debug('status === ' + !status);
//           resolve(!status);
//         }).catch((err) => {
//           this.platform.log.error(err);
//           reject(false);
//         });
//     }, () => {
//       this.platform.log.error('error getting cookie');
//     });

//   });

// }

// async getCookie() {

//   // if the cookie is still valid use it
//   if (this.cookie && this.cookie.value && this.cookie.expires.getTime() > Date.now()) {
//     return this.cookie.value;
//   }

//   const user = MD5(this.username);
//   const pass = MD5(this.password);

//   const data = `user=${user}&password=${pass}`;

//   this.platform.log.debug('getting new cookie');

//   return new Promise((resolve, reject) => {

//     axios.post(this.ipAddress + 'doLogin.html', data)
//       .then((res) => {
//         const htmlText: string = res.data;
//         this.platform.log.debug('cookie response === ' + htmlText);

//         const textToFind1 = '<input type="text" name="token" id="token" value=';
//         const textToFind2 = 'maxlength="40" size="40"/></form>';
//         let cookie = htmlText.slice(htmlText.indexOf(textToFind1) + textToFind1.length, htmlText.indexOf(textToFind2));
//         cookie = cookie.replace('"', '').replace('"', '').trim();
//         this.platform.log.debug('cookie === ' + cookie);
//         this.cookie.value = cookie;
//         const date = new Date();
//         date.setMinutes(date.getMinutes() + 360);
//         this.cookie.expires = date; // store cookie for 360 min. This is what the web page does
//         resolve(cookie);
//       }).catch((err) => {
//         reject();
//         this.cookie.value = '';
//         this.platform.log.error(err);
//       });
//   });
// }


// /**
//  * Handle "SET" requests from HomeKit
//  * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
//  */
//  async setOn(value: CharacteristicValue) {

//   // implement your own code to turn your device on/off
//   this.exampleStates.On = value as boolean;

//   this.platform.log.debug('Set Characteristic On ->', value);

//   const valueStr = value ? 'on' : 'off';

//   const data = 'ON_OFF_SWITCH=' + valueStr;

//   const cookie = await this.getCookie();

//   // implement your own code to check if the device is on
//   const config = {
//     headers: {
//       'Cookie': 'token=' + cookie,
//     },
//   };
//   axios.post(this.ipAddress, data, config)
//     .then((res) => {
//       const htmlText: string = res.data;
//       this.platform.log.debug('setOn status resp === ' + htmlText);
//     }).catch((err) => {
//       this.platform.log.error(err);
//     });
// }
