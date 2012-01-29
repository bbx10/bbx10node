'use strict';
// Keep track of button clients
var SocketClients = [];

// Remember new button update client socket
exports.add = function(socket)
{
    var i;
    for (i=0; i < SocketClients.length; i++) {
        if (SocketClients[i] === -1) {
            SocketClients[i] = socket;
            return;
        }
    }
    SocketClients.push(socket);
}

// Forget button update client socket
exports.del = function (socket)
{
    var i;
    for (i=0; i < SocketClients.length; i++) {
        if (SocketClients[i] === socket) {
            SocketClients[i] = -1;
            return;
        }
    }
    console.log('client.del: socket not found');
}

// Send button update data to all client sockets
exports.emit = function (dest, data)
{
    var i;

    for (i = 0; i < SocketClients.length; i++) {
        if (SocketClients[i] !== -1) SocketClients[i].emit(dest, data);
    }
}
