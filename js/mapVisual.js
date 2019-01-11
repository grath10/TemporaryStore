var client = mqtt.connect('ws://localhost:3000');
var bufferObj = buffer['Buffer'];

var layer = layui.layer;
$(function () {
    debugger;

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
            content: '未安装过插件，点击' + '<a href="./system/plugin/download" target="_blank">链接</a>下载WebComponentsKit.exe安装!'
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
        window.open("./system/plugin/download");
        return;
    }

    // 关闭浏览器
    $(window).unload(function () {
        WebVideoCtrl.I_Stop();
    });
    queryPOI('新吴区', '320214', 3);

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
});

//最小级zoom，省级zoom
const ZOOM_PROVINCE_LEVEL = 5;
//市级zoom
const ZOOM_CITY_LEVEL = 8;
//区级zoom
const ZOOM_DISTRICT_LEVEL = 12;
//区县级zoom
const ZOOM_COMMUNITY_LEVEL = 15;
//缩放最大级别 zoom
const ZOOM_MAX_LEVEL = 18;
//当前zoom级别
var current_zoom = ZOOM_CITY_LEVEL;

//省市区县级别
const LEVEL_PROVINCE = 1;
const LEVEL_CITY = 2;
const LEVEL_DISTRICT = 3;
const LEVEL_POINT = 4;
var markersArray = [];

// 创建Map实例
var map = new qq.maps.Map(
    document.getElementById("allmap"), {
        // 该地图类型显示普通的街道地图
        mapTypeId: qq.maps.MapTypeId.ROADMAP,
        // 不启用地图类型控件
        mapTypeControl: false,
        scrollwheel: false,
        // 不启用缩放控件
        zoomControl: false,
        // 不启用平移控件
        panControl: false,
        minZoom: 8,
        maxZoom: 18
});
bindZoomListener(map);
var cityLocation = new qq.maps.CityService({
    complete: function (results) {
        map.setCenter(results.detail.latLng);
    }
});

var infoWin = new qq.maps.InfoWindow({
    map: map
});
/**
 * 自定义鼠标滚轮事件
 * 初始化zoom缩放监听事件
 */
function bindZoomListener(map) {
    var flag = true;
    const scrollFunc = function (e) {
        var center = map.getCenter();
        var current_zoom = map.getZoom();
        if(flag) {
            flag = false;
            setTimeout(function () {
                var isUp = false;
                //IE/Opera/Chrome 的滚轮判断为wheelDelta = +- 120 ，firefox的滚轮判断为detail = +- 3
                //+120为放大，-120为缩小 -3为放大，+3为缩小
                if(e.wheelDelta) {
                    if (e.wheelDelta == 120) {
                        isUp = true;
                    }
                }else if(e.detail) { // firefox
                    if(e.detail == -3){
                        isUp = true;
                    }
                }
                // 地图放大
                if(isUp) {
                    // 全省视图 -> 全市视图
                    /*if(current_zoom == ZOOM_CITY_LEVEL) {
                        var offsetPoint = new BMap.Pixel(e.offsetX, e.offsetY);
                        var targetPoint = map.pixelToPoint(offsetPoint);
                        getTargetInfo(true, targetPoint, undefined, 2);
                    } else if(current_zoom == ZOOM_DISTRICT_LEVEL) {
                        // getTargetInfo(true, center, undefined, 3);
                    }*/
                } else {
                    if(current_zoom == ZOOM_MAX_LEVEL || current_zoom == ZOOM_COMMUNITY_LEVEL) {
                        getTargetInfo(false, center, "", 3);
                    } else if(current_zoom == ZOOM_DISTRICT_LEVEL) {
                        getTargetInfo(false, center, "", 2);
                    }
                }
                flag = true;
            }, 300);
        }
    };
    var userAgent = navigator.userAgent;
    var isFirefox = userAgent.indexOf("Firefox") > -1; //判断是否Firefox浏览器
    if(isFirefox){
        document.addEventListener('DOMMouseScroll',scrollFunc,false);
    } else {
        window.onmousewheel = document.onmousewheel = scrollFunc;  //IE/Opera/Chrome
    }
}

// 根据当前行政区域层次显示下一层级信息  省-->市，市-->区，区-->电梯事件信息(区-->区域[点聚合])
/**
 * 通过名称或者区域编码检索相关信息
 * @param code  区域编码
 */
function queryPOI(name, code, level) {
    getTargetInfo(false, name, code, level);
}

// 根据所属市级区域获取对应详细数据
/**
 * @param result (包含信息：电梯名称、已耗时)
 */
function getSideBarDetail(result) {
    var html = '';
    for(var i = 0; i < result.length; i++) {
        var one = result[i];
        var timeExpense = Mock.Random.integer(0, 25);
        var longitude = one['longitude'], latitude = one['latitude'],
            markerName = one['name'],
            remark = one['remark'],
            color = getColorByState(remark);
        html += '<div class="item-mod" data-longitude="' + longitude + '" data-latitude="' + latitude + '" onclick="focusOnPoint('
            + longitude + ',' + latitude + ',\'' + markerName + '\')"><div class="item-info"><p style="color:' + color + '">电梯名称：' + markerName
            + '</p><p style="color: ' + color + '">已耗时(min)：' + timeExpense + '</p></div></div>';
    }
    $(".marquee").html(html).marquee({
        duration: 3000, //duration in milliseconds of the marquee
        gap: 50,    //gap in pixels between the tickers
        delayBeforeStart: 0,    //time in milliseconds before the marquee will start animating
        direction: 'up',
        duplicated: true,   //true or false - should the marquee be duplicated to show an effect of continues flow
        pauseOnHover: true
    });
    $('.chart').removeClass('notSeen');
    $(".event-content").addClass('notSeen');
    // 获取月度救援量、平均耗时
    var xAxis = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    var values = [2, 4, 7, 23, 25, 76, 135, 162, 32, 20, 6, 3];
    // drawBar('bar-chart', xAxis, '月度救援量', values);
    var xAxis = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    var values = [22.0, 24.9, 27.0, 23.2, 25.6, 26.7, 35.6, 22.2, 32.6, 20.0, 26.4, 23.3];
    // drawBar('cost-bar-chart', xAxis, '月度平均到场耗时', values);
}

function focusOnPoint(longitude, latitude, markerName) {
    var nodes = document.getElementsByClassName("item-mod");
    for(var i = 0; i < nodes.length;i++) {
        var node = nodes[i];
        if(node.dataset.longitude == longitude && node.dataset.latitude == latitude) {
            $(node).addClass('highlight');
        } else {
            $(node).removeClass('highlight');
        }
    }
    var cp = new qq.maps.LatLng(latitude, longitude);
    map.panTo(cp);
    map.zoomTo(18);
    // 根据事件编号获取详细事件信息
    var eventId = Mock.Random.id();
    var result = {
        "elevname":"鸿运苑六二期532单元右梯",
        "question":"移动端报警",
        "creatorid":137,
        "elevId":405,
        "notifytime":"2018-05-21 11:17:06",
        "closetime":"2018-05-21 11:20:46",
        "type":"2",
        "usedtime":3,
        "providername":"无锡智泉科技有限公司",
        "codeid":59,
        "ticketnum":"JY20180521-405-1",
        "id":60532,
        "creationtime":"2018-05-21 11:17:06",
        "custname":"鸿运苑第二社区",
        "status":"6",
        "spenttime":3
    };
    // 联动右侧下方数据
    var msg = '<div class="event-mod" data-longitude="' + longitude + '" data-latitude="' + latitude + '">'
        + '<div class="event-info"><p>电梯名称：' + markerName
        + '</p><p>事件编号：' + result.ticketnum + '</p><p>已耗时(min)：' + result.spenttime + '</p><p>事件状态：'
        + result.status + '</p><p>新建时间：' + result.creationtime + '</p><p>'
        + '<input type="button" class="btn btn-primary" value="视频回放" onclick="getVideo()"/>'
        + '</p></div></div>';
    $('.chart').addClass('notSeen');
    $(".event-content").removeClass('notSeen');
    $(".event-content").html(msg);
}

// 清除历史覆盖物
function deleteOverlays() {
    if(markersArray) {
        for(var i in markersArray) {
            markersArray[i].setMap(null);
        }
        markersArray.length = 0;
    }
}

// 在省层次(或者直辖市)上展示数据
function renderTopLevelView(name, result) {
    deleteOverlays();
    cityLocation.searchCityByName(name);
    map.zoomTo(8);
    hideSidebar();
    var point;
    for (var i = 0; i < result.length; i++) {
        var one = result[i], marker;
        var longitude = one['longitude'], latitude = one['latitude'],
            markerName = one['name'],
            remark = one['remark'],
            type = one['type'],
            areacode = one['code'];
        point = new qq.maps.LatLng(latitude, longitude);
        var perf = '当前救援量：' + Mock.Random.integer(60, 100) + ', 当月救援量：' + Mock.Random.integer(100, 1000);
        var color = getColorByState(remark);
        marker = new SquareOverlay(point, markerName, type, areacode, perf, color);
        marker.setMap(map);
        markersArray.push(marker);
    }
    $("#loading-cover").css('display', 'none');
    $("#loading-tip").css('display', 'none');
}

// 在市层次上展示数据
function renderSecondaryView(name, result) {
    deleteOverlays();
    hideSidebar();
    cityLocation.searchCityByName(name);
    map.zoomTo(12);
    var point;
    for (var i = 0; i < result.length; i++) {
        var one = result[i], marker;
        var longitude = one['longitude'], latitude = one['latitude'],
            markerName = one['name'],
            remark = one['remark'],
            type = one['type'],
            areacode = one['code'];
        point = new qq.maps.LatLng(latitude, longitude);
        var perf = '当前救援量：' + Mock.Random.integer(60, 100) + ', 当月救援量：' + Mock.Random.integer(100, 1000);
        var color = getColorByState(remark);
        marker = new SquareOverlay(point, markerName, type, areacode, perf, color);
        marker.setMap(map);
        markersArray.push(marker);
    }
    $("#loading-cover").css('display', 'none');
}

// 在区县层次上展示数据
function renderNextView(name, code, result) {
    deleteOverlays();
    $.ajax({
        url: '/map/location',
        data: {
            code: code,
            name: name
        },
        type: 'get',
        async: false,
        success: function (response) {
            var center = new qq.maps.LatLng(response.latitude, response.longitude);
            map.setCenter(center);
            map.zoomTo(15);
            $("#loading-tip").css('display', 'none');
            showSidebar();
            getSideBarDetail(result);
            // cityLocation.searchCityByName(name);
        },
        error: function () {
            console.log('查询失败');
        }
    });

    var point;
    for (var i = 0; i < result.length; i++) {
        var one = result[i], marker;
        var longitude = one['longitude'], latitude = one['latitude'],
            markerName = one['name'],
            remark = one['remark'];
        point = new qq.maps.LatLng(latitude, longitude);
        var timeExpense = Mock.Random.integer(0, 25);
        var property = {
            "ip": "192.168.0.250",
            "username": 'admin',
            "password": 'zqtech66'
        };     // 现场环境参数
        /*var property = {
          "ip": "169.254.125.4",
          "username": 'admin',
          "password": 'zqtech123'
        };*/
        marker = new RescueOverlay(point, 'images/cursor.png', markerName, remark, timeExpense, property);
        markersArray.push(marker);
        marker.setMap(map);
    }
    $("#loading-cover").css('display', 'none');
}

/**
 *
 * @param isDrilled  下钻标志位
 * @param result  获取信息点集合
 * @param name
 * @param level 当前行政区域级别
 * @param cp  中心坐标点
 * @param name 区域名称(适用于省、市、区)
 * @param code 区域编码
 */
function renderView(isDrilled, result, level, name, code) {
    if (isDrilled) {
        renderSecondaryView(name, result);
    } else {
        if (level == LEVEL_CITY) {
            renderTopLevelView(name, result);
        } else if (level == LEVEL_DISTRICT) {
            renderSecondaryView(name, result);
        } else if (level == LEVEL_POINT) {
            renderNextView(name, code, result);
        }
    }
}

function getTargetInfo (isDrilled, center, code, level) {
    // 根据中心点坐标反向推断出行政区域名称
    // 创建地理编码实例
    var myGeo = new qq.maps.Geocoder({
        complete: function (result) {
            if (result){
                var addComp = result.detail.addressComponents;
                var name = determineCurrentName(addComp.province, addComp.city, addComp.district, level);
                getInfoByNameOrCode(isDrilled, name, code, level);
            }
        }
    });
    if(center instanceof qq.maps.LatLng){
        // 根据中心点坐标得到地址描述
        myGeo.getAddress(center);
    } else {
        getInfoByNameOrCode(isDrilled, center, code, level);
    }
}

function determineCurrentName(province, city, district, level) {
    var name = "";
    switch (level) {
        case 1:
            name = province;
            break;
        case 2:
            name = city;
            break;
        case 3:
            name = district;
            break;
        default:
            name = province;
            break;
    }
    return name;
}

/**
 *
 * @param isDrilled
 * @param name
 * @param code
 * @param level
 */
function getInfoByNameOrCode(isDrilled, name, code, level) {
    // 根据信息从后台获取相应数据，查询关键字：name, code
    $.ajax({
        url: '/map/survey',
        data: {
            domainId: code,
            domainName: name,
            level: level
        },
        type: 'get',
        async: false,
        success: function (response) {
            renderView(isDrilled, response, +level + 1, name, code);
        },
        error: function () {
            console.log('查询失败');
        }
    });
}

function showSidebar() {
    $("#fold-btn").css("display", "block");
    $("#map-list").css("display", "block");
}

function hideSidebar() {
    $("#fold-btn").css("display", "none");
    $("#map-list").css("display", "none");
}

function getColorByState(state) {
    var color;
    switch(state) {
        case '1':
            color = '#F54336';   // 新建
            break;
        case '2':
            color = '#FF9F3A';  // 响应
            break;
        case '3':
            color = '#2B81FF';  // 到场
            break;
        case '4':
            color = '#808080';  // 无救援
            break;
        default:
            color = '#40AA24';  // 完成救援
            break;
    }
    return color;
}

/**
 * 按事件进度组成的饼图、按下级区划组成的饼图、按已耗时10分钟一档的饼图
 * @param domainId
 */
function getStatistics(domainId, level) {
    // 根据当前区域domainId获取以下信息
    $.ajax({
        url: '/map/statistics',
        type: 'get',
        data: {
            domainId: domainId
        },
        async: false,
        success: function (response) {
            var indexList = ['progress'];
            if(domainId.substring(4) == '00' && level == 2) {
                indexList.push('domain');
            }
            indexList.push('cost');
            for(var k = 0; k < response.length; k++) {
                var oneDetail = response[k];
                drawPie(indexList[k] + domainId, oneDetail);
            }
        },
        error: function () {
            console.log('查询失败');
        }
    });
}

function drawPie(id, values) {
    // 基于准备好的dom，初始化echarts实例
    var domId = document.getElementById(id);
    if(domId == null) {
        return;
    }
    var myChart = echarts.init(domId);
    var data = generateVals(values);
    var option = {
        tooltip: {
            show: false,
            trigger: 'item',
            formatter: "{a}<br/>{b}: {c} ({d}%)"
        },
        legend: {
            show: false,
            orient: 'vertical',
            x: 'left',
            data: data.legend
        },
        series: [
            {
                type:'pie',
                center: ['55%', '50%'],
                radius: ['50%', '60%'],
                avoidLabelOverlap: true,
                silent: true,
                label: {
                    normal: {
                        show: true,
                        formatter: '{b}: {c}'
                    },
                    emphasis: {
                        show: true,
                        textStyle: {
                            fontSize: '30',
                            fontWeight: 'bold'
                        }
                    }
                },
                itemStyle: {
                    normal: {
                      borderWidth: 2,
                      borderColor: '#fff'
                    }
                },
                data: data.value
            }
        ]
    };
    // 使用刚指定的配置项和数据显示图表
    myChart.setOption(option);
}

function generateVals(values) {
    var valArr = [];
    var legendArr = [];
    for(var key in values) {
        valArr.push({
            name: key,
            value: values[key]
        });
        legendArr.push(key);
    }
    return {
        value: valArr,
        legend: legendArr
    };
}

function drawBar(id, xAxisArr, name, values) {
    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById(id));
    var option = {
        tooltip : {
            trigger: 'axis'
        },
        legend: {
            data:[name]
        },
        calculable : true,
        xAxis : [
            {
                type : 'category',
                data : xAxisArr
            }
        ],
        yAxis : [
            {
                type : 'value'
            }
        ],
        series : [
            {
                name: name,
                type: 'bar',
                data: values,
                markPoint : {
                    data : [
                        {type : 'max', name: '最大值'},
                        {type : 'min', name: '最小值'}
                    ]
                },
                markLine : {
                    data : [
                        {type : 'average', name: '平均值'}
                    ]
                }
            }
        ]
    };
    myChart.setOption(option);
}

function getVideo() {
    client.publish("A/PA", bufferObj.from([0x32]), {
        qos: 1
    });
    $.ajax({
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
    });
    /*var str = '<video id="record-player" controls="controls" width="100%" height="300" controlslist="nodownload" src="'
        + 'system/20180723_1357.mp4">浏览器不支持video标签!</video>';
    $('#videoContainer').html(str);
    $('#video-modal-panel').modal('show');*/
}

function getState(val) {
    var state;
    switch(val) {
        case '0':
            state = '正常';
            break;
        case '1':
            state = '保养';
            break;
        case '2':
            state = '维修';
            break;
        case '3':
            state = '救援';
            break;
        case '4':
            state = '困人';
            break;
    }
    return state;
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