import Student from "../../models/Student.js";
import User from "../../models/User.js";

/**
 * @desc    Get profile data of the logged-in student
 * @route   GET /api/student/profile
 * @access  Authorized Student
 */
export const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const studentId = req.student.id;
        const [userData, studentProfile] = await Promise.all([
            User.findById(userId).select("name email"),
            Student.findById(studentId)
                .select("-user")
                .populate("departmentConfig", "department -_id")
                .populate("session", "name")
                .populate("groupId", "name")
        ]);
        
        res.status(200).json({
            success: true,
            data: { 
                    name: userData.name,
                    email: userData.email,
                    phoneNumber: studentProfile.phoneNumber,
                    rollNumber: studentProfile.rollNumber,
                    department: studentProfile.departmentConfig.department,
                    specialization: studentProfile.specialization,
                    semester: studentProfile.semester,
                    session: studentProfile.session.name,
                    admissionYear: studentProfile.admissionYear,
                    group: studentProfile.groupId?.name || "",
            },
            message: "User data fetched successfully."
        });

    } catch (error) {
        next(error);
    }
};