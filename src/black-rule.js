/**
 * Password black rule module for pingan-1qiaobao website
 * @description
 * Common password black rule module to validate password
 * 
 * @dependency 
 * 
 * @param
 * 
 * @API
 * checkBlackRule
 * 
 * @useCase
 * 
 * @author trsun
 * @since 20140730
 * @version 1.0.0
 */
define(function(require, exports, module) {
    function isAllSameChar(value) {
        var ret = false;
        if (value && value.length > 0) {
            var firstChar = value.charAt(0);
            var charSet = value.split(firstChar);
            if (charSet.length > value.length) {
                ret = true;
            }
        }
        return ret;
    }
    function isInOrder(value) {
        var ret = false;
        if ("0123456789".indexOf(value) >= 0) {
            ret = true;
        } else if ("9876543210".indexOf(value) >= 0) {
            ret = true;
        } else if ("abcdefghijklmnopqrstuvwxyz".indexOf(value) >= 0) {
            ret = true;
        } else if ("zyxwvutsrqponmlkjihgfedcba".indexOf(value) >= 0) {
            ret = true;
        } else if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(value) >= 0) {
            ret = true;
        } else if ("ZYXWVUTSRQPONMLKJIHGFEDCBA".indexOf(value) >= 0) {
            ret = true;
        }
        return ret;
    }
    function isPartOf(value, source) {
        var ret = false;
        if (source) {
            if (source.indexOf(value) >= 0) {
                ret = true;
            }
        }
        return ret;
    }
    function getBirthdayByIdentifyId(identifyId) {
        var birthday = "";
        if (identifyId) {
            if (identifyId.length == 18) {
                birthday = identifyId.substring(6, 14);
            }
        }
        return birthday;
    }
    function isBirthDayPattern(value, birthday) {
        var ret = false;
        if (birthday && birthday.length == 8) {
            var sYear = birthday.substring(0, 4);
            var smYear = birthday.substring(2, 4);
            var sMonth = birthday.substring(4, 6);
            var sDay = birthday.substring(6, 8);
            var iMonth = parseInt(sMonth);
            var iDay = parseInt(sDay);
            if (value === birthday) {
                //YYyyMmDd
                ret = true;
            } else if (value === smYear + sMonth + sDay) {
                ret = true;
            } else {
                if (iMonth < 10 && iDay < 10) {
                    if (value === sYear + iMonth + iDay || value === sYear + sMonth + iDay || value === sYear + iMonth + sDay) {
                        ret = true;
                    }
                } else if (iMonth < 10 && iDay >= 10) {
                    if (value === sYear + iMonth + sDay) {
                        ret = true;
                    }
                } else if (iMonth >= 10 && iDay < 10) {
                    if (value === sYear + sMonth + iDay) {
                        ret = true;
                    }
                }
            }
        }
        return ret;
    }
    //passwordRules
    var blackRules = {
        checkBlackRule: function(value, identifyId, mobileNum) {
            var ret = false;
            if (isAllSameChar(value) || isInOrder(value) || isPartOf(value, identifyId) || isPartOf(value, mobileNum) || isBirthDayPattern(value, getBirthdayByIdentifyId(identifyId))) {
                ret = true;
            }
            return ret;
        }
    };
    return blackRules;
});
