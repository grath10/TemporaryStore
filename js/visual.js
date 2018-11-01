/**
 * 写在最前面：
 * 演示电梯数量较少，直接在地图上面显示标记，未接入实时性
 * 鼠标点击时弹出信息框，包括状态信息、实时对讲、视频回放
 * 腾讯地图滚轮缩放图层级别
 * 前置条件：启动代理服务器、确保网络连通
 * 2018-10-25  增加大华摄像头
 */
var bufferObj = buffer['Buffer'];
var client;
var layer = layui.layer;

var ua = navigator.userAgent.toLowerCase();
var g_ocx;
var PLUGINS_CLASSID = '5B709BF0-B3BB-4287-8107-B40D88394F48';
var Sys = {};
var s;
(s = ua.match(/(msie\s|trident.*rv:)([\d.]+)/)) ? Sys.ie = s[2] :
    (s = ua.match(/firefox\/([\d.]+)/)) ? Sys.firefox = s[1] :
        (s = ua.match(/chrome\/([\d.]+)/)) ? Sys.chrome = s[1] :
            (s = ua.match(/opera.([\d.]+)/)) ? Sys.opera = s[1] :
                (s = ua.match(/version\/([\d.]+).*safari/)) ? Sys.safari = s[1] : 0;
var PLUGINS_NAME = 'WebActiveEXE.Plugin.DH.1';
var hasPlugin = checkPlugins();

var mainOcxHtml = '';
if (Sys.ie){
    mainOcxHtml = '<object id="ocx" width="100%" height="100%" classid="CLSID:{' + PLUGINS_CLASSID + '}" codebase="/webrec.cab"></object>';
} else {
    mainOcxHtml = '<object id="ocx" width="100%" height="100%" type="application/npmedia-plugin-dahua-normal" VideoWindTextColor="9c9c9c" VideoWindBarColor="414141"></object>';
}

$(function () {
    // client = mqtt.connect('ws://localhost:3000');
    // debugger;
    // 检查插件是否已经安装过
    var iRet = WebVideoCtrl.I_CheckPluginInstall();
    if (-2 == iRet) {
        layer.open({
            title: '警告',
            content: 'Chrome浏览器版本过高，不支持NPAPI插件!'
        });
        return;
    } else if (-1 == iRet) {
        layer.open({
            title: '警告',
            content: '未安装过插件，点击' + '<a href="./system/plugin/download?name=WebComponentsKit.exe" target="_blank">链接</a>下载WebComponentsKit.exe安装!'
        });
        return;
    }

    var oPlugin = {
        iWidth: 600,    // plugin width
        iHeight: 400    // plugin height
    };
    // 初始化插件参数及插入插件
    WebVideoCtrl.I_InitPlugin(oPlugin.iWidth, oPlugin.iHeight, {
        bWndFull: true,     //是否支持单窗口双击全屏，默认支持 true:支持 false:不支持
        iWndowType: 1,
        cbSelWnd: function (xmlDoc) {}
    });
    WebVideoCtrl.I_InsertOBJECTPlugin("divPlugin");

    // 检查插件是否最新
    if (-1 == WebVideoCtrl.I_CheckPluginVersion()) {
        layer.open({
            title: '警告',
            content: '检测到新的插件版本，点击链接下载WebComponentsKit.exe升级!'
        });
        window.open("./system/plugin/download?name='WebComponentsKit.exe'");
        return;
    }

    if(!hasPlugin) {
        layer.open({
            title: '警告',
            content: '未安装过插件，点击<a target="_blank" href="./system/plugin/download?name=webplugin.exe">链接</a>下载WebPlugin.exe安装!'
        });
    } else {
        loadPageOcx();
    }

    // 关闭浏览器
    $(window).unload(function () {
        WebVideoCtrl.I_Stop();
    });

    // 右侧窗口展开伸缩
    $('#fold-btn').click(function() {
        $('#map-list').toggleClass("listinfo-open");
        var btnPosition = $('#fold-btn').css("right");
        if(btnPosition == '0px') {
            $('#fold-btn').css("right", "365px");
            $('.mapicon').removeClass('fold-icon');
        } else {
            $('#fold-btn').css("right", "0px");
            $('.mapicon').addClass('fold-icon');
        }
    });
    renderView();
});

// 检测浏览器是否存在视频插件
function checkPlugins(){
    var result;
    if (Sys.ie) {
        try {
            result = new ActiveXObject(PLUGINS_NAME);
            delete result;
        } catch (e) {
            return false;
        }
        return true;
    } else {
        navigator.plugins.refresh(false);
        result = navigator.mimeTypes["application/npmedia-plugin-dahua-normal"];
        return !!(result && result.enabledPlugin);
    }
}

function loadPageOcx() {
    document.getElementById('f_ocx').innerHTML = mainOcxHtml;
    g_ocx = document.getElementById('ocx');
    // 设置显示窗口数量
    // g_ocx.SetWinBindedChannel(1, 0, 0, 0);
}

var markersArray = [];
// 创建Map实例
var map = new qq.maps.Map(
    document.getElementById("allmap"), {
        // 该地图类型显示普通的街道地图
        mapTypeId: qq.maps.MapTypeId.ROADMAP,
        // 不启用地图类型控件
        mapTypeControl: false,
        // scrollwheel: false,
        // 不启用缩放控件
        zoomControl: false,
        // 不启用平移控件
        panControl: false,
        minZoom: 8,
        maxZoom: 18
});
var infoWin = new qq.maps.InfoWindow({
    map: map
});

function formatVal(val) {
    return typeof val == 'undefined' ? '--' : val;
}

// 演示效果：直接在地图上展示数据
function renderView() {
    $.ajax({
        url: '/map/view',
        data: null,
        type: 'get',
        async: false,
        success: function (result) {
            $("#loading-tip").css('display', 'none');
            // for (var i = 0; i < result.length; i++) {
            var i = 0;
                var one = result[i], marker, property;
                var gps = one['gps'],
                    arr = gps.split(','),
                    longitude = arr[0], latitude = arr[1],
                    name = one['name'],
                    state = one['status'],
                    point = new qq.maps.LatLng(latitude, longitude),
                    color = getColorByCurrentState(state);
                /*
                if(i == 0) {
                    property = $.extend(
                        {}, one, {
                            "longitude": longitude,
                            "latitude": latitude,
                            "ip": "192.168.0.250",
                            "username": 'admin',
                            "password": 'zqtech66',
                            "group": 1       // 0-大华，1-海康
                        });     // 现场环境参数
                } else if(i == 1) {
                */
                    property = $.extend(
                        {}, one, {
                            "longitude": longitude,
                            "latitude": latitude,
                            "ip": "192.168.1.108",
                            "username": 'admin',
                            "password": 'zqtech66',
                            "group": 0       // 0-大华，1-海康
                        });     // 现场环境参数
                // }
                if(i == 0) {
                    map.panTo(point);
                    map.zoomTo(18);
                }
                marker = new mockStateOverlay(point, name, state, color, property);
                markersArray.push(marker);
                marker.setMap(map);
            // }
            $("#loading-cover").css('display', 'none');
        },
        error: function () {
            console.log('查询失败');
        }
    });
}

function getColorByCurrentState(state) {
    var color;
    switch(state) {
        case '1':
            color = '#2B81FF';  // 保养
            break;
        case '2':
            color = '#808080';  // 维修
            break;
        case '3':
            color = '#FF9F3A';  // 困人
            break;
        case '4':
            color = '#F54336';   // 救援
            break;
        default:
            color = '#40AA24';  // 正常
            break;
    }
    return color;
}

function getRealtimeStream(json) {
    var str = JSON.stringify(json);
    var group = json.group;
    var flag = '';
    if(group == 0) {
        flag = '-dh';
    } else if(group == 1) {
        flag = '-hk';
    }
    $('#params' + flag).val(str);
    $("#video-panel" + flag).modal('show');
}

function formatTimestamp(timestamp) {
    return timestamp ? new Date(timestamp).format('yyyy-MM-dd hh:mm:ss') : '--';
}

/**
 * 视频回放功能待联调
 * 通过读取FTP指定路径下文件
 * 可能存在的问题：如何唯一确定文件名称，文件名与事件响应映射关系，避免出现错乱
 * 事件驱动方式响应
 */
function playVideoBack() {
    client.publish("A/PA", bufferObj.from([0x32]), {
        qos: 1
    });
    /*$.ajax({
        url: '/cmd/receiveStream',
        data: null,
        type: 'get',
        async: false,
        success: function (response) {
            if(response != '') {
                setTimeout(function () {
                    var str = '<video id="record-player" controls="controls" width="100%" height="300" controlslist="nodownload" src="'
                        + 'system/' + response + '.mp4">浏览器不支持video标签!</video>';
                    $('#videoContainer').html(str);
                    $('#video-modal-panel').modal('show');
                }, 5000);
            }
        },
        error: function () {
            console.log('查询失败');
        }
    });*/
}

function getRidingDirection(val) {
    var dir;
    switch(val) {
        case '1':
            dir = '上行';
            break;
        case '0':
            dir = '下行';
            break;
        case '2':
            dir = '静止';
            break;
        default:
            dir = '未知';
            break;
    }
    return dir;
}

function getDoorState(val) {
    var state;
    switch(val) {
        case '0':
            state = '关';
            break;
        case '1':
            state = '开';
            break;
        default:
            state = '其他';
            break;
    }
    return state;
}
