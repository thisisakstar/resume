const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
var compression = require('compression');
const path = require('path');

const AppError = require('./util/AppError');

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message, err.stack);
    process.exit(1);
});

// gzip compression

const app = express();

dotenv.config({ path: './env/config.env' });
app.use(compression());

// ============================================================
// import controllers
const globalErrorController = require('./controllers/errorControllers');
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('dev'));
app.use('/images', express.static('img'));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true);

// ============================================================
// import router
const userRouter = require('./routes/userRoutes');
const resumeRouter = require('./routes/resumeRoutes');
const viewRouter = require('./routes/viewRoutes');
const apiRouter = require('./routes/apiRouter.js');

// ============================================================
// routes
app.use('/api/v1/user', userRouter);
app.use('/api/v1/resume', resumeRouter);
app.use('/api', apiRouter);
app.use('*', viewRouter);

mongoose
    .connect(process.env.DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('connection was successfull');
    });

app.all('*', (req, res, next) => {
    next(new AppError(`undefined url ${req.originalUrl}`, 404));
});
app.use(globalErrorController);
const server = app.listen(process.env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Port listen in ${process.env.PORT}`);
});
process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('Unhandled Rejection... Server is Shutting Down');
    server.close(() => {
        process.exit(1);
    });
});
