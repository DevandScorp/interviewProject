const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const config = require('./databaseConfig');
// Create a connection
const con = mysql.createConnection(config);

con.connect((err) => {
  if (err) {
    console.log(err);
    console.log('Error while connecting to Db');
    return;
  }
  console.log('Connection established');
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

app.listen(process.env.PORT || config.expressPort, () => {
  console.log('Connected correctly to the server');
});
