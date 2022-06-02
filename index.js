const express = require("express");
const app = express();
const PORT = 4000;
const cors = require("cors");
var amqp = require("amqplib/callback_api");

const mysql = require("mysql");
const connection = mysql.createConnection({
  host: "localhost",
  user: "dbuser",
  password: "s3kreee7",
  database: "friendbook-users",
});

app.use(express.json());
app.use(cors());

connection.connect();
app.listen(PORT, () => console.log("Listening on " + PORT));

var mqChannel;

amqp.connect("amqp://rabbitmq:5672", function (error0, conn) {
  if (error0) {
    throw error0;
  }
  conn.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }

    if (err) throw err;

    channel.assertQueue("actions", {
      durable: false,
    });

    mqChannel = channel;
  });
});

//Get all users
app.get("/api/usr", (_req, res) => {
  connection.query("SELECT * FROM users", (err, rows, fields) => {
    if (err) throw err;

    res.status(200).send({ rows });
  });
});

//Get a user by id
app.get("/api/usr/:id", (req, res) => {
  connection.query(
    `SELECT * FROM users WHERE id='${req.params.id}'`,
    (err, row, fields) => {
      if (err) throw err;

      res.status(200).send({ row });
    }
  );

  // var user = users[req.params.id];
  // if (!!user) {
  //   res.status(200).send(user);
  // } else {
  //   throw new Error("User by id " + req.params.id + " does not exist.");
  // }
});

//Create a user
app.post("/api/usr", (req, res) => {
  var msg = {
    type: "create",
    id: req.body.id,
    name: req.body.name,
  };
  mqChannel.sendToQueue("actions", Buffer.from(msg));
  connection.query(
    `INSERT INTO users (id, name, bio, birthdate) VALUES ('${req.body.id}', '${req.body.name}', '${req.body.bio}', '${req.body.birthdate}')`,
    (err, row, fields) => {
      if (err) throw err;

      res.status(200).send();
    }
  );
});

//Update user
app.put("/api/usr/:id", (req, res) => {
  var msg = {
    type: "update",
    id: req.body.id,
    name: req.body.name,
  };
  mqChannel.sendToQueue("actions", Buffer.from(msg));
  connection.query(
    `UPDATE users SET name='${req.body.name}', bio='${req.body.bio}', birthdate='${req.body.birthdate}' WHERE id='${req.params.id}'`,
    (err, result) => {
      if (err) throw err;

      res.status(200).send();
    }
  );
});

//Delete user
app.delete("/api/usr/:id", (req, res) => {
  var msg = {
    type: "delete",
    id: req.body.id,
  };
  mqChannel.sendToQueue("actions", Buffer.from(msg));
  connection.query(
    `DELETE FROM users WHERE id='${req.params.id}'`,
    (err, result) => {
      if (err) throw err;

      res.status(200).send();
    }
  );
});

// //get for friends
// app.get("/api/usr/frnd", (req, _res) => {
//   var ids = req.body;
//   var friends = [];

//   for (var i = 0; i < ids.length; i++) {
//     connection.query(
//       `SELECT * FROM users WHERE id='${ids[i]}'`,
//       (err, rows, fields) => {
//         friends.push(rows.name);
//       }
//     ); //to be fixed
//   }
//   connection.query("SELECT * FROM users", (err, rows, fields) => {
//     x;
//   });
// });
