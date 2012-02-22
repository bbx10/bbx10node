// Keep on/off state of X10 devices. x10addr is something like "A1" or "P1"

'use strict';
var x10state = {};
var X10addrselected = [];

exports.on = function(x10addr)
{
    x10state[x10addr] = 'on';
};

exports.off = function(x10addr)
{
    x10state[x10addr] = 'off';
};

exports.state = function(x10addr)
{
    if (x10state[x10addr]) {
        return x10state[x10addr];
    }
    else {
        return 'off';
    }
};

function housecodetoint(housecode)
{
    return ("ABCDEFGHIJKLMNOP".indexOf(housecode));
}

exports.select = function(x10addr)
{
    var housecode, unitcode;
    housecode = housecodetoint(x10addr.slice(0, 1));
    if (housecode >= 0) {
        unitcode = x10addr.slice(1);
        console.log(housecode.toString() + unitcode);
        if (X10addrselected[housecode] === undefined) {
            X10addrselected[housecode] = [];
            X10addrselected[housecode][0] = 0;
        }
        else if (X10addrselected[housecode][0] === 1) {
            delete X10addrselected[housecode];
            X10addrselected[housecode] = [];
            X10addrselected[housecode][0] = 0;
        }
        X10addrselected[housecode][unitcode] = 1;
    }
};

function funcselected(housecode, func)
{
    if (X10addrselected[housecode] === undefined) {
        X10addrselected[housecode] = [];
    }
    X10addrselected[housecode][0] = func;
}

function checkselected(housecode, unitcode)
{
    if (X10addrselected[housecode] === undefined) {
        X10addrselected[housecode] = [];
    }
    return X10addrselected[housecode][unitcode];
}

exports.doselected = function(x10house, x10function)
{
    var housecode, unitcode, buttonupdate, i, x10addr;
    housecode = housecodetoint(x10house.slice(0, 1));
    buttonupdate = [];
    if (housecode >= 0) {
        switch (x10function) {
            case 'On':
                for (i = 1; i <= 16; i++) {
                    if (checkselected(housecode, i) === 1) {
                        x10addr = x10house + i.toString();
                        this.on(x10addr);
                        buttonupdate.push({buttonid: x10addr, state: 'on'});
                    }
                }
                funcselected(housecode, 1);
                break;
            case 'Off':
                for (i = 1; i <= 16; i++) {
                    if (checkselected(housecode, i) === 1) {
                        x10addr = x10house + i.toString();
                        this.off(x10addr);
                        buttonupdate.push({buttonid: x10addr, state: 'off'});
                    }
                }
                funcselected(housecode, 1);
                break;
            case 'All_lights_off':
            case 'All_units_off':
                for (i = 1; i <= 16; i++) {
                    x10addr = x10house + i.toString();
                    buttonupdate.push({buttonid: x10addr, state: 'off'});
                    this.off(x10addr);
                }
                funcselected(housecode, 1);
                break;
            case 'All_lights_on':
                for (i = 1; i <= 16; i++) {
                    x10addr = x10house + i.toString();
                    buttonupdate.push({buttonid: x10addr, state: 'on'});
                    this.on(x10addr);
                }
                funcselected(housecode, 1);
                break;
            default:
                break;
        }
    }
    return buttonupdate;
};

exports.deselect = function(x10addr)
{
    var housecode, unitcode;
    housecode = housecodetoint(x10addr.slice(0, 1));
    if (housecode >= 0) {
        unitcode = x10addr.slice(1);
        X10addrselected[housecode][unitcode]=0;
    }
};

// Return an array with the on/off/unknown status of all X10 addresses.
exports.now = function() 
{   
    var h, i, x10addr, buttonupdate=[];
    // There are 16 house code A..P but do just A for now. Change "h < 1" to
    // "h < 16" for all 16 house codes.
    for (h = 0; h < 16; h++) {
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
};
