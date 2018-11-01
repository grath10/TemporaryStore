/**
 * 海康摄像头相关操作
 */
function getDeviceInfo() {
    var params = $('#params').val();
    var json = JSON.parse(params);
    return json;
}

// 登录设备
function loginDevice() {
    var json = getDeviceInfo();
    // 显示录像播放窗口
    var oLiveView = {
        iProtocol: 1,			// protocol 1：http, 2:https
        szIP: json.ip,          // protocol ip
        szPort: "80",			// protocol port
        szUsername: json.username,	// device username
        szPassword: json.password,  // device password
        iStreamType: 1,			// stream 1：main stream  2：sub-stream  3：third stream  4：transcode stream
        iChannelID: 1,			// channel no
        bZeroChannel: false		// zero channel
    };
    WebVideoCtrl.I_Login(oLiveView.szIP, oLiveView.iProtocol, oLiveView.szPort, oLiveView.szUsername, oLiveView.szPassword, {
        success: function (xmlDoc) {
            // 开始预览
            var szDeviceIdentify = oLiveView.szIP + "_" + oLiveView.szPort;
            setTimeout(function () {
                WebVideoCtrl.I_StartRealPlay(szDeviceIdentify, {
                    iStreamType: oLiveView.iStreamType,
                    iChannelID: oLiveView.iChannelID,
                    bZeroChannel: oLiveView.bZeroChannel
                });
            }, 1000);
            // 按钮使能
            $('#start-play').attr("disabled", false);
            $('#start-talk').attr("disabled", false);
            // $('#login-device').attr("disabled", "disabled");
        },
        error: function (e) {
            var code = WebVideoCtrl.I_GetLastError();
            console.log('错误码:' + code);
        }
    });
}

// 开始预览
function clickStartRealPlay() {
    var json = getDeviceInfo();
    var szIP = json.ip,
        iStreamType = 1,
        iChannelID = 1,
        bZeroChannel = false;

    var iRet = WebVideoCtrl.I_StartRealPlay(szIP, {
        iStreamType: iStreamType,
        iChannelID: iChannelID,
        bZeroChannel: bZeroChannel,
        success: function () {
            clickOpenSound();
        }
    });
    if(iRet == -1) {
        console.log('开始预览操作失败');
    }
    // 按钮使能
    $('#stop-play').attr("disabled", false);
}

// 停止预览
function clickStopRealPlay() {
    var iRet = WebVideoCtrl.I_Stop();
    if(iRet == -1) {
        console.log('停止预览操作失败');
    }
    // 按钮使能
    $('#stop-play').attr("disabled", "disabled");
    $('#start-play').attr("disabled", false);
}

// 打开声音
function clickOpenSound() {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus();
    if (oWndInfo != null) {
        var allWndInfo = WebVideoCtrl.I_GetWindowStatus();
        // 循环遍历所有窗口，如果有窗口打开了声音，先关闭
        for (var i = 0, iLen = allWndInfo.length; i < iLen; i++) {
            oWndInfo = allWndInfo[i];
            if (oWndInfo.bSound) {
                WebVideoCtrl.I_CloseSound(oWndInfo.iIndex);
                break;
            }
        }
        WebVideoCtrl.I_OpenSound();
    }
}

// 关闭声音
function clickCloseSound() {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus();
    if (oWndInfo != null) {
        var iRet = WebVideoCtrl.I_CloseSound();
        if(iRet == -1) {
            console.log('关闭声音操作：', iRet);
        }
    }
}

// 设置音量
function clickSetVolume() {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(),
        iVolume = parseInt($("#volume").val(), 10);

    if (oWndInfo != null) {
        var iRet = WebVideoCtrl.I_SetVolume(iVolume);
        console.log('设置音量操作：', iRet);
    }
}

// 开始录像
function clickStartRecord() {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
    if (oWndInfo != null) {
        var szChannelID = $("#channels").val(),
            szFileName = oWndInfo.szIP + "_" + szChannelID + "_" + new Date().getTime(),
            iRet = WebVideoCtrl.I_StartRecord(szFileName);
        if(iRet != 0) {
            console.log('开始录像失败');
        }
    }
}

// 停止录像
function clickStopRecord() {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
    if (oWndInfo != null) {
        WebVideoCtrl.I_StopRecord();
    }
}

// 获取对讲通道
function clickGetAudioInfo() {
    var json = getDeviceInfo();
    var szIP = json.ip;

    WebVideoCtrl.I_GetAudioInfo(szIP, {
        success: function (xmlDoc) {
            var oAudioChannels = $(xmlDoc).find("TwoWayAudioChannel"),
                oSel = $("#audiochannels").empty();
            $.each(oAudioChannels, function () {
                var id = $(this).find("id").eq(0).text();
                oSel.append("<option value='" + id + "'>" + id + "</option>");
            });
        },
        error: function () {
        }
    });
}

// 开始对讲
function clickStartVoiceTalk() {
    var json = getDeviceInfo(),
        szIP = json.ip,
        iAudioChannel = 1;
    var iRet = WebVideoCtrl.I_StartVoiceTalk(szIP, iAudioChannel);
    if(iRet == -1) {
        console.log('开始对讲操作失败!');
        var code = WebVideoCtrl.I_GetLastError();
        console.log('具体错误码:', code);
    }
    // 按钮使能
    $('#stop-talk').attr("disabled", false);
}

// 停止对讲
function clickStopVoiceTalk() {
    var iRet = WebVideoCtrl.I_StopVoiceTalk();
    if(iRet == -1) {
        console.log('停止对讲操作失败');
    }
    // 按钮使能
    $('#stop-talk').attr("disabled", "disabled");
    $('#start-talk').attr("disabled", false);
}
