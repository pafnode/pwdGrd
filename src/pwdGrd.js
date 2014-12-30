/**
 * Passguard moudle for pingan-1qiaobao website
 * @description
 * PwdGrdModule is a common password security plugin which covers all password relative common business logic of pinganfuweb.
 * This plugin standands on PassGuardCtrl which is provided by 微通新成
 * 
 * @dependency jquery-ui-1.10.4.custom.min.js, base64.js, PassGuardCtrl.js
 * 
 * @param ctrls {id: 'pwdInputId', sClass: 'defaultClass', iClass:'toInstallClass', hasPlaceHolder:'has placeholder or not', nextTabId:'nextTabId', charTypeNum: charTypeNum, showStrengthFunc: showStrengthFunc, minLength: 0}//password control array
 * @param formSelector //jquery selector for form which is to be sumbit
 * @param enableElmSelector //jquery selector for element to be enabled when password has been input
 * @param preSubmitFunc //customized callback function before sumbit form
 * @param isMandatory: //is mandatory or not to use password guard control
 * @param unmatchMsg: //new password, confirm password unmatched warning message
 * @param rootPath: //static file root path
 * @param errorClass: //error message style
 * 
 * @API
 * 
 * @useCase
 * see WEB-INF/pages/ftl/pages/index.html
 * 
 * @author trsun
 * @since 20140513
 * @version 1.0.0
 */
define(function(require, exports, module) {
	
    require("jquery/jquery-ui/1.10.4/jquery-ui");
    var passwordModule = require("./pc-password");
    var ArrayProto = Array.prototype;
    //constants->
    //default style(installed)
    var SCLASS_DEFAULT = "pafweblib-pwdGrd";
    //to install style
    var ICLASS_DEFAULT = "pafweblib-pwdGrd";
    //regular expression when inputing
    var PGE_EREG1_DEFAULT = "[A-Za-z0-9~!@#$%^&*();<>.?_/\\-`\\\\]*";
    //regular expression when submit, be care, if not using API pwdValid(), please leave [\\s\\S]*, otherwise, the password value could not be submit to backend in Mac System
    var PGE_EREG2_DEFAULT = "[\\s\\S]*";
    //
    var NEXT_TAB_ID_DEFAULT = "input2";
    //grey words here are exactly the same as what it is in password.js
    var K1 = "30818902818100B7DAFE1EAF146393E160EC4EB5EA9C830AB0B6948AC365864F83B5EEF60BBE4300BA531D4A25DE03AF7079A1842F3676FAAEABC7C349AD3BB7864B9C85F4515C9BBB1C4442FCCCEB5C82C3E9B0BC49A89151CC040E188716E6C2C8312C63C7209D9D85A9924595103EEB032E4221E24836E1D3DCDC30BC4BD9908ABDD8AADAD70203010001";
    var K2 = "30818902818100a3da0dd5e9589c86ba812ae3dcf3091b9f8f51e889f89fd55eb2de54c917d8b54261db1d2d7458eceafa0cb6e128d94afa329ea58663c167f86e62fae3b77cfca59801aa5561b45de16e16884d738a90bd9d23d76623503d0c70a9366db0e4d7c87400f52dc9c236cb4353dd180bdd64dd7e2c17baa35cf14b0a516f8e87b3410203010001";
    var K3 = "30818902818100B7DAFE1EAF146393E160EC4EB5EA9C830AB0B6948AC365864F83B5EEF60BBE4300BA531D4A25DE03AF7079A1842F3676FAAEABC7C349AD3BB7864B9C85F4515C9BBB1C4442FCCCEB5C82C3E9B0BC49A89151CC040E188716E6C2C8312C63C7209D9D85A9924595103EEB032E4221E24836E1D3DCDC30BC4BD9908ABDD8AADAD70203010001";
    var ROOT_PATH = "/static/pinganfuweb-modules/pafweblib/pwdGrd/1.0.1";
    var DOWNLOAD_DIALOG = "pwdGrdDlg";
    //<-constants
    var PwdGrdModule = function(opts) {
        var options = this.options = extend(PwdGrdModule.prototype.defaultOptions, opts);
        this.pgeditorMap = {};
        var timer = null;
        var module = this;
        //TODO now there is dependency of PassEncryptor from password.js
        var lazyLoadFunc = function() {
            if (PassEncryptor) {
                module.init(options);
                clearInterval(timer);
            }
        };
        timer = setInterval(lazyLoadFunc, 200);
    };
    PwdGrdModule.prototype = {
        defaultOptions: {
            ctrls: [],
            formSelector: "form",
            preSubmitFunc: null,
            isMandatory: false,
            unmatchMsg: "支付密码不一致",
            errorClass: ""
        },
        // Initialization
        init: function(options) {
            var isInstalled = false;
            var needShowStrength = false;
            var baseEditor = null, confirmEditor = null;
            var pgeditorList = [];
            var unmatchMsg = options.unmatchMsg;
            var isMandatory = options.isMandatory;
            var formSelector = options.formSelector;
            var enableElmSelector = options.enableElmSelector;
            var errorClass = options.errorClass;
            var ctrls = options.ctrls;
            var downloadPath = "";
            var rootPath = options.rootPath ? options.rootPath + "/" + ROOT_PATH : ROOT_PATH;
            //TODO this part depends on PassEncryptor in password.js, ugly code, to be refactoring
            var data = PassEncryptor.getData();
            K1 = data.hPK || K1;
            K2 = data.aPK || K2;
            K3 = data.hPK || K3;
            var ts = data.ts;
            if (ctrls && ctrls.length > 0) {
                for (var i = 0; i < ctrls.length; i++) {
                    var ctrl = ctrls[i];
                    ctrl.sClass = ctrl.sClass || SCLASS_DEFAULT;
                    ctrl.iClass = ctrl.iClass || ICLASS_DEFAULT;
                    ctrl.pgeEreg1 = ctrl.pgeEreg1 || PGE_EREG1_DEFAULT;
                    ctrl.pgeEreg2 = ctrl.pgeEreg2 || PGE_EREG2_DEFAULT;
                    ctrl.hasPlaceHolder = ctrl.hasPlaceHolder || false;
                    ctrl.nextTabId = ctrl.nextTabId || NEXT_TAB_ID_DEFAULT;
                    ctrl.minLength = ctrl.minLength || 0;
                    ctrl.tabIdx = $("#" + ctrl.id).attr("tabindex") || 2;
                    var pgeditor = new $.pge({
                        //ctrl file path
                        pgePath: rootPath + "/exe/",
                        //ctrl id
                        pgeId: ctrl.id + "Ocx",
                        //type[0: *,1: actual input text]
                        pgeEdittype: 0,
                        //character validation when inputting
                        pgeEreg1: ctrl.pgeEreg1,
                        //character validation after input
                        pgeEreg2: ctrl.pgeEreg2,
                        //max length
                        pgeMaxlength: 16,
                        //tab index
                        pgeTabindex: ctrl.tabIdx,
                        //style
                        pgeClass: ctrl.sClass,
                        //install style
                        pgeInstallClass: ctrl.iClass,
                        //uppercase callback
                        pgeCapsLKOn: "XPASSGUARD.capslkon()",
                        //lowercase callback
                        pgeCapsLKOff: "XPASSGUARD.capslkoff()",
                        //return callback
                        pgeOnkeydown: "XPASSGUARD.doSubmit()",
                        //tab callback in firefox
                        tabCallback: ctrl.nextTabId,
                        k1: K1,
                        k2: K2,
                        k3: K3,
                        ts: ts
                    });
                    //if operation system or browser doesn't support this passguard control, then return
                    if (!pgeditor.isSupport()) {
                        return;
                    }
                    //register pgeditor in pgeditorMap
                    this.pgeditorMap[ctrl.id] = pgeditor;
                    //register baseEditor, confirmEditor for password matching
                    if (PwdGrdModule.MATCH_TYPE.BASE == ctrl.matchType) {
                        baseEditor = pgeditor;
                    } else if (PwdGrdModule.MATCH_TYPE.CONFIRM == ctrl.matchType) {
                        confirmEditor = pgeditor;
                    }
                    pgeditorList.push(pgeditor);
                    if (!needShowStrength && ctrl.showStrengthFunc) {
                        needShowStrength = true;
                    }
                    //password guard control
                    var pgCtrl = $(pgeditor.load());
                    //old password input
                    var anchor = $("#" + ctrl.id);
                    var needRemove = false;
                    if (pgeditor.isInstalled) {
                        //move to far away
                        if (ctrl.hasPlaceHolder) {
                            pgCtrl.addClass("pwdGrd-far-away");
                        }
                        isInstalled = true;
                        pgCtrl.width(anchor.outerWidth() - 2);
                        pgCtrl.height(anchor.outerHeight() - 2).css("line-height", anchor.outerHeight() - 2 + "px");
                        if ("password" == anchor.attr("type")) {
                            //if anchor is password input, replace it with passguard ctrl
                            needRemove = true;
                        }
                    } else {
                        if (isMandatory) {
                            pgCtrl.width(anchor.outerWidth() - 2);
                            pgCtrl.height(anchor.outerHeight() - 2).css("line-height", anchor.outerHeight() - 2 + "px");
                            if ("password" == anchor.attr("type")) {
                                //if anchor is password input, replace it with passguard ctrl
                                needRemove = true;
                            }
                        } else {
                            //remove default style
                            pgCtrl.removeAttr("style");
                        }
                    }
                    pgCtrl.insertAfter("#" + ctrl.id);
                    if (needRemove) {
                        if (!isInstalled || !ctrl.hasPlaceHolder) {
                            anchor.remove();
                        }
                    }
                    //This function is required to initialize control in IE
                    pgeditor.pgInitialize();
                    if (ctrl.hasPlaceHolder && isInstalled) {
                        $("#" + ctrl.id).on("focus", function(e) {
                            pgCtrl.removeClass("pwdGrd-far-away");
                            anchor.remove();
                            setTimeout(function() {
                                pgCtrl.focus();
                            }, 100);
                        });
                    }
                    if ($("#" + ctrl.id).is(":hidden")) {
                        anchor.width(0);
                        anchor.height(0);
                        pgCtrl.addClass("pwdGrd-far-away");
                        $("#" + pgeditor.id + "_down").hide();
                    } else {
                        //reset download link
                        var downloadLnk = $("#" + pgeditor.id + "_down a");
                        downloadPath = downloadLnk.attr("href");
                        downloadLnk.attr("href", "javascript:void(0)");
                        downloadLnk.click(this._showDownloadBubble);
                    }
                }
                //new live checking func list
                var liveCheckingFuncList = [];
                //password strength scoring
                var updatePasswordStrengthFunc = function() {
                    for (var i = 0; i < ctrls.length; i++) {
                        var ctrl = ctrls[i];
                        var showStrengthFunc = ctrl.showStrengthFunc;
                        if (showStrengthFunc) {
                            var pgeditor = pgeditorList[i];
                            if (pgeditor.pwdLength() > 0) {
                                //has password, show strength
                                var patternCode = pgeditor.getPatternCode();
                                var score = passwordModule.entropyScoreByPatternLength(patternCode, pgeditor.pwdLength());
                                var strengthLevel = 0;
                                if (isNaN(score) || pgeditor.isInBlackList()) {
                                    strengthLevel = 0;
                                } else if (score <= 30) {
                                    strengthLevel = 1;
                                } else if (score <= 60) {
                                    strengthLevel = 2;
                                } else {
                                    strengthLevel = 3;
                                }
                                showStrengthFunc(strengthLevel, score);
                            } else {
                                //blank password, clear strength
                                showStrengthFunc(-1);
                            }
                        }
                    }
                    return true;
                };
                //check char type number
                var checkCharTypeNumFunc = function() {
                    for (var i = 0; i < ctrls.length; i++) {
                        var ctrl = ctrls[i];
                        var charTypeNum = ctrl.charTypeNum;
                        if (charTypeNum) {
                            var pgeditor = pgeditorList[i];
                            var pgeCtrlId = pgeditor.id;
                            //clear warning
                            PwdGrdModule.emptyErrors("#" + pgeCtrlId, PwdGrdModule.WARNING_TYPE.CHAR_TYPE);
                            var actualCharTypeNum = pgeditor.charsNum();
                            if (pgeditor.pwdLength() > 0) {
                                if (actualCharTypeNum < charTypeNum) {
                                    var error = {
                                        name: "大写字母、小写字母、数字、特殊字符至少包含" + charTypeNum + "种"
                                    };
                                    PwdGrdModule.renderErrors("#" + pgeCtrlId, error, errorClass + " " + PwdGrdModule.WARNING_TYPE.CHAR_TYPE);
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                };
                //register char type num checking in live checking
                liveCheckingFuncList.push(checkCharTypeNumFunc);
                //check password matching
                if (baseEditor && confirmEditor) {
                    var passwordMatchFunc = function() {
                        PwdGrdModule.emptyErrors("#" + confirmEditor.id, PwdGrdModule.WARNING_TYPE.UNMATCH);
                        if (confirmEditor.pwdLength() > 0) {
                            var md5Base = baseEditor.pwdHash();
                            var md5Confirm = confirmEditor.pwdHash();
                            if (md5Base != md5Confirm) {
                                var pgeCtrlId = confirmEditor.id;
                                var error = {
                                    name: unmatchMsg
                                };
                                PwdGrdModule.renderErrors("#" + pgeCtrlId, error, errorClass + " " + PwdGrdModule.WARNING_TYPE.UNMATCH);
                                return false;
                            }
                        }
                        return true;
                    };
                    //register password matching in live checking
                    liveCheckingFuncList.push(passwordMatchFunc);
                }
                //live checking when inputing
                var validationFunc = function() {
                    var hasEmptyPassword = false;
                    //do strength checking first
                    if (needShowStrength) {
                        updatePasswordStrengthFunc();
                    }
                    //if no empty, remove required warning
                    for (var i = 0; i < pgeditorList.length; i++) {
                        var pgeditor = pgeditorList[i];
                        var pgeCtrlId = pgeditor.id;
                        if (pgeditor.pwdLength() > 0) {
                            PwdGrdModule.emptyErrors("#" + pgeCtrlId, PwdGrdModule.WARNING_TYPE.REQUIRED);
                        } else {
                            //there is empty password
                            hasEmptyPassword = true;
                        }
                        var ctrl = ctrls[i];
                        if (ctrl) {
                            PwdGrdModule.emptyErrors("#" + pgeCtrlId, PwdGrdModule.WARNING_TYPE.LENGTH);
                            PwdGrdModule.emptyErrors("#" + pgeCtrlId, PwdGrdModule.WARNING_TYPE.CHAR_TYPE);
                            PwdGrdModule.emptyErrors("#" + pgeCtrlId, PwdGrdModule.WARNING_TYPE.TOO_EASY);
                            //check length
                            var minLength = ctrl.minLength;
                            if (minLength) {
                                if (pgeditor.pwdLength() > 0 && pgeditor.pwdLength() < minLength) {
                                    var error = {
                                        name: "密码长度需要是" + minLength + "位以上"
                                    };
                                    PwdGrdModule.renderErrors("#" + pgeCtrlId, error, errorClass + " " + PwdGrdModule.WARNING_TYPE.LENGTH);
                                    if (enableElmSelector) {
                                        //disable dependency element
                                        $(enableElmSelector).prop("disabled", true);
                                    }
                                    return false;
                                }
                            }
                            //check black list
                            if (PwdGrdModule.MATCH_TYPE.BASE == ctrl.matchType) {
                                if (pgeditor.isInBlackList()) {
                                    var error = {
                                        name: "您设置的密码太简单啦^_^"
                                    };
                                    PwdGrdModule.renderErrors("#" + pgeCtrlId, error, errorClass + " " + PwdGrdModule.WARNING_TYPE.TOO_EASY);
                                    if (enableElmSelector) {
                                        //disable dependency element
                                        $(enableElmSelector).prop("disabled", true);
                                    }
                                    return false;
                                }
                            }
                        }
                    }
                    //if there are dependency elements
                    if (enableElmSelector) {
                        if (!hasEmptyPassword) {
                            var count = $(enableElmSelector).data("sendOTPCount");
                            if (!count || count <= 0) {
                                //enable dependency element
                                $(enableElmSelector).prop("disabled", null);
                            }
                        } else {
                            //disable dependency element
                            $(enableElmSelector).prop("disabled", true);
                        }
                    }
                    for (var i = 0; i < liveCheckingFuncList.length; i++) {
                        var liveCheckingFunc = liveCheckingFuncList[i];
                        var isValid = liveCheckingFunc();
                        if (!isValid) {
                            //stop on first invalid
                            return false;
                        }
                    }
                    return true;
                };
                if (isInstalled) {
                    window.setInterval(validationFunc, 800);
                }
                //register callback function when submit       
                XPASSGUARD = {};
                XPASSGUARD.capslkon = function() {};
                XPASSGUARD.capslkoff = function() {};
                XPASSGUARD.postTab = function(nextTabId) {
                    if (document.body.style.WebkitBoxShadow == undefined) {
                        document.getElementById(nextTabId).focus();
                    }
                };
                XPASSGUARD.doSubmit = function() {
                    var $form = $(formSelector);
                    if ($form.hasClass("submitting-pwdgrd")) {
                        return false;
                    }
                    var preSubmitFunc = options.preSubmitFunc || function() {
                        return true;
                    };
                    if (preSubmitFunc(pgeditorList) && validationFunc()) {
                        var firstPgeditor = null;
                        var firstPwdInput = null;
                        var form = null;
                        //set enctryt password
                        for (var i = 0; i < pgeditorList.length; i++) {
                            var pgeditor = pgeditorList[i];
                            var ctrl = ctrls[i];
                            var pwdInput = $("input[name=" + ctrl.id + "]");
                            if (i == 0) {
                                firstPgeditor = pgeditor;
                                firstPwdInput = pwdInput;
                                form = firstPwdInput.closest("form");
                            }
                            if (pwdInput.size() == 0) {
                                //if input hidden is not there, append one
                                form.append("<input type='hidden' name='" + ctrl.id + "' value='" + pgeditor.pwdResult() + "'></input>");
                            } else {
                                //set encryt password to hidden input
                                pwdInput.val(pgeditor.pwdResult());
                            }
                        }
                        //set pcInfo
                        form.find('input[name="pcInfo"]').remove();
                        form.append("<input type='hidden' name='pcInfo' value='" + firstPgeditor.getPcInfo() + "'></input>");
                        //set devId
                        form.find('input[name="devId"]').remove();
                        form.append("<input type='hidden' name='devId' value='" + firstPgeditor.getDevID() + "'></input>");
                        $form.addClass("submitting-pwdgrd");
                        return true;
                    } else {
                        return false;
                    }
                };
                if (isInstalled) {
                    var $form = $(formSelector);
                    if ($form.length > 0) {
                        //interceptor original sumbit event
                        var submitEventObjs = null;
                        if ($._data($form[0], "events")) {
                            submitEventObjs = $._data($form[0], "events")["submit"];
                        }
                        var submitEventsHandlers = [];
                        if (submitEventObjs) {
                            for (var i = 0; i < submitEventObjs.length; i++) {
                                var submitEventObj = submitEventObjs[i];
                                if (submitEventObj) {
                                    submitEventsHandlers.push(submitEventObj.handler);
                                }
                            }
                        }
                        var newSubmitFunc = function() {
                            var submitBtnVal = null;
                            var submitBtn = $form.find('button[type="submit"]');
                            if (submitBtn.length > 0) {
                                submitBtnVal = submitBtn.text();
                            } else {
                                submitBtn = $form.find('input[type="submit"]');
                                if (submitBtn.length > 0) {
                                    submitBtnVal = submitBtn.val();
                                }
                            }

                            var ret = false;
                            for (var i = 0; i < submitEventsHandlers.length; i++) {
                                var submitEventHandler = submitEventsHandlers[i];
                                if (submitEventHandler) {
                                    ret = submitEventHandler();
                                    if (false === ret) {
                                        if (submitBtnVal) {
                                            $form.removeClass("submitting");
                                            if(submitBtn[0].tagName == "BUTTON"){
                                            	submitBtn.text(submitBtnVal);
                                            }else{
                                            	submitBtn.val(submitBtnVal);
                                            }
                                        }
                                        return ret;
                                    }
                                }
                            }
                            ret = XPASSGUARD.doSubmit();
                            if (ret == false) {
                                if (submitBtnVal) {
                                    $form.removeClass("submitting");
                                    if(submitBtn[0].tagName == "BUTTON"){
                                    	submitBtn.text(submitBtnVal);
                                    }else{
                                    	submitBtn.val(submitBtnVal);
                                    }
                                }
                            }
                            return ret;
                        };
                        $form.unbind("submit");
                        $form.submit(newSubmitFunc);
                    }
                } else {
                    var pwdGrdTips = $("#pwdGrdTips");
                    pwdGrdTips.closest("form").click(function() {
                        pwdGrdTips.remove();
                    });
                    $("body").click(function() {
                        pwdGrdTips.remove();
                    });
                    //add control download bubble
                    this._addDownloadBubble(downloadPath);
                }
            }
        },
        getPgeditorById: function(id) {
            return this.pgeditorMap[id];
        },
        //show download bubble
        _showDownloadBubble: function() {
            $("#" + DOWNLOAD_DIALOG).dialog({
                width: 600,
                height: 380,
                modal: true,
                dialogClass: "pwdGrd-Dlg",
                title: "安全控件提示",
                closeText: "关闭",
                resizable: false,
                draggable: false,
                open: function(event, ui) {
                    var widget = this;
                    var customizedCloseBtn = $('<a href="javascript:void(0)" class="pwdGrd-Dlg-close"><s></s><em>关闭</em></a>');
                    customizedCloseBtn.click(function() {
                        $(widget).dialog("close");
                    });
                    customizedCloseBtn.insertAfter(".ui-dialog-titlebar-close");
                    $(widget).parent().find(".ui-dialog-titlebar-close").remove();
                }
            });
        },
        //create download dialog dom onto body
        _addDownloadBubble: function(ctrlPath) {
            if ($("#" + DOWNLOAD_DIALOG).size() > 0) {
                return;
            }
            var html = [];
            html.push('<div id="' + DOWNLOAD_DIALOG + '" style="display:none">');
            html.push('<div style="height:230px">');
            html.push('<div style="text-align:center;height:60px;margin-top:40px">安装控件，可以对您输入的信息（密码、金额等）进行加密保护，提高账户安全。</div>');
            html.push('<div style="text-align:center"><p class="pwdGrd-Dlg-memo">控件安装完成后，<a style="color:#0087e3;outline: none;" href="javascript:location.reload();">请刷新</a> </p></div>');
            html.push('<div style="margin-top: 25px;text-align:center">');
            html.push('<a style="position:absolute;left:-20px;" href="javascript:void(0)">a</a><a class="pwdGrd-Dlg-btn" target="_blank" href="' + ctrlPath + '">立即安装</a>');
            html.push("</div>");
            html.push("</div>");
            if(this._getBrowserName() === "Chrome") {
                html.push('<div class="pwdGrd-Dlg-foot"><div style="padding-top: 10px;"><img src="/static/pinganfuweb-modules/pafweblib/pwdGrd/1.0.1/img/chrome.png" style="padding-top: 5px;width: 14px;height: 14px;margin-right: 5px;"> ' + this._getBrowserName() + " 用户，请点击右上角允许使用控件</span><a style='float: right;color:#0087e3;' href=\"/helpcenter/question?anchor=safewidgetQ\" target='_blank'>帮助？</a></div>");
            } else {
                html.push('<div class="pwdGrd-Dlg-foot"><div style="padding-top: 10px;">' + this._getBrowserName() + " 用户，请允许使用控件</span><a style='float: right;color:#0087e3;' href=\"/helpcenter/question?anchor=safewidgetQ\" target='_blank'>帮助？</a></div>");
            }
            html.push("</div>");
            var pwdGrdDlg = $(html.join(""));
            $("body").append(pwdGrdDlg);
        },
        //get operation system name
        _getOsName: function() {
            var sUserAgent = navigator.userAgent;
            var osName = "Other";
            var isWin = navigator.platform == "Win32" || navigator.platform == "Windows";
            var isMac = navigator.platform == "Mac68K" || navigator.platform == "MacPPC" || navigator.platform == "Macintosh" || navigator.platform == "MacIntel";
            if (isMac) osName = "Mac";
            var isUnix = navigator.platform == "X11" && !isWin && !isMac;
            if (isUnix) osName = "Unix";
            var isLinux = String(navigator.platform).indexOf("Linux") > -1;
            var bIsAndroid = sUserAgent.toLowerCase().match(/android/i) == "android";
            if (isLinux) {
                if (bIsAndroid) osName = "Android"; else osName = "Linux";
            }
            if (isWin) {
                var isWin2K = sUserAgent.indexOf("Windows NT 5.0") > -1 || sUserAgent.indexOf("Windows 2000") > -1;
                if (isWin2K) osName = "Windows 2000";
                var isWinXP = sUserAgent.indexOf("Windows NT 5.1") > -1 || sUserAgent.indexOf("Windows XP") > -1;
                if (isWinXP) osName = "Windows XP";
                var isWin2003 = sUserAgent.indexOf("Windows NT 5.2") > -1 || sUserAgent.indexOf("Windows 2003") > -1;
                if (isWin2003) osName = "Windows 2003";
                var isWinVista = sUserAgent.indexOf("Windows NT 6.0") > -1 || sUserAgent.indexOf("Windows Vista") > -1;
                if (isWinVista) osName = "Windows Vista";
                var isWin7 = sUserAgent.indexOf("Windows NT 6.1") > -1 || sUserAgent.indexOf("Windows 7") > -1;
                if (isWin7) osName = "Windows 7";
                var isWin8 = sUserAgent.indexOf("Windows NT 6.2") > -1 || sUserAgent.indexOf("Windows NT 6.3") > -1 || sUserAgent.indexOf("Windows 8") > -1;
                if (isWin8) osName = "Windows 8";
            }
            return osName;
        },
        //get browser name
        _getBrowserName: function() {
            var win = window;
            var doc = win.document;
            var userAgent = win.navigator.userAgent.toLowerCase();
            var browserName = "Other";
            function _mime(where, value, name, nameReg) {
                var mimeTypes = win.navigator.mimeTypes, i;
                if (mimeTypes && mimeTypes.length > 0) {
                    for (i in mimeTypes) {
                        if (mimeTypes[i][where] == value) {
                            if (name !== undefined && nameReg.test(mimeTypes[i][name])) return true; else if (name === undefined) return true;
                        }
                    }
                }
                return false;
            }
            function _getChromiumType() {
                if (win.scrollMaxX !== undefined) return "";
                var isOriginalChrome = _mime("type", "application/vnd.chromium.remoting-viewer");
                // 原始 chrome
                if (isOriginalChrome) {
                    return "chrome";
                } else if (!!win.chrome) {
                    var _track = "track" in doc.createElement("track"), _style = "scoped" in doc.createElement("style"), _v8locale = "v8Locale" in win;
                    //sougou
                    if (!!win.external && !!win.external.SEVersion && !!win.external.Sogou404) return "sougou";
                    //liebao
                    if (!!win.external && !!win.external.LiebaoAutoFill_CopyToClipboard) return "liebao";
                    //360ee
                    if (_track && !_style && !_v8locale) return "360ee";
                    //360se
                    if (_track && _style && _v8locale) return "360se";
                    return "other chrome";
                }
                return "";
            }
            var chromiumType = _getChromiumType();
            if (userAgent.indexOf("opera") >= 0 || userAgent.indexOf("opr") >= 0) {
                //Opera
                browserName = "Opera";
            } else if (userAgent.indexOf("qqbrowser") >= 0 || userAgent.indexOf("tencenttraveler") >= 0) {
                //QQ Browser
                browserName = "QQ";
            } else if (win.scrollMaxX !== undefined) {
                //firefox 
                browserName = "Firefox";
            } else if ("360ee" === chromiumType || "360se" === chromiumType) {
                //360
                browserName = "360";
            } else if ("chrome" === chromiumType) {
                //Chrome
                browserName = "Chrome";
            } else if ("sougou" === chromiumType) {
                //sougou
                browserName = "搜狗";
            } else if ("liebao" === chromiumType) {
                //liebao
                browserName = "猎豹";
            } else if (userAgent.indexOf("safari") >= 0) {
                //Safari
                browserName = "Safari";
            } else if (userAgent.indexOf("msie") >= 0 || !!userAgent.match(/trident\/7\./)) {
                //ie
                browserName = "IE";
            }
            return browserName;
        }
    };
    //matching password input type
    //0 - password input to be matched with
    //1 - comfirm input
    PwdGrdModule.MATCH_TYPE = {
        BASE: 0,
        CONFIRM: 1
    };
    //warning type
    PwdGrdModule.WARNING_TYPE = {
        REQUIRED: "pwdgrd_required",
        LENGTH: "pwdgrd_length",
        UNMATCH: "pwdgrd_unmatch",
        CHAR_TYPE: "pwdgrd_char_type",
        TOO_EASY: "pwdgrd_too_easy"
    };
    //check if is installed
    PwdGrdModule.isInstalled = function() {
        var pgeditor = new $.pge({});
        return pgeditor.isInstalled;
    };
    //clear current input warning
    PwdGrdModule.emptyErrors = function(el, typeClass) {
        var $t = $(el);
        var selector = ".help-block";
        if (typeClass) {
            selector = ".help-block." + typeClass;
        }
        var $formGroup = $t.closest(".form-group");
        if ($formGroup.length == 0) $formGroup = $t.closest(".control-group");
        $formGroup.find(selector).remove();
        //if tip, show the tip
        if (0 == $formGroup.find(".help-block").size()) {
            $formGroup.find(".tip").show();
        }
    };
    //clear all warnings in the from
    PwdGrdModule.emptyAllErrors = function(el) {
        var $t = $(el);
        var $form = $t.closest("form");
        $form.find(".help-block").remove();
        //if tip, show the tip
        $form.find(".tip").show();
    };
    //pre rendering errors
    PwdGrdModule.preRenderErrors = function(el) {};
    //register common error handle function for PwdGrdModule
    PwdGrdModule.renderErrors = function(el, errors, typeClass) {
        PwdGrdModule.preRenderErrors(el);
        var $t = $(el);
        var $formGroup = $t.closest(".form-group");
        if ($formGroup.length == 0) $formGroup = $t.closest(".control-group");
        if (errors) {
            if (!typeClass) typeClass = "";
            var errorBlock = $('<div class="help-block error ' + typeClass + '"></div>');
            errorBlock.detach();
            //TODO add detaching of element for faster inserts
            var count = 0;
            for (var name in errors) {
                ++count;
                $('<span class="error-container" style="float:left; clear:both;" data-error-name="' + name + '">' + errors[name] + "</span>").appendTo(errorBlock);
            }
            if (count > 0) {
                $formGroup.addClass("control-group-error");
                var $formControl = $formGroup.find(".controls");
                if ($formControl.size() > 0) {
                    errorBlock.appendTo($formControl);
                } else {
                    errorBlock.appendTo($formGroup);
                }
                if (errorBlock.is(":hidden")) {
                    errorBlock.slideDown(100);
                }
                //hide tip
                $formGroup.find(".tip").hide();
            }
        } else {
            $formGroup.removeClass("control-group-error");
        }
    };
    module.exports = PwdGrdModule;
    function extend(obj) {
        var sources = ArrayProto.slice.call(arguments, 0), source, retObj = {};
        for (var i = 0, len = sources.length; i < len; i++) {
            source = sources[i];
            if (source) {
                for (var prop in source) {
                    retObj[prop] = source[prop];
                }
            }
        }
        return retObj;
    }
    //base64
    var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);
    // 编码的方法
    function base64encode(str) {
        var out, i, len;
        var c1, c2, c3;
        len = str.length;
        i = 0;
        out = "";
        while (i < len) {
            c1 = str.charCodeAt(i++) & 255;
            if (i == len) {
                out += base64EncodeChars.charAt(c1 >> 2);
                out += base64EncodeChars.charAt((c1 & 3) << 4);
                out += "==";
                break;
            }
            c2 = str.charCodeAt(i++);
            if (i == len) {
                out += base64EncodeChars.charAt(c1 >> 2);
                out += base64EncodeChars.charAt((c1 & 3) << 4 | (c2 & 240) >> 4);
                out += base64EncodeChars.charAt((c2 & 15) << 2);
                out += "=";
                break;
            }
            c3 = str.charCodeAt(i++);
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt((c1 & 3) << 4 | (c2 & 240) >> 4);
            out += base64EncodeChars.charAt((c2 & 15) << 2 | (c3 & 192) >> 6);
            out += base64EncodeChars.charAt(c3 & 63);
        }
        return out;
    }
    // 解码的方法
    function base64decode(str) {
        var c1, c2, c3, c4;
        var i, len, out;
        len = str.length;
        i = 0;
        out = "";
        while (i < len) {
            do {
                c1 = base64DecodeChars[str.charCodeAt(i++) & 255];
            } while (i < len && c1 == -1);
            if (c1 == -1) break;
            do {
                c2 = base64DecodeChars[str.charCodeAt(i++) & 255];
            } while (i < len && c2 == -1);
            if (c2 == -1) break;
            out += String.fromCharCode(c1 << 2 | (c2 & 48) >> 4);
            do {
                c3 = str.charCodeAt(i++) & 255;
                if (c3 == 61) return out;
                c3 = base64DecodeChars[c3];
            } while (i < len && c3 == -1);
            if (c3 == -1) break;
            out += String.fromCharCode((c2 & 15) << 4 | (c3 & 60) >> 2);
            do {
                c4 = str.charCodeAt(i++) & 255;
                if (c4 == 61) return out;
                c4 = base64DecodeChars[c4];
            } while (i < len && c4 == -1);
            if (c4 == -1) break;
            out += String.fromCharCode((c3 & 3) << 6 | c4);
        }
        return out;
    }
    function utf16to8(str) {
        var out, i, len, c;
        out = "";
        len = str.length;
        for (i = 0; i < len; i++) {
            c = str.charCodeAt(i);
            if (c >= 1 && c <= 127) {
                out += str.charAt(i);
            } else if (c > 2047) {
                out += String.fromCharCode(224 | c >> 12 & 15);
                out += String.fromCharCode(128 | c >> 6 & 63);
                out += String.fromCharCode(128 | c >> 0 & 63);
            } else {
                out += String.fromCharCode(192 | c >> 6 & 31);
                out += String.fromCharCode(128 | c >> 0 & 63);
            }
        }
        return out;
    }
    function utf8to16(str) {
        var out, i, len, c;
        var char2, char3;
        out = "";
        len = str.length;
        i = 0;
        while (i < len) {
            c = str.charCodeAt(i++);
            switch (c >> 4) {
              case 0:
              case 1:
              case 2:
              case 3:
              case 4:
              case 5:
              case 6:
              case 7:
                // 0xxxxxxx
                out += str.charAt(i - 1);
                break;

              case 12:
              case 13:
                // 110x xxxx 10xx xxxx
                char2 = str.charCodeAt(i++);
                out += String.fromCharCode((c & 31) << 6 | char2 & 63);
                break;

              case 14:
                // 1110 xxxx 10xx xxxx 10xx xxxx
                char2 = str.charCodeAt(i++);
                char3 = str.charCodeAt(i++);
                out += String.fromCharCode((c & 15) << 12 | (char2 & 63) << 6 | (char3 & 63) << 0);
                break;
            }
        }
        return out;
    }
    //PassGuardCtrl
    var PGEdit_IE32_CLASSID = "B406D90D-BF27-4F1A-8730-D4564AFFE06E";
    var PGEdit_IE32_CAB = "";
    //PingAnPaySecurity.cab#version=1,0,0,1
    var PGEdit_IE32_EXE = "PingAnPaySecurity.exe";
    var PGEdit_IE_VERSION = "1,0,0,2";
    var PGEdit_IE64_CLASSID = "B406D90D-BF27-4F1A-8730-D4564AFFE06E";
    var PGEdit_IE64_CAB = "";
    //PingAnPaySecurityX64.cab#version=1,0,0,1
    var PGEdit_IE64_EXE = "PingAnPaySecurity.exe";
    var PGEdit_FF = "PingAnPaySecurity.exe";
    var PGEdit_Linux32 = "";
    var PGEdit_Linux64 = "";
    var PGEdit_FF_VERSION = "1.0.0.2";
    var PGEdit_Linux_VERSION = "";
    var PGEdit_MacOs = "PingAnPaySecurity.pkg";
    var PGEdit_MacOs_VERSION = "1.0.0.4";
    var PGEdit_MacOs_Safari = "PingAnPaySecurity.pkg";
    var PGEdit_MacOs_Safari_VERSION = "1.0.0.4";
    var greyWordList = "112233,123123,123321,abcabc,abc123,a1b2c3,aaa111,123qwe,qwerty,qweasd,admin,password,p@ssword,passwd,iloveyou,5201314,12345qwert,12345QWERT,1qaz2wsx,password,qwerty,monkey,letmein,trustno1,dragon,baseball,111111,iloveyou,master,sunshine,ashley,bailey,passw0rd,shadow,superman,qazwsx,michael,football";
    //.split(",");
    var UPEdit_Update = "1";
    //非IE控件是否强制升级 1强制升级,0不强制升级
    var PGECert = "";
    if (navigator.userAgent.indexOf("MSIE") < 0) {
        navigator.plugins.refresh();
    }
    (function($) {
        $.pge = function(options) {
            this.settings = $.extend(true, {}, $.pge.defaults, options);
            this.init();
        };
        $.extend($.pge, {
            defaults: {
                pgePath: "./ocx/",
                pgeId: "",
                pgeEdittype: 0,
                pgeEreg1: "",
                k1: "",
                k2: "",
                k3: "",
                ts: "",
                pgeEreg2: "",
                pgeCert: "",
                pgeMaxlength: 12,
                pgeTabindex: 2,
                pgeClass: "ocx_style",
                pgeInstallClass: "ocx_style",
                pgeOnkeydown: "",
                pgeFontName: "",
                pgeFontSize: "",
                pgeOnblur: "",
                pgeOnfocus: "",
                tabCallback: "",
                pgeBackColor: "",
                pgeForeColor: "",
                pgeCapsLKOn: "",
                pgeCapsLKOff: ""
            },
            prototype: {
                init: function() {
                    this.id = this.settings.pgeId;
                    this.pgeDownText = "请点此安装控件";
                    this.osBrowser = this.checkOsBrowser();
                    this.pgeVersion = this.getVersion();
                    this.isInstalled = this.checkInstall();
                    if (this.settings.pgeCert == "") this.settings.pgeCert = PGECert;
                },
                checkOsBrowser: function() {
                    var userosbrowser;
                    if (navigator.platform == "Win32" || navigator.platform == "Windows") {
                        if (navigator.userAgent.indexOf("MSIE") > 0 || navigator.userAgent.indexOf("msie") > 0 || navigator.userAgent.indexOf("Trident") > 0 || navigator.userAgent.indexOf("trident") > 0) {
                            if (navigator.userAgent.indexOf("ARM") > 0) {
                                userosbrowser = 9;
                                //win8 RAM Touch
                                this.pgeditIEExe = "";
                            } else {
                                userosbrowser = 1;
                                //windows32ie32
                                this.pgeditIEClassid = PGEdit_IE32_CLASSID;
                                this.pgeditIECab = PGEdit_IE32_CAB;
                                this.pgeditIEExe = PGEdit_IE32_EXE;
                            }
                        } else {
                            userosbrowser = 2;
                            //windowsff
                            this.pgeditFFExe = PGEdit_FF;
                        }
                    } else if (navigator.platform == "Win64") {
                        if (navigator.userAgent.indexOf("Windows NT 6.2") > 0 || navigator.userAgent.indexOf("windows nt 6.2") > 0) {
                            userosbrowser = 1;
                            //windows32ie32
                            this.pgeditIEClassid = PGEdit_IE32_CLASSID;
                            this.pgeditIECab = PGEdit_IE32_CAB;
                            this.pgeditIEExe = PGEdit_IE32_EXE;
                        } else if (navigator.userAgent.indexOf("MSIE") > 0 || navigator.userAgent.indexOf("msie") > 0 || navigator.userAgent.indexOf("Trident") > 0 || navigator.userAgent.indexOf("trident") > 0) {
                            userosbrowser = 3;
                            //windows64ie64
                            this.pgeditIEClassid = PGEdit_IE64_CLASSID;
                            this.pgeditIECab = PGEdit_IE64_CAB;
                            this.pgeditIEExe = PGEdit_IE64_EXE;
                        } else {
                            userosbrowser = 2;
                            //windowsff
                            this.pgeditFFExe = PGEdit_FF;
                        }
                    } else if (navigator.userAgent.indexOf("Linux") > 0) {
                        if (navigator.userAgent.indexOf("_64") > 0) {
                            userosbrowser = 4;
                            //linux64
                            this.pgeditFFExe = PGEdit_Linux64;
                        } else {
                            userosbrowser = 5;
                            //linux32
                            this.pgeditFFExe = PGEdit_Linux32;
                        }
                        if (navigator.userAgent.indexOf("Android") > 0) {
                            userosbrowser = 7;
                        }
                    } else if (navigator.userAgent.indexOf("Macintosh") > 0) {
                        if (navigator.userAgent.indexOf("Safari") > 0 && (navigator.userAgent.indexOf("Version/5.1") > 0 || navigator.userAgent.indexOf("Version/5.2") > 0 || navigator.userAgent.indexOf("Version/6") > 0)) {
                            userosbrowser = 8;
                            //macos Safari 5.1 more
                            this.pgeditFFExe = PGEdit_MacOs_Safari;
                        } else if (navigator.userAgent.indexOf("Firefox") > 0 || navigator.userAgent.indexOf("Chrome") > 0) {
                            userosbrowser = 6;
                            //macos
                            this.pgeditFFExe = PGEdit_MacOs;
                        } else if (navigator.userAgent.indexOf("Opera") >= 0) {
                            userosbrowser = 6;
                            //macos
                            this.pgeditFFExe = PGEdit_MacOs;
                        } else if (navigator.userAgent.indexOf("Safari") >= 0) {
                            userosbrowser = 6;
                            //macos
                            this.pgeditFFExe = PGEdit_MacOs;
                        } else {
                            userosbrowser = 0;
                            //macos
                            this.pgeditFFExe = "";
                        }
                    }
                    return userosbrowser;
                },
                //added by trsun 20140515->
                getTipHtml: function() {
                    var html = [];
                    if ($("#pwdGrdTips").size() == 0) {
                        html.push('<div style="position:relative;width:0px;height:0px;overflow:visible"><div class="pafweblib-pwdGrd-tips" id="pwdGrdTips">');
                        html.push('<span class="pafweblib-pwdGrd-tips-text">控件可保护您输入信息的安全</span>');
                        html.push('<div class="pafweblib-pwdGrd-tips-angle"></div>');
                        html.push("</div></div>");
                    }
                    return html.join("");
                },
                //<-added by trsun 20140515
                getpgeHtml: function() {
                    if (this.osBrowser == 1 || this.osBrowser == 3) {
                        var pgeOcx = '<OBJECT align="middle" ID="' + this.settings.pgeId + '" CLASSID="CLSID:' + this.pgeditIEClassid + '" style="display:none" codebase="' + this.settings.pgePath + this.pgeditIECab + '"';
                        if (this.settings.pgeOnkeydown != undefined && this.settings.pgeOnkeydown != "") pgeOcx += ' onkeydown="if(13==event.keyCode || 27==event.keyCode)' + this.settings.pgeOnkeydown + ';"';
                        if (this.settings.pgeOnblur != undefined && this.settings.pgeOnblur != "") pgeOcx += ' onblur="' + this.settings.pgeOnblur + '"';
                        if (this.settings.pgeOnfocus != undefined && this.settings.pgeOnfocus != "") pgeOcx += ' onfocus="' + this.settings.pgeOnfocus + '"';
                        if (this.settings.pgeTabindex != undefined && this.settings.pgeTabindex != "") pgeOcx += ' tabindex="' + this.settings.pgeTabindex + '" ';
                        if (this.settings.pgeClass != undefined && this.settings.pgeClass != "") pgeOcx += ' class="' + this.settings.pgeClass + '"';
                        pgeOcx += ">";
                        if (this.settings.pgeEdittype != undefined && this.settings.pgeEdittype != "") pgeOcx += '<param name="edittype" value="' + this.settings.pgeEdittype + '">';
                        if (this.settings.pgeMaxlength != undefined && this.settings.pgeMaxlength != "") pgeOcx += '<param name="maxlength" value="' + this.settings.pgeMaxlength + '">';
                        if (this.settings.pgeEreg1 != undefined && this.settings.pgeEreg1 != "") pgeOcx += '<param name="input2" value="' + this.settings.pgeEreg1 + '">';
                        if (this.settings.pgeEreg2 != undefined && this.settings.pgeEreg2 != "") pgeOcx += '<param name="input3" value="' + this.settings.pgeEreg2 + '">';
                        if (this.settings.pgeCapsLKOn != undefined && this.settings.pgeCapsLKOn != "") pgeOcx += '<param name="input52" value="' + this.settings.pgeCapsLKOn + '">';
                        if (this.settings.pgeCapsLKOff != undefined && this.settings.pgeCapsLKOff != "") pgeOcx += '<param name="input53" value="' + this.settings.pgeCapsLKOff + '">';
                        pgeOcx += "</OBJECT>";
                        pgeOcx += '<span id="' + this.settings.pgeId + '_down" class="' + this.settings.pgeInstallClass + '" style="text-align:center;display:none;">' + this.getTipHtml() + '<a href="' + this.settings.pgePath + this.pgeditIEExe + '">' + this.pgeDownText + "</a></span>";
                        return pgeOcx;
                    } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                        var pgeOcx = '<embed align="absmiddle" ID="' + this.settings.pgeId + '"  maxlength="' + this.settings.pgeMaxlength + '" input_2="' + this.settings.pgeEreg1 + '" input_3="' + this.settings.pgeEreg2 + '" edittype="' + this.settings.pgeEdittype + '" type="application/pinganfu-edit" tabindex="' + this.settings.pgeTabindex + '" class="' + this.settings.pgeClass + '" ';
                        if (this.settings.pgeOnblur != undefined && this.settings.pgeOnblur != "") pgeOcx += ' onblur="' + this.settings.pgeOnblur + '"';
                        if (this.settings.pgeOnkeydown != undefined && this.settings.pgeOnkeydown != "") pgeOcx += ' input_1013="' + this.settings.pgeOnkeydown + '"';
                        if (this.settings.tabCallback != undefined && this.settings.tabCallback != "") pgeOcx += " input_1009=\"XPASSGUARD.postTab('" + this.settings.tabCallback + "')\"";
                        if (this.settings.pgeOnfocus != undefined && this.settings.pgeOnfocus != "") pgeOcx += ' onfocus="' + this.settings.pgeOnfocus + '"';
                        if (this.settings.pgeFontName != undefined && this.settings.pgeFontName != "") pgeOcx += ' FontName="' + this.settings.pgeFontName + '"';
                        if (this.settings.pgeFontSize != undefined && this.settings.pgeFontSize != "") pgeOcx += " FontSize=" + Number(this.settings.pgeFontSize) + "";
                        if (this.settings.pgeCapsLKOn != undefined && this.settings.pgeCapsLKOn != "") pgeOcx += " input_1020=" + this.settings.pgeCapsLKOn + "";
                        if (this.settings.pgeCapsLKOff != undefined && this.settings.pgeCapsLKOff != "") pgeOcx += " input_1016=" + this.settings.pgeCapsLKOff + "";
                        pgeOcx += " >";
                        return pgeOcx;
                    } else if (this.osBrowser == 6) {
                        return '<embed align="absmiddle" ID="' + this.settings.pgeId + '" input2="' + this.settings.pgeEreg1 + '" input3="' + this.settings.pgeEreg2 + '" input4="' + Number(this.settings.pgeMaxlength) + '" input0="' + Number(this.settings.pgeEdittype) + '" type="application/pingan-pay" version="' + PGEdit_MacOs_VERSION + '" tabindex="' + this.settings.pgeTabindex + '" class="' + this.settings.pgeClass + '">';
                    } else if (this.osBrowser == 8) {
                        return '<embed align="absmiddle" ID="' + this.settings.pgeId + '" input2="' + this.settings.pgeEreg1 + '" input3="' + this.settings.pgeEreg2 + '" input4="' + Number(this.settings.pgeMaxlength) + '" input0="' + Number(this.settings.pgeEdittype) + '" type="application/pingan-pay" version="' + PGEdit_MacOs_Safari_VERSION + '" tabindex="' + this.settings.pgeTabindex + '" class="' + this.settings.pgeClass + '">';
                    } else {
                        return '<div id="' + this.settings.pgeId + '_down" class="' + this.settings.pgeInstallClass + '" style="text-align:center;">暂不支持此浏览器</div>';
                    }
                },
                getDownHtml: function() {
                    if (this.osBrowser == 1 || this.osBrowser == 3) {
                        return '<div id="' + this.settings.pgeId + '_down" class="' + this.settings.pgeInstallClass + '" style="text-align:center;">' + this.getTipHtml() + '<a href="' + this.settings.pgePath + this.pgeditIEExe + '">' + this.pgeDownText + " </a></div>";
                    } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5 || this.osBrowser == 6 || this.osBrowser == 8) {
                        return '<div id="' + this.settings.pgeId + '_down" class="' + this.settings.pgeInstallClass + '" style="text-align:center;">' + this.getTipHtml() + '<a href="' + this.settings.pgePath + this.pgeditFFExe + '">' + this.pgeDownText + "</a></div>";
                    } else {
                        return '<div id="' + this.settings.pgeId + '_down" class="' + this.settings.pgeInstallClass + '" style="text-align:center;">暂不支持此浏览器</div>';
                    }
                },
                load: function() {
                    if (!this.checkInstall()) {
                        return this.getDownHtml();
                    } else {
                        if (this.osBrowser == 2) {
                            if (this.pgeVersion != PGEdit_FF_VERSION && UPEdit_Update == 1) {
                                this.setDownText();
                                return this.getDownHtml();
                            }
                        } else if (this.osBrowser == 4 || this.osBrowser == 5) {
                            if (this.pgeVersion != PGEdit_Linux_VERSION && UPEdit_Update == 1) {
                                this.setDownText();
                                return this.getDownHtml();
                            }
                        } else if (this.osBrowser == 6) {
                            if (this.pgeVersion != PGEdit_MacOs_VERSION && UPEdit_Update == 1) {
                                this.setDownText();
                                return this.getDownHtml();
                            }
                        } else if (this.osBrowser == 8) {
                            if (this.pgeVersion != PGEdit_MacOs_Safari_VERSION && UPEdit_Update == 1) {
                                this.setDownText();
                                return this.getDownHtml();
                            }
                        }
                        return this.getpgeHtml();
                    }
                },
                generate: function() {
                    if (this.osBrowser == 2) {
                        if (this.isInstalled == false) {
                            return document.write(this.getDownHtml());
                        } else if (this.convertVersion(this.pgeVersion) < this.convertVersion(PGEdit_FF_VERSION) && UPEdit_Update == 1) {
                            this.setDownText();
                            return document.write(this.getDownHtml());
                        }
                    } else if (this.osBrowser == 4 || this.osBrowser == 5) {
                        if (this.isInstalled == false) {
                            return document.write(this.getDownHtml());
                        } else if (this.convertVersion(this.pgeVersion) < this.convertVersion(PGEdit_Linux_VERSION) && UPEdit_Update == 1) {
                            this.setDownText();
                            return document.write(this.getDownHtml());
                        }
                    } else if (this.osBrowser == 6) {
                        if (this.isInstalled == false) {
                            return document.write(this.getDownHtml());
                        } else if (this.convertVersion(this.pgeVersion) < this.convertVersion(PGEdit_MacOs_VERSION) && UPEdit_Update == 1) {
                            this.setDownText();
                            return document.write(this.getDownHtml());
                        }
                    } else if (this.osBrowser == 8) {
                        if (this.isInstalled == false) {
                            return document.write(this.getDownHtml());
                        } else if (this.convertVersion(this.pgeVersion) < this.convertVersion(PGEdit_MacOs_Safari_VERSION) && UPEdit_Update == 1) {
                            this.setDownText();
                            return document.write(this.getDownHtml());
                        }
                    }
                    return document.write(this.getpgeHtml());
                },
                pwdclear: function() {
                    if (this.checkInstall()) {
                        var control = document.getElementById(this.settings.pgeId);
                        if (control) {
                            control.ClearSeCtrl();
                        }
                    }
                },
                pwdSetSk: function(s) {
                    if (this.checkInstall()) {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3 || this.osBrowser == 6 || this.osBrowser == 8) {
                                control.input1 = s;
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                control.input(1, s);
                            }
                        } catch (err) {}
                    }
                },
                pwdResultHash: function() {
                    var code = "";
                    if (!this.checkInstall()) {
                        code = "01";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                code = control.output;
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                code = control.output(7);
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {}
                        } catch (err) {
                            code = "02";
                        }
                    }
                    //alert(code);
                    return code;
                },
                pwdResult: function() {
                    var code = "";
                    if (!this.checkInstall()) {
                        code = "01";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                control.input1 = this.settings.ts;
                                control.input9 = this.settings.k1;
                                control.input10 = this.settings.k2;
                                code = control.output29;
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                control.input(900, this.settings.ts);
                                control.input(901, this.settings.k1);
                                control.input(902, this.settings.k2);
                                code = control.output(900);
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                control.input1 = this.settings.ts;
                                control.input14 = this.settings.k1;
                                control.input15 = this.settings.k2;
                                code = control.get_output23();
                            }
                        } catch (err) {
                            code = "02";
                        }
                    }
                    //alert(code);
                    return code;
                },
                //当前浏览器是否支持密码控件
                isSupport: function() {
                    if (this.osBrowser == 1 || this.osBrowser == 3 || this.osBrowser == 2 || this.osBrowser == 6 || this.osBrowser == 8) {
                        return true;
                    } else {
                        return false;
                    }
                },
                //获得pc_info串
                getPcInfo: function() {
                    var pcinfo = "";
                    if (!this.checkInstall()) {
                        pcinfo = "01";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                var v = control.output28;
                                pcinfo = utf8to16(base64decode(v));
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                control.input(904, this.settings.k3);
                                var v = control.output(904);
                                pcinfo = v;
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                var v = control.get_output20();
                                pcinfo = utf8to16(base64decode(v));
                            }
                        } catch (err) {
                            pcinfo = "02";
                        }
                    }
                    //alert(code);
                    return pcinfo;
                },
                //获得mac列表
                getMacList: function() {
                    var maclist = "";
                    if (!this.checkInstall()) {
                        maclist = "01";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                var v = control.output38;
                                maclist = utf8to16(base64decode(v));
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                var v = control.output(903);
                                maclist = v;
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                var v = control.get_output21();
                                maclist = utf8to16(base64decode(v));
                            }
                        } catch (err) {
                            maclist = "02";
                        }
                    }
                    return maclist;
                },
                //获得设备指纹
                getDevID: function() {
                    var devid = "";
                    if (!this.checkInstall()) {
                        devid = "01";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                var v = control.output39;
                                devid = utf8to16(base64decode(v));
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                var v = control.output(902);
                                devid = v;
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                var v = control.get_output22();
                                devid = utf8to16(base64decode(v));
                            }
                        } catch (err) {
                            devid = "02";
                        }
                    }
                    return devid;
                },
                //包含几种字符
                charsNum: function() {
                    var chnum = "";
                    if (!this.checkInstall()) {
                        chnum = "01";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                var v = control.output54;
                                if (v == 1 || v == 2 || v == 4 || v == 8) {
                                    v = 1;
                                } else if (v == 3 || v == 5 || v == 6 || v == 9 || v == 10 || v == 12) {
                                    v = 2;
                                } else if (v == 7 || v == 11 || v == 13 || v == 14) {
                                    v = 3;
                                } else if (v == 15) {
                                    v = 4;
                                }
                                chnum = v;
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                var v = control.output(4, 1);
                                var o = 0;
                                if (v & 1) o++;
                                if (v & 2) o++;
                                if (v & 4) o++;
                                if (v & 8) o++;
                                chnum = o;
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                var v = control.get_output16();
                                var o = 0;
                                if (v & 1) o++;
                                if (v & 2) o++;
                                if (v & 4) o++;
                                if (v & 8) o++;
                                chnum = o;
                            }
                        } catch (err) {
                            chnum = "02";
                        }
                    }
                    return chnum;
                },
                //是否属于灰名单
                isInBlackList: function() {
                    var isgrey = "";
                    if (!this.checkInstall()) {
                        isgrey = "01";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                var val = control.output44;
                                if (val == 2) {
                                    isgrey = true;
                                } else {
                                    isgrey = false;
                                }
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                control.input(903, greyWordList);
                                isgrey = control.output(901) == "true";
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                var val = control.get_output12();
                                if (val == 2) {
                                    isgrey = true;
                                } else {
                                    isgrey = false;
                                }
                            }
                        } catch (err) {
                            isgrey = "02";
                        }
                    }
                    return isgrey;
                },
                getPatternCode: function() {
                    var patternCode = -1;
                    if (this.checkInstall()) {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                patternCode = control.output54;
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                patternCode = control.output(4, 1);
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                patternCode = control.get_output16();
                            }
                        } catch (err) {}
                    }
                    return patternCode;
                },
                //评分
                entropyScore: function() {
                    var score = "";
                    if (!this.checkInstall()) {
                        score = "01";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                var v = control.output54;
                                var o = 0;
                                if (v & 1) o += 10;
                                if (v & 2) o += 26;
                                if (v & 4) o += 26;
                                if (v & 8) o += 21;
                                score = Math.log(o) / Math.LN2 * control.output3 / (Math.log(83) / Math.LN2 * 10) * 60;
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                var v = control.output(4, 1);
                                var o = 0;
                                if (v & 1) o += 10;
                                if (v & 2) o += 26;
                                if (v & 4) o += 26;
                                if (v & 8) o += 21;
                                score = Math.log(o) / Math.LN2 * control.output(3) / (Math.log(83) / Math.LN2 * 10) * 60;
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                var v = control.get_output16();
                                var o = 0;
                                if (v & 1) o += 10;
                                if (v & 2) o += 26;
                                if (v & 4) o += 26;
                                if (v & 8) o += 21;
                                score = Math.log(o) / Math.LN2 * control.get_output3() / (Math.log(83) / Math.LN2 * 10) * 60;
                            }
                        } catch (err) {
                            code = "02";
                        }
                    }
                    return score;
                },
                //评分2
                entropyScore2: function() {
                    var score = "";
                    if (!this.checkInstall()) {
                        score = "01";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                var v = control.output4;
                                score = v;
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                var v = control.output(4, 1);
                                var o = 0;
                                if (v & 1) o += 10;
                                if (v & 2) o += 26;
                                if (v & 4) o += 26;
                                if (v & 8) o += 21;
                                score = Math.log(o) / Math.LN2 * control.output(3) / (Math.log(83) / Math.LN2 * 10) * 60;
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                var v = control.get_output4();
                                score = v;
                            }
                        } catch (err) {
                            code = "02";
                        }
                    }
                    return score;
                },
                machineNetwork: function() {
                    var code = "";
                    if (!this.checkInstall()) {
                        code = "01";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                code = control.GetIPMacList();
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                control.package = 0;
                                code = control.output(9);
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                code = control.get_output7(0);
                            }
                        } catch (err) {
                            code = "02";
                        }
                    }
                    return code;
                },
                machineDisk: function() {
                    var code = "";
                    if (!this.checkInstall()) {
                        code = "01";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                code = control.GetNicPhAddr(1);
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                control.package = 0;
                                code = control.output(11);
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                code = control.get_output7(2);
                            }
                        } catch (err) {
                            code = "02";
                        }
                    }
                    return code;
                },
                machineCPU: function() {
                    var code = "";
                    if (!this.checkInstall()) {
                        code = "01";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                code = control.GetNicPhAddr(2);
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                control.package = 0;
                                code = control.output(10);
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                code = control.get_output7(1);
                            }
                        } catch (err) {
                            code = "02";
                        }
                    }
                    return code;
                },
                pwdSimple: function() {
                    var code = "";
                    if (!this.checkInstall()) {
                        code = "";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                code = control.output44;
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                code = control.output(13);
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                code = control.get_output10();
                            }
                        } catch (err) {
                            code = "";
                        }
                    }
                    return code;
                },
                pwdValid: function() {
                    var code = "";
                    if (!this.checkInstall()) {
                        code = 1;
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                if (control.output1) code = control.output5;
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                code = control.output(5);
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                code = control.get_output5();
                            }
                        } catch (err) {
                            code = 1;
                        }
                    }
                    return code;
                },
                pwdHash: function() {
                    var code = "";
                    if (!this.checkInstall()) {
                        code = 0;
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                code = control.output2;
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                code = control.output(2);
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                code = control.get_output2();
                            }
                        } catch (err) {
                            code = 0;
                        }
                    }
                    return code;
                },
                pwdLength: function() {
                    var code = "";
                    if (!this.checkInstall()) {
                        code = 0;
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                code = control.output3;
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                code = control.output(3);
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                code = control.get_output3();
                            }
                        } catch (err) {
                            code = 0;
                        }
                    }
                    return code;
                },
                pwdStrength: function() {
                    var code = 0;
                    if (!this.checkInstall()) {
                        code = 0;
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.osBrowser == 1 || this.osBrowser == 3) {
                                var l = control.output3;
                                var n = control.output4;
                                var z = control.output54;
                            } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5) {
                                var l = control.output(3);
                                var n = control.output(4);
                                var z = control.output(4, 1);
                            } else if (this.osBrowser == 6 || this.osBrowser == 8) {
                                var l = control.get_output3();
                                var n = control.get_output4();
                                var z = control.get_output16();
                            }
                            if (l == 0) {
                                code = 0;
                            } else {
                                if (l >= 6 && n == 1) {
                                    code = 1;
                                } else if (l >= 6 && n == 2) {
                                    code = 2;
                                } else if (l >= 6 && n == 3) {
                                    code = 3;
                                }
                            }
                        } catch (err) {
                            code = 0;
                        }
                    }
                    return code;
                },
                checkInstall: function() {
                    try {
                        if (this.osBrowser == 1) {
                            var comActiveX = new ActiveXObject("PingAnPay.PassGuard.1");
                            if (this.convertIEVersion(comActiveX.output35) < this.convertIEVersion(PGEdit_IE_VERSION)) {
                                this.pgeDownText = "请点此升级控件";
                                return false;
                            }
                        } else if (this.osBrowser == 2 || this.osBrowser == 4 || this.osBrowser == 5 || this.osBrowser == 6 || this.osBrowser == 8) {
                            var arr = new Array();
                            if (this.osBrowser == 6) {
                                var pge_info = navigator.plugins["pinganpay 1G"].description;
                            } else if (this.osBrowser == 8) {
                                var pge_info = navigator.plugins["pinganpay 1G"].description;
                            } else {
                                var pge_info = navigator.plugins["PingAnFuEdit"].description;
                            }
                            if (pge_info.indexOf(":") > 0) {
                                arr = pge_info.split(":");
                                var pge_version = arr[1];
                            } else {
                                var pge_version = "";
                            }
                            var toUpgradeVersion = "";
                            if (this.osBrowser == 2) {
                                toUpgradeVersion = PGEdit_FF_VERSION;
                            } else if (this.osBrowser == 4 || this.osBrowser == 5) {
                                toUpgradeVersion = PGEdit_Linux_VERSION;
                            } else if (this.osBrowser == 6) {
                                toUpgradeVersion = PGEdit_MacOs_VERSION;
                            } else if (this.osBrowser == 8) {
                                toUpgradeVersion = PGEdit_MacOs_Safari_VERSION;
                            }
                            if (this.convertVersion(pge_version) < this.convertVersion(toUpgradeVersion)) {
                                this.setDownText();
                                return false;
                            }
                        } else if (this.osBrowser == 3) {
                            var comActiveX = new ActiveXObject("PingAnPay.PassGuard.1");
                            if (this.convertIEVersion(comActiveX.output35) < this.convertIEVersion(PGEdit_IE_VERSION)) {
                                this.pgeDownText = "请点此升级控件";
                                return false;
                            }
                        }
                    } catch (e) {
                        return false;
                    }
                    return true;
                },
                getVersion: function() {
                    try {
                        if (navigator.userAgent.indexOf("MSIE") < 0) {
                            var arr = new Array();
                            if (this.osBrowser == 6) {
                                var pge_info = navigator.plugins["pinganpay 1G"].description;
                            } else if (this.osBrowser == 8) {
                                var pge_info = navigator.plugins["pinganpay 1G"].description;
                            } else {
                                var pge_info = navigator.plugins["PingAnFuEdit"].description;
                            }
                            if (pge_info.indexOf(":") > 0) {
                                arr = pge_info.split(":");
                                var pge_version = arr[1];
                            } else {
                                var pge_version = "";
                            }
                        }
                        return pge_version;
                    } catch (e) {
                        return "";
                    }
                },
                setColor: function() {
                    var code = "";
                    if (!this.checkInstall()) {
                        code = "";
                    } else {
                        try {
                            var control = document.getElementById(this.settings.pgeId);
                            if (this.settings.pgeBackColor != undefined && this.settings.pgeBackColor != "") control.BackColor = this.settings.pgeBackColor;
                            if (this.settings.pgeForeColor != undefined && this.settings.pgeForeColor != "") control.ForeColor = this.settings.pgeForeColor;
                        } catch (err) {
                            code = "";
                        }
                    }
                },
                convertIEVersion: function(version) {
                    if (version != "") {
                        var m = version.split(",");
                        var v = parseInt(m[0] * 1e3) + parseInt(m[1] * 100) + parseInt(m[2] * 10) + parseInt(m[3]);
                        return v;
                    } else {
                        return "";
                    }
                },
                convertVersion: function(version) {
                    if (version != "") {
                        var m = version.split(".");
                        var v = parseInt(m[0] * 1e3) + parseInt(m[1] * 100) + parseInt(m[2] * 10) + parseInt(m[3]);
                        return v;
                    } else {
                        return "";
                    }
                },
                setDownText: function() {
                    if (this.pgeVersion != undefined && this.pgeVersion != "") {
                        this.pgeDownText = "请点此升级控件";
                    }
                },
                pgInitialize: function() {
                    if (this.checkInstall()) {
                        if (this.osBrowser == 1 || this.osBrowser == 3) {
                            $("#" + this.settings.pgeId).show();
                        }
                        var control = document.getElementById(this.settings.pgeId);
                        if (this.settings.pgeBackColor != undefined && this.settings.pgeBackColor != "") control.BackColor = this.settings.pgeBackColor;
                        if (this.settings.pgeForeColor != undefined && this.settings.pgeForeColor != "") control.ForeColor = this.settings.pgeForeColor;
                        control.input11 = greyWordList;
                        control.input12 = this.settings.k3;
                        control.input16 = greyWordList;
                        control.input10 = this.settings.k3;
                    } else {
                        if (this.osBrowser == 1 || this.osBrowser == 3) {
                            $("#" + this.settings.pgeId + "_down").show();
                        }
                    }
                }
            }
        });
    })(jQuery);
});
