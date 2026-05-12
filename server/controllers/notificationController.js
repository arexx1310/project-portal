import Notification from "../models/Notifications.js";
import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
import Group from "../models/Group.js";
import User from "../models/User.js";



/**
 * Send to a single user.
 *
 * @param {ObjectId} recipientUserId
 * @param {"student"|"faculty"|"admin"} role
 * @param {ObjectId} fromUserId
 * @param {string}   message
 */
export const notifyUser = async (
  recipientUserId,
  role,
  fromUserId,
  message,
  dbSession = null
) => {
  try {
    await Notification.create(
      [{ recipient: recipientUserId, recipientRole: role, triggeredBy: fromUserId, message }],
      { session: dbSession }
    );
  } catch (err) {
    console.error("[notifyUser]", err.message);
  }
};


/**
 * Send to the group
 * @param {ObjectId} groupId
 * @param {ObjectId} fromUserId
 * @param {string}   message
 * @param {ClientSession} [dbSession]
 */
export const notifyGroup = async (
  groupId,
  fromUserId,
  message,
  dbSession = null
) => {
  try {
    const students = await Student.find({ groupId })
      .select("user")
      .session(dbSession)
      .lean();

    // Fetch the group first, then manually resolve faculty users
    const group = await Group.findById(groupId)
      .select("supervisors")
      .session(dbSession)
      .lean();

    // Manually fetch faculty records to respect the session (populate ignores it)
    const facultyUsers =
      group?.supervisors?.length
        ? await Faculty.find({ _id: { $in: group.supervisors } })
            .select("user")
            .session(dbSession)
            .lean()
        : [];

    const docs = [
      ...students.map((s) => ({
        recipient: s.user,
        recipientRole: "student",
      })),
      ...facultyUsers
        .filter((f) => f.user)
        .map((f) => ({
          recipient: f.user,
          recipientRole: "faculty",
        })),
    ];

    if (!docs.length) return;

    await Notification.insertMany(
      docs.map((d) => ({
        ...d,
        triggeredBy: fromUserId,
        message,
      })),
      { ordered: false, session: dbSession }
    );
  } catch (err) {
    console.error("[notifyGroup]", err.message);
  }
};

/**
 * Send to a department.
 *
 * @param {ObjectId} departmentId
 * @param {ObjectId} fromUserId
 * @param {string}   message
 * @param {boolean}  facultyOnly  - true = only faculty, false = everyone
 * @param {Array}    [links]
 */
export const notifyDepartment = async (departmentId, fromUserId, message, facultyOnly = false, links = []) => {
  try {
    const docs = [];

    const facultyList = await Faculty.find({ department: departmentId }).select("user").lean();
    facultyList.forEach((f) => docs.push({ recipient: f.user, recipientRole: "faculty" }));

    if (!facultyOnly) {
      const students = await Student.find({ department: departmentId }).select("user").lean();
      students.forEach((s) => docs.push({ recipient: s.user, recipientRole: "student" }));
    }

    if (!docs.length) return;

    await Notification.insertMany(
      docs.map((d) => ({ ...d, triggeredBy: fromUserId, message, links })),
      { ordered: false }
    );
  } catch (err) {
    console.error("[notifyDepartment]", err.message);
  }
};


/* ══════════════════════════════════════════════════════
   FACULTY CONTROLLER
   POST /notifications/send

   Body:
   {
     message: "string",
     links: [{ label: "string", url: "string" }],  
     scope: "department" | "system",
     audience: "all" | "faculty"   // only matters when scope = "department"
   }
   ══════════════════════════════════════════════════════ */
export const sendNotification = async (req, res, next) => {

  try {
    const { message, links = [], scope, audience = "all" } = req.body;

    if (!message?.trim()){ 
      return res.status(400).json({ success: false, message: "message is required" });
    }

    if (!["department", "system"].includes(scope)) {
      return res.status(400).json({ success: false, message: "scope must be 'department' or 'system'" });
    }

    
    if (!req.faculty || !req.faculty.id || !req.faculty.department) { 
      return res.status(403).json({ success: false, message: "Only faculty can send notifications" });
    }

    
    const docs = [];

    if (scope === "department") {
      const facultyList = await Faculty.find({ department: req.faculty.department }).select("user").lean();
      facultyList.forEach((f) => docs.push({ recipient: f.user, recipientRole: "faculty" }));

      if (audience === "all") {
        const students = await Student.find({ department: req.faculty.department }).select("user").lean();
        students.forEach((s) => docs.push({ recipient: s.user, recipientRole: "student" }));
      }
    } else {
      // system-wide — all faculty + all students
      const [allFaculty, allStudents] = await Promise.all([
        Faculty.find().select("user").lean(),
        Student.find().select("user").lean(),
      ]);
      allFaculty.forEach((f) => docs.push({ recipient: f.user, recipientRole: "faculty" }));
      allStudents.forEach((s) => docs.push({ recipient: s.user, recipientRole: "student" }));
    }

    if (!docs.length)
      return res.status(200).json({ success: true, sent: 0 });

    await Notification.insertMany(
      docs.map((d) => ({ ...d, triggeredBy: req.user.id, message: message.trim(), links })),
      { ordered: false }
    );

    res.status(201).json({ success: true, sent: docs.length });
  } catch (err) {
    next(err);
  }
};


/* ══════════════════════════════════════════════════════
   GET /notifications  (any logged-in user)
   ══════════════════════════════════════════════════════ */
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("triggeredBy", "name email")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
};