const express = require('express'),
morgan = require('morgan'),
fs = require('fs'), // import built in node modules fs and path 
path = require('path');
const app = express();




const movieList = [
    {
        title: 'Coach Carter',
        genre: 'Drama, Sports',
        actors: 'Samuel L. Jackson, Rick Gonzales, Robert Richard',
        director: 'Thomas Carter',
        releaseYear: '2005',
        rating: 'PG-13',
        length: '136 mins'

    },
    {
        title: 'Movie 2',
        genre: '',
        actors: '',
        director: 'Director 2',
        releaseYear: '',
        rating: '',
        length: ''
        
    },
    {
        title: 'Movie 3',
        genre: '',
        actors: '',
        director: 'Director 3',
        releaseYear: '',
        rating: '',
        length: ''
    },
    {
        title: 'Movie 4',
        genre: '',
        actors: '',
        director: 'Director 4',
        releaseYear: '',
        rating: '',
        length: ''
    },
    {
        title: 'Movie 5',
        genre: '',
        actors: '',
        director: 'Director 5',
        releaseYear: '',
        rating: '',
        length: ''
    },
    {
        title: 'Movie 6',
        genre: '',
        actors: '',
        director: 'Director 6',
        releaseYear: '',
        rating: '',
        length: ''
    },
    {
        title: 'Movie 7',
        genre: '',
        actors: '',
        director: 'Director 7',
        releaseYear: '',
        rating: '',
        length: ''
    },
    {
        title: 'Movie 8',
        genre: '',
        actors: '',
        director: 'Director 8',
        releaseYear: '',
        rating: '',
        length: ''
    },
    {
        title: 'Movie 9',
        genre: '',
        actors: '',
        director: 'Director 9',
        releaseYear: '',
        rating: '',
        length: ''
    },
    {
        title: 'Movie 10',
        genre: '',
        actors: '',
        director: 'Director 10',
        releaseYear: '',
        rating: '',
        length: ''
    },
];

// logging setup
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }));

//app routing setup
app.use(express.static('public'));

// GET request
app.get('/', (req, res) =>{
    res.send('Welcome to myFlix application!');
});
app.get('/documentation.html', (req, res) =>{
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
