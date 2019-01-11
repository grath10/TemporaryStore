$(function () {
    debugger;
    getPOIFromServer(1, '江苏省', '320000', false);
});

// 创建Map实例
// 构造地图时，关闭地图可点功能
var map = new BMap.Map("allmap", {
    enableMapClick: false,
    minZoom: 8,
    maxZoom: 18
});
var opts = {
    type: BMAP_NAVIGATION_CONTROL_SMALL
};
map.addControl(new BMap.NavigationControl(opts));
map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放
/*map.addEventListener('zoomend', function (event) {
    var zoom = map.getZoom();
    var mypoint = map.getCenter();
    map.centerAndZoom(mypoint, zoom);
    var bs = map.getBounds();   //获取可视区域
    var bssw = bs.getSouthWest();   //可视区域左下角
    var bsne = bs.getNorthEast();   //可视区域右上角
    // 当前缩放级别
    if(zoom == 12 || zoom == 15 || zoom == 17) {
        map.clearOverlays();
        var lng = [bssw.lng, bsne.lng];
        var lat = [bssw.lat, bsne.lat];
        var type = getType(zoom);
        getLimitedPOI(type, lat, lng, mypoint);
    }
});*/

/*map.addEventListener('zoomend', function (evt) {
    var point = map.getCenter();
    var zoom = map.getZoom();
    var type = getType(zoom);  // 当前显示行政最高层级
    // alert("当前缩放级别：" + zoom);
    // 判断是否已经有标注点，避免重复标记
    var overlays = map.getOverlays();
    var hasOne = false;
    for(var i = 0;i < overlays.length; i++) {
        var overlay = overlays[i];
        if (overlay instanceof BMap.Marker) {
            hasOne = true;
            break;
        }
    }
    map.clearOverlays();
    if(!hasOne && type != 3) {
        var geoMarker = new BMap.Marker(point);
        map.addOverlay(geoMarker);
    }
    getPOIByType(type, point);
    /!*
    // 位置粒度最小时显示具体信息
    if(zoom == 17) {
        map.clearOverlays();
        var bs = map.getBounds();   //获取可视区域
        var bssw = bs.getSouthWest();   //可视区域左下角
        var bsne = bs.getNorthEast();   //可视区域右上角
        var lng = [bssw.lng, bsne.lng];
        var lat = [bssw.lat, bsne.lat];
        var type = getType(zoom);
        getLimitedPOI(type, lat, lng, point);
    }*!/
});*/

// 根据行政区划级别确定相应缩放等级
function getZoomLevel(level) {
    var zoom = 12;
    switch(level){
        case 2:
            zoom = 8;    // 市
            break;
        case 3:
            zoom = 12;   // 区县
            break;
        case 4:
            zoom = 15;   // 街道、乡镇
            break;
        case 5:
            zoom = 17;   // 社区
            break;
        default:
            break;
    }
    return zoom;
}

function getType(zoom) {
    var type = 1;
    switch(zoom){
        case 11:
        case 12:
        case 13:
        case 14:
            type = 3;
            break;
        case 15:
        case 16:
            type = 4;
            break;
        case 17:
        case 18:
            type = 5;
        default:
            break;
    }
    return type;
}

function getAreaPrefix(type, code) {
    var prefix = '';
    if(type == 1) {
        prefix = code.substring(0, 2);
    } else if(type == 2) {
        prefix = code.substring(0, 4);
    } else {
        prefix = code;
    }
    return prefix;
}

// 根据当前行政区域层次显示下一层级信息
/**
 * 省-->市，市-->区县
 */
function getPOIFromServer(type, name, code, isDrilled, cp) {
    var prefix = getAreaPrefix(type, code);
    $.ajax({
        url: '/map/find',
        data: {
            type: type,
            name: prefix
        },
        type: 'get',
        async: false,
        success: function (response) {
            return buildBaiduMap(isDrilled, response, name, type + 1, cp);
        },
        error: function () {
            console.log('查询失败');
        }
    })
}

/**
 *
 * @param isDrilled   下钻标志位
 * @param result  后台返回结果
 * @param name  区域名称
 * @param level  行政区域层级
 * @param cp  中心点坐标
 */
function buildBaiduMap(isDrilled, result, name, level, cp) {
    var pointArray = [];
    var point;
    if(isDrilled) {
        map.clearOverlays();
    }
    for (var i = 0; i < result.length; i++) {
        var one = result[i], marker;
        var longitude = one['longitude'], latitude = one['latitude'],
            areaName = one['name'],
            remark = one['remark'],
            type = one['type'],
            areacode = one['code'];
        point = new BMap.Point(longitude, latitude);
        // 区县、街道或者乡镇级别
        if(type == '3' || type == '4'){
            marker = new CustomShapeOverlay(point, areaName, remark, type, areacode, '温度：23℃');
            map.addOverlay(marker);
        } else if(type == '2') {  // 市级别
            var perf = '当前救援量：' + Mock.Random.integer(60, 100) + ', 当月救援量：' + Mock.Random.integer(100, 1000);
            var color = getColorByState(remark);
            marker = new SquareOverlay(point, areaName, type, areacode, perf, color);
            map.addOverlay(marker);
        } else {
            marker = new CustomOverlay(point, 'images/cursor.png', areaName, remark);
            map.addOverlay(marker);
            var geoMarker = new BMap.Marker(point);
            var label = new BMap.Label(remark + "\n" + areaName, {
                offset: new BMap.Size(20, -10)
            });
            label.setStyle({
                maxWidth: "none"
            });
            geoMarker.setLabel(label);
            map.addOverlay(geoMarker);
        }
        pointArray.push(point);
    }
    var zoom = getZoomLevel(level);
    if(cp){
        map.centerAndZoom(cp, zoom);
    } else {
        map.centerAndZoom(name, zoom);
    }
    /*if(pointArray.length > 0) {
        // 让所有点在视野范围内
        map.setViewport(pointArray);
    } else {
        var zoom = getZoomLevel(level);
        map.centerAndZoom(name, zoom);
    }*/
}

function getColorByState(state) {
    var color;
    switch(state) {
        case '1':
            color = '#ff0507';   // 新建
            break;
        case '2':
            color = '#fff709';  // 响应
            break;
        case '3':
            color = '#260cff';  // 到场
            break;
        case '4':
            color = '#808080';  // 无救援
            break;
        default:
            color = '#00ff00';  // 完成救援
            break;
    }
    return color;
}

function buildCurrentBaiduMap(result, name, level) {
    var pointArray = [];
    var point;
    for (var i = 0; i < result.length; i++) {
        var one = result[i], marker;
        var longitude = one['longitude'], latitude = one['latitude'],
            name = one['name'],
            remark = one['remark'],
            type = one['type'],
            currentGeo = one['code'];
        point = new BMap.Point(longitude, latitude);
        // 区县、街道或者乡镇级别
        if(type == '3' || type == '4'){
            marker = new CustomShapeOverlay(point, name, remark, type, currentGeo, '温度：23℃');
            map.addOverlay(marker);
        } else {
            marker = new CustomOverlay(point, 'images/cursor.png', name, remark);
            map.addOverlay(marker);
            var geoMarker = new BMap.Marker(point);
            var label = new BMap.Label(remark + "\n" + name, {
                offset: new BMap.Size(20, -10)
            });
            label.setStyle({
                maxWidth: "none"
            });
            geoMarker.setLabel(label);
            map.addOverlay(geoMarker);
        }
        pointArray.push(point);
    }
}

// 根据当前行政区域级别显示相应标注
function getPOIByType(type, point) {
    $.ajax({
        url: '/map/locate',
        data: {
            type: type
        },
        type: 'get',
        async: false,
        success: function (response) {
            return buildCurrentBaiduMap(response, point, type);
        },
        error: function () {
            console.log('查询失败');
        }
    })
}

// 根据当前区域获取以下信息
/**
 * 按事件进度组成的饼图、按下级区划组成的饼图、按已耗时10分钟一档的饼图
 * @param areacode
 */
function getStatistics(areacode) {
    drawPie('progress' + areacode, ['新建', '响应', '到场', '完成救援'], [10, 20, 30, 40], '事件进度分布图');
    drawPie('domain' + areacode, ['区域1', '区域2', '区域3', '区域4'], [63, 24, 56, 32], '下级区域统计分布图');
    drawPie('cost' + areacode, ['已耗时10分钟以内', '已耗时超出10分钟20分钟以内', '已耗时超出20分钟30分钟以内', '超出30分钟'], [10, 20, 30, 40], '耗时分布图');
}

/**
 *
 * @param legendData  图例，类型：数组
 * @param dataArr  具体取值，类型：对象数组
 */
function drawPie(id, legendData, values, title) {
    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById(id));
    var dataArr = generateVals(legendData, values);
    var option = {
        tooltip: {
            trigger: 'item',
            formatter: "{a}<br/>{b}: {c} ({d}%)"
        },
        legend: {
            orient: 'vertical',
            x: 'left',
            data: legendData
        },
        series: [
            {
                name: title,
                type:'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                label: {
                    normal: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        show: true,
                        textStyle: {
                            fontSize: '30',
                            fontWeight: 'bold'
                        }
                    }
                },
                labelLine: {
                    normal: {
                        show: false
                    }
                },
                data: dataArr
            }
        ]
    };
    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
}

function generateVals(keys, values) {
    var arr = [];
    for(var i = 0; i < keys.length; i++) {
        arr.push({
            value: values[i],
            name: keys[i]
        })
    }
    return arr;
}