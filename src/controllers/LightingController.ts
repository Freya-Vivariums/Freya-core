/*
 *	Lighting Controller
 * 	The controller responsible for regulating the lighting.
 * 
 *  Copyright 2022 Sanne 'SpuQ' Santens. All rights reserved.
 */

import EventEmitter from 'events';
import {Statuslogger} from "./statuslogger";

export class LightingController extends EventEmitter {
	private minimum:number = 0;			// Minimum relative lighting intensity
	private maximum:number = 0;			// Maximum relative lighting intensity
	private state:string|null;					// Current output state (on/off)
	private current:number = 0;					// Current relative lighting measurement
	private noSensorMode:boolean = true;		// No sensor mode
	private intervalTimer:any;					
	private statuslogger = new Statuslogger();
	private relativeMoment:number|null=null;

	constructor(){
		super();
		this.emit( "lights", "off" ); 	// Make sure the lights are off
		this.minimum = 0;			// Reset variables
		this.maximum = 0;
		this.state = null;
		this.setStatus( "error", "No controller", "No one is controlling the lighing now" );
	}

	clear(){
		clearInterval( this.intervalTimer );
		this.emit( "lights", "off" ); 	// Make sure the lights are off
		this.minimum = 0;			// Reset variables
		this.maximum = 0;
		this.state = null;
		this.setStatus( "error", "No controller", "No one is controlling the lighing now" );
	}

	set( minIntensity:number, maxIntensity:number ){
		this.minimum = minIntensity;
		this.maximum = maxIntensity;
		this.intervalTimer = setInterval( () => {
			this.regulator();
		}, 2000 );
		this.setStatus( "ok", "Controller set", "Controller set with min: "+this.minimum+"% and max: "+this.maximum+"%" );
	}

	setRelativeMoment( relativeMoment:number ){
		this.relativeMoment = relativeMoment;
	}

	setCurrent( value:number ){
		this.current = value;
	}

	getCurrent(){
		return {min:this.minimum, max:this.maximum, value:this.current, time:Math.floor(new Date().getTime() / 1000)};
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
		/*if( !this.noSensorMode ){
			// TODO a mode that actually uses sensor data
			if( this.maximum > 50 ){
				this.emit( "lights", "on" );
				this.setStatus( "ok", "Lights ON" );
			}
			else{
				this.emit( "lights", "off" );
				this.setStatus( "ok", "Lights OFF" );
			}
		}
		else{
			if( this.maximum > 50 ){
				this.emit( "lights", "on" );
				this.setStatus( "warning", "Lights ON", "No sensor modus!" );
			}
			else{
				this.emit( "lights", "off" );
				this.setStatus( "warning", "Lights OFF", "No sensor modus!" );
			}
		}*/

		// Transitional lighting
		if( this.relativeMoment && (this.relativeMoment <= 5 || this.relativeMoment >= 95 ) ){
			this.emit( "translights", "on" );
		}
		else{
			this.emit( "translights", "off" );

			if( !this.noSensorMode ){
				// TODO a mode that actually uses sensor data
				if( this.maximum > 50 ){
					this.emit( "lights", "on" );
					this.setStatus( "ok", "Lights ON" );
				}
				else{
					this.emit( "lights", "off" );
					this.setStatus( "ok", "Lights OFF" );
				}
			}
			else{
				if( this.maximum > 50 ){
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
}