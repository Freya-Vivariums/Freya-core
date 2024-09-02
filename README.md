![Edgeberry banner](documentation/Freya_banner.png)

<img src="documentation/vivarium.png" align="right" width="40%"/>

The **Freya Vivarium Control System Core** is Freya's central, hardware-independent application for advanced climate simulation within a managed environment. It regulates various environmental variables (e.g. lighting, humidity, temperature, ...) according to user-defined settings. By processing sensor data received via its D-Bus interface, the system calculates and sends the necessary instructions to the actuators, also via the D-Bus interface, to maintain the desired conditions. The Core requires hardware-specific components that interface with the physical sensors and actuators.

**Features:**
- Temperature control
- Humidifier control
- Precipitation control
- Lighting control

<br clear="right"/>

## API
The Freya Vivarium Control System core uses DBus for interaction with other applications.


| Object        | Method         | Argument                                | Returns      |
|---------------|----------------|-----------------------------------------|--------------|
| io.freya.Core | setMeasurement | {"variable":"temperature","value":21.4} |              |

The actuator values are emitted by the DBus object.

| Object        | Signal         | Argument                                |
|---------------|----------------|-----------------------------------------|
| io.freya.Core |                |                                         |


## License & Collaboration
**Copyright© 2024 Sanne 'SpuQ' Santens**. This project is released under the **GNU GPLv3** license.

### Collaboration

If you'd like to contribute to this project, please follow these guidelines:
1. Fork the repository and create your branch from `main`.
2. Make your changes and ensure they adhere to the project's coding style and conventions.
3. Test your changes thoroughly.
4. Ensure your commits are descriptive and well-documented.
5. Open a pull request, describing the changes you've made and the problem or feature they address.