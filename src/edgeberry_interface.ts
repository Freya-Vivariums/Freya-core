/*
 *  Edgeberry Interface
 *  Interfaces through D-Bus with the Edgeberry device
 */

import { EventEmitter } from "events";
var dbus = require('dbus-native');      // No TypeScript implementation (!)

export class EdgeberryInterface extends EventEmitter {
    private serviceName:string = 'io.edgeberry.Core';
    private objectPath:string = '/io/edgeberry/Core';
    private interfaceName:string = 'io.edgeberry.Core';

    private systemBus:any;
    private edgeberryCore:any|null;

    constructor(){
        super();
        this.systemBus = dbus.systemBus();
        if(this.systemBus){
            console.log('\x1b[32mEdgeberry D-Bus client connected to system bus\x1b[30m');
            this.subscribeToEdgeberryCore();
            this.monitorService();
        }
        else{
            console.log('\x1b[31mEdgeberry D-Bus client could not connect to system bus\x1b[30m');
        }
    }

    private subscribeToEdgeberryCore(){
        // Listen for signals from Freya Core
        this.systemBus.getService(this.serviceName).getInterface( this.objectPath, 
                                                            this.interfaceName,
                                                            (err:any, iface:any)=>{
                                                                if(err) return console.log(err);
                                                                this.edgeberryCore = iface;
                                                                //this.edgeberryCore.on(SIGNAL_NAME, setActuator );
                                                            }
        );
    }

    // Function to handle Edgeberry Core service restart
    // by listening to NameOwnerChanged signal
    private monitorService() {
        this.systemBus.getService('org.freedesktop.DBus').getInterface(
            '/org/freedesktop/DBus',
            'org.freedesktop.DBus',
            (err:any, iface:any) => {
                if (err) return console.error('Failed to get DBus interface:', err);
                iface.on('NameOwnerChanged', (name:string, oldOwner:string, newOwner:string) => {
                    if (name === this.serviceName ) {
                        if (oldOwner && !newOwner) {
                            console.log('Edgeberry Core Service has stopped. Removing event listeners from interface');
                            //if(this.edgeberryCore) this.edgeberryCore.off(SIGNAL_NAME);
                        } else if (!oldOwner && newOwner) {
                            console.log('Edgeberry Core Service has started.');
                            this.subscribeToEdgeberryCore(); // Re-subscribe to signals
                        }
                    }
                });
            }
        );
    }

    // Set the application info in the Edgeberry Core
    public setApplicationInfo( name:string, version:string, description:string ){
        if(!this.edgeberryCore) return;
        this.edgeberryCore.SetApplicationInfo(JSON.stringify({name:name, version:version, description:description}));
    }

    // Update the application status in the Edgeberry Core
    public updateStatus( level:string, message:string ){
        if(!this.edgeberryCore) return;
        this.edgeberryCore.SetApplicationStatus(JSON.stringify({level:level, message:message}));
    }
}