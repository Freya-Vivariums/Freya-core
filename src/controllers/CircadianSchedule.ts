/*
 *	Circadian Schedule
 *	Controls the seasons, time of days, ...
 * 
 *  Copyright 2022 Sanne 'SpuQ' Santens.
 */

import fs from 'fs';
import EventEmitter from 'events';
import { Statuslogger } from "./statuslogger";

export interface TimeOfDay {
	name: string,			// e.g. 'Morning', 'Afternoon', ...
	startHours:number,		// HH
	startMinutes: number,	// MM
	endHours: number,		// HH
	endMinutes: number		// MM
	// values
	lighting: {				// relative light intensity
		minimum: number,
		maximum: number
	},
	temperature: {			// temperature
		minimum: number,
		maximum: number
	},
	humidity: {				// relative humidity
		minimum: number,
		maximum: number,
		rainInterval: number,
		rainDuration: number
	}

}

export interface TimeOfYear {
	name: string,			// e.g. 'Summer', 'Winter', ...
	startMonth: number,
	startDay: number,
	endMonth: number,
	endDay: number,
	dayCycle:[TimeOfDay],
}

export class CircadianSchedule extends EventEmitter {
	private configFile:string;							// Path to the config file
	private intervalTimer:any;
	private currentTimeOfDay:TimeOfDay|null = null;		// settings for the current time of day
	private currentTimeOfYear:TimeOfYear|null = null;	// settings for the current time of year
	private settings:any;
	private statuslogger = new Statuslogger();

	constructor( pathToFile:string ){
		super();
		this.configFile = pathToFile;
		this.init();
	};
	
	readLog(){
		return this.statuslogger.readLogs();
	}

	setStatus( level:string, message:string, details?:string ){
		var status = {
			level: level,				// error, warning, ok
			message: message,
			details: details
		}

		this.statuslogger.log( status );	// write to log
		console.log(JSON.stringify(status));	// for debugging
	}

	init(){
		// Load the settings for the config file
		this.loadSettingsFromFile( this.configFile );

		// Check the date every x time as long as the program runs
		this.intervalTimer = setInterval( () => {
			var date = new Date();
			this.checkTimeOfYear( date.getDate(), date.getMonth()+1 );
			this.checkTimeOfDay( date.getHours(), date.getMinutes() );
			this.calculateRelativeMoment( date.getHours(), date.getMinutes() );
		},2000);
		this.setStatus("ok", "Schedule", "Schedule is initialized");
	}

	reload(){
		clearInterval( this.intervalTimer );	// kill the interval timer
		this.currentTimeOfDay = null;				// reset loaded variables
		this.currentTimeOfYear = null;
		this.init();							// (re)initialize instance
	}

	// Load the Schedule settings from config file
	loadSettingsFromFile( pathToFile:string ){
		try{
			this.settings = JSON.parse(fs.readFileSync( pathToFile, 'utf8').toString());
		} catch(err){
			console.error("corrupt config file; exit");
			this.setStatus( "error", "Load config", "Couldn't load settings from config file!");
		}
		this.setStatus( "ok", "Load config", "Settings are loaded from config file.");
	}

	/*	TimeOfDay (hh:mm) related functions */

	// check if the current time belongs in the current time of day,
	// if not, set the new time of day.
	checkTimeOfDay( hours:number, minutes:number ){
		//if(!this.currentTimeOfDay) return false;
		let inBounds:number = 0;
		if(this.currentTimeOfDay){
			inBounds = this.isWithinBounds( hours, minutes, this.currentTimeOfDay.startHours, this.currentTimeOfDay.startMinutes, this.currentTimeOfDay.endHours, this.currentTimeOfDay.endMinutes);
		}
		if( inBounds  <= 0 ){	// If the time is 'out of bounds' or an error is returned
			let newTimeOfDay = this.lookupTimeOfDay( hours, minutes);
			if( newTimeOfDay ){
				this.setTimeOfDay( newTimeOfDay );
			}
		}
		return true;
	}

	// lookup in which time of day (from current time of year settings) the given hh:mm belongs.
	// returns the timeOfDay object, or 0 when nothing matched
	lookupTimeOfDay( hours:number, minutes:number){
		// check whether there is a current time of year set
		if( this.currentTimeOfYear === null ) return null;

		for(var i = 0; i < this.currentTimeOfYear.dayCycle.length; i++) {		// Loop through all the 'timeOfDay' elements and look for the
			var n = this.currentTimeOfYear.dayCycle[i];							// element within which boundaries the given time fits.
			var inBounds = this.isWithinBounds(hours, minutes, n.startHours, n.startMinutes, n.endHours, n.endMinutes)
			if( inBounds > 0 ){
				return n;
			}
		}
		return null;
	}

	setTimeOfDay( timeOfDay:TimeOfDay ){
		this.currentTimeOfDay = timeOfDay;
		this.emit('newTimeOfDay', timeOfDay);
		this.setStatus( "ok", "TimeOfDay", "Now it's "+timeOfDay.name);
	}

	/*	TimeOfYear (day/month) related functions */

	// check whether the current date belongs in the current time of year,
	// if not, set the new time of year.
	checkTimeOfYear( day:number, month:number ){

		//if(!this.currentTimeOfYear) return false;
		let isWithinBounds = 0
		if( this.currentTimeOfYear ){
			isWithinBounds = this.isWithinBounds( month, day, this.currentTimeOfYear.startMonth, this.currentTimeOfYear.startDay, this.currentTimeOfYear.endMonth, this.currentTimeOfYear.endDay );
		}
		if( !isWithinBounds ){
			var newTimeOfYear = this.lookupTimeOfYear( day, month);
			if( newTimeOfYear != 0 ){
				this.setTimeOfYear( newTimeOfYear );
			}
		}
		return true;
	}

	// lookup in which time of year (from settings) the given day/month belongs.
	// returns the timeOfYear object, or 0 when nothing matched
	lookupTimeOfYear( day:number, month:number){
		for(var i = 0; i < this.settings.length; i++) {
     			let n = this.settings[i];
     			if( this.isWithinBounds( month, day, n.startMonth, n.startDay, n.endMonth, n.endDay) ){
         			return n;
      			}
   		}
		console.log("no timeOfYear found for this date");
		return 0;
	}

	setTimeOfYear( timeOfYear:TimeOfYear ){
		this.currentTimeOfYear = timeOfYear;
		this.emit('newTimeOfYear', timeOfYear);
		this.setStatus( "ok", "TimeOfYear", "season is set to "+timeOfYear.name);
	}

	// Checks whether a 'high' and 'low' value (e.g. month/day ) are within
	// the given boundaries. Returns 1 if within bounds, and 0 when out of bounds.
	isWithinBounds( high:number, low:number, startHigh:number|null, startLow:number|null, endHigh:number|null, endLow:number|null){
		if( !high || !low || !startHigh || !startLow || !endHigh || !endLow ) return 0; // TODO return error instead of 'not within bounds'!

		if( startHigh < endHigh ){
			if( high > startHigh && high < endHigh ) return 1;		// high definitly within bounds
			if( high == startHigh && low >= startLow ) return 1;	// high equal, low within bounds
			if( high == endHigh && low <= endLow ) return 1;
			return 0;
		}
		else if( startHigh > endHigh ){
			if( high > startHigh || high < endHigh ) return 1;		// high definitly within bounds
			if( high == startHigh && low >= startLow ) return 1;	// high equal, low within bounds
			if( high == endHigh && low <= endLow ) return 1;
			return 0;
		}
		else if( startHigh == endHigh ){
			if( endLow > startLow){
				if( low >= startLow && low <= endLow ) return 1;	// low within bounds
				return 0;
			}
			else if( endLow < startLow ){
				console.log("I think there's a bug here!!!")
				if( low <= startLow && low >= endLow ) return 1;	// low within bounds (bug?????)
				return 0;
			}
			else if( endLow == startLow ){
				return 1;						// if high's and low's are equal, it's within bounds.
			}
		}
		return 0;
	}

	/*
	 *	Relative moment
	 */
	private calculateRelativeMoment( nowHours:number, nowMinutes:number ){
		if(!this.currentTimeOfDay) return;

		let hours:number;
		let minutes:number;

		// Calculate the amount of hours this time-of-day has
		if( this.currentTimeOfDay.endHours > this.currentTimeOfDay.startHours ){
			hours = this.currentTimeOfDay.endHours - this.currentTimeOfDay.startHours;
		}
		else{
			hours = this.currentTimeOfDay.startHours - this.currentTimeOfDay.endHours + 12;
		}

		// Calculate the amount of minutes this time-of-day has
		if( this.currentTimeOfDay.endMinutes >= this.currentTimeOfDay.startMinutes ){
			minutes = this.currentTimeOfDay.endMinutes - this.currentTimeOfDay.startMinutes;
		}
		else{
			minutes = 60-(this.currentTimeOfDay.startMinutes - this.currentTimeOfDay.endMinutes);
			hours--;
		}

		// Calculate the amount of minutes
		const totalMinutes = minutes + hours*60;

		// Calculate the amount of minutes since time-of-day start
		if( nowHours > this.currentTimeOfDay.startHours ){
			hours = nowHours - this.currentTimeOfDay.startHours;
		}
		else{
			hours = this.currentTimeOfDay.startHours - nowHours + 12;
		}
		
		// Calculate the amount of minutes this time-of-day has
		if( nowMinutes >= this.currentTimeOfDay.startMinutes ){
			minutes = nowMinutes - this.currentTimeOfDay.startMinutes;
		}
		else{
			minutes = 60-(this.currentTimeOfDay.startMinutes - nowMinutes);
			hours--;
		}

		const passedMinutes = minutes + hours*60;

		const relativeMoment = parseFloat( ((passedMinutes/totalMinutes)*100).toFixed(1) );
		console.log(relativeMoment+"%");
		this.emit('relativeMoment',relativeMoment);
	}
}
