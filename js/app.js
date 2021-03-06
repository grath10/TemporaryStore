var ApplicationContext = (function () {
    /*The params include all the global settings used in the system*/
    var config = {
        "context_path": /*[[@{/}]]*/"/"     //application context
    };
    return {
        config: config
    }
})();

/**
 * 历史步骤操作类
 * 先入后出，堆栈
 */
function history() {
    var MAX_STEPS = 10;
    var savedsteps = [];
    this.push = function (url) {
        //如果堆栈已满， 踢掉第一个
        if (savedsteps.length == MAX_STEPS) {
            savedsteps.splice(0, 1);
        }
        savedsteps.push(url);
    };

    this.pop = function () {
        //先去掉当前页面
        savedsteps.pop();
        if (savedsteps.length > 0) {
            //再取得当前页的前一页
            return savedsteps[savedsteps.length - 1];
        }
        return null;
    };
}

var historyObj = new history();

/* Ajax global setup */
$.ajaxSetup({
    cache: false,
    beforeSend: function (xhr) {
        $("#li-busy").css('display', 'block');
        var token = $('#_csrf').attr('content');
        var header = $('#_csrf_header').attr('content');
        if (token && header) {
            xhr.setRequestHeader(header, token);
        }
    },
    complete: function (XMLHttpRequest) {
        $("#li-busy").css('display', 'none');
        ajaxTimeoutProcessor(XMLHttpRequest);
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
        ajaxException(XMLHttpRequest, textStatus, errorThrown);
    }
});

function ajaxTimeoutProcessor(XMLHttpRequest) {
    var session_status = XMLHttpRequest.getResponseHeader("session_status");
    if (session_status == "timeout") {
        /*
            2018-11-1  注释
            ComponentInitializer.alertInfoMessage("登录超时, 请重新登录！");
        */
        MessageTooltip.alertInfo("登录超时, 请重新登录！");
        location.href = ApplicationContext.config.context_path + "login";
    }
}

function ajaxException(XMLHttpRequest) {
    if (XMLHttpRequest.responseJSON) {
        /*
            2018-11-1 注释
            ComponentInitializer.alertErrorMessage(XMLHttpRequest.responseJSON.message);
        */
        MessageTooltip.alertError(XMLHttpRequest.responseJSON.message);
    } else {
        /*
            2018-11-1 注释
            ComponentInitializer.alertErrorMessage("未知的异常发生，请联系管理员！");
         */
        MessageTooltip.alertError("未知的异常发生，请联系管理员！");
    }
}

if($.fn.select2) {
    //init select2 default options
    $.fn.select2.defaults.set("cache", "true");
    $.fn.select2.defaults.set("allowClear", "true");
    $.fn.select2.defaults.set("placeholder", "不限");
    $.fn.select2.defaults.set("language", "zh-CN");
    $.fn.select2.defaults.set("minimumResultsForSearch", "15");
    $.fn.select2.defaults.set("maximumInputLength", "15");
}

/**
 * DataTable default options
 */
/*
$.extend($.fn.dataTable.defaults, {
    stateSave: true,
    processing: true,
    serverSide: true,
    searching: true,   //禁用datatables搜索
    lengthMenu: [[10, 20, 50], [10, 20, 50]],
    language: {
        "sProcessing": "处理中...",
        "sLengthMenu": "显示 _MENU_ 项结果",
        "sZeroRecords": "没有匹配结果",
        "sInfo": "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
        "sInfoEmpty": "显示第 0 至 0 项结果，共 0 项",
        "sInfoFiltered": "(由 _MAX_ 项结果过滤)",
        "sInfoPostFix": "",
        "sSearch": "搜索:",
        "sUrl": "",
        "sEmptyTable": "表中数据为空",
        "sLoadingRecords": "载入中...",
        "sInfoThousands": ",",
        "oPaginate": {
            "sFirst": "首页",
            "sPrevious": "上页",
            "sNext": "下页",
            "sLast": "末页"
        },
        "oAria": {
            "sSortAscending": ": 以升序排列此列",
            "sSortDescending": ": 以降序排列此列"
        }
    },
    ajax: {
        url: '',
        dataSrc: "data",
        data: function (d, settings) {
            var queryform = "#" + (settings.ajax.queryform ? settings.ajax.queryform : "queryForm");
            //页面查询参数
            if ($(queryform).length > 0) {
                var formData = $(queryform).serializeArray();
                formData.forEach(function (e) {
                    d[e.name] = e.value;
                });
            }
            //alert(JSON.stringify(d));
        },
        complete: function (XMLHttpRequest) {
            $("#li-busy").css('display', 'none');
            ajaxTimeoutProcessor(XMLHttpRequest);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            ajaxException(XMLHttpRequest, textStatus, errorThrown);
        }
    },
    fnDrawCallback: function () {
        var api = this.api();
        //是否需要Index列?
        var indexCol = api.init().indexCol;
        indexCol = typeof(indexCol) == "undefined" ? 1 : indexCol;

        //获取到本页开始的条数
        var startIndex = api.context[0]._iDisplayStart;
        api.column(indexCol).nodes().each(function (cell, i) {
            cell.innerHTML = startIndex + i + 1;
        });

        //转换超链接为ajax加载，utils.js
        $("a[target]", this).convertlink();
    },
    columnDefs: [{
        targets: 0,
        render: function (data, type, row, meta) {
            var rid = row.id ? row.id : row.ID;
            return "<input type='checkbox' name='checkList' rowid='" + rid + "'/>";
        }
    }]
});
*/

if($.fn.dataTable) {
    $.extend($.fn.dataTable.defaults, {
        dom: 't<"row"<"col-sm-5"i><"col-sm-7"p>>',
        stateSave: true,
        destroy: true,
        autoWidth: false,   //禁用自动调整列宽
        processing: false,  //隐藏加载提示,自行处理
        serverSide: true,   //启用服务器端分页
        searching: true,   //启用datatables搜索
        lengthChange: false,
        iDisplayLength: 10,  //每页显示10条数据
        language: {
            url: '/i18n/Chinese.lang'
        },
        ajax: {
            url: '',
            data: function (d, settings) {
                //页面查询参数
                var queryform = "#" + (settings.ajax.queryform ? settings.ajax.queryform : "queryForm");
                if ($(queryform).length > 0) {
                    var formData = $(queryform).serializeArray();
                    formData.forEach(function (e) {
                        d[e.name] = e.value;
                    });
                }
            },
            complete: function (XMLHttpRequest) {
                $("#li-busy").css('display', 'none');
                ajaxTimeoutProcessor(XMLHttpRequest);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                ajaxException(XMLHttpRequest, textStatus, errorThrown);
            }
        },
        fnDrawCallback: function () {
            var api = this.api();
            // 是否需要Index列?
            var indexCol = api.init().indexCol;
            indexCol = typeof(indexCol) == "undefined" ? 1 : indexCol;
            // 获取到本页开始的条数
            var startIndex = api.context[0]._iDisplayStart;
            api.column(indexCol).nodes().each(function (cell, i) {
                cell.innerHTML = startIndex + i + 1;
            });
        }/*,
        columnDefs: [{
            targets: 0,
            render: function (data, type, row, meta) {
                var rid = row.id ? row.id : row.ID;
                return "<input type='checkbox' name='checkList' rowid='" + rid + "'/>";
            }
        }]*/
    });
}

/*<![CDATA[*/
var ComponentInitializer = (function () {
        function alertSuccessMessage(message) {
            toastr.options.timeOut = 5000;
            toastr.success(message);
        }

        function alertErrorMessage(message) {
            toastr.options.timeOut = -1;
            toastr.error(message);
        }

        function alertInfoMessage(message) {
            toastr.options.timeOut = 5000;
            toastr.info(message);
        }

        function alertWarningMessage(message) {
            toastr.options.timeOut = 5000;
            toastr.warning(message);
        }

        function initPageComponent() {
            initToastrComponent();
        }

        /!*Init toastr component*!/
        function initToastrComponent() {
            toastr.options = {
                "closeButton": true,
                "debug": false,
                "newestOnTop": false,
                "progressBar": false,
                "positionClass": "toast-top-right",
                "preventDuplicates": false,
                "onclick": null,
                "showDuration": "300",
                "hideDuration": "1000",
                "timeOut": "5000",
                "extendedTimeOut": "1000",
                "showEasing": "swing",
                "hideEasing": "linear",
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut"
            };
        }

        return {
            initPageComponents: initPageComponent,
            alertSuccessMessage: alertSuccessMessage,
            alertErrorMessage: alertErrorMessage,
            alertInfoMessage: alertInfoMessage,
            alertWarningMessage: alertWarningMessage
        }
})();
/*]]>*/

Date.prototype.format = function(fmt) {
    var o = {
        "M+" : this.getMonth() + 1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth() + 3) / 3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt)) {
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }
    for(var k in o) {
        if(new RegExp("("+ k +")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
    return fmt;
};
