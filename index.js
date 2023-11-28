const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie; // Use the correct property name 'Movie'
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/cfDB', { useNewUrlParser: true, useUnifiedTopology: true });



const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const accessLogStream = fs.createWriteStream(path.join('log.txt'), { flags: 'a' });

app.use(morgan('common'));

// Return a list of ALL movies to the user 
app.get('/movies', async (req, res) => {
    try {
        const allMovies = await Movies.find(); // Retrieve all movies from the 'Movies' collection

        // Create a new array with the desired order of fields
        const formattedMovies = allMovies.map(movie => ({
            _id: movie._id,
            Title: movie.Title,
            Description: movie.Description,
            Genre: movie.Genre,
            Director: movie.Director,
            ImagePath: movie.ImagePath,
            Featured: movie.Featured
        }));

        res.status(200).json(formattedMovies);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});
// Return data about a single movie by title to the user
app.get('/movies/:title', async (req, res) => {
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
app.get('/genres/:name', async (req, res) => {
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
app.get('/directors/:name', async (req, res) => {
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

// User registration 
app.post('/users', async (req, res) => {
    try {
        const newUser = await Users.create(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

// Update user endpoint
app.put('/users/:username', async (req, res) => {
    const username = req.params.username;

    try {
        const updatedUser = await Users.findOneAndUpdate(
            { Username: username },
            { $set: req.body },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

// Add a movie to a user's list of favorites
app.post('/users/:username/favorites/:movieId', async (req, res) => {
    const username = req.params.username;
    const movieId = req.params.movieId;

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

        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

// Remove a movie from the user's list of favorites
app.delete('/users/:username/favorites/:movieId', async (req, res) => {
    const username = req.params.username;
    const movieId = req.params.movieId;

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
app.delete('/users/:username', async (req, res) => {
    const username = req.params.username;

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
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
