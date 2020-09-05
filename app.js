const express = require('express')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');
const scrypt = require('scrypt');

// NEW: MySQL database driver
const mysql = require('mysql2/promise');

const app = express();


// We import and immediately load the `.env` file
require('dotenv').config()

const port = process.env.PORT;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.use(async function mysqlConnection(req, res, next) {
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    // Traditional mode ensures not null is respected for unsupplied fields, ensures valid JavaScript dates, etc.
    await req.db.query('SET SESSION sql_mode = "TRADITIONAL"');
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();

    req.db.release();
  } catch (e) {
    // If anything downstream throw an error, we must release the connection allocated for the request
    if (req.db) req.db.release();
    throw e;
  }
});

app.use(bodyParser.json())

app.use(() => {
  
})

app.get('/', async function (req, res) {
  const [cars] = await req.db.query(`
    SELECT c.id, c.model, m.name AS make_name
    FROM car c
    LEFT JOIN car_make m
    ON c.make_id = m.id
  `);

  res.json(cars);
})

app.post('/', async function (req, res) {
  const [cars] = await req.db.query(`INSERT INTO car (make_id, model, date_created) VALUES (:make_id, :model, NOW())`, {
    make_id: req.body.make_id,
    model: req.body.model
  });
  
  res.json(cars)
})

app.post('/auth', async function (req, res) {
  try {
    const [[user]] = await req.db.query(`
      SELECT * FROM user WHERE email = :email
    `, {  
      email: req.body.email
    });

    console.log(user)

    const passwordMatch = await scrypt.verifyKdf(Buffer.from(user.password, 'base64'), req.body.password)
    
    if (passwordMatch) {
      const payload = {
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        password: user.password
      }

      console.log('payload', payload,)
      console.log('KEY', process.env.JWT_KEY);
      
      const encodedUser = jwt.sign(payload, process.env.JWT_KEY);
  
      res.json(encodedUser)
    } else {
      return 'Password/email not found'
    }
  } catch (err) {
    console.log('Error', err)
  }
})

app.post('/register', async function (req, res) {
  try {
    console.log('REQUEST', req.body)

    const password = scrypt.kdfSync(req.body.password, {
      N: 16,
      r: 8,
      p: 2
    });

    const [user] = await req.db.query(`
      INSERT INTO user (email, fname, lname, password)
      VALUES (:email, :fname, :lname, :password);
    `, {
      email: req.body.email,
      fname: req.body.fname,
      lname: req.body.lname,
      password: password
    });

    res.json(user);
  } catch (err) {
    console.log('err', err)
  }
})

app.put('/:id', async function (req, res) {
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

app.listen(port, () => console.log(`Demo app listening at http://localhost:${port}`))
