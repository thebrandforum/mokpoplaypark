export async function POST(request) {
  try {
    const data = await request.json()
    
    // HTML 폼을 생성하여 자동 제출
    const htmlForm = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>결제 페이지로 이동 중...</title>
      </head>
      <body onload="document.getElementById('paymentForm').submit()">
        <div style="text-align: center; margin-top: 50px;">
          <h2>결제 페이지로 이동 중입니다...</h2>
          <p>잠시만 기다려주세요.</p>
        </div>
        <form id="paymentForm" method="POST" action="/gogo/BillgatePay-PHP/PayInput.php" style="display: none;">
          <input type="hidden" name="orderId" value="${data.orderId || ''}">
          <input type="hidden" name="amount" value="${data.amount || ''}">
          <input type="hidden" name="userName" value="${data.userName || ''}">
          <input type="hidden" name="userEmail" value="${data.userEmail || ''}">
          <input type="hidden" name="userPhone" value="${data.userPhone || ''}">
          <input type="hidden" name="itemName" value="${data.itemName || ''}">
        </form>
      </body>
      </html>
    `
    
    return new Response(htmlForm, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (error) {
    console.error('프록시 오류:', error)
    return new Response('Error', { status: 500 })
  }
}