/*
 *	Statuslogger
 *	Logs the status
 *
 *  Copyright 2022 Sanne 'SpuQ' Santens.
 */

 import EventEmitter from 'events';  
 
 export class Statuslogger extends EventEmitter {
    private statusArray:[any];          // array of log objects
    private logsize:number = 20;        // Log array maximum size

    constructor(){
        super();
    }

    log( log:any ){
        // check if the message is the same as the previous one - don't fill log with same message...
        var lastLog:any = this.statusArray[this.statusArray.length-1];
        if( typeof(lastLog) !== 'undefined' ){
            if( log.level === lastLog.level && log.message === lastLog.message && log.details === lastLog.details){
                if(typeof(lastLog.lognumber) === 'undefined'){
                    lastLog.lognumber = '1'
                }
                if(lastLog.lognumber < 99){ // make sure it can't overflow....
                    lastLog.lognumber++;
                }
            }
            else{
                this.pushToLog( log );
            }
        }
        // otherwise, just push the log
        else {
            this.pushToLog( log );
        }
    }

    pushToLog( log:any ){
        // check if array length doesn't exceede the maximum
        if( this.statusArray.length > this.logsize ){
            // remove first element
            this.statusArray.shift();
        }
        // add a timestamp
        log.timestamp = Date.now();
        // push to log
        this.statusArray.push( log );
    }

    readLogs() {
        return this.statusArray;
    }
 }


 module.exports.default = Statuslogger;