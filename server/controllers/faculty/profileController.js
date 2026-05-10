import Department from "../../models/DepartmentConfig.js";
import Faculty from "../../models/Faculty.js";
import User from "../../models/User.js";

/**
 * @desc    Get profile data of the logged-in faculty
 * @route   GET /api/faculty/profile
 * @access  Authorized Faculty
 */
export const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        const facultyId = req.faculty.id;

        const [userData, facultyProfile] = await Promise.all([
            User.findById(userId).select("-password"),
            Faculty.findById(facultyId)
                .select("-user")
                .populate("department", "department"),
        ]);

        res.status(200).json({
            success: true,
            data: { 
                name: userData.name,
                email: userData.email,
                phoneNumber: facultyProfile.phoneNumber ?? null,
                staffId: facultyProfile.staffId ?? null,
                roles: facultyProfile.roles || [],
                department: facultyProfile.department?.department ?? null,
            }
        });

    } catch (error) {

        next(error);
        
    }
};