// Keep on/off state of X10 devices. x10addr is something like "A1" or "P1"

'use strict';
var x10state = {};

exports.on = function(x10addr)
{
    x10state[x10addr] = 'on';
}

exports.off = function(x10addr)
{
    x10state[x10addr] = 'off';
}

exports.state = function(x10addr)
{
    if (x10state[x10addr]) {
        return x10state[x10addr];
    }
    else {
        return 'off';
    }
}

// Return an array with the on/off/unknown status of all X10 addresses.
exports.now = function() 
{   
    var h, i, x10addr, buttonupdate=[];
    // There are 16 house code A..P but do just A for now. Change "h < 1" to
    // "h < 16" for all 16 house codes.
    for (h = 0; h < 1; h++) {
        for (i = 1; i <= 16; i++) {
            x10addr = "ABCDEFGHIJKLMNOP".charAt(h) + i.toString();
            switch (x10state[x10addr]) {
                case 'on': 
                    buttonupdate.push({buttonid: x10addr, state: 'on' });
                    break;
                case 'off':
                    buttonupdate.push({buttonid: x10addr, state: 'off' });
                    break;
                default:
                    buttonupdate.push({buttonid: x10addr, state: 'unknown' });
                    break;
            }
        }
    }
    return buttonupdate;
}
