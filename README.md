# homebridge-avea-bulb
Avea Bulb Plugin for [HomeBridge](https://github.com/nfarina/homebridge)


---


## English

### What this plugin does
Using BLE, it adds Homekit support for Elgato Avea Bulbs.


### How this plugin works
Using Node.js [Avea Bulb Prototol](https://github.com/Marmelatze/avea_bulb/tree/avea_server) and BLE, allows to control Elgato Avea Bulbs via Homekit.

### Things to know about this plugin

### Installation
0. Make sure that bluetooth is installed, enabled and available in your system
1. Install homebridge using `npm install -g homebridge`.
2. Install this plugin using `npm install -g --unsafe-perm homebridge-avea-bulb`.
3. Update your configuration file. See configuration sample below.


### Configuration
Edit your `config.json` accordingly. Configuration sample:
 ```
    "accessories": [
        {
            "accessory": "AveaBulb",
            "name": "Avea Bulb"
        }
    ],
```


### Advanced Configuration (Optional)
This step is not required.
 ```
    "accessories": [
        {
            "accessory": "AveaBulb",
            "name": "Kitchen Lamp",
            "manufacturer": "Elgato",
            "model": "Avea",
            "serialnumber": "Avea_7F14",
            "bluetoothid": "001583d2147f"
        }
    ],
```


| Fields             | Description                                           | Required |
|--------------------|-------------------------------------------------------|----------|
| accessory          | Must always be `AveaBulb`.                            | Yes      |
| name               | Name of your device.                                  | No       |
| manufacturer       | Manufacturer of your device.                          | No       |
| model              | Model of your device.                                 | No       |
| serialnumber       | Serial number of your device.                         | No       |
| bluetoothid        | Bluetooth ID of the bulb (reverse serial number)      | No       |



\*Changing the `name` in `config.json` will create a new device instead of renaming the existing one in HomeKit. It's strongly recommended that you rename the bulb using a HomeKit app only.


---


## Castellano

### Para qué sirve este plugin
Añade soporte para Homekit a bombillas Elgato Avea, usando bluetooth (BLE).


### Cómo funciona
Usando el protocolo [Avea Bulb de Node.js](https://github.com/Marmelatze/avea_bulb/tree/avea_server) y bluetooth, permite controlar bombillas Elgato Avea a través de Homekit.

### Más información

### Instalación
0. Debe haber instalado, activo y disponible, bluetooth en el sistema donde se vaya a instalar
1. Instalar homebridge usando `npm install -g homebridge`.
2. Instalar este plugin con el comando `npm install -g --unsafe-perm homebridge-avea-bulb`.
3. Actualizar el fichero de configuración. Véase un ejemplo a continuación.


### Configuración
Editar el fichero `config.json` según se necesite. Ejemplo de configuración:
 ```
    "accessories": [
        {
            "accessory": "AveaBulb",
            "name": "Bombilla Avea"
        }
    ],
```


### Configuración avanzada (opcional)
Este paso no es necesario.
 ```
    "accessories": [
        {
            "accessory": "AveaBulb",
            "name": "Lámpara de la sala de estar",
            "manufacturer": "Elgato",
            "model": "Avea",
            "serialnumber": "Avea_7F14",
            "bluetoothid": "001583d2147f"
        }
    ],
```


| Campos             | Descripción                                           | Requerido |
|--------------------|-------------------------------------------------------|-----------|
| accessory          | Siempre ha de ser `AveaBulb`.                         | Sí        |
| name               | Nombre para el dispositivo.                           | No        |
| manufacturer       | Fabricante del dispositivo.                           | No        |
| model              | Modelo del dispositivo.                               | No        |
| serialnumber       | Número de serie del dispositivo.                      | No        |
| bluetoothid        | ID bluetooth de la bombillaof (núm. serie invertido)  | No        |



\*Cambiar el nombre `name` en `config.json` creará un nuevo dispositivo en vez de renombrar el existente en Homekit. Se recomienda que sólo se cambie el nombre de la bombilla usando una App de HomeKit.



## Copyright

Copyright (c) 2017 kounch

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
