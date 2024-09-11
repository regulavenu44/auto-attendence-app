const express = require('express');
const path = require('path');
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const details = require(path.join(__dirname, 'public', 'schema', 'studentDetails.js'));
const User = require(path.join(__dirname, 'public', 'schema', 'users.js'));
const timer = require(path.join(__dirname, 'public', 'schema', 'timer.js'));
const attendance = require(path.join(__dirname, 'public', 'schema', 'attendance.js'));

const mongoose = require('mongoose');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/teacher/home', (req, res) => {
  res.render('teacherHome');
});
app.get('/', (req, res) => {
  res.render('teacherHome');
});
app.get('/student/home', (req, res) => {
  res.render('studentHome');
});
const JWT_SECRET_KEY = 'your_jwt_secret';

const authenticateToken = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Assumes Bearer token

  if (token == null) return res.sendStatus(401); // If no token, respond with Unauthorized

  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) {
      console.log(err.message);
      return res.sendStatus(403); // If token invalid, respond with Forbidden
    }
    req.user = user; // Attach user information to request object
    next(); // Proceed to the next middleware or route handler
  });
};
const mongoURI = 'mongodb+srv://regulavenu985:Venu7997@booksApp.2k7tw.mongodb.net/autoAttend?retryWrites=true&w=majority';
mongoose.connect(mongoURI).then(() => {
  console.log('mongo is connceted....');
}).catch((err) => {
  console.log('failed to connect to mongo ' + err);
});
app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    //   const isMatch = await bcrypt.compare(password, user.password);
    const isMatch = (password === user.password && role === user.role);

    if (!isMatch) return res.status(402).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
app.get('/verify-token', authenticateToken, (req, res) => {
  // If the token is valid, send back user details
  res.json({ user: req.user });
});


app.get('/details/:email', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, 'your_jwt_secret', async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }

    try {
      const userdetails = await details.findOne({ email: req.params.email });

      if (!userdetails) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user: userdetails });
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
});

app.post('/timer', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, 'your_jwt_secret', async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }

    try {
      console.log(req.body);
      const newTimer = new timer(req.body);

      // Save the instance to the database
      const timerDetails = await newTimer.save();

      if (!timerDetails) {
        return res.status(400).json({ status: false, message: 'Failed to update the timer' });
      }

      res.status(200).json({ status: true, message: 'Timer successfully updated' });
    } catch (error) {
      console.error('Error inserting timer details:', error);
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
  });
});


app.get('/timer/:section', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, 'your_jwt_secret', async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }

    try {
      const timerDetails = await timer.findOne({ section: req.params.section, isActive: true });

      if (!timerDetails) {
        return res.status(404).json({ message: 'Timer not found' });
      }

      res.json({ timer: timerDetails });
    } catch (error) {
      console.error('Error fetching timer details:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
});

app.post('/attendance', async (req, res) => {
  try {
    const { section, period, roll, name, distance } = req.body;

    if (!section || !period || !roll || !name || distance == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if an attendance record for the specified section and period already exists
    let attendanceRecord = await attendance.findOne({ section, period });

    if (attendanceRecord) {
      
      const existingStudentIndex = attendanceRecord.studentsList.findIndex(student => student.roll === roll);

      if (existingStudentIndex !== -1) {
        // If the student already exists, update their distance
        attendanceRecord.studentsList[existingStudentIndex].distance = distance;
      } else {
        // Otherwise, add the new student to the list
        attendanceRecord.studentsList.push({ roll, name, distance });
      }

      // Save the updated attendance record
      await attendanceRecord.save();
    } else {
      // Create a new attendance record if it doesn't exist
      const newAttendanceRecord = new attendance({
        section,
        period,
        studentsList: [{ roll, name, distance }]
      });

      await newAttendanceRecord.save();
    }

    res.status(201).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.get('/attendance', async (req, res) => {
  try {
    const { section, period } = req.query;

    if (!section || !period) {
      return res.status(400).json({ message: 'Section and period are required' });
    }

    // Fetch the attendance record based on section and period
    const attendanceRecord = await attendance.findOne({ section, period });

    if (attendanceRecord) {
      res.json({data:attendanceRecord});
    } else {
      res.status(404).json({ message: 'Attendance record not found' });
    }
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




app.listen(3000, () => {
  console.log('server is running....');
});