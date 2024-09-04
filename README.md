![Edgeberry banner](documentation/Freya_banner.png)

The **Freya Vivarium Control System Core** is Freya's central, hardware-independent application for advanced climate simulation within a managed environment. It regulates various environmental variables (e.g. lighting, humidity, temperature, ...) according to user-defined settings. By processing sensor data received via its D-Bus interface, the system calculates and sends the necessary instructions to the actuators, also via the D-Bus interface, to maintain the desired conditions. The Core requires hardware-specific components that interface with the physical sensors and actuators.

**Features:**
- Temperature control
- Humidifier control
- Precipitation control
- Lighting control

## Installation
On your device, install the Freya Vivarium Control System software by downloading and executing the installation script
```
wget -O install.sh https://github.com/Freya-Vivariums/Freya-core/releases/latest/download/install.sh;
chmod +x ./install.sh;
sudo ./install.sh;
```

## Usage

### System service
The Freya Vivarium Control System Core software is installed as a `systemd` service, that is automatically started on boot. For manually starting, stopping and checking the status, use `systemctl`.
```
systemctl status io.freya.Core
```

## Application development
The Freya Vivarium Control System Core uses DBus for interaction with other applications.

### Sensors

| Object        | Method         | Argument                                | Returns      |
|---------------|----------------|-----------------------------------------|--------------|
| io.freya.Core | setMeasurement | {"variable":"temperature","value":21.4} |              |
|               | setMeasurements| [{},{},{},...]                          |              |

You can call a method from the commandline using:
```
dbus-send --system --print-reply --type=method_call --dest=io.freya.Core /io/freya/Core io.freya.Core.setMeasurement string:'{"variable":"temperature","value":"21.3"}'
```
### Actuators
The actuator values are emitted by the DBus object.

| Object        | Signal         | Argument                                |
|---------------|----------------|-----------------------------------------|
| io.freya.Core | updateActuator | {"actuator": , "value": [on/off]}       |

You can listen to the emitted signals from the commandline using:
```
dbus-monitor --system "type='signal',interface='io.freya.Core'"
```


## License & Collaboration
**Copyright© 2024 Sanne 'SpuQ' Santens**. This project is released under the [**GNU GPLv3**](https://www.gnu.org/licenses/gpl-3.0.en.html) license. However, trademark rules apply to the Freya™ brand.

### Collaboration

If you'd like to contribute to this project, please follow these guidelines:
1. Fork the repository and create your branch from `main`.
2. Make your changes and ensure they adhere to the project's coding style and conventions.
3. Test your changes thoroughly.
4. Ensure your commits are descriptive and well-documented.
5. Open a pull request, describing the changes you've made and the problem or feature they address.