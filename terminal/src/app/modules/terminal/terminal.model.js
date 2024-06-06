import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  commands: [String],
  errorCommand: String,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});

export const Request = mongoose.model("Request", requestSchema);
