const mongoose = require('mongoose');

// Sub-schema for students' data
const StudentSchema = new mongoose.Schema({
  roll: { type: String, required: true },
  name:{type : String,required:true},
  distance: { type: Number, required: true }
});

// Main attendance schema
const AttendanceSchema = new mongoose.Schema({
  section: { type: String, required: true },
  period: { type: String, required: true },
  studentsList: { type: [StudentSchema], required: true } // Array of students
});

module.exports = mongoose.model('attendances', AttendanceSchema);
