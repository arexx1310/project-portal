import { google } from "googleapis";
import readline from "readline";

const oauth2Client = new google.auth.OAuth2(
  "YOUR_CLIENT_ID",
  "CLIENT_SECRET",
  "urn:ietf:wg:oauth:2.0:oob"  // desktop app callback
);

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive"],
});

console.log("Open this URL in your browser:\n", url);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("\nPaste the code here: ", async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log("\nYour refresh token:\n", tokens.refresh_token);
  rl.close();
});

