/*
 *	Lighting Controller
 * 	The controller responsible for regulating the lighting.
 * 
 *  Copyright 2022 Sanne 'SpuQ' Santens. All rights reserved.
 */

import EventEmitter from 'events';
import {Statuslogger} from "./statuslogger";

export class LightingController extends EventEmitter {
	private minIntensity:number = 0;			// Minimum relative lighting intensity
	private maxIntensity:number = 0;			// Maximum relative lighting intensity
	private state:string|null;					// Current output state (on/off)
	private current:number = 0;					// Current relative lighting measurement
	private noSensorMode:boolean = true;		// No sensor mode
	private intervalTimer:any;					
	private statuslogger = new Statuslogger();

	constructor(){
		super();
		this.emit( "lights", "off" ); 	// Make sure the lights are off
		this.minIntensity = 0;			// Reset variables
		this.maxIntensity = 0;
		this.state = null;
		this.setStatus( "error", "No controller", "No one is controlling the lighing now" );
	}

	clear(){
		clearInterval( this.intervalTimer );
		this.emit( "lights", "off" ); 	// Make sure the lights are off
		this.minIntensity = 0;			// Reset variables
		this.maxIntensity = 0;
		this.state = null;
		this.setStatus( "error", "No controller", "No one is controlling the lighing now" );
	}

	set( minIntensity:number, maxIntensity:number ){
		this.minIntensity = minIntensity;
		this.maxIntensity = maxIntensity;
		this.intervalTimer = setInterval( () => {
			this.regulator();
		}, 2000 );
		this.setStatus( "ok", "Controller set", "Controller set with min: "+this.minIntensity+"% and max: "+this.maxIntensity+"%" );
	}

	setCurrent( value:number ){
		this.current = value;
	}

	noSensor( value:boolean ){
		this.noSensorMode = value;
	}

	setStatus( level:string , message:string, details?:string ){
		var status = {
			level: level,				// error, warning, ok
			message: message,
			details: details
		}

		this.emit("status", status);
		this.statuslogger.log( status );	// write to log
	}

	readLog(){
		return this.statuslogger.readLogs();
	}

	// core function
	regulator(){
		if( !this.noSensorMode ){
			// TODO a mode that actually uses sensor data
			if( this.maxIntensity > 50 ){
				this.emit( "lights", "on" );
				this.setStatus( "ok", "Lights ON" );
			}
			else{
				this.emit( "lights", "off" );
				this.setStatus( "ok", "Lights OFF" );
			}
		}
		else{
			if( this.maxIntensity > 50 ){
				this.emit( "lights", "on" );
				this.setStatus( "warning", "Lights ON", "No sensor modus!" );
			}
			else{
				this.emit( "lights", "off" );
				this.setStatus( "warning", "Lights OFF", "No sensor modus!" );
			}
		}
	}
}