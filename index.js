const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");

const app = express();
app.use(bodyParser.json());

// ===== CONFIG =====
const SHEET_ID = "1VemwPdy3OmSKld_XelA2ETH4V9MEMU5Wc6PnywvHqwE";
const SHEET_NAME = "Sheet1";

// ==================

async function getSheetData() {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME,
  });

  return res.data.values;
}

app.post("/verify", async (req, res) => {
  try {
    const emp = String(req.body.emp_code || "").trim();
    const dob = String(req.body.dob || "").trim();

    if (!emp || !dob) {
      return res.status(400).json({ status: "failed", reason: "missing_input" });
    }

    const rows = await getSheetData();

    for (let i = 1; i < rows.length; i++) {
      const sheetEmp = String(rows[i][0]).trim();
      const sheetDob = String(rows[i][1]).trim();

      if (sheetEmp === emp && sheetDob === dob) {
        return res.status(200).json({
          status: "success",
          emp_code: sheetEmp,
        });
      }
    }

    return res.status(401).json({ status: "failed" });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
