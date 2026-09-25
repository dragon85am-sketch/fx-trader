import crypto from "crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function generateBase32Secret(bytes = 20) {
  const input = crypto.randomBytes(bytes); let bits = ""; let out = "";
  for (const b of input) bits += b.toString(2).padStart(8,"0");
  for (let i=0;i<bits.length;i+=5) out += ALPHABET[parseInt(bits.slice(i,i+5).padEnd(5,"0"),2)];
  return out;
}
function decodeBase32(s:string){let bits="";for(const c of s.replace(/=|\s/g,"").toUpperCase()){const i=ALPHABET.indexOf(c);if(i<0)continue;bits+=i.toString(2).padStart(5,"0")}const a=[];for(let i=0;i+8<=bits.length;i+=8)a.push(parseInt(bits.slice(i,i+8),2));return Buffer.from(a)}
function hotp(secret:string,counter:number){const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(counter));const h=crypto.createHmac("sha1",decodeBase32(secret)).update(b).digest();const o=h[h.length-1]&15;return ((h.readUInt32BE(o)&0x7fffffff)%1_000_000).toString().padStart(6,"0")}
export function verifyTotp(secret:string, token:string){if(!/^\d{6}$/.test(token))return false;const c=Math.floor(Date.now()/30000);return [-1,0,1].some(d=>hotp(secret,c+d)===token)}
export function otpauthUri(email:string,secret:string){return `otpauth://totp/${encodeURIComponent(`FX TRADE:${email}`)}?secret=${secret}&issuer=${encodeURIComponent("FX TRADE")}&algorithm=SHA1&digits=6&period=30`}
function key(){const raw=process.env.TWO_FACTOR_ENCRYPTION_KEY||process.env.JWT_SECRET;if(!raw)throw new Error("Brak JWT_SECRET/TWO_FACTOR_ENCRYPTION_KEY");return crypto.createHash("sha256").update(raw).digest()}
export function encryptSecret(value:string){const iv=crypto.randomBytes(12);const c=crypto.createCipheriv("aes-256-gcm",key(),iv);const enc=Buffer.concat([c.update(value,"utf8"),c.final()]);return [iv.toString("base64url"),c.getAuthTag().toString("base64url"),enc.toString("base64url")].join(".")}
export function decryptSecret(value:string){const [a,b,c]=value.split(".");const d=crypto.createDecipheriv("aes-256-gcm",key(),Buffer.from(a,"base64url"));d.setAuthTag(Buffer.from(b,"base64url"));return Buffer.concat([d.update(Buffer.from(c,"base64url")),d.final()]).toString("utf8")}
