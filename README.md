# 🏞️ 목포 플레이파크 - 어드벤처파크 예약 시스템

전남 최초! 목포 유일의 모험형 스포츠 테마파크 온라인 예약 시스템

## 🚀 프로젝트 개요

- **프로젝트명**: 목포 플레이파크 (MOKPO Play PARK)
- **목표**: 어드벤처파크 온라인 입장권 예약 및 관리 시스템 구축
- **기술스택**: Next.js 15 + TypeScript + Supabase PostgreSQL + Tailwind CSS
- **배포환경**: Vercel + GoormIDE
- **데이터베이스**: Supabase PostgreSQL

## 📁 프로젝트 구조

```
adventure-park-reservation/
├── app/
│   ├── page.tsx                         # 메인 홈페이지
│   ├── layout.tsx                       # 전체 레이아웃
│   ├── globals.css                      # 전역 스타일
│   ├── reservation/
│   │   └── page.tsx                     # 예약 페이지
│   ├── reservation-check/
│   │   └── page.tsx                     # 예약 확인 페이지
│   ├── scanner/
│   │   └── page.tsx                     # QR코드 스캐너 페이지
│   ├── admin/
│   │   ├── dashboard/page.tsx           # 관리자 대시보드
│   │   ├── reservations/page.tsx        # 예약 관리
│   │   ├── customers/page.tsx           # 고객 관리
│   │   ├── sales/page.tsx               # 매출 관리
│   │   └── settings/page.tsx            # 시스템 설정
│   └── api/
│       ├── settings/route.js            # 공개 설정 조회 API
│       ├── admin/
│       │   ├── settings/route.js        # 관리자 설정 API
│       │   └── reservations/
│       │       ├── route.js             # 예약 목록 API
│       │       └── id/route.js          # 예약 상세/삭제 API
│       ├── reservations/route.js        # 예약 생성 API
│       ├── reservations-search/route.js # 예약 검색 API
│       ├── send-sms/route.js            # SMS 발송 API
│       └── checkin/route.js             # QR코드 체크인 API
├── components/
│   ├── admin/
│   │   └── admin-layout.jsx             # 관리자 레이아웃
│   └── ticket-section.tsx               # 티켓 예약 컴포넌트
├── lib/
│   ├── database.js                      # Supabase PostgreSQL 연결
│   └── database_mysql_backup.js         # 기존 MySQL 백업
├── public/
│   ├── images/                          # 이미지 파일
│   └── manifest.json                    # PWA 설정
├── next.config.js                       # Next.js 설정 (PWA 포함)
├── package.json                         # 패키지 설정
└── README.md                            # 프로젝트 문서
```

## 🗄️ 데이터베이스 구조

### 📊 테이블 구조 (Supabase PostgreSQL)

#### 1. users (회원 정보)
| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | uuid | NO | - | 사용자 고유 ID (PK) |
| `user_id` | varchar(20) | NO | '' | 로그인 ID |
| `email` | varchar(100) | NO | - | 이메일 (필수) |
| `name` | varchar(50) | NO | - | 사용자명 |
| `phone` | varchar(20) | NO | - | 전화번호 |
| `birth_date` | date | YES | - | 생년월일 |
| `gender` | varchar(10) | YES | - | 성별 |
| `marketing_agree` | boolean | YES | false | 마케팅 동의 |
| `terms_agree` | boolean | YES | true | 이용약관 동의 |
| `privacy_agree` | boolean | YES | true | 개인정보 동의 |
| `status` | varchar(20) | YES | 'active' | 계정 상태 |
| `role` | varchar(20) | YES | 'user' | 사용자 역할 |
| `last_login_at` | timestamptz | YES | - | 마지막 로그인 |
| `created_at` | timestamptz | YES | now() | 가입일 |
| `updated_at` | timestamptz | YES | now() | 수정일 |

#### 2. customers (비회원 고객 정보)
| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | varchar(50) | NO | - | 고객 ID (PK) |
| `name` | varchar(100) | NO | - | 고객명 |
| `phone` | varchar(20) | NO | - | 전화번호 |
| `email` | varchar(100) | YES | - | 이메일 |
| `visit_count` | integer | YES | 0 | 방문 횟수 |
| `total_spent` | integer | YES | 0 | 총 사용 금액 |
| `last_visit` | date | YES | - | 마지막 방문일 |
| `memo` | text | YES | - | 메모 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | 생성일 |

#### 3. reservations (예약 정보)
| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | varchar(50) | NO | - | 예약번호 (PK) |
| `customer_name` | varchar(100) | NO | - | 고객명 |
| `phone` | varchar(20) | NO | - | 전화번호 |
| `email` | varchar(100) | NO | - | 이메일 |
| `visit_date` | date | NO | - | 이용날짜 |
| `adult_count` | integer | YES | 0 | 성인 수 |
| `child_count` | integer | YES | 0 | 아동 수 |
| `total_amount` | integer | NO | - | 총 금액 |
| `status` | varchar(20) | YES | '결제 전' | 예약 상태 |
| `entry_status` | varchar(20) | YES | '입장_전' | 입장 상태 |
| `qr_code` | varchar(100) | YES | - | QR코드 |
| `payment_time` | timestamp | YES | CURRENT_TIMESTAMP | 결제 시간 |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | 생성 시간 |
| `checkin_time` | timestamp | YES | - | 체크인 시간 |
| `user_id` | varchar(50) | YES | - | 회원 ID (FK) |

##### 제약조건
- **status**: '결제 전', '결제 완료', '취소'
- **entry_status**: '입장_전', '입장완료'

#### 4. settings (시스템 설정)
| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | integer | NO | nextval() | 설정 ID (PK) |
| `setting_key` | varchar(100) | NO | - | 설정 키 (UNIQUE) |
| `setting_value` | jsonb | YES | - | 설정 값 (JSON) |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | 수정 시간 |

##### 현재 설정 데이터
1. **basic_info** (기본 정보)
```json
{
  "email": "info@adventurepark.com",
  "phone": "010-1234-5678", 
  "address": "서울시 강남구 테헤란로 123",
  "parkName": "어드벤처파크",
  "description": "짜릿한 모험이 가득한 어드벤처파크에 오신 것을 환영합니다!"
}
```

2. **operation_settings** (운영 설정)
```json
{
  "openTime": "11:00",
  "closeTime": "18:00", 
  "closedDays": [0, 2]  // 일요일(0), 화요일(2) 휴무
}
```

3. **price_settings** (요금 설정)
```json
{
  "adultPrice": 25000,    // 성인 요금
  "childPrice": 20000,    // 아동 요금
  "minGroupSize": 20,     // 단체 최소 인원
  "groupDiscount": 10     // 단체 할인율(%)
}
```

## 🌐 주요 페이지

### 📱 사용자 페이지
- **`/`** - 메인 홈페이지 (시설 소개, 요금 안내)
- **`/reservation`** - 입장권 예약 페이지 (실시간 검증)
- **`/reservation-check`** - 예약 확인 페이지 (QR코드 표시)
- **`/scanner`** - QR코드 스캐너 페이지 (직원용)

### 🔧 관리자 페이지
- **`/admin/dashboard`** - 관리자 대시보드
- **`/admin/settings`** - 시스템 설정 관리
- **`/admin/reservations`** - 예약 관리
- **`/admin/customers`** - 고객 관리
- **`/admin/sales`** - 매출 관리

## 🛠️ 기술 특징

### 프론트엔드
- **Next.js 15**: 최신 App Router 사용
- **TypeScript**: 타입 안전성 확보
- **Tailwind CSS**: 반응형 디자인
- **PWA**: 오프라인 지원 (next-pwa)

### 백엔드
- **Supabase**: PostgreSQL 기반 BaaS
- **API Routes**: RESTful API 구조
- **실시간 동기화**: 설정 변경 즉시 반영

### 주요 기능
- **QR코드 시스템**: ZXing 라이브러리 활용
- **SMS 발송**: Cool SMS (solapi) 연동
- **휴무일 관리**: 요일별 설정 가능
- **단체 할인**: 자동 계산 시스템

## 🔗 API 엔드포인트

### 사용자 API
```
GET  /api/settings              # 공개 설정 조회
POST /api/reservations          # 예약 생성
GET  /api/reservations-search   # 예약 검색
POST /api/checkin              # QR 체크인
POST /api/send-sms             # SMS 발송
```

### 관리자 API
```
GET    /api/admin/settings      # 설정 조회
POST   /api/admin/settings      # 설정 저장
GET    /api/admin/reservations  # 예약 목록
PUT    /api/admin/reservations  # 예약 수정
DELETE /api/admin/reservations  # 예약 삭제
```

## 📱 주요 기능 설명

### 1. 예약 시스템
- 날짜 선택 (휴무일 제외)
- 인원 선택 (성인/아동)
- 자동 가격 계산
- 실시간 입력 검증

### 2. QR코드 시스템
- 예약 완료 시 QR 생성
- QR 이미지 다운로드
- 현장 스캔으로 입장 처리

### 3. 관리자 대시보드
- 실시간 예약 현황
- 매출 통계
- 고객 관리
- 시스템 설정

## 🚀 배포 정보

- **개발 환경**: GoormIDE
- **배포 URL**: https://adventure-park-syste-yqmpq.run.goorm.site
- **데이터베이스**: Supabase (PostgreSQL 15.x)
- **호스팅**: Vercel (서버리스)

## 📞 프로젝트 정보

- **회사명**: 목포 플레이파크
- **주소**: 전라남도 목포시 용해동 9-11
- **대표번호**: 054-639-4842
- **운영시간**: 11:00 ~ 18:00 (일, 화 휴무)

## 🔒 보안 및 성능

- **RLS**: Supabase Row Level Security
- **API 인증**: Service Role Key 기반
- **입력 검증**: 클라이언트/서버 이중 검증
- **HTTPS**: 모든 통신 암호화
- **CDN**: Vercel Edge Network

## 📈 향후 계획

- [ ] 회원 로그인 시스템
- [ ] 결제 연동 (토스페이먼츠)
- [ ] 이메일 알림
- [ ] 모바일 앱 개발
- [ ] 다국어 지원

---

**목포 플레이파크 예약 시스템 v2.0**  
*Supabase PostgreSQL 기반 차세대 어드벤처파크 솔루션*#   T e s t  
 