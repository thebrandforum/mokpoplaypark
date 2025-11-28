// app/api/checkin/route.js
// QR 체크인 API - 티켓별 관리 지원 버전 (STF 예약 포함)

import { createClient } from "@supabase/supabase-js";

// Supabase 설정
const supabaseUrl = "https://rplkcijqbksheqcnvjlf.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI";

// 한국 시간 변환 함수 (검증용으로만 사용)
function getKoreaTime(date = new Date()) {
  const koreaTime = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return koreaTime;
}

// Supabase 클라이언트 생성 함수
function getSupabaseClient() {
  try {
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
    console.log("✅ Supabase 클라이언트 생성 성공");
    return client;
  } catch (error) {
    console.error("❌ Supabase 클라이언트 생성 실패:", error);
    throw error;
  }
}

// 입장 가능 여부 검증 함수
function validateCheckinEligibility(reservation, tickets = []) {
  const koreaToday = getKoreaTime();
  const todayDateString = koreaToday.toISOString().split("T")[0];

  const todayMonth = todayDateString.slice(0, 7);
  const reservationMonth = reservation.visit_date.slice(0, 7);

  console.log("검증 - 이번 달:", todayMonth, "예약 월:", reservationMonth);

  const validationResult = {
    canCheckin: false,
    reason: "",
    details: {
      todayMonth,
      reservationMonth,
      status: reservation.status,
      entryStatus: reservation.entry_status,
      ticketStatuses: tickets.map((t) => ({
        id: t.id,
        status: t.ticket_status,
        entryStatus: t.entry_status,
      })),
    },
  };

  // 1. 월 단위 검증
  if (reservationMonth !== todayMonth) {
    validationResult.reason = `이번 달(${todayMonth})이 아닌 예약입니다. 예약 월: ${reservationMonth}`;
    return validationResult;
  }

  // 2. 예약 상태 검증
  if (reservation.status === "취소") {
    validationResult.reason = "취소된 예약입니다.";
    return validationResult;
  }

  // 3. 티켓 상태 검증
  const activeTickets = tickets.filter(
    (t) => t.ticket_status === "결제완료" && t.entry_status !== "입장완료"
  );

  if (activeTickets.length === 0) {
    if (tickets.every((t) => t.entry_status === "입장완료")) {
      validationResult.reason = "모든 티켓이 이미 입장 처리되었습니다.";
    } else if (tickets.every((t) => t.ticket_status === "결제 전")) {
      validationResult.reason = "결제가 완료되지 않은 티켓입니다.";
    } else {
      validationResult.reason = "입장 가능한 티켓이 없습니다.";
    }
    return validationResult;
  }

  // 모든 검증 통과
  validationResult.canCheckin = true;
  validationResult.reason = `${activeTickets.length}개의 티켓이 입장 가능합니다.`;
  validationResult.activeTickets = activeTickets;

  return validationResult;
}

// GET - 예약 정보 조회
export async function GET(request) {
  console.log("🔍 GET - 예약 정보 조회 시작...");

  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get("id");
    const ticketNumber = searchParams.get("ticketNumber"); // 티켓 번호 추가

    if (!reservationId) {
      return Response.json(
        {
          success: false,
          message: "Reservation ID is required",
        },
        { status: 400 }
      );
    }

    console.log("조회할 예약번호:", reservationId);
    console.log("조회할 티켓번호:", ticketNumber);

    // 직원 예약 여부 확인
    const isStaffReservation = reservationId.startsWith("STF");
    console.log("직원 예약 여부:", isStaffReservation);

    const supabase = getSupabaseClient();

    // 예약 정보 조회
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", reservationId)
      .maybeSingle();

    if (reservationError || !reservation) {
      console.error("예약 조회 오류:", reservationError);
      return Response.json(
        {
          success: false,
          message: `예약번호 ${reservationId}를 찾을 수 없습니다.`,
        },
        { status: 404 }
      );
    }

    // 티켓 정보 조회 - 항상 전체 티켓 조회
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("*")
      .eq("reservation_id", reservationId)
      .order("ticket_number");

    if (ticketsError) {
      console.error("티켓 조회 오류:", ticketsError);
    }

    console.log("✅ 예약 조회 성공:", reservation.customer_name);
    console.log("티켓 수:", tickets?.length || 0);

    // 스캔된 특정 티켓 찾기
    let scannedTicket = null;
    if (ticketNumber && tickets) {
      scannedTicket = tickets.find(
        (t) => t.ticket_number === parseInt(ticketNumber)
      );
      console.log(
        "특정 티켓 조회:",
        ticketNumber,
        "→",
        scannedTicket ? "찾음" : "못찾음"
      );
    }

    // 입장 가능 여부 검증
    const validation = validateCheckinEligibility(reservation, tickets || []);

    // 티켓 정보를 cartItems 형식으로 변환
    let cartItems = [];

    if (tickets) {
      // 전체 티켓을 종류별로 그룹화
      const groupedTickets = {};
      tickets.forEach((ticket) => {
        const key = `${ticket.ticket_type}_${ticket.is_discount || false}`;
        if (!groupedTickets[key]) {
          groupedTickets[key] = {
            name: ticket.ticket_type,
            count: 0,
            price: ticket.price,
            status: ticket.ticket_status,
            entryStatus: "",
            isDiscount: ticket.is_discount || false,
            ids: [],
            checkedInCount: 0, // 입장완료 개수 추적
          };
        }
        groupedTickets[key].count++;
        groupedTickets[key].ids.push(ticket.id);

        // 입장완료 개수 카운트
        if (ticket.entry_status === "입장완료") {
          groupedTickets[key].checkedInCount++;
        }
      });

      // 입장 상태 결정
      Object.keys(groupedTickets).forEach((key) => {
        const group = groupedTickets[key];
        if (group.checkedInCount === 0) {
          group.entryStatus = "입장 전";
        } else if (group.checkedInCount === group.count) {
          group.entryStatus = "입장완료";
        } else {
          group.entryStatus = `${group.checkedInCount}/${group.count} 입장완료`;
        }
      });

      cartItems = Object.values(groupedTickets).map((group) => ({
        id: group.ids[0],
        name: group.name,
        count: group.count,
        price: group.price,
        status: group.status,
        entryStatus: group.entryStatus,
        isDiscount: group.isDiscount,
      }));
    }

    return Response.json({
      success: true,
      message: "Reservation found successfully",
      data: {
        reservationId: reservation.id,
        customerName: reservation.customer_name,
        phone: reservation.phone,
        email: reservation.email,
        visitDate: reservation.visit_date,
        adultCount: reservation.adult_count || 0,
        childCount: reservation.child_count || 0,
        guardianCount: reservation.guardian_count || 0,
        cartItems: cartItems,
        totalAmount:
          ticketNumber && scannedTicket
            ? scannedTicket.price
            : reservation.total_amount,
        status: reservation.status,
        entryStatus: reservation.entry_status,
        qrCode: reservation.qr_code,
        paymentTime: reservation.payment_time,
        checkinTime: reservation.checkin_time,
        createdAt: reservation.created_at,
        canCheckin: validation.canCheckin,
        validationReason: validation.reason,
        validationDetails: validation.details,
        tickets: tickets || [],
        // 스캔된 티켓 정보 추가
        scannedTicketNumber: ticketNumber ? parseInt(ticketNumber) : null,
        scannedTicket: scannedTicket,
        // 직원 예약 정보 추가
        isStaffReservation:
          reservation.is_staff_reservation || isStaffReservation,
      },
    });
  } catch (error) {
    console.error("❌ GET 체크인 오류:", error);

    return Response.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - 입장 처리
export async function POST(request) {
  console.log("🚪 POST - 입장 처리 시작...");

  try {
    const body = await request.json();
    const { reservationId, qrData, ticketIds } = body;

    let finalReservationId = reservationId;

    // QR 데이터에서 예약번호 추출 (ADV 또는 STF)
    if (!finalReservationId && qrData) {
      // ADV 또는 STF로 시작하는 예약번호 추출
      const match = qrData.match(/(ADV|STF)\d+/i);
      if (match) {
        finalReservationId = match[0].toUpperCase();
        console.log("QR에서 예약번호 추출:", finalReservationId);
      }
    }

    if (!finalReservationId) {
      return Response.json(
        {
          success: false,
          message: "Reservation ID is required",
        },
        { status: 400 }
      );
    }

    console.log("입장 처리 예약번호:", finalReservationId);
    console.log("입장 처리할 티켓 ID:", ticketIds);

    // 직원 예약 여부 확인
    const isStaffReservation = finalReservationId.startsWith("STF");
    console.log("직원 예약 여부:", isStaffReservation);

    const supabase = getSupabaseClient();

    // 1. 예약 정보 먼저 조회
    const { data: reservation, error: selectError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", finalReservationId)
      .maybeSingle();

    if (selectError || !reservation) {
      console.error("예약 조회 실패:", selectError);
      return Response.json(
        {
          success: false,
          message: "예약을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 2. 티켓 정보 조회
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("*")
      .eq("reservation_id", finalReservationId);

    if (ticketsError || !tickets || tickets.length === 0) {
      console.error("티켓 조회 실패:", ticketsError);
      return Response.json(
        {
          success: false,
          message: "티켓 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 3. 입장 가능 여부 재검증
    const validation = validateCheckinEligibility(reservation, tickets);
    if (!validation.canCheckin) {
      return Response.json(
        {
          success: false,
          message: validation.reason,
          validationDetails: validation.details,
        },
        { status: 400 }
      );
    }

    // 특정 티켓만 입장 처리하거나 전체 티켓 입장 처리
    let ticketsToUpdate =
      ticketIds ||
      tickets
        .filter(
          (t) => t.ticket_status === "결제완료" && t.entry_status !== "입장완료"
        )
        .map((t) => t.id);

    console.log("입장 처리할 티켓 ID 목록:", ticketsToUpdate);

    const checkinTime = new Date().toISOString();

    // 티켓 입장 상태 업데이트
    const { error: updateTicketsError } = await supabase
      .from("tickets")
      .update({
        entry_status: "입장완료",
        used_at: checkinTime,
      })
      .in("id", ticketsToUpdate);

    if (updateTicketsError) {
      console.error("티켓 입장 처리 오류:", updateTicketsError);
      return Response.json(
        {
          success: false,
          message: "티켓 입장 처리 중 오류가 발생했습니다.",
          error: updateTicketsError.message,
        },
        { status: 500 }
      );
    }

    // 모든 티켓이 입장완료되었는지 확인
    const { data: remainingTickets } = await supabase
      .from("tickets")
      .select("id")
      .eq("reservation_id", finalReservationId)
      .eq("ticket_status", "결제완료")
      .neq("entry_status", "입장완료");

    console.log("남은 미입장 티켓 수:", remainingTickets?.length || 0);

    // 모든 티켓이 입장완료면 예약도 입장완료로 변경
    if (!remainingTickets || remainingTickets.length === 0) {
      console.log("모든 티켓이 입장완료됨. 예약 상태도 변경합니다.");

      const { error: updateReservationError } = await supabase
        .from("reservations")
        .update({
          entry_status: "입장완료",
          checkin_time: checkinTime,
        })
        .eq("id", finalReservationId);

      if (updateReservationError) {
        console.error("예약 상태 업데이트 오류:", updateReservationError);
      }
    }

    console.log("✅ 입장 처리 완료:", finalReservationId);
    console.log("처리된 티켓 수:", ticketsToUpdate.length);
    console.log("예약 유형:", isStaffReservation ? "직원 예약" : "일반 예약");

    return Response.json({
      success: true,
      message: `${ticketsToUpdate.length}개 티켓의 입장 처리가 완료되었습니다.`,
      data: {
        reservationId: finalReservationId,
        customerName: reservation.customer_name,
        visitDate: reservation.visit_date,
        processedTickets: ticketsToUpdate.length,
        totalTickets: tickets.length,
        checkinTime: checkinTime,
        reservationType: isStaffReservation ? "직원 예약" : "일반 예약",
      },
    });
  } catch (error) {
    console.error("❌ POST 체크인 오류:", error);

    return Response.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
