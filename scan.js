var noble = require('noble');
var fs = require('fs');

noble.startScanning([], true); // any service UUID, allow duplicates

noble.on('discover', callback);

function callback(peripheral)
{
	console.log(peripheral);
	if (peripheral == "SensorTag") {
		peripheral.on('connect',connectCallback);
	 	peripheral.connect();

	 }

}


noble.on('discover', function(peripheral) {
  peripheral.connect(function(error) {
    console.log('connected to peripheral: ' + peripheral.uuid);
  });
});