// 定义构造函数并继承Overlay
/**
 *
 * @param center  中心点坐标(经纬度)
 * @param name   显示名称
 * @param type  类型
 * @param areacode  区域行政编码
 * @param perf   指标说明
 * @param color  背景颜色
 * @constructor
 */
function SquareOverlay(center, name, type, areacode, perf, color){
    this._center = center;
    this._name = name;
    this._type = type;
    this._areacode = areacode;
    this._perf = perf;
    this._color = color;
}

// 继承API BMap.Overlay
SquareOverlay.prototype = new BMap.Overlay();

// 初始化自定义覆盖物
SquareOverlay.prototype.initialize = function (map) {
    var me = this;
    // 保存map对象实例
    this._map = map;
    // 创建div元素，作为自定义覆盖物的容器
    var div = document.createElement("div");
    div.style.position = 'absolute';
    div.style.MozUserSelect = 'none';

    // 可以根据参数设置元素外观
    div.style.width = this._length + "px";
    div.style.height = this._length + "px";
    div.style.background = this._color;
    div.style.color = "#fff";
    div.style.whiteSpace = "nowrap";
    var perfs = this._perf.split(',');
    var html = '<p class="area-name">' + this._name + '</p>';
    for(var i = 0; i < perfs.length; i++) {
        html += '<p class="area-perf">' + perfs[i] + '</p>';
    }
    $(div).append(html);
    $(div).click(function(e){
        // 获取下钻点的经纬度信息
        var cp = me._center;
        // return getPOI(4, me._name, me._areacode, true, cp);
        return queryPOI(me._name, me._areacode);
    });
    var code = me._areacode;
    $(div).append('<div class="infoDetail" style="display:none;top:10px;">'
        + '<span style="color: #000000;">事件进度分布图</span><div id="progress' + code + '" class="pie"></div>'
        + '<span style="color: #000000;">下级区域统计分布图</span><div id="domain' + code + '" class="pie"></div>'
        + '<span style="color: #000000;">耗时分布图</span><div id="cost' + code + '" class="pie"></div></div>');

    $(div).mousemove(function(e){
        // getBoundaryAndColor(map, me._name);
        $(this).children(".infoDetail").css("display","block");
        return getStatistics(code);
    });
    $(div).mouseout(function(){
        /*var overlays = map.getOverlays();
        for(var i = 0;i < overlays.length; i++) {
            var overlay = overlays[i];
            if(overlay instanceof BMap.Polygon){
                map.removeOverlay(overlay);
            }
        }*/
        $(this).children(".infoDetail").css("display","none");
    });

    // 将div添加到覆盖物容器中
    map.getPanes().markerPane.appendChild(div);
    // 保存div实例
    this._div = div;
    // 需要将div元素作为方法的返回值，当调用该覆盖物的show、
    // hide方法，或者对覆盖物进行移除时，API都将操作此元素
    return div;
};

// 绘制覆盖物
SquareOverlay.prototype.draw = function () {
    // 根据地理坐标转换为像素坐标，并设置给容器
    var position = this._map.pointToOverlayPixel(this._center);
    this._div.style.left = position.x - 20 + 'px';
    this._div.style.top = position.y - 20 + 'px';
};

// 实现显示方法
SquareOverlay.prototype.show = function () {
  if(this._div){
      this._div.style.display = '';
  }
};

// 实现隐藏方法
SquareOverlay.prototype.hide = function () {
  if(this._div){
      this._div.style.display = 'none';
  }
};

SquareOverlay.prototype.addEventListener = function (event, fun) {
    if(this._div) {
        this._div['on' + event] = fun;
    }
};
