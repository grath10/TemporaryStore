var roleMap = {};
$(function () {
    debugger;
    if (type == 'user') {
        buildRoleOptions();
    } else if(type == 'message') {
        $('#displayPanel').on('show.bs.modal', function () {
            var id = $('#message-id').val();
            updateMessageStatus(type, id);
        }).on('hidden.bs.modal', function () {
           drawTable(type);
            updateUnreadNum();
        });
    }
    $("#" + type + "-query").on('click', function () {
        return drawTable(type);
    });
    $("#modify-submit").on('click', function () {
        return saveChanges(type, 'update', "#modifyPanel");
    });
    $("#create-submit").on('click', function () {
        return saveChanges(type, 'create', "#createPanel");
    });
    drawTable(type);
});

function buildRoleOptions() {
    $.ajax({
        url: '/user/role',
        type: 'get',
        data: null,
        async: false,
        success: function (response) {
            var num = response.length;
            var str = '';
            for (var i = 0; i < num; i++) {
                var bean = response[i];
                roleMap[bean['id']] = bean['remark'];
                str += '<div class="col-md-3" style="padding-left: 0"><input type="checkbox" name="roleName[]" value="' + bean.id + '"/>' + bean.remark + "</div>";
            }
            $(".user-role").html(str);
        }
    });
}

function saveChanges(category, operation, modalId) {
    var json = $("#" + operation + "-editForm").serializeJson();
    var obj = JSON.parse(json);
    var entity = null;
    if (operation == 'update') {
        if (category == 'role') {
            entity = $.extend({}, obj, {
                'operation': operation,
                'role': $('#update-name').val()
            });
        } else if (category == 'user') {
            entity = $.extend({}, obj, {
                'operation': operation,
                'username': $('#update-username').val()
            });
        }
    } else {
        entity = $.extend({}, obj, {
            'operation': operation
        });
    }
    $.ajax({
        url: '/' + category + '/save',
        type: 'post',
        async: false,
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(entity),
        success: function () {
            alert("更新成功");
            $(modalId).modal('hide');
            // 刷新表格数据
            drawTable(category);
        }
    });
}

function updateMessageStatus(category, messageId) {
    $.ajax({
        url: '/system/' + category + '/save',
        type: 'post',
        async: false,
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({
            id: messageId
        }),
        success: function () {
        }
    });
}

function drawTable(category) {
    var $table = $("#" + category + "-table");
    var table;
    if (category == 'message') {
        table = $table.DataTable({
            dom: '<"top"f>t<"row"<"col-sm-5"i><"col-sm-7"p>>',
            /*lengthChange: false,
            destroy: true,
            iDisplayLength: 10,  //每页显示10条数据
            autoWidth: false,   //禁用自动调整列宽
            processing: false,  //隐藏加载提示,自行处理
            serverSide: true,   //启用服务器端分页
            searching: false, */
            ajax: function (data, callback, settings) {
                return loadTableInfo(category, data, callback, settings);
            },
            /*ajax: {
                url: '/system/' + category + '/list',
                data: {
                    start: data['start'],
                    length: data['length']
                }
            },*/
            columns: generateTableColumns(category),
            ordering: false,  // 禁用排序
            columnDefs: [{
                targets: 1,
                render: function (data, type, full, meta) {
                    var content = full['content'];
                    var msgId = full['messageId'];
                    return "<a class='pointer' data-target='#displayPanel' onclick='showMessagePanel(\"" + data + "\", \"" + content
                        + "\", \"" + msgId + "\")'>" + data + "</a>";
                }
            }, {
                targets: -1,
                render: function (data, type, full, meta) {
                    if (data == 0) {
                        return '<label class="label-danger">未读</label>';
                    } else {
                        return '<label class="label-success">已读</label>';
                    }
                }
            }],
            /*language: {
                url: '/i18n/Chinese.lang'
            },
            drawCallback: function () {
                var api = this.api();
                api.column(0).nodes().each(function (cell, i) {
                    cell.innerHTML = i + 1;
                });
            }*/
        });
    } else {
        table = $table.DataTable({
            dom: 't<"row"<"col-sm-5"i><"col-sm-7"p>>',
            lengthChange: false,
            destroy: true,
            iDisplayLength: 10,  //每页显示10条数据
            autoWidth: false,   //禁用自动调整列宽
            processing: false,  //隐藏加载提示,自行处理
            serverSide: true,   //启用服务器端分页
            searching: false,
            ajax: function (data, callback, settings) {
                return loadInfo(category, data, callback, settings);
            },
            columns: generateColumns(category),
            order: [[1, "asc"]],
            columnDefs: [{
                targets: 1,
                render: function (data, type, full, meta) {
                    var id = data;
                    if (category != 'user') {
                        id = full.id;
                    }
                    return "<a class='pointer' data-target='#modifyPanel' onclick='showModifyPanel(\"" + id + "\")'>" + data + "</a>";
                }
            }, {
                targets: 2,
                orderable: false,
                render: function (data, type, full, meta) {
                    if (category == 'user') {
                        var roleArr = [];
                        data.forEach(function (t) {
                            roleArr.push(t.remark);
                        })
                        return roleArr.join(', ');
                    } else {
                        return data;
                    }
                }
            }, {
                targets: 3,
                render: function (data, type, full, meta) {
                    if (category == 'user') {
                        if (data == 1) {
                            return '正常';
                        } else {
                            return '已锁定';
                        }
                    } else {
                        if (data == 1) {
                            return '正常';
                        } else {
                            return '禁用';
                        }
                    }
                }
            }, {
                targets: -1,
                render: function (data, type, full, meta) {
                    if (category == 'user') {
                        // 根据用户帐号状态显示
                        if (full.accountLocked == 0) {
                            return '<button type="button" class="btn btn-margin btn-warning" onclick="lockUser(' + full['id'] + ')"><i class="fa fa-lock"></i>锁定</button>';
                        } else {
                            return '<button type="button" class="btn btn-margin btn-info" onclick="unlockUser(' + full['id'] + ')"><i class="fa fa-unlock"></i>解锁</button>';
                        }
                    } else {
                        return '<button type="button" class="btn btn-margin btn-danger" onclick="deleteRole(' + full['id'] + ')"><i class="fa fa-trash-o"></i>删除</button>';
                    }
                }
            }],
            language: {
                url: '/i18n/Chinese.lang'
            },
            drawCallback: function () {
                var api = this.api();
                api.column(0).nodes().each(function (cell, i) {
                    cell.innerHTML = i + 1;
                });
            }
        });
    }
}

function deleteRole(roleId) {
    $.ajax({
        url: '/role/delete',
        data: {
            id: roleId
        },
        type: 'get',
        async: false,
        success: function (response) {
            alert("删除角色成功!");
            drawTable(type);
        },
        error: function () {
            console.log('操作失败');
        }
    });
}

function lockUser(userId) {
    $.ajax({
        url: '/user/lock',
        data: {
            id: userId
        },
        type: 'get',
        async: false,
        success: function (response) {
            alert("锁定用户成功!");
            drawTable(type);
        },
        error: function () {
            console.log('操作失败');
        }
    });
}

function unlockUser(userId) {
    $.ajax({
        url: '/user/unlock',
        data: {
            id: userId
        },
        type: 'get',
        async: false,
        success: function (response) {
            alert("解锁用户成功!");
            drawTable(type);
        },
        error: function () {
            console.log('操作失败');
        }
    });
}

function generateColumns(category) {
    var columns = [];
    var fields = getRawFields(category);
    var size = fields.length;
    for (var i = 0; i < size; i++) {
        var field = fields[i];
        if (i == 0 || i == size - 1) {
            columns.push({
                data: null,
                title: getI18n(field),
                defaultContent: '',
                orderable: false,
                className: "text-center"
            });
        } else {
            columns.push({
                title: getI18n(field),
                data: field,
                className: "text-center"
            });
        }
    }
    return columns;
}

function generateTableColumns(category) {
    var columns = [];
    var fields = getRawFields(category);
    var size = fields.length;
    for (var i = 0; i < size; i++) {
        var field = fields[i];
        if (i == 0) {
            columns.push({
                data: null,
                title: getI18n(field),
                defaultContent: '',
                className: "text-center"
            });
        } else {
            columns.push({
                title: getI18n(field),
                data: field,
                className: "text-center"
            });
        }
    }
    return columns;
}

function getRawFields(category) {
    var fields = [];
    switch (category) {
        case 'user':
            fields = ['no', 'username', 'roles', 'accountNonLocked', 'lastLoginTime', 'operation'];
            break;
        case 'role':
            fields = ['no', 'name', 'description', 'enable', 'remark', 'operation'];
            break;
        case 'permission':
            break;
        case 'message':
            fields = ['no', 'title', 'sender', 'status'];
            break;
    }
    return fields;
}

function loadTableInfo(category, data, callback, settings) {
    $.ajax({
        url: '/system/' + category + '/list',
        data: {
            draw: data['draw'],
            search: data['search']['value'],
            start: data['start'],
            length: data['length']
        },
        type: 'get',
        async: false,
        success: function (response) {
            callback(response);
        },
        error: function () {
            console.log('查询失败');
        }
    });
}

function loadInfo(category, data, callback, settings) {
    var info = $("#" + category + "-info").val();
    var orderCfg = data['order'][0];
    $.ajax({
        url: '/' + category + '/list',
        data: {
            type: category,
            id: info,
            draw: data['draw'],
            dir: orderCfg['dir'],
            start: data['start'],
            length: data['length'],
            column: data['columns'][orderCfg['column']]['data']
        },
        type: 'get',
        async: false,
        success: function (response) {
            callback(response);
        },
        error: function () {
            console.log('查询失败');
        }
    });
}

function showModifyPanel(id) {
    $.ajax({
        url: '/' + type + '/findOne',
        method: 'get',
        async: false,
        contentType: "application/json",
        data: {
            id: id
        },
        success: function (response) {
            for (var key in response) {
                if (key != 'roles') {
                    $("#update-" + key).val(response[key]);
                } else {
                    var roles = response['roles'];
                    $("input[type='checkbox']", "#update-roleId").prop('checked', false);
                    roles.forEach(function (t) {
                        var roleId = t.id;
                        // 将选中状态重置恢复
                        $("input[type='checkbox']", "#update-roleId").filter('[value="' + roleId + '"]').prop('checked', true);
                    });
                }
            }
            $("#modifyPanel").modal('show');
        }
    });
}

function showMessagePanel(title, content, messageId) {
    var $panel = $('#displayPanel');
    $('#message-title').val(title);
    $('#message-content').val(content);
    $('#message-id').val(messageId);
    $panel.modal('show');
}