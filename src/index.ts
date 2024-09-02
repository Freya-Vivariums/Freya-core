/*
 *  Freya - Vivarium Control System
 *  
 *  Copyright 2024 Sanne 'SpuQ' Santens
 */

import { CircadianSchedule, TimeOfDay, TimeOfYear } from './controllers/CircadianSchedule' ;
import { TemperatureController } from './controllers/TemperatureController';
import { LightingController } from './controllers/LightingController';
import { RainController } from './controllers/RainController';
import { HumidifierController } from './controllers/HumidifierController';

const configfile = __dirname+'/config/climatecore.conf';	// default config file

// Controllers
let circadianSchedule = new CircadianSchedule( configfile );
let temperatureController = new TemperatureController();
let lightingController = new LightingController();
let rainController = new RainController();
let humidifierController = new HumidifierController();

// Hardware
var powerSwitch = new qdevice("FreyaPowerswitch_1");		// Freya's Powerswitch Module, on address 1
var sensor = new qdevice("FreyaSensor_1");					// Freya's Sensor Module, on address 1

/* Circadian Schedule */
circadianSchedule.on('newTimeOfYear', ( timeOfYear:TimeOfYear )=>{
	// TODO: pass to Dashboard
});

circadianSchedule.on('newTimeOfDay', ( timeOfDay:TimeOfDay )=>{	
	lightingController.clear();			// Clearing the controllers (otherwise e.g. timers will keep on running)
	temperatureController.clear();
	rainController.clear();
	humidifierController.clear();

	// Initialize the controllers
	lightingController.set( timeOfDay.lighting.minimum, timeOfDay.lighting.maximum);
	temperatureController.set( timeOfDay.temperature.minimum, timeOfDay.temperature.maximum );
	rainController.set( timeOfDay.humidity.rainInterval, timeOfDay.humidity.rainDuration, timeOfDay.humidity.minimum, timeOfDay.humidity.maximum );
	humidifierController.set( timeOfDay.humidity.minimum, timeOfDay.humidity.maximum );
});

module.exports.reloadCircadianSchedule = function(){
	circadianSchedule.reload();
}

/* Lighting Controller Output */
lightingController.on("lights", ( data:any )=>{
	powerSwitch.send('CH1', data);
});

/* Rain Controller Output */
rainController.on("sprinklers", ( data:any )=>{
	powerSwitch.send('CH2', data);
});

rainController.on("timeToNextRain", (data:any)=>{
	//console.log(new Date(data * 1000).toISOString().substr(11, 8));
	// TODO: pass to dashboard
});

/* Temperature Controller Output */
temperatureController.on("heater", ( data:any )=>{
	powerSwitch.send('CH3', data);
});

temperatureController.on("cooler", ( data:any )=>{
	powerSwitch.send('CH4', data);
});

/* Sensor */
function setSensorDisconnected(){
	temperatureController.noSensor(true);
	rainController.noSensor(true);
	humidifierController.noSensor(true);
	lightingController.noSensor(true);
}

function setSensorConnected(){
	temperatureController.noSensor(false);
	rainController.noSensor(false);
	humidifierController.noSensor(false);
	lightingController.noSensor(false);
}

sensor.on('disconnected', function(){
	setSensorDisconnected();
});

sensor.on('connected', function(){
	setSensorConnected();
});

sensor.on('data', function( data:any ){
	if( data.signal == "humidity" ){
		rainController.setCurrent( data.argument );			// Rain controller currently does nothing with this info...
		humidifierController.setCurrent( data.argument );
	}
	else if( data.signal == "lighting" ){
		lightingController.setCurrent( data.argument );
	}
	else if (data.signal == "temperature" ){
		temperatureController.setCurrent( data.argument );
	}
});
