require("dotenv").config();
var { deriveWallets } = require("./wallet");
var { signupWithReferral } = require("./browser");

async function test() {
  var mnemonic = process.env.MNEMONIC;
  var referralCode = process.env.REFERRAL_CODE;
  var captchaKey = process.env.CAPTCHA_API_KEY;

  if (!mnemonic) { console.error("No MNEMONIC in .env"); process.exit(1); }
  if (!captchaKey) { console.error("No CAPTCHA_API_KEY in .env"); process.exit(1); }

  var wallets = deriveWallets(mnemonic, 1);
  var walletInfo = wallets[0];
  console.log("Testing wallet 0:", walletInfo.address);
  console.log("Referral:", referralCode);
  console.log("Captcha key:", captchaKey.slice(0, 8) + "...");

  var result = await signupWithReferral(walletInfo, referralCode, captchaKey, 3000);
  console.log("\nResult:", JSON.stringify(result, null, 2));
}

test().catch(function(e) { console.error("Fatal:", e.message, e.stack); process.exit(1); });
