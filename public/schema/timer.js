const mongoose = require('mongoose');

const TimerSchema = new mongoose.Schema({
  section: { type: String, required: true },
  startedBy: { type: String, required: true },
  isActive: { type: Boolean, required: true },
  period:{type:String,require:true},
  room:{type:String,require:true},
  createdAt: { type: Date, default: Date.now } // This will automatically set the timestamp when a document is created
});

// Create a TTL index that will expire documents 5 minutes after 'createdAt'
TimerSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

module.exports = mongoose.model('timers', TimerSchema);
