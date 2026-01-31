import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a habit name'],
    trim: true,
    maxlength: [100, 'Habit name cannot be more than 100 characters']
  },
  icon: {
    type: String,
    default: '✨',
    maxlength: [10, 'Icon cannot be more than 10 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['Health', 'Fitness', 'Learning', 'Productivity', 'Mindfulness', 'Creativity', 'Social', 'Finance', 'Other'],
    default: 'Health'
  },
  color: {
    type: String,
    enum: ['purple', 'blue', 'green', 'orange', 'pink', 'cyan'],
    default: 'purple'
  },
  target: {
    type: Number,
    default: 1,
    min: [1, 'Target must be at least 1']
  },
  streak: {
    type: Number,
    default: 0,
    min: 0
  },
  completedDates: [{
    type: String, // Store as 'YYYY-MM-DD' format
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: 'Date must be in YYYY-MM-DD format'
    }
  }],
  isTrashed: {
    type: Boolean,
    default: false,
    index: true
  },
  trashedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for user queries
habitSchema.index({ user: 1, isTrashed: 1 });
habitSchema.index({ user: 1, createdAt: -1 });

// Virtual for total check-ins
habitSchema.virtual('totalCheckIns').get(function() {
  return this.completedDates.length;
});

// Method to toggle completion for a date
habitSchema.methods.toggleDate = function(dateString) {
  const index = this.completedDates.indexOf(dateString);
  
  if (index > -1) {
    // Remove date (undo)
    this.completedDates.splice(index, 1);
  } else {
    // Add date (complete)
    this.completedDates.push(dateString);
  }
  
  return this;
};

// Method to move to trash
habitSchema.methods.moveToTrash = function() {
  this.isTrashed = true;
  this.trashedAt = new Date();
  return this;
};

// Method to restore from trash
habitSchema.methods.restore = function() {
  this.isTrashed = false;
  this.trashedAt = null;
  // Clear completion history when restoring
  this.completedDates = [];
  this.streak = 0;
  return this;
};

// Clean up JSON response
habitSchema.methods.toJSON = function() {
  const habit = this.toObject({ virtuals: true });
  delete habit.__v;
  habit.id = habit._id;
  delete habit._id;
  return habit;
};

const Habit = mongoose.model('Habit', habitSchema);

export default Habit;
