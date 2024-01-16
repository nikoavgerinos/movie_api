const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const Models = require('./models.js');
const hashPassword = Models.User.hashPassword;



const Movies = Models.Movie; // Use the correct property name 'Movie'
const Users = Models.User;

//mongoose.connect('mongodb://localhost:27017/cfDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });



const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const cors = require('cors');
let allowedOrigins = ['http://localhost:8080', 'http://localhost:1234', 'https://nikolaos-myflix.netlify.app'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn’t found on the list of allowed origins
            let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

const accessLogStream = fs.createWriteStream(path.join('log.txt'), { flags: 'a' });

app.use(morgan('common'));


// Handle requests to the root URL
app.get('/', (req, res) => {
    res.send('Welcome to MyFlix API');
});


// Return a list of ALL movies to the user (requires authentication)
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

// Return data about a single movie by title to the user
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movie = await Movies.findOne({ Title: req.params.title });

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // Extract specific fields you want to return to the user
        const { Title, Description, Genre, Director, ImageURL, Featured } = movie;

        res.status(200).json({
            Title,
            Description,
            Genre,
            Director,
            ImageURL,
            Featured,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

// Return data about a genre (description) by name/title
app.get('/genres/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const genreName = req.params.name;

    try {
        // Find the first movie with the specified genre name
        const movieWithGenre = await Movies.findOne({ 'Genre.Name': genreName });

        if (movieWithGenre) {
            const genreDescription = movieWithGenre.Genre.Description;
            res.status(200).json({ Name: genreName, Description: genreDescription });
        } else {
            res.status(404).send('Genre not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

// Return data about a director (bio, birth year, death year) by name
app.get('/directors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const directorName = req.params.name;

    try {
        // Find the first movie with the specified director name
        const movieWithDirector = await Movies.findOne({ 'Director.Name': directorName });

        if (movieWithDirector) {
            const directorInfo = {
                Name: directorName,
                Bio: movieWithDirector.Director.Bio,
                Birth: movieWithDirector.Director.Birth,
                Death: movieWithDirector.Director.Death,
            };
            res.status(200).json(directorInfo);
        } else {
            res.status(404).send('Director not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});


// User registration (no authentication needed here)
app.post('/users', [
    check('Username', 'Username is required').notEmpty(),
    check('Password', 'Password is required').notEmpty(),
    check('Password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    check('Email', 'Invalid email').isEmail(),
    check('Birthday', 'Birthday is required').notEmpty(),
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Hash the password before storing it
        const hashedPassword = hashPassword(req.body.Password);

        // Create a new user with the hashed password
        const newUser = await Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});


// Get user profile endpoint
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await Users.findOne({ Username: req.params.Username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Include additional fields in the response
        const { _id, Username, Email, Birthday, FavoriteMovies, Password, __v /* other fields */ } = user;

        res.status(200).json({
            _id: _id.toString(), // Convert ObjectId to string
            Username,
            Password,
            Email,
            Birthday,
            FavoriteMovies,
            __v,
            // Include other fields here as needed
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});



// Update user endpoint
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), [
    check('Username', 'Username is required').notEmpty(),
    check('Password', 'Password is required').notEmpty(),
    check('Password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    check('Email', 'Invalid email').isEmail(),
    check('Birthday', 'Birthday is required').notEmpty(),
], async (req, res) => {
    // CONDITION TO CHECK ADDED HERE
    if (req.user.Username !== req.params.Username) {
        return res.status(400).send('Permission denied');
    }
    // CONDITION ENDS

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Hash the password before storing it
        const hashedPassword = hashPassword(req.body.Password);

        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $set: {
                    Username: req.body.Username,
                    Password: hashedPassword, // Store the hashed password in the database
                    Email: req.body.Email,
                    Birthday: req.body.Birthday,
                },
            },
            { new: true } // No need to exclude Password and __v, as they will be included in the response
        );

        res.json(updatedUser);
    } catch (err) {
        console.log(err);
        res.status(500).send('Error: ' + err);
    }
});
// Add a movie to a user's list of favorites
app.post('/users/:username/favorites/:movieId', passport.authenticate('jwt', { session: false }), [
    check('username', 'Invalid username').notEmpty(),
    check('movieId', 'Invalid movieId').isMongoId(), // Assuming MongoDB ObjectId for movieId
], async (req, res) => {
    const username = req.params.username;
    const movieId = req.params.movieId;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Check if the user exists
        const user = await Users.findOne({ Username: username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the movie exists
        const movie = await Movies.findById(movieId);

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // Check if the movie is already in the user's favorites
        if (user.FavoriteMovies.includes(movieId)) {
            return res.status(400).json({ error: 'Movie already in favorites' });
        }

        // Add the movie to the user's favorites
        user.FavoriteMovies.push(movieId);
        await user.save();

        // Include Password and __v in the response
        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

/// Remove a movie from the user's list of favorites
app.delete('/users/:username/favorites/:movieId', passport.authenticate('jwt', { session: false }), [
    check('username', 'Invalid username').notEmpty(),
    check('movieId', 'Invalid movieId').isMongoId(), // Assuming MongoDB ObjectId for movieId
], async (req, res) => {
    const username = req.params.username;
    const movieId = req.params.movieId;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Find the user by username
        const user = await Users.findOne({ Username: username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the movieId is in the user's favorites
        const movieIndex = user.FavoriteMovies.indexOf(movieId);

        if (movieIndex === -1) {
            return res.status(404).json({ error: 'Movie not found in favorites' });
        }

        // Remove movie from users favorites (using MovieID)
        user.FavoriteMovies.splice(movieIndex, 1);

        // Save the updated user
        await user.save();

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});


// Deregister user 
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), [
    check('username', 'Invalid username').notEmpty(),
], async (req, res) => {
    const username = req.params.username;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Check if the user exists
        const existingUser = await Users.findOne({ Username: username });

        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove the user from the database
        await Users.deleteOne({ Username: username });

        res.status(200).json({ message: 'User deregistered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});


// Create error-handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// listen for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
}); 