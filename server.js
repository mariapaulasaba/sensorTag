//node libraries
var noble = require('noble'),
    fs = require('fs'),
    http = require('http'),
	async = require('async');

// create a server 
var server = http.createServer(app); 

// start the server 
server.listen(8080);
console.log('Server is listening to http://localhost on port 8080');

//JSON object to read JSON from file
var finalData = {} ;

//write get request to handle hte JSON file
function app(req, res) {

	//read JSON file
	fs.readFile(__dirname+ "/sensorTagData.json", function(err, data) {
		if (err) throw err;
		console.log(data);
		var file = JSON.parse(data);
		finalData = JSON.stringify( file );	
			console.log(finalData);
		});
	//writes the JSON file to the web (for some reason it is only working in the second request, first request error: xpcError: connection interrupted)
	if(finalData){
		res.writeHead(200, {'Content-Type': 'text/plain'});
	    res.end(""+finalData);
	}
}

 
//var sensorTagUUID = process.argv[2];

//JSON object to store sensorTagData
var sensorTagData = {  id: "1",
					UUID: "89a1cbb64af644629a90931ebd9bb850",
					tempData: {},
				    accelData: {},
				    humidityData: {},
				    magData: {},
				    barometerData: {},
				    gyroData: {},
					rssiData: {}
}
	

//variable to save services and characteristics UUIDs
var IR_Temp_UUID = 		'f000aa0004514000b000000000000000';
var IR_Temp_DATA_UUID = 'f000aa0104514000b000000000000000';
var IR_Temp_CONFIG = 	'f000aa0204514000b000000000000000';

var ACCELEROMETER_UUID           = 'f000aa1004514000b000000000000000';
var ACCELEROMETER_DATA_UUID      = 'f000aa1104514000b000000000000000';
var ACCELEROMETER_CONFIG_UUID    = 'f000aa1204514000b000000000000000';
var ACCELEROMETER_PERIOD_UUID    = 'f000aa1304514000b000000000000000';

var HUMIDITY_UUID           = 'f000aa2004514000b000000000000000';
var HUMIDITY_DATA_UUID      = 'f000aa2104514000b000000000000000';
var HUMIDITY_CONFIG_UUID    = 'f000aa2204514000b000000000000000';
var HUMIDITY_PERIOD_UUID    = 'f000aa2304514000b000000000000000';

var MAGNETOMETER_UUID_UUID          	    = 'f000aa3004514000b000000000000000';
var MAGNETOMETER_DATA_UUID_DATA_UUID        = 'f000aa3104514000b000000000000000';
var MAGNETOMETER_CONFIG_UUID_CONFIG_UUID    = 'f000aa3204514000b000000000000000';
var MAGNETOMETER_PERIOD_UUID_PERIOD_UUID    = 'f000aa3304514000b000000000000000';

var BAROMETER_UUID           = 'f000aa4004514000b000000000000000';
var BAROMETER_DATA_UUID      = 'f000aa4104514000b000000000000000';
var BAROMETER_CONFIG_UUID    = 'f000aa4204514000b000000000000000';
var BAROMETER_PERIOD_UUID    = 'f000aa4304514000b000000000000000';


var GYRO_UUID           = 'f000aa5004514000b000000000000000';
var GYRO_DATA_UUID      = 'f000aa5104514000b000000000000000';
var GYRO_CONFIG_UUID    = 'f000aa5204514000b000000000000000';
var GYRO_PERIOD_UUID    = 'f000aa5304514000b000000000000000';




//variable to save peripheral and to check if it is connected to it
var sensorTagPeripheral;
var connected = false;


//Bluetooth ON or OFF
noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    console.log("start scanning");
    noble.startScanning();
  } else {
    noble.stopScanning();
    console.log("stop scanning, is Bluetooth on?");
  }
});



noble.on('discover', function(peripheral) {
	//when finding a peripheral, check the UUID to match the SensorTag UUID
	if(peripheral.uuid === sensorTagData.UUID){	
		sensorTagPeripheral = peripheral;
		explore(peripheral);   
		noble.stopScanning();
	}
	else{
		console.log("no sensorTag found");
	}
});


function explore(peripheral) {
	
	//connect to peripheral
    peripheral.connect(function(error){
        console.log('connected to peripheral');  
        connected = true;
		//log some data from it
		logData(peripheral);
		
		//start reading sensors
		startDataAcquisition(); 
     });
    
    //if disconnect, restart scan 
    peripheral.on('disconnect', function() {
        console.log('disconneted');
        connected = false;
        noble.startScanning();
    });
}

function logData(peripheral){
    var advertisement = peripheral.advertisement;
    var localName = advertisement.localName;
    var txPowerLevel = advertisement.txPowerLevel;
    var manufacturerData = advertisement.manufacturerData;
    console.log("Peripheral "+localName + " with UUID " + peripheral.uuid  + " found");
    console.log("TX Power Level "+ txPowerLevel + ", Manufacturer "+ manufacturerData);
}
   

function startDataAcquisition(){
	//if still connected, keep reading the sensors
    if(connected) {
		setInterval(updateData, 1000);
	}
	else{
		console.log("sensortag not connected");
	}  
}

function updateData(){
	//read RSSI values (signal strenght indicates distance)
    updateRSSI();
	
	//read other characteristics
    getData(); 
	
	//save data to JSON 
	fs.writeFile( "sensorTagData.json", JSON.stringify( sensorTagData ), "utf8", function(){
		console.log("data saved"); 
	});

}

function updateRSSI(){
	sensorTagPeripheral.updateRssi(function(error, rssi){
		sensorTagData.rssiData = rssi;
		//console.log(rssi);
	}); 
}


function getData(){
  
   //here I'm trying to read several several/characteristics at the same time	
/*   var serviceUUIDs = [ACCELEROMETER_UUID, IR_Temp_UUID];
   var characteristicUUIDs = [ACCELEROMETER_CONFIG_UUID,ACCELEROMETER_DATA_UUID, IR_Temp_CONFIG, IR_Temp_DATA_UUID ];
	
	sensorTagPeripheral.discoverSomeServicesAndCharacteristics(serviceUUIDs, characteristicUUIDs, function(error, services, characteristics){
		var accelerometerConfigCharacteristic = characteristics[0];
		var accelerometerDataCharacteristic = characteristics[1];
		
		//write "1" to data config to enable data aquisition
		accelerometerConfigCharacteristic.write(new Buffer([0x01]), false, function(error) {
			accelerometerDataCharacteristic.read(function(error, data) {
				//I'm getting different values than expected
				sensorTagData.accelData.x = data[0];
				sensorTagData.accelData.y = data[1];
				sensorTagData.accelData.z = data[2];
				console.log(sensorTagData.accelData);	
			});  
		});	
	});*/

//  here is a function to read ALL services and characteristics at the same, which is very slow	
/*	sensorTagPeripheral.discoverAllServicesAndCharacteristics(function(error, services, characteristics){
		console.log(services[1]);
		console.log(characteristics[1]);
    }); */	

//	here I'm reading a service/characteristic at each time. it works for 1, but if I repeat the code for another service, it breaks
		sensorTagPeripheral.discoverServices([ACCELEROMETER_UUID], function(error, services) {
        	var accelerometerService = services[0];
			console.log('discovered accel. service');			
			//discover charact. to Accel. Data service
			accelerometerService.discoverCharacteristics([ACCELEROMETER_CONFIG_UUID], function(error, characteristics) {
            	var accelerometerConfigCharacteristic = characteristics[0];              
            	//write 1 to config to enable accel.
				accelerometerConfigCharacteristic.write(new Buffer([0x01]), false, function(error) {
					console.log('enabling data aquisition for accelerometer');
					accelerometerService.discoverCharacteristics([ACCELEROMETER_DATA_UUID], function(error, characteristics) {
					var accelerometerDataCharacteristic = characteristics[0];
						accelerometerDataCharacteristic.read(function(error, data) {
							// data is a buffer, save it in the sensorTag JSON object
							sensorTagData.accelData.x = data[0];
							sensorTagData.accelData.y = data[1];
							sensorTagData.accelData.z = data[2];
							//console.log(sensorTagData.accelData.z);	
						});  
					});
				});

				
          	});
		});
	
	
//		however if I repeat the code for another service, it breaks.
/*			sensorTagPeripheral.discoverServices([IR_Temp_UUID], function(error, services) {
        	var tempService = services[0];
			console.log('discovered temp. service');			
			tempService.discoverCharacteristics([IR_Temp_CONFIG], function(error, characteristics) {
            	var tempCharacteristic = characteristics[0];              
            	//write 1 to config to enable accel.
				tempCharacteristic.write(new Buffer([0x01]), false, function(error) {
					console.log('enabling data aquisition for IR temp');
					tempService.discoverCharacteristics([IR_Temp_DATA_UUID], function(error, characteristics) {
					var tempDataCharacteristic = characteristics[0];
						tempDataCharacteristic.read(function(error, data) {
							// data is a buffer, save it in the sensorTag JSON object
							console.log(data[0]);							
							console.log(data[1]);							
							console.log(data[2]);							
							sensorTagData.tempData = data[0];	
						});  
					});
        		});
			  
          	});
        });
*/
}







