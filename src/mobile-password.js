// 依赖encryptor.js
// 依赖password-rule.js
define(function(require, exports, module) {
    var encryptorPassword = require("pafweblib/pwdGrd/1.0.1/encryptor");
    var passwordRules = require("pafweblib/pwdGrd/1.0.1/password-rule");
    var blackRules = require("pafweblib/pwdGrd/1.0.1/black-rule");    
    var $iptPassword = $('[role="password-ruled"]'),
        passwordHolder = '[role="passwordHolder"]';

    // 把密码加密的执行方法
    function run() {
        // 把加密的密码填入到对应的字段
        $("form").submit(function() {
            $(this).find(".encrypted-password, .plugin-encrypted-password").each(function() {
                var $el = $(this), holder = $("#" + $el.prop("id") + "_");
                var $elValue = $.trim($el.val());
                if ($elValue && $elValue.length > 0) {
                    holder.val(encryptorPassword($elValue));
                }
            });
        });
        // 移除密码输入框的name属性；并增加隐藏域
        $(".encrypted-password, .plugin-encrypted-password").each(function() {
            var $el = $(this);
            $("<input type='hidden' name='" + $el.prop("name") + "' id='" + $el.prop("id") + "_" + "'/>").appendTo($el.closest("form"));
            var el = $el.css("visibility", "visible")[0];
            el.removeAttribute("disabled");
            el.removeAttribute("name");
        });
    }
    // 密码校验绑定
    function handleEvent() {
        //校验触发的行为
        $iptPassword.on("validate", function(e, vc) {
            var $password = $(this), val = $password.val();
            if (val == null || $.trim(val).length == 0) {
                $(this).trigger("displayStrength", [ -1 ]);
                vc.reject("密码不能为空");
                return false;
            }
            if (!passwordRules.validCharSet(val)) {
                $(this).trigger("displayStrength", [ -1 ]);
                vc.reject("密码不可用");
                return false;
            }
            if (passwordRules.isInBlackList(val)) {
                $(this).trigger("displayStrength", [ -1 ]);
                vc.reject("您设置的密码太简单啦^_^");
                return false;
            }
            if($password.hasClass("password-min-6")){
            	if (passwordRules.lessLength(val, 6)) {
                    $(this).trigger("displayStrength", [ -1 ]);
                    vc.reject("密码长度需要是6位以上");
                    return false;
                }
            }else if (passwordRules.lessLength(val, 8)) {
                $(this).trigger("displayStrength", [ -1 ]);
                vc.reject("密码长度需要是8位以上");
                return false;
            }
            if (passwordRules.moreLength(val)) {
                $(this).trigger("displayStrength", [ -1 ]);
                vc.reject("密码长度需要是16位以下");
                return false;
            }
            
            if ($(".black-rules-mobile").length > 0 && $(".black-rules-idNumber").length > 0) {
                if (blackRules.checkBlackRule(val, $(".black-rules-idNumber").val(), $(".black-rules-mobile").val())) {
                    vc.reject("您设置的密码太简单啦^_^");
                    return false;
                }
            } else{
                if (!passwordRules.validCharSetGroup(val)) {
                    $(this).trigger("displayStrength", [ -1 ]);
                    vc.reject("大写字母、小写字母、数字、特殊字符至少包含2种");
                    return false;
                }
            }
        });
        //校验后的处理逻辑，主要是触发密码强度的显示
        $iptPassword.on("afterValidate", function(e, vc) {
            var val = $(this).val();
            var score = passwordRules.entropyScore(val), mark = 0;
            if (val == "" || !passwordRules.validCharSet(val)) {
                $(this).trigger("displayStrength", [ -1 ]);
                return;
            }
            if (passwordRules.isInBlackList(val)) {
                $(this).trigger("displayStrength", [ 0, score, true ]);
                return;
            }
            if (isNaN(score)) {
                mark = 0;
            } else if (score <= 30) {
                mark = 1;
            } else if (score <= 60) {
                mark = 2;
            } else {
                mark = 3;
            }
            $(this).parents(passwordHolder).trigger("displayStrength", [ mark, score ]);
        });
        $("body").on("displayStrength", passwordHolder, function(e, mark, score, greyList) {
            // TODO 这里的行为pc和mobile不一致，需要重构
            var str = [ "invalid", "weak", "medium", "strong" ];
            $(this).next("input.strength").val(mark).next('[role="strongShow"]').removeClass().addClass(str[mark]);
        });
    }
    function init() {
        //给密码区域增加密码强度提示DOM
        $(passwordHolder).each(function() {
            var name = $(this).find('[role="password-ruled"]').prop("name");
            $(this).after("<div role='strongShow'><span class='s2'>弱</span><span class='s3'>中</span><span class='s4'>强</span></div>");
            $(this).after('<input type="hidden" class="strength" name="' + name + 'Strength" value="" />');
        });
        //显示密码为明文的逻辑
        $(".showpass").on("tap", function() {
            var $this = $(this);
            var $password = $this.parents("li").find('input[type="password"]');
            if ($password.length > 0) {
                $password.data("role", "password");
            } else {
                $password = $this.parents("li").find("input").filter(function() {
                    return $(this).data("role") == "password";
                });
            }
            if ($password.attr("type") === "password") {
                $password.attr("type", "text");
                $this.text("隐藏");
            } else {
                $password.attr("type", "password");
                $this.text("显示");
            }
        });
        //密码加密相关逻辑处理
        run();
        //处理绑定的逻辑
        handleEvent();
    }
    init();
});
