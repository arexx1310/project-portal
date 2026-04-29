import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  academicYear: { 
    type: Number, 
    required: true 
  },
  oddSemester: {
    semester: { 
      type: Number, 
      default: 7 
    },
    startDate: { 
      type: Date, 
      required: true 
    },
    endDate: { 
      type: Date, 
      required: true 
    }
  },
  evenSemester: {
    semester: { 
      type: Number, 
      default: 8 
    },
    startDate: { 
      type: Date, 
      required: true 
    },
    endDate: { 
      type: Date, 
      required: true 
    }
  },
  isActive: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Ensure only one session is active at a time
sessionSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

sessionSchema.statics.getActiveSession = async function () {

  const session = await this.findOne({ isActive: true }).lean();

  return session;
};
export default mongoose.model('Session', sessionSchema);