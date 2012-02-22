'use strict';
var app = require('http').createServer(handler),
io = require('socket.io').listen(app),
fs = require('fs'),
net = require('net');
// Connect to mochad on port 1099.
var mochad = net.createConnection(1099, 'bbxm');
var x10state = require('./x10state.js');

// Start http server
app.listen(8080);

// This function is called whenever an http client sends a request. It must
// return the http reponse. In this case, the response is always the file
// buttons.html.
function handler (req, res)
{
    //console.log(req.url);
    fs.readFile(__dirname + '/buttons.html',
                function (err, data) {
                    if (err) {
                        res.writeHead(500);
                        return res.end('Error loading buttons.html');
                    }

                    res.writeHead(200);
                    res.end(data);
                });
}

var LastEvent='';

function process_line(that, str)
{
    var words, washernormal, washeralert;
    var x10addr, housecode, unitcode, i, unitstatus, unitparts, x10func;
    var buttonupdate;

    if (str.match(/Device selected/)) {
        console.log('DevSel');
        //that.DevSel = true;
    }
    else if (str.match(/Device status/)) {
        console.log('DevStat');
        that.DevSection = "devstat";
    }
    else if (str.match(/Security sensor status/)) {
        // 01/14 20:18:37 Security sensor status
        that.DevSection = "sensors";
    }
    else if (str.match(/End status/)) {
        console.log('devend');
        that.DevSection = "";
    }
    else if (that.DevSection === "devsel") {
        console.log('device selected');
        //01/02 10:45:45 House A: 2,14
        words = str.split(" ");
        if (words[2] === "House") {
            housecode = words[3].slice(0,1);
            unitstatus = words[4].split(",");
            for (i = 0; i < unitstatus.length; i++) {
                x10state.select(housecode + unitstatus[i]);
            }
        }
    }
    else if (that.DevSection === "devstat") {
        console.log('device status');
        //01/02 11:11:35 House L: 4=0,12=0,14=1
        words = str.split(" ");
        if (words[2] === "House") {
            housecode = words[3].slice(0,1);
            //console.log('DevStat ' + housecode);
            unitstatus = words[4].split(",");
            for (i = 0; i < unitstatus.length; i++) {
                //console.log('DevStat ' + unitstatus[i]);
                unitparts = unitstatus[i].split("=");
                unitcode = unitparts[0];
                //console.log('DevStat ' + unitparts);
                switch (unitparts[1]) {
                    case "0":
                        x10state.off(housecode + unitcode);
                    break;
                    case "1":
                        x10state.on(housecode + unitcode);
                    break;
                    default:
                        break;
                }
            }
        }
    }
    else if (str.match(/[TR]x PL HouseUnit/)) {
        //01/01 22:11:42 Rx PL HouseUnit: C2
        //console.log('HouseUnit:');
        words = str.split(" ");
        x10state.select(words[5]);
    }
    else if (str.match(/[TR]x PL House:/)) {
        //01/01 22:11:42 Rx PL House: C Func: On
        //01/02 13:07:52 Tx PL House: E Func: All units off
        //console.log('House:');
        if (LastEvent !== str) {
            LastEvent = str;
            words = str.split(" ");
            x10func = words[7];
            for (i = 8; i < words.length; i++) {
                x10func = x10func + "_" + words[i];
            }
            io.sockets.emit('buttonupdate', x10state.doselected(words[5], x10func) );
        }
    }
}

mochad.on('connect', function() {
    this.on('end', function() {
        console.log('on end');
        this.end();
    });
    this.on('error', function() {
        console.log('on error');
        this.end();
    });
    this.on('data', function(data) {
        var str = data.toString(), lines, aLine, i;
        //console.log('on data');
        if (this.PartialLine !== "") {
            str = this.PartialLine + str;
        }
        lines = str.split('\n');
        for (i = 0; i < (lines.length - 1); i++) {
            aLine = lines[i];
            //console.log(aLine);
            process_line(this, aLine);
        }
        if (str.slice(-1) === '\n') {
            process_line(this, lines[i]);
            this.PartialLine = "";
        }
        else {
            // Save partial line for next time
            this.PartialLine = lines[i];
        }
    });
    console.log('on connect');
    this.PartialLine = "";
    this.DevSection = "";
    this.write("st\r");
});

io.set('log level', 1); // reduce socket.io logging

// This function runs whenever a socket.io client connects.
io.sockets.on('connection', function (socket) {
    socket.emit('buttonupdate', x10state.now());

    // This function runs when a button is pressed on the web client.
    socket.on('buttonpress', function (data) {
        console.log('on socket buttonpress ' + data.button);
        if (x10state.state(data.button) === 'off') {
            x10state.on(data.button);
            io.sockets.emit('buttonupdate', [ { buttonid: data.button, state: 'on' } ] );
            // Turn the light on using mochad
            mochad.write('pl ' + data.button + ' on\n');
        }
        else if (x10state.state(data.button) === 'on') {
            x10state.off(data.button);
            io.sockets.emit('buttonupdate', [ { buttonid: data.button, state: 'off' } ] );
            // Turn the light off
            mochad.write('pl ' + data.button + ' off\n');
        }
    });
    // This function runs when a web client disconnects.
    socket.on('end', function(socket) {
    });
});
