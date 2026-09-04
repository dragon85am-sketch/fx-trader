"use client";

import { scopedStorageKey } from "@/lib/userScopedStorage";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function generateCertificateNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const savedCounter =
    Number(localStorage.getItem(scopedStorageKey("certificateCounter")) || "0") + 1;

  localStorage.setItem(scopedStorageKey("certificateCounter"), String(savedCounter));

  const counter = String(savedCounter).padStart(6, "0");

  return `FXA-${year}-${month}-${counter}`;
}

export default function KursKoniecPage() {
  const [resetDone, setResetDone] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [certificateNumber, setCertificateNumber] = useState("");
  const [userName, setUserName] = useState("Trader");

  useEffect(() => {
    const savedCertificateNumber = localStorage.getItem(scopedStorageKey("certificateNumber"));

    if (savedCertificateNumber) {
      setCertificateNumber(savedCertificateNumber);
    } else {
      const newCertificateNumber = generateCertificateNumber();
      localStorage.setItem(scopedStorageKey("certificateNumber"), newCertificateNumber);
      setCertificateNumber(newCertificateNumber);
    }
  }, []);

  useEffect(() => {
    const savedName =
      localStorage.getItem(scopedStorageKey("userName")) ||
      localStorage.getItem(scopedStorageKey("name")) ||
      localStorage.getItem(scopedStorageKey("username"));

    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  const certificateDate = useMemo(() => {
    return new Date().toLocaleDateString("pl-PL");
  }, []);

  const handleResetProgress = () => {
    localStorage.removeItem(scopedStorageKey("passedQuizzes"));
    localStorage.removeItem(scopedStorageKey("completedLessons"));
    localStorage.removeItem(scopedStorageKey("lastOpenedModule"));

    for (let i = 0; i <= 18; i++) {
      localStorage.removeItem(scopedStorageKey(`module-${i}-activeLesson`));
    }

    setResetDone(true);
  };

  const handleDownloadPdf = async () => {
    const certificateElement = document.getElementById("certificate-pdf");
    if (!certificateElement) return;

    try {
      setIsGeneratingPdf(true);

      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        backgroundColor: "#0b1020",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 297;
      const pdfHeight = 210;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`certyfikat-${certificateNumber}.pdf`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* TOP PANEL */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="text-5xl mb-4">ðŸŽ‰</div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Gratulacje!
          </h1>

          <p className="text-gray-300 mb-2">
            Ukończyłeś kurs <span className="font-semibold text-white">Akademia FX Trade</span>
          </p>

          <p className="text-gray-400 mb-6">
            Możesz teraz pobrać certyfikat ukończenia.
          </p>

          <div className="flex flex-wrap justify-center gap-4">

            <Link
              href="/education/kurs"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
            >
              Wróć do kursu
            </Link>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium"
            >
              {isGeneratingPdf
                ? "Generowanie..."
                : "Pobierz certyfikat PDF"}
            </button>

            <button
              onClick={handleResetProgress}
              className="px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10"
            >
              Powtórz kurs
            </button>

          </div>

          {resetDone && (
            <div className="mt-4 text-green-400">
              Progres kursu został zresetowany.
            </div>
          )}
        </div>

        {/* CERTYFIKAT */}
        <div className="overflow-x-hidden">

          <div
            id="certificate-pdf"
            className="mx-auto w-full max-w-[1050px] rounded-3xl border border-[#c9a45c]/40 bg-[#0b1020] p-4 shadow-2xl"
          >

            <div className="rounded-3xl border-2 border-[#c9a45c] p-4">

              <div className="rounded-2xl border border-[#b9934d]/50 p-6">

                {/* HEADER */}

                <div className="flex justify-between mb-6 text-sm text-gray-400">
                  <div>
                    <p className="tracking-widest text-[#d6b06a] uppercase">
                      Certyfikat ukończenia
                    </p>
                    <p>Akademia FX Trade</p>
                  </div>

                  <div className="text-right">
                    <p>Certyfikat nr</p>
                    <p className="text-[#f3d38a] font-semibold">
                      {certificateNumber}
                    </p>
                  </div>
                </div>

                {/* LOGO */}

                <div className="text-center mb-6">

                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d6b06a] text-xl font-bold text-[#f3d38a]">
                    FX
                  </div>

                  <h2 className="text-4xl font-serif text-white">
                    CERTYFIKAT
                  </h2>

                  <p className="text-xl text-[#e8c679] tracking-widest">
                    UKOŃCZENIA
                  </p>

                </div>

                {/* TREŚĆ */}

                <div className="text-center mb-6">

                  <p className="text-gray-300 mb-3">
                    Niniejszym potwierdzamy, że
                  </p>

                  <p className="text-4xl font-serif italic text-white mb-3">
                    {userName}
                  </p>

                  <p className="text-gray-300 max-w-2xl mx-auto">
                    ukończył pełny program edukacyjny Akademia FX Trade obejmujący
                    19 modułów szkoleniowych z zakresu tradingu, zarządzania
                    ryzykiem, psychologii oraz budowy systemu transakcyjnego.
                  </p>

                </div>

                {/* INFO BOXES */}

                <div className="grid grid-cols-4 gap-3 mb-6 text-center">

                  <div className="border border-[#c9a45c]/30 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="text-white font-semibold">Ukończono</p>
                  </div>

                  <div className="border border-[#c9a45c]/30 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Program</p>
                    <p className="text-white font-semibold">19 modułów</p>
                  </div>

                  <div className="border border-[#c9a45c]/30 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Data</p>
                    <p className="text-white font-semibold">{certificateDate}</p>
                  </div>

                  <div className="border border-[#c9a45c]/30 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Poziom</p>
                    <p className="text-white font-semibold">Premium</p>
                  </div>

                </div>

                {/* FOOTER */}

                <div className="flex justify-between items-end border-t border-[#c9a45c]/30 pt-4">

                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full border-2 border-[#d6b06a] flex items-center justify-center text-[#f3d38a] font-bold">
                      FX
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Pieczęć programu</p>
                      <p className="text-white">Akademia FX Trade</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl italic text-[#f0d18a]">
                      Akademia FX Trade
                    </p>
                    <p className="text-xs text-gray-400">
                      Podpis programu
                    </p>
                  </div>

                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                  Niniejszy certyfikat stanowi potwierdzenie ukończenia programu
                  edukacyjnego Akademia FX Trade i ma charakter szkoleniowy.
                </p>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
