"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/hooks/useLanguage"

export const HowToUse = () => {
  const { t } = useLanguage()

  return (
    <Card className="mt-12 bg-white/90 backdrop-blur-sm border-white/20 shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
        <CardTitle className="text-2xl font-bold text-center text-gray-800">{t("howToUse.title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-2xl">1</span>
            </div>
            <h3 className="font-bold text-lg mb-3 text-gray-800">{t("howToUse.step1Title")}</h3>
            <p className="text-gray-600 leading-relaxed">{t("howToUse.step1Desc")}</p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-2xl">2</span>
            </div>
            <h3 className="font-bold text-lg mb-3 text-gray-800">{t("howToUse.step2Title")}</h3>
            <p className="text-gray-600 leading-relaxed">{t("howToUse.step2Desc")}</p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-2xl">3</span>
            </div>
            <h3 className="font-bold text-lg mb-3 text-gray-800">{t("howToUse.step3Title")}</h3>
            <p className="text-gray-600 leading-relaxed">{t("howToUse.step3Desc")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
