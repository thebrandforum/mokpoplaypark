"use client";

import { useState, useEffect } from "react";
import BaseLayout from "../../components/base-layout";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function ReservationCheckPage() {
  const [searchInfo, setSearchInfo] = useState({
    name: "",
    phone: "",
  });
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState(""); // 'success', 'error', 'info'
  const [cancellingId, setCancellingId] = useState(null); // 취소 처리 중인 예약 ID
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    reservation: null,
  }); // 취소 확인 모달

  // 🆕 취소 정책 설정 state 추가
  const [cancellationSettings, setCancellationSettings] = useState({
    defaultCancelType: "simple",
    showBothButtons: false,
    simpleCancelLabel: "단순취소",
    refundCancelLabel: "환불취소",
  });

  // 알림 표시 함수
  const showAlert = (message, type = "info") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 4000); // 4초 후 자동 숨김
  };

  // 로그인 상태 확인 및 자동 검색
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log("📋 설정 불러오기 시작...");
        const response = await fetch("/api/settings");
        const result = await response.json();

        if (result.success && result.data) {
          // 취소 정책 설정 적용
          if (result.data.cancellation_settings) {
            console.log(
              "✅ 취소 정책 설정 로드:",
              result.data.cancellation_settings
            );
            setCancellationSettings(result.data.cancellation_settings);
          }
        }
      } catch (error) {
        console.error("❌ 설정 로드 실패:", error);
      }
    };

    loadSettings();
  }, []);

  // URL 파라미터 확인 (취소 결과 처리)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cancelResult = urlParams.get("cancel");
    const cancelledReservationId = urlParams.get("reservationId");
    const errorCode = urlParams.get("errorCode");

    if (cancelResult) {
      if (cancelResult === "success") {
        showAlert("예약이 성공적으로 취소되었습니다.", "success");
        // URL에서 파라미터 제거
        window.history.replaceState({}, document.title, "/reservation-check");

        // 예약 목록 새로고침을 위해 페이지 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else if (cancelResult === "fail") {
        console.log("=== 취소 실패 처리 ===");
        console.log("에러코드:", errorCode);
        console.log("예약ID:", cancelledReservationId);

        // 에러코드 0505인 경우 자동으로 단순취소 처리
        if (errorCode === "0505" && cancelledReservationId) {
          // 먼저 예약 정보를 가져와서 전화번호 확인
          fetch(
            `/api/reservations-search?reservationId=${cancelledReservationId}`
          )
            .then((response) => response.json())
            .then((result) => {
              if (result.success && result.data && result.data.length > 0) {
                const reservationInfo = result.data[0];
                // 전화번호를 가져와서 단순취소 API 호출
                return fetch("/api/reservations/cancel", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    reservationId: cancelledReservationId,
                    customerPhone: reservationInfo.phone,
                    cancelType: "simple",
                    cancelReason: "pg_fail_0505",
                  }),
                });
              }
            })
            .then((response) => response.json())
            .then((result) => {
              if (result.success) {
                showAlert("예약이 취소되었습니다.", "success");
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              } else {
                showAlert(
                  "취소 처리에 실패했습니다. 고객센터에 문의해주세요.",
                  "error"
                );
              }
            })
            .catch((error) => {
              console.error("단순취소 처리 오류:", error);
              showAlert("취소 처리 중 오류가 발생했습니다.", "error");
            });
        } else {
          showAlert(
            "예약 취소에 실패했습니다. 고객센터에 문의해주세요.",
            "error"
          );
        }

        // URL에서 파라미터 제거
        window.history.replaceState({}, document.title, "/reservation-check");
      }
    }
  }, []);

  // 로그인 상태 확인 및 자동 검색
  useEffect(() => {
    const checkLoginAndLoadReservations = async () => {
      console.log("로그인 상태 확인 시작...");

      const token = localStorage.getItem("access_token");
      const userDataString = localStorage.getItem("user_info");

      console.log("토큰:", token);
      console.log("사용자 데이터:", userDataString);

      if (token && userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          console.log("파싱된 사용자 데이터:", userData);

          setUserInfo(userData);
          setIsLoggedIn(true);

          // 로그인된 경우 자동으로 예약 조회
          setIsLoading(true);
          const userId = userData.id || userData.userId;
          console.log("사용할 userId:", userId);

          const response = await fetch(
            `/api/reservations-search?user_id=${userId}&excludeDeleted=true`
          );
          const result = await response.json();
          console.log("예약 검색 결과:", result);

          if (result.success) {
            // API 응답 구조에 따라 데이터 추출
            let foundReservations = [];

            if (Array.isArray(result.data)) {
              // result.data가 직접 배열인 경우
              foundReservations = result.data;
            } else if (result.data && Array.isArray(result.data.reservations)) {
              // result.data.reservations가 배열인 경우
              foundReservations = result.data.reservations;
            }

            // 각 예약에 대해 티켓 정보 가져오기
            for (let reservation of foundReservations) {
              try {
                const ticketsResponse = await fetch(
                  `/api/tickets?reservationId=${reservation.id}`
                );
                const ticketsResult = await ticketsResponse.json();
                console.log(
                  `예약 ${reservation.id}의 티켓 조회 결과:`,
                  ticketsResult
                );

                if (ticketsResult.success && ticketsResult.data) {
                  reservation.tickets = ticketsResult.data;
                } else {
                  reservation.tickets = [];
                }
              } catch (error) {
                console.error("티켓 조회 오류:", error);
                reservation.tickets = [];
              }
            }

            console.log("찾은 예약들:", foundReservations);
            setReservations(foundReservations);
          } else {
            console.log("예약 검색 실패:", result.message);
            setReservations([]);
          }
          setSearchComplete(true);
          setIsLoading(false);
        } catch (error) {
          console.error("로그인 확인 오류:", error);
          setIsLoggedIn(false);
        }
      } else {
        console.log("로그인 정보 없음");
        setIsLoggedIn(false);
      }
    };

    checkLoginAndLoadReservations();
  }, []);

  // 전화번호 포맷팅
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, "");
    if (numbers.length > 11) return searchInfo.phone;

    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  // 예약 검색 - 수정된 검색 로직
  const handleSearch = async () => {
    if (!searchInfo.name.trim() || !searchInfo.phone.trim()) {
      showAlert("이름과 전화번호를 모두 입력해주세요.", "error");
      return;
    }

    setIsLoading(true);
    setSearchComplete(false);
    setAlertMessage(""); // 기존 알림 제거

    try {
      console.log("검색 시작:", {
        name: searchInfo.name,
        phone: searchInfo.phone,
      });

      // 전화번호에서 하이픈 제거
      const cleanPhone = searchInfo.phone.replace(/[^\d]/g, "");
      console.log("정리된 전화번호:", cleanPhone);

      // 이름과 전화번호로 검색
      const response = await fetch(
        `/api/reservations-search?name=${encodeURIComponent(
          searchInfo.name.trim()
        )}&phone=${encodeURIComponent(cleanPhone)}&excludeDeleted=true`
      );
      const result = await response.json();

      console.log("API 응답:", result);

      if (result.success) {
        let foundReservations = [];

        if (result.data && Array.isArray(result.data)) {
          // 직접 배열인 경우
          foundReservations = result.data;
        } else if (
          result.data &&
          result.data.reservations &&
          Array.isArray(result.data.reservations)
        ) {
          // reservations 속성 안에 있는 경우
          foundReservations = result.data.reservations;
        }

        // 각 예약에 대해 티켓 정보 가져오기
        for (let reservation of foundReservations) {
          try {
            const ticketsResponse = await fetch(
              `/api/tickets?reservationId=${reservation.id}`
            );
            const ticketsResult = await ticketsResponse.json();
            console.log(
              `예약 ${reservation.id}의 티켓 조회 결과:`,
              ticketsResult
            );

            if (ticketsResult.success && ticketsResult.data) {
              reservation.tickets = ticketsResult.data;
            } else {
              reservation.tickets = [];
            }
          } catch (error) {
            console.error("티켓 조회 오류:", error);
            reservation.tickets = [];
          }
        }

        setReservations(foundReservations);

        if (foundReservations.length === 0) {
          showAlert(
            "일치하는 예약을 찾을 수 없습니다. 이름과 전화번호를 정확히 입력해주세요.",
            "error"
          );
        } else {
          showAlert(
            `${foundReservations.length}개의 예약을 찾았습니다.`,
            "success"
          );
        }
      } else {
        setReservations([]);
        showAlert("일치하는 예약을 찾을 수 없습니다.", "error");
      }
    } catch (error) {
      console.error("검색 오류:", error);
      setReservations([]);
      showAlert("서버와 연결할 수 없습니다.", "error");
    } finally {
      setIsLoading(false);
      setSearchComplete(true);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const [cancelledTickets, setCancelledTickets] = useState({}); // 취소된 티켓 관리

  // 티켓 취소 상태 확인
  const isTicketCancelled = (reservationId, ticketNumber) => {
    return cancelledTickets[`${reservationId}-${ticketNumber}`] || false;
  };

  // 티켓 취소 함수 - 전체 예약 취소로 변경
  const handleCancelTicket = async (
    reservation,
    ticket,
    cancelType = "simple"
  ) => {
    console.log("취소할 예약:", reservation);
    console.log("선택한 티켓:", ticket);
    console.log("취소 타입:", cancelType);

    // 결제 완료된 카드 결제인 경우 빌게이트 전체취소
    if (
      reservation.payment_method === "card" &&
      reservation.transaction_id &&
      cancelType === "refund"
    ) {
      // 취소 확인
      if (
        !confirm(
          `전체 예약을 취소하시겠습니까?\n총 금액: ${new Intl.NumberFormat(
            "ko-KR"
          ).format(reservation.totalAmount || reservation.total_amount)}원`
        )
      ) {
        return;
      }

      console.log("빌게이트 전체취소 진행:", {
        totalAmount: reservation.totalAmount || reservation.total_amount,
        transactionId: reservation.transaction_id,
      });

      // 빌게이트 전체취소 페이지로 폼 전송
      const form = document.createElement("form");
      form.method = "POST";
      form.action =
        "https://mokpoplaypark.mycafe24.com/cafe24/CancelReturn.php"; // 카페24용
      //form.action = "http://localhost/again/CancelReturn.php";
      form.target = "_self";

      const params = {
        SERVICE_ID: "M2591189",
        SERVICE_CODE: "0900",
        ORDER_ID: reservation.id,
        ORDER_DATE: new Date()
          .toISOString()
          .replace(/[-:T.]/g, "")
          .slice(0, 14),
        TRANSACTION_ID: reservation.transaction_id,
        CANCEL_TYPE: "", // 전체취소
        RESERVATION_ID: reservation.id,
        INI_FILE: "C:/xampp1/htdocs/again/config/config.ini",
        // 취소 완료 후 돌아올 URL 추가
        RETURN_URL: `${window.location.origin}/reservation-check?cancel=success&reservationId=${reservation.id}`,
      };

      for (const key in params) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();

      return;
    }

    // 결제 전이거나 무통장 입금인 경우 - 모든 티켓 취소
    const confirmMessage =
      cancelType === "refund"
        ? `전체 예약을 환불 취소하시겠습니까?\n총 금액: ${new Intl.NumberFormat(
            "ko-KR"
          ).format(reservation.totalAmount || reservation.total_amount)}원`
        : `전체 예약을 취소하시겠습니까?\n\n취소 후에는 복구를 원할 시 고객센터로 연락바랍니다.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setCancellingId(reservation.id);

      // 모든 티켓을 한 번에 취소
      const response = await fetch("/api/reservations/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          customerPhone: reservation.phone,
          cancelType: cancelType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 🆕 취소 타입에 따른 메시지 분기
        const successMessage =
          cancelType === "refund"
            ? "예약이 환불 취소되었습니다."
            : "예약이 취소되었습니다.";
        showAlert(successMessage, "success");

        // 모든 티켓 상태 업데이트
        setReservations((prevReservations) =>
          prevReservations.map((res) => {
            if (res.id === reservation.id) {
              return {
                ...res,
                status: "취소",
                tickets: res.tickets.map((t) => ({
                  ...t,
                  status: "취소",
                  ticket_status: "취소",
                })),
              };
            }
            return res;
          })
        );
      } else {
        showAlert(`예약 취소 실패: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("예약 취소 오류:", error);
      showAlert("예약 취소 중 오류가 발생했습니다.", "error");
    } finally {
      setCancellingId(null);
    }
  };

  // 예약 취소 함수
  const handleCancelReservation = async (reservation) => {
    // 취소 가능 여부 확인 (입장완료된 예약은 취소 불가)
    if (reservation.entryStatus === "입장완료") {
      showAlert("이미 입장 완료된 예약은 취소할 수 없습니다.", "error");
      return;
    }

    // 거래번호 확인 (카드 결제인 경우)
    if (reservation.payment_method === "card" && !reservation.transaction_id) {
      showAlert(
        "거래번호가 없어 취소할 수 없습니다. 고객센터에 문의해주세요.",
        "error"
      );
      return;
    }

    // 이미 취소된 예약 확인
    if (reservation.status === "취소") {
      showAlert("이미 취소된 예약입니다.", "error");
      return;
    }

    // 취소 확인 모달 열기
    setCancelModal({ isOpen: true, reservation });
  };

  // 취소 확인 후 실제 취소 처리
  const confirmCancelReservation = async (cancelType = null) => {
    const reservation = cancelModal.reservation;
    if (!reservation) return;

    // 🆕 취소 타입 결정 (전달받은 값 또는 기본 설정값)
    const finalCancelType =
      cancelType || cancellationSettings.defaultCancelType;

    // 디버깅 로그 추가
    console.log("=== 취소 처리 디버깅 ===");
    console.log("예약 정보:", reservation);
    console.log("결제방법:", reservation.payment_method);
    console.log("거래번호:", reservation.transaction_id);
    console.log("취소 타입:", finalCancelType); // 🆕 추가
    console.log("조건 확인:", {
      isCard: reservation.payment_method === "card",
      hasTransactionId: !!reservation.transaction_id,
      shouldUseBillgate:
        reservation.payment_method === "card" && reservation.transaction_id,
      isRefundCancel: finalCancelType === "refund", // 🆕 추가
    });

    try {
      setCancellingId(reservation.id);

      // 카드 결제이고 환불 취소인 경우 빌게이트 취소 (🆕 finalCancelType 조건 추가)
      if (
        reservation.payment_method === "card" &&
        reservation.transaction_id &&
        finalCancelType === "refund"
      ) {
        // 빌게이트 환불 취소 페이지로 폼 전송
        const form = document.createElement("form");
        form.method = "POST";
        // form.action = 'http://php.mokpoplaypark.com/gogo/BillgatePay-PHP/CancelReturn.php' 카페24용
        form.action = "http://localhost/again/CancelReturn.php";
        form.target = "cancelWindow";

        const params = {
          SERVICE_ID: "M2591189",
          SERVICE_CODE: "0900",
          ORDER_ID: reservation.id,
          ORDER_DATE: new Date()
            .toISOString()
            .replace(/[-:T.]/g, "")
            .slice(0, 14),
          TRANSACTION_ID: reservation.transaction_id,
          CANCEL_TYPE: "",
          RESERVATION_ID: reservation.id,
          INI_FILE: "C:/xampp1/htdocs/again/config/config.ini",
          // 취소 완료 후 돌아올 URL 추가
          RETURN_URL: `${window.location.origin}/reservation-check?cancel=success&reservationId=${reservation.id}`,
        };

        // 디버깅 로그 추가
        console.log("=== 빌게이트 취소 파라미터 ===");
        console.log("전송할 params:", params);
        console.log("RESERVATION_ID:", params.RESERVATION_ID);
        console.log("ORDER_ID:", params.ORDER_ID);
        console.log("TRANSACTION_ID:", params.TRANSACTION_ID);

        for (const key in params) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = params[key];
          form.appendChild(input);
        }

        // 팝업 창 열기 (참조 저장)
        form.target = "_self"; // 현재 창에서 열기

        document.body.appendChild(form);
        form.submit();

        // 모달 닫기
        setCancelModal({ isOpen: false, reservation: null });

        return;
      }

      // 무통장 입금인 경우 기존 로직 유지
      const response = await fetch("/api/reservations/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          customerPhone: reservation.phone,
          cancelType: finalCancelType, // 🆕 취소 타입 전달
        }),
      });

      console.log("응답 상태:", response.status);
      const result = await response.json();
      console.log("응답 결과:", result);

      if (result.success) {
        // 🆕 취소 타입에 따른 성공 메시지 분기
        const successMessage =
          finalCancelType === "refund"
            ? "예약이 환불 취소되었습니다."
            : "예약이 취소되었습니다.";
        showAlert(successMessage, "success");

        // 예약 목록 갱신
        setReservations((prevReservations) =>
          prevReservations.map((res) =>
            res.id === reservation.id ? { ...res, status: "취소" } : res
          )
        );

        // 모달 닫기
        setCancelModal({ isOpen: false, reservation: null });
      } else {
        showAlert(`예약 취소 실패: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("예약 취소 오류:", error);
      showAlert(
        "예약 취소 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        "error"
      );
    } finally {
      setCancellingId(null);
    }
  };

  const [currentTicketIndexes, setCurrentTicketIndexes] = useState({});

  // 티켓 인덱스 관리 함수
  const getCurrentTicketIndex = (reservationId) =>
    currentTicketIndexes[reservationId] || 0;

  const setCurrentTicketIndex = (reservationId, index) => {
    setCurrentTicketIndexes((prev) => ({
      ...prev,
      [reservationId]: index,
    }));
  };

  // 상태별 색상
  const getStatusColor = (status) => {
    switch (status) {
      case "결제 완료":
      case "결제완료":
        return "bg-green-100 text-green-800";
      case "입장완료":
        return "bg-blue-100 text-blue-800";
      case "취소":
        return "bg-red-100 text-red-800";
      case "결제 전":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // 티켓 타입에서 정보 추출하는 함수
  const parseTicketType = (ticketType, isDiscount = false) => {
    if (!ticketType)
      return { category: "일반", duration: "1DAY", isDiscount: false };

    // isDiscount 매개변수를 사용
    const discountStatus = isDiscount;

    // 카테고리 추출
    let category = "일반";
    if (ticketType.includes("어린이")) category = "어린이";
    else if (ticketType.includes("성인") || ticketType.includes("어른"))
      category = "성인";
    else if (ticketType.includes("보호자")) category = "보호자";

    // 시간 추출
    let duration = "1DAY";
    if (ticketType.includes("2시간")) duration = "2시간";
    else if (ticketType.includes("1시간")) duration = "1시간";

    return { category, duration, isDiscount: discountStatus };
  };

  // 티켓 저장 함수
  const saveTicketAsImage = async (reservation, ticket, ticketIndex) => {
    try {
      // Canvas 생성
      const canvas = document.createElement("canvas");
      canvas.width = 400; // 실제 티켓 너비
      canvas.height = 600; // 실제 티켓 높이
      const ctx = canvas.getContext("2d");

      // roundRect 헬퍼 함수 (브라우저 호환성)
      const drawRoundRect = (x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(
          x + width,
          y + height,
          x + width - radius,
          y + height
        );
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      // 배경 (회색)
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 티켓 컨테이너 (흰색 배경, 둥근 모서리)
      ctx.fillStyle = "#ffffff";
      drawRoundRect(10, 10, 380, 580, 8);
      ctx.fill();

      // 상단 그라데이션 배경 (주황색)
      const gradient = ctx.createLinearGradient(10, 10, 390, 200);
      gradient.addColorStop(0, "#FF6B35");
      gradient.addColorStop(1, "#F7931E");
      ctx.fillStyle = gradient;
      drawRoundRect(10, 10, 380, 190, 8);
      ctx.fill();

      // 🆕 직원 예약 표시 - STF로 시작하는 경우
      const reservationId = reservation.reservationId || reservation.id;
      if (reservationId && reservationId.startsWith("STF")) {
        // 파란색 배경 배지
        ctx.fillStyle = "#2563eb"; // bg-blue-600
        ctx.beginPath();
        ctx.roundRect(30, 30, 60, 24, 12); // 왼쪽 상단에 위치
        ctx.fill();

        // 흰색 텍스트
        ctx.fillStyle = "#ffffff";
        ctx.font =
          'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("직원용", 60, 46); // 배지 중앙에 텍스트
      }

      // 티켓 타입 파싱 (기존 코드 계속...)
      const ticketInfo = parseTicketType(
        ticket.ticket_type,
        ticket.is_discount
      );

      // 예약시간
      ctx.fillStyle = "#ffffff";
      ctx.font =
        '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(
        `예약일시: ${formatDateTime(
          reservation.createdAt || reservation.created_at
        )}`,
        200,
        80
      );

      // 티켓 제목
      ctx.font =
        'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const discountText = ticketInfo.isDiscount ? "[감면] " : "[일반] ";
      const ticketTitle = `${discountText}${ticketInfo.category} ${ticketInfo.duration} 이용권`;
      ctx.fillText(ticketTitle, 200, 110);

      // 이용월
      ctx.font =
        '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const formatYearMonth = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return `${date.getFullYear()}.${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
      };
      ctx.fillText(
        `이용월: ${formatYearMonth(reservation.visitDate)}`,
        200,
        150
      );

      // 점선 구분선
      ctx.strokeStyle = "#f5f5f5";
      ctx.lineWidth = 1;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(10, 200);
      ctx.lineTo(390, 200);
      ctx.stroke();
      ctx.setLineDash([]);

      // QR 코드 배경
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 2;
      drawRoundRect(100, 240, 200, 200, 8);
      ctx.fill();
      ctx.stroke();

      // QR 코드 이미지 로드 및 그리기
      const qrData =
        ticket.qr_code ||
        `${reservation.reservationId || reservation.id}-T${
          ticket.ticket_number || ticket.number || ticketIndex + 1
        }`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        qrData
      )}`;

      const qrImage = new Image();
      qrImage.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
        qrImage.src = qrUrl;
      });

      ctx.drawImage(qrImage, 110, 250, 180, 180);

      // 예약 정보
      ctx.fillStyle = "#6b7280";
      ctx.font =
        '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(
        `예약번호: ${reservation.reservationId || reservation.id}`,
        200,
        470
      );
      ctx.fillText(
        `예약자: ${reservation.customerName} (${reservation.phone})`,
        200,
        490
      );

      // 금액 정보
      ctx.fillText(
        `결제금액: ${new Intl.NumberFormat("ko-KR").format(
          reservation.totalAmount || 0
        )}원`,
        200,
        510
      );

      // 상태 표시
      const ticketStatus = ticket.status || ticket.ticket_status || "결제 전";
      let statusBgColor = "#f3f4f6";
      let statusTextColor = "#4b5563";

      if (ticketStatus === "취소" || ticketStatus === "취소됨") {
        statusBgColor = "#fee2e2";
        statusTextColor = "#991b1b";
      } else if (ticketStatus === "결제완료") {
        statusBgColor = "#dcfce7";
        statusTextColor = "#166534";
      } else if (ticketStatus === "결제 전") {
        statusBgColor = "#fef3c7";
        statusTextColor = "#92400e";
      }

      // 상태 배지 그리기
      ctx.fillStyle = statusBgColor;
      drawRoundRect(120, 520, 70, 25, 12);
      ctx.fill();
      ctx.fillStyle = statusTextColor;
      ctx.font =
        'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(ticketStatus, 155, 537);

      // 입장 상태 (결제완료인 경우만)
      if (ticketStatus === "결제완료") {
        const entryStatus =
          ticket.entry_status === "입장완료" ? "입장완료" : "입장 전";
        const entryBgColor =
          ticket.entry_status === "입장완료" ? "#dbeafe" : "#f3f4f6";
        const entryTextColor =
          ticket.entry_status === "입장완료" ? "#1e40af" : "#4b5563";

        ctx.fillStyle = entryBgColor;
        drawRoundRect(210, 520, 70, 25, 12);
        ctx.fill();
        ctx.fillStyle = entryTextColor;
        ctx.font =
          'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(entryStatus, 245, 537);
      }

      // 취소된 티켓 오버레이
      if (ticketStatus === "취소" || ticketStatus === "취소됨") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        drawRoundRect(10, 10, 380, 580, 8);
        ctx.fill();

        // 취소 안내
        ctx.fillStyle = "#ffffff";
        drawRoundRect(100, 250, 200, 80, 8);
        ctx.fill();

        ctx.fillStyle = "#dc2626";
        ctx.font =
          'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("취소된 티켓", 200, 280);

        ctx.fillStyle = "#6b7280";
        ctx.font =
          '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText("이 티켓은 취소되었습니다", 200, 305);
      }

      // Canvas를 이미지로 변환하여 다운로드
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `목포플레이파크_티켓_${
          reservation.reservationId || reservation.id
        }_${ticketIndex + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showAlert("티켓이 저장되었습니다.", "success");
      }, "image/png");
    } catch (error) {
      console.error("티켓 저장 오류:", error);
      showAlert("티켓 저장에 실패했습니다. 다시 시도해주세요.", "error");
    }
  };

  // 월 포맷팅 (2025-01-31 → 2025년 01월)
  const formatMonth = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}월`;
  };

  // 날짜시간 포맷팅
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}월 ${date
      .getDate()
      .toString()
      .padStart(2, "0")}일 ${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  // 총 인원 계산
  const getTotalPeople = (reservation) => {
    if (reservation.cartItems && reservation.cartItems.length > 0) {
      // 새로운 장바구니 형태
      return reservation.cartItems.reduce(
        (total, item) => total + item.count,
        0
      );
    } else {
      // 기존 형태
      return (
        (reservation.adultCount || 0) +
        (reservation.childCount || 0) +
        (reservation.guardianCount || 0)
      );
    }
  };

  // generateTicketsFromReservation 함수 수정
  function generateTicketsFromReservation(res) {
    let generatedTickets = [];
    let ticketNumber = 1;

    // 예약의 실제 상태를 사용
    const reservationStatus = res.status || "결제 전";

    if (res.cartItems && res.cartItems.length > 0) {
      res.cartItems.forEach((item) => {
        for (let i = 0; i < item.count; i++) {
          // item의 isDiscount 정보를 직접 사용
          const isDiscount = item.isDiscount || false;

          generatedTickets.push({
            id: `temp-${res.id}-${ticketNumber}`,
            number: ticketNumber++,
            ticket_type: item.name,
            category:
              item.name.includes("어른") || item.name.includes("성인")
                ? "어른"
                : item.name.includes("청소년") || item.name.includes("어린이")
                ? "어린이"
                : item.name.includes("보호자")
                ? "보호자"
                : "일반",
            duration: item.name.includes("2시간")
              ? "2시간"
              : item.name.includes("1시간")
              ? "1시간"
              : "1DAY",
            status: reservationStatus,
            ticket_status: reservationStatus,
            price: Math.floor(item.price / item.count),
            entry_status: res.entry_status || "입장_전",
            isDiscount: isDiscount, // item의 isDiscount 사용
          });
        }
      });
    } else {
      // 기존 방식
      for (let i = 0; i < (res.adultCount || 0); i++) {
        generatedTickets.push({
          id: `temp-${res.id}-${ticketNumber}`,
          number: ticketNumber++,
          ticket_type: "[일반] 성인 이용권",
          category: "어른",
          duration: "1DAY",
          status: reservationStatus,
          ticket_status: reservationStatus,
          entry_status: res.entry_status || "입장_전",
          isDiscount: false,
        });
      }

      for (let i = 0; i < (res.childCount || 0); i++) {
        generatedTickets.push({
          id: `temp-${res.id}-${ticketNumber}`,
          number: ticketNumber++,
          ticket_type: "[일반] 어린이 이용권",
          category: "어린이",
          duration: "1DAY",
          status: reservationStatus,
          ticket_status: reservationStatus,
          entry_status: res.entry_status || "입장_전",
          isDiscount: false,
        });
      }

      for (let i = 0; i < (res.guardianCount || 0); i++) {
        generatedTickets.push({
          id: `temp-${res.id}-${ticketNumber}`,
          number: ticketNumber++,
          ticket_type: "보호자 이용권",
          category: "보호자",
          duration: "1DAY",
          status: reservationStatus,
          ticket_status: reservationStatus,
          entry_status: res.entry_status || "입장_전",
          isDiscount: false,
        });
      }
    }

    return generatedTickets;
  }

  return (
    <BaseLayout>
      <div className="py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              예약 확인
            </h1>
            {isLoggedIn ? (
              <p className="text-sm sm:text-base text-gray-600">
                안녕하세요,{" "}
                <span className="font-semibold text-orange-600">
                  {userInfo?.name}
                </span>
                님! 회원님의 예약 내역입니다.
              </p>
            ) : (
              <p className="text-sm sm:text-base text-gray-600">
                예약자 이름과 전화번호를 입력하여 예약 내역을 확인하세요
              </p>
            )}
          </div>

          {/* 페이지 내부 알림 */}
          {alertMessage && (
            <div
              className={`mb-4 p-4 rounded-lg border ${
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
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 취소 확인 모달 */}
          {cancelModal.isOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[9999] flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative z-[10000]">
                <div className="text-center">
                  {/* 경고 아이콘 */}
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    예약을 취소하시겠습니까?
                  </h3>

                  {cancelModal.reservation && (
                    <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">예약번호:</span>{" "}
                        {cancelModal.reservation.reservationId ||
                          cancelModal.reservation.id}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">예약자명:</span>{" "}
                        {cancelModal.reservation.customerName}
                      </p>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">입장권:</span>
                        {cancelModal.reservation.cartItems &&
                        cancelModal.reservation.cartItems.length > 0 ? (
                          <span className="ml-1">
                            {cancelModal.reservation.cartItems.map(
                              (item, index) => (
                                <span key={index}>
                                  {item.name} {item.count}매
                                  {index <
                                  cancelModal.reservation.cartItems.length - 1
                                    ? ", "
                                    : ""}
                                </span>
                              )
                            )}
                          </span>
                        ) : (
                          <span className="ml-1">
                            {cancelModal.reservation.adultCount > 0 &&
                              `성인 ${cancelModal.reservation.adultCount}명`}
                            {cancelModal.reservation.adultCount > 0 &&
                              cancelModal.reservation.childCount > 0 &&
                              ", "}
                            {cancelModal.reservation.childCount > 0 &&
                              `어린이 ${cancelModal.reservation.childCount}명`}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">결제금액:</span>{" "}
                        {new Intl.NumberFormat("ko-KR").format(
                          cancelModal.reservation.totalAmount
                        )}
                        원
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-red-600 mb-6">
                    취소 후에는 복구를 원할 시 고객센터로 연락바랍니다.
                  </p>

                  <div className="flex space-x-3">
                    <button
                      onClick={() =>
                        setCancelModal({ isOpen: false, reservation: null })
                      }
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      돌아가기
                    </button>
                    {/* 🆕 설정에 따른 버튼 표시 */}
                    {cancellationSettings.showBothButtons ? (
                      <>
                        <button
                          onClick={() => confirmCancelReservation("simple")}
                          disabled={
                            cancellingId === cancelModal.reservation?.id
                          }
                          className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingId === cancelModal.reservation?.id
                            ? "처리중..."
                            : cancellationSettings.simpleCancelLabel}
                        </button>
                        <button
                          onClick={() => confirmCancelReservation("refund")}
                          disabled={
                            cancellingId === cancelModal.reservation?.id
                          }
                          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingId === cancelModal.reservation?.id
                            ? "처리중..."
                            : cancellationSettings.refundCancelLabel}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => confirmCancelReservation()}
                        disabled={cancellingId === cancelModal.reservation?.id}
                        className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          cancellationSettings.defaultCancelType === "simple"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        {cancellingId === cancelModal.reservation?.id
                          ? "처리중..."
                          : cancellationSettings.defaultCancelType === "simple"
                          ? cancellationSettings.simpleCancelLabel
                          : cancellationSettings.refundCancelLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 비회원 검색 폼 - 모바일 2열 그리드 */}
          {!isLoggedIn && (
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
              <div className="space-y-4">
                {/* 모바일에서 2열 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      예약자 이름
                    </label>
                    <input
                      type="text"
                      value={searchInfo.name}
                      onChange={(e) =>
                        setSearchInfo({ ...searchInfo, name: e.target.value })
                      }
                      onKeyPress={handleKeyPress}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="예약시 입력한 이름"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={searchInfo.phone}
                      onChange={(e) =>
                        setSearchInfo({
                          ...searchInfo,
                          phone: formatPhoneNumber(e.target.value),
                        })
                      }
                      onKeyPress={handleKeyPress}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-base sm:text-lg font-bold py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "검색 중..." : "예약 확인"}
                </button>
              </div>
            </div>
          )}

          {/* 검색 결과 */}
          {searchComplete && (
            <div className="space-y-4">
              {reservations.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 sm:p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    예약 내역이 없습니다
                  </h3>
                  <p className="text-sm text-gray-600">
                    입력하신 정보로 예약을 찾을 수 없습니다.
                    <br />
                    이름과 전화번호를 다시 확인해주세요.
                  </p>
                </div>
              ) : (
                reservations.map((reservation) => {
                  console.log("=== 예약 정보 확인 ===");
                  console.log("예약 ID:", reservation.id);
                  console.log("거래번호:", reservation.transaction_id);
                  console.log("결제방법:", reservation.payment_method);
                  console.log("전체 예약 데이터:", reservation);
                  console.log("==================");

                  // DB에서 가져온 티켓 사용 (없으면 기존 방식으로 생성)
                  const tickets =
                    reservation.tickets && reservation.tickets.length > 0
                      ? reservation.tickets
                      : generateTicketsFromReservation(reservation);

                  const currentTicketIndex = getCurrentTicketIndex(
                    reservation.id
                  );

                  // 티켓 정보 파싱
                  const currentTicket =
                    tickets[currentTicketIndex] || tickets[0];
                  const ticketInfo = parseTicketType(
                    currentTicket.ticket_type,
                    currentTicket.is_discount
                  );

                  // 이용 시간 정보 가져오기
                  const getTicketDuration = (ticket) => {
                    const info = parseTicketType(
                      ticket.ticket_type,
                      ticket.is_discount
                    );
                    return `${info.duration} 이용권`;
                  };

                  // 날짜 형식 (년.월)
                  const formatYearMonth = (dateString) => {
                    if (!dateString) return "-";
                    const date = new Date(dateString);
                    return `${date.getFullYear()}.${(date.getMonth() + 1)
                      .toString()
                      .padStart(2, "0")}`;
                  };

                  const handlePrevTicket = () => {
                    const newIndex =
                      (currentTicketIndex - 1 + tickets.length) %
                      tickets.length;
                    setCurrentTicketIndex(reservation.id, newIndex);
                  };

                  const handleNextTicket = () => {
                    const newIndex = (currentTicketIndex + 1) % tickets.length;
                    setCurrentTicketIndex(reservation.id, newIndex);
                  };

                  const qrData =
                    currentTicket.qr_code ||
                    `${reservation.reservationId || reservation.id}-T${
                      currentTicket.ticket_number ||
                      currentTicket.number ||
                      currentTicketIndex + 1
                    }`;
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    qrData
                  )}`;

                  return (
                    <div
                      key={reservation.id}
                      id={`ticket-${reservation.id}`}
                      className="relative bg-white rounded-lg shadow-lg overflow-hidden mb-6"
                      style={{ maxWidth: "400px", margin: "0 auto 24px" }}
                    >
                      {/* 여러 티켓이 있을 때만 화살표 표시 */}
                      {tickets.length > 1 && (
                        <>
                          <button
                            onClick={handlePrevTicket}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all"
                          >
                            <ChevronLeftIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleNextTicket}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all"
                          >
                            <ChevronRightIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {/* 티켓 톱니 모양 효과 */}
                      <div className="absolute left-0 top-1/2 w-6 h-6 bg-gray-100 rounded-full transform -translate-x-3 -translate-y-1/2"></div>
                      <div className="absolute right-0 top-1/2 w-6 h-6 bg-gray-100 rounded-full transform translate-x-3 -translate-y-1/2"></div>

                      {/* 직원 예약 표시 - STF로 시작하는 경우 */}
                      {(
                        reservation.reservationId || reservation.id
                      )?.startsWith("STF") && (
                        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full z-10">
                          <span className="text-xs font-bold">직원용</span>
                        </div>
                      )}

                      {/* 티켓 번호 */}
                      <div className="absolute top-4 right-4 bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-xs text-white font-medium">
                          {currentTicket.qr_code ||
                            `${reservation.reservationId || reservation.id}-${
                              currentTicket.ticket_number ||
                              currentTicket.number ||
                              1
                            }`}
                        </span>
                      </div>

                      {/* 티켓 상단 */}
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-center relative">
                        {/* 예약 시간 추가 */}
                        <div className="text-white text-sm font-medium mb-2">
                          예약일시:{" "}
                          {formatDateTime(
                            reservation.createdAt || reservation.created_at
                          )}
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3">
                          {ticketInfo.isDiscount ? "[감면] " : "[일반] "}
                          {ticketInfo.category}{" "}
                          {getTicketDuration(currentTicket)}
                        </h3>
                        <div className="text-white text-sm font-medium">
                          <span>
                            이용월: {formatYearMonth(reservation.visitDate)}
                          </span>
                        </div>

                        {/* 점선 구분선 */}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1 bg-repeat-x"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(90deg, transparent, transparent 10px, #f5f5f5 10px, #f5f5f5 20px)",
                          }}
                        ></div>
                      </div>

                      {/* 티켓 하단 */}
                      <div className="p-6 text-center bg-white">
                        {/* QR코드 */}
                        <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg mb-4">
                          <img
                            src={qrUrl}
                            alt="입장 QR코드"
                            className="w-48 h-48"
                          />
                        </div>

                        {/* 추가 정보 */}
                        <div className="text-xs text-gray-500 space-y-1 mb-3">
                          <p>
                            예약번호:{" "}
                            {reservation.reservationId || reservation.id}
                          </p>
                          <p>
                            예약자: {reservation.customerName} (
                            {reservation.phone})
                          </p>
                          {/* 금액 정보 추가 */}
                          <p>
                            결제금액:{" "}
                            {new Intl.NumberFormat("ko-KR").format(
                              reservation.totalAmount || 0
                            )}
                            원
                          </p>
                        </div>

                        {/* 상태 표시 */}
                        <div className="flex justify-center gap-2 mb-3">
                          {/* 티켓 상태 표시 */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              currentTicket.status === "취소됨" ||
                              currentTicket.ticket_status === "취소"
                                ? "bg-red-100 text-red-800"
                                : currentTicket.ticket_status === "결제 전" ||
                                  currentTicket.status === "결제 전"
                                ? "bg-yellow-100 text-yellow-800"
                                : currentTicket.ticket_status === "결제완료" ||
                                  currentTicket.ticket_status === "결제 완료"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {(
                              currentTicket.status ||
                              currentTicket.ticket_status ||
                              "결제 전"
                            ).replace("결제 완료", "결제완료")}
                          </span>

                          {/* 결제완료 상태일 때만 입장 상태 표시 */}
                          {currentTicket.ticket_status?.replace(/\s/g, "") ===
                            "결제완료" && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                currentTicket.entry_status === "입장완료"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {currentTicket.entry_status === "입장완료"
                                ? "입장완료"
                                : "입장 전"}
                            </span>
                          )}
                        </div>

                        {/* 페이지 인디케이터 */}
                        {tickets.length > 1 && (
                          <div className="mt-4 flex justify-center gap-1">
                            {tickets.map((_, index) => (
                              <button
                                key={index}
                                onClick={() =>
                                  setCurrentTicketIndex(reservation.id, index)
                                }
                                className={`w-2 h-2 rounded-full transition-all ${
                                  index === currentTicketIndex
                                    ? "bg-orange-500 w-6"
                                    : "bg-gray-300 hover:bg-gray-400"
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* 액션 버튼 */}
                        {currentTicket.status !== "취소" &&
                          currentTicket.ticket_status !== "취소" && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() =>
                                    saveTicketAsImage(
                                      reservation,
                                      currentTicket,
                                      currentTicketIndex
                                    )
                                  }
                                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                  티켓 저장
                                </button>
                                {currentTicket.entry_status !== "입장완료" && (
                                  <>
                                    {cancellationSettings.showBothButtons ? (
                                      // 두 버튼 모두 표시
                                      <>
                                        <button
                                          onClick={() =>
                                            handleCancelTicket(
                                              reservation,
                                              currentTicket,
                                              "simple"
                                            )
                                          }
                                          disabled={
                                            cancellingId === currentTicket.id
                                          }
                                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                          {cancellingId === currentTicket.id
                                            ? "처리중..."
                                            : "전체 티켓 취소"}
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleCancelTicket(
                                              reservation,
                                              currentTicket,
                                              "refund"
                                            )
                                          }
                                          disabled={
                                            cancellingId === currentTicket.id
                                          }
                                          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                          {cancellingId === currentTicket.id
                                            ? "처리중..."
                                            : "전체 티켓 취소"}
                                        </button>
                                      </>
                                    ) : (
                                      // 기본 설정에 따라 단일 버튼 표시
                                      <button
                                        onClick={() =>
                                          handleCancelTicket(
                                            reservation,
                                            currentTicket,
                                            cancellationSettings.defaultCancelType
                                          )
                                        }
                                        disabled={
                                          cancellingId === currentTicket.id
                                        }
                                        className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${
                                          cancellationSettings.defaultCancelType ===
                                          "simple"
                                            ? "bg-yellow-500 hover:bg-yellow-600"
                                            : "bg-red-500 hover:bg-red-600"
                                        }`}
                                      >
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                        {cancellingId === currentTicket.id
                                          ? "처리중..."
                                          : "전체 티켓 취소"}
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* 취소된 티켓 안내 */}
                      {(currentTicket.status === "취소됨" ||
                        currentTicket.status === "취소" ||
                        currentTicket.ticket_status === "취소") && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="bg-white p-4 rounded-lg text-center">
                            <p className="text-lg font-bold text-red-600 mb-2">
                              취소된 티켓
                            </p>
                            <p className="text-sm text-gray-600">
                              이 티켓은 취소되었습니다
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </BaseLayout>
  );
}
