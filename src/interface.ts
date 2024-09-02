/*
 *  Interface
 *  Interfaces through D-Bus with sensors and actuators
 */

import EventEmitter from 'events';
var dbus = require('dbus-native');      // No TypeScript implementation (!)

export class HardwareInterface extends EventEmitter {
    private serviceName:string = 'io.freya.Core';
    private objectPath:string = '/io/freya/Core';
    private interfaceName:string = 'io.freya.Core';

    private systemBus:any;

    constructor(){
        super();
        this.systemBus = dbus.systemBus();
        if(this.systemBus){
            console.log('\x1b[32mD-Bus client connected to system bus\x1b[30m');
            this.registerDbusName();
            this.createDbusInterface();
        }
        else{
            console.log('\x1b[31mD-Bus client could not connect to system bus\x1b[30m');
        }
    }

    setActuator( actuator:string, value:string ){

    }

    setMeasurement( measurement:string ){
        try{
            const data = JSON.parse(measurement);
            console.log(data.variable+' set to: '+data.value);
            this.emit(data.variable, data.value);
        } catch(e){
            console.log('That did not work...')
        }
    }

    /*
     *  Register D-Bus name
     */
    private registerDbusName(){
        if(!this.systemBus) return false;
        this.systemBus.requestName(this.serviceName,0, (err:string|null, res:number|null)=>{
            if(err){
                console.log('\x1b[31mD-Bus service name aquisition failed: '+err+'\x1b[30m');
                return false;
            }
            else if( res )
                console.log('\x1b[32mD-Bus service name "'+this.serviceName+'" successfully aquired \x1b[30m');
                return true;
        });
    }

    /*
     *  Create D-Bus interface
     */
    private createDbusInterface(){
        // Create the service object
        const serviceObject = {
            setMeasurement: (arg:string)=>this.setMeasurement(arg),
            AnotherMethod: (arg:string)=>{
                console.log("Another Method was called");
                console.log(arg);
                return 'this worked!'
            }
        }

        this.systemBus.exportInterface( serviceObject, this.objectPath, {
            name: this.interfaceName,
            methods: {
                setMeasurement:['s',''],
                AnotherMethod:['s','s']
            },
            signals: {}
        });
    }
}