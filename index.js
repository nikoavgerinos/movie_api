const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser'); // Add this line
const uuid = require('uuid');

const app = express();

app.use(bodyParser.json()); // Add this line to parse JSON bodies
const accessLogStream = fs.createWriteStream(path.join('log.txt'), { flags: 'a' });
// setup the logger
app.use(morgan('common'));



// top 10 movies
let topMovies = [
    {
        title: 'Coach Carter',
        description: 'Coach Carter is a rieviting sports drama that follows the inspiring true story of Coach Ken Carter, who shocks the basketball community by benching his undefeated team to prioritize academics, teaching them life lessons that transcend the court and ingite a powerful journey of self-discovery and triumph.',
        genre: 'Drama',
        actors: 'Samuel L. Jackson, Rick Gonzales, Robert Richard',
        director: 'Thomas Carter',
        releaseYear: '2005',
        rating: 'PG-13',
        length: '136 mins',
        imageUrl: 'https://www.themoviedb.org/t/p/original/y3HOTTyM5nLsdUzXFtFCohG28qj.jpg'

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

        director: 'Director 4',

    },
    {
        title: 'Movie 5',

        director: 'Director 5',

    },
    {
        title: 'Movie 6',

        director: 'Director 6',

    },
    {
        title: 'Movie 7',

        director: 'Director 7',

    },
    {
        title: 'Movie 8',
        director: 'Director 8',

    },
    {
        title: 'Movie 9',

        director: 'Director 9',

    },
    {
        Title: 'Movie 10',
        director: 'Director 10'
    }
];

//users
let users = [
    {
        id: 1,
        name: "George",
        email: "george.miller@gmail.com",
        password: "george123",
        favoriteMovies: ["Coach Carter"],
        
    },
    {
        id: 2,
        name: "Bryant",
        email: "bryant.smith@gmail.com",
        password: "bryant123",
        favoriteMovies: []
    }
];

let movies = [
    {
        "title": "Coach Carter",
        "year": "2005",
        "image": "https://www.themoviedb.org/t/p/original/y3HOTTyM5nLsdUzXFtFCohG28qj.jpg",
        "description": "Coach Carter is a riveting sports drama that follows the inspiring true story of Coach Ken Carter, who shocks the basketball community by benching his undefeated team to prioritize academics, teaching them life lessons that transcend the court and ignite a powerful journey of self-discovery and triumph.",
        "director": [
            {
                "Name": "Thomas Carter",
                "Birth": "1953",
                "Death": "",
                "Bio": "Thomas Carter is an accomplished American film and television director, known for his work on 'Coach Carter' and other notable projects. With a career spanning decades, he has made significant contributions to the entertainment industry."
            }
        ],
        "genres": [  
            {
                "genreName": "Drama",
                "genreDescription": "Drama is a genre of fiction characterized by discourses or works intended to evoke intense emotions, often focusing on the profound and serious aspects of human experience, compelling audiences through compelling narratives and emotional resonance."
            },
        ]
    },
];



// GET requests
app.get('/', (req, res) => {
    res.send('Welcome to my top 10 movies!');
});

// CREATE - allow users to register
app.post('/users', (req, res) => {
    const newUser = req.body;

    if (!newUser || !newUser.name) {
        res.status(400).json({ error: 'Bad Request', message: 'Please provide a valid username.' });
        return;
    }

    newUser.id = uuid.v4();
    users.push(newUser);

    res.status(201).json(newUser);
});


//UPDATE - Allow users to update their user info (username)
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const updatedUser = req.body;

    let user = users.find(user => user.id == id);

    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send('user not found :(');
    }
});

//CREATE - Allow users to add a movie to their list of favorites 
app.post('/users/:id/:movietitle', (req, res) => {
    const { id, movietitle } = req.params;

    if (!movietitle) {
        res.status(400).send('movie not found :(');
        return;
    }

    let user = users.find(user => user.id == id);

    if (user) {
        user.favoriteMovies.push(movietitle);
        res.status(200).json(`${movietitle} has been added to user ${id}'s favorite list`);
    } else {
        res.status(400).send('user not found :(')
    }
});

//DELETE - Allow users to remove a movie from their list of favorites
app.delete('/users/:id/:movietitle', (req, res) => {
    const { id, movietitle } = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        user.favoriteMovies = user.favoriteMovies.filter(title => title !== movietitle);
        res.status(200).json(`${movietitle} has been removed from user ${id}'s favorite list`);
    } else {
        res.status(400).send('no such user')
    }
});

//DELETE - Allow existing users to delete their account (de-register)
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        users = users.filter(user => user.id != id);
        res.status(200).json(`user ${id} has been deleted`);
    } else {
        res.status(400).send('user not found :(')
    }
});

app.get('/movies', (req, res) => {
    res.json(movies);
    //READ - return a list of all movies 
    app.get('/movies', (req, res) => {
        res.status(200).json(movies);
    });

});
//READ - return data about a single movie by name
app.get('/movies/:title', (req, res) => {
    const requestedTitle = req.params.title;
    const movie = movies.find(movie => movie.title.toLowerCase() === requestedTitle.toLowerCase());

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(404).send('Movie not found :(');
    }
});

// READ - return data about a genre by name
app.get('/movies/genre/:genreName', (req, res) => {
    const { genreName } = req.params;
    const movie = movies.find(movie =>
        movie.genres.some(genre => genre.genreName.toLowerCase() === genreName.toLowerCase())
    );

    if (movie) {
        const genre = movie.genres.find(genre => genre.genreName.toLowerCase() === genreName.toLowerCase());
        const genreInfo = {
            genreName: genre.genreName,
            genreDescription: genre.genreDescription,
        };
        res.status(200).json(genreInfo);
    } else {
        res.status(404).send('Genre not found :(');
    }
});
//READ - return data about a director by name 
app.get('/movies/directors/:directorName', (req, res) => {
    const { directorName } = req.params;
    const director = movies.find(movie => movie.director[0].Name === directorName);

    if (director) {
        res.status(200).json(director.director[0]);
    } else {
        res.status(404).send('Director not found :(');
    }
});

// Create error-handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});
// listen for requests
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});  