import mongoose from "mongoose";
import Group from "../../models/Group.js";
import Project from "../../models/Project.js";
import Student from "../../models/Student.js";

/**
 * @desc    Get BTP group of the student
 * @route   GET /api/student/group
 * @access  Private (attachStudentProfile middleware required)
 */
export const getMyBTPGroup = async (req, res, next) => {
  try {
    
    if(!req.student || !req.student.id) {
            return res.status(403).json({
              success: false,
              message: "Unauthorized: Student profile not attached",
          });
    }
    const student = await Student.findById(req.student.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found."
      });
    }
    
     if (!student.groupId) {
      return res.status(200).json({
        success: true,
        group: null,
        project: null,
        message: "You are not assigned to any group.",
      });
    }

    const group = await Group.findById(student.groupId)
      .select("name departmentConfigs session supervisors")
      .populate( {path: "session", select: "name -_id"})
      .populate({
         path: "departmentConfigs", 
         select: "department -_id"
       })
      .populate({
        path: "supervisors",
        select: "phoneNumber user",
        populate: {
          path: "user",
          select: "name email -_id"
        }
      })
      .lean();

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found."
      });
    }

    // Fetch members
    const [membersRecords, projects] = await Promise.all([
      Student.find({ groupId: group._id })
        .select("rollNumber phoneNumber specialization user")
        .populate("user", "name email -_id")
        .lean(),

      Project.find({ group: group._id })
        .select("title description domain semester status")
        .lean(),
    ]);

    const members = membersRecords.map(m => ({
      name: m.user?.name || null,
      email: m.user?.email || null,
      rollNumber: m.rollNumber,
      specialization: m.specialization,
      phoneNumber: m.phoneNumber
    }));

    const supervisors = group.supervisors.map(s => ({
      name: s.user?.name || null,
      email: s.user?.email || null,
      phoneNumber: s.phoneNumber
    }));

    const departments = group.departmentConfigs.map(
      (d) => d.department
    );

    return res.status(200).json({
      success: true,
      group: {
        _id: group._id,
        name: group.name,
        departments,
        session: group.session?.name || null,
        members,
        supervisors,
      },
      project: projects || [], 
    });

  } catch (error) {
    next(error);
  }
};