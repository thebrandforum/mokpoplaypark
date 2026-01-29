"use client";

import BaseLayout from "../../components/base-layout";
import CommonBanner from "../../components/common-banner";
import { useState, useEffect } from "react";
import { TicketIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const [isClient, setIsClient] = useState(false);
  const [settings, setSettings] = useState({
    price_settings: {
      adult1Hour: 17000,
      child1Hour: 12000,
      adult2Hour: 25000,
      child2Hour: 18000,
      guardian: 3000,
      guardian1Hour: 3000,
      guardian2Hour: 3000,
      groupDiscount: 10,
      minGroupSize: 20,
      remark1Hour: "",
      remark2Hour: "",
      discount_child_1hour: 10000,
      discount_adult_1hour: 15000,
      discount_child_2hour: 20000,
      discount_adult_2hour: 30000,
      priceImage: "",
    },
  });

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");
      const result = await response.json();

      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error("설정 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 금액 포맷팅 함수
  const formatMoney = (amount) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  if (!isClient) {
    return (
      <BaseLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">페이지를 불러오는 중...</p>
          </div>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      {/* CommonBanner 적용 */}
      <CommonBanner />

      <div className="h-6 sm:h-8 lg:h-10"></div>

      {/* 2x2 네비게이션 메뉴 - 반응형 (/pricing 활성화) */}
      <section className="bg-white py-4">
        <div className="text-center px-4">
          <div className="bg-white/90 px-4 sm:px-8 py-4 rounded inline-flex">
            {/* 모바일: 2x2 그리드, 데스크톱: 한 줄 */}
            <div className="grid grid-cols-1 md:flex md:items-center md:space-x-2">
              {/* 모바일 첫 번째 줄 / 데스크톱 전체 */}
              <div className="flex justify-center items-center mb-2 md:mb-0">
                <a
                  href="/usage"
                  className="text-gray-600 hover:text-orange-500 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap"
                >
                  시설이용안내
                </a>
                <span className="text-gray-400 px-2">|</span>
                <a
                  href="/safety"
                  className="text-gray-600 hover:text-orange-500 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap"
                >
                  이용안전수칙
                </a>
                <span className="hidden md:inline text-gray-400 px-2">|</span>
              </div>

              {/* 모바일 두 번째 줄 / 데스크톱 이어서 */}
              <div className="flex justify-center items-center">
                <a
                  href="/restrictions"
                  className="text-gray-600 hover:text-orange-500 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap"
                >
                  이용제한 및 유의사항
                </a>
                <span className="text-gray-400 px-2">|</span>
                <a
                  href="/pricing"
                  className="text-orange-500 border-b-2 border-orange-500 pb-1 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap"
                >
                  요금안내
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-6 sm:h-8 lg:h-10"></div>

      {/* 요금 안내 섹션 - 모바일 반응형 */}
      <section
        id="price"
        className="py-12 sm:py-16 lg:py-20 bg-white"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 섹션 타이틀 - 모바일 반응형 */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 sm:px-4 py-2 rounded-full text-blue-600 text-xs sm:text-sm font-medium mb-4">
              <TicketIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>PRICE INFORMATION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-gray-900 mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">
                이용요금
              </span>
            </h2>
          </div>

          {/* 요금표 - 이미지 */}
          <div>
            {settings?.price_settings?.priceImage ? (
              <img
                src={settings.price_settings.priceImage}
                alt="이용요금표"
                className="w-full h-auto"
              />
            ) : (
              <img
                src="/images/cash.png"
                alt="이용요금표"
                className="w-full h-auto"
              />
            )}
          </div>


          {/* 감면 요금 대상자 안내 - 모바일 반응형 */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mt-8">
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6"
              style={{
                background: "linear-gradient(90deg, #0060AF 0%, #0080DF 100%)",
              }}
            >
              <h3 className="text-white text-lg sm:text-xl font-bold text-center">
                감면 요금 대상자
              </h3>
              <p className="text-white/90 text-sm text-center mt-1">
                (증빙 서류 지참 후 입장 시 현장에서 확인 필수)
              </p>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-0.5 font-bold">•</span>
                  <div>
                    <span className="text-sm sm:text-base font-semibold">
                      목포 시민
                    </span>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      - 주민등록증 또는 운전면허증, 등본(발급일자 3개월 이내,
                      목포 주소)
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-0.5 font-bold">•</span>
                  <div>
                    <span className="text-sm sm:text-base font-semibold">
                      국가유공자
                    </span>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      - 국가유공자증 또는 유족증
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-0.5 font-bold">•</span>
                  <div>
                    <span className="text-sm sm:text-base font-semibold">
                      장애인
                    </span>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      - 장애인 복지카드 또는 증명서
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-0.5 font-bold">•</span>
                  <div>
                    <span className="text-sm sm:text-base font-semibold">
                      기초생활 수급자
                    </span>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      - 기초생활 수급자 증명서
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-0.5 font-bold">•</span>
                  <div>
                    <span className="text-sm sm:text-base font-semibold">
                      한부모가족
                    </span>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      - 한부모 증명서
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-0.5 font-bold">•</span>
                  <div>
                    <span className="text-sm sm:text-base font-semibold">
                      다자녀
                    </span>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      - 자녀 3인이상 가구
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </BaseLayout>
  );
}
