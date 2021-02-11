const express = require('express');
const bodyParser = require('body-parser');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const cors = require('cors');

// // NEW: MySQL database driver
const mysql = require('mysql2/promise');

const app = express();

// We import and immediately load the `.env` file
require('dotenv').config();

const port = process.env.PORT;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// // The `use` functions are the middleware - they get called before an endpoint is hit
app.use(async function mysqlConnection(req, res, next) {
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    // Traditional mode ensures not null is respected for unsupplied fields, ensures valid JavaScript dates, etc.
    await req.db.query('SET SESSION sql_mode = "TRADITIONAL"');
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();

    req.db.release();
  } catch (err) {
    // If anything downstream throw an error, we must release the connection allocated for the request
    console.log(err)
    if (req.db) req.db.release();
    throw err;
  }
});

app.use(cors());

app.use(bodyParser.json());

app.get('/user', async function(req, res) {
  console.log('asdfasdF')
  try {
    const user = {
      name: 'Connor',
      email: 'connorsteele62@gmail.com',
      age: 24
    }

    res.json(user);
  } catch(err) {
    console.log('Error in /user', err)
  }
});


// Public endpoints - the user doesn't need to be authenticated in order to reach them
app.post('/register', async function (req, res) {
  try {
    let user;

    // Hashes the password and inserts the info into the `user` table
    bcrypt.hash(req.body.password, 10).then(async hash => {
      try {
        [user] = await req.db.query(`
          INSERT INTO user (email, fname, lname, password)
          VALUES (:email, :fname, :lname, :password);
        `, {
          email: req.body.email,
          fname: req.body.fname,
          lname: req.body.lname,
          password: hash
        });
      } catch (error) {
        console.log('error', error)
      }
    });

    const encodedUser = jwt.sign(req.body, process.env.JWT_KEY);

    res.json(encodedUser);
  } catch (err) {
    console.log('err', err)
  }
});

app.post('/auth', async function (req, res) {
  try {
    const [[user]] = await req.db.query(`
      SELECT * FROM user WHERE email = :email
    `, {  
      email: req.body.email
    });

    if (!user) {
      res.json('Email/password not found');
    }

    console.log('user', user)

    const userPassword = `${user.password}`

    console.log('userPassword', userPassword);

    const compare = await bcrypt.compare(req.body.password, userPassword);

    console.log('compare', compare);

    if (compare) {
      const payload = {
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        role: 4
      }
      
      const encodedUser = jwt.sign(payload, process.env.JWT_KEY);

      res.json(encodedUser)
    } else {
      res.json('Email/password not found');
    }
  } catch (err) {
    console.log('Error in /auth', err)
  }
})


 // Jwt verification checks to see if there is an authorization header with a valid jwt in it.
app.use(async function verifyJwt(req, res, next) {
  console.log('req', req)
  if (!req.headers.authorization) {
    throw(401, 'Invalid authorization');
  }

  const [scheme, token] = req.headers.authorization.split(' ');

  console.log('[scheme, token]', scheme, ' ', token);

  if (scheme !== 'Bearer') {
    throw(401, 'Invalid authorization');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY);

    console.log('payload', payload)

    req.user = payload;
  } catch (err) {
    if (err.message && (err.message.toUpperCase() === 'INVALID TOKEN' || err.message.toUpperCase() === 'JWT EXPIRED')) {

      req.status = err.status || 500;
      req.body = err.message;
      req.app.emit('jwt-error', err, req);
    } else {

      throw((err.status || 500), err.message);
    }
    console.log(err)
  }

  await next();
});

// // These are the private endpoints, they require jwt authentication. When a request is made it goes to one of these functions after it goes through the middleware.
// // Then a response is set an returned (like `res.json(cars)`)
app.get('/:id', async function (req, res) {
  // const [cars] = await req.db.query(`
  //   SELECT c.id, c.model, m.name AS make_name
  //   FROM car c
  //   LEFT JOIN car_make m
  //   ON c.make_id = m.id
  // `);

  // const [cars] = await req.db.query(`SELECT * FROM car WHERE id = 10`);

  const [[cars]] = await req.db.query(
    `SELECT model FROM car WHERE id = :id`,
    {
      id: req.params.id
    }
  );

  res.json(cars);
});

app.post('/', async function (req, res) {
  try {
    const cars = await req.db.query(
      `INSERT INTO car (
        make_id, 
        model,
        date_created
        ) VALUES (
          :make_id,
          :model,
          NOW()
        )`,
      {
        make_id: req.body.make_id,
        model: req.body.model
      }
    );
    
    res.json(cars)
  } catch (err) {
    console.log('post /', err)
  }
});

app.put('/:id', async function (req, res) {
  // example request body:
  // {
  //   "model": "Accord"
  // }
  const [cars] = await req.db.query(`
    UPDATE car SET model = :model WHERE id = :id
  `, {
    model: req.body.model,
    id: req.params.id
  });

  res.json(cars);
})

app.delete('/:id', async function (req, res) {
  const [cars] = await req.db.query(`
    DELETE FROM car WHERE id = :id
  `, {
    id: req.params.id
  });

  res.json(cars);
})

app.listen(port, () => console.log(`Demo app listening at http://localhost:${port}`));
