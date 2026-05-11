/**
 * reportController.js
 *
 * Four focused report controllers:
 *
 *  UG (BTP):
 *   generateUGStatusReport   → Sheet 1: Students Not In a Group
 *                              Sheet 2: Groups Not Registered (Draft)
 *                              Sheet 3: Groups With No Supervisors
 *
 *   generateUGProjectReport  → Sheet 1: BTP Projects (sem 7 or 8)
 *                              Sheet 2: Publications per project
 *
 *  PG (MTP):
 *   generatePGStatusReport   → Sheet 1: Students Not Registered (no group)
 *                              Sheet 2: Students With No Supervisors
 *
 *   generatePGProjectReport  → Sheet 1: MTP Projects (sem 1–4)
 *                              Sheet 2: Publications per project
 *
 * Route params : :sessionId
 * Route query  : ?semester=<N>   (required for project controllers)
 */

import ExcelJS     from "exceljs";
import mongoose    from "mongoose";
import Student     from "../../models/Student.js";
import Group       from "../../models/Group.js";
import Project     from "../../models/Project.js";
import Publication from "../../models/Publication.js";

/* ═══════════════════════════════════════════════════════════════
   STYLE CONSTANTS
═══════════════════════════════════════════════════════════════ */

const COLORS = {
  headerBg:   "FF1F3864",  // dark navy
  headerText: "FFFFFFFF",  // white
  altRowBg:   "FFD9E1F2",  // light blue-grey
  warnBg:     "FFFFF2CC",  // soft yellow for empty / no-data rows
};

const BORDER_THIN = { style: "thin", color: { argb: "FFB8B8B8" } };
const ALL_BORDERS = {
  top: BORDER_THIN, left: BORDER_THIN, bottom: BORDER_THIN, right: BORDER_THIN,
};

/* ═══════════════════════════════════════════════════════════════
   SHEET HELPERS
═══════════════════════════════════════════════════════════════ */

/** Set column definitions and style the header row */
function addHeader(sheet, columns) {
  sheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: c.width }));
  const headerRow = sheet.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.font      = { name: "Arial", size: 11, bold: true, color: { argb: COLORS.headerText } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border    = ALL_BORDERS;
  });
}

/** Style a data row — alternating fill + border */
function styleRow(row, rowIndex) {
  row.height = 20;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font      = { name: "Arial", size: 10 };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border    = ALL_BORDERS;
    if (rowIndex % 2 === 0) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.altRowBg } };
    }
  });
}

/** Merged placeholder row when a sheet has no data */
function addEmptyRow(sheet, colCount, message) {
  const row = sheet.addRow(Array(colCount).fill("").map((_, i) => (i === 0 ? message : "")));
  row.getCell(1).font      = { name: "Arial", size: 10, italic: true, color: { argb: "FF888888" } };
  row.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.warnBg } };
  row.getCell(1).alignment = { vertical: "middle" };
  sheet.mergeCells(row.number, 1, row.number, colCount);
}

/** Append a bold summary row then freeze header + autofilter */
function finaliseSheet(sheet, summaryText) {
  if (summaryText) {
    sheet.addRow({});
    const sumRow = sheet.addRow({ sno: summaryText });
    sumRow.getCell(1).font = { name: "Arial", size: 10, bold: true };
  }
  sheet.views      = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
}

/* ═══════════════════════════════════════════════════════════════
   DATA HELPERS
═══════════════════════════════════════════════════════════════ */

/** Index an array of students by their groupId string */
function indexByGroup(students) {
  return students.reduce((acc, s) => {
    const key = s.groupId?.toString();
    if (key) { (acc[key] ??= []).push(s); }
    return acc;
  }, {});
}

/** Format a Date (or null) as Indian locale string */
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

/** Build a human-readable publication detail cell value */
function pubSummary(pub) {
  const lines = [`Status: ${pub.status}`];
  if (pub.title)                        lines.push(`Title: ${pub.title}`); 
  if (pub.conference?.name)             lines.push(`Conference: ${pub.conference.name}`);
  if (pub.conference?.submissionDate)   lines.push(`Submitted: ${fmtDate(pub.conference.submissionDate)}`);
  if (pub.conference?.notificationDate) lines.push(`Notification: ${fmtDate(pub.conference.notificationDate)}`);
  if (pub.conference?.presentationDate) lines.push(`Presented: ${fmtDate(pub.conference.presentationDate)}`);
  if (pub.published?.doi)               lines.push(`DOI: ${pub.published.doi}`);
  if (pub.published?.publishedDate)     lines.push(`Published: ${fmtDate(pub.published.publishedDate)}`);
  if (pub.published?.venue)             lines.push(`Venue: ${pub.published.venue}`);
  if (pub.published?.link)              lines.push(`Link: ${pub.published.link}`);
  return lines.join("\n");
}

/** Stream the finished workbook as an xlsx download */
async function streamWorkbook(wb, res, filename) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

/* ═══════════════════════════════════════════════════════════════
   UG CONTROLLER 1 — STATUS REPORT  (3 sheets, no semester needed)
   GET /reports/ug/:sessionId/status
═══════════════════════════════════════════════════════════════ */

export const generateUGStatusReport = async (req, res) => {
  const { sessionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sessionId))
    return res.status(400).json({ success: false, message: "Invalid sessionId." });

  const sessionOid = new mongoose.Types.ObjectId(sessionId);
  const deptId     = req.faculty.department;

  try {
    /* ── DATA ── */

    // Sheet 1 — UG students with no group
    const ungrouped = await Student.find({
      session: sessionOid, department: deptId, programType: "UG", groupId: null,
    })
      .populate("user", "name email")
      .sort({ rollNumber: 1 })
      .lean();

    // Sheet 2 — Draft (not yet registered) groups
    const draftGroups = await Group.find({
      session: sessionOid, departments: deptId, programType: "UG", status: "Draft",
    })
      .sort({ name: 1 })
      .lean();

    const draftGroupIds  = draftGroups.map((g) => g._id);
    const draftMembers   = await Student.find({ groupId: { $in: draftGroupIds } })
      .populate("user", "name email")
      .sort({ rollNumber: 1 })
      .lean();
    const draftMemberMap = indexByGroup(draftMembers);

    // Sheet 3 — Formed groups with no supervisors
    const noSupGroups = await Group.find({
      session: sessionOid, departments: deptId, programType: "UG", status: { $in: ["Formed", "SupervisorRequested"] },
      $or: [{ supervisors: { $exists: false } }, { supervisors: { $size: 0 } }],
    })
      .sort({ name: 1 })
      .lean();

    const noSupIds      = noSupGroups.map((g) => g._id);
    const noSupMembers  = await Student.find({ groupId: { $in: noSupIds } })
      .populate("user", "name email")
      .sort({ rollNumber: 1 })
      .lean();
    const noSupMemberMap = indexByGroup(noSupMembers);

    /* ── WORKBOOK ── */
    const wb   = new ExcelJS.Workbook();
    wb.creator = "BTP Committee System";
    wb.created = new Date();

    /* ── Sheet 1: Students Not In a Group ── */
    const ws1 = wb.addWorksheet("Students Not In a Group");
    addHeader(ws1, [
      { label: "S.No.",        key: "sno",  width: 7  },
      { label: "Student Name", key: "name", width: 30 },
      { label: "Roll Number",  key: "roll", width: 18 },
    ]);

    if (ungrouped.length === 0) {
      addEmptyRow(ws1, 3, "✓ All UG students have been assigned to a group.");
    } else {
      ungrouped.forEach((s, i) => {
        styleRow(
          ws1.addRow({ sno: i + 1, name: s.user?.name ?? "—", roll: s.rollNumber }),
          i + 2
        );
      });
    }
    finaliseSheet(ws1, `Total: ${ungrouped.length} student(s) not in a group`);

    /* ── Sheet 2: Groups Not Registered (Draft) ── */
    const ws2 = wb.addWorksheet("Groups Not Registered");
    addHeader(ws2, [
      { label: "S.No.",        key: "sno",       width: 7  },
      { label: "Group Name",   key: "groupName", width: 30 },
      { label: "Students",     key: "students",  width: 46 },
      { label: "Group Status", key: "status",    width: 20 },
    ]);

    if (draftGroups.length === 0) {
      addEmptyRow(ws2, 4, "✓ No unregistered groups — all groups are Formed or beyond.");
    } else {
      draftGroups.forEach((g, i) => {
        const members     = draftMemberMap[g._id.toString()] ?? [];
        const studentList = members.length
          ? members.map((m) => `${m.user?.name ?? "—"} (${m.rollNumber})`).join(", ")
          : "No members yet";
        styleRow(
          ws2.addRow({ sno: i + 1, groupName: g.name, students: studentList, status: "Not Registered" }),
          i + 2
        );
      });
    }
    finaliseSheet(ws2, `Total: ${draftGroups.length} unregistered group(s)`);

    /* ── Sheet 3: Groups With NO Supervisors ── */
    const ws3 = wb.addWorksheet("Groups With NO Supervisors");
    addHeader(ws3, [
      { label: "S.No.",                     key: "sno",       width: 7  },
      { label: "Group Name",                key: "groupName", width: 30 },
      { label: "Members (Name & Roll No.)", key: "members",   width: 56 },
    ]);

    if (noSupGroups.length === 0) {
      addEmptyRow(ws3, 3, "✓ All formed groups have at least one supervisor assigned.");
    } else {
      noSupGroups.forEach((g, i) => {
        const members    = noSupMemberMap[g._id.toString()] ?? [];
        const memberList = members.length
          ? members.map((m) => `${m.user?.name ?? "—"} (${m.rollNumber})`).join("\n")
          : "No members";
        styleRow(
          ws3.addRow({ sno: i + 1, groupName: g.name, members: memberList }),
          i + 2
        );
      });
    }
    finaliseSheet(ws3, `Total: ${noSupGroups.length} group(s) without a supervisor`);

    await streamWorkbook(wb, res, `BTP_Status_Report_${sessionId}.xlsx`);
  } catch (err) {
    console.error("[UG Status Report Error]", err);
    res.status(500).json({ success: false, message: "Failed to generate UG status report." });
  }
};

/* ═══════════════════════════════════════════════════════════════
   UG CONTROLLER 2 — PROJECT + PUBLICATION REPORT  (2 sheets)
   GET /reports/ug/:sessionId/projects?semester=7|8
═══════════════════════════════════════════════════════════════ */

export const generateUGProjectReport = async (req, res) => {
  const { sessionId } = req.params;
  const semParam      = req.query.semester ? Number(req.query.semester) : null;

  if (!mongoose.Types.ObjectId.isValid(sessionId))
    return res.status(400).json({ success: false, message: "Invalid sessionId." });
  if (!semParam || ![7, 8].includes(semParam))
    return res.status(400).json({ success: false, message: "UG semester must be 7 or 8." });

  const sessionOid = new mongoose.Types.ObjectId(sessionId);
  const deptId     = req.faculty.department;

  try {
    /* ── DATA ── */

    const projects = await Project.find({ session: sessionOid, semester: semParam })
      .populate({
        path:    "group",
        match:   { departments: deptId, programType: "UG" },
        populate: { path: "supervisors", populate: { path: "user", select: "name" } },
      })
      .sort({ createdAt: 1 })
      .lean();

    const validProjects = projects.filter((p) => p.group !== null);
    const projGroupIds  = validProjects.map((p) => p.group._id);

    const projMembers = await Student.find({ groupId: { $in: projGroupIds } })
      .populate("user", "name email")
      .sort({ rollNumber: 1 })
      .lean();
    const memberMap = indexByGroup(projMembers);

    const publications = await Publication.find({
      session: sessionOid, group: { $in: projGroupIds },
    }).lean();

    const pubMap = publications.reduce((acc, pub) => {
      const key = pub.group.toString();
      (acc[key] ??= []).push(pub);
      return acc;
    }, {});

    /* ── WORKBOOK ── */
    const wb    = new ExcelJS.Workbook();
    wb.creator  = "BTP Committee System";
    wb.created  = new Date();
    const phase = semParam === 7 ? "BTP Phase 1" : "BTP Phase 2";

    /* ── Sheet 1: Projects ── */
    const ws1 = wb.addWorksheet(`${phase} Projects`);
    addHeader(ws1, [
      { label: "S.No.",          key: "sno",         width: 7  },
      { label: "Group Name",     key: "groupName",   width: 28 },
      { label: "Group Status",   key: "groupStatus", width: 20 },
      { label: "Members",        key: "members",     width: 42 },
      { label: "Supervisor(s)",  key: "supervisors", width: 36 },
      { label: "Semester",       key: "semester",    width: 12 },
      { label: "Project Title",  key: "title",       width: 44 },
      { label: "Domain",         key: "domain",      width: 26 },
    ]);

    if (validProjects.length === 0) {
      addEmptyRow(ws1, 8, `No ${phase} projects found for this session.`);
    } else {
      validProjects.forEach((p, i) => {
        const members     = memberMap[p.group._id.toString()] ?? [];
        const supervisors = (p.group.supervisors ?? []).map((sv) => sv.user?.name ?? "Unknown").join("; ");
        const memberList  = members.map((m) => `${m.user?.name ?? "—"} (${m.rollNumber})`).join("\n");
        styleRow(ws1.addRow({
          sno:         i + 1,
          groupName:   p.group.name,
          groupStatus: p.group.status,
          members:     memberList || "—",
          supervisors: supervisors || "Not Assigned",
          semester:    p.semester,
          title:       p.title,
          domain:      p.domain,
        }), i + 2);
      });
    }
    finaliseSheet(ws1, `Total: ${validProjects.length} project(s)`);

    /* ── Sheet 2: Publications ── */
    const ws2 = wb.addWorksheet("Publications");
    addHeader(ws2, [
      { label: "S.No.",               key: "sno",         width: 7 },
      { label: "Group Name",          key: "groupName",   width: 28 },
      { label: "Members",             key: "members",     width: 42 },
      { label: "Supervisor(s)",       key: "supervisors", width: 36 },
      { label: "Project Title",       key: "project",     width: 44},
      { label: "Semester",            key: "semester",    width: 12},
      { label: "Publication Details", key: "pubDetails",  width: 60 },
    ]);

    if (validProjects.length === 0) {
      addEmptyRow(ws2, 7, `No ${phase} projects found for this session.`);
    } else {
      let rowIdx = 1;
      validProjects.forEach((p) => {
        const members     = memberMap[p.group._id.toString()] ?? [];
        const supervisors = (p.group.supervisors ?? []).map((sv) => sv.user?.name ?? "Unknown").join("; ");
        const memberList  = members.map((m) => `${m.user?.name ?? "—"} (${m.rollNumber})`).join("\n");
        const groupPubs   = pubMap[p.group._id.toString()] ?? [];
        const base = {
          groupName:   p.group.name,
          members:     memberList  || "—",
          supervisors: supervisors || "Not Assigned",
          project:     p.title,
          semester:    p.semester,
        };

        if (groupPubs.length === 0) {
          rowIdx++;
          styleRow(ws2.addRow({ sno: rowIdx - 1, ...base, pubDetails: "This project has no publication record." }), rowIdx);
        } else {
          groupPubs.forEach((pub) => {
            rowIdx++;
            styleRow(ws2.addRow({ sno: rowIdx - 1, ...base, pubDetails: pubSummary(pub) }), rowIdx);
          });
        }
      });
    }
    finaliseSheet(ws2, null);

    await streamWorkbook(wb, res, `BTP_Project_Report_${sessionId}_Sem${semParam}.xlsx`);
  } catch (err) {
    console.error("[UG Project Report Error]", err);
    res.status(500).json({ success: false, message: "Failed to generate UG project report." });
  }
};

/* ═══════════════════════════════════════════════════════════════
   PG CONTROLLER 1 — STATUS REPORT  (2 sheets, no semester needed)
   GET /reports/pg/:sessionId/status
═══════════════════════════════════════════════════════════════ */

export const generatePGStatusReport = async (req, res) => {
  const { sessionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sessionId))
    return res.status(400).json({ success: false, message: "Invalid sessionId." });

  const sessionOid = new mongoose.Types.ObjectId(sessionId);
  const deptId     = req.faculty.department;

  try {
    /* ── DATA ── */

    const pgStudents = await Student.find({
      session: sessionOid, department: deptId, programType: "PG",
    })
      .populate("user", "name email")
      .populate({
        path:    "groupId",
        select:  "name supervisors status",
        populate: { path: "supervisors", populate: { path: "user", select: "name" } },
      })
      .sort({ rollNumber: 1 })
      .lean();

    const notRegistered = pgStudents.filter((s) => !s.groupId);
    const noSupervisor  = pgStudents.filter(
      (s) => s.groupId && (s.groupId.supervisors ?? []).length === 0
    );

    /* ── WORKBOOK ── */
    const wb   = new ExcelJS.Workbook();
    wb.creator = "Department System";
    wb.created = new Date();

    /* ── Sheet 1: Students Not Registered ── */
    const ws1 = wb.addWorksheet("Students Not Registered");
    addHeader(ws1, [
      { label: "S.No.",        key: "sno",  width: 7  },
      { label: "Student Name", key: "name", width: 30 },
      { label: "Roll Number",  key: "roll", width: 18 },
    ]);

    if (notRegistered.length === 0) {
      addEmptyRow(ws1, 3, "✓ All PG students have been assigned to a group.");
    } else {
      notRegistered.forEach((s, i) => {
        styleRow(
          ws1.addRow({ sno: i + 1, name: s.user?.name ?? "—", roll: s.rollNumber }),
          i + 2
        );
      });
    }
    finaliseSheet(ws1, `Total: ${notRegistered.length} unregistered student(s)`);

    /* ── Sheet 2: Students With No Supervisors ── */
    const ws2 = wb.addWorksheet("Students With No Supervisors");
    addHeader(ws2, [
      { label: "S.No.",        key: "sno",   width: 7  },
      { label: "Student Name", key: "name",  width: 30 },
      { label: "Roll Number",  key: "roll",  width: 18 },
      { label: "Group",        key: "group", width: 28 },
    ]);

    if (noSupervisor.length === 0) {
      addEmptyRow(ws2, 4, "✓ All PG students have a supervisor assigned.");
    } else {
      noSupervisor.forEach((s, i) => {
        styleRow(ws2.addRow({
          sno:   i + 1,
          name:  s.user?.name    ?? "—",
          roll:  s.rollNumber,
          group: s.groupId?.name ?? "—",
        }), i + 2);
      });
    }
    finaliseSheet(ws2, `Total: ${noSupervisor.length} student(s) without a supervisor`);

    await streamWorkbook(wb, res, `MTP_Status_Report_${sessionId}.xlsx`);
  } catch (err) {
    console.error("[PG Status Report Error]", err);
    res.status(500).json({ success: false, message: "Failed to generate PG status report." });
  }
};

/* ═══════════════════════════════════════════════════════════════
   PG CONTROLLER 2 — PROJECT + PUBLICATION REPORT  (2 sheets)
   GET /reports/pg/:sessionId/projects?semester=1|2|3|4
═══════════════════════════════════════════════════════════════ */

export const generatePGProjectReport = async (req, res) => {
  const { sessionId } = req.params;
  const semParam      = req.query.semester ? Number(req.query.semester) : null;

  if (!mongoose.Types.ObjectId.isValid(sessionId))
    return res.status(400).json({ success: false, message: "Invalid sessionId." });
  if (!semParam || ![1, 2, 3, 4].includes(semParam))
    return res.status(400).json({ success: false, message: "PG semester must be 1, 2, 3, or 4." });

  const sessionOid = new mongoose.Types.ObjectId(sessionId);
  const deptId     = req.faculty.department;

  try {
    /* ── DATA ── */

    const projects = await Project.find({ session: sessionOid, semester: semParam })
      .populate({
        path:    "group",
        match:   { departments: deptId, programType: "PG" },
        populate: { path: "supervisors", populate: { path: "user", select: "name" } },
      })
      .sort({ createdAt: 1 })
      .lean();

    const validProjects = projects.filter((p) => p.group !== null);
    const projGroupIds  = validProjects.map((p) => p.group._id);

    // PG = one student per group
    const projMembers = await Student.find({ groupId: { $in: projGroupIds } })
      .populate("user", "name email")
      .lean();
    const memberMap = indexByGroup(projMembers);

    const publications = await Publication.find({
      session: sessionOid, group: { $in: projGroupIds },
    }).lean();

    const pubMap = publications.reduce((acc, pub) => {
      const key = pub.group.toString();
      (acc[key] ??= []).push(pub);
      return acc;
    }, {});

    /* ── WORKBOOK ── */
    const wb   = new ExcelJS.Workbook();
    wb.creator = "Department System";
    wb.created = new Date();

    /* ── Sheet 1: MTP Projects ── */
    const ws1 = wb.addWorksheet(`MTP Sem ${semParam} Projects`);
    addHeader(ws1, [
      { label: "S.No.",         key: "sno",         width: 7  },
      { label: "Student Name",  key: "studentName", width: 30 },
      { label: "Roll Number",   key: "roll",        width: 18 },
      { label: "Supervisor(s)", key: "supervisors", width: 36 },
      { label: "Semester",      key: "semester",    width: 12 },
      { label: "Project Title", key: "title",       width: 44 },
      { label: "Domain",        key: "domain",      width: 26 },
    ]);

    if (validProjects.length === 0) {
      addEmptyRow(ws1, 7, `No MTP projects found for semester ${semParam} in this session.`);
    } else {
      validProjects.forEach((p, i) => {
        const student     = (memberMap[p.group._id.toString()] ?? [])[0];
        const supervisors = (p.group.supervisors ?? []).map((sv) => sv.user?.name ?? "Unknown").join("; ");
        styleRow(ws1.addRow({
          sno:         i + 1,
          studentName: student?.user?.name ?? "—",
          roll:        student?.rollNumber  ?? "—",
          supervisors: supervisors          || "Not Assigned",
          semester:    p.semester,
          title:       p.title,
          domain:      p.domain,
        }), i + 2);
      });
    }
    finaliseSheet(ws1, `Total: ${validProjects.length} MTP project(s)`);

    /* ── Sheet 2: Publications ── */
    const ws2 = wb.addWorksheet("Publications");
    addHeader(ws2, [
      { label: "S.No.",               key: "sno",         width: 7  },
      { label: "Student Name",        key: "studentName", width: 30 },
      { label: "Roll Number",         key: "roll",        width: 18 },
      { label: "Supervisor(s)",       key: "supervisors", width: 36 },
      { label: "Project Title",       key: "project",     width: 44 },
      { label: "Semester",            key: "semester",    width: 12 },
      { label: "Publication Details", key: "pubDetails",  width: 60 },
    ]);

    if (validProjects.length === 0) {
      addEmptyRow(ws2, 7, `No MTP projects found for semester ${semParam} in this session.`);
    } else {
      let rowIdx = 1;
      validProjects.forEach((p) => {
        const student     = (memberMap[p.group._id.toString()] ?? [])[0];
        const supervisors = (p.group.supervisors ?? []).map((sv) => sv.user?.name ?? "Unknown").join("; ");
        const groupPubs   = pubMap[p.group._id.toString()] ?? [];
        const base = {
          studentName: student?.user?.name ?? "—",
          roll:        student?.rollNumber  ?? "—",
          supervisors: supervisors          || "Not Assigned",
          project:     p.title,
          semester:    p.semester,
        };

        if (groupPubs.length === 0) {
          rowIdx++;
          styleRow(ws2.addRow({ sno: rowIdx - 1, ...base, pubDetails: "This project has no publication record." }), rowIdx);
        } else {
          groupPubs.forEach((pub) => {
            rowIdx++;
            styleRow(ws2.addRow({ sno: rowIdx - 1, ...base, pubDetails: pubSummary(pub) }), rowIdx);
          });
        }
      });
    }
    finaliseSheet(ws2, null);

    await streamWorkbook(wb, res, `MTP_Project_Report_${sessionId}_Sem${semParam}.xlsx`);
  } catch (err) {
    console.error("[PG Project Report Error]", err);
    res.status(500).json({ success: false, message: "Failed to generate PG project report." });
  }
};