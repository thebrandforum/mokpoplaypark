"use client";

import { useState, useEffect } from "react";
import BaseLayout from "../../components/base-layout";

export default function ReservationPage() {
  // Hydration 문제 해결을 위한 상태
  const [mounted, setMounted] = useState(false);

  const [settings, setSettings] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [dateConfig, setDateConfig] = useState({
    currentMonth: "",
    maxMonth: "",
    isReady: false,
  });

  // 컴포넌트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 알림 표시 함수
  const showAlert = (message, type = "info") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 4000);
  };

  // 설정 로드 - mounted 후에만
  useEffect(() => {
    if (!mounted) return;

    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        const result = await response.json();
        if (result.success) {
          setSettings(result.data);
          // 결제 차단 확인
          if (result.data.payment_settings?.isPaymentBlocked) {
            showAlert(
              result.data.payment_settings.blockMessage ||
                "현재 시스템 점검 중으로 예약이 일시 중단되었습니다.",
              "error"
            );
          }
          // 🆕 취소 정책 설정도 저장 (나중에 취소 API에서 사용)
          if (result.data.cancellation_settings) {
            // 글로벌 변수나 localStorage에 저장하여 나중에 사용
            localStorage.setItem(
              "cancellation_settings",
              JSON.stringify(result.data.cancellation_settings)
            );
          }
        }
      } catch (error) {
        console.error("설정 로드 오류:", error);
      }
    };
    loadSettings();
  }, [mounted]);

  // 로그인 상태 확인 - mounted 후에만
  useEffect(() => {
    if (!mounted) return;

    const checkLoginStatus = () => {
      try {
        const token = localStorage.getItem("access_token");
        const userDataString = localStorage.getItem("user_info");

        if (token && userDataString) {
          const userData = JSON.parse(userDataString);
          setUserInfo(userData);
          setIsLoggedIn(true);

          if (userData.name)
            setCustomerInfo((prev) => ({ ...prev, name: userData.name }));
          if (userData.email)
            setCustomerInfo((prev) => ({ ...prev, email: userData.email }));
          if (userData.phone)
            setCustomerInfo((prev) => ({ ...prev, phone: userData.phone }));
        }
      } catch (error) {
        console.error("사용자 정보 파싱 오류:", error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    // 클라이언트에서만 날짜 계산
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    const maxMonth = maxDate.toISOString().slice(0, 7);

    setDateConfig({
      currentMonth,
      maxMonth,
      isReady: true,
    });
  }, [mounted]);

  // 서버 렌더링 시 로딩 화면
  if (!mounted) {
    return (
      <BaseLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">예약 페이지를 준비하는 중...</p>
          </div>
        </div>
      </BaseLayout>
    );
  }

  // 설정 로딩 중
  if (!settings) {
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

  // 휴무일 확인
  const isClosedDay = (dateString) => {
    if (!dateString || !settings.operation_settings) return false;

    const date = new Date(dateString);
    const dayOfWeek = date.getDay();

    return settings.operation_settings.closedDays.includes(dayOfWeek);
  };

  // 휴무일 텍스트 변환
  const getClosedDaysText = () => {
    if (!settings.operation_settings || !settings.operation_settings.closedDays)
      return "";

    const dayNames = [
      "일요일",
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
    ];
    const closedDayNames = settings.operation_settings.closedDays
      .map((day) => dayNames[day])
      .join(", ");

    return closedDayNames || "없음";
  };

  // 총 금액 계산
  const calculateTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.count, 0);
  };

  // 장바구니에 아이템 추가/수정
  const updateCart = (type, hours, count, isDiscount = false) => {
    const itemKey = `${type}${isDiscount ? "_discount" : ""}_${hours}h`;
    const newCart = [...cart];
    const existingIndex = newCart.findIndex((item) => item.key === itemKey);

    if (count === 0) {
      if (existingIndex >= 0) {
        newCart.splice(existingIndex, 1);
      }
    } else {
      let price = 0;
      let name = "";

      if (type === "adult") {
        if (isDiscount) {
          price =
            hours === 1
              ? settings.price_settings?.discount_adult_1hour
              : settings.price_settings?.discount_adult_2hour;
          name = `성인 ${hours}시간권 (감면)`;
        } else {
          price =
            hours === 1
              ? settings.price_settings?.adult1Hour
              : settings.price_settings?.adult2Hour;
          name = `성인 ${hours}시간권`;
        }
      } else if (type === "child") {
        if (isDiscount) {
          price =
            hours === 1
              ? settings.price_settings?.discount_child_1hour
              : settings.price_settings?.discount_child_2hour;
          name = `어린이 ${hours}시간권 (감면)`;
        } else {
          price =
            hours === 1
              ? settings.price_settings?.child1Hour
              : settings.price_settings?.child2Hour;
          name = `어린이 ${hours}시간권`;
        }
      } else if (type === "guardian") {
        price =
          hours === 1
            ? settings.price_settings?.guardian1Hour
            : settings.price_settings?.guardian2Hour;
        name = `보호자 ${hours}시간권`;
      }

      const item = {
        key: itemKey,
        type,
        hours,
        count,
        price,
        name,
        isDiscount,
      };

      if (existingIndex >= 0) {
        newCart[existingIndex] = item;
      } else {
        newCart.push(item);
      }
    }

    setCart(newCart);
  };

  // 특정 아이템의 개수 가져오기
  const getItemCount = (type, hours, isDiscount = false) => {
    const itemKey = `${type}${isDiscount ? "_discount" : ""}_${hours}h`;
    const item = cart.find((item) => item.key === itemKey);
    return item ? item.count : 0;
  };

  // 감면 입장권이 선택되었는지 확인
  const hasDiscountTickets = () => {
    return cart.some((item) => item.isDiscount);
  };

  // 이름 검증
  const validateName = (name) => {
    const nameRegex = /^[가-힣a-zA-Z\s]+$/;
    return nameRegex.test(name);
  };

  // 전화번호 포맷팅 및 검증
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, "");
    if (numbers.length > 11) return customerInfo.phone;
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  // 전화번호 검증
  const validatePhone = (phone) => {
    const numbers = phone.replace(/[^\d]/g, "");
    return numbers.length === 11 && /^010/.test(numbers);
  };

  // 이메일 검증
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 예약 처리 함수
  const handleReservation = async () => {
    // 결제 차단 설정 확인
    if (settings.payment_settings?.isPaymentBlocked) {
      showAlert(
        settings.payment_settings.blockMessage ||
          "현재 시스템 점검 중으로 예약이 일시 중단되었습니다.",
        "error"
      );
      return;
    }

    // 입력값 검증
    if (!selectedDate) {
      showAlert("이용 월을 선택해주세요.", "error");
      return;
    }

    if (cart.length === 0) {
      showAlert("최소 1개 이상의 입장권을 선택해주세요.", "error");
      return;
    }

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.email) {
      showAlert("고객 정보를 모두 입력해주세요.", "error");
      return;
    }

    if (!validateName(customerInfo.name)) {
      showAlert("이름은 한글 또는 영문만 입력 가능합니다.", "error");
      return;
    }

    if (!validatePhone(customerInfo.phone)) {
      showAlert(
        "전화번호는 010으로 시작하는 11자리 숫자를 입력해주세요.",
        "error"
      );
      return;
    }

    if (!validateEmail(customerInfo.email)) {
      showAlert("올바른 이메일 형식을 입력해주세요.", "error");
      return;
    }

    setIsLoading(true);
    setAlertMessage("");

    try {
      const totalAdultCount = cart
        .filter((item) => item.type === "adult")
        .reduce((sum, item) => sum + item.count, 0);
      const totalChildCount = cart
        .filter((item) => item.type === "child")
        .reduce((sum, item) => sum + item.count, 0);
      const totalGuardianCount = cart
        .filter((item) => item.type === "guardian")
        .reduce((sum, item) => sum + item.count, 0);

      const [year, month] = selectedDate.split("-");
      const lastDayOfMonth = new Date(
        parseInt(year),
        parseInt(month),
        0
      ).getDate();
      const visitDate = `${selectedDate}-${lastDayOfMonth
        .toString()
        .padStart(2, "0")}`;

      // 결제 방법에 따른 처리 분기
      if (paymentMethod === "bank") {
        // 무통장 입금: 기존처럼 바로 예약 생성
        const reservationData = {
          customer_name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email,
          visit_date: visitDate,
          adult_count: totalAdultCount,
          child_count: totalChildCount,
          guardian_count: totalGuardianCount,
          cart_items: cart,
          total_amount: calculateTotalAmount(),
          payment_method: paymentMethod,
          status: "결제 전",
        };

        if (isLoggedIn && userInfo) {
          (reservationData as any).user_id = userInfo.id || userInfo.userId;
        }

        const reservationResponse = await fetch("/api/reservations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reservationData),
        });

        const reservationResult = await reservationResponse.json();

        if (reservationResult.success) {
          showAlert(
            "예약이 완료되었습니다! 입금 안내 페이지로 이동합니다.",
            "success"
          );
          setTimeout(() => {
            window.location.href = `/bank-transfer?id=${reservationResult.data.reservationId}`;
          }, 1000);
        } else {
          showAlert(
            reservationResult.message || "예약 처리 중 오류가 발생했습니다.",
            "error"
          );
        }
      } else if (paymentMethod === "card") {
        // 카드 결제: 임시 예약 생성 후 결제 페이지로 이동
        const tempReservationResponse = await fetch("/api/temp-reservation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_name: customerInfo.name,
            phone: customerInfo.phone,
            email: customerInfo.email,
            visit_date: visitDate,
            adult_count: totalAdultCount,
            child_count: totalChildCount,
            guardian_count: totalGuardianCount,
            cart_items: cart,
            total_amount: calculateTotalAmount(),
            user_id:
              isLoggedIn && userInfo ? userInfo.id || userInfo.userId : null,
          }),
        });

        const tempResult = await tempReservationResponse.json();

        if (tempResult.success) {
          showAlert("결제 페이지로 이동합니다.", "success");

          // 빌게이트 결제 페이지로 폼 전송
          setTimeout(() => {
            const form = document.createElement("form");
            form.method = "POST";
            form.action =
              "https://mokpoplaypark.mycafe24.com/cafe24/PayInput.php"; //카페24용
            //form.action = "http://localhost/again/PayInput.php";

            const params = {
              orderId: tempResult.data.tempReservationId,
              amount: calculateTotalAmount(),
              userName: customerInfo.name,
              userEmail: customerInfo.email,
              userPhone: customerInfo.phone,
              itemName: `입장권 ${cart.reduce(
                (sum, item) => sum + item.count,
                0
              )}매`,
            };

            for (const key in params) {
              const input = document.createElement("input");
              input.type = "hidden";
              input.name = key;
              input.value = params[key];
              form.appendChild(input);
            }

            form.acceptCharset = "EUC-KR";

            document.body.appendChild(form);
            form.submit();
          }, 1000);
        } else {
          showAlert(
            tempResult.message || "임시 예약 생성 중 오류가 발생했습니다.",
            "error"
          );
        }
      }

      // 예상치 못한 결제 방법
      else {
        showAlert("올바르지 않은 결제 방법입니다.", "error");
      }
    } catch (error) {
      console.error("예약 처리 오류:", error);
      showAlert(
        "서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 금액 포맷팅 - 숫자만 반환
  const formatMoney = (amount) => {
    // 🆕 mounted 체크 추가
    if (!mounted) return "---";
    if (typeof amount !== "number" || isNaN(amount)) return "0원";

    // 🆕 try-catch 추가
    try {
      return new Intl.NumberFormat("ko-KR").format(amount) + "원";
    } catch {
      return amount.toString() + "원";
    }
  };

  return (
    <BaseLayout>
      {/* 🆕 화면 상단 플로팅 알림 */}
      {alertMessage && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 
          max-w-md w-full mx-4 p-4 rounded-lg shadow-lg border
          transition-all duration-300 ease-in-out
          ${
            alertType === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : alertType === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{alertMessage}</span>
            <button
              onClick={() => setAlertMessage("")}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-orange-50 to-blue-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              목포 플레이파크
            </h1>
            <p className="text-gray-600">
              전남 최초! 목포 유일의 모험형 스포츠 테마파크
            </p>
          </div>

          {/* 예약 폼 */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6 text-center">
              <h3 className="text-4xl font-bold text-gray-900 mb-3">
                입장권 예약
              </h3>
            </div>

            {/* 페이지 내부 알림 */}
            {alertMessage && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  alertType === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : alertType === "error"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{alertMessage}</span>
                  <button
                    onClick={() => setAlertMessage("")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* 날짜 선택 - 월 단위 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  이용 월 선택
                </label>
                <input
                  type="month"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={dateConfig.currentMonth}
                  max={dateConfig.maxMonth}
                  disabled={!dateConfig.isReady}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                />
              </div>

              {/* 입장권 선택 - 일반 요금과 감면 요금으로 구분 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  입장권 선택
                </label>

                <div className="space-y-6">
                  {/* 일반 요금 섹션 */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      일반 요금
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      {/* 어린이 카드 */}
                      <div className="border border-gray-200 rounded-xl p-4">
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900">
                            어린이
                          </h4>
                          <p className="text-sm text-gray-500">
                            {settings.price_settings?.childNote ||
                              "만7세~만13세 미만"}
                          </p>
                        </div>

                        {/* 어린이 1시간 */}
                        <div className="border-b border-gray-100 pb-4 mb-4">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-sm font-medium">
                                1시간 이용권
                              </span>
                              <p className="text-base font-bold text-blue-600">
                                {formatMoney(
                                  settings.price_settings?.child1Hour || 0
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() =>
                                  updateCart(
                                    "child",
                                    1,
                                    Math.max(
                                      0,
                                      getItemCount("child", 1, false) - 1
                                    ),
                                    false
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                −
                              </button>
                              <span className="text-lg font-bold text-gray-900 w-6 text-center">
                                {getItemCount("child", 1, false)}
                              </span>
                              <button
                                onClick={() =>
                                  updateCart(
                                    "child",
                                    1,
                                    getItemCount("child", 1, false) + 1,
                                    false
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 어린이 2시간 */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-sm font-medium">
                                2시간 이용권{" "}
                                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                  인기
                                </span>
                              </span>
                              <p className="text-base font-bold text-blue-600">
                                {formatMoney(
                                  settings.price_settings?.child2Hour || 0
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() =>
                                  updateCart(
                                    "child",
                                    2,
                                    Math.max(
                                      0,
                                      getItemCount("child", 2, false) - 1
                                    ),
                                    false
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                −
                              </button>
                              <span className="text-lg font-bold text-gray-900 w-6 text-center">
                                {getItemCount("child", 2, false)}
                              </span>
                              <button
                                onClick={() =>
                                  updateCart(
                                    "child",
                                    2,
                                    getItemCount("child", 2, false) + 1,
                                    false
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 성인 카드 */}
                      <div className="border border-gray-200 rounded-xl p-4">
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900">
                            청소년 및 성인
                          </h4>
                          <p className="text-sm text-gray-500">
                            {settings.price_settings?.adultNote ||
                              "만13세 이상"}
                          </p>
                        </div>

                        {/* 성인 1시간 */}
                        <div className="border-b border-gray-100 pb-4 mb-4">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-sm font-medium">
                                1시간 이용권
                              </span>
                              <p className="text-base font-bold text-orange-600">
                                {formatMoney(
                                  settings.price_settings?.adult1Hour || 0
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() =>
                                  updateCart(
                                    "adult",
                                    1,
                                    Math.max(
                                      0,
                                      getItemCount("adult", 1, false) - 1
                                    ),
                                    false
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                −
                              </button>
                              <span className="text-lg font-bold text-gray-900 w-6 text-center">
                                {getItemCount("adult", 1, false)}
                              </span>
                              <button
                                onClick={() =>
                                  updateCart(
                                    "adult",
                                    1,
                                    getItemCount("adult", 1, false) + 1,
                                    false
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 성인 2시간 */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-sm font-medium">
                                2시간 이용권{" "}
                                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                  인기
                                </span>
                              </span>
                              <p className="text-base font-bold text-orange-600">
                                {formatMoney(
                                  settings.price_settings?.adult2Hour || 0
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() =>
                                  updateCart(
                                    "adult",
                                    2,
                                    Math.max(
                                      0,
                                      getItemCount("adult", 2, false) - 1
                                    ),
                                    false
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                −
                              </button>
                              <span className="text-lg font-bold text-gray-900 w-6 text-center">
                                {getItemCount("adult", 2, false)}
                              </span>
                              <button
                                onClick={() =>
                                  updateCart(
                                    "adult",
                                    2,
                                    getItemCount("adult", 2, false) + 1,
                                    false
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 보호자 카드 */}
                      <div className="border border-gray-200 rounded-xl p-4">
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900">
                            보호자
                          </h4>
                          <p className="text-sm text-gray-500">
                            {settings.price_settings?.guardianNote ||
                              "놀이시설 이용불가"}
                          </p>
                        </div>

                        {/* 보호자 1시간 */}
                        <div className="border-b border-gray-100 pb-4 mb-4">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-sm font-medium">
                                1시간 입장권
                              </span>
                              <p className="text-base font-bold text-green-600">
                                {formatMoney(
                                  settings.price_settings?.guardian1Hour || 0
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() =>
                                  updateCart(
                                    "guardian",
                                    1,
                                    Math.max(0, getItemCount("guardian", 1) - 1)
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                −
                              </button>
                              <span className="text-lg font-bold text-gray-900 w-6 text-center">
                                {getItemCount("guardian", 1)}
                              </span>
                              <button
                                onClick={() =>
                                  updateCart(
                                    "guardian",
                                    1,
                                    getItemCount("guardian", 1) + 1
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 보호자 2시간 */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-sm font-medium">
                                2시간 이용권{" "}
                                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                  인기
                                </span>
                              </span>
                              <p className="text-base font-bold text-green-600">
                                {formatMoney(
                                  settings.price_settings?.guardian2Hour || 0
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() =>
                                  updateCart(
                                    "guardian",
                                    2,
                                    Math.max(0, getItemCount("guardian", 2) - 1)
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                −
                              </button>
                              <span className="text-lg font-bold text-gray-900 w-6 text-center">
                                {getItemCount("guardian", 2)}
                              </span>
                              <button
                                onClick={() =>
                                  updateCart(
                                    "guardian",
                                    2,
                                    getItemCount("guardian", 2) + 1
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 감면 요금 섹션 */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      감면 요금
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 어린이 감면 카드 */}
                      <div className="border border-gray-200 rounded-xl p-4">
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900">
                            어린이
                          </h4>
                          <p className="text-sm text-gray-500">
                            {settings.price_settings?.childNote ||
                              "만7세~만13세 미만"}
                          </p>
                        </div>

                        {/* 어린이 1시간 감면 */}
                        <div className="border-b border-gray-100 pb-4 mb-4">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-sm font-medium">
                                1시간 이용권
                              </span>
                              <p className="text-base font-bold text-blue-600">
                                {formatMoney(
                                  settings.price_settings
                                    ?.discount_child_1hour || 10000
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() =>
                                  updateCart(
                                    "child",
                                    1,
                                    Math.max(
                                      0,
                                      getItemCount("child", 1, true) - 1
                                    ),
                                    true
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                −
                              </button>
                              <span className="text-lg font-bold text-gray-900 w-6 text-center">
                                {getItemCount("child", 1, true)}
                              </span>
                              <button
                                onClick={() =>
                                  updateCart(
                                    "child",
                                    1,
                                    getItemCount("child", 1, true) + 1,
                                    true
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 어린이 2시간 감면 */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-sm font-medium">
                                2시간 이용권{" "}
                                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                  인기
                                </span>
                              </span>
                              <p className="text-base font-bold text-blue-600">
                                {formatMoney(
                                  settings.price_settings
                                    ?.discount_child_2hour || 20000
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() =>
                                  updateCart(
                                    "child",
                                    2,
                                    Math.max(
                                      0,
                                      getItemCount("child", 2, true) - 1
                                    ),
                                    true
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                −
                              </button>
                              <span className="text-lg font-bold text-gray-900 w-6 text-center">
                                {getItemCount("child", 2, true)}
                              </span>
                              <button
                                onClick={() =>
                                  updateCart(
                                    "child",
                                    2,
                                    getItemCount("child", 2, true) + 1,
                                    true
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 성인 감면 카드 */}
                      <div className="border border-gray-200 rounded-xl p-4">
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900">
                            청소년 및 성인
                          </h4>
                          <p className="text-sm text-gray-500">
                            {settings.price_settings?.adultNote ||
                              "만13세 이상"}
                          </p>
                        </div>

                        {/* 성인 1시간 감면 */}
                        <div className="border-b border-gray-100 pb-4 mb-4">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-sm font-medium">
                                1시간 이용권
                              </span>
                              <p className="text-base font-bold text-orange-600">
                                {formatMoney(
                                  settings.price_settings
                                    ?.discount_adult_1hour || 15000
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() =>
                                  updateCart(
                                    "adult",
                                    1,
                                    Math.max(
                                      0,
                                      getItemCount("adult", 1, true) - 1
                                    ),
                                    true
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                −
                              </button>
                              <span className="text-lg font-bold text-gray-900 w-6 text-center">
                                {getItemCount("adult", 1, true)}
                              </span>
                              <button
                                onClick={() =>
                                  updateCart(
                                    "adult",
                                    1,
                                    getItemCount("adult", 1, true) + 1,
                                    true
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 성인 2시간 감면 */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-sm font-medium">
                                2시간 이용권{" "}
                                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                  인기
                                </span>
                              </span>
                              <p className="text-base font-bold text-orange-600">
                                {formatMoney(
                                  settings.price_settings
                                    ?.discount_adult_2hour || 30000
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() =>
                                  updateCart(
                                    "adult",
                                    2,
                                    Math.max(
                                      0,
                                      getItemCount("adult", 2, true) - 1
                                    ),
                                    true
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                −
                              </button>
                              <span className="text-lg font-bold text-gray-900 w-6 text-center">
                                {getItemCount("adult", 2, true)}
                              </span>
                              <button
                                onClick={() =>
                                  updateCart(
                                    "adult",
                                    2,
                                    getItemCount("adult", 2, true) + 1,
                                    true
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 빈 공간 - 보호자는 감면 없음 */}
                      <div className="hidden md:block"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 선택한 입장권 목록 */}
              {cart.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">
                    선택한 입장권
                  </h4>
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.key}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-blue-700">
                          {item.name} × {item.count}매
                        </span>
                        <span className="font-semibold text-blue-800">
                          {formatMoney(item.price * item.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 감면 요금 대상자 안내 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h5 className="font-semibold text-yellow-800 mb-2">
                  감면 요금 대상자 (증빙 서류 지참 후 입장 시 현장에서 확인
                  필수)
                </h5>
                <ul className="space-y-2 text-sm text-yellow-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-semibold">목포 시민</span>
                      <p className="text-xs mt-0.5">
                        - 주민등록증 또는 운전면허증, 등본(발급일자 3개월 이내,
                        목포 주소)
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-semibold">국가유공자</span>
                      <p className="text-xs mt-0.5">
                        - 국가유공자증 또는 유족증
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-semibold">장애인</span>
                      <p className="text-xs mt-0.5">
                        - 장애인 복지카드 또는 증명서
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-semibold">기초생활 수급자</span>
                      <p className="text-xs mt-0.5">- 기초생활 수급자 증명서</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-semibold">한부모가족</span>
                      <p className="text-xs mt-0.5">- 한부모 증명서</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-semibold">다자녀</span>
                      <p className="text-xs mt-0.5">- 자녀 3인이상 가구</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* 총 금액 */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-900">
                    총 결제 금액
                  </span>
                  <span className="text-3xl font-bold text-orange-600">
                    {formatMoney(calculateTotalAmount())}
                  </span>
                </div>
              </div>

              {/* 고객 정보 입력 */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  예약자 정보
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="예약자 이름을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: formatPhoneNumber(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="010-1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              {/* 예약 버튼 */}
              <button
                onClick={handleReservation}
                disabled={isLoading} // ← 처리 중일 때만 비활성화
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xl font-bold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "예약 처리 중..."
                  : `${formatMoney(calculateTotalAmount())} 예약하기`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
