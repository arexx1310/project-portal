import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({

  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  staffId: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true ,
    trim: true,
  },
  phoneNumber: { 
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
  },
  
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },

  roles: { 
    type: [String], 
    enum: ["HOD", "PROJECT_COMMITTEE_HEAD", "PROJECT_COMMITTEE_MEMBER"], 
    default: [] 
  },
}, { timestamps: true });

// Department-wise faculty
facultySchema.index({ department: 1 });

// Role-based queries
facultySchema.index({ roles: 1 });

// Department + Role
facultySchema.index({ department: 1, roles: 1 });

export default mongoose.model('Faculty', facultySchema);