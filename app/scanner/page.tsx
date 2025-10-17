"use client";
import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

export default function QRScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [reservationInfo, setReservationInfo] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null);
  const [isCheckinProcessing, setIsCheckinProcessing] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);

  // PWA 관련 상태
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Hydration 문제 해결을 위한 상태
  const [mounted, setMounted] = useState(false);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // 컴포넌트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // QR 리더 초기화
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    // 클라이언트에서만 초기화
    codeReaderRef.current = new BrowserMultiFormatReader();

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [mounted]);

  // PWA 설치 이벤트 리스너
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    const handleAppInstalled = () => {
      console.log("PWA가 설치되었습니다!");
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [mounted]);

  // PWA 설치 함수
  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("사용자가 PWA 설치를 승인했습니다");
    } else {
      console.log("사용자가 PWA 설치를 거부했습니다");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const startScanning = async () => {
    if (!codeReaderRef.current) {
      setError("목포 플레이파크가 초기화되지 않았습니다.");
      return;
    }
    try {
      setError(null);
      setReservationInfo(null);
      setValidationStatus(null);
      setCheckinResult(null);
      setIsScanning(true);
      const videoDevices = await codeReaderRef.current.listVideoInputDevices();

      if (videoDevices.length === 0) {
        throw new Error("카메라를 찾을 수 없습니다.");
      }
      const backCamera =
        videoDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("rear")
        ) || videoDevices[0];
      console.log("선택된 카메라:", backCamera.label);
      await codeReaderRef.current.decodeFromVideoDevice(
        backCamera.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            console.log("QR 코드 스캔 성공:", result.getText());
            setScanResult(result.getText());
            handleQRScan(result.getText());
            stopScanning();
          }
          if (error && error.name !== "NotFoundException") {
            console.error("스캔 오류:", error);
          }
        }
      );
    } catch (err) {
      console.error("스캔 시작 오류:", err);
      setError(`카메라 접근 실패: ${err.message}`);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

  // QR 데이터에서 예약번호와 티켓번호 추출하는 함수
  const extractReservationAndTicket = (qrData) => {
    console.log("QR 데이터 분석:", qrData);

    // ADV250721102992-T1 또는 STF250820150457-T1 형식에서 예약번호와 티켓번호 추출
    const ticketMatch = qrData.match(/(ADV|STF)\d+-T(\d+)/i);
    if (ticketMatch) {
      const reservationId = ticketMatch[0].split("-")[0].toUpperCase();
      const ticketNumber = parseInt(ticketMatch[2]);
      console.log("티켓 QR 감지:", reservationId, "티켓번호:", ticketNumber);
      return {
        reservationId: reservationId,
        ticketNumber: ticketNumber,
      };
    }

    // URL 형식에서 추출
    if (qrData.includes("/checkin/")) {
      const match = qrData.match(/\/checkin\/([A-Z0-9]+)(?:-T(\d+))?/);
      if (match) {
        return {
          reservationId: match[1],
          ticketNumber: match[2] ? parseInt(match[2]) : null,
        };
      }
    }

    // 기존 예약번호만 있는 경우 (ADV 또는 STF)
    const reservationMatch = qrData.match(/(ADV|STF)\d+/i);
    if (reservationMatch) {
      console.log("예약 QR 감지:", reservationMatch[0]);
      return {
        reservationId: reservationMatch[0].toUpperCase(),
        ticketNumber: null,
      };
    }

    console.log("QR 형식을 인식할 수 없음");
    return null;
  };

  // 티켓 타입 표시 함수 (감면/일반 구분)
  const formatTicketType = (ticket) => {
    if (!ticket) return "";

    // is_discount 필드가 있으면 사용
    if (ticket.is_discount !== undefined) {
      const prefix = ticket.is_discount ? "[감면] " : "[일반] ";
      return prefix + ticket.ticket_type;
    }

    // is_discount 필드가 없으면 ticket_type에서 판단
    if (ticket.ticket_type.includes("(감면)")) {
      return "[감면] " + ticket.ticket_type;
    }

    return "[일반] " + ticket.ticket_type;
  };

  // cartItem 이름 표시 함수 (감면/일반 구분)
  const formatCartItemName = (item) => {
    if (!item) return "";

    // isDiscount 필드가 있으면 사용
    if (item.isDiscount !== undefined) {
      const prefix = item.isDiscount ? "[감면] " : "[일반] ";
      return prefix + item.name.replace("(감면)", "").trim();
    }

    // 이름에 (감면)이 포함되어 있으면
    if (item.name.includes("(감면)")) {
      return "[감면] " + item.name.replace("(감면)", "").trim();
    }

    return "[일반] " + item.name;
  };

  // QR 스캔 후 예약 정보 조회
  const handleQRScan = async (qrData) => {
    try {
      const extracted = extractReservationAndTicket(qrData);
      if (!extracted) {
        setValidationStatus({
          isValid: false,
          message: "QR 코드 형식을 인식할 수 없습니다.",
          type: "error",
        });
        return;
      }

      const { reservationId, ticketNumber } = extracted;
      console.log(
        "예약 정보 조회 시작:",
        reservationId,
        "티켓번호:",
        ticketNumber
      );

      // API 호출에 티켓 번호 포함
      const url = ticketNumber
        ? `/api/checkin?id=${reservationId}&ticketNumber=${ticketNumber}`
        : `/api/checkin?id=${reservationId}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setReservationInfo(result.data);

        if (result.data.canCheckin) {
          setValidationStatus({
            isValid: true,
            message: "입장 가능한 예약입니다.",
            type: "success",
          });
        } else {
          // validationReason을 우선 사용
          let message =
            result.data.validationReason || "입장할 수 없는 예약입니다.";

          // validationReason이 없을 경우에만 상태별 메시지 설정
          if (!result.data.validationReason) {
            if (result.data.entryStatus === "입장완료") {
              message = "이미 입장 처리된 예약입니다.";
            } else if (result.data.status === "취소") {
              message = "취소된 예약입니다.";
            } else if (
              result.data.status === "결제 전" ||
              result.data.status === "결제대기"
            ) {
              message = "결제가 완료되지 않은 예약입니다.";
            }
          }

          setValidationStatus({
            isValid: false,
            message: message,
            type: "error",
          });
        }

        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      } else {
        setValidationStatus({
          isValid: false,
          message: result.message || "예약을 찾을 수 없습니다.",
          type: "error",
        });
        setReservationInfo(null);
      }
    } catch (err) {
      console.error("예약 조회 오류:", err);
      setValidationStatus({
        isValid: false,
        message: "예약 조회 중 오류가 발생했습니다.",
        type: "error",
      });
      setReservationInfo(null);
    }
  };

  // 수동 입장 처리
  const handleManualCheckin = async (isFullCheckin = false) => {
    if (!reservationInfo || !validationStatus?.isValid) return;

    setIsCheckinProcessing(true);

    try {
      console.log("수동 입장 처리 시작:", reservationInfo.reservationId);

      // 특정 티켓만 입장 처리할 경우 ticketIds 포함
      const requestBody: any = {
        reservationId: reservationInfo.reservationId,
        qrData: scanResult,
      };

      // 전체 입장이 아니고 스캔된 티켓이 있을 때만 ticketIds 추가
      if (!isFullCheckin && reservationInfo.scannedTicket) {
        requestBody.ticketIds = [reservationInfo.scannedTicket.id];
      }

      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        setCheckinResult({
          success: true,
          message: result.message || "입장 처리가 완료되었습니다.",
          data: result.data,
        });

        setReservationInfo((prev) => ({
          ...prev,
          entryStatus: "입장완료",
          checkinTime: result.data.checkinTime,
        }));

        setValidationStatus({
          isValid: false,
          message: "입장 처리 완료",
          type: "success",
        });

        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
      } else {
        setCheckinResult({
          success: false,
          message: result.message || "입장 처리에 실패했습니다.",
          data: result.data,
        });
      }
    } catch (err) {
      console.error("입장 처리 오류:", err);
      setCheckinResult({
        success: false,
        message: err.message || "입장 처리 중 오류가 발생했습니다.",
      });
    } finally {
      setIsCheckinProcessing(false);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setReservationInfo(null);
    setValidationStatus(null);
    setCheckinResult(null);
    setError(null);
  };

  // 금액 포맷팅 - 클라이언트에서만 실행
  const formatMoney = (amount) => {
    if (!mounted) return "0원";
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
  };

  // 날짜 포맷팅 - 클라이언트에서만 실행
  const formatDate = (dateString) => {
    if (!mounted) return "날짜 미정";
    if (!dateString) return "날짜 미정";

    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
    } catch {
      return "날짜 미정";
    }
  };

  // 시간 포맷팅 - 클라이언트에서만 실행
  const formatDateTime = (dateString) => {
    if (!mounted) return "";
    if (!dateString) return "";

    try {
      return new Date(dateString).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  };

  // 클라이언트에서만 렌더링
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">목포 플레이파크를 준비하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* PWA 설치 알림 */}
      {showInstallPrompt && (
        <div className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-50 bg-orange-500 text-white p-3 sm:p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm sm:text-base">
                목포 플레이파크 앱 설치
              </p>
              <p className="text-xs sm:text-sm opacity-90 truncate">
                더 빠른 접근을 위해 앱으로 설치하세요
              </p>
            </div>
            <div className="flex space-x-2 ml-3">
              <button
                onClick={handleInstallPWA}
                className="bg-white text-orange-500 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-semibold whitespace-nowrap"
              >
                설치
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-white opacity-75 hover:opacity-100 text-lg"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="max-w-xs sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-1 sm:mb-2">
              목포 플레이파크
            </h1>
            <p className="text-gray-400 text-xs sm:text-lg md:text-xl lg:text-2xl">
              입장권 QR코드를 스캔하세요
            </p>
          </div>

          {/* 카메라 영역 */}
          <div className="mb-4 sm:mb-5 md:mb-6">
            <div
              className="relative bg-black rounded-xl sm:rounded-2xl overflow-hidden"
              style={{ aspectRatio: "1/1" }}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />

              {/* 스캔 가이드 오버레이 */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] border-2 sm:border-4 md:border-6 lg:border-8 border-orange-500 rounded-xl sm:rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-4 h-4 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 border-t-2 sm:border-t-4 md:border-t-6 lg:border-t-8 border-l-2 sm:border-l-4 md:border-l-6 lg:border-l-8 border-orange-500"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 border-t-2 sm:border-t-4 md:border-t-6 lg:border-t-8 border-r-2 sm:border-r-4 md:border-r-6 lg:border-r-8 border-orange-500"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 border-b-2 sm:border-b-4 md:border-b-6 lg:border-b-8 border-l-2 sm:border-l-4 md:border-l-6 lg:border-l-8 border-orange-500"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 border-b-2 sm:border-b-4 md:border-t-6 lg:border-b-8 border-r-2 sm:border-r-4 md:border-r-6 lg:border-r-8 border-orange-500"></div>
                  </div>
                </div>
              )}

              {!isScanning && !scanResult && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 mx-auto mb-2 sm:mb-3 md:mb-4 border-4 border-gray-600 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 border-2 border-gray-500 rounded"></div>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-lg md:text-xl lg:text-2xl">
                      QR코드를 스캔하세요
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 컨트롤 버튼 */}
          <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-4 sm:mb-5 md:mb-6">
            {!isScanning ? (
              <button
                onClick={startScanning}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 sm:py-6 md:py-7 lg:py-8 px-4 sm:px-8 md:px-10 lg:px-12 rounded-xl sm:rounded-2xl transition-colors text-sm sm:text-xl md:text-2xl lg:text-3xl"
              >
                스캔 시작
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 sm:py-6 md:py-7 lg:py-8 px-4 sm:px-8 md:px-10 lg:px-12 rounded-xl sm:rounded-2xl transition-colors text-sm sm:text-xl md:text-2xl lg:text-3xl"
              >
                스캔 중지
              </button>
            )}

            <button
              onClick={resetScan}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 sm:py-4 md:py-5 lg:py-6 px-4 sm:px-8 md:px-10 lg:px-12 rounded-xl sm:rounded-2xl transition-colors text-xs sm:text-lg md:text-xl lg:text-2xl"
            >
              초기화
            </button>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 bg-red-600 text-white rounded-xl sm:rounded-2xl">
              <h3 className="font-bold mb-1 sm:mb-2 text-sm sm:text-base">
                오류 발생
              </h3>
              <p className="text-xs sm:text-sm">{error}</p>
            </div>
          )}

          {/* 예약 정보 표시 */}
          {reservationInfo && (
            <div className="mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 bg-gray-800 text-white rounded-xl sm:rounded-2xl">
              <h3 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base md:text-lg flex items-center">
                {reservationInfo.scannedTicketNumber
                  ? `티켓 #${reservationInfo.scannedTicketNumber} 정보`
                  : "예약 정보"}
                {/* 직원 예약 표시 추가 */}
                {(reservationInfo.isStaffReservation ||
                  reservationInfo.reservationId?.startsWith("STF")) && (
                  <span className="ml-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                    직원 예약
                  </span>
                )}
              </h3>

              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">예약번호:</span>
                  <span className="font-mono flex items-center">
                    {reservationInfo.reservationId}
                    {/* STF 예약인 경우 태그 추가 */}
                    {reservationInfo.reservationId?.startsWith("STF") && (
                      <span className="ml-2 text-blue-400 text-xs">(직원)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">고객명:</span>
                  <span className="font-semibold">
                    {reservationInfo.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">연락처:</span>
                  <span>{reservationInfo.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">이용월:</span>
                  <span>{formatDate(reservationInfo.visitDate)}</span>
                </div>

                {/* 스캔된 특정 티켓 강조 표시 */}
                {reservationInfo.scannedTicket && (
                  <div className="bg-orange-900/50 p-3 rounded-lg mb-3 border-2 border-orange-500">
                    <p className="text-orange-300 font-bold text-sm mb-1">
                      스캔된 티켓
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-base sm:text-lg">
                        {formatTicketType(reservationInfo.scannedTicket)}
                      </span>
                      <span className="font-bold text-orange-400 text-base sm:text-lg">
                        {formatMoney(reservationInfo.scannedTicket.price)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="text-gray-400">티켓 상태: </span>
                      <span
                        className={`font-bold ${
                          reservationInfo.scannedTicket.entry_status ===
                          "입장완료"
                            ? "text-blue-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {reservationInfo.scannedTicket.entry_status ===
                        "입장완료"
                          ? "입장완료"
                          : "입장 전"}
                      </span>
                    </div>
                  </div>
                )}

                {/* 전체 티켓 목록 */}
                <div className="border-t-2 border-gray-600 pt-3 mt-3">
                  <span className="text-gray-300 block mb-3 text-sm sm:text-base font-bold">
                    예약 내 전체 티켓:
                  </span>
                  <div className="space-y-2 bg-gray-900 p-3 rounded-lg">
                    {reservationInfo.cartItems &&
                    reservationInfo.cartItems.length > 0 ? (
                      reservationInfo.cartItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <span className="text-white font-bold text-sm sm:text-base md:text-lg">
                              {formatCartItemName(item)} × {item.count}매
                            </span>
                            <span
                              className={`ml-2 text-xs sm:text-sm font-bold ${
                                item.entryStatus === "입장완료"
                                  ? "text-blue-400"
                                  : "text-yellow-400"
                              }`}
                            >
                              [
                              {item.entryStatus === "입장완료"
                                ? "입장완료"
                                : "입장 전"}
                              ]
                            </span>
                          </div>
                          <span className="font-bold text-orange-400 text-sm sm:text-base md:text-lg">
                            {formatMoney(item.price * item.count)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <>
                        {reservationInfo.adultCount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-white font-bold text-sm sm:text-base md:text-lg">
                              [일반] 성인 × {reservationInfo.adultCount}명
                            </span>
                            <span className="font-bold text-orange-400 text-sm sm:text-base md:text-lg">
                              -
                            </span>
                          </div>
                        )}
                        {reservationInfo.childCount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-white font-bold text-sm sm:text-base md:text-lg">
                              [일반] 어린이 × {reservationInfo.childCount}명
                            </span>
                            <span className="font-bold text-orange-400 text-sm sm:text-base md:text-lg">
                              -
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-3 pt-3 border-t border-gray-600">
                  <span className="text-gray-400 font-semibold">결제금액:</span>
                  <span className="font-bold text-orange-400 text-base sm:text-lg">
                    {formatMoney(
                      reservationInfo.scannedTicket
                        ? reservationInfo.scannedTicket.price
                        : reservationInfo.totalAmount
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">결제상태:</span>
                  <span
                    className={`font-bold text-sm sm:text-base ${
                      reservationInfo.status === "결제완료" ||
                      reservationInfo.status === "결제 완료"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {reservationInfo.status}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">입장상태:</span>
                  <span
                    className={`font-bold text-sm sm:text-base ${
                      (reservationInfo.scannedTicket
                        ? reservationInfo.scannedTicket.entry_status
                        : reservationInfo.entryStatus) === "입장완료"
                        ? "text-blue-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {reservationInfo.scannedTicket
                      ? reservationInfo.scannedTicket.entry_status ===
                        "입장완료"
                        ? "입장완료"
                        : "입장 전"
                      : reservationInfo.entryStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 검증 상태 표시 */}
          {validationStatus && (
            <div
              className={`mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl ${
                validationStatus.type === "success"
                  ? "bg-green-600"
                  : "bg-red-600"
              } text-white`}
            >
              <h3 className="font-bold mb-1 sm:mb-2 text-sm sm:text-base md:text-lg">
                {validationStatus.type === "success"
                  ? "검증 성공"
                  : "검증 실패"}
              </h3>
              <p className="text-xs sm:text-sm">{validationStatus.message}</p>
            </div>
          )}

          {/* 수동 입장 처리 버튼 */}
          {validationStatus?.isValid && !checkinResult?.success && (
            <div className="mb-3 sm:mb-4 md:mb-6">
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => handleManualCheckin(false)}
                  disabled={isCheckinProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 sm:py-4 md:py-5 lg:py-6 px-2 sm:px-4 md:px-5 lg:px-6 rounded-xl sm:rounded-2xl transition-colors text-xs sm:text-base md:text-lg lg:text-xl"
                >
                  {isCheckinProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 border-b-2 border-white mr-2 sm:mr-3"></div>
                      처리 중...
                    </div>
                  ) : reservationInfo.scannedTicketNumber ? (
                    "개별 입장 완료 처리"
                  ) : (
                    "선택 티켓 처리"
                  )}
                </button>
                <button
                  onClick={() => handleManualCheckin(true)}
                  disabled={isCheckinProcessing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 sm:py-4 md:py-5 lg:py-6 px-2 sm:px-4 md:px-5 lg:px-6 rounded-xl sm:rounded-2xl transition-colors text-xs sm:text-base md:text-lg lg:text-xl"
                >
                  {isCheckinProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 border-b-2 border-white mr-2 sm:mr-3"></div>
                      처리 중...
                    </div>
                  ) : (
                    "전체 입장 완료"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 입장 처리 결과 */}
          {checkinResult && (
            <div
              className={`mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl ${
                checkinResult.success ? "bg-green-600" : "bg-red-600"
              } text-white`}
            >
              <h3 className="font-bold mb-1 sm:mb-2 text-sm sm:text-base md:text-lg">
                {checkinResult.success ? "입장 완료" : "입장 실패"}
              </h3>
              <p className="text-xs sm:text-sm mb-2 sm:mb-3">
                {checkinResult.message}
              </p>

              {checkinResult.data && checkinResult.success && (
                <div className="text-xs sm:text-sm bg-black bg-opacity-30 p-2 sm:p-3 rounded-lg">
                  <p className="mb-1">
                    <strong>입장시간:</strong>{" "}
                    {formatDateTime(checkinResult.data.checkinTime)}
                  </p>
                  <p className="mb-1">
                    <strong>처리 티켓:</strong>{" "}
                    {checkinResult.data.processedTickets}개 /{" "}
                    {checkinResult.data.totalTickets}개
                  </p>
                  {/* 예약 유형 표시 추가 */}
                  {checkinResult.data.reservationType && (
                    <p>
                      <strong>예약 유형:</strong>{" "}
                      {checkinResult.data.reservationType}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 스캔 결과 */}
          {scanResult && (
            <div className="mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 bg-gray-700 text-white rounded-xl sm:rounded-2xl">
              <h3 className="font-bold mb-1 sm:mb-2 text-sm sm:text-base">
                스캔 결과
              </h3>
              <p className="text-xs sm:text-sm bg-black bg-opacity-50 p-2 sm:p-3 rounded break-all">
                {scanResult}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
