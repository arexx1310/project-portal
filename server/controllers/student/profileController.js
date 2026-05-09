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
                .populate("department", "department -_id")
                .populate("session", "name")
        ]);
        
        res.status(200).json({
            success: true,
            data: { 
                    name: userData.name,
                    email: userData.email,
                    phoneNumber: studentProfile.phoneNumber,
                    rollNumber: studentProfile.rollNumber,
                    department: studentProfile.department.department,
                    programType: studentProfile.programType,
                    specialization: studentProfile.specialization || "",
                    semester: studentProfile.semester,
                    session: studentProfile.session.name,
                    admissionYear: studentProfile.admissionYear,
                    groupId: studentProfile.groupId
            },
            message: "User data fetched successfully."
        });

    } catch (error) {
        next(error);
    }
};

