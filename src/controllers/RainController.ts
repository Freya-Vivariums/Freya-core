/*
 *	Rain Controller
 *	The controller responsible for regulating the rain.
 *
 *  Copyright 2022 Sanne 'SpuQ' Santens.
 */

import EventEmitter from 'events';
import { Statuslogger } from "./statuslogger";


export class  RainController extends EventEmitter{
	private interval:number;					// Rain interval in minutes
	private duration:number;					// Rain duration in seconds
	private maximum:number;						// Minimum relative humidity
	private minimum:number;						// Maximum relative humidity
	private current:number;						// Current relative hummidity
	private sprinklerStatus:string = "off";		// Keeps track of whether sprinklers are on or off 
	private lastRainTime:number;				// Keeps the time of the last rain storm
	private rainTimer:any;						// Timer for next rain shower
	private intervalTimer:any;					// Timer that checks the timer for the next rain shower
	private noSensorMode:boolean = true;		// Sensor connection state
	private statuslogger = new Statuslogger();
	private tankLevel = 100;					// Initialize tank level at 100% (full)

	constructor(){
		super();
		this.lastRainTime = Date.now();			// start rain when object is initialized
	}

	clear(){
		clearInterval(this.rainTimer);			// clear the rain timer
		clearInterval(this.intervalTimer);		// clear the intervalTimer
		this.rainTimer = null;
		this.setSprinklersOff(); 				// make sure the sprinklers are off
		this.interval = 0;						// reset all variables
		this.duration = 0;
		this.minimum = 0;
		this.maximum = 0;
		this.setStatus( "error", "No Controller", "No one is controlling the humidity now" );
	}

	set( interval:number, duration:number, minRhumidity:number, maxRhumidity:number ){
		this.interval = interval;
		this.duration = duration;
		this.minimum = minRhumidity;
		this.maximum = maxRhumidity;

		// set the timer for the rain showers
		if( this.interval <= 0 ){				// no sprinkler action!
			this.setStatus( "ok", "Sprinklers disabled" );
		}
		else {
			this.lastRainTime = Date.now();
			this.rainTimer = setInterval( () => {
				this.timedSprinklers();
				this.lastRainTime = Date.now();
			}, this.interval*60000 );
		}

		this.intervalTimer = setInterval( () => {
			this.updateNextRain();
		}, 2000 );

		this.setStatus( "ok", "Controller set", "Controller set with rain for "+this.duration+"s every "+this.interval+"mins" );
	}

	// reads the timer for the next rain shower
	updateNextRain(){
		var timeLeft:string;
		if( this.rainTimer ){
			timeLeft = new Date( -((Date.now() - (this.lastRainTime + this.rainTimer._idleTimeout)) / 1000)* 1000).toISOString().substr(11, 5);
		}
		else{
			timeLeft = "none";
		}
		this.emit("timeToNextRain", timeLeft);
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

	setStatus( level:string, message:string, details?:string ){
		let status = {
			level: level,				// error, warning, ok
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

	setSprinklersOn(){
		if( this.tankLevel >= 5 ){				// check whether there's enough water in the tank
			this.emit( "sprinklers", "on" );	// command to turn on the sprinklers
			this.sprinklerStatus = "on";		// keep current status to on
			return 0;							// return 'success'
		}
		else {
			this.setStatus( "error", "Tank empty", "Pump is not turned on due to an empty tank" );
			return -1;							// return 'error' if tank is empty
		}
	}

	setSprinklersOff(){
		this.emit( "sprinklers", "off" );	// command to turn off the sprinklers
		this.sprinklerStatus = "off";		// set current status to off
		return 0;							// return 'success'
	}
	
	// function called by the timer
	timedSprinklers(){
		if( !this.noSensorMode ){
			//TODO make use of the sensor data (e.g. if too humid, don't sprinkle?)
			if( !this.setSprinklersOn() ){
				this.setStatus( "ok", "Pump ON", "Pump is turned on for "+this.duration+"s" );

				setTimeout( () => {
					this.setSprinklersOff();
					this.setStatus( "ok", "Pump OFF" );
				}, this.duration*1000 );
			}
		}
		else{
			if( !this.setSprinklersOn() ){
				this.setStatus( "warning", "Pump ON", "No sensor modus!" );

				setTimeout( () => {
					this.setSprinklersOff();
					this.setStatus( "warning", "Pump OFF", "No sensor modus!" );
				}, this.duration*1000 );
			}
		}
	}
}