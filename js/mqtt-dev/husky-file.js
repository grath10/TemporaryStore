const mqtt = require('mqtt');
var fs = require('fs');
// IP地址为实际broker对应地址
var client = mqtt.connect('tcp://192.168.1.112:1883', {
	clientId: 'lift-platform'
});
client.on('connect', function() {
	console.log('>>> platform connected');
	// '$SYS/+/new/clients' 主题: 上线
	client.subscribe('X/+', {
		qos: 1
	});
});

client.on('message', function(topic, message) {
	// message为Buffer类型
	console.log("当前消息主题:", topic);
	// 刚上线触发
	if (topic.indexOf('$SYS') > -1) {
		var clientid = message.toString();
		// 浏览器客户端连接时clientId为随机码
		if (clientid.indexOf('mqtt') == -1) {
			console.log("中转板编号:", clientid);
		}
	} else {
		// console.log("原始数据:", message);
		// 提取样本数据供分析结构所用
		var msg = message.toString('hex');
		msg += '\n';	// 换行
		fs.appendFile('./log-lift.txt', msg, function(err){
			if(err){
				console.log('写入文件失败');
			}else{
				console.log('写入文件成功');
			}
		});
		/**
		实际测试发现，两种编码方式得到的内容相同
		var s_msg = message.toString();
		s_msg += '\n';	// 换行
		fs.appendFile('./log-lift-s.txt', msg, function(err){
			if(err){
				console.log('写入文件失败');
			}else{
				console.log('写入文件成功');
			}
		});
		**/
	}
});