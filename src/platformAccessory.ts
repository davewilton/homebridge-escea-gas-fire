
import { Service, PlatformAccessory } from 'homebridge';
import { Fire } from './escea/Fire';
import { ExampleHomebridgePlatform } from './platform';


/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class EsceaFirePlatformAccessory {
  private service: Service;

  private exampleStates = {
    On: false,
    TargetTemperature: 0,
    CurrentTemperature: 16,
    Active: this.platform.Characteristic.Active.INACTIVE,
  };

  fire: Fire;


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
    this.service = this.accessory.getService(this.platform.Service.Thermostat) ||
    this.accessory.addService(this.platform.Service.Thermostat);

    // create the fire
    this.fire = new Fire(this.ipAddress);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb


    // create handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState)
      .onGet(this.handleCurrentHeatingCoolingStateGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .onGet(this.handleTargetHeatingCoolingStateGet.bind(this))
      .onSet(this.handleTargetHeatingCoolingStateSet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .onGet(this.handleTargetTemperatureGet.bind(this))
      .onSet(this.handleTargetTemperatureSet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
      .onGet(this.handleTemperatureDisplayUnitsGet.bind(this))
      .onSet(this.handleTemperatureDisplayUnitsSet.bind(this));


    // once per min we re-check the status. Use get or continue with timeout?
    setInterval(async () => {
      this.updateOnStatus();
    }, 10000);
    this.updateOnStatus();
  }

  async updateOnStatus() {
    // push the new value to HomeKit
    this.fire.getStatus().then(status =>{
      this.platform.log.debug('updateOnStatus ->', status);

      this.exampleStates.On = status.status;
      if(status.status){
        this.exampleStates.Active = this.platform.Characteristic.Active.ACTIVE;
      }else{
        this.exampleStates.Active = this.platform.Characteristic.Active.INACTIVE;
      }

      if(!this.exampleStates.TargetTemperature){
        this.exampleStates.TargetTemperature = status.desiredTemp;
      }

      // TODO update the temp on fire
      if(this.exampleStates.TargetTemperature !== status.desiredTemp){
        this.platform.log.debug('Updating  HeatingThresholdTemperature ->', status.desiredTemp);
        this.fire.setTemp(this.exampleStates.TargetTemperature as number);
      }

      this.exampleStates.CurrentTemperature = status.roomTemp;
      this.exampleStates.TargetTemperature = status.desiredTemp;
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, status.roomTemp);
      this.service.updateCharacteristic(this.platform.Characteristic.TargetTemperature, status.desiredTemp);

    });

  }

  /**
   * Handle requests to get the current value of the "Current Heating Cooling State" characteristic
   */
  handleCurrentHeatingCoolingStateGet() {
    this.platform.log.debug('Triggered GET CurrentHeatingCoolingState');

    // we only have on and off. So if it is active return heat
    if(this.exampleStates.Active) {
      return this.platform.Characteristic.CurrentHeatingCoolingState.HEAT;
    }
    return this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
  }


  /**
   * Handle requests to get the current value of the "Target Heating Cooling State" characteristic
   */
  handleTargetHeatingCoolingStateGet() {
    // we only have on and off. So if it is active return heat
    if( this.exampleStates.On) {
      return this.platform.Characteristic.CurrentHeatingCoolingState.HEAT;
    }
    return this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
  }

  /**
   * Handle requests to set the "Target Heating Cooling State" characteristic
   */
  handleTargetHeatingCoolingStateSet(value) {
    this.platform.log.debug('Triggered SET TargetHeatingCoolingState:', value);
    this.exampleStates.On = (value === 1);
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  handleCurrentTemperatureGet() {
    this.platform.log.debug('Triggered GET CurrentTemperature');
    return this.exampleStates.CurrentTemperature;
  }


  /**
   * Handle requests to get the current value of the "Target Temperature" characteristic
   */
  handleTargetTemperatureGet() {
    this.platform.log.debug('Triggered GET TargetTemperature');
    return this.exampleStates.TargetTemperature;
  }

  /**
   * Handle requests to set the "Target Temperature" characteristic
   */
  handleTargetTemperatureSet(value) {
    this.platform.log.debug('Triggered SET TargetTemperature:', value);
    this.exampleStates.TargetTemperature = value;
  }

  /**
   * Handle requests to get the current value of the "Temperature Display Units" characteristic
   */
  handleTemperatureDisplayUnitsGet() {
    this.platform.log.debug('Triggered GET TemperatureDisplayUnits');
    return this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS;
  }

  /**
   * Handle requests to set the "Temperature Display Units" characteristic
   */
  handleTemperatureDisplayUnitsSet(value) {
    this.platform.log.debug('Triggered SET TemperatureDisplayUnits:', value);
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
