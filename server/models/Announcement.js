const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnnouncementSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdBy: { type: String },
  pinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
