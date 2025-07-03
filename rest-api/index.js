// Purpose: Backend for the WNW app.
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const download = require('image-downloader');
const multer = require('multer');
const fs = require('fs');


// Express app
const app = express();

// Models for the database
const User = require('./models/User');
const Place = require('./models/Place.js')
const Booking = require('./models/Booking.js')

// Load environment variables
require('dotenv').config();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'jscbshcshssdsuegfezefbekwr3zzz23'

// Middleware for parsing json and cookies
app.use(express.json());
app.use(cookieParser());

// Allow all uploads to be displayed in the frontend side
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(cors({
    credentials: true,
    origin: 'https://wnw-app.onrender.com',
    allowOrigin: true,
}));

// Connect to the database
mongoose.connect(process.env.MONGO_URL);


// Register endpoint
app.post('/register', async (req, res) => {

    const {name, email, password} = req.body;

    try {
        const user = await User.create({
            name,
            email,
            // yarn add bcryptjs
            password: bcrypt.hashSync(password, bcryptSalt),
        });
        res.json(user);
        
    } catch (error) {
        console.log(error);
    }
});


// Login endpoint
app.post('/login', async (req, res) => {
    const {email, password} = req.body;
   const user = await User.findOne({email})
   try {
    if(user) {
        const passOK = bcrypt.compareSync(password, user.password);
        if(passOK) {
            const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign({
        email:userDoc.email,
        id:userDoc._id
      }, jwtSecret, {}, (err,token) => {
        if (err) throw err;
        res.cookie('token', token).json(userDoc);
      });
    } else {
      res.status(422).json('pass not ok');
    }
  } else {
    res.json('not found');
  }
}
   } catch(error){
       res.json("Login failed")
   }
})


// Profile endpoint
app.get('/profile', (req, res) => {
    const {token} = req.cookies; 
  console.log("Token from cookies:", token);
    if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const {name,email,_id} = await User.findById(userData.id);
      res.json({name,email,_id});
    });
  } else {
    res.json(null);
  }
})


// Logout endpoint
app.post('/logout', (req, res) => {
    res.cookie('token', '', {sameSite: 'none', secure: true}).json('Logged out succesful')
})


// Users endpoint
app.get('/users', async (req, res) => {
    res.json(await User.find());
})


// Upload-by-a-link endpoint
app.post('/upload-by-link', async (req, res) => {
    // yarn add image-downloader
    const {link} = req.body;
    const newName = 'photo_' + Date.now() + '.jpg';
    await download.image({
        url: link,
        dest: __dirname + '/uploads/' + newName
    });
    res.json({newName});
})

// Multer middleware for uploading photos
const photosMiddleware = multer({dest: 'uploads'});


// Upload endpoint
app.post('/upload', photosMiddleware.array('photos', 100), (req, res) => {
    const uploadedPhotos = []
    for (let i = 0; i < req.files.length; i++) {
        const {path, originalname} = req.files[i];
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = (path + '.' + ext);
        fs.renameSync(path, newPath);       
        uploadedPhotos.push({
            newName: newPath.replace('uploads\\', '')
        }); 
    }

    res.json(uploadedPhotos);
});


// Places endpoint
app.post('/places', async (req, res) => {
    const {token} = req.cookies;
    const {title, address, addedPhotos, 
        extraInfo, description, perks, 
        checkin, checkout, guests, price} = req.body;
    try {
        jwt.verify(token, jwtSecret, {}, async (err, result) => {
            if(err) throw err; 
            const placeDoc = await Place.create({
                owner: result.id,
                title,
                address,
                description,
                extraInfo,
                photos: addedPhotos,
                checkIn: checkin,
                checkOut: checkout,
                perks,
                maxGuests: guests,
                price
            });
            res.json(placeDoc);
        });
    } catch (error) {
        console.log(error);
    }

});


// User places endpoint
app.get('/user-places', async(req, res) => {
    const {token} = req.cookies;
    try {
        if(token){
            jwt.verify(token, jwtSecret, {}, async (err, result) => {
                if(err) throw err;
                const {id} = result;
                res.json( await Place.find({owner: id}));
            });
        }
    } catch (error) {
        console.log(error);
    }
});


// Places endpoint
app.get('/places', async(req, res) => {
    res.json( await Place.find());
})


// Place by id endpoint
app.get('/places/:id', async(req, res) => {
    const {id} = req.params;
    res.json( await Place.findById(id));
})


// Delete place by id endpoint
app.put('/places/', async(req, res) => {
    const {token} = req.cookies;
    const {id, title, address, addedPhotos, 
        extraInfo, description, perks, 
        checkin, checkout, guests, price} = req.body;
   try {
    jwt.verify(token, jwtSecret, {}, async (err, result) => {
        const placeDoc = await Place.findById(id);
        if(err) throw err;
        if(result.id === placeDoc.owner.toString() ){
            placeDoc.set({
                    title,
                    address,
                    description,
                    extraInfo,
                    photos: addedPhotos,
                    checkIn: checkin,
                    checkOut: checkout,
                    perks,
                    maxGuests: guests,
                    price
                })
            await placeDoc.save();
            res.json(placeDoc);
        }
    });
   } catch (error) {
        console.log(error);
   }

})


// Booked plaxes endpoint
app.post('/bookings', async (req, res) => {
    const {token} = req.cookies;
    const {
        place, numberOfGuests, checkIn, checkOut, name, phone, mail, price
    } = req.body;

   try {
    jwt.verify(token, jwtSecret, {}, async (err, result) => {
        if(err) throw err; 
        const newBooking = await Booking.create({
            place,
            userId: result.id,
            numberOfGuests,
            name,
            checkIn, checkOut, phone, mail, price
        });
        res.json(newBooking);
    });
   } catch (error) {
    console.log(error);
   }

})

// Compare by date function
function compareByDate(a, b) {
    const dateA = Date.parse(a.checkOut);
    const dateB = Date.parse(b.checkOut)
    return dateB - dateA;
  }


// User bookings endpoint
app.get('/user-bookings', async(req, res) => {
    const {token} = req.cookies;
    console.log(token);
    try {
        jwt.verify(token, jwtSecret, {}, async (err, result) => {
            if(err) throw err;
            const {id} = result;
            let bookingList = await Booking.find({userId: id}).populate('place')
            bookingList.sort(compareByDate)
            res.json(bookingList);
        });
    } catch (error) {
        console.log(error);
    }
});

// Port for listening on api request
app.listen(4000)
