/*
 *  Interface
 *  Interfaces with sensors and actuators
 */

import EventEmitter from 'events';

export class HardwareInterface extends EventEmitter {
    constructor(){
        super();
    }

    setActuator( actuator:string, value:string ){

    }
}