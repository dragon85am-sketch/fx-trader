import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { encryptSecret, generateBase32Secret, otpauthUri } from "@/lib/twoFactor";
export async function POST(req:Request){const auth=await requireAuth();if(!auth.ok)return auth.response;const {password}=await req.json();const u=await prisma.user.findUnique({where:{id:auth.user.userId},select:{email:true,password:true,twoFactorEnabled:true}});if(!u?.password||!password||!(await bcrypt.compare(password,u.password)))return NextResponse.json({error:"Nieprawidłowe hasło."},{status:401});if(u.twoFactorEnabled)return NextResponse.json({error:"2FA jest już aktywne."},{status:400});const secret=generateBase32Secret();await prisma.user.update({where:{id:auth.user.userId},data:{twoFactorSecret:encryptSecret(secret)}});return NextResponse.json({ok:true,secret,uri:otpauthUri(u.email,secret)});}
