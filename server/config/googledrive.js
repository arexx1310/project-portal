import { google } from "googleapis";

// ---------------------------------------------------------------------------
// Auth — OAuth2 with refresh token
// Credentials are read lazily (not at import time) so dotenv has time to load.
// ---------------------------------------------------------------------------

let _authClient = null;

const getAuth = () => {
  if (!_authClient) {
    _authClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    _authClient.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
  }
  return _authClient;
};

// ---------------------------------------------------------------------------
// Lazy drive client
// googleapis auto-refreshes the access token using the refresh token,
// so caching the client instance forever is safe.
// ---------------------------------------------------------------------------

let _driveClient = null;

const drive = () => {
  if (!_driveClient) {
    _driveClient = google.drive({ version: "v3", auth: getAuth() });
  }
  return _driveClient;
};

// ---------------------------------------------------------------------------
// In-memory folder cache
// Key: "<name>|<parentId>" → Drive folder ID
// Avoids redundant API calls on every upload.
// ---------------------------------------------------------------------------

const folderCache = new Map();

export const getOrCreateFolder = async (name, parentId) => {
  const cacheKey = `${name}|${parentId}`;
  if (folderCache.has(cacheKey)) return folderCache.get(cacheKey);

  const res = await drive().files.list({
    q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (res.data.files.length > 0) {
    const id = res.data.files[0].id;
    folderCache.set(cacheKey, id);
    return id;
  }

  const created = await drive().files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });

  const id = created.data.id;
  folderCache.set(cacheKey, id);
  return id;
};

// ---------------------------------------------------------------------------
// Resolve full folder path:
// B.Tech 2025-2026 → Computer Science → Group-A → documents
// ---------------------------------------------------------------------------

export const resolveUploadFolder = async ({
  programType,
  sessionName,
  departmentName,
  groupName,
  category,
}) => {
  const root = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!root) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not set.");

  const programLabel     = programType === "PG" ? "M.Tech" : "B.Tech";
  const sessionFolder    = await getOrCreateFolder(`${programLabel} ${sessionName}`, root);
  const departmentFolder = await getOrCreateFolder(departmentName, sessionFolder);
  const groupFolder      = await getOrCreateFolder(groupName, departmentFolder);
  const categoryFolder   = await getOrCreateFolder(category, groupFolder);

  return categoryFolder;
};

// ---------------------------------------------------------------------------
// Upload a PDF buffer to Drive
// ---------------------------------------------------------------------------

export const uploadFileToDrive = async ({ buffer, originalName, folderId }) => {
  const { Readable } = await import("stream");

  const res = await drive().files.create({
    requestBody: {
      name: originalName,
      parents: [folderId],
    },
    media: {
      mimeType: "application/pdf",
      body: Readable.from(buffer),
    },
    fields: "id, webViewLink",
  });

  const fileId = res.data.id;

  await drive().permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });


  return {
    fileId:      fileId,
    webViewLink: res.data.webViewLink,
  };
};

// ---------------------------------------------------------------------------
// Delete a file from Drive
// ---------------------------------------------------------------------------

export const deleteFileFromDrive = async (fileId) => {
  await drive().files.delete({ fileId });
};

// ---------------------------------------------------------------------------
// Get a ~1 hour temporary view URL
// The access token is auto-refreshed by the OAuth2 client when expired.
// ---------------------------------------------------------------------------

export const getTemporaryViewUrl = async (fileId) => {
  const { token } = await getAuth().getAccessToken();
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${token}`;
};