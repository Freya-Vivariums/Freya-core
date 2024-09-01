/*
 *  Freya - Vivarium Control System
 *  
 *  Copyright 2024 Sanne 'SpuQ' Santens
 */

import * as fs from 'fs';

const qdevice = require('qdevice');
//const motionjs = require('qmotionjs');

const CircadianSchedule = require('./controllers/CircadianSchedule');
const TemperatureController = require('./controllers/TemperatureController');
const LightingController = require('./controllers/LightingController');
const RainController = require('./controllers/RainController');
const HumidifierController = require('./controllers/HumidifierController');

const configfile = __dirname+'/config/climatecore.conf';	// default config file

// Controllers
var circadianSchedule = new CircadianSchedule( configfile );
var temperatureController = new TemperatureController();
var lightingController = new LightingController();
var rainController = new RainController();
var humidifierController = new HumidifierController();

// Hardware
var powerSwitch = new qdevice("FreyaPowerswitch_1");		// Freya's Powerswitch Module, on address 1
var sensor = new qdevice("FreyaSensor_1");					// Freya's Sensor Module, on address 1
//var myDevelopmentBoard = new qdevice("MyDevBoard_1");		// Your Development board, on address 1

module.exports.scheduleLog = circadianSchedule.readLog();
module.exports.temperatureLog = temperatureController.readLog();
module.exports.lightingLog = lightingController.readLog();
module.exports.humidityLog = rainController.readLog();		// TODO: humidity became rain + humidifier (15/11/2021); adapt in front-end...


/* Circadian Schedule */
circadianSchedule.on('newTimeOfYear', ( timeOfYear:any )=>{
	// TODO: pass to Dashboard
});

circadianSchedule.on('newTimeOfDay', ( timeOfDay:any )=>{	
	lightingController.clear();			// Clearing the controllers (otherwise e.g. timers will keep on running)
	temperatureController.clear();
	rainController.clear();
	humidifierController.clear();

	// Initialize the controllers
	lightingController.set( timeOfDay.lighting.minIntensity, timeOfDay.lighting.maxIntensity);
	temperatureController.set( timeOfDay.temperature.minTemperature, timeOfDay.temperature.maxTemperature );
	rainController.set( timeOfDay.humidity.rainInterval, timeOfDay.humidity.rainDuration, timeOfDay.humidity.minRHumidity, timeOfDay.humidity.maxRHumidity );
	humidifierController.set( timeOfDay.humidity.minRHumidity, timeOfDay.humidity.maxRHumidity );

	// Dashboard: minimum and maximum settings (for graphs)
	lightingMin = timeOfDay.lighting.minIntensity;
	lightingMax = timeOfDay.lighting.maxIntensity;
	temperatureMin = timeOfDay.temperature.minTemperature;
	temperatureMax = timeOfDay.temperature.maxTemperature;
	humidityMin = timeOfDay.humidity.minRHumidity;
	humidityMax = timeOfDay.humidity.maxRHumidity;
});

module.exports.reloadCircadianSchedule = function(){
	circadianSchedule.reload();
}

/* Lighting Controller Output */
lightingController.on("lights", ( data:any )=>{
	powerSwitch.send('CH1', data);

	if( lightingController.currentstate === 'undefined' || lightingController.currentstate !== data ){
		lightingController.currentstate = data;
		console.log("lights: "+data);
	}
});

lightingController.on("status", ( status:any )=>{
	currentLightingStatus = status;		// Pass to dashboard
});

/* Rain Controller Output */
rainController.on("sprinklers", ( data:any )=>{
	powerSwitch.send('CH2', data);

	if( rainController.currentstate === 'undefined' || rainController.currentstate !== data ){
		rainController.currentstate = data;
		console.log("rain: "+data);
	}
});

rainController.on("status", ( status:any )=>{
	// TODO: pass to dashboard
});

rainController.on("timeToNextRain", (data:any)=>{
	//console.log(new Date(data * 1000).toISOString().substr(11, 8));
	// TODO: pass to dashboard
});

/* Humidifier Controller Output */
humidifierController.on("status", ( status:any )=>{
	currentHumidityStatus = status;			// Pass to dashboard
});

/* Temperature Controller Output */
temperatureController.on("heater", ( data:any )=>{
	powerSwitch.send('CH3', data);

	if( temperatureController.currentstate === 'undefined' || temperatureController.currentstate !== data ){
		temperatureController.currentstate = data;
		console.log("heater: "+data);
	}
});

temperatureController.on("cooler", ( data:any )=>{
	powerSwitch.send('CH4', data);

	if( temperatureController.currentstate === 'undefined' || temperatureController.currentstate !== data ){
		temperatureController.currentstate = data;
		console.log("cooler: "+data);
	}
});

temperatureController.on("status", ( status:any )=>{
	currentTemperatureStatus = status;		// Pass to dashboard
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

var currentLighting = 0;
var currentHumidity = 0;
var currentTemperature = 0;

var currentLightingStatus = {};
var currentHumidityStatus = {};
var currentTemperatureStatus = {};

var lightingMin;
var lightingMax;
var temperatureMin;
var temperatureMax;
var humidityMin;
var humidityMax;


sensor.on('data', function( data:any ){
	if( data.signal == "humidity" ){
		rainController.setCurrent( data.argument );			// Rain controller currently does nothing with this info...
		humidifierController.setCurrent( data.argument );

		currentHumidity = data.argument;		// Freya Dashboard
	}
	else if( data.signal == "lighting" ){
		lightingController.setCurrent( data.argument );

		currentLighting = data.argument;		// Freya Dashboard
	}
	else if (data.signal == "temperature" ){
		temperatureController.setCurrent( data.argument );

		currentTemperature = data.argument;		// Freya Dashboard
	}
});
