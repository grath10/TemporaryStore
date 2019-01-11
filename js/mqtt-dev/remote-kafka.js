var Kafka = require('kafka-node');
var HighLevelProducer = Kafka.HighLevelProducer,
	client = new Kafka.KafkaClient({
		kafkaHost: '192.168.1.119:9092'
	}),
	producer = new HighLevelProducer(client);

producer.on('error', function(err) {
	console.log(err);
});

module.exports = producer;