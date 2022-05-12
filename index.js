const express = require("express");
const app = express();
const PORT = 4000;
const cors = require("cors");
var amqp = require("amqplib/callback_api");

app.use(express.json());
app.use(cors());

app.listen(PORT, () => console.log("Listening on " + PORT));

//Fake Database
let users = {
  1: {
    name: "John Doe",
    bio: "Live in NL and love frikandel",
  },
  2: {
    name: "Jane Doe",
    bio: "Looking for John Doe",
  },
  3: {
    name: "Draco Malfoy",
    bio: "Im blonde",
  },
};

//Get all users
app.get("/api/usr", (_req, res) => {
  res.status(200).send({ users });
});

//Get a user by id
app.get("/api/usr/:id", (req, res) => {
  var user = users[req.params.id];
  if (!!user) {
    res.status(200).send(user);
  } else {
    throw new Error("User by id " + req.params.id + " does not exist.");
  }
});

//Create a user
app.post("/api/usr", (req, res) => {
  if (!!req.body.name && !!req.body.bio) {
    var newUser = {
      name: req.body.name,
      bio: req.body.bio,
    };
    users[Object.keys(users).length + 1] = newUser;
    res.status(200);
  } else {
    throw new Error("User could not be created, missing field.");
  }
});

//Update user
app.put("/api/usr/:id", (req, res) => {
  var id = req.params.id;
  if (!!users[id]) {
    users[id] = {
      name: req.body.name,
      bio: req.body.bio,
    };
    res.status(200);
  } else {
    throw new Error("User by id " + id + " does not exist.");
  }
});

//Delete user
app.delete("/api/usr/:id", (req, res) => {
  if (!!users[req.params.id]) {
    delete users[req.params.id];
    res.status(200);
  } else {
    throw new Error("User by id " + id + " does not exist.");
  }
});

//get for friends
app.get("/api/usr/frnd/:id", (req, _res) => {
  if (!!users[req.params.id]) {
    amqp.connect("amqp://rabbitmq:5672", function (error0, connection) {
      if (error0) {
        throw error0;
      }
      connection.createChannel(function (error1, channel) {
        if (error1) {
          throw error1;
        }

        var queue = "users";
        var msg = JSON.stringify(users);

        channel.assertQueue(queue, {
          durable: false,
        });
        channel.sendToQueue(queue, Buffer.from(msg));

        console.log(" [x] Sent %s", msg);
      });
    });
  }
});
