var kafka = require('./remote-kafka.js');

function publishMessages(info) {
	var payload = [{
		topic: 'IOT-LIFT-STATUS',
		messages: info
	}];
	kafka.send(payload, function(err, data) {
		if(err) {
			console.log(err);
		}
	});
}

publishMessages([1,2,3,4]);