/**
 * Password rule module for pingan-1qiaobao website
 * @description
 * Common password rule module for password strength scoring and password validation rule
 * 
 * @dependency 
 * 
 * @param
 * 
 * @API
 * entropyScore
 * isInBlackList
 * validCharSet
 * validCharSetGroup
 * lessLength
 * moreLength
 * 
 * @useCase
 * 
 * @author trsun
 * @since 20140723
 * @version 1.0.0
 */
define(function(require, exports, module) {
    //pattern types
    //0001
    var PATTERN_DIGITAL = 1;
    //0010
    var PATTERN_LOWERCASE = 2;
    //0100
    var PATTERN_UPPERCASE = 4;
    //1000
    var PATTERN_SPECIALCHAR = 8;
    //regx map
    var REGX_MAP = {};
    REGX_MAP[PATTERN_DIGITAL] = "0-9";
    REGX_MAP[PATTERN_LOWERCASE] = "a-z";
    REGX_MAP[PATTERN_UPPERCASE] = "A-Z";
    REGX_MAP[PATTERN_SPECIALCHAR] = "~!@#$%^&*();<>.?_/\\-`";
    //strength score map
    var SCORE_MAP = {};
    SCORE_MAP[PATTERN_DIGITAL] = {
        "1~11": 30,
        "12~16": 60,
        "17~99": 90
    };
    SCORE_MAP[PATTERN_SPECIALCHAR] = {
        "1~8": 30,
        "9~14": 60,
        "15~99": 90
    };
    SCORE_MAP[PATTERN_LOWERCASE] = {
        "1~7": 30,
        "8~13": 60,
        "14~99": 90
    };
    SCORE_MAP[PATTERN_UPPERCASE] = {
        "1~7": 30,
        "8~13": 60,
        "14~99": 90
    };
    SCORE_MAP[PATTERN_DIGITAL | PATTERN_SPECIALCHAR] = {
        "1~7": 30,
        "8~12": 60,
        "13~99": 90
    };
    SCORE_MAP[PATTERN_DIGITAL | PATTERN_LOWERCASE] = {
        "1~7": 30,
        "8~12": 60,
        "13~99": 90
    };
    SCORE_MAP[PATTERN_DIGITAL | PATTERN_UPPERCASE] = {
        "1~7": 30,
        "8~12": 60,
        "13~99": 90
    };
    SCORE_MAP[PATTERN_SPECIALCHAR | PATTERN_LOWERCASE] = {
        "1~6": 30,
        "7~11": 60,
        "12~99": 90
    };
    SCORE_MAP[PATTERN_SPECIALCHAR | PATTERN_UPPERCASE] = {
        "1~6": 30,
        "7~11": 60,
        "12~99": 90
    };
    SCORE_MAP[PATTERN_LOWERCASE | PATTERN_UPPERCASE] = {
        "1~6": 30,
        "7~11": 60,
        "12~99": 90
    };
    SCORE_MAP[PATTERN_DIGITAL | PATTERN_LOWERCASE | PATTERN_SPECIALCHAR] = {
        "1~6": 30,
        "7~10": 60,
        "11~99": 90
    };
    SCORE_MAP[PATTERN_DIGITAL | PATTERN_UPPERCASE | PATTERN_SPECIALCHAR] = {
        "1~6": 30,
        "7~10": 60,
        "11~99": 90
    };
    SCORE_MAP[PATTERN_DIGITAL | PATTERN_LOWERCASE | PATTERN_UPPERCASE] = {
        "1~6": 30,
        "7~10": 60,
        "11~99": 90
    };
    SCORE_MAP[PATTERN_SPECIALCHAR | PATTERN_LOWERCASE | PATTERN_UPPERCASE] = {
        "1~6": 30,
        "7~10": 60,
        "11~99": 90
    };
    SCORE_MAP[PATTERN_DIGITAL | PATTERN_SPECIALCHAR | PATTERN_LOWERCASE | PATTERN_UPPERCASE] = {
        "1~5": 30,
        "6~9": 60,
        "10~99": 90
    };
    //
    function getRegxByPatternCode(patternCode) {
        var regxArray = [];
        if ((patternCode & PATTERN_DIGITAL) === PATTERN_DIGITAL) {
            regxArray.push(REGX_MAP["" + PATTERN_DIGITAL]);
        }
        if ((patternCode & PATTERN_LOWERCASE) === PATTERN_LOWERCASE) {
            regxArray.push(REGX_MAP["" + PATTERN_LOWERCASE]);
        }
        if ((patternCode & PATTERN_UPPERCASE) === PATTERN_UPPERCASE) {
            regxArray.push(REGX_MAP["" + PATTERN_UPPERCASE]);
        }
        if ((patternCode & PATTERN_SPECIALCHAR) === PATTERN_SPECIALCHAR) {
            regxArray.push(REGX_MAP["" + PATTERN_SPECIALCHAR]);
        }
        return new RegExp("^[" + regxArray.join("") + "]+$");
    }
    //get password feature code by password value
    function getPasswordPatternCode(value) {
        var featureCode = -1;
        var patternList = [];
        //digital
        patternList.push(PATTERN_DIGITAL);
        //lowercase
        patternList.push(PATTERN_LOWERCASE);
        //digital || lowercase
        patternList.push(PATTERN_DIGITAL | PATTERN_LOWERCASE);
        //uppercase
        patternList.push(PATTERN_UPPERCASE);
        //digital || uppercase
        patternList.push(PATTERN_DIGITAL | PATTERN_UPPERCASE);
        //lowercase || uppercase
        patternList.push(PATTERN_LOWERCASE | PATTERN_UPPERCASE);
        //digital || lowercase || uppercase
        patternList.push(PATTERN_DIGITAL | PATTERN_LOWERCASE | PATTERN_UPPERCASE);
        //special char
        patternList.push(PATTERN_SPECIALCHAR);
        //digital || special char
        patternList.push(PATTERN_DIGITAL | PATTERN_SPECIALCHAR);
        //lowercase || special char
        patternList.push(PATTERN_LOWERCASE | PATTERN_SPECIALCHAR);
        //digital || lowercase || special char
        patternList.push(PATTERN_DIGITAL | PATTERN_LOWERCASE | PATTERN_SPECIALCHAR);
        //uppercase || special char
        patternList.push(PATTERN_UPPERCASE | PATTERN_SPECIALCHAR);
        //digital || uppercase || special char
        patternList.push(PATTERN_DIGITAL | PATTERN_UPPERCASE | PATTERN_SPECIALCHAR);
        //lowercase || uppercase || special char
        patternList.push(PATTERN_LOWERCASE | PATTERN_UPPERCASE | PATTERN_SPECIALCHAR);
        //digital || lowercase || uppercase || special char
        patternList.push(PATTERN_DIGITAL | PATTERN_LOWERCASE | PATTERN_UPPERCASE | PATTERN_SPECIALCHAR);
        if (!value || "" === value) {
            featureCode = 0;
        }
        for (var i = 0; i < patternList.length; i++) {
            var patternCode = patternList[i];
            if (getRegxByPatternCode(patternCode).test(value)) {
                featureCode = patternCode;
                break;
            }
        }
        return featureCode;
    }
    function getStrengthScoreByPatten(patternCode, len) {
        var score = -1;
        if (patternCode && len) {
            var scoreLengthMap = SCORE_MAP[patternCode];
            for (var lengthRangeKey in scoreLengthMap) {
                lengthRangeArray = lengthRangeKey.split("~");
                if (lengthRangeArray.length == 2) {
                    var startRange = lengthRangeArray[0];
                    var endRange = lengthRangeArray[1];
                    if (len >= startRange && len <= endRange) {
                        score = scoreLengthMap[lengthRangeKey];
                        break;
                    }
                }
            }
        }
        return score;
    }
    function getStrengthScoreByValue(value) {
        var score = -1;
        if (!value || "" === value) {
            return score;
        }
        var patternCode = getPasswordPatternCode(value);
        var len = value.length;
        return getStrengthScoreByPatten(patternCode, len);
    }
    //get combination pattern number
    function getPatternNumber(value) {
        var patternNumber = 0;
        for (var patternKey in REGX_MAP) {
            var regx = REGX_MAP[patternKey];
            if (eval("/[" + regx + "]/.test('" + value + "')")) {
                patternNumber += 1;
            }
        }
        return patternNumber;
    }
    var VALID_PASSWORD_REGX = getRegxByPatternCode(PATTERN_DIGITAL | PATTERN_LOWERCASE | PATTERN_UPPERCASE | PATTERN_SPECIALCHAR);
    //black list
    var BLACKLIST = "112233,123123,123321,abcabc,abc123,a1b2c3,aaa111,123qwe,qwerty,qweasd,admin,password,p@ssword,passwd,iloveyou,5201314,12345qwert,12345QWERT,1qaz2wsx,password,qwerty,monkey,letmein,trustno1,dragon,baseball,111111,iloveyou,master,sunshine,ashley,bailey,passw0rd,shadow,superman,qazwsx,michael,football".split(",");
    //passwordRules
    var passwordRules = {
        entropyScore: function(value) {
            if (this.isInBlackList(value)) {
                return -1;
            } else {
                return getStrengthScoreByValue(value);
            }
        },
        entropyScoreByPatternLength: function(pattern, len) {
            return getStrengthScoreByPatten(pattern, len);
        },
        isInBlackList: function(v) {
            for (var i = 0; i < BLACKLIST.length; i++) {
                if (v === BLACKLIST[i]) {
                    return true;
                }
            }
            return false;
        },
        //valid password could only contains digital || lowercase || uppercase || special char
        validCharSet: function(value) {
            return VALID_PASSWORD_REGX.test(value);
        },
        //only accept 2-char-types more and also based on validCharSet
        validCharSetGroup: function(value) {
            return this.validCharSet(value) && getPatternNumber(value) >= 2;
        },
        lessLength: function(v, num) {
            var value = v || "", num = num || 6;
            return value.length < num;
        },
        moreLength: function(v) {
            var value = v || "";
            return value.length > 16;
        }
    };
    return passwordRules;
});
