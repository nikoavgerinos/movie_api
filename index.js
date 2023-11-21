const express = require('express'),
    fs = require('fs'),
    morgan = require('morgan'),
    path = require('path');

const app = express();




const movieList = [
    {
        title: 'Coach Carter',
        director: 'Thomas Carter'
    },
    {
        title: 'Movie 2',
        director: 'Director 2'
    },
    {
        title: 'Movie 3',
        director: 'Director 3'
    },
    {
        title: 'Movie 4',
        director: 'Director 4'
    },
    {
        title: 'Movie 5',
        director: 'Director 5'
    },
    {
        title: 'Movie 6',
        director: 'Director 6'
    },
    {
        title: 'Movie 7',
        director: 'Director 7'
    },
    {
        title: 'Movie 8',
        director: 'Director 8'
    },
    {
        title: 'Movie 9',
        director: 'Director 9'
    },
    {
        title: 'Movie 10',
        director: 'Director 10'
    },
];

// logging setup
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }));

//app routing setup
app.use(express.static('public'));

// GET request
app.get('/', (req, res) => {
    res.send('Welcome to myFlix application!');
});
app.get('/documentation.html', (req, res) => {
    res.sendFile('public/documentation.html', { root: __dirname });
});
app.get('/movies', (req, res) => {
    res.json(movieList);
});

// error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');

})






app.listen(8080, () => {
    console.log('The movie app has loaded and is listening on port 8080');
});
