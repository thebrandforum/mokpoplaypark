"use client";

import { useState, useEffect } from "react";
import {
  PhoneIcon,
  ClockIcon,
  MapPinIcon,
  KeyIcon,
  Bars3Icon,
  XMarkIcon,
  TicketIcon,
  ChevronDownIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface BaseLayoutProps {
  children: React.ReactNode;
}

// 메뉴 구조 정의
const menuItems = [
  {
    title: "목포플레이파크",
    href: "/about",
    submenu: [
      { title: "소개", href: "/about" },
      { title: "갤러리", href: "/gallery" },
      { title: "오시는길", href: "/location" },
    ],
  },
  {
    title: "시설안내",
    href: "/facility",
    submenu: [
      { title: "어트랙션구성", href: "/facility" },
      { title: "편의시설", href: "/facility/amenities" },
    ],
  },
  {
    title: "이용안내",
    href: "/usage",
    submenu: [
      { title: "시설이용안내", href: "/usage" },
      { title: "이용안전수칙", href: "/safety" },
      { title: "이용제한 및 유의사항", href: "/restrictions" },
      { title: "요금안내", href: "/pricing" },
    ],
  },
  {
    title: "커뮤니티",
    href: "/community",
    submenu: [
      { title: "공지사항", href: "/community" },
      { title: "자주묻는질문", href: "/community/faq" },
      { title: "이벤트", href: "/community/event" },
    ],
  },
];

export default function BaseLayout({ children }: BaseLayoutProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(
    null
  );
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 설정 정보 상태 추가
  const [settings, setSettings] = useState({
    basic_info: {
      parkName: "목포 플레이파크",
      representativeName: "김대표",
      businessNumber: "123-45-67890",
      address: "전라남도 목포시 용해동 9-11",
      onlineCompanyName: "㈜브랜드포럼",
      onlineCompanyAddress: "서울시 강서구 화곡로68길 82 강서IT밸리 1103호",
      onlineCompanyPhone: "02.338.1316",
      onlineBusinessNumber: "2024-서울강서-0865",
    },
    footer_settings: {
      footerText: `목포플레이파크 | 전라남도 목포시 남농로 115 (용해동) 목포플레이파크
  대표 : 홍주표 | 사업자등록번호 : 147-85-03093
  전화번호 : 061-272-8663 | 이메일 : mokpoplaypark@climbkorea.com
  
  온라인위탁사 | 서울시 강서구 화곡로 68길 82 강서IT밸리 1103호
  전화번호 : 02.338.1316 | 통신판매업신고번호 : 2024-서울강서-0865`,
    },
  });

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 설정 정보 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        const result = await response.json();

        if (result.success && result.data) {
          setSettings(result.data);
        }
      } catch (error) {
        console.error("설정 불러오기 실패:", error);
      }
    };

    loadSettings();
  }, []);

  // 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = () => {
      const accessToken = localStorage.getItem("access_token");
      const userInfoStr = localStorage.getItem("user_info");

      if (accessToken && userInfoStr) {
        try {
          const user = JSON.parse(userInfoStr);
          setIsLoggedIn(true);
          setUserInfo(user);
        } catch (error) {
          console.error("사용자 정보 파싱 오류:", error);
          setIsLoggedIn(false);
          setUserInfo(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    };

    checkLoginStatus();
  }, []);

  // 토스트 알림 표시
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);

    // 2초 후 토스트 숨기기
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_info");
    setIsLoggedIn(false);
    setUserInfo(null);

    // 토스트 알림 표시
    showToastMessage("로그아웃되었습니다.");

    // 1.5초 후 페이지 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // 모바일 메뉴 토글
  const toggleMobileSubmenu = (title: string) => {
    setExpandedMobileMenu(expandedMobileMenu === title ? null : title);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 토스트 알림 - 4단계 반응형 */}
      <div
        className={`fixed top-3 sm:top-4 md:top-5 lg:top-4 xl:top-6 right-3 sm:right-4 md:right-5 lg:right-4 xl:right-6 z-50 transition-all duration-300 ${
          showToast ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <div className="bg-blue-500 text-white px-4 sm:px-5 md:px-6 lg:px-5 xl:px-6 py-3 sm:py-3.5 md:py-4 lg:py-3.5 xl:py-4 rounded-lg shadow-lg flex items-center space-x-2 sm:space-x-3 min-w-[200px] sm:min-w-[220px] md:min-w-[250px] lg:min-w-[240px] xl:min-w-[280px]">
          <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex-shrink-0" />
          <span className="font-medium text-xs sm:text-sm md:text-base lg:text-sm xl:text-base">
            {toastMessage}
          </span>
        </div>
      </div>

      {/* 상단 관련 사이트 바 - 4단계 반응형 */}
      <div className="bg-gray-100 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-4 xl:px-8">
          {/* 모바일용 2x2 그리드 - 숨김 처리 */}
          <div className="hidden md:hidden grid grid-cols-2 gap-2 text-center">
            <a
              href="http://www.mmcablecar.com/main/main.html#sec_6"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-500 py-1"
            >
              목포해상케이블카
            </a>
            <a
              href="http://samhakdo-cruise.co.kr/main/main.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-500 py-1"
            >
              삼학도크루즈
            </a>
            <a
              href="https://www.mokpo.go.kr/www"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-500 py-1"
            >
              목포시청
            </a>
            <a
              href="https://www.mokpo.go.kr/tour"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-500 py-1"
            >
              목포문화관광
            </a>
            <a
              href="http://www.climbkorea.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-500 py-1"
            >
              클라임코리아
            </a>
          </div>

          {/* 태블릿/데스크톱용 한 줄 */}
          <div className="hidden md:block text-right space-x-2 md:space-x-3 lg:space-x-2 xl:space-x-4">
            <a
              href="http://www.mmcablecar.com/main/main.html#sec_6"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-orange-50 hover:text-orange-500 text-gray-600 px-3 py-1.5 rounded-full text-base transition-all"
            >
              목포해상케이블카
            </a>
            <a
              href="http://samhakdo-cruise.co.kr/main/main.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-orange-50 hover:text-orange-500 text-gray-600 px-3 py-1.5 rounded-full text-base transition-all"
            >
              삼학도크루즈
            </a>
            <a
              href="https://www.mokpo.go.kr/www"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-orange-50 hover:text-orange-500 text-gray-600 px-3 py-1.5 rounded-full text-base transition-all"
            >
              목포시청
            </a>
            <a
              href="https://www.mokpo.go.kr/tour"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-orange-50 hover:text-orange-500 text-gray-600 px-3 py-1.5 rounded-full text-base transition-all"
            >
              목포문화관광
            </a>
            <a
              href="http://www.climbkorea.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-orange-50 hover:text-orange-500 text-gray-600 px-3 py-1.5 rounded-full text-base transition-all"
            >
              클라임코리아
            </a>
          </div>
        </div>
      </div>

      {/* 메인 네비게이션 - 4단계 반응형 */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-4 xl:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 md:h-20 lg:h-16 xl:h-20">
            {/* 로고 - 4단계 반응형 */}
            <div className="flex items-center">
              <a href="/">
                <img
                  src="/images/logo.jpg"
                  alt="목포플레이파크 로고"
                  className="h-10 sm:h-12 md:h-16 lg:h-14 xl:h-18 w-auto cursor-pointer hover:opacity-90 transition-opacity"
                />
              </a>
            </div>

            {/* 데스크톱 메뉴 */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-8">
              {menuItems.map((item) => (
                <div key={item.title} className="relative group">
                  <a
                    href={item.href}
                    className="relative text-gray-700 hover:text-orange-500 font-medium text-sm lg:text-sm xl:text-base transition-colors group flex items-center"
                  >
                    {item.title}
                    <span
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full"
                      style={{ backgroundColor: "#F7921C" }}
                    ></span>
                  </a>

                  {/* 드롭다운 메뉴 */}
                  <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-2 min-w-[160px] lg:min-w-[180px] xl:min-w-[200px]">
                      {item.submenu.map((subItem) => (
                        <a
                          key={subItem.title}
                          href={subItem.href}
                          className="block px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 text-sm lg:text-sm xl:text-base text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition"
                        >
                          {subItem.title}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 로그인/회원가입/예약 버튼 - 4단계 반응형 */}
            <div className="hidden md:flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 lg:space-x-2 xl:space-x-4">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center">
                    <div className="relative group">
                      <button className="flex items-center space-x-1.5 sm:space-x-2 text-gray-700 hover:text-orange-500 transition">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-6 lg:h-6 xl:w-8 xl:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-bold">
                          {userInfo?.name?.charAt(0)}
                        </div>
                        <span className="font-medium text-xs sm:text-sm md:text-base lg:text-sm xl:text-base truncate max-w-[60px] sm:max-w-[80px] md:max-w-[100px] lg:max-w-[80px] xl:max-w-[120px]">
                          {userInfo?.name}님
                        </span>
                      </button>

                      {/* 드롭다운 메뉴 */}
                      <div className="absolute right-0 mt-2 w-40 sm:w-44 md:w-48 lg:w-44 xl:w-52 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                        <div className="py-2">
                          <a
                            href="/account/password"
                            className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-700 hover:bg-orange-50 transition"
                          >
                            <KeyIcon
                              className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 mr-2 text-orange-500"
                              style={{ color: "#F7921C" }}
                            />
                            비밀번호 변경
                          </a>
                          <a
                            href="/reservation-check"
                            className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-700 hover:bg-orange-50 transition"
                          >
                            <TicketIcon
                              className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 mr-2 text-orange-500"
                              style={{ color: "#F7921C" }}
                            />
                            내 예약 확인
                          </a>
                          <hr className="my-2 border-gray-100" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-700 hover:bg-gray-50 transition text-left"
                          >
                            로그아웃
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    className="text-gray-700 hover:text-orange-500 font-medium text-xs sm:text-sm md:text-base lg:text-sm xl:text-base transition"
                  >
                    로그인
                  </a>
                  <a
                    href="/signup"
                    className="text-gray-700 hover:text-orange-500 font-medium text-xs sm:text-sm md:text-base lg:text-sm xl:text-base transition"
                  >
                    회원가입
                  </a>
                </>
              )}

              <a
                href="/reservation-check"
                className="border-2 border-gray-300 text-gray-700 px-2 sm:px-3 md:px-4 lg:px-3 xl:px-5 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 rounded-full hover:border-orange-500 hover:text-orange-500 transition-all font-medium text-xs sm:text-sm md:text-base lg:text-sm xl:text-base"
              >
                예약 확인
              </a>
            </div>

            {/* 모바일용 버튼들 - md 미만에서만 표시 */}
            <div className="flex md:hidden items-center space-x-1.5">
              {/* 예약 확인 버튼 */}
              <a
                href="/reservation-check"
                className="border border-gray-300 text-gray-700 px-2.5 py-1.5 rounded-full text-xs font-medium hover:border-orange-500             hover:text-orange-500 transition-all flex flex-col items-center leading-tight"
              >
                <span>예약</span>
                <span>확인</span>
              </a>

              {/* 메뉴 버튼 */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-5 h-5 text-gray-700" />
                ) : (
                  <Bars3Icon className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 - 4단계 반응형 */}
        <div
          className={`md:hidden transition-all duration-300 ${
            mobileMenuOpen
              ? "max-h-[600px] opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 bg-white border-t border-gray-100">
            {/* 메인 메뉴 아이템들 */}
            <div className="space-y-1">
              {menuItems.map((item) => (
                <div key={item.title}>
                  <button
                    onClick={() => toggleMobileSubmenu(item.title)}
                    className="flex items-center justify-between w-full text-gray-700 hover:text-orange-500 font-medium transition text-sm sm:text-base md:text-lg py-2.5"
                  >
                    {item.title}
                    <ChevronDownIcon
                      className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 transition-transform ${
                        expandedMobileMenu === item.title ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* 모바일 서브메뉴 */}
                  <div
                    className={`pl-3 sm:pl-4 md:pl-6 transition-all duration-200 ${
                      expandedMobileMenu === item.title ? "block" : "hidden"
                    }`}
                  >
                    {item.submenu.map((subItem) => (
                      <a
                        key={subItem.title}
                        href={subItem.href}
                        className="block text-sm sm:text-base md:text-lg text-gray-600 hover:text-orange-500 transition py-1.5"
                      >
                        {subItem.title}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 구분선 */}
            <div className="my-3">
              <div className="border-t border-gray-200"></div>
            </div>

            {/* 로그인/회원가입 메뉴 */}
            <div className="space-y-1">
              {isLoggedIn ? (
                <>
                  <a
                    href="/account/password"
                    className="block text-gray-700 hover:text-orange-500 font-medium transition text-sm sm:text-base md:text-lg py-2.5"
                  >
                    비밀번호 변경
                  </a>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left text-gray-700 hover:text-orange-500 font-medium transition text-sm sm:text-base md:text-lg py-2.5"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    className="block text-gray-700 hover:text-orange-500 font-medium transition text-sm sm:text-base md:text-lg py-2.5"
                  >
                    로그인
                  </a>
                  <a
                    href="/signup"
                    className="block text-gray-700 hover:text-orange-500 font-medium transition text-sm sm:text-base md:text-lg py-2.5"
                  >
                    회원가입
                  </a>
                </>
              )}
            </div>

            {/* 예약 확인 버튼 */}
            <div className="mt-4 space-y-2 sm:space-y-3">
              <a
                href="/reservation-check"
                className="block w-full border-2 border-gray-300 text-gray-700 text-center py-2.5 sm:py-3 md:py-3.5 rounded-full font-medium hover:border-orange-500 hover:text-orange-500 transition text-sm sm:text-base md:text-lg"
              >
                예약 확인
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="min-h-screen">{children}</main>

      {/* 푸터 - 4단계 반응형 */}
      <footer className="bg-white text-gray-600 py-6 sm:py-8 md:py-10 lg:py-10 xl:py-12 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 로고 */}
          <div className="text-center mb-3 sm:mb-4 md:mb-5 lg:mb-5 xl:mb-6">
            <img
              src="/images/logo.jpg"
              alt="목포플레이파크 로고"
              className="h-7 sm:h-8 md:h-10 lg:h-10 xl:h-12 w-auto mx-auto"
            />
          </div>

          {/* 사업자 정보 - 반응형 레이아웃 */}
          <div className="text-[11px] sm:text-xs md:text-sm lg:text-[13px] xl:text-sm text-gray-600">
            {/* 공지사항과 동일한 그리드 시스템 적용 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* 목포플레이파크 정보 - 공지사항과 같은 위치 (2칸) */}
              <div className="text-left mb-4 md:mb-0 break-keep md:col-span-2">
                {settings?.footer_settings?.footerText ? (
                  // 동적 데이터 처리
                  (() => {
                    const lines =
                      settings.footer_settings.footerText.split("\n");
                    const parkInfo = [];
                    const onlineInfo = [];
                    let isOnlineSection = false;

                    lines.forEach((line) => {
                      if (line.startsWith("온라인위탁사")) {
                        isOnlineSection = true;
                      }

                      if (!isOnlineSection && line.trim()) {
                        parkInfo.push(line);
                      } else if (isOnlineSection && line.trim()) {
                        onlineInfo.push(line);
                      }
                    });

                    return (
                      <>
                        {/* 목포플레이파크 정보 */}
                        {parkInfo.map((line, index) => {
                          if (index === 0) {
                            // 첫 번째 줄
                            return (
                              <div
                                key={index}
                                className="break-keep font-extrabold text-black md:whitespace-nowrap"
                              >
                                {line}
                              </div>
                            );
                          }
                          return (
                            <div
                              key={index}
                              className="break-keep md:whitespace-nowrap"
                            >
                              {line}
                            </div>
                          );
                        })}
                      </>
                    );
                  })()
                ) : (
                  // 기본값 - 목포플레이파크 정보
                  <>
                    <div className="break-keep font-extrabold text-black md:whitespace-nowrap">
                      목포플레이파크 | 전라남도 목포시 남농로 115 (용해동)
                      목포플레이파크
                    </div>
                    <div className="break-keep md:whitespace-nowrap">
                      대표 : 홍주표 | 사업자등록번호 : 147-85-03093
                    </div>
                    <div className="break-keep md:whitespace-nowrap">
                      전화번호 : 061-272-8663 | 이메일 :
                      mokpoplaypark@climbkorea.com
                    </div>
                  </>
                )}
              </div>

              {/* 온라인위탁사 정보 - 공지사항 옆 문의 카드와 같은 위치 (1칸) */}
              <div className="text-left break-keep md:col-span-1">
                {settings?.footer_settings?.footerText ? (
                  // 동적 데이터 처리
                  (() => {
                    const lines =
                      settings.footer_settings.footerText.split("\n");
                    const onlineInfo = [];
                    let isOnlineSection = false;

                    lines.forEach((line) => {
                      if (line.startsWith("온라인위탁사")) {
                        isOnlineSection = true;
                      }

                      if (isOnlineSection && line.trim()) {
                        onlineInfo.push(line);
                      }
                    });

                    return (
                      <>
                        {onlineInfo.map((line, index) => {
                          if (line.startsWith("온라인위탁사")) {
                            return (
                              <div
                                key={index}
                                className="break-keep md:whitespace-nowrap"
                              >
                                {line}
                              </div>
                            );
                          }
                          return (
                            <div
                              key={index}
                              className="break-keep md:whitespace-nowrap"
                            >
                              {line}
                            </div>
                          );
                        })}
                      </>
                    );
                  })()
                ) : (
                  // 기본값 - 온라인위탁사 정보
                  <>
                    <div className="break-keep md:whitespace-nowrap">
                      온라인위탁사 | 주식회사 브랜드포럼
                    </div>
                    <div className="break-keep md:whitespace-nowrap">
                      전화번호 : 02.338.1316 | 통신판매업신고번호 :
                      2024-서울강서-0865
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 저작권 */}
          <div className="border-t border-gray-200 mt-3 sm:mt-4 md:mt-5 lg:mt-5 xl:mt-6 pt-3 sm:pt-3 md:pt-4 lg:pt-4 xl:pt-5 text-center">
            <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm lg:text-[13px] xl:text-sm">
              © 2025 목포플레이파크. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
