const express = require("express");
const app = express();
const PORT = 4000;
const cors = require("cors");
const amqp = require("amqplib/callback_api");
const jwt = require("jsonwebtoken");

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

let secret = [
  "-----BEGIN PUBLIC KEY-----",
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi60VZKmGbOEmHJgV2nTylCNjzyLa1DRKDChAoPgWGbURzer1Ba8mivPOlxP2+wr+w/cNcagz4n+N3+03kMa7XEPhzh5C6rMQh38Dw9S43QRF3hbv88sqaweG0KvD5NOrlYLJmJ6RGb2fH6dC0IQ4JkBhtQ6Wa3kt0Omum8f7aLR5BmmEkK77/ebFtoUNPVASP9Y8LR0fO8TjcZwf6OGShI6BOYAtHdErg6lPPIzR2EYg0JR8wCT96zQv0DV9OCyaDqRXaEb2G8fatNxGOWNBG7xTxUgidNxM/BAD22DqTYXm56JF4DchSPU63Mqd3z7wsUG9KjfQSEVgPbsGhEU4cQIDAQAB",
  "-----END PUBLIC KEY-----",
].join("\n");

let mqChannel;

//amqp://rabbitmq:5672
amqp.connect("amqp://rabbitmq:5672", function (error0, conn) {
  if (error0) {
    throw error0;
  }
  conn.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }

    channel.assertQueue("posts", {
      durable: false,
    });

    channel.assertQueue("friends", {
      durable: false,
    });

    mqChannel = channel;
  });
});

//Get all users
app.get("/api/usr", (_req, res) => {
  connection.query("SELECT * FROM users", (err, rows, _fields) => {
    if (err) throw err;

    res.status(200).send({ rows });
  });
});

//Check if self exists
app.get("/api/usr/self/:id", (req, res) => {
  jwt.verify(
    req.headers.authorization.replace("Bearer ", ""),
    secret,
    { algorithms: ["RS256"] },
    function (err, decoded) {
      if (err) {
        throw err;
      }
      connection.query(
        `SELECT * FROM users WHERE id='${decoded.sub}'`,
        (err2, row, _fields) => {
          if (err2) throw err2;
          
          if (row.length == 0) {
            const msg = {
              type: "create",
              id: decoded.sub,
              name: decoded.preferred_username,
            };
            mqChannel.sendToQueue("posts", Buffer.from(JSON.stringify(msg)));
            mqChannel.sendToQueue("friends", Buffer.from(JSON.stringify(msg)));

            connection.query(
              `INSERT INTO users (id, name, bio, birthdate) VALUES ('${
                decoded.sub
              }', '${decoded.preferred_username}', ${null}, ${null})`,
              (err3, _row, _fields) => {
                if (err3) throw err3;

                res.status(200).send(true);
              }
            );
          } else {
            res.status(200).send(false);
          }
        }
      );
    }
  );
});

//Get a user by id
app.get("/api/usr/:id", (req, res) => {
  connection.query(
    `SELECT * FROM users WHERE id='${req.params.id.toString()}'`,
    (err, row, _fields) => {
      if (err) throw err;

      res.status(200).send({ row });
    }
  );
});

//Create a user
app.post("/api/usr", (req, res) => {
  var msg = {
    type: "create",
    id: req.body.id,
    name: req.body.name,
  };
  mqChannel.sendToQueue("posts", Buffer.from(JSON.stringify(msg)));
  mqChannel.sendToQueue("friends", Buffer.from(JSON.stringify(msg)));
  connection.query(
    `INSERT INTO users (id, name, bio, birthdate) VALUES ('${req.body.id.toString()}', '${req.body.name.toString()}', ${null}, ${null})`,
    (err, _row, _fields) => {
      if (err) throw err;

      res.status(200).send();
    }
  );
});

//Update user
app.put("/api/usr/:id", (req, res) => {
  const msg = {
    type: "update",
    id: req.params.id,
    name: req.body.name,
  };
  mqChannel.sendToQueue("posts", Buffer.from(JSON.stringify(msg)));
  mqChannel.sendToQueue("friends", Buffer.from(JSON.stringify(msg)));
  connection.query(
    `UPDATE users SET name='${req.body.name.toString()}', bio='${req.body.bio.toString()}', birthdate='${req.body.birthdate.toString()}' WHERE id='${req.params.id.toString()}'`,
    (err, _result) => {
      if (err) throw err;

      res.status(200).send();
    }
  );
});

//Delete user
app.delete("/api/usr/:id", (req, res) => {
  const msg = {
    type: "delete",
    id: req.params.id,
  };
  mqChannel.sendToQueue("posts", Buffer.from(JSON.stringify(msg)));
  mqChannel.sendToQueue("friends", Buffer.from(JSON.stringify(msg)));
  connection.query(
    `DELETE FROM users WHERE id='${req.params.id.toString()}'`,
    (err, _result) => {
      if (err) throw err;

      res.status(200).send();
    }
  );
});