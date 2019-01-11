// 定义构造函数并继承Overlay
function RescueOverlay(center, img, name, state, cost){
    this._center = center;
    this._img = img;
    this._name = name;
    this._state = state;
    this._cost = cost;
}

// 继承API BMap.Overlay
RescueOverlay.prototype = new BMap.Overlay();

// 初始化自定义覆盖物
RescueOverlay.prototype.initialize = function (map) {
    // 保存map对象实例
    this._map = map;
    // 创建div元素，作为自定义覆盖物的容器
    var div = document.createElement("div");
    div.style.position = 'absolute';
    div.style.width = '18px';
    div.style.height = '23px';
    var val;
    // green
    if(this._state == 1){
        val = "url(" + this._img + ") no-repeat -18px -23px";
    // blue
    } else if(this._state == 2) {
        val = "url(" + this._img + ") no-repeat -36px -23px";
    // red
    } else if(this._state == 3) {
        val = "url(" + this._img + ") no-repeat -54px -23px";
    // yellow
    } else {
        val = "url(" + this._img + ") no-repeat -72px -23px";
    }
    // 根据参数设置元素外观
    div.style.background = val;
    div.style.MozUserSelect = 'none';

    $(div).append('<div class="rescueDetail" style="display: none;">' +
        '<div style="width:258px;height: 20px;"><span style="float: left;">电梯名称：</span><span style="float: left;">' + this._name +
        '</span></div><div style="width: 258px;height: 20px;"><span style="float:left;">已耗时(min)：</span><span style="float:left;">'+ this._cost +'</span></div></div>');
    $(div).mousemove(function () {
        $(this).children(".rescueDetail").css("display", "block");
    });
    $(div).mouseout(function () {
        $(this).children(".rescueDetail").css("display", "none");
    });

    $(div).click(function(e){
        $('#ip').val("192.168.1.64");
        $("#videoPanel").modal('show');
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
RescueOverlay.prototype.draw = function () {
    // 根据地理坐标转换为像素坐标，并设置给容器
    var position = this._map.pointToOverlayPixel(this._center);
    this._div.style.left = position.x - 5 + 'px';
    this._div.style.top = position.y - 5 + 'px';
};

// 实现显示方法
RescueOverlay.prototype.show = function () {
  if(this._div){
      this._div.style.display = '';
  }
};

// 实现隐藏方法
RescueOverlay.prototype.hide = function () {
  if(this._div){
      this._div.style.display = 'none';
  }
};

