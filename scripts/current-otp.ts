import { generateTotp } from "./auth-crypto";

const secret = process.env.BROKER_DEMO_TOTP_SECRET ?? "JBSWY3DPEHPK3PXP";
console.log(generateTotp(secret));
