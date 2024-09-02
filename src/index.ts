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
import { HardwareInterface } from './interface';

const configfile = __dirname+'/config/climatecore.conf';	// default config file

// Controllers
const circadianSchedule = new CircadianSchedule( configfile );
const temperatureController = new TemperatureController();
const lightingController = new LightingController();
const rainController = new RainController();
const humidifierController = new HumidifierController();

// Hardware interface
const hardware = new HardwareInterface();

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

/*
 *	Actuator controls
 */

/* Lighting Controller Output */
lightingController.on("lights", ( data:any )=>{
	hardware.setActuator('lights', data);
});

/* Rain Controller Output */
rainController.on("sprinklers", ( data:any )=>{
	hardware.setActuator('rain', data);
});

rainController.on("timeToNextRain", (data:any)=>{
	//console.log(new Date(data * 1000).toISOString().substr(11, 8));
	// TODO: pass to dashboard
});

/* Temperature Controller Output */
temperatureController.on("heater", ( data:any )=>{
	hardware.setActuator('heater', data)
});

temperatureController.on("cooler", ( data:any )=>{
	hardware.setActuator('ventilation', data);
});

humidifierController.on('humidifier', ( data:any)=>{
	hardware.setActuator('humidifier', data);
})

/*
 *	Environment measurements
 *	Variables from the environment measured by sensors.
 */

// TODO: watchdogs for sensor data

hardware.on('temperature', (data:any)=>{
	temperatureController.setCurrent( data );
});

hardware.on('humidity', (data:any)=>{
	rainController.setCurrent( data );			// Rain controller currently does nothing with this info...
	humidifierController.setCurrent( data );
});

hardware.on('light', (data:any)=>{
	lightingController.setCurrent( data );
});

