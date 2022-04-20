const express = require('express');
const app = express();
const PORT = 4000;
const cors = require('cors');
var amqp = require("amqplib/callback_api");

app.use(express.json());
app.use(cors());

app.listen(PORT, () => console.log('Listening on ' + PORT));

//Fake Database
let users = {
    1: {
        name: "John Doe",
        bio: "Live in NL and love frikandel"
    },
    2: {
        name: "Jane Doe",
        bio: "Looking for John Doe"
    },
    3: {
        name: "Draco Malfoy",
        bio: "Im blonde"
    }
};

//Get all users
app.get('/usr', (req, res) => {
    res.status(200).send({users})
});

//Get a user by id
app.get('/usr/:id', (req, res) => {
    var user = users[req.params.id]
    if(!!user)
    {
        res.status(200).send(user)
        return
    }
    else
    {   
        throw 'User by id ' + req.params.id + ' does not exist.'
    }
});

//Create a user
app.post('/usr', (req, res) => {
    if(!!req.body.name && !!req.body.bio)
    {
        var newUser = {
            name: req.body.name,
            bio: req.body.bio
        }
        users[Object.keys(users).length + 1] = newUser;
        res.status(200).send(users);
        return
    }
    else
    {
        throw 'User could not be created, missing field.'
        return
    }
});

//Update user
app.put('/usr/:id', (req, res) => {
    var id = req.params.id
    if(!!users[id]) {
        users[id] = {
            name: req.body.name,
            bio: req.body.bio
        }
        res.status(200).send(users)
        return
    }
    else
    {
        throw 'User by id ' + id + ' does not exist.'
        return
    }
});

//Delete user
app.delete('/usr/:id', (req, res) => {
    if(!!users[req.params.id]) {
        delete users[req.params.id]
        res.status(200).send(users)
        return
    }
    else
    {
        throw 'User by id ' + id + ' does not exist.'
    }
});

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }
        var queue = 'user_queue';

        channel.assertQueue(queue, {
            durable: true
        });
        channel.prefetch(1);
        console.log(' [x] Awaiting RPC requests');
        channel.consume(queue, function reply(msg) {
            var request = msg.content.toString();
            var response;
            console.log("request: ", request);
            switch (request) {
                case "allusers":
                    response = users;
                    break;

                default:
                    response = "Wrong request"
                    break;
            }

            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify(response)), {
                    correlationId: msg.properties.correlationId
                });

            channel.ack(msg);
        });
    });
});
