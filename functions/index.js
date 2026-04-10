const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const busboy = require('busboy');
const cors = require('cors')({ origin: true });
const stream = require('stream');

admin.initializeApp();

// Hardcoded explicit folder mappings given in the spec
const FOLDER_MAP = {
  'PRE-PRODUCTION': '1hTEDfi-Pa_8MmW7aXqAzFHU7n2Q-ysSf',
  'PRODUCTION': '14u-vmJm1koq2el6l9BaNF5ocE3DlMHk3',
  'POST-PRODUCTION': '1r05SAKg-5IWO_EhG6XecgkAabM34wx-B',
  'Reports': '12W7zvv7ZfKdUsUBjSCwmDr7vzBBJPHpp'
};

exports.uploadToDrive = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      // Authenticate with Google Drive
      // The user wants to use client ID and Secret retrieved from GitHub Secrets.
      // In Firebase Node 20, environment variables can be bound via process.env.
      // E.g., GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN stringified.
      // Alternatively, reading from Google Auth Service Account is native if bound to the default credentials.
      
      let driveAuth;
      
      // If service account JSON string is injected (DRIVE_UPLOADER secret)
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        driveAuth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive.file']
        });
      } 
      // If OAuth Client ID and Secret are passed directly
      else if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          'https://developers.google.com/oauthplayground' // Dummy redirect
        );
        // An active refresh token is explicitly required to generate an access token headlessly
        oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });
        driveAuth = oauth2Client;
      } else {
        return res.status(500).json({ error: "Missing Google Authorization Environment Variables securely injected from GitHub Secrets."});
      }

      const drive = google.drive({ version: 'v3', auth: driveAuth });

      const bb = busboy({ headers: req.headers });
      let uploadPromises = [];
      let metadata = {};

      bb.on('field', (name, val) => {
        metadata[name] = val;
      });

      bb.on('file', (name, fileStream, info) => {
        const { filename, mimeType } = info;
        
        // Wait for fields to finish parsing first for folder mapping
        const uploadPromise = new Promise((resolve, reject) => {
          // Collect buffer
          const chunks = [];
          fileStream.on('data', d => chunks.push(d));
          fileStream.on('end', async () => {
            const buffer = Buffer.concat(chunks);
            const bufferStream = new stream.PassThrough();
            bufferStream.end(buffer);

            // Determine parent folder ID
            const motherFolder = metadata['motherFolder'] || 'PRE-PRODUCTION';
            const projectFolder = metadata['projectFolder'];
            let parentId = FOLDER_MAP[motherFolder];

            try {
              // Handle Nested Project Folder finding/creation
              if (projectFolder && parentId) {
                const query = `name = '${projectFolder.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
                const searchRes = await drive.files.list({
                  q: query,
                  fields: 'files(id, name)',
                  spaces: 'drive'
                });

                if (searchRes.data.files && searchRes.data.files.length > 0) {
                  parentId = searchRes.data.files[0].id;
                } else {
                  const folderRes = await drive.files.create({
                    requestBody: {
                      name: projectFolder,
                      mimeType: 'application/vnd.google-apps.folder',
                      parents: [parentId]
                    },
                    fields: 'id'
                  });
                  parentId = folderRes.data.id;
                }
              }

              const driveRes = await drive.files.create({
                requestBody: {
                  name: filename,
                  parents: parentId ? [parentId] : []
                },
                media: {
                  mimeType: mimeType,
                  body: bufferStream
                },
                fields: 'id, webViewLink, webContentLink'
              });
              
              // Set permissions so anyone with the link can view it in the iframe
              await drive.permissions.create({
                fileId: driveRes.data.id,
                requestBody: {
                  role: 'reader',
                  type: 'anyone',
                }
              });
              
              resolve(driveRes.data);
            } catch(e) {
              console.error(e);
              reject(e);
            }
          });
        });

        uploadPromises.push(uploadPromise);
      });

      bb.on('finish', async () => {
        try {
          const results = await Promise.all(uploadPromises);
          res.status(200).json({ success: true, files: results });
        } catch(err) {
          let customDetails = err.message;
          if (err.message && err.message.includes('Insufficient permissions for the specified parent')) {
             customDetails = "The Service Account does not have Editor access to the parent folder. Please go to Google Drive, right-click the folders (PRE-PRODUCTION, PRODUCTION, etc), click Share, and grant 'Editor' access to your Google Service Account email!";
          }
          res.status(500).json({ error: "Drive API Error", details: customDetails, rawError: err.message });
        }
      });

      bb.end(req.rawBody);

    } catch(err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error', msg: err.message });
    }
  });
});
