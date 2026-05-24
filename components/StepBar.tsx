"use client"

import { useLanguage } from "@/hooks/useLanguage"

interface StepBarProps {
  currentStep: number
}

export const StepBar = ({ currentStep }: StepBarProps) => {
  const { t } = useLanguage()

  return (
    <div className="flex justify-center mb-12">
      <div className="flex items-center gap-6 bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
        <div
          className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${
            currentStep >= 1
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              currentStep >= 1 ? "bg-white/20 text-white" : "bg-gray-300 text-gray-600"
            }`}
          >
            1
          </span>
          <span className="font-medium">{t("steps.step1")}</span>
        </div>

        <div
          className={`w-12 h-1 rounded-full transition-all duration-500 ${currentStep >= 2 ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gray-300"}`}
        />

        <div
          className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${
            currentStep >= 2
              ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-105"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              currentStep >= 2 ? "bg-white/20 text-white" : "bg-gray-300 text-gray-600"
            }`}
          >
            2
          </span>
          <span className="font-medium">{t("steps.step2")}</span>
        </div>

        <div
          className={`w-12 h-1 rounded-full transition-all duration-500 ${currentStep >= 3 ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-300"}`}
        />

        <div
          className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${
            currentStep >= 3
              ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg scale-105"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              currentStep >= 3 ? "bg-white/20 text-white" : "bg-gray-300 text-gray-600"
            }`}
          >
            3
          </span>
          <span className="font-medium">{t("steps.step3")}</span>
        </div>
      </div>
    </div>
  )
}
