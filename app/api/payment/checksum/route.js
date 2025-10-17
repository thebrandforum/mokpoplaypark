import crypto from 'crypto'

class CheckSumUtil {
  static INIT_KEY = "billgatehashkey"
  
  static getRandomKey() {
    const randomBytes = crypto.randomBytes(4)
    return randomBytes.toString('hex')
  }
  
  static getMD5(data) {
    return crypto.createHash('md5').update(data).digest('hex')
  }
  
  static genCheckSum(input) {
    const randomKey = this.getRandomKey()
    return randomKey + this.getMD5(randomKey + input + this.INIT_KEY)
  }
}

export async function POST(request) {
  try {
    const body = await request.formData()
    const checkSumData = body.get('CheckSum')
    
    if (!checkSumData) {
      return new Response('CheckSum 데이터가 필요합니다', { status: 400 })
    }
    
    const checksum = CheckSumUtil.genCheckSum(checkSumData)
    
    return new Response(checksum, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
    
  } catch (error) {
    return new Response('서버 오류', { status: 500 })
  }
}