$(function () {
    debugger;
    var stompClient = null;

    /***
     * stompclient
     * connect to real-time channel
     */
    function setConnected(connected) {
        if (connected) {
            console.log("实时数据通道连接成功");
        } else {
            console.log("实时数据通道断开，请稍后刷新重试...");
        }
    }

    function connect() {
        var socket = new SockJS('/websocket/endpoint');
        stompClient = Stomp.over(socket);
        stompClient.connect({}, {}, function (frame) {
            setConnected(true);
            console.log('开始进行连接, connected: ' + frame);

            stompClient.subscribe('/websocket/status', function (response) {
                var data = JSON.parse(response.body);
                processStatus(data);
                $("#li-busy").css('display', 'none');
            })
        }, function (error) {
            if (error.indexOf('Lost connection') > 0) {
                setConnected(false);
            }
        })
    }

    function disconnect() {
        if (stompClient != null) {
            stompClient.disconnect();
        }
        setConnected(false);
        console.log('disconnected');
    }

    connect();
    $("#loading-mask").show();
});


function processStatus(data) {
    if(data) {
        // 刷新页面

    }
}