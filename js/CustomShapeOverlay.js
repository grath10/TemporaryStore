// 定义构造函数并继承Overlay
function CustomShapeOverlay(center, name, text, type, currentGeo, perf){
    this._center = center;
    this._name = name;
    this._text = text;
    this._type = type;
    this._currentGeo = currentGeo;
    this._perf = perf;
}

// 继承API BMap.Overlay
CustomShapeOverlay.prototype = new BMap.Overlay();

// 初始化自定义覆盖物
CustomShapeOverlay.prototype.initialize = function (map) {
    var me = this;
    // 保存map对象实例
    this._map = map;
    // 创建div元素，作为自定义覆盖物的容器
    var div = document.createElement("div");
    div.style.position = 'absolute';
    div.style.MozUserSelect = 'none';

    div.setAttribute("class", "ol-area op-nail");
    $(div).append('<p class="ol-name">' + this._name + '</p><p class="ol-perf">' + this._perf + '</p>');
    $(div).click(function(e){
        // 获取下钻点的经纬度信息
        var cp = me._center;
        return getPOIFromServer(me._type, me._name, me._currentGeo, true, cp);
    });
    /*$(div).hover(function (e) {
       return getBoundary(me._name, me._type);
    }, function (e) {
        var overlays = map.getOverlays();
        for(var i = 0;i < overlays.length; i++) {
            var overlay = overlays[i];
            if(overlay instanceof BMap.Polygon){
                map.removeOverlay(overlay);
            }
        }
    });*/

    // 将div添加到覆盖物容器中
    map.getPanes().markerPane.appendChild(div);
    // 保存div实例
    this._div = div;
    // 需要将div元素作为方法的返回值，当调用该覆盖物的show、
    // hide方法，或者对覆盖物进行移除时，API都将操作此元素
    return div;
}

// 绘制覆盖物
CustomShapeOverlay.prototype.draw = function () {
    // 根据地理坐标转换为像素坐标，并设置给容器
    var position = this._map.pointToOverlayPixel(this._center);
    this._div.style.left = position.x - 5 + 'px';
    this._div.style.top = position.y - 5 + 'px';
}

// 实现显示方法
CustomShapeOverlay.prototype.show = function () {
  if(this._div){
      this._div.style.display = '';
  }
}

// 实现隐藏方法
CustomShapeOverlay.prototype.hide = function () {
  if(this._div){
      this._div.style.display = 'none';
  }
}

