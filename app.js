'use strict';
var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    net = require('net');
// Connect to mochad on port 1099.
var mochad = net.createConnection(1099, 'beaglebone');
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

function mochad_on_connect(data)
{
    console.log('on connect');
    this.PartialLine = "";
    this.DevSection = "";
}

function mochad_on_end(data)
{
    console.log('on end');
    this.end();
}

// For simplicity, input from mochad is ignored.
mochad.on('connect', mochad_on_connect);
mochad.on('end', mochad_on_end);

io.set('log level', 1); // reduce socket.io logging

// This function runs whenever a socket.io client connects.
io.sockets.on('connection', function (socket) {
        socket.emit('buttonupdate', x10state.now());

        // This function runs when a button is pressed on the web client.
        socket.on('buttonpress', function (data) {
            console.log('on socket buttonpress ' + data.button);
            if (x10state.state(data.button) === 'off') {
            x10state.on(data.button);
            socket.emit('buttonupdate', [ { buttonid: data.button, state: 'on' } ] );
            socket.broadcast.emit('buttonupdate', [ { buttonid: data.button, state: 'on' } ] );
            // Turn the light on using mochad
            mochad.write('pl ' + data.button + ' on\n');
            }
            else if (x10state.state(data.button) === 'on') {
            x10state.off(data.button);
            socket.emit('buttonupdate', [ { buttonid: data.button, state: 'off' } ] );
            socket.broadcast.emit('buttonupdate', [ { buttonid: data.button, state: 'off' } ] );
            // Turn the light off
            mochad.write('pl ' + data.button + ' off\n');
            }
            });
        // This function runs when a web client disconnects.
        socket.on('end', function(socket) {
            });
});
