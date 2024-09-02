/*
 *	Temperature Controller
 *	The controller responsible for regulating the temperature.
 *
 *  Copyright 2022 Sanne 'SpuQ' Santens.
 */

import EventEmitter from 'events';
import {Statuslogger} from "./statuslogger";

export class TemperatureController extends EventEmitter {
	private minimum:number;						// minimum and maximum temperature settings
	private maximum:number;
	private current:number;						// last value from sensor
	private state:string;						// heating/cooling/idle (usted by the controller)
	private status:any;							// status (for the rest of the system)
	private noSensorMode:boolean = true; 		// presence of the sensor
	private intervalTimer:any; 
	private statuslogger = new Statuslogger();

	constructor(){
		super();
	}

	clear(){
		clearInterval(this.intervalTimer);	// destroy timer
		this.emit("heater", "off");			// Turn off the heater
		this.emit("cooler", "off");			// Turn off the cooler
		this.minimum = 0;
		this.maximum = 0;
		this.state = '';
		this.setStatus( "error", "No controller", "No one is controlling the temperature now" );
	}

	setCurrent( value:number ){
		this.current = value;
	}

	set( minTemperature:number, maxTemperature:number ){
		this.minimum = minTemperature;
		this.maximum = maxTemperature;

		this.intervalTimer = setInterval( () => {
			this.regulator();
		}, 2000 );

		this.setStatus( "ok", "Controller set", "Controller set with min: "+this.minimum+"\xB0C and max: "+this.maximum+"\xB0C" );
	}

	noSensor( value ){
		this.noSensorMode = value;
	}

	setStatus( level:string, message:string, details?:string){
		let status = {
			level: level,		// error, warning, ok
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

	regulator(){
		// if a sensor is connected
		if( !this.noSensorMode ){
			// If the temperature exceeds the maximum, turn on the cooler. Keep cooling
			// if the temperature didn't drop below the middle of the acceptable range.
			if( this.current >= this.maximum || (this.state == "cooling" && this.current > ((this.maximum+this.minimum)/2)) ){
				this.state = "cooling";
				this.setStatus( "ok", "Cooler ON" );
				this.emit( "heater", "off" );
				this.emit( "cooler", "on" );
			}
			// If the temperature drops below the minimum, turn on the heater. Keep heating
			// if the temperature didn't exceed the middle of the acceptable range.
			else if( this.current <= this.minimum  || (this.state == "heating" && this.current < ((this.maximum+this.minimum)/2)) ){
				this.state = "heating";
				this.setStatus( "ok", "Heater ON" );
				this.emit( "cooler", "off" );
				this.emit( "heater", "on" );
			}
			// Turn off the heater if the heater was on and the temperature exceeds
			// the middle of the acceptable range.
			else if( this.current >= ((this.maximum+this.minimum)/2) && this.state == "heating" ){
				this.state = "idle";
				this.setStatus( "ok", "Heater OFF" );
				this.emit( "heater", "off" );
				this.emit( "cooler", "off" );
			}
			// Turn off the cooler if the cooler was on and the temperature drops below
			// the middle of the acceptable range.
			else if( this.current <= ((this.maximum+this.minimum)/2) && this.state == "cooling" ){
				this.state = "idle";
				this.setStatus( "ok", "Cooler OFF" );
				this.emit( "cooler", "off" );
				this.emit( "heater", "off" );
			}
			// While the temperature is between the minimum and maximum values, the
			// temperature is within range.
			else if( this.current <= this.maximum && this.current >= this.minimum){
				this.state = "idle";
				this.setStatus( "ok", "In range" );
				this.emit( "cooler", "off" );
				this.emit( "heater", "off" );
			}
		}
		// if no sensor is connected
		else{
			this.emit( "cooler", "off" );	// set heater and cooler off
			this.emit( "heater", "off" );
			this.state = "disabled: no sensor"; // ToDo: remove?
			this.setStatus( "error", "No sensor!", "The temperature controller requires a sensor to operate correctly!" );
		}
	}
}