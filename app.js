const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const {pool} = require('./config/database.js')
const MySQLStore = require('express-mysql-session')(session);
const app = express();
const methodOverride = require('method-override');
const routes = require('./routes/index.js');
require('dotenv').config();

const port = process.env.PORT;

// --- Buat session store dari pool yang sudah ada ---
const sessionStore = new MySQLStore({}, pool);

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')))

app.use(
    session({
        key: 'lovent_cookie',
        secret: process.env.SESSION_SECRET,
        store: sessionStore,
        resave: false,
        saveUninitialized: true, 
        cookie: { maxAge: 1800000 } 
    })
);

app.use(methodOverride('_method'));

app.use((req, res, next) => {
    res.locals.currentUrl = req.path;    
    next();
});

app.use('/', routes)

app.listen(port, () => {
    console.log( `server running at http://localhost:${port} `);
})