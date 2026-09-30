require("dotenv").config();
process.env.VERBOSE = "1";

const fs = require("fs");
const path = require("path");
const { deriveWallets } = require("./wallet");
const { signupWithReferral, sleep } = require("./browser");
const { fullLoginFlow, setUsername } = require("./api");

const USERNAME_FILE = path.join(__dirname, "username.txt");

function popUsername() {
  try {
    if (!fs.existsSync(USERNAME_FILE)) return null;
    const content = fs.readFileSync(USERNAME_FILE, "utf8");
    const lines = content.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) return null;
    const name = lines.shift();
    fs.writeFileSync(USERNAME_FILE, lines.join("\n"));
    return name.trim();
  } catch (e) {
    return null;
  }
}

async function main() {
  const { MNEMONIC, REFERRAL_CODE, CAPTCHA_API_KEY } = process.env;

  if (!MNEMONIC) { console.error("No MNEMONIC in .env"); process.exit(1); }
  if (!CAPTCHA_API_KEY) { console.error("No CAPTCHA_API_KEY in .env"); process.exit(1); }

  const referralCode = REFERRAL_CODE || "REF886AC1C25E";
  const index = parseInt(process.argv[2] || "0", 10);
  const wallets = deriveWallets(MNEMONIC, index + 1);
  const walletInfo = wallets[index];

  console.log("\n===== TEST: Wallet [" + index + "] =====");
  console.log("Address:", walletInfo.address);
  console.log("Referral:", referralCode);
  console.log("============================\n");

  try {
    console.log("[STEP 1] Running signupWithReferral...");
    const result = await signupWithReferral(walletInfo, referralCode, CAPTCHA_API_KEY, 3000);
    console.log("\n[STEP 1 RESULT]", JSON.stringify(result, null, 2));

    if (result.success && result.privyToken) {
      console.log("\n[STEP 2] Running fullLoginFlow...");
      const loginResult = await fullLoginFlow(result.privyToken, referralCode);
      console.log("\n[STEP 2 RESULT]", JSON.stringify(loginResult, null, 2));

      if (loginResult.success && loginResult.accessToken) {
        const name = popUsername();
        if (name) {
          console.log("\n[STEP 3] Setting username: " + name);
          const ur = await setUsername(loginResult.accessToken, name);
          console.log("\n[STEP 3 RESULT]", JSON.stringify(ur, null, 2));
        } else {
          console.log("\n[STEP 3] Nama habis di username.txt, skip.");
        }
      }
    }
  } catch (err) {
    console.error("\n[ERROR]", err.message);
    console.error(err.stack);
  }

  process.exit(0);
}

main();
