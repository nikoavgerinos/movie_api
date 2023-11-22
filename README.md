# myFlix - Server-Side Component

Welcome to myFlix! This is the server-side component of a web application that provides users with access to information about movies, directors, and genres. Users can sign up, update their personal information, and create a list of their favorite movies.

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Technical Stack](#technical-stack)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Introduction
This project demonstrates full-stack JavaScript development, including APIs, web server frameworks, databases, business logic, authentication, data security, and more.

## Features
### Essential Features
- Return a list of ALL movies
- Return data about a single movie by title
- Return data about a genre by name
- Return data about a director by name
- Allow new users to register
- Allow users to update their user info
- Allow users to add/remove a movie from their list of favorites
- Allow existing users to deregister

### Optional Features
- Allow users to see which actors star in which movies
- Allow users to view information about different actors
- Allow users to view more information about different movies

## Technical Stack
- **Node.js**: JavaScript runtime for server-side development
- **Express**: Web server framework
- **MongoDB**: NoSQL database for storing movie data
- **Mongoose**: MongoDB object modeling for business logic
- **JWT**: Token-based authentication
- **Postman**: API testing
- **Heroku**: Deployment

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up the MongoDB database
4. Configure environment variables
5. Run the server: `npm start`

## API Endpoints
- `GET /movies`: Return a list of all movies
- `GET /movies/:title`: Return data about a single movie by title
- ... (List other endpoints)

## Testing
Test the API using Postman. Ensure all endpoints return the expected data.

## Deployment
Deploy the API to Heroku to make it publicly accessible.

## Contributing
If you'd like to contribute, please fork the repository and create a pull request.

## License
This project is licensed under the [MIT License](LICENSE).

