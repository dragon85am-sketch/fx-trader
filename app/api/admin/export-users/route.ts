import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type ExportUser = {
  email: string;
  role: string;
  isPremium: boolean;
  isBanned: boolean;
  premiumSince: Date | null;
  premiumUntil: Date | null;
  stripeAccountId: string | null;
  payoutsEnabled: boolean;
  createdAt: Date;
};

function formatDate(date?: Date | null) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("pl-PL");
}

function daysLeft(date?: Date | null) {
  if (!date) return 0;

  const diff = new Date(date).getTime() - Date.now();

  return Math.max(
    0,
    Math.ceil(diff / (1000 * 60 * 60 * 24))
  );
}

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    const users: ExportUser[] = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        email: true,
        role: true,
        isPremium: true,
        isBanned: true,
        premiumSince: true,
        premiumUntil: true,
        stripeAccountId: true,
        payoutsEnabled: true,
        createdAt: true,
      },
    });

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet(
      "FX-TRADE Report"
    );

    /*
     * ======================================================
     * HEADER
     * ======================================================
     */

    sheet.mergeCells("A1:K1");

    sheet.getCell("A1").value = "FX-TRADE";

    sheet.getCell("A1").font = {
      bold: true,
      size: 24,
      color: {
        argb: "FFFFFFFF",
      },
    };

    sheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF0EA5E9",
      },
    };

    sheet.getCell("A1").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    sheet.mergeCells("A2:K2");

    sheet.getCell("A2").value =
      "Affiliate Users & Subscription Report";

    sheet.getCell("A2").font = {
      bold: true,
      size: 14,
    };

    sheet.getCell("A2").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    /*
     * ======================================================
     * KPI
     * ======================================================
     */

    const totalUsers = users.length;

    const premiumUsers = users.filter(
      (user: ExportUser) => user.isPremium
    ).length;

    const renewedUsers = users.filter(
      (user: ExportUser) =>
        Boolean(
          user.premiumSince &&
            user.premiumUntil
        )
    ).length;

    const activeSubs = users.filter(
      (user: ExportUser) =>
        user.isPremium &&
        Boolean(user.premiumUntil) &&
        new Date(
          user.premiumUntil as Date
        ).getTime() > Date.now()
    ).length;

    const kpis: Array<[string, number]> = [
      ["Users", totalUsers],
      ["Premium", premiumUsers],
      ["Renewed", renewedUsers],
      ["Active Subs", activeSubs],
    ];

    kpis.forEach(([label, value], index) => {
      const col = index * 2 + 1;

      sheet.mergeCells(
        4,
        col,
        5,
        col + 1
      );

      const cell = sheet.getCell(4, col);

      cell.value = `${label}\n${value}`;

      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      cell.font = {
        bold: true,
        color: {
          argb: "FFFFFFFF",
        },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "FF0F172A",
        },
      };
    });

    /*
     * ======================================================
     * TABLE
     * ======================================================
     */

    const headers = [
      "Email",
      "Role",
      "Premium",
      "Subscription Renewed",
      "Renewals",
      "Subscription Start",
      "Subscription End",
      "Days Left",
      "Stripe Connected",
      "Banned",
      "Created",
    ];

    sheet.addRow([]);
    sheet.addRow(headers);

    const headerRow = sheet.getRow(7);

    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: {
          argb: "FFFFFFFF",
        },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "FF0EA5E9",
        },
      };

      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    });

    /*
     * ======================================================
     * USERS
     * ======================================================
     */

    users.forEach((user: ExportUser) => {
      sheet.addRow([
        user.email,
        user.role,

        user.isPremium
          ? "YES"
          : "NO",

        user.premiumSince &&
        user.premiumUntil
          ? "YES"
          : "NO",

        0,

        formatDate(
          user.premiumSince
        ),

        formatDate(
          user.premiumUntil
        ),

        daysLeft(
          user.premiumUntil
        ),

        user.stripeAccountId &&
        user.payoutsEnabled
          ? "YES"
          : "NO",

        user.isBanned
          ? "YES"
          : "NO",

        formatDate(
          user.createdAt
        ),
      ]);
    });

    /*
     * ======================================================
     * COLUMN WIDTHS
     * ======================================================
     */

    sheet.columns = [
      { width: 34 },
      { width: 14 },
      { width: 14 },
      { width: 25 },
      { width: 12 },
      { width: 22 },
      { width: 22 },
      { width: 14 },
      { width: 22 },
      { width: 14 },
      { width: 18 },
    ];

    /*
     * ======================================================
     * FREEZE + FILTER
     * ======================================================
     */

    sheet.views = [
      {
        state: "frozen",
        ySplit: 7,
      },
    ];

    sheet.autoFilter = {
      from: "A7",
      to: "K7",
    };

    /*
     * ======================================================
     * STYLING
     * ======================================================
     */

    sheet.eachRow(
      (row, rowNumber) => {
        row.eachCell((cell) => {
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
          };

          cell.border = {
            bottom: {
              style: "thin",
              color: {
                argb: "FFE5E7EB",
              },
            },
          };

          if (
            String(cell.value) === "YES"
          ) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: "FFDCFCE7",
              },
            };

            cell.font = {
              color: {
                argb: "FF166534",
              },
              bold: true,
            };
          }

          if (
            String(cell.value) === "NO"
          ) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: "FFFEE2E2",
              },
            };

            cell.font = {
              color: {
                argb: "FF991B1B",
              },
              bold: true,
            };
          }

          if (rowNumber === 7) {
            cell.font = {
              bold: true,
              color: {
                argb: "FFFFFFFF",
              },
            };

            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: "FF0EA5E9",
              },
            };
          }
        });
      }
    );

    /*
     * ======================================================
     * EXPORT XLSX
     * ======================================================
     */

    const buffer =
      await workbook.xlsx.writeBuffer();

    return new NextResponse(
      buffer as BodyInit,
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            'attachment; filename="fx-trade-users-report.xlsx"',

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "EXPORT USERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się wygenerować raportu",
      },
      {
        status: 500,
      }
    );
  }
}