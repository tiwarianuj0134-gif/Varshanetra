import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    totalLives: 1547,
    names: [
      "Ramesh Kumar (Mumbai 2023)",
      "Priya Sharma (Kerala 2023)",
      "Sunil Patel (Gujarat 2024)",
      "Lakshmi Devi (Tamil Nadu 2024)",
      "Mohammed Ali (Karnataka 2023)",
      "Anjali Singh (Maharashtra 2024)",
      "Rajesh Yadav (Bihar 2023)",
      "Kavita Reddy (Andhra Pradesh 2024)",
      "Deepak Verma (Uttar Pradesh 2023)",
      "Sunita Joshi (Madhya Pradesh 2024)",
      "Arun Nair (Kerala 2024)",
      "Meera Gupta (West Bengal 2023)",
      "Vikram Chauhan (Uttarakhand 2024)",
      "Pooja Mishra (Odisha 2023)",
      "Sanjay Kumar (Jharkhand 2024)"
    ],
    message: "VARSHANETRA exists to prevent such tragedies.",
    pledge: "With early warnings, most flood deaths are preventable.",
    impact: "Early warnings can save hundreds of lives every year."
  });
}
