import mongoose from 'mongoose';



// Define the schema for individual results
const resultSchema = new mongoose.Schema({
  chosenImagePath: {
    type: String,
 
  },
  summary: {
    type: String,
  },
});

const ExplainerSchema = new mongoose.Schema({
  videoPath: {
    type: String,
    required: true
  },
  transcriptionPath: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'pending'
  },
  results: [resultSchema],
  videoUrl: {type: String}
});

// Model
const Explainer = mongoose.model('Explainer', ExplainerSchema);

export default Explainer;

