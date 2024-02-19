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

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

const accessLogStream = fs.createWriteStream(path.join('log.txt'), { flags: 'a' });
app.use(morgan('common'));

/**
 * @description Welcome message for the root URL
 * @method GET
 * @url /
 * @returns {string} Welcome message
 */
app.get('/', (req, res) => {
    res.send('Welcome to MyFlix API');
});

/**
 * @description Retrieve a list of all movies
 * @method GET
 * @url /movies
 * @returns {Array<Movie>} Array of movie objects
 * @example
 * fetch('/movies')
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error fetching movies', error));
 */
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

/**
 * @description Retrieve data about a single movie by title
 * @method GET
 * @url /movies/:title
 * @param {string} :title - The title of the movie
 * @returns {Movie} Movie object
 * @example
 * fetch('/movies/The%20Dark%20Knight')
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error fetching movie', error));
 */
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movie = await Movies.findOne({ Title: req.params.title });

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

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

/**
 * @description Retrieve data about a genre by name
 * @method GET
 * @url /genres/:name
 * @param {string} :name - The name of the genre
 * @returns {Genre} Genre object
 * @example
 * fetch('/genres/Action')
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error fetching genre', error));
 */
app.get('/genres/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const genreName = req.params.name;

    try {
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

/**
 * @description Retrieve data about a director by name
 * @method GET
 * @url /directors/:name
 * @param {string} :name - The name of the director
 * @returns {Director} Director object
 * @example
 * fetch('/directors/Christopher%20Nolan')
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error fetching director', error));
 */
app.get('/directors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const directorName = req.params.name;

    try {
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

/**
 * @description Register a new user
 * @method POST
 * @url /users
 * @param {string} Username - The username of the new user
 * @param {string} Password - The password of the new user
 * @param {string} Email - The email of the new user
 * @param {Date} Birthday - The birthday of the new user
 * @returns {User} The newly created user object
 * @example
 * fetch('/users', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({
 *     Username: 'newuser',
 *     Password: 'password123',
 *     Email: 'newuser@example.com',
 *     Birthday: '1990-01-01'
 *   })
 * })
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error registering user', error));
 */
app.post('/users', [
    check('Username', 'Username is required').notEmpty(),
    check('Password', 'Password is required').notEmpty(),
    check('Password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    check('Email', 'Invalid email').isEmail(),
    check('Birthday', 'Birthday is required').notEmpty(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const hashedPassword = hashPassword(req.body.Password);

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

/**
 * @description Retrieve user profile data
 * @method GET
 * @url /users/:Username
 * @param {string} :Username - The username of the user
 * @returns {User} User object
 * @example
 * fetch('/users/newuser')
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error fetching user profile', error));
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await Users.findOne({ Username: req.params.Username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { _id, Username, Email, Birthday, FavoriteMovies, Password, __v } = user;

        res.status(200).json({
            _id: _id.toString(),
            Username,
            Password,
            Email,
            Birthday,
            FavoriteMovies,
            __v,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

/**
 * @description Update user profile data
 * @method PUT
 * @url /users/:Username
 * @param {string} :Username - The username of the user
 * @param {string} Username - The new username
 * @param {string} Password - The new password
 * @param {string} Email - The new email
 * @param {Date} Birthday - The new birthday
 * @returns {User} Updated user object
 * @example
 * fetch('/users/newuser', {
 *   method: 'PUT',
 *   headers: {
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({
 *     Username: 'updateduser',
 *     Password: 'newpassword123',
 *     Email: 'updateduser@example.com',
 *     Birthday: '1990-01-01'
 *   })
 * })
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error updating user profile', error));
 */
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), [
    check('Username', 'Username is required').notEmpty(),
    check('Password', 'Password is required').notEmpty(),
    check('Password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    check('Email', 'Invalid email').isEmail(),
    check('Birthday', 'Birthday is required').notEmpty(),
], async (req, res) => {
    if (req.user.Username !== req.params.Username) {
        return res.status(400).send('Permission denied');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const hashedPassword = hashPassword(req.body.Password);

        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $set: {
                    Username: req.body.Username,
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday,
                },
            },
            { new: true }
        );

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

/**
 * @description Add a movie to a user's list of favorites
 * @method POST
 * @url /users/:username/favorites/:movieId
 * @param {string} :username - The username of the user
 * @param {string} :movieId - The ID of the movie
 * @returns {User} Updated user object
 * @example
 * fetch('/users/newuser/favorites/123456789012345678901234', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json'
 *   }
 * })
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error adding movie to favorites', error));
 */
app.post('/users/:username/favorites/:movieId', passport.authenticate('jwt', { session: false }), [
    check('username', 'Invalid username').notEmpty(),
    check('movieId', 'Invalid movieId').isMongoId(),
], async (req, res) => {
    const username = req.params.username;
    const movieId = req.params.movieId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await Users.findOne({ Username: username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const movie = await Movies.findById(movieId);

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        if (user.FavoriteMovies.includes(movieId)) {
            return res.status(400).json({ error: 'Movie already in favorites' });
        }

        user.FavoriteMovies.push(movieId);
        await user.save();

        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

/**
 * @description Remove a movie from a user's list of favorites
 * @method DELETE
 * @url /users/:username/favorites/:movieId
 * @param {string} :username - The username of the user
 * @param {string} :movieId - The ID of the movie
 * @returns {User} Updated user object
 * @example
 * fetch('/users/newuser/favorites/123456789012345678901234', {
 *   method: 'DELETE'
 * })
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error removing movie from favorites', error));
 */
app.delete('/users/:username/favorites/:movieId', passport.authenticate('jwt', { session: false }), [
    check('username', 'Invalid username').notEmpty(),
    check('movieId', 'Invalid movieId').isMongoId(),
], async (req, res) => {
    const username = req.params.username;
    const movieId = req.params.movieId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await Users.findOne({ Username: username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const movieIndex = user.FavoriteMovies.indexOf(movieId);

        if (movieIndex === -1) {
            return res.status(404).json({ error: 'Movie not found in favorites' });
        }

        user.FavoriteMovies.splice(movieIndex, 1);
        await user.save();

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

/**
 * @description Deregister a user
 * @method DELETE
 * @url /users/:username
 * @param {string} :username - The username of the user
 * @returns {string} Success message
 * @example
 * fetch('/users/newuser', {
 *   method: 'DELETE'
 * })
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error deregistering user', error));
 */
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), [
    check('username', 'Invalid username').notEmpty(),
], async (req, res) => {
    const username = req.params.username;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const existingUser = await Users.findOne({ Username: username });

        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        await Users.deleteOne({ Username: username });

        res.status(200).json({ message: 'User deregistered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

/**
 * @description Error handling middleware
 * @param {Error} err - The error object
 * @param {express.Request} req - The request object
 * @param {express.Response} res - The response object
 * @param {Function} next - The next middleware function
 */
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});
