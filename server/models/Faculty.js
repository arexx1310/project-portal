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
    uppercase: true 
  },
  phoneNumber: { 
    type: String, 
    required: true 
  },
  
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },

  roles: { 
    type: [String], 
    enum: ["HOD", "BTP_COMMITTEE_HEAD", "BTP_COMMITTEE_MEMBER"], 
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