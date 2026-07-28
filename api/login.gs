/**
 * login.gs
 * -----------------------------------------------------------------------
 * Modul Authentication — Tahap 3.
 *
 * Sumber data: Spreadsheet modul 'user' (lihat Config.gs -> SPREADSHEET_IDS_.user),
 * sheet/tab bernama "Data" dengan kolom minimal (header baris pertama):
 *   id | username | password_hash | name | role | status
 *
 * role  : salah satu dari admin | apoteker | kasir | gudang | owner
 * status: "active" atau "inactive" (user nonaktif tidak bisa login)
 *
 * Password TIDAK PERNAH disimpan dalam bentuk plain text — kolom
 * password_hash harus sudah berisi hasil hashPassword_() di bawah ini
 * (Security requirement: Hash Password).
 * -----------------------------------------------------------------------
 */

const LoginModule = {
  /**
   * action=authenticate — dipanggil dari pages/login.html
   * params: { username, password }
   * return: { token, user: { id, username, name, role } }
   */
  authenticate(params) {
    const username = String(params.username || "").trim();
    const password = String(params.password || "");

    if (!username || !password) {
      throw new Error("Username dan password wajib diisi");
    }

    const sheet = getSheet_("user", "Data");
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const col = {
      id: headers.indexOf("id"),
      username: headers.indexOf("username"),
      password_hash: headers.indexOf("password_hash"),
      name: headers.indexOf("name"),
      role: headers.indexOf("role"),
      status: headers.indexOf("status"),
    };

    const hashedInput = hashPassword_(password);

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (String(row[col.username]).toLowerCase() !== username.toLowerCase()) continue;

      if (String(row[col.status]) !== "active") {
        throw new Error("Akun tidak aktif, silakan hubungi Admin");
      }
      if (String(row[col.password_hash]) !== hashedInput) {
        throw new Error("Username atau password salah");
      }

      const user = {
        id: row[col.id],
        username: row[col.username],
        name: row[col.name],
        role: row[col.role],
      };
      return { token: generateToken_(user), user };
    }

    throw new Error("Username atau password salah");
  },

  /**
   * action=verify — opsional, dipakai halaman yang butuh validasi token ke
   * server (bukan hanya localStorage) mulai Tahap 4+, mis. sebelum aksi sensitif.
   * params: { token }
   */
  verify(params) {
    const payload = decodeToken_(String(params.token || ""));
    if (!payload) throw new Error("Sesi tidak valid atau sudah kedaluwarsa, silakan login ulang");
    return payload;
  },
};

MODULE_REGISTRY_.login = LoginModule;

/**
 * Hash password dengan SHA-256. Dipakai baik saat login (mencocokkan input)
 * maupun saat membuat user baru di Tahap 5 (Master Data > User) — pastikan
 * kolom password_hash SELALU diisi lewat fungsi ini, jangan pernah manual.
 */
function hashPassword_(plainText) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plainText, Utilities.Charset.UTF_8);
  return digest
    .map((byte) => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Token sesi sederhana (base64 JSON + waktu kedaluwarsa 12 jam).
 * Ini BUKAN JWT bertanda tangan kriptografis — cukup untuk tahap
 * Google Spreadsheet. Saat migrasi ke MySQL/PostgreSQL dengan backend
 * REST API sungguhan, ganti dengan JWT yang ditandatangani (mis. jsonwebtoken).
 */
function generateToken_(user) {
  const payload = {
    uid: user.id,
    role: user.role,
    exp: Date.now() + 12 * 60 * 60 * 1000,
  };
  return Utilities.base64Encode(JSON.stringify(payload));
}

function decodeToken_(token) {
  try {
    const json = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    const payload = JSON.parse(json);
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * FUNGSI BANTUAN SETUP AWAL — bukan dipanggil dari frontend.
 * Jalankan manual dari Apps Script Editor (pilih fungsi ini di dropdown
 * Run, lalu lihat hasilnya di "Execution log") untuk mendapatkan hash
 * password yang akan ditempel manual ke kolom password_hash saat mengisi
 * data awal user di Spreadsheet 'user'.
 *
 * Ganti "admin123" dengan password awal yang diinginkan sebelum dijalankan.
 */
function generateInitialPasswordHash_() {
  const plainPassword = "admin123";
  Logger.log(hashPassword_(plainPassword));
}
