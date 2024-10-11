const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message, err.stack);
    process.exit(1);
});
dotenv.config({ path: './env/config.env' });
const app = express();
const AppError = require('./util/AppError');

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
