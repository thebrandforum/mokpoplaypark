"use client";

import { useState, useEffect } from "react";
import {
  PhoneIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CheckCircleIcon,
  TicketIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  KeyIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightIcon,
  StarIcon,
  SparklesIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { ChevronDoubleDownIcon } from "@heroicons/react/24/solid";
import BaseLayout from "../components/base-layout";
import PopupDisplay from "../components/popup-display";

export default function NewHomePage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  // 메인 이미지들
  const [mainImages, setMainImages] = useState([
    "/images/hero/main1.jpg",
    "/images/hero/main2.jpg",
    "/images/hero/main3.jpg",
  ]);

  // 연락처 정보 state 추가
  const [contactInfo, setContactInfo] = useState({
    fieldPhone: "061-272-8663",
    customerService: "1588-0000",
  });

  // 슬라이더 자동 재생 부분
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mainImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [mainImages.length]); // mainImages.length를 의존성에 추가

  // 설정 정보 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 기존 설정 로드
        const response = await fetch("/api/settings");
        const result = await response.json();

        // 홈페이지 설정 추가 로드
        const homepageResponse = await fetch("/api/admin/homepage-settings");
        const homepageResult = await homepageResponse.json();

        console.log('📥 homepage-settings API 응답:', homepageResult);

        if (result.success) {
          setSettings(result.data);
        }

        if (homepageResult.success && homepageResult.data) {
          console.log('📋 homepageResult.data:', homepageResult.data);
          console.log('📋 consultationHours:', homepageResult.data.consultationHours);

          // settings state에 homepage_settings 추가
          setSettings(prev => ({
            ...prev,
            homepage_settings: homepageResult.data
          }));

          // 메인 이미지 설정
          if (homepageResult.data.mainImages) {
            const imageUrls = homepageResult.data.mainImages.map(
              (img) => img.url
            );
            setMainImages(imageUrls);
          }

          // 연락처 정보 설정
          if (homepageResult.data.contactInfo) {
            setContactInfo(homepageResult.data.contactInfo);
          }
        }
      } catch (error) {
        console.error("설정 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // 공지사항 로드
  useEffect(() => {
    const loadNotices = async () => {
      try {
        const response = await fetch(
          "/api/community?type=notices&page=1&limit=3"
        );
        const result = await response.json();
        if (result.success && result.data.notices) {
          setNotices(result.data.notices);
        }
      } catch (error) {
        console.error("공지사항 로드 오류:", error);
      } finally {
        setNoticesLoading(false);
      }
    };
    loadNotices();
  }, []);

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, []);

  // 금액 포맷팅
  const formatMoney = (amount) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    // 이미 MM.DD 형식인 경우 그대로 반환
    if (dateString && dateString.match(/^\d{2}\.\d{2}$/)) {
      return dateString;
    }

    // ISO 날짜 형식인 경우 변환
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${month}.${day}`;
  };

  // 요일 이름 배열
  const dayNames = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ];

  // 휴무일 체크
  const getTodayStatus = () => {
    if (!settings?.operation_settings)
      return { status: "확인 중", message: "정보를 불러오는 중입니다." };

    const today = currentDate.getDay(); // 0=일요일, 1=월요일, ...
    const todayString = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD 형식
    const closedDays = settings.operation_settings.closedDays || [];
    const specialClosedDates =
      settings.operation_settings.specialClosedDates || [];

    // 정기 휴무일 체크
    if (closedDays.includes(today)) {
      const todayName = dayNames[today];
      return {
        status: "휴무일",
        message: `오늘은 ${todayName}로 휴무입니다.`,
        isOpen: false,
      };
    }

    // 특별 휴무일 체크
    if (specialClosedDates.includes(todayString)) {
      return {
        status: "휴무일",
        message: "오늘은 임시 휴무일입니다.",
        isOpen: false,
      };
    }

    // 운영시간 체크
    const now = currentDate.getHours() * 100 + currentDate.getMinutes();
    const openTime = parseInt(
      settings.operation_settings.openTime?.replace(":", "") || "1000"
    );
    const closeTime = parseInt(
      settings.operation_settings.closeTime?.replace(":", "") || "2100"
    );

    if (now < openTime) {
      return {
        status: "개장 전",
        message: `${settings.operation_settings.openTime}에 개장합니다.`,
        isOpen: false,
      };
    } else if (now > closeTime) {
      return {
        status: "영업 종료",
        message: "오늘 영업이 종료되었습니다.",
        isOpen: false,
      };
    } else {
      return {
        status: "정상 영업",
        message: "즐거운 모험을 시작하세요!",
        isOpen: true,
      };
    }
  };
  // 휴무일 표시 텍스트
  const getClosedDaysText = () => {
    if (!settings?.operation_settings?.closedDays) return "휴무일 없음";

    const closedDays = settings.operation_settings.closedDays;
    if (closedDays.length === 0) return;

    // JavaScript 날짜 시스템: 일요일=0, 월요일=1, 화요일=2, ..., 토요일=6
    const dayNames = [
      "일요일",
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
    ];

    // 휴무일을 요일명으로 변환하고 정렬
    const closedDayNames = closedDays
      .map((dayIndex) => dayNames[dayIndex])
      .sort((a, b) => {
        // 월요일부터 일요일 순서로 정렬
        const order = [
          "월요일",
          "화요일",
          "수요일",
          "목요일",
          "금요일",
          "토요일",
          "일요일",
        ];
        return order.indexOf(a) - order.indexOf(b);
      });

    return closedDayNames.join(", ") + " 휴무";
  };

  const todayStatus = getTodayStatus();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div
              className="w-20 h-20 border-4 border-orange-400 rounded-full animate-spin absolute top-0 left-0"
              style={{
                borderTopColor: "#F7921C",
                borderRightColor: "transparent",
                borderBottomColor: "transparent",
                borderLeftColor: "transparent",
              }}
            ></div>
          </div>
          <p className="mt-4 text-gray-600 animate-pulse">
            모험을 준비하는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BaseLayout>
      {/* 히어로 섹션 - 모바일 반응형 */}
      <section className="relative h-[65vh] overflow-hidden">
        {/* 배경 이미지 슬라이더 */}
        <div className="absolute inset-0">
          {mainImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1500 ${
                index === currentSlide
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-105"
              }`}
            >
              <img
                src={image}
                alt={`${settings?.basic_info?.parkName || "플레이파크"} ${
                  index + 1
                }`}
                className="w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                style={{
                  imageRendering: "crisp-edges",
                  backfaceVisibility: "hidden",
                  transform: "translateZ(0)",
                }}
              />
            </div>
          ))}
        </div>

        {/* 히어로 콘텐츠 - 모바일 반응형 */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center px-4">
            {/* 메인 타이틀 */}
            <div className="space-y-3 sm:space-y-4 animate-fadeInUp">
              <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-black/65 backdrop-blur-sm px-5 sm:px-8 py-3 sm:py-4 rounded-full text-white">
                <StarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="font-bold text-[12px] sm:text-lg md:text-xl">
                  전남 최초! 목포 유일의{" "}
                  <span className="text-blue-500">모험형 스포츠 테마파크</span>
                </span>
              </div>

              <h1 className="text-[32px] sm:text-4xl md:text-6xl font-black text-white leading-tight">
                <span className="block">
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400"
                    style={{
                      filter: "drop-shadow(2px 2px 8px rgba(0,0,0,0.8))",
                    }}
                  >
                    목포 플레이파크
                  </span>
                  <span
                    className="text-white"
                    style={{
                      textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
                    }}
                  >
                    에
                  </span>
                </span>
                <span
                  className="text-white block"
                  style={{
                    textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
                  }}
                >
                  오신 것을 환영합니다!
                </span>
              </h1>

              <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-black/65 backdrop-blur-sm px-5 sm:px-8 py-3 sm:py-4 rounded-full text-white">
                <StarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="font-bold text-[12px] sm:text-lg md:text-xl">
                  결제는 <span className="text-blue-500">현장에서만</span>{" "}
                  가능합니다
                </span>
              </div>
            </div>

            {/* 스크롤 인디케이터 */}
            <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <ChevronDoubleDownIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white/70" />
            </div>
          </div>
        </div>

        {/* 슬라이드 컨트롤 - 모바일 반응형 */}
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3">
          {mainImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 sm:w-12 h-2 sm:h-3 bg-orange-500 rounded-full"
                  : "w-2 sm:w-3 h-2 sm:h-3 bg-white/50 rounded-full hover:bg-white/70"
              }`}
              style={{
                backgroundColor: index === currentSlide ? "#F7921C" : undefined,
              }}
            />
          ))}
        </div>
      </section>

      {/* 정보 카드 섹션 - 모바일 반응형 */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* 운영시간 카드 */}
            <div className="group relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-10 sm:w-14 h-10 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <ClockIcon className="w-5 sm:w-7 h-5 sm:h-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2">
                  운영시간
                </h3>
                <p className="text-xl sm:text-3xl font-black text-blue-600 mb-1">
                  {settings?.operation_settings?.openTime || "10:00"} -{" "}
                  {settings?.operation_settings?.closeTime || "21:00"}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {getClosedDaysText()}
                </p>
              </div>
            </div>

            {/* 오늘의 상태 카드 */}
            <div
              className={`group relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                todayStatus.isOpen
                  ? "bg-gradient-to-br from-green-50 to-emerald-50"
                  : "bg-gradient-to-br from-red-50 to-pink-50"
              }`}
            >
              <div
                className={`absolute bottom-0 left-0 w-32 sm:w-40 h-32 sm:h-40 rounded-full -ml-16 sm:-ml-20 -mb-16 sm:-mb-20 group-hover:scale-150 transition-transform duration-500 ${
                  todayStatus.isOpen
                    ? "bg-gradient-to-tr from-green-200 to-emerald-100"
                    : "bg-gradient-to-tr from-red-200 to-pink-100"
                }`}
              ></div>
              <div className="relative z-10">
                <div
                  className={`w-10 sm:w-14 h-10 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform ${
                    todayStatus.isOpen
                      ? "bg-gradient-to-br from-green-500 to-emerald-600"
                      : "bg-gradient-to-br from-red-500 to-pink-600"
                  }`}
                >
                  <CheckCircleIcon className="w-5 sm:w-7 h-5 sm:h-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2">
                  {currentDate.getFullYear()}.
                  {(currentDate.getMonth() + 1).toString().padStart(2, "0")}.
                  {currentDate.getDate().toString().padStart(2, "0")}
                </h3>
                <p
                  className={`text-lg sm:text-2xl font-black mb-1 ${
                    todayStatus.isOpen ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {todayStatus.status}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {todayStatus.message}
                </p>
              </div>
            </div>

            {/* 이용요금 카드 */}
            <div
              className="group relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #F7921C 0%, #FF6B00 100%)",
              }}
            >
              <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-10 sm:w-14 h-10 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <TicketIcon className="w-5 sm:w-7 h-5 sm:h-7 text-white" />
                </div>
                <h3 className="font-bold text-white text-base sm:text-lg mb-2">
                  이용권 구매
                </h3>
                <button
                  className="inline-block bg-white text-orange-600 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-sm                 sm:text-base hover:scale-105 transition-transform mt-2"
                  disabled
                >
                  결제는 현장에서만 가능합니다
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 공지사항 섹션 - 새로 추가 */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 공지사항과 문의 정보 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* 공지사항 카드 - 2칸 차지 */}
            <div className="md:col-span-2 bg-gray-50 rounded-2xl p-6 sm:p-8 relative hover:shadow-lg transition-shadow duration-300">
              {/* + 버튼 */}
              <a
                href="/community"
                className="absolute top-4 right-4 w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                aria-label="공지사항 더보기"
              >
                <span className="text-gray-600 text-xl font-light">+</span>
              </a>

              <div className="mb-4">
                <h3 className="text-xs sm:text-sm text-gray-600 mb-1">
                  NOTICE
                </h3>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  공지사항
                </h2>
              </div>

              {/* 공지사항 목록 */}
              <div className="space-y-3">
                {noticesLoading ? (
                  // 로딩 중
                  <>
                    <div className="py-2 border-b border-gray-200">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="py-2 border-b border-gray-200">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="py-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </>
                ) : notices.length > 0 ? (
                  // 공지사항 목록
                  notices.map((notice, index) => (
                    <a
                      href="/community"
                      key={notice.id}
                      className="block group"
                    >
                      <div
                        className={`flex items-center justify-between py-2 ${
                          index < 2 ? "border-b border-gray-200" : ""
                        }`}
                      >
                        <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors pr-2 flex-1 truncate">
                          {notice.important && (
                            <span className="text-red-500 font-bold">
                              [중요]{" "}
                            </span>
                          )}
                          {notice.title}
                        </span>
                        <span className="text-xs text-gray-500 ml-2 shrink-0">
                          {notice.date || formatDate(notice.created_at)}
                        </span>
                      </div>
                    </a>
                  ))
                ) : (
                  // 공지사항 없음
                  <div className="py-4 text-center">
                    <span className="text-sm text-gray-500">
                      등록된 공지사항이 없습니다.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 문의 정보 카드들 - 현장문의만 */}
            <div className="flex flex-col h-full gap-3">
              {/* 현장 문의 카드 */}
              <div className="flex-1 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>

                <div className="relative z-10 text-center">
                  <h2 className="text-lg sm:text-xl font-bold mb-3">
                    현장문의
                  </h2>
                  <p className="text-2xl sm:text-3xl font-bold mb-4">
                    {contactInfo?.fieldPhone ||
                      settings?.basic_info?.phone ||
                      "061-272-8663"}
                  </p>
                  {settings?.homepage_settings?.consultationHours && (
                    <div className="text-sm text-white/90 space-y-1">
                      <p>상담시간: {settings.homepage_settings.consultationHours.start} ~{settings.homepage_settings.consultationHours.end}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 시설 소개 섹션 - 모바일 반응형 */}
      <section id="facility" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 섹션 타이틀 */}
          <div className="text-center mb-12 sm:mb-16">
            <div
              className="inline-flex items-center space-x-2 bg-orange-50 px-3 sm:px-4 py-2 rounded-full text-orange-600 text-xs sm:text-sm font-medium mb-4"
              style={{
                backgroundColor: "rgba(247, 146, 28, 0.1)",
                color: "#F7921C",
              }}
            >
              <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>ADVENTURE COURSES</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4">
              어른도 아이도 모두 함께 즐겨요!
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              초보자부터 익스트림 매니아까지, 모두가 즐길 수 있는 다양한 코스
            </p>
          </div>

          {/* 코스 카드 - 모바일 반응형 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* 이지 코스 */}
            <div className="group relative bg-gradient-to-b from-gray-50 to-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="absolute -top-16 sm:-top-20 -right-16 sm:-right-20 w-32 sm:w-40 h-32 sm:h-40 bg-gray-100 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>

              <div className="relative z-10">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-transparent rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-gray-700 text-xl sm:text-3xl font-bold">
                    Easy
                  </span>
                </div>

                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    이지 코스
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    멀티트램폴린 1, 2
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl">
                    <p className="text-gray-700 font-medium text-sm sm:text-base">
                      남녀노소 누구나 즐길수 있는
                    </p>
                    <p className="text-gray-700 font-medium text-xs sm:text-base">
                      신나는 모험이 시작되는 이지코스
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 어드벤처 코스 - 추천 */}
            <div
              className="group relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
              style={{
                background: "linear-gradient(135deg, #F7921C 0%, #FF6B00 100%)",
              }}
            >
              <div className="absolute -top-16 sm:-top-20 -left-16 sm:-left-20 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

              <div className="relative z-10">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-transparent backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-white text-lg sm:text-2xl font-bold">
                    Adventure
                  </span>
                </div>

                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    어드벤처 코스
                  </h3>
                  <p className="text-sm sm:text-base text-white/90">
                    디자인 암벽, 스카이 로프, 하늘 오르기
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="text-center p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                    <p className="text-white font-medium text-sm sm:text-base">
                      스릴만점!
                    </p>
                    <p className="text-white font-medium text-sm sm:text-base">
                      모험의 정점을 찍는 어드벤처 코스
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 익스트림 코스 */}
            <div className="group relative bg-gradient-to-b from-gray-900 to-black rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-800">
              <div className="absolute -bottom-16 sm:-bottom-20 -right-16 sm:-right-20 w-32 sm:w-40 h-32 sm:h-40 bg-red-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

              <div className="relative z-10">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-transparent rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-red-500 text-lg sm:text-2xl font-bold">
                    Extreme
                  </span>
                </div>

                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    익스트림 코스
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    점핑타워, 수직 슬라이드, 공중 놀이시설
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="text-center p-3 sm:p-4 bg-gray-800/50 rounded-xl sm:rounded-2xl">
                    <p className="text-white font-medium text-sm sm:text-base">
                      짜릿한 익사이팅 어트랙션에서
                    </p>
                    <p className="text-white font-medium text-sm sm:text-base">
                      극한의 즐거움을 느낄 수 있는{" "}
                      <span className="block">익스트림코스</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 요금 안내 섹션 - 모바일 반응형 */}
      <section
        id="price"
        className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 섹션 타이틀 */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 sm:px-4 py-2 rounded-full text-blue-600 text-xs sm:text-sm font-medium mb-4">
              <TicketIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>PRICE INFORMATION</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">
                이용요금
              </span>
            </h2>
          </div>

          {/* 요금표 - 모바일 반응형 */}
          {settings?.price_settings && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6"
                style={{
                  background:
                    "linear-gradient(90deg, #0060AF 0%, #0080DF 100%)",
                }}
              >
                <h3 className="text-white text-lg sm:text-xl font-bold text-center">
                  이용요금
                </h3>
              </div>

              <div className="p-4 sm:p-6 lg:p-8">
                {/* 모바일용 간단한 테이블 */}
                <div className="block md:hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300 rounded-lg text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-300">
                          <th className="border-r border-gray-300 p-2 text-center">
                            시간
                          </th>
                          <th className="border-r border-gray-300 p-2 text-center">
                            어린이
                          </th>
                          <th className="border-r border-gray-300 p-2 text-center">
                            성인
                          </th>
                          <th className="border-r border-gray-300 p-2 text-center">
                            보호자
                          </th>
                          <th className="p-2 text-center">비고</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td
                            colSpan={5}
                            className="bg-gray-100 p-2 text-center font-bold"
                          >
                            일반 요금
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="border-r border-gray-300 p-2 text-center font-medium">
                            1시간
                          </td>
                          <td className="border-r border-gray-300 p-2 text-center font-bold">
                            {formatMoney(settings.price_settings.child1Hour)}
                          </td>
                          <td className="border-r border-gray-300 p-2 text-center font-bold">
                            {formatMoney(settings.price_settings.adult1Hour)}
                          </td>
                          <td className="border-r border-gray-300 p-2 text-center font-bold">
                            {formatMoney(settings.price_settings.guardian1Hour)}
                          </td>
                          <td className="p-2 text-center text-xs">
                            {settings?.price_settings?.remark1Hour ||
                              "20:00 마감"}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="border-r border-gray-300 p-2 text-center font-medium">
                            2시간
                          </td>
                          <td className="border-r border-gray-300 p-2 text-center font-bold">
                            {formatMoney(settings.price_settings.child2Hour)}
                          </td>
                          <td className="border-r border-gray-300 p-2 text-center font-bold">
                            {formatMoney(settings.price_settings.adult2Hour)}
                          </td>
                          <td className="border-r border-gray-300 p-2 text-center font-bold">
                            {formatMoney(settings.price_settings.guardian2Hour)}
                          </td>
                          <td className="p-2 text-center text-xs">
                            {settings?.price_settings?.remark2Hour ||
                              "19:00 마감"}
                          </td>
                        </tr>
                        {/* 감면 요금 추가 */}
                        <tr className="border-b border-gray-300">
                          <td colSpan={5} className="p-2 text-center font-bold">
                            감면 요금
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="border-r border-gray-300 p-2 text-center font-medium">
                            1시간
                          </td>
                          <td className="border-r border-gray-300 p-2 text-center font-bold">
                            {formatMoney(
                              settings.price_settings.discount_child_1hour ||
                                10000
                            )}
                          </td>
                          <td className="border-r border-gray-300 p-2 text-center font-bold">
                            {formatMoney(
                              settings.price_settings.discount_adult_1hour ||
                                15000
                            )}
                          </td>
                          <td className="border-r border-gray-300 p-2 text-center font-bold">
                            {formatMoney(settings.price_settings.guardian1Hour)}
                          </td>
                          <td className="p-2 text-center text-xs">
                            {settings?.price_settings?.remark1Hour ||
                              "20:00 마감"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-300 p-2 text-center font-medium">
                            2시간
                          </td>
                          <td className="border-r border-gray-300 p-2 text-center font-bold">
                            {formatMoney(
                              settings.price_settings.discount_child_2hour ||
                                20000
                            )}
                          </td>
                          <td className="border-r border-gray-300 p-2 text-center font-bold">
                            {formatMoney(
                              settings.price_settings.discount_adult_2hour ||
                                30000
                            )}
                          </td>
                          <td className="border-r border-gray-300 p-2 text-center font-bold">
                            {formatMoney(settings.price_settings.guardian2Hour)}
                          </td>
                          <td className="p-2 text-center text-xs">
                            {settings?.price_settings?.remark2Hour ||
                              "19:00 마감"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {/* 모바일용 연령 구분 안내 */}
                  <div className="mt-3 text-xs text-gray-600 space-y-1">
                    <div>• 어린이: {settings.price_settings.childNote}</div>
                    <div>• 성인: {settings.price_settings.adultNote}</div>
                    <div>• 보호자: {settings.price_settings.guardianNote}</div>
                  </div>
                </div>

                {/* 데스크톱용 기존 테이블 */}
                <div className="hidden md:block">
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-300">
                          <th
                            rowSpan={2}
                            className="border-r border-gray-300 p-4 text-center"
                          >
                            종류
                          </th>
                          <th
                            rowSpan={2}
                            className="border-r border-gray-300 p-4 text-center"
                          >
                            이용시간
                          </th>
                          <th
                            colSpan={3}
                            className="border-b border-gray-300 p-2 text-center"
                          >
                            이용요금
                          </th>
                          <th
                            rowSpan={2}
                            className="border-l border-gray-300 p-4 text-center"
                          >
                            비고
                          </th>
                        </tr>
                        <tr className="bg-gray-50 border-b border-gray-300">
                          <th className="border-r border-gray-300 p-2 text-center text-sm">
                            어린이
                            <br />
                            <span className="font-normal text-xs">
                              {settings.price_settings.childNote}
                            </span>
                          </th>
                          <th className="border-r border-gray-300 p-2 text-center text-sm">
                            청소년 및 성인
                            <br />
                            <span className="font-normal text-xs">
                              {settings.price_settings.adultNote}
                            </span>
                          </th>
                          <th className="p-2 text-center text-sm">
                            보호자
                            <br />
                            <span className="font-normal text-xs">
                              {settings.price_settings.guardianNote}
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td
                            rowSpan={2}
                            className="border-r border-gray-300 p-4 text-center"
                          >
                            일반
                            <br />
                            요금
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center">
                            1시간
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center font-bold">
                            {formatMoney(settings.price_settings.child1Hour)}
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center font-bold">
                            {formatMoney(settings.price_settings.adult1Hour)}
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center font-bold">
                            {formatMoney(settings.price_settings.guardian1Hour)}
                          </td>
                          <td className="p-4 text-center">
                            {settings?.price_settings?.remark1Hour ||
                              "20:00 발권마감"}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="border-r border-gray-300 p-4 text-center">
                            2시간
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center font-bold">
                            {formatMoney(settings.price_settings.child2Hour)}
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center font-bold">
                            {formatMoney(settings.price_settings.adult2Hour)}
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center font-bold">
                            {formatMoney(settings.price_settings.guardian2Hour)}
                          </td>
                          <td className="p-4 text-center">
                            {settings?.price_settings?.remark2Hour ||
                              "19:00 발권마감"}
                          </td>
                        </tr>
                        {/* 감면 요금 추가 */}
                        <tr className="border-b border-gray-300">
                          <td
                            rowSpan={2}
                            className="border-r border-gray-300 p-4 text-center"
                          >
                            감면
                            <br />
                            요금
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center">
                            1시간
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center font-bold">
                            {formatMoney(
                              settings.price_settings.discount_child_1hour ||
                                10000
                            )}
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center font-bold">
                            {formatMoney(
                              settings.price_settings.discount_adult_1hour ||
                                15000
                            )}
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center font-bold">
                            {formatMoney(settings.price_settings.guardian1Hour)}
                          </td>
                          <td className="p-4 text-center">
                            {settings?.price_settings?.remark1Hour ||
                              "20:00 발권마감"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-300 p-4 text-center">
                            2시간
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center font-bold">
                            {formatMoney(
                              settings.price_settings.discount_child_2hour ||
                                20000
                            )}
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center font-bold">
                            {formatMoney(
                              settings.price_settings.discount_adult_2hour ||
                                30000
                            )}
                          </td>
                          <td className="border-r border-gray-300 p-4 text-center font-bold">
                            {formatMoney(settings.price_settings.guardian2Hour)}
                          </td>
                          <td className="p-4 text-center">
                            {settings?.price_settings?.remark2Hour ||
                              "19:00 발권마감"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee 30s linear infinite;
          display: flex;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>
      <PopupDisplay />
    </BaseLayout>
  );
}
