import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: [true, 'Please provide task text'],
    trim: true,
    maxlength: [500, 'Task text cannot be more than 500 characters']
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  isHabit: {
    type: Boolean,
    default: false
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    default: null
  },
  createdDate: {
    type: String, // Store as 'YYYY-MM-DD' format
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: 'Date must be in YYYY-MM-DD format'
    }
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
taskSchema.index({ user: 1, createdDate: -1 });
taskSchema.index({ user: 1, completed: 1 });
taskSchema.index({ user: 1, habitId: 1 });

// Method to toggle completion
taskSchema.methods.toggle = function() {
  this.completed = !this.completed;
  this.completedAt = this.completed ? new Date() : null;
  return this;
};

// Clean up JSON response
taskSchema.methods.toJSON = function() {
  const task = this.toObject();
  delete task.__v;
  task.id = task._id;
  delete task._id;
  // Add date alias for frontend compatibility
  task.date = task.createdDate;
  return task;
};

const Task = mongoose.model('Task', taskSchema);

export default Task;
