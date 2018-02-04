/*
homebridge-avea-bulb
Version 1.1.0

Avea bulb plugin for homebridge: https://github.com/nfarina/homebridge
Using Node.js Avea Bulb Prototol: https://github.com/Marmelatze/avea_bulb/tree/avea_server

Copyright (c) 2017 @Kounch

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby
granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING
ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL,
DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE
USE OR PERFORMANCE OF THIS SOFTWARE.

Sample configuration file
{
    "bridge": {
    	...
    },
    "description": "...",
    "accessories": [
        {
            "accessory": "AveaBulb",
            "name": "Kitchen Bulb"
        }
    ],
    "platforms":[
      ...
    ]
}
*/


var Service, Characteristic;
var Noble = require("noble");
var AveaBulb = require("./lib");

//Limits for Scanning
var noOfSeqScans = 0;
const maxNoOfSeqScans = 5;

//Avea protocol service ID
var serviceUUID = ["f815e810456c6761746f4d756e696368"];


module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-avea-bulb", "AveaBulb", AveaBulbAccessory);
};

function AveaBulbAccessory(log, config) {
    this.log = log;

    this.name = config.name || "Avea Bulb";
    this.manufacturer = config.manufacturer || "Elgato";
    this.model = config.model || "Avea";
    this.serialnumber = config.serialnumber || "Avea_7F14";
    this.bluetoothid = config.bluetoothid || null;

    //Internal data
    this.bulb = null;
    this.perifSel = null;
    this.scanning = false;
    this.bChangeSth = false;

    // Required Characteristics

    // On: Bool
    this.On = false;

    // Optional Characteristics

    // Brightnes:: Int (0:100)
    this.Brightness = 100;
    // Hue: Float (0.00:360.00)
    this.Hue = 0.00;
    // Saturation: Float (0.00:100.00)
    this.Saturation = 100.00;

    this.service = new Service.Lightbulb(this.name);
}

AveaBulbAccessory.prototype = {
    // Noble State Change
    nobleStateChange: function (state) {
        if (state == "poweredOn") {
            this.log.debug("Starting Noble scan..");
            Noble.on('scanStop', function () {
                setTimeout(function () {
                    this.log.debug('Restart from scan stop');
                    this.startScanningWithTimeout();
                }.bind(this), 2500);
            }.bind(this));
            Noble.on("discover", this.nobleDiscovered.bind(this));
            this.startScanningWithTimeout();
            this.scanning = true;
        } else {
            this.log.debug("Noble state change to " + state + "; stopping scan.");
            Noble.removeAllListeners('scanStop');
            Noble.stopScanning();
            this.scanning = false;
        }
    },
    // Noble Discovery
    nobleDiscovered: function (peripheral) {
        this.log.info("Discovered:", peripheral.uuid);
        if (this.perifSel == null) {
            if ((peripheral.uuid == this.bluetoothid) || (this.bluetoothid == null)) {
                this.perifSel = peripheral;
                this.log.info("UUID matches!");
                this.stopScanning();
                this.scanning = false;
                this.bulb = new AveaBulb.Avea(this.perifSel);
                this.bulb.connect(function (error) {
                    this.onBulbConnect(error, peripheral);
                }.bind(this));
            } else {
                this.log.info("UUID not matching");
            }
        } else {
            // do a reconnect if uuid matches
            if (peripheral.uuid == this.bluetoothid) {
                this.log.info("Lost bulb appears again!");
                this.perifSel = peripheral;
                if (this.perifSel.state != "connected") {
                    Noble.stopScanning();
                    this.scanning = false;
                    this.bulb = new AveaBulb.Avea(this.perifSel);
                    this.bulb.connect(function (error) {
                        this.onBulbConnect(error, peripheral);
                    }.bind(this));
                } else {
                    this.log.info("Undefined state");
                }
            } else {
                this.log.info("This is not the bulb you are looking for");
            }
        }
    },
    // Noble Stop Scan
    nobleScanStop: function () {
        this.log.debug("ScanStop received");
        if (this.perifSel == null && maxNoOfSeqScans > noOfSeqScans++) {
            //Retry scan
            setTimeout(function () {
                this.log.debug('Retry from scan stop');
                this.startScanningWithTimeout();
            }.bind(this), 2500);
        } else {
            this.scanning = false;
        }
    },
    startScanningWithTimeout() {
        Noble.startScanning(serviceUUID, false);
        setTimeout(function () {
            if (Noble.listenerCount('discover') == 0) { return; }
            this.log.debug('Discovery timeout');
            Noble.stopScanning();
            this.scanning = false;
        }.bind(this), 12500);
    },
    stopScanning() {
        Noble.removeListener('discover', this.nobleDiscovered.bind(this))
        if (Noble.listenerCount('discover') == 0) {
            Noble.removeAllListeners('scanStop');
            Noble.stopScanning();
        }
    },
    onBulbConnect(error, peripheral) {
        if (error) {
            this.log.error("Connecting to " + peripheral.address + " failed: " + error);
            this.onDisconnect(error, peripheral);
            return;
        }
        this.log.debug("Connected to " + peripheral.address);
    },
    onDisconnect(error, peripheral) {
        peripheral.removeAllListeners();
        this.log.info("Disconnected");
        this.nobleDiscovered(peripheral);
    },
    RGBtoHSV: function (R, G, B) {
        //Input and result scale
        var scale = 4095.0;
        R = parseFloat(R) / scale;
        G = parseFloat(G) / scale;
        B = parseFloat(B) / scale;

        //Max
        var M = Math.max(R, Math.max(G, B));
        //Min
        var m = Math.min(R, Math.min(G, B));
        // Chroma
        var C = M - m;

        //Hue (0-360)
        var H1 = 0.0;
        if (C != 0.0) {
            if (M == R) {
                H1 = ((G - B) / C) % 6.0;
            } else if (M == G) {
                H1 = ((B - R) / C) + 2.0;
            } else {
                H1 = ((R - G) / C) + 4.0;
            }
        }
        H = H1 * 60.0;
        if (H < 0.0) {
            H = 180.0 - H;
        }

        //HSV
        //lightness(0.0-1.0)
        V = M;
        //saturation (0.0-1.0)
        S = 0.0;
        if (V != 0.0) {
            S = C / V;
        }
        var HSV = [H, S, V];
        HSI = HSV;

        return (HSI);
    },
    // Convert HSV to RGBW
    HSVtoRGBW: function (H, S, V) {
        //Result scale
        var scale = 4095.0;
        //Convert to Radians
        var H = 3.14159 * H / 180.0;

        if (H < 2.09439) {
            var cos_h = Math.cos(H);
            var cos_1047_h = Math.cos(1.047196667 - H);
            var r = S * V / 3.0 * (1.0 + cos_h / cos_1047_h);
            var g = S * V / 3.0 * (1.0 + (1.0 - cos_h / cos_1047_h));
            var b = 0.0;
            w = (1.0 - S) * V;
        } else if (H < 4.188787) {
            H = H - 2.09439;
            var cos_h = Math.cos(H);
            var cos_1047_h = Math.cos(1.047196667 - H);
            var g = S * V / 3.0 * (1.0 + cos_h / cos_1047_h);
            var b = S * V / 3.0 * (1.0 + (1.0 - cos_h / cos_1047_h));
            var r = 0.0;
            var w = (1.0 - S) * V;
        } else {
            var H = H - 4.188787;
            var cos_h = Math.cos(H);
            var cos_1047_h = Math.cos(1.047196667 - H);
            var b = S * V / 3.0 * (1.0 + cos_h / cos_1047_h);
            var r = S * V / 3.0 * (1.0 + (1.0 - cos_h / cos_1047_h));
            var g = 0.0;
            var w = (1 - S) * V;
        }
        r *= scale;
        g *= scale;
        b *= scale;
        w *= scale;

        var RGBW = [Math.round(r), Math.round(g), Math.round(b), Math.round(w)];
        return (RGBW);
    },
    RGBWtoHSV: function (r, g, b, w) {
        //Data scale
        var scale = 4095.0;
        //RGBW -> HSI
        var H = this.RGBtoHSV(r / scale, g / scale, b / scale)[0];
        var S = 0;
        if ((r + g + b + w) != 0) {
            S = 1.0 - (w / (r + g + b + w));
        }
        var V = (r + g + b + w) / scale;

        var nHSI = [Math.round(H * 10000.0) / 10000, Math.round(S * 10000.0) / 10000, Math.round(V * 10000.0) / 10000];
        return (nHSI);
    },
    //Send color to bulb
    sendToLight: function (posValue, callback) {
        if ((this.perifSel != null) && (this.perifSel.state == "connected") && (this.bulb.connected == true)) {
            if (posValue == true) {
                //Saturation + Value: 0-100 -> 0-1
                var myRGBW = this.HSVtoRGBW(this.Hue, this.Saturation / 100.0, this.Brightness / 100.0);
                this.log.debug("Send to light WRGB:", myRGBW[3], myRGBW[0], myRGBW[1], myRGBW[2]);
                this.bulb.setColor(new AveaBulb.Color(myRGBW[3], myRGBW[0], myRGBW[1], myRGBW[2]), 0x00f);
            } else {
                this.log.debug("Send to light: Off");
                this.bulb.setColor(new AveaBulb.Color(0x000, 0x000, 0x000, 0x000), 0x4ff);
                this.bChangeSth = false;
            }
            callback(null);
        } else {
            if (!this.scanning) {
                this.startScanningWithTimeout();
            }
            callback(new Error("Device not Ready"));
        }
    },
    //Get info from bulb
    getFromLight: function (callback) {
        if ((this.perifSel != null) && (this.perifSel.state == "connected") && (this.bulb.connected == true)) {
            Promise.all([this.bulb.getName(), this.bulb.getColor(), this.bulb.getBrightness()]).then((data) => {
                //Colors
                var myRed = parseInt(data[1].target.red);
                var myGreen = parseInt(data[1].target.green);
                var myBlue = parseInt(data[1].target.blue);
                var myWhite = parseInt(data[1].target.white);
                this.log.debug("RGBW:", myRed, myGreen, myBlue, myWhite);
                //Brightness 0-4095 -> 0-100
                var myBrightness = parseInt(data[2] * 100 / 4095);
                //Hue
                var myHSV = this.RGBWtoHSV(myRed, myGreen, myBlue, myWhite);
                var myHue = myHSV[0];
                //Saturation 0.00-1.00 -> 0-100
                var mySaturation = myHSV[1] * 100.0;
                //Not used
                var myValue = myHSV[2];
                this.log.debug("HSB:", myHue, mySaturation, myBrightness);
                //Calculate Power State
                var bCheckColor = ((myWhite == 0) && (myRed == 0) && (myGreen == 0) && (myBlue == 0));
                var myPowerOn = true;
                if (bCheckColor == true) {
                    myPowerOn = false;
                }
                callback(null, myPowerOn, myBrightness, myHue, mySaturation);
            }).catch(e => {
                callback(e);
            });
        } else {
            if (!this.scanning) {
                this.startScanningWithTimeout();
            }
            callback(new Error("Device not Ready"));
        }
    },
    //Start
    identify: function (callback) {
        var delay = 500;
        var count = 3;
        this.log.debug("Identify requested!");
        var oldState = this.Brightness;
        this.getBrightness(function (error, curBright) {
            if (!error) {
                oldState = curBright;
            }
        });
        for (var i = 0; i < count; i++) {
            setTimeout(function () {
                this.log.debug("Off");
                this.setBrightness(0, function (error) { });
            }.bind(this), delay * (1 + i * 2));

            setTimeout(function () {
                this.log.debug("On");
                this.setBrightness(100, function (error) { });
            }.bind(this), delay * (2 + i * 2));
        }
        setTimeout(function () {
            this.log.debug("Old Brightness");
            this.setBrightness(oldState, function (error) { });
            callback(null);
        }.bind(this), delay * (2 + count * 2));
    },
    // Required
    getOn: function (callback) {
        this.getFromLight(function (error, powerOn, brightness, hue, saturation) {
            if (error) {
                callback(error, this.On);
            } else {
                this.On = powerOn;
                this.log.debug("getOn :", this.On);
                callback(null, this.On);
            }
        }.bind(this));
    },
    setOn: function (value, callback) {
        if (value === undefined) {
            callback();
        } else {
            this.log.debug("setOn from/to:", this.On, value);
            var oldState = this.On;
            this.On = value;
            if ((value == false) || (this.bChangeSth == false)) {
                this.sendToLight(value, function (error) {
                    if (error) {
                        this.On = oldState;
                        callback(error);
                    } else {
                        callback(null);
                    }
                }.bind(this));
            } else {
                callback(null);
            }
        }
    },
    // Optional
    getBrightness: function (callback) {
        this.getFromLight(function (error, powerOn, brightness, hue, saturation) {
            if (error) {
                callback(error, this.Brightness);
            } else {
                this.Brightness = brightness;
                this.log.debug("getBrightness:", this.Brightness);
                callback(null, this.Brightness);
            }
        }.bind(this));
    },
    setBrightness: function (value, callback) {
        if (value === undefined) {
            callback();
        } else {
            this.log.debug("setBrightness from/to:", this.Brightness, value);
            //Brightness 0-100 -> 0-4095
            var brightValue = parseInt(value * 40.95);
            if ((this.perifSel != null) && (this.perifSel.state == "connected") && (this.bulb.connected == true)) {
                this.bulb.setBrightness(brightValue);
                this.Brightness = value;
                callback(null);
            } else {
                if (!this.scanning) {
                    this.startScanningWithTimeout();
                };
                callback(new Error("Device not Ready"));
            }
        }
    },
    getHue: function (callback) {
        this.getFromLight(function (error, powerOn, brightness, hue, saturation) {
            if (error) {
                callback(error, this.Hue);
            } else {
                this.Hue = hue;
                this.log.debug("getHue:", this.Hue);
                callback(null, this.Hue);
            }
        }.bind(this));
    },
    setHue: function (value, callback) {
        if (value === undefined) {
            callback();
        } else {
            this.log.debug("setHue from/to:", this.Hue, value);
            var oldState = this.Hue;
            this.bChangeSth = true;
            this.Hue = value;
            this.sendToLight(true, function (error) {
                if (error) {
                    this.Hue = oldState;
                    callback(error);
                } else {
                    callback(null);
                }
            }.bind(this));
        }
    },
    getSaturation: function (callback) {
        this.getFromLight(function (error, powerOn, brightness, hue, saturation) {
            if (error) {
                callback(error, this.Saturation);
            } else {
                this.Saturation = saturation;
                this.log.debug("getSaturation:", this.Saturation);
                callback(null, this.Saturation);
            }
        }.bind(this));
    },
    setSaturation: function (value, callback) {
        if (value === undefined) {
            callback();
        } else {
            this.log.debug("setSaturation from/to:", this.Saturation, value);
            var oldState = this.Saturation;
            this.bChangeSth = true;
            this.Saturation = value;
            this.sendToLight(true, function (error) {
                if (error) {
                    this.Saturation = oldState;
                    callback(error);
                } else {
                    callback(null);
                }
            }.bind(this));
        }
    },
    getName: function (callback) {
        this.log.debug("getName :", this.name);
        callback(null, this.name);
    },

    getServices: function () {
        // you can OPTIONALLY create an information service if you wish to override
        // the default values for things like serial number, model, etc.
        var informationService = new Service.AccessoryInformation();

        informationService
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, this.serialnumber);

        // Required Characteristics
        this.service
            .getCharacteristic(Characteristic.On)
            .on('get', this.getOn.bind(this))
            .on('set', this.setOn.bind(this));

        // Optional Characteristics
        this.service
            .getCharacteristic(Characteristic.Brightness)
            .on('get', this.getBrightness.bind(this))
            .on('set', this.setBrightness.bind(this));
        this.service
            .getCharacteristic(Characteristic.Hue)
            .on('get', this.getHue.bind(this))
            .on('set', this.setHue.bind(this));
        this.service
            .getCharacteristic(Characteristic.Saturation)
            .on('get', this.getSaturation.bind(this))
            .on('set', this.setSaturation.bind(this));
        this.service
            .getCharacteristic(Characteristic.Name)
            .on('get', this.getName.bind(this));

        //Initialise the Noble service for talking to the bulb
        Noble.on('stateChange', this.nobleStateChange.bind(this));
        Noble.on('scanStop', this.nobleScanStop.bind(this));

        return [informationService, this.service];
    }
};
