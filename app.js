const express = require('express');
const session = require('express-session');
const path = require('path')
const app = express();
const routes = require('./routes/index.js')
const port = 3000;

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
    session({
        secret: 'secret-key',
        resave: false,
        saveUninitialized: true, 
        cookie: { maxAge: 1800000 } 
    })
);

app.use(express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {
    res.locals.currentUrl = req.path;
    next();
});

app.use('/', routes)

app.listen(port, () => {
    console.log( `server running at http://localhost:${port} `);
    
})