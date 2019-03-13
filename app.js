const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const PDFDocument = require('pdfkit');
const mysql = require('mysql');
const path = require('path');
const config = require('./databaseConfig');

// Create a connection
const con = mysql.createConnection(config);

con.connect((err) => {
  if (err) {
    console.log('Error while connecting to Db');
    return;
  }
  con.query(
    `CREATE TABLE IF NOT EXISTS users (
        id int NOT NULL AUTO_INCREMENT UNIQUE,
        firstName varchar(255) NOT NULL UNIQUE,
        lastName varchar(255) NOT NULL,
        image LONGBLOB NOT NULL,
        pdf LONGBLOB,
        PRIMARY KEY (id)
    );`,
    (err, result) => {
      if (err) console.log(err);
    },
  );
  console.log('Connection established');
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(fileUpload());
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('views'));
app.get('/', (req, res) => {
  res.sendFile('index.html');
});
app.get('/register', (req, res) => {
  res.redirect('/create.html');
});
app.post('/register', (req, res) => {
  const User = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    image: req.files.image.data,
  };
  con.query('INSERT INTO users SET ?', User, (err) => {
    if (err) {
      console.log(err);
      return res.json({ status: 'Registration proccess error' });
    }
    return res.json({ status: 'Successfully registered' });
  });
});

app.post('/pdf', (req, res) => {
  con.query(`SELECT * from users where firstName='${req.body.firstName}';`, (err,
    result) => {
    if (err) return res.json({ status: 'Select query error', err });
    const doc = new PDFDocument();
    if (!result.length) {
      return res.json({ status: 'No appropriate user' });
    }
    doc.image(result[0].image, {
      fit: [250, 300],
      align: 'center',
      valign: 'center',
    });
    const pdfBufferArray = [];
    doc.fontSize(25)
      .text(`${result[0].firstName} ${result[0].lastName}`, 100, 100);
    doc.on('data', data => pdfBufferArray.push(data));
    doc.end();
    doc.on('end', () => {
      const resultBuffer = Buffer.concat(pdfBufferArray);
      con.query(`UPDATE users set ? WHERE firstName='${result[0].firstName}';`,
        {
          pdf: resultBuffer,
        }, (queryError) => {
          if (queryError) {
            return res.json({ success: false });
          }
        });
    });
    return res.json({ success: true });
  });
});
app.listen(process.env.PORT || config.expressPort, () => {
  console.log('Connected correctly to the server');
});
