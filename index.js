const express = require('express');
const app = express();
const PORT = 4000;

app.use(express.json())

app.listen(PORT, () => console.log('It\'s alive on: http://localhost:' + PORT))

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
})