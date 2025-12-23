const express = require("express");
const bodyParser = require("body-parser");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const app = express();
app.use(bodyParser.json());

// ===== CONFIG =====
const SHEET_ID = "1VemwPdy3OmSKld_XelA2ETH4V9MEMU5Wc6PnywvHqwE";
const SHEET_NAME = "Sheet1";

// Render will auto provide PORT
const PORT = process.env.PORT || 3000;

// ===== VERIFY ENDPOINT =====
app.post("/verify", async (req, res) => {
  try {
    const empCode = String(req.body.emp_code || "").trim();
    const dobInput = String(req.body.dob || "").trim();

    if (!empCode || !dobInput) {
      return res.status(400).json({ status: "failed", reason: "missing_input" });
    }

    // Load sheet
    const doc = new GoogleSpreadsheet(SHEET_ID);

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[SHEET_NAME];

    if (!sheet) {
      return res.status(500).json({ status: "error", reason: "sheet_not_found" });
    }

    const rows = await sheet.getRows();

    for (let row of rows) {
      const sheetEmp = String(row.Emp_Code).trim();
      const sheetDob = String(row.DOB).trim();

      if (sheetEmp === empCode && sheetDob === dobInput) {
        return res.status(200).json({
          status: "success",
          emp_code: sheetEmp,
          name: row.Name || "",
        });
      }
    }

    // No match
    return res.status(401).json({ status: "failed" });

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ status: "error" });
  }
});

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
  res.send("SBIOA(K) Verification Service Running");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
