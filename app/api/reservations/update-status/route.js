// app/api/reservations/update-status/route.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rplkcijqbksheqcnvjlf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'
)

export async function POST(request) {
  try {
    const { reservationId, status, paymentMethod, transactionId } = await request.json()
    
    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: status,
        payment_time: new Date().toISOString()
      })
      .eq('id', reservationId)
      .select()
    
    if (error) {
      return Response.json({ success: false, message: error.message }, { status: 500 })
    }
    
    return Response.json({ success: true, data })
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 })
  }
}