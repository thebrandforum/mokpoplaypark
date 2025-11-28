"use client";

import { useState } from "react";

export default function PayTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"info" | "error">("info");

  const handlePayment = async () => {
    setIsLoading(true);
    setStatus("임시 예약 생성 중...");
    setStatusType("info");

    try {
      // 1. 임시 예약 생성
      const now = new Date();
      const tempId =
        "TEMP" +
        now.getFullYear().toString().slice(-2) +
        ("0" + (now.getMonth() + 1)).slice(-2) +
        ("0" + now.getDate()).slice(-2) +
        ("0" + now.getHours()).slice(-2) +
        ("0" + now.getMinutes()).slice(-2) +
        Math.floor(Math.random() * 100)
          .toString()
          .padStart(2, "0");

      // 다음달 말일 계산
      const visitDate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
        .toISOString()
        .split("T")[0];

      const tempReservationData = {
        customer_name: "이현준",
        phone: "010-5706-7656",
        email: "hj040701.lee@gmail.com",
        visit_date: visitDate,
        adult_count: 0,
        child_count: 1,
        guardian_count: 0,
        total_amount: 100,
        cart_items: [
          {
            key: "child_1h",
            type: "어린이 1시간권",
            hours: 1,
            count: 1,
            price: 100,
            name: "어린이 1시간권",
            isDiscount: false,
          },
        ],
      };

      // API 호출로 임시 예약 생성
      const response = await fetch("/api/temp-reservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tempReservationData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "임시 예약 생성 실패");
      }

      const actualTempId = result.data.tempReservationId;
      setStatus(
        `임시 예약 생성 완료! ID: ${actualTempId}\n결제 페이지로 이동합니다...`
      );

      // 2. 빌게이트 결제 페이지로 이동
      setTimeout(() => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://mokpoplaypark.mycafe24.com/cafe24/PayInput.php"; // 카페24용
        //form.action = "http://localhost/again/PayInput.php";
        form.acceptCharset = "EUC-KR";
        form.target = "_blank";

        const params = {
          orderId: actualTempId,
          amount: "100",
          userName: "이현준",
          userEmail: "hj040701.lee@gmail.com",
          userPhone: "010-5706-7656",
          itemName: "Child 1H",
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
      }, 2000);
    } catch (error) {
      console.error("오류:", error);
      setStatus(`오류 발생: ${error.message}`);
      setStatusType("error");
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h1>결제 테스트 페이지</h1>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "20px",
          margin: "20px 0",
          background: "#f5f5f5",
        }}
      >
        <h3>테스트 정보</h3>
        <p>
          <strong>상품:</strong> 어린이 1시간권
        </p>
        <p>
          <strong>금액:</strong> 100원
        </p>
        <p>
          <strong>이름:</strong> 이현준
        </p>
        <p>
          <strong>전화:</strong> 010-5706-7656
        </p>
        <p>
          <strong>이메일:</strong> hj040701.lee@gmail.com
        </p>
      </div>

      <button
        onClick={handlePayment}
        disabled={isLoading}
        style={{
          width: "100%",
          padding: "15px",
          fontSize: "18px",
          background: isLoading ? "#ccc" : "#ff6b00",
          color: "white",
          border: "none",
          cursor: isLoading ? "not-allowed" : "pointer",
          borderRadius: "5px",
        }}
      >
        {isLoading ? "처리 중..." : "100원 결제하기"}
      </button>

      {status && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            background: statusType === "error" ? "#fee" : "#eef",
            color: statusType === "error" ? "#c00" : "#00c",
            border: `1px solid ${statusType === "error" ? "#fcc" : "#ccf"}`,
            borderRadius: "5px",
            whiteSpace: "pre-line",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}
