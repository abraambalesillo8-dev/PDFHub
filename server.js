const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDFs are allowed'));
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

app.post('/upload', upload.single('pdf'), (req, res) => {
  res.json({ ok: true, file: req.file.filename });
});

app.get('/files', (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(files.sort().reverse());
  });
});

app.get('/files/:name', (req, res) => {
  const name = req.params.name;
  const filePath = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  res.download(filePath);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`PDFHub server listening on http://localhost:${port}`));
