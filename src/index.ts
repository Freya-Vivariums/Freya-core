/*
 *  Freya - Vivarium Control System
 *  
 * 
 * 
 *  Copyright 2024 Sanne 'SpuQ' Santens.
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import express from 'express';
import cors from 'cors';
// Controllers
import { CircadianSchedule, TimeOfDay, TimeOfYear } from './controllers/CircadianSchedule' ;
import { TemperatureController } from './controllers/TemperatureController';
import { LightingController } from './controllers/LightingController';
import { RainController } from './controllers/RainController';
import { HumidifierController } from './controllers/HumidifierController';
import { HardwareInterface } from './interface';
// API routes
import settingsApi from './api-routes/settings';
import monitorApi from './api-routes/monitor';
import { saveMeasurement } from './database/measurements';
import { EdgeberryInterface } from './edgeberry_interface';
// Commandline Interface (for inter-process communication)

export const configfile = 'climate.conf.js';	// default climate config file

/* Express Web/API server */
const app = express();
const port = 8080;				// default webui port: 3000
// Express tools
app.use(express.json());        // JSON API
app.use(cors({origin:'*'}));    // Cross-origin references
// Use the API Routers
app.use('/api/settings', settingsApi );
app.use('/api/monitor', monitorApi );
// Serve the public directory and a static HTML index file
app.use(express.static( __dirname+'/public/'));
app.get('*', (req:any, res:any)=>{
    return res.sendFile('index.html',{ root: __dirname+'/public' });
});
// Start the webserver
app.listen( port, ()=>{ console.log('\x1b[32mFreya Core UI server running on port '+port+'\x1b[30m')});

// Edgeberry Core interface
const edgeberry = new EdgeberryInterface();
setTimeout(()=>{
	edgeberry.setApplicationInfo("Freya","v2.4", "Freya Vivarium Control System");
	edgeberry.updateStatus("ok","Supah dupah!");
},500);

// Controllers
export const circadianSchedule = new CircadianSchedule( configfile );
export const temperatureController = new TemperatureController();
export const lightingController = new LightingController();
export const rainController = new RainController();
export const humidifierController = new HumidifierController();

// Hardware interface
const hardware = new HardwareInterface();

/* Circadian Schedule */
circadianSchedule.on('newTimeOfYear', ( timeOfYear:TimeOfYear )=>{
	// TODO: pass to Dashboard
});

circadianSchedule.on('newTimeOfDay', ( timeOfDay:TimeOfDay )=>{
	console.log('New TimeOfDay')	
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

circadianSchedule.on('relativeMoment', ( relativeMoment )=>{
	lightingController.setRelativeMoment( relativeMoment );
})

/*
 *	Actuator controls
 *	Variables from the controllers to the actuators
 */

/* Lighting Controller Output */
lightingController.on("lights", ( data:any )=>{
	hardware.setActuator('lights', data);
});


lightingController.on("translights", ( data:any )=>{
	hardware.setActuator('translights', data);
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
	hardware.setActuator('cooler', data);
});

humidifierController.on('humidifier', ( data:any)=>{
	hardware.setActuator('humidifier', data);
})

/*
 *	Environment measurements
 *	Variables from the environment measured by sensors.
 */

// TODO: watchdogs for sensor data

hardware.on('temperature', (data:number)=>{
	console.log('Temperature set to: '+data+'C');
	temperatureController.setCurrent( data );
});

hardware.on('humidity', (data:number)=>{
	console.log('Humidity set to: '+data+'%');
	rainController.setCurrent( data );			// Rain controller currently does nothing with this info...
	humidifierController.setCurrent( data );
});

hardware.on('lighting', (data:number)=>{
	console.log('Light set to: '+data+'%');
	lightingController.setCurrent( data );
});


/*
 *	Monitor: Gather data at
 *	regular intervals
 */

setInterval(()=>{
	// Get the values and store them in the database
	const temperatureMeasurement = temperatureController.getCurrent();
	saveMeasurement('temperature', temperatureMeasurement.min, temperatureMeasurement.max, temperatureMeasurement.value, temperatureMeasurement.time);
	const humidityMeasurement = humidifierController.getCurrent();
	saveMeasurement('humidity', humidityMeasurement.min, humidityMeasurement.max, humidityMeasurement.value, humidityMeasurement.time );
	const lightingMeasurement = lightingController.getCurrent();
	saveMeasurement('lighting', lightingMeasurement.min, lightingMeasurement.max, lightingMeasurement.value, lightingMeasurement.time );
},30*1000);

