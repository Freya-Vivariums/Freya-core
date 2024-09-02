/*
 *	Humidifier Controller
 *	The controller responsible for regulating the humidity.
 *
 *  Copyright 2022 Sanne 'SpuQ' Santens. All rights reserved.
 */

import EventEmitter from 'events';
import {Statuslogger} from "./statuslogger";


export class  HumidifierController extends EventEmitter{
	private maximum:number;					// Maximum relative air humidity (0...100%)
	private minimum:number;					// Minimum relative air humidity (0...100%)
	private current:number;					// Keeps the current relative humidity value from the sensor (%)
	private humidifierStatus:string = "off";// Keeps track of whether the humidifier is on or off
	private humidityTimer:any;				// Timer to check whether the humidity is in bounds

	private noSensorMode:boolean = true;	// Keeps track of whether there's a sensor or not
	private statuslogger = new Statuslogger();
	private tankLevel = 100;				// Initialize tank level at 100% (full)
	
	constructor(){
		super();
	}

	clear(){
		clearInterval(this.humidityTimer);		// clear the humidity check timer
		this.setHumidifierOff();				// make sure the humidifier is off
		this.minimum = 0;						// reset all variables
		this.maximum = 0;
		this.setStatus( "error", "No Controller", "No one is controlling the humidity now" );
	}

	set( minRhumidity:number, maxRhumidity:number ){
		this.minimum = minRhumidity;
		this.maximum = maxRhumidity;

		// set the timer for the humidity check (every 2 seconds)
		this.humidityTimer = setInterval( () => {
			if( !this.noSensorMode ){	// don't do anything without the sensor!
				if( this.current < this.minimum && this.humidifierStatus == "off" ){
					this.setHumidifierOn();
					this.setStatus( "warning", "humidity too low", "Turning on humidifier to increase humidity" );
				}
				else if( this.current > this.maximum ){
					// TODO: turn off humidifier anyway
					this.setStatus( "warning", "humidity too high", "Do something about this..." );
				}
				else if( this.humidifierStatus == "on" && this.current >= this.minimum ){
					this.setHumidifierOff();
					this.setStatus( "ok", "humidity in range", "Turning off humidifier" );
				}
			}
		}, 2000 );

		this.setStatus( "ok", "Controller set", "Controller set with min: "+this.minimum+"% and max: "+this.maximum+"%" );
	}

	// handle data from sensor
	setCurrent( value:number ){
		this.current = value;
	}

	// Set tank level (0 - 100%)
	setTankLevel( tankLevel:number ){
		this.tankLevel = tankLevel;
		if( this.tankLevel <= 5 ){
			this.setStatus( "error", "Tank empty", "The water tank is is empty, refill is required" );
		}
		else if( this.tankLevel <= 10){
			this.setStatus( "warning", "Tank almost empty", "The water tank is almost empty, refill is recommended" );
		}
	}

	noSensor( value:boolean ){
		this.noSensorMode = value;
	}

	setStatus( level:string, message:string, details:string ){
		var status = {
			level: level,			// error, warning, ok
			message: message,
			details: details
		}

		this.emit( "status", status );
		this.statuslogger.log( status );	// write to log
		//console.log(JSON.stringify(status));	// for debugging
	}

	readLog(){
		return this.statuslogger.readLogs();
	}

	setHumidifierOn(){
		if( this.tankLevel >= 5 ){				// check whether there's enough water in the tank
			this.emit( "humidifier", "on" );	// command to turn on the humidifier
			this.humidifierStatus = "on";		// set current status to on
			return 0;							// return 'success'
		}
		else {
			this.setStatus( "error", "Tank empty", "humidifier is not turned on due to an empty tank" );
			return -1;							// return 'error' if tank is empty
		}
	}

	setHumidifierOff(){
		this.emit( "humidifier", "off" );	// command to turn off the humidifier
		this.humidifierStatus = "off";		// set current status to off
		return 0;							// return 'success'	
	}
}