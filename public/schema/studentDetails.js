const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
  roll: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  location: {
    longitude: {
      type: Number,
      required: true
    },
    latitude: {
      type: Number,
      required: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});
const Student = mongoose.model('studentDetails', studentSchema);
module.exports = Student;
