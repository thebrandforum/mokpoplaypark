'use client'

import { useState, useEffect, useRef } from 'react' 
import AdminLayout from '../../../components/admin/admin-layout'
import * as XLSX from 'xlsx'

const MultiSelectDropdown = ({ 
  options, 
  value = [], 
  onChange, 
  placeholder = '선택하세요',
  label 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => setIsOpen(!isOpen)

  const handleSelect = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const selectedLabels = options
    .filter(opt => value.includes(opt.value))
    .map(opt => opt.label)

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-h-[20px]">
            {value.length === 0 ? (
              <span className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedLabels.map((label, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="py-1 max-h-60 overflow-auto">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => handleSelect(option.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          {value.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-red-600 hover:text-red-800"
              >
                모두 해제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const StatusDropdown = ({ 
  options, 
  value, 
  onChange, 
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full min-w-[120px] px-3 py-1.5 text-left border rounded-md text-sm ${
          disabled 
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed' 
            : 'bg-white border-gray-300 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={selectedOption?.color || 'text-gray-900'}>
            {selectedOption?.label || value}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${option.color || 'text-gray-900'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminReservations() {
  // 상태 관리
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [showDetailFilters, setShowDetailFilters] = useState(false)
  const [showExcelOptions, setShowExcelOptions] = useState(false)
  const [editingVisitDate, setEditingVisitDate] = useState(null)
  const [newVisitDate, setNewVisitDate] = useState('')
  const [expandedReservations, setExpandedReservations] = useState([])
  const [showByTicket, setShowByTicket] = useState(false)
  const [totalTicketCount, setTotalTicketCount] = useState(0)

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phone) => {
    if (!phone) return phone
    
    const numbers = phone.replace(/[^0-9]/g, '')
    
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
    }
    
    return phone
  }

  // 필터 상태
  const [filters, setFilters] = useState({
    paymentStatusList: [],      // statusList → paymentStatusList로 변경
    reservationStatusList: [],  // entryStatusList → reservationStatusList로 변경
    memberType: 'all',
    visitMonth: '',
    searchKeyword: '',  
    reservationId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // 임시 필터 상태 (검색 버튼 누르기 전까지 여기에 저장)
  const [tempFilters, setTempFilters] = useState({ ...filters })

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage] = useState(20)
  const [pageInput, setPageInput] = useState('')
  
  // 필터 옵션들 정의
  const paymentStatusOptions = [
    { value: '결제 전', label: '결제 전' },
    { value: '결제완료', label: '결제완료' }
  ]

  const reservationStatusOptions = [
    { value: '입장_전', label: '입장 전' },
    { value: '입장완료', label: '입장완료' },
    { value: '취소', label: '취소' }
  ]

  // 인원/이용권 상세 표시 함수 추가
  const formatDetailedTickets = (reservation) => {
    if (!reservation.cartItems || reservation.cartItems.length === 0) {
      // cart_items가 없는 경우 기존 방식으로 표시
      const counts = []
      if (reservation.adultCount > 0) counts.push(`성인 ${reservation.adultCount}명`)
      if (reservation.childCount > 0) counts.push(`어린이 ${reservation.childCount}명`)
      if (reservation.guardianCount > 0) counts.push(`보호자 ${reservation.guardianCount}명`)
      return counts
    }
    
    // cart_items가 있는 경우 상세 표시
    const items = reservation.cartItems.map(item => {
      const typeLabel = item.type === 'adult' ? '성인' : 
                       item.type === 'child' ? '어린이' : '보호자'
      return `${typeLabel} ${item.hours}시간권 × ${item.count}매`
    })
    
    return items
  }

  // 예약을 티켓별로 펼치는 함수
  const expandReservationsByTickets = (reservations) => {
    const expandedData = []
    
    reservations.forEach(reservation => {
      if (reservation.tickets && reservation.tickets.length > 0) {
        // 티켓 정보가 있는 경우
        reservation.tickets.forEach((ticket, index) => {
          console.log('티켓 데이터 확인:', {
            ticketId: ticket.id,
            cancelled_at: ticket.cancelled_at,
            used_at: ticket.used_at,
            status: ticket.ticket_status
          })
          
          expandedData.push({
            ...reservation,
            ticketInfo: ticket,
            ticketId: ticket.id,
            ticketIndex: index,
            totalTickets: reservation.tickets.length,
            isFirstTicket: index === 0,
            // 수정: 티켓의 개별 상태 사용
            ticketStatus: ticket.ticket_status || ticket.status || reservation.status,
            ticketEntryStatus: ticket.entry_status || '입장_전'
          })
        })
      } else if (reservation.cartItems && reservation.cartItems.length > 0) {
        // cartItems로 티켓 생성
        let ticketNumber = 1
        reservation.cartItems.forEach(item => {
			
		console.log('cartItem 데이터:', item)

          for (let i = 0; i < item.count; i++) {
			console.log(`[${reservation.id}] ${item.name} - 단가: ${item.price}원, 수량: ${item.count}개, 총액: ${item.price * item.count}원`)



            expandedData.push({
              ...reservation,
              ticketInfo: {
                ticket_type: item.name,
                category: item.name.includes('성인') || item.name.includes('어른') ? '성인' :
                         item.name.includes('어린이') || item.name.includes('청소년') ? '어린이' :
                         item.name.includes('보호자') ? '보호자' : '일반',
                duration: item.name.includes('2시간') ? '2시간' :
                         item.name.includes('1시간') ? '1시간' : '1DAY',
                price: item.price,  
                ticket_number: ticketNumber
              },
              ticketId: `temp-${reservation.id}-${ticketNumber}`, // 임시 ID
              ticketIndex: ticketNumber - 1,
              totalTickets: reservation.cartItems.reduce((sum, itm) => sum + itm.count, 0),
              isFirstTicket: ticketNumber === 1,
              ticketStatus: reservation.status, 
              ticketEntryStatus: '입장_전'  
            })
            ticketNumber++
          }
        })
      } else {
        // 기존 방식
        const totalTickets = (reservation.adultCount || 0) + (reservation.childCount || 0) + (reservation.guardianCount || 0)
        let ticketNumber = 1
        
        // 성인 티켓
        for (let i = 0; i < (reservation.adultCount || 0); i++) {
          expandedData.push({
            ...reservation,
            ticketInfo: {
              ticket_type: '성인 1시간 이용권',
              category: '성인',
              duration: '1시간',
              price: 17000,
              ticket_number: ticketNumber
            },
            ticketId: `temp-${reservation.id}-adult-${i}`, // 임시 ID
            ticketIndex: ticketNumber - 1,
            totalTickets: totalTickets,
            isFirstTicket: ticketNumber === 1,
            ticketStatus: reservation.status,  // 단순화
            ticketEntryStatus: '입장_전' 
          })
          ticketNumber++
        }
        
        // 어린이 티켓
        for (let i = 0; i < (reservation.childCount || 0); i++) {
          expandedData.push({
            ...reservation,
            ticketInfo: {
              ticket_type: '어린이 1시간 이용권',
              category: '어린이',
              duration: '1시간',
              price: 12000,
              ticket_number: ticketNumber
            },
            ticketId: `temp-${reservation.id}-child-${i}`, // 임시 ID
            ticketIndex: ticketNumber - 1,
            totalTickets: totalTickets,
            isFirstTicket: ticketNumber === 1,
            ticketStatus: reservation.status,  // 단순화
            ticketEntryStatus: '입장_전'  
          })
          ticketNumber++
        }
        
        // 보호자 티켓 (있는 경우)
        for (let i = 0; i < (reservation.guardianCount || 0); i++) {
          expandedData.push({
            ...reservation,
            ticketInfo: {
              ticket_type: '보호자 이용권',
              category: '보호자',
              duration: '1DAY',
              price: 0,
              ticket_number: ticketNumber
            },
            ticketId: `temp-${reservation.id}-guardian-${i}`, // 임시 ID
            ticketIndex: ticketNumber - 1,
            totalTickets: totalTickets,
            isFirstTicket: ticketNumber === 1,
            ticketStatus: reservation.status,  // 단순화
            ticketEntryStatus: '입장_전'  
          })
          ticketNumber++
        }
      }
    })
    
    return expandedData
  }

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadReservations()
  }, [currentPage, filters])
  	
  useEffect(() => {
    console.log('🔄 reservations 변경 감지:', reservations.length, '건')
    let expanded = expandReservationsByTickets(reservations)
    console.log('📊 확장된 티켓 데이터:', expanded.length, '건')
    
    // 티켓별 보기 ON일 때만 개별 티켓 필터링
    if (showByTicket) {
      expanded = expanded.filter(item => {
        // 결제 상태 필터
        if (filters.paymentStatusList.length > 0) {
          const ticketPaymentStatus = item.ticketStatus === '결제 완료' ? '결제완료' : item.ticketStatus
          if (!filters.paymentStatusList.includes(ticketPaymentStatus)) {
            return false
          }
        }
        
        // 예약 상태 필터
        if (filters.reservationStatusList.length > 0) {
          // 취소 상태 체크
          if (item.ticketStatus === '취소' && !filters.reservationStatusList.includes('취소')) {
            return false
          }
          // 입장 상태 체크
          if (item.ticketStatus !== '취소') {
            if (!filters.reservationStatusList.includes(item.ticketEntryStatus)) {
              return false
            }
          }
        }
        
        return true
      })
      console.log('🎯 필터링 후 티켓 데이터:', expanded.length, '건')
    }
    // 입장시간 정렬일 때 특별 처리는 제거 (백엔드에서 이미 처리함)
    
    setExpandedReservations(expanded)
  }, [reservations, showByTicket, filters])
	
  // 외부 클릭 시 엑셀 옵션 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExcelOptions && !event.target.closest('.excel-menu-container')) {
        setShowExcelOptions(false)
      }
    }
  
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showExcelOptions])	

  // 예약 목록 조회
  const loadReservations = async () => {
    console.log('loadReservations 호출됨!', filters)
    
    try {
      setLoading(true)
      
      // URL 파라미터 구성
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        showByTicket: showByTicket.toString()  // 🆕 추가
      })
  
      // 필터 조건 추가 - 간소화된 버전
      if (filters.paymentStatusList.length > 0) {
        const mappedStatuses = filters.paymentStatusList.map(status => 
          status === '결제완료' ? '결제 완료' : status
        )
        params.append('statusList', mappedStatuses.join(','))
      }
      
      if (filters.reservationStatusList.length > 0) {
        const entryStatuses = filters.reservationStatusList.filter(s => s === '입장_전' || s === '입장완료')
        const otherStatuses = filters.reservationStatusList.filter(s => s === '취소' || s === '삭제')
        
        if (entryStatuses.length > 0) {      
            params.append('entryStatusList', entryStatuses.join(','))
        }
        if (otherStatuses.length > 0) {
          const statusesToAdd = otherStatuses.filter(s => s === '취소')
          if (statusesToAdd.length > 0) {
            params.append('additionalStatusList', statusesToAdd.join(','))
          }
          if (otherStatuses.includes('삭제')) {
            params.append('includeDeleted', 'true')
          }
        }
      }

      
      if (filters.memberType !== 'all') {
        params.append('memberType', filters.memberType)
      }
      
      if (filters.visitMonth) {
        params.append('visitMonth', filters.visitMonth)
      }
      
      // 통합 검색 - 고객명/전화번호
      if (filters.searchKeyword && filters.searchKeyword.trim()) {
        params.append('searchKeyword', filters.searchKeyword.trim())
      }
      
      // 예약번호 검색
      if (filters.reservationId && filters.reservationId.trim()) {
        params.append('reservationId', filters.reservationId.trim())
      }
      
      params.append('sortBy', filters.sortBy)
      params.append('sortOrder', filters.sortOrder)
  
      console.log('검색 파라미터:', params.toString())
  
      const response = await fetch(`/api/admin/reservations?${params}`)
      const data = await response.json()
      
      console.log('API 응답:', data)
      console.log('조회된 데이터 개수:', data.data?.length || 0)
      console.log('전체 티켓 수:', data.totalTickets || '서버에서 제공안함')  // ← 이 줄 추가

      if (data.success) {
        // 🆕 티켓별 보기일 때 필터링된 티켓 개수 저장
        if (showByTicket && data.filteredTicketCount !== null) {
          setTotalCount(data.filteredTicketCount)
        } else {
          setTotalCount(data.total || 0)
        }
        
        // 전체 티켓 수 설정 추가
        if (data.totalTickets) {  // ← 이 부분 추가
          setTotalTicketCount(data.totalTickets)
        }
        
        // 각 예약에 대해 티켓 정보 가져오기
        const reservationsWithTickets = await Promise.all((data.data || []).map(async (reservation) => {
          try {
            const ticketsResponse = await fetch(`/api/tickets?reservationId=${reservation.id}`)
            const ticketsResult = await ticketsResponse.json()
            return {
              ...reservation,
              tickets: ticketsResult.success ? ticketsResult.data : []
            }
          } catch (error) {
            console.error('티켓 조회 오류:', error)
            return {
              ...reservation,
              tickets: []
            }
          }
        }))
        
        console.log('🔄 예약 데이터 설정 전 개수:', reservations.length)
        setReservations([...reservationsWithTickets])
        setTotalCount(data.total || 0)
        console.log('✅ 예약 데이터 설정 후 개수:', reservationsWithTickets.length)
      } else {
        console.error('예약 목록 조회 실패:', data.message)
        alert(`예약 목록 조회 실패: ${data.message}`)
      }
    } catch (error) {
      console.error('예약 목록 조회 오류:', error)
      alert('예약 목록을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }
  
  // 이용월 변경 함수
  const handleChangeVisitDate = async (reservationId, currentDate) => {
    setEditingVisitDate(reservationId)
    setNewVisitDate(currentDate)
  }
  
  // 이용월 저장 함수
  const handleSaveVisitDate = async (reservationId) => {
    if (!newVisitDate) {
      alert('날짜를 선택해주세요.')
      return
    }
	  
	const [year, month] = newVisitDate.split('-')
	const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
	const fullDate = `${newVisitDate}-${lastDay}`  
      
    try {
      setProcessingId(reservationId)
      
      const response = await fetch('/api/admin/reservations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservationId: reservationId,
          visitDate: fullDate
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('이용월이 변경되었습니다.')
        loadReservations()
        setEditingVisitDate(null)
        setNewVisitDate('')
      } else {
        alert(`이용월 변경 실패: ${result.message}`)
      }
    } catch (error) {
      console.error('이용월 변경 오류:', error)
      alert('이용월 변경 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }
  
  // 이용월 변경 취소
  const handleCancelEditVisitDate = () => {
    setEditingVisitDate(null)
    setNewVisitDate('')
  }
    
  // 전체 데이터 엑셀 다운로드
  const handleExportAllToExcel = async () => {
    console.log('전체 데이터 엑셀 다운로드 시작')
    setShowExcelOptions(false)
    
    try {
      alert('전체 데이터를 준비 중입니다. 데이터가 많을 경우 시간이 걸릴 수 있습니다...')
      
      // 모든 데이터를 저장할 배열
      let allData = []
      let currentPageNum = 1
      let hasMore = true
      const pageSize = 100 // 한 번에 100개씩
      
      // URL 파라미터 구성
      const baseParams = new URLSearchParams()
      
      // 필터 조건 추가
      if (filters.paymentStatusList.length > 0) {
        const mappedStatuses = filters.paymentStatusList.map(status => 
          status === '결제완료' ? '결제 완료' : status
        )
        baseParams.append('statusList', mappedStatuses.join(','))
      }
  
      if (filters.reservationStatusList.length > 0) {
        const entryStatuses = filters.reservationStatusList.filter(s => s === '입장_전' || s === '입장완료')
        const otherStatuses = filters.reservationStatusList.filter(s => s === '취소' || s === '삭제')
        
        if (entryStatuses.length > 0) {
          baseParams.append('entryStatusList', entryStatuses.join(','))
        }
        if (otherStatuses.length > 0) {
          const statusesToAdd = otherStatuses.filter(s => s === '취소')
          if (statusesToAdd.length > 0) {
            baseParams.append('additionalStatusList', statusesToAdd.join(','))
          }
          if (otherStatuses.includes('삭제')) {
            baseParams.append('includeDeleted', 'true')
          }
        }
      }
      if (filters.memberType !== 'all') {
        baseParams.append('memberType', filters.memberType)
      }
      if (filters.visitMonth) {
        baseParams.append('visitMonth', filters.visitMonth)
      }
      if (filters.searchKeyword.trim()) {
        baseParams.append('searchKeyword', filters.searchKeyword.trim())
      }
      if (filters.reservationId && filters.reservationId.trim()) {
        baseParams.append('reservationId', filters.reservationId.trim())
      }
      baseParams.append('sortBy', filters.sortBy)
      baseParams.append('sortOrder', filters.sortOrder)
      
      // 페이지별로 데이터 가져오기
      while (hasMore) {
        const params = new URLSearchParams(baseParams)
        params.append('page', currentPageNum.toString())
        params.append('limit', pageSize.toString())
        
        const response = await fetch(`/api/admin/reservations?${params}`)
        const data = await response.json()
        
        if (data.success && data.data && data.data.length > 0) {
          const reservationsWithTickets = await Promise.all(data.data.map(async (reservation) => {
            try {
              const ticketsResponse = await fetch(`/api/tickets?reservationId=${reservation.id}`)
              const ticketsResult = await ticketsResponse.json()
              return {
                ...reservation,
                tickets: ticketsResult.success ? ticketsResult.data : []
              }
            } catch (error) {
              console.error('티켓 조회 오류:', error)
              return {
                ...reservation,
                tickets: []
              }
            }
          }))
          
          allData = [...allData, ...reservationsWithTickets]
          
          if (data.data.length < pageSize) {
            hasMore = false
          } else {
            currentPageNum++
          }
        } else {
          hasMore = false
        }
      }
      
      if (allData.length === 0) {
        alert('다운로드할 데이터가 없습니다.')
        return
      }
      
      // 전체 데이터를 확장
      const expandedData = expandReservationsByTickets(allData)
      
      // 엑셀 데이터 준비
      const excelData = expandedData.map(item => ({
        '예약번호': item.id,
        '고객명': item.customerName ? item.customerName.trim() : '',  // ← trim() 추가
        '전화번호': formatPhoneNumber(item.phone),
        '이메일': item.email,
        '회원구분': item.userId ? '회원' : '비회원',
        '이용월': formatYearMonth(item.visitDate),
        '예약일시': formatDateTime(item.createdAt),
        '이용권': item.ticketInfo.ticket_type.replace(/권/g, ''),
        '금액': item.ticketInfo.price || 0,
        '티켓상태': item.ticketStatus,
        '입장상태': item.ticketEntryStatus,
        '입장시간': item.ticketInfo.used_at ? formatDateTime(item.ticketInfo.used_at) : '',
        '취소시간': item.ticketInfo.cancelled_at ? formatDateTime(item.ticketInfo.cancelled_at) : ''
      }))
      
      // 워크시트 생성
      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '예약목록_전체')
      
      // 파일 다운로드
      XLSX.writeFile(wb, `예약목록_전체_${new Date().toISOString().slice(0,10)}.xlsx`)
      
      alert(`전체 ${excelData.length}건의 데이터가 다운로드되었습니다.`)
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error)
      alert('엑셀 다운로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }
    
  // 현재 페이지만 엑셀 다운로드
  const handleExportCurrentPageToExcel = () => {
    console.log('현재 페이지 엑셀 다운로드 시작')
    setShowExcelOptions(false)
    
    // 현재 페이지의 확장된 데이터
    const expandedData = expandReservationsByTickets(reservations)
    
    // 엑셀 데이터 준비
    const excelData = expandedData.map(item => ({
      '예약번호': item.id,
      '고객명': item.customerName ? item.customerName.trim() : '',  // ← trim() 추가
      '전화번호': formatPhoneNumber(item.phone),
      '이메일': item.email,
      '회원구분': item.userId ? '회원' : '비회원',
      '이용월': formatYearMonth(item.visitDate),
      '예약일시': formatDateTime(item.createdAt),
      '이용권': item.ticketInfo.ticket_type.replace(/권/g, ''),
      '금액': item.ticketInfo.price || 0,
      '티켓상태': item.ticketStatus,
      '입장상태': item.ticketEntryStatus,
      '입장시간': item.ticketInfo.used_at ? formatDateTime(item.ticketInfo.used_at) : '',
      '취소시간': item.ticketInfo.cancelled_at ? formatDateTime(item.ticketInfo.cancelled_at) : ''
    }))
    
    // 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '예약목록')
    
    // 파일 다운로드
    XLSX.writeFile(wb, `예약목록_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  // 필터 변경 핸들러 (임시 필터에 저장)
  const handleFilterChange = (filterName, value) => {
    console.log('필터 변경:', filterName, '=', value)
    
    setTempFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  
  const handleMultiSelectChange = (filterName, values) => {
    console.log('=== 필터 변경 ===')
    console.log('필터명:', filterName)
    console.log('선택값:', values)
    console.log('기존 필터:', tempFilters)
    
    setTempFilters(prev => ({
      ...prev,
      [filterName]: values
    }))
    
    console.log('변경 후 예상 필터:', { ...tempFilters, [filterName]: values })
  }

  // 필터 초기화
  const resetFilters = () => {
    console.log('🔄 필터 초기화!')
    const initialFilters = {
      paymentStatusList: [],
      reservationStatusList: [],
      memberType: 'all',
      visitMonth: '',
      searchKeyword: '',   
      reservationId: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
    setTempFilters(initialFilters)
    setFilters(initialFilters)
    setCurrentPage(1)
  }

  // 검색 실행 함수 추가
  const handleSearch = () => {
    console.log('🔍 검색 버튼 클릭됨!')
    console.log('현재 tempFilters:', tempFilters)
    console.log('적용할 filters:', { ...tempFilters })
    
    setFilters({ ...tempFilters })
    setCurrentPage(1)
    // loadReservations는 useEffect에서 자동 호출됨
  }

  // 결제 상태 변경 함수 (결제 전 → 결제완료) - 티켓별 개별 처리
  const handleConfirmPayment = async (ticketId, reservationId, customerName, ticketNumber) => {
    if (!confirm(`${customerName} 고객의 ${ticketNumber}번 티켓을 결제완료로 변경하시겠습니까?`)) {
      return
    }

    try {
      setProcessingId(ticketId)
      
      const response = await fetch('/api/admin/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId: ticketId,
          action: 'payment_status',
          value: '결제 완료'
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`${customerName} 고객의 ${ticketNumber}번 티켓 결제가 확인되었습니다.`)
        loadReservations()
      } else {
        alert(`결제 확인 중 오류가 발생했습니다: ${result.message}`)
      }
    } catch (error) {
      console.error('결제 확인 오류:', error)
      alert('결제 확인 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }

  // 결제 취소 함수 (결제완료 → 결제 전) - 티켓별 개별 처리
  const handleCancelPayment = async (ticketId, reservationId, customerName, ticketNumber) => {
    if (!confirm(`${customerName} 고객의 ${ticketNumber}번 티켓을 결제 전 상태로 변경하시겠습니까?`)) {
      return
    }

    try {
      setProcessingId(ticketId)
      
      const response = await fetch('/api/admin/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId: ticketId,
          action: 'payment_status',
          value: '결제 전'
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`${customerName} 고객의 ${ticketNumber}번 티켓이 결제 전 상태로 변경되었습니다.`)
        loadReservations()
      } else {
        alert(`결제 취소 중 오류가 발생했습니다: ${result.message}`)
      }
    } catch (error) {
      console.error('결제 취소 오류:', error)
      alert('결제 취소 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }
  
  const handlePaymentStatusChange = async (ticketId, reservationId, customerName, ticketNumber, newStatus) => {
    if (newStatus === '결제완료') {
      // 결제 전 → 결제완료
      await handleConfirmPayment(ticketId, reservationId, customerName, ticketNumber)
    } else if (newStatus === '결제 전') {
      // 결제완료 → 결제 전
      await handleCancelPayment(ticketId, reservationId, customerName, ticketNumber)
    }
  }
  
 const handleReservationStatusChange = async (ticketId, reservationId, customerName, ticketNumber, newStatus, currentTicketStatus, currentEntryStatus) => {
   // 예약상태 변경 처리
   if (newStatus === '입장_전' || newStatus === '입장완료') {
     // 입장 상태 변경
     await handleToggleEntryStatus(ticketId, currentEntryStatus, customerName, ticketNumber)
   } else if (newStatus === '취소') {
     // 티켓 취소
     await handleCancelTicket(ticketId, customerName, ticketNumber)
   } else if (newStatus === '복구') {
     // 티켓 복구
     await handleRestoreTicket(ticketId, customerName, ticketNumber)
   } else if (newStatus === '삭제') {
     // 티켓 삭제
     await handleDeleteTicket(ticketId, reservationId, customerName, ticketNumber)
   }
 } 

  // 입장 상태 토글 함수 - 티켓별 개별 처리
  const handleToggleEntryStatus = async (ticketId, currentEntryStatus, customerName, ticketNumber) => {
    const newEntryStatus = currentEntryStatus === '입장완료' ? '입장_전' : '입장완료'
    const actionText = newEntryStatus === '입장완료' ? '입장 처리' : '입장 취소'
    
    if (!confirm(`${customerName} 고객의 ${ticketNumber}번 티켓을 ${actionText} 하시겠습니까?`)) {
      return
    }

    try {
      setProcessingId(ticketId)
      
      const response = await fetch('/api/admin/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId: ticketId,
          action: 'entry_status',
          value: newEntryStatus
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`${customerName} 고객의 ${ticketNumber}번 티켓 ${actionText}가 완료되었습니다.`)
        loadReservations()
      } else {
        alert(`${actionText} 중 오류가 발생했습니다: ${result.message}`)
      }
    } catch (error) {
      console.error('입장 상태 변경 오류:', error)
      alert(`${actionText} 중 오류가 발생했습니다.`)
    } finally {
      setProcessingId(null)
    }
  }

  // 티켓 취소 함수 - 개별 티켓만 취소
  const handleCancelTicket = async (ticketId, customerName, ticketNumber) => {
    if (!confirm(`${customerName} 고객의 ${ticketNumber}번 티켓을 취소하시겠습니까?`)) {
      return
    }
  
    try {
      setProcessingId(ticketId)
      
      // 먼저 예약 정보 조회 (결제 방법 확인용)
      const reservation = reservations.find(r => 
        r.tickets && r.tickets.some(t => t.id === ticketId)
      )
      
      if (!reservation) {
        alert('예약 정보를 찾을 수 없습니다.')
        setProcessingId(null)
        return
      }
      
      // 카드 결제이고 결제완료 상태인 경우 추가 확인
      if (reservation.payment_method === 'card' && reservation.transaction_id) {
        const ticket = reservation.tickets.find(t => t.id === ticketId)
        if (ticket && ticket.ticket_status === '결제완료') {
          if (!confirm(`카드 결제 티켓입니다.\n환불 처리까지 3-5일 소요됩니다.\n\n계속하시겠습니까?`)) {
            setProcessingId(null)
            return
          }
        }
      }
      
      const response = await fetch('/api/admin/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId: ticketId,
          action: 'cancel',
          reservationId: reservation.id,
          paymentMethod: reservation.payment_method,
          transactionId: reservation.transaction_id
        })
      })
  
      const result = await response.json()
  
      if (result.success) {
        alert(`${customerName} 고객의 ${ticketNumber}번 티켓이 취소되었습니다.`)
        loadReservations()
      } else {
        alert(`티켓 취소 중 오류가 발생했습니다: ${result.message}`)
      }
    } catch (error) {
      console.error('티켓 취소 오류:', error)
      alert('티켓 취소 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }
  
  // 예약 전체 티켓 취소 함수
  const handleCancelAllTickets = async (reservationId, customerName, totalTickets) => {
    if (!confirm(`${customerName} 고객의 예약(티켓 ${totalTickets}매)을 모두 취소하시겠습니까?`)) {
      return
    }
  
    try {
      setProcessingId(`all-${reservationId}`)
      
      // 예약 정보 찾기
      const reservation = reservations.find(r => r.id === reservationId)
      
      if (!reservation) {
        alert('예약 정보를 찾을 수 없습니다.')
        setProcessingId(null)
        return
      }
      
      // 카드 결제인 경우 추가 확인
      if (reservation.payment_method === 'card' && reservation.transaction_id) {
        if (!confirm(`카드 결제 예약입니다.\n환불 처리까지 3-5일 소요됩니다.\n\n계속하시겠습니까?`)) {
          setProcessingId(null)
          return
        }
      }
      
      const response = await fetch('/api/admin/reservations/cancel-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservationId: reservationId,
          paymentMethod: reservation.payment_method || reservation.paymentMethod,  // 필드명 확인
          transactionId: reservation.transaction_id || reservation.transactionId,    // 필드명 확인
          totalAmount: reservation.totalAmount || reservation.total_amount          // 필드명 확인
        })
      })
  
      const result = await response.json()
  
      if (result.success) {
        alert(`${customerName} 고객의 예약이 전체 취소되었습니다.`)
        loadReservations()
      } else {
        alert(`예약 전체 취소 중 오류가 발생했습니다: ${result.message}`)
      }
    } catch (error) {
      console.error('예약 전체 취소 오류:', error)
      alert('예약 전체 취소 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }

  // 티켓 복구 함수 - 개별 티켓만 복구
  const handleRestoreTicket = async (ticketId, customerName, ticketNumber) => {
    if (!confirm(`${customerName} 고객의 ${ticketNumber}번 티켓을 복구하시겠습니까?`)) {
      return
    }

    try {
      setProcessingId(ticketId)
      
      const response = await fetch('/api/admin/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId: ticketId,
          action: 'restore',
		  restoreStatus: '결제 완료'
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`${customerName} 고객의 ${ticketNumber}번 티켓이 복구되었습니다.`)
        loadReservations()
      } else {
        alert(`티켓 복구 중 오류가 발생했습니다: ${result.message}`)
      }
    } catch (error) {
      console.error('티켓 복구 오류:', error)
      alert('티켓 복구 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }

  // 예약 전체 티켓 복구 함수
  const handleRestoreAllTickets = async (reservationId, customerName, totalTickets) => {
    if (!confirm(`${customerName} 고객의 취소된 예약(티켓 ${totalTickets}매)을 모두 복구하시겠습니까?`)) {
      return
    }

    try {
      setProcessingId(`all-${reservationId}`)
      
      const response = await fetch('/api/admin/reservations/restore-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservationId: reservationId,
		  restoreStatus: '결제완료'
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`${customerName} 고객의 예약이 전체 복구되었습니다.`)
        loadReservations()
      } else {
        alert(`예약 전체 복구 중 오류가 발생했습니다: ${result.message}`)
      }
    } catch (error) {
      console.error('예약 전체 복구 오류:', error)
      alert('예약 전체 복구 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }
  
  // 예약 전체 티켓 입장완료 함수
  const handleCheckinAllTickets = async (reservationId, customerName, totalTickets) => {
    if (!confirm(`${customerName} 고객의 예약(티켓 ${totalTickets}매)을 모두 입장완료 처리하시겠습니까?`)) {
      return
    }

    try {
      setProcessingId(`all-${reservationId}`)
      
      const response = await fetch('/api/admin/reservations/checkin-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservationId: reservationId
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`${customerName} 고객의 예약이 전체 입장완료 처리되었습니다.`)
        loadReservations()
      } else {
        alert(`예약 전체 입장완료 처리 중 오류가 발생했습니다: ${result.message}`)
      }
    } catch (error) {
      console.error('예약 전체 입장완료 처리 오류:', error)
      alert('예약 전체 입장완료 처리 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }

  // 티켓 완전 삭제 함수 - 개별 티켓 영구 삭제
  const handleDeleteTicket = async (ticketId, reservationId, customerName, ticketNumber) => {
    // 2단계 확인 (더 강력한 경고)
    const firstConfirm = confirm(`경고: ${customerName} 고객의 ${ticketNumber}번 티켓을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!`)
    
    if (!firstConfirm) return
    
    const secondConfirm = confirm(`최종 확인: 정말로 ${customerName} 고객의 ${ticketNumber}번 티켓을 영구 삭제하시겠습니까?\n\n삭제된 데이터는 복구할 수 없습니다.`)
    
    if (!secondConfirm) return

    try {
      setProcessingId(ticketId)
      
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservationId: reservationId,
          permanent: true  // 영구 삭제 플래그
        })
      })

      const result = await response.json()

      if (result.success) {
        if (result.data && result.data.reservationDeleted) {
          alert(`${customerName} 고객의 마지막 티켓이 삭제되어 예약도 함께 삭제되었습니다.`)
        } else {
          alert(`${customerName} 고객의 ${ticketNumber}번 티켓이 완전히 삭제되었습니다.`)
        }
        loadReservations()
      } else {
        alert(`티켓 삭제 중 오류가 발생했습니다: ${result.message}`)
      }
    } catch (error) {
      console.error('티켓 삭제 오류:', error)
      alert('티켓 삭제 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }

  // 예약 전체 완전 삭제 함수 - 예약과 모든 티켓 영구 삭제
  const handleDeleteAllTickets = async (reservationId, customerName, totalTickets) => {
    // 2단계 확인으로 변경
    const firstConfirm = confirm(`경고: ${customerName} 고객의 전체 예약(티켓 ${totalTickets}매)을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!`)
    
    if (!firstConfirm) return
    
    const secondConfirm = confirm(`최종 확인: 정말로 ${customerName} 고객의 예약 전체를 영구 삭제하시겠습니까?`)
    
    if (!secondConfirm) return

    try {
      setProcessingId(`all-${reservationId}`)
      
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          permanent: true,  // 영구 삭제 플래그
          includeTickets: true  // 티켓도 함께 삭제
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`${customerName} 고객의 예약이 완전히 삭제되었습니다.\n\n삭제된 항목:\n- 예약 1건\n- 티켓 ${totalTickets}매`)
        loadReservations()
      } else {
        alert(`예약 삭제 중 오류가 발생했습니다: ${result.message}`)
      }
    } catch (error) {
      console.error('예약 삭제 오류:', error)
      alert('예약 삭제 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }
  
  const handleAllTicketsAction = async (reservationId, customerName, totalTickets, action) => {
    // 전체 관리 액션 처리
    if (action === '전체 입장완료') {
      await handleCheckinAllTickets(reservationId, customerName, totalTickets)
    } else if (action === '전체 취소') {
      await handleCancelAllTickets(reservationId, customerName, totalTickets)
    } else if (action === '전체 복구') {
      await handleRestoreAllTickets(reservationId, customerName, totalTickets)
    } else if (action === '전체 삭제') {
      await handleDeleteAllTickets(reservationId, customerName, totalTickets)
    }
  }
  
  

  // 날짜시간 포맷팅 (예약한 날짜 - 한국시간 시분까지)
  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    
    // "2025-08-06T16:28:14+00:00" 형식을 파싱
    const [datePart, timePart] = dateString.split('T')
    if (!datePart || !timePart) return dateString
    
    const [year, month, day] = datePart.split('-')
    const [hour, minute] = timePart.split(':')
    
    // "2025-08-06 16:28" 형식으로 반환
    return `${year}-${month}-${day} ${hour}:${minute}`
  }

  // 날짜 포맷팅 (이용일 - 날짜만)
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    
    // "2025-08-06" 또는 "2025-08-06T..." 형식 처리
    const datePart = dateString.split('T')[0]
    const [year, month, day] = datePart.split('-')
    
    return `${year}.${month}.${day}`
  }

  // 이용월만 포맷팅하는 함수 추가
  const formatYearMonth = (dateString) => {
    if (!dateString) return '-'
    
    // "2025-08-06" 또는 "2025-08-06T..." 형식 처리
    const datePart = dateString.split('T')[0]
    const [year, month] = datePart.split('-')
    
    return `${year}-${month}`
  }
  
  // 짧은 형식의 날짜시간 포맷팅 (MM/DD HH:mm)
  const formatDateTimeShort = (dateString) => {
    if (!dateString) return '-'
    
    // "2025-08-06T16:12:32+00:00" → "2025.08.06 16:12"
    // T 앞까지만 자르고, 시간은 처음 5자리(HH:mm)만 사용
    const [datePart, timePart] = dateString.split('T')
    const formattedDate = datePart.replace(/-/g, '.')
    const formattedTime = timePart.substring(0, 5)
    
    return `${formattedDate} ${formattedTime}`
  }

  // 금액 포맷팅
  const formatMoney = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return '0원'
    return new Intl.NumberFormat('ko-KR').format(numAmount) + '원'
  }

  // 예약 상태 뱃지
  const getStatusBadge = (status) => {
    const statusConfig = {
      '결제 완료': { text: '결제완료', color: 'bg-green-100 text-green-800' },
      '결제완료': { text: '결제완료', color: 'bg-green-100 text-green-800' },
      '결제 전': { text: '결제 전', color: 'bg-yellow-100 text-yellow-800' },
      '취소': { text: '취소', color: 'bg-red-100 text-red-800' }
    }

    const config = statusConfig[status] || { text: status, color: 'bg-gray-100 text-gray-600' }
    
    return (
      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  // 티켓 상태 뱃지
  const getTicketStatusBadge = (ticketStatus, ticketInfo = null) => {
    console.log('=== getTicketStatusBadge 호출 ===')
    console.log('ticketStatus:', ticketStatus)
    console.log('ticketInfo:', ticketInfo)
    console.log('cancelled_at:', ticketInfo?.cancelled_at)
    
    const statusConfig = {
      '결제완료': { text: '결제완료', color: 'bg-green-100 text-green-800' },
      '결제 전': { text: '결제 전', color: 'bg-yellow-100 text-yellow-800' },
      '취소': { text: '티켓 취소', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[ticketStatus] || { text: ticketStatus, color: 'bg-gray-100 text-gray-600' }
    
    // 취소 상태이고 취소 시간이 있는 경우
    if (ticketStatus === '취소' && ticketInfo && ticketInfo.cancelled_at) {
      console.log('취소 시간 표시 조건 충족!')
      const formattedTime = formatDateTimeShort(ticketInfo.cancelled_at)
      console.log('포맷된 시간:', formattedTime)
      
      return (
        <div className="flex flex-col items-center space-y-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${config.color}`}>
            {config.text}
          </span>
          <div className="text-xs font-medium text-gray-800 whitespace-nowrap" style={{ fontSize: '12px', color: '#1f2937' }}>
            취소: {formattedTime}
          </div>
        </div>
      )
    }
    
    console.log('기본 뱃지만 반환')
    
    // 기본 뱃지만 반환
    return (
      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }
   
  // 입장 상태 뱃지
  const getEntryStatusBadge = (entryStatus, ticketInfo = null, ticketStatus = null) => {
    // 취소 상태면 입장 시간 표시 안함
    if (ticketStatus === '취소') {
      return (
        <span className="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
          취소됨
        </span>
      )
    }
    
    if (entryStatus === '입장완료') {
      return (
        <div className="space-y-1">
          <span className="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            입장완료
          </span>
          {/* 입장 시간 표시 */}
          {ticketInfo && ticketInfo.used_at && (
            <div className="text-sm font-medium text-gray-800">
              입장: {formatDateTimeShort(ticketInfo.used_at)}
            </div>
          )}
        </div>
      )
    } else {
      return (
        <span className="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
          입장 전
        </span>
      )
    }
  }
  
  // 결제 방법 뱃지
  const getPaymentMethodBadge = (method) => {
    if (method === 'card') {
      return (
        <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-100 text-purple-700">
          카드
        </span>
      )
    } else if (method === 'bank') {
      return (
        <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-700">
          무통장
        </span>
      )
    } else {
      return null
    }
  }

  // 정렬 순서 옵션 동적 생성
  const getSortOrderOptions = () => {
    switch (tempFilters.sortBy) {
      case 'totalAmount':
        return [
          { value: 'desc', label: '높은순' },
          { value: 'asc', label: '낮은순' }
        ]
      case 'customerName':
        return [
          { value: 'asc', label: '가나다순' },
          { value: 'desc', label: '역순' }
        ]
      case 'cancelledAt':  
      case 'createdAt':
      case 'visitDate':
      default:
        return [
          { value: 'desc', label: '최신순' },
          { value: 'asc', label: '오래된순' }
        ]
    }
  }

  // 페이지 수 계산
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  // 페이지 직접 이동 함수
  const handlePageJump = () => {
    const pageNum = parseInt(pageInput)
    if (pageNum && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
      setPageInput('')
    } else {
      alert(`1부터 ${totalPages}까지의 페이지 번호를 입력하세요.`)
      setPageInput('')
    }
  }
  
  // 페이지 번호 배열 생성 함수 추가
  const getPageNumbers = () => {
    const maxPages = 15 // 최대 표시할 페이지 수
    const pageNumbers = []
    
    if (totalPages <= maxPages) {
      // 전체 페이지가 8개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // 전체 페이지가 8개 초과면 현재 페이지 중심으로 표시
      let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2))
      let endPage = Math.min(totalPages, startPage + maxPages - 1)
      
      // 끝 페이지에 가까울 때 조정
      if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPages + 1)
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }
    }
    
    return pageNumbers
  }

  return (
    <AdminLayout>
      <div className="p-2 sm:p-4 md:p-6 lg:p-4 xl:p-6">
        <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-5 xl:mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl font-bold text-gray-900">예약 관리</h1>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base">입장권 예약 목록 및 상태 관리</p>
        </div>

        {/* 필터 섹션 - 개선된 버전 */}
        <div className="bg-white p-3 sm:p-4 md:p-5 lg:p-4 xl:p-6 rounded-lg shadow-sm border mb-4 sm:mb-5 md:mb-6 lg:mb-5 xl:mb-6">
          {/* 기본 필터 - 한 줄로 변경 */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
            {/* 결제 상태 드롭다운 - 크기 축소 */}
            <MultiSelectDropdown
              label="결제 상태"
              options={paymentStatusOptions}
              value={filters.paymentStatusList}
              onChange={(values) => {
                setFilters(prev => ({
                  ...prev,
                  paymentStatusList: values
                }))
                setTempFilters(prev => ({
                  ...prev,
                  paymentStatusList: values
                }))
                setCurrentPage(1)
              }}
              placeholder="결제 상태를 선택하세요"
            />
            
            {/* 예약 상태 드롭다운 - 크기 축소 */}
            <MultiSelectDropdown
              label="예약 상태"
              options={reservationStatusOptions}
              value={filters.reservationStatusList}
              onChange={(values) => {
                setFilters(prev => ({
                  ...prev,
                  reservationStatusList: values
                }))
                setTempFilters(prev => ({
                  ...prev,
                  reservationStatusList: values
                }))
                setCurrentPage(1)
              }}
              placeholder="예약 상태를 선택하세요"
            />
            
            {/* 고객 검색 - 크기 축소 */}
            <div>
              <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1">
                고객 검색
              </label>
              <input
                type="text"
                placeholder="고객명 또는 전화번호 입력"
                value={tempFilters.searchKeyword}
                onChange={(e) => handleFilterChange('searchKeyword', e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* 버튼 그룹 - 3칸 차지 */}
            <div className="lg:col-span-3">
              <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1 lg:invisible">
                &nbsp;
              </label>
              <div className="flex gap-2 relative">
                <button
                  onClick={() => handleSearch()}
                  className="flex-1 px-3 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-blue-600 text-white text-xs sm:text-sm md:text-base lg:text-sm xl:text-base rounded-md hover:bg-blue-700 transition-colors"
                >
                  검색
                </button>
                <button
                  onClick={resetFilters}
                  className="flex-1 px-3 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-red-500 text-white text-xs sm:text-sm md:text-base lg:text-sm xl:text-base rounded-md hover:bg-red-600 transition-colors"
                >
                  필터 초기화
                </button>
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowExcelOptions(!showExcelOptions)}
                    className="w-full px-3 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-green-600 text-white text-xs sm:text-sm md:text-base lg:text-sm xl:text-base rounded-md hover:bg-green-700 transition-colors"
                  >
                    엑셀 다운로드
                  </button>
                  {/* 엑셀 다운로드 메뉴 - 버튼 바로 아래 */}
                  {showExcelOptions && (
                    <div className="absolute top-full mt-1 left-0 right-0 w-full bg-white rounded-md shadow-lg border border-gray-200 z-20 excel-menu-container">
                      <button
                        onClick={() => handleExportAllToExcel()}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        전체 다운로드
                      </button>
                      <button
                        onClick={() => handleExportCurrentPageToExcel()}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        현재 페이지만 다운로드
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowByTicket(!showByTicket)}
                  className={`flex-1 px-3 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 ${showByTicket ? 'bg-purple-600' : 'bg-gray-600'} text-white text-xs sm:text-sm md:text-base lg:text-sm xl:text-base rounded-md hover:${showByTicket ? 'bg-purple-700' : 'bg-gray-700'} transition-colors`}
                >
                  {showByTicket ? '티켓별 보기 ON' : '티켓별 보기 OFF'}
                </button>
                <button
                  onClick={() => setShowDetailFilters(!showDetailFilters)}
                  className="flex-1 px-3 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-gray-600 text-white text-xs sm:text-sm md:text-base lg:text-sm xl:text-base rounded-md hover:bg-gray-700 transition-colors"
                >
                  {showDetailFilters ? '상세 필터 ▲' : '상세 필터 ▼'}
                </button>
              </div>
            </div>
          </div>

          {/* 상세 필터 (토글) */}
          {showDetailFilters && (

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
				  
				{/* 예약번호 검색 */}
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1">
                    예약번호
                  </label>
                  <input
                    type="text"
                    placeholder="예약번호 입력"
                    value={tempFilters.reservationId || ''}
                    onChange={(e) => handleFilterChange('reservationId', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 회원 구분 */}
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1">
                    회원 구분
                  </label>
                  <select
                    value={tempFilters.memberType}
                    onChange={(e) => handleFilterChange('memberType', e.target.value)}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">전체</option>
                    <option value="member">회원</option>
                    <option value="non-member">비회원</option>
                  </select>
                </div>

                {/* 이용월 필터 */}
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1">
                    이용월
                  </label>
                  <input
                    type="month"
                    value={tempFilters.visitMonth}
                    onChange={(e) => handleFilterChange('visitMonth', e.target.value)}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 정렬 기준 */}
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1">
                    정렬 기준
                  </label>
                  <select
                    value={tempFilters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="createdAt">예약일시</option>
                    <option value="visitDate">이용일</option>
                    <option value="totalAmount">금액</option>
                    <option value="customerName">고객명</option>
					<option value="cancelledAt">취소시간</option> 
					<option value="checkinTime">입장시간</option>  
                  </select>
                </div>

                {/* 정렬 순서 */}
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1">
                    정렬 순서
                  </label>
                  <select
                    value={tempFilters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getSortOrderOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
			
		  {/* 엑셀 다운로드 메뉴 - 상단 버튼과 연동 */}
          {showExcelOptions && (
            <div className="absolute top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20 excel-menu-container">
              <button
                onClick={() => handleExportAllToExcel()}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                전체 다운로드
              </button>
              <button
                onClick={() => handleExportCurrentPageToExcel()}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                현재 페이지만 다운로드
              </button>
            </div>
          )}

          {/* 필터 정보 표시 */}
          <div className="mt-3 sm:mt-4 md:mt-5 lg:mt-4 xl:mt-5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600">
            {showByTicket ? (
              <>
                총 <span className="font-medium text-blue-600">{totalCount}</span>개의 예약번호, 
                <span className="font-medium text-blue-600">{totalTicketCount}</span>개의 티켓이 있습니다.
                <span className="ml-2 text-purple-600">(현재 페이지 {expandedReservations.length}개 표시 중)</span>
              </>
            ) : (
              <>
                총 <span className="font-medium text-blue-600">{totalCount}</span>개의 예약번호, 
                <span className="font-medium text-blue-600">{totalTicketCount > 0 ? totalTicketCount : '계산중'}</span>개의 티켓이 있습니다.
              </>
            )}
            {(filters.paymentStatusList.length > 0 || filters.reservationStatusList.length > 0 || filters.memberType !== 'all' || 
              filters.visitMonth || filters.searchKeyword || filters.reservationId || 
              filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') && (
              <span className="ml-2 text-orange-600">(필터 적용됨)</span>
            )}
          </div>
        </div>

        {/* 반응형 예약 목록 */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-6 sm:p-8 md:p-10 lg:p-8 xl:p-12 text-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-8 lg:w-8 xl:h-10 xl:w-10 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 sm:mt-3 md:mt-4 lg:mt-3 xl:mt-4 text-gray-600 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base">예약 목록을 불러오고 있습니다...</p>
            </div>
          ) : (
            <>
              {/* 데스크톱 테이블 뷰 (lg 이상) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 lg:px-4 xl:px-6 py-2 lg:py-2.5 xl:py-3 text-left text-xs lg:text-xs xl:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        예약번호
                      </th>
                      <th className="px-3 lg:px-4 xl:px-6 py-2 lg:py-2.5 xl:py-3 text-left text-xs lg:text-xs xl:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        고객정보
                      </th>
                      <th className="px-3 lg:px-4 xl:px-6 py-2 lg:py-2.5 xl:py-3 text-left text-xs lg:text-xs xl:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이메일
                      </th>
                      <th className="px-3 lg:px-4 xl:px-6 py-2 lg:py-2.5 xl:py-3 text-left text-xs lg:text-xs xl:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이용월
                      </th>
                      <th className="px-3 lg:px-4 xl:px-6 py-2 lg:py-2.5 xl:py-3 text-left text-xs lg:text-xs xl:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        예약일시
                      </th>
                      <th className="px-3 lg:px-4 xl:px-6 py-2 lg:py-2.5 xl:py-3 text-left text-xs lg:text-xs xl:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이용권
                      </th>
                      <th className="px-3 lg:px-4 xl:px-6 py-2 lg:py-2.5 xl:py-3 text-left text-xs lg:text-xs xl:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        금액
                      </th>
                      <th className="px-3 lg:px-4 xl:px-6 py-2 lg:py-2.5 xl:py-3 text-left text-xs lg:text-xs xl:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        결제상태
                      </th>
                      <th className="px-3 lg:px-4 xl:px-6 py-2 lg:py-2.5 xl:py-3 text-left text-xs lg:text-xs xl:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        예약상태
                      </th>
                      {!showByTicket && (
                        <th className="px-3 lg:px-4 xl:px-6 py-2 lg:py-2.5 xl:py-3 text-left text-xs lg:text-xs xl:text-xs font-medium text-gray-500 uppercase tracking-wider">
                          전체관리
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expandedReservations.length > 0 ? (
                      expandedReservations.map((expandedReservation, index) => {
                        const ticket = expandedReservation.ticketInfo
                        const isFirstTicket = expandedReservation.isFirstTicket
                        
                        return (
                        <tr key={`${expandedReservation.id}-${index}`} className="hover:bg-gray-50">
                          {/* 티켓별로 보기가 ON이거나 첫 번째 티켓일 때만 예약번호 표시 */}
                          {(showByTicket || isFirstTicket) && (
                            <td className="px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-4 whitespace-nowrap text-xs lg:text-sm xl:text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                              <div className="font-medium truncate max-w-[120px] lg:max-w-[140px] xl:max-w-[160px]" title={expandedReservation.id}>
                                {expandedReservation.id}
                              </div>
                            </td>
                          )}
                          {(showByTicket || isFirstTicket) && (
                            <td className="px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-4 whitespace-nowrap text-xs lg:text-sm xl:text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                              <div className="text-xs text-gray-700 font-medium mb-0.5">
                                {expandedReservation.userId ? '회원' : '비회원'}
                                {expandedReservation.paymentMethod && (
                                  <span className="ml-2">
                                    {getPaymentMethodBadge(expandedReservation.paymentMethod)}
                                  </span>
                                )}
                              </div>
                              <div className="font-medium">{expandedReservation.customerName}</div>
                              <div className="text-gray-500 text-xs lg:text-sm">{expandedReservation.phone}</div>
                            </td>
                          )}
                          {(showByTicket || isFirstTicket) && (
                            <td className="px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-4 whitespace-nowrap text-xs lg:text-sm xl:text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                              <div className="text-gray-600 truncate max-w-[140px] lg:max-w-[160px] xl:max-w-[200px]" title={expandedReservation.email}>
                                {expandedReservation.email}
                              </div>
                            </td>
                          )}
                          {(showByTicket || isFirstTicket) && (
                            <td className="px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-4 whitespace-nowrap text-xs lg:text-sm xl:text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                              {editingVisitDate === expandedReservation.id ? (
                                // 편집 모드
                                <div className="space-y-2">
                                  <input
                                    type="month"
                                    value={newVisitDate}
                                    onChange={(e) => setNewVisitDate(e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-xs lg:text-sm"
                                  />
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleSaveVisitDate(expandedReservation.id)}
                                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={handleCancelEditVisitDate}
                                      className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                                    >
                                      취소
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // 보기 모드
                                <div className="space-y-1">
                                  <div>{formatYearMonth(expandedReservation.visitDate)}</div>
                                  <button
                                    onClick={() => handleChangeVisitDate(expandedReservation.id, expandedReservation.visitDate)}
                                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                                  >
                                    변경
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                          {(showByTicket || isFirstTicket) && (
                            <td className="px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-4 whitespace-nowrap text-xs lg:text-sm xl:text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                              {formatDateTime(expandedReservation.createdAt)}
                            </td>
                          )}
                          <td className="px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-4 whitespace-nowrap text-xs lg:text-sm xl:text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">#{ticket.ticket_number || expandedReservation.ticketIndex + 1}</span>
                              <span>{ticket.ticket_type.replace(' (감면)', '')}</span>
                              {/* 감면/일반 구분 표시 */}
                              {(expandedReservation.ticketInfo.is_discount || ticket.ticket_type?.includes('(감면)')) ? (
                                <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-orange-100 text-orange-700">
                                  감면
                                </span>
                              ) : (
                                <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                                  일반
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-4 whitespace-nowrap text-xs lg:text-sm xl:text-sm text-gray-900">
                            <div className="font-medium">{formatMoney(ticket.price || 0)}</div>
                          </td>
                          {/* 결제상태 열 */}
                          <td className="px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-4 whitespace-nowrap">
                            <StatusDropdown
                              options={[
                                { value: '결제 전', label: '결제 전', color: 'text-yellow-700' },
                                { value: '결제완료', label: '결제완료', color: 'text-green-700' }
                              ]}
                              value={expandedReservation.ticketStatus === '결제 완료' ? '결제완료' : expandedReservation.ticketStatus}
                              onChange={(newValue) => handlePaymentStatusChange(
                                expandedReservation.ticketId, 
                                expandedReservation.id, 
                                expandedReservation.customerName, 
                                expandedReservation.ticketInfo.ticket_number || expandedReservation.ticketIndex + 1, 
                                newValue
                              )}
                              disabled={expandedReservation.ticketStatus === '취소'}
                            />
                            {/* 취소 시간 표시 추가 */}
                            {expandedReservation.ticketStatus === '취소' && expandedReservation.ticketInfo?.cancelled_at && (
                              <div className="mt-1 text-sm font-medium text-gray-800">
                                취소: {formatDateTimeShort(expandedReservation.ticketInfo.cancelled_at)}
                              </div>
                            )}
                          </td>
                          
                          {/* 예약상태 열 */}
                          <td className="px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-4 whitespace-nowrap">
                            <StatusDropdown
                              options={
                                expandedReservation.ticketStatus === '취소' 
                                  ? [
                                      { value: '복구', label: '복구', color: 'text-green-700' },
                                      { value: '삭제', label: '삭제', color: 'text-red-700' }
                                    ]
                                  : [
                                      { value: '입장_전', label: '입장 전', color: 'text-orange-700' },
                                      { value: '입장완료', label: '입장완료', color: 'text-blue-700' },
                                      { value: '취소', label: '취소', color: 'text-red-700' },
                                      { value: '삭제', label: '삭제', color: 'text-red-900' }
                                    ]
                              }
                              value={expandedReservation.ticketStatus === '취소' ? '취소' : expandedReservation.ticketEntryStatus}
                              onChange={(newValue) => handleReservationStatusChange(
                                expandedReservation.ticketId, 
                                expandedReservation.id, 
                                expandedReservation.customerName, 
                                expandedReservation.ticketInfo.ticket_number || expandedReservation.ticketIndex + 1,
                                newValue,
                                expandedReservation.ticketStatus,
                                expandedReservation.ticketEntryStatus
                              )}
                            />
                            {/* 입장 시간 표시 추가 */}
                            {expandedReservation.ticketStatus !== '취소' && 
                             expandedReservation.ticketEntryStatus === '입장완료' && 
                             expandedReservation.ticketInfo?.used_at && (
                              <div className="mt-1 text-sm font-medium text-gray-800">
                                입장: {formatDateTimeShort(expandedReservation.ticketInfo.used_at)}
                              </div>
                            )}
                          </td>
                          {!showByTicket && (
                            expandedReservation.isFirstTicket && expandedReservation.totalTickets > 1 ? (
                              <td className="px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-4 whitespace-nowrap text-xs lg:text-sm xl:text-sm" rowSpan={expandedReservation.totalTickets}>
                                <StatusDropdown
                                  options={
                                    expandedReservation.ticketStatus === '취소'
                                      ? [
                                          { value: '전체 복구', label: '전체 복구', color: 'text-green-700' },
                                          { value: '전체 삭제', label: '전체 삭제', color: 'text-red-700' }
                                        ]
                                      : [
                                          { value: '전체 입장완료', label: '전체 입장완료', color: 'text-blue-700' },
                                          { value: '전체 취소', label: '전체 취소', color: 'text-red-700' },
                                          { value: '전체 삭제', label: '전체 삭제', color: 'text-red-900' }
                                        ]
                                  }
                                  value=""
                                  onChange={(newValue) => handleAllTicketsAction(
                                    expandedReservation.id, 
                                    expandedReservation.customerName, 
                                    expandedReservation.totalTickets,
                                    newValue
                                  )}
                                />
                              </td>
                            ) : expandedReservation.isFirstTicket ? (
                              <td className="px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-4" rowSpan={expandedReservation.totalTickets}></td>
                            ) : null
                          )}
                        </tr>
                      )})
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500 text-sm lg:text-base">
                          예약 데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 태블릿 테이블 뷰 (md ~ lg 미만) */}
              <div className="hidden md:block lg:hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        예약번호
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        고객정보
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이용월
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이용권
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        금액
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        결제상태
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        예약상태
                      </th>
                      {!showByTicket && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          전체관리
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expandedReservations.length > 0 ? (
                      expandedReservations.map((expandedReservation, index) => {
                        const ticket = expandedReservation.ticketInfo
                        const isFirstTicket = expandedReservation.isFirstTicket
                        
                        return (
                        <tr key={`${expandedReservation.id}-${index}`} className="hover:bg-gray-50">
                          {(showByTicket || isFirstTicket) && (
                            <td className="px-4 py-3 text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                              <div className="font-medium truncate max-w-[150px]" title={expandedReservation.id}>
                                {expandedReservation.id}
                              </div>
                            </td>
                          )}
                          {(showByTicket || isFirstTicket) && (
                            <td className="px-4 py-3 text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                              <div className="text-xs text-gray-700 font-medium mb-0.5">
                                {expandedReservation.userId ? '회원' : '비회원'}
                                {expandedReservation.paymentMethod && (
                                  <span className="ml-2">
                                    {getPaymentMethodBadge(expandedReservation.paymentMethod)}
                                  </span>
                                )}
                              </div>
                              <div className="font-medium">{expandedReservation.customerName}</div>
                              <div className="text-gray-500 text-xs">{expandedReservation.phone}</div>
                              <div className="text-gray-500 text-xs truncate max-w-[180px]" title={expandedReservation.email}>
                                {expandedReservation.email}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">예약일: {formatDateTime(expandedReservation.createdAt)}</div>
                            </td>
                          )}
                          {(showByTicket || isFirstTicket) && (
                            <td className="px-4 py-3 text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                              {formatYearMonth(expandedReservation.visitDate)}
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">#{ticket.ticket_number || expandedReservation.ticketIndex + 1}</span>
                              <span>{ticket.ticket_type.replace(' (감면)', '')}</span>
                              {/* 감면/일반 구분 표시 */}
                              {(expandedReservation.ticketInfo.is_discount || ticket.ticket_type?.includes('(감면)')) ? (
                                <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-orange-100 text-orange-700">
                                  감면
                                </span>
                              ) : (
                                <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                                  일반
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-medium">{formatMoney(ticket.price || 0)}</div>
                          </td>
                          {/* 결제상태 열 */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusDropdown
                              options={[
                                { value: '결제 전', label: '결제 전', color: 'text-yellow-700' },
                                { value: '결제완료', label: '결제완료', color: 'text-green-700' }
                              ]}
                              value={expandedReservation.ticketStatus === '결제 완료' ? '결제완료' : expandedReservation.ticketStatus}
                              onChange={(newValue) => handlePaymentStatusChange(
                                expandedReservation.ticketId, 
                                expandedReservation.id, 
                                expandedReservation.customerName, 
                                expandedReservation.ticketInfo.ticket_number || expandedReservation.ticketIndex + 1, 
                                newValue
                              )}
                              disabled={expandedReservation.ticketStatus === '취소'}
                            />
                            {/* 취소 시간 표시 추가 */}
                            {expandedReservation.ticketStatus === '취소' && expandedReservation.ticketInfo?.cancelled_at && (
                              <div className="mt-1 text-sm font-medium text-gray-800">
                                취소: {formatDateTimeShort(expandedReservation.ticketInfo.cancelled_at)}
                              </div>
                            )}
                          </td>
                          
                          {/* 예약상태 열 */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusDropdown
                              options={
                                expandedReservation.ticketStatus === '취소' 
                                  ? [
                                      { value: '복구', label: '복구', color: 'text-green-700' },
                                      { value: '삭제', label: '삭제', color: 'text-red-700' }
                                    ]
                                  : [
                                      { value: '입장_전', label: '입장 전', color: 'text-orange-700' },
                                      { value: '입장완료', label: '입장완료', color: 'text-blue-700' },
                                      { value: '취소', label: '취소', color: 'text-red-700' },
                                      { value: '삭제', label: '삭제', color: 'text-red-900' }
                                    ]
                              }
                              value={expandedReservation.ticketStatus === '취소' ? '취소' : expandedReservation.ticketEntryStatus}
                              onChange={(newValue) => handleReservationStatusChange(
                                expandedReservation.ticketId, 
                                expandedReservation.id, 
                                expandedReservation.customerName, 
                                expandedReservation.ticketInfo.ticket_number || expandedReservation.ticketIndex + 1,
                                newValue,
                                expandedReservation.ticketStatus,
                                expandedReservation.ticketEntryStatus
                              )}
                            />
                            {/* 입장 시간 표시 추가 */}
                            {expandedReservation.ticketStatus !== '취소' && 
                             expandedReservation.ticketEntryStatus === '입장완료' && 
                             expandedReservation.ticketInfo?.used_at && (
                              <div className="mt-1 text-sm font-medium text-gray-800">
                                입장: {formatDateTimeShort(expandedReservation.ticketInfo.used_at)}
                              </div>
                            )}
                          </td>
                          {expandedReservation.isFirstTicket && expandedReservation.totalTickets > 1 ? (
                            <td className="px-4 py-3 whitespace-nowrap text-sm" rowSpan={expandedReservation.totalTickets}>
                              <StatusDropdown
                                options={
                                  expandedReservation.ticketStatus === '취소'
                                    ? [
                                        { value: '전체 복구', label: '전체 복구', color: 'text-green-700' },
                                        { value: '전체 삭제', label: '전체 삭제', color: 'text-red-700' }
                                      ]
                                    : [
                                        { value: '전체 입장완료', label: '전체 입장완료', color: 'text-blue-700' },
                                        { value: '전체 취소', label: '전체 취소', color: 'text-red-700' },
                                        { value: '전체 삭제', label: '전체 삭제', color: 'text-red-900' }
                                      ]
                                }
                                value=""
                                onChange={(newValue) => handleAllTicketsAction(
                                  expandedReservation.id, 
                                  expandedReservation.customerName, 
                                  expandedReservation.totalTickets,
                                  newValue
                                )}
                              />
                            </td>
                          ) : expandedReservation.isFirstTicket ? (
                            <td className="px-4 py-3" rowSpan={expandedReservation.totalTickets}></td>
                          ) : null}
                        </tr>
                      )})
                    ) : (
                      <tr>
                        <td colSpan={showByTicket ? 7 : 8} className="px-6 py-12 text-center text-gray-500">
                          예약 데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 모바일 카드 뷰 (md 미만) */}
              <div className="md:hidden space-y-3 sm:space-y-4 p-3 sm:p-4">
                {expandedReservations.length > 0 ? (
                  expandedReservations.map((expandedReservation, index) => {
                    const ticket = expandedReservation.ticketInfo
                    const isFirstTicket = expandedReservation.isFirstTicket
                    
                    return (
                    <div key={`${expandedReservation.id}-${index}`} className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                      {/* 예약번호 & 상태 */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs text-gray-500">예약번호</div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[160px] sm:max-w-[200px]" title={expandedReservation.id}>
                            {expandedReservation.id}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1 items-center">
                          {getTicketStatusBadge(expandedReservation.ticketStatus, expandedReservation.ticketInfo)}
                          {/* 취소 상태가 아니고 결제완료일 때만 입장 상태 표시 */}
                          {expandedReservation.ticketStatus !== '취소' && 
                           expandedReservation.ticketStatus === '결제완료' && 
                           getEntryStatusBadge(expandedReservation.ticketEntryStatus, expandedReservation.ticketInfo, expandedReservation.ticketStatus)}
                        </div>
                      </div>

                      {/* 고객정보 + 이메일 (첫 번째 티켓에만 표시) */}
                      {isFirstTicket && (
                        <div>
                          <div className="text-xs text-gray-500">고객정보</div>
                          <div className="text-xs text-gray-700 font-medium mb-0.5">
                            {expandedReservation.userId ? '회원' : '비회원'}
                            {expandedReservation.paymentMethod && (
                              <span className="ml-2">
                                {getPaymentMethodBadge(expandedReservation.paymentMethod)}
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900">{expandedReservation.customerName}</div>
                          <div className="text-xs sm:text-sm text-gray-600">{expandedReservation.phone}</div>
                          <div className="text-xs sm:text-sm text-gray-600 truncate" title={expandedReservation.email}>
                            {expandedReservation.email}
                          </div>
                        </div>
                      )}

                      {/* 이용일 & 예약일시 (첫 번째 티켓에만 표시) */}
                      {isFirstTicket && (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <div className="text-xs text-gray-500">이용월</div>
                            <div className="text-xs sm:text-sm text-gray-900">{formatYearMonth(expandedReservation.visitDate)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">예약일시</div>
                            <div className="text-xs sm:text-sm text-gray-900">{formatDateTime(expandedReservation.createdAt)}</div>
                          </div>
                        </div>
                      )}

                      {/* 티켓 정보 - 각 티켓별로 표시 */}
                      <div className="border-t pt-2">
                        <div className="text-xs text-gray-500 mb-1">티켓 정보</div>
                        <div className="bg-white p-2 rounded border">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">#{ticket.ticket_number || expandedReservation.ticketIndex + 1}</span>
                              <span className="text-sm font-medium">{ticket.ticket_type.replace(' (감면)', '')}</span>
                              {/* 감면/일반 구분 표시 */}
                              {(expandedReservation.ticketInfo.is_discount || ticket.ticket_type?.includes('(감면)')) ? (
                                <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-orange-100 text-orange-700">
                                  감면
                                </span>
                              ) : (
                                <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                                  일반
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-bold text-gray-900">
                              {formatMoney(ticket.price || 0)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 text-right mt-1">
                          {expandedReservation.ticketIndex + 1} / {expandedReservation.totalTickets}
                        </div>
                      </div>

                      {/* 작업 드롭다운 */}
                      <div className="pt-2 space-y-2">
                        {/* 결제상태 드롭다운 */}
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">결제상태</label>
                          <StatusDropdown
                            options={[
                              { value: '결제 전', label: '결제 전', color: 'text-yellow-700' },
                              { value: '결제완료', label: '결제완료', color: 'text-green-700' }
                            ]}
                            value={expandedReservation.ticketStatus === '결제 완료' ? '결제완료' : expandedReservation.ticketStatus}
                            onChange={(newValue) => handlePaymentStatusChange(
                              expandedReservation.ticketId, 
                              expandedReservation.id, 
                              expandedReservation.customerName, 
                              expandedReservation.ticketInfo.ticket_number || expandedReservation.ticketIndex + 1, 
                              newValue
                            )}
                            disabled={expandedReservation.ticketStatus === '취소'}
                            className="w-full"
                          />
                        </div>
                        
                        {/* 예약상태 드롭다운 */}
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">예약상태</label>
                          <StatusDropdown
                            options={
                              expandedReservation.ticketStatus === '취소' 
                                ? [
                                    { value: '복구', label: '복구', color: 'text-green-700' },
                                    { value: '삭제', label: '삭제', color: 'text-red-700' }
                                  ]
                                : [
                                    { value: '입장_전', label: '입장 전', color: 'text-orange-700' },
                                    { value: '입장완료', label: '입장완료', color: 'text-blue-700' },
                                    { value: '취소', label: '취소', color: 'text-red-700' },
                                    { value: '삭제', label: '삭제', color: 'text-red-900' }
                                  ]
                            }
                            value={expandedReservation.ticketStatus === '취소' ? '취소' : expandedReservation.ticketEntryStatus}
                            onChange={(newValue) => handleReservationStatusChange(
                              expandedReservation.ticketId, 
                              expandedReservation.id, 
                              expandedReservation.customerName, 
                              expandedReservation.ticketInfo.ticket_number || expandedReservation.ticketIndex + 1,
                              newValue,
                              expandedReservation.ticketStatus,
                              expandedReservation.ticketEntryStatus
                            )}
                            className="w-full"
                          />
                        </div>
                        
                        {/* 전체관리 드롭다운 (티켓이 2개 이상일 때만) */}
                        {expandedReservation.isFirstTicket && expandedReservation.totalTickets > 1 && (
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">전체관리</label>
                            <StatusDropdown
                              options={
                                expandedReservation.ticketStatus === '취소'
                                  ? [
                                      { value: '전체 복구', label: '전체 복구', color: 'text-green-700' },
                                      { value: '전체 삭제', label: '전체 삭제', color: 'text-red-700' }
                                    ]
                                  : [
                                      { value: '전체 입장완료', label: '전체 입장완료', color: 'text-blue-700' },
                                      { value: '전체 취소', label: '전체 취소', color: 'text-red-700' },
                                      { value: '전체 삭제', label: '전체 삭제', color: 'text-red-900' }
                                    ]
                              }
                              value=""
                              onChange={(newValue) => handleAllTicketsAction(
                                expandedReservation.id, 
                                expandedReservation.customerName, 
                                expandedReservation.totalTickets,
                                newValue
                              )}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )})
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-gray-500 text-sm">예약 데이터가 없습니다.</p>
                  </div>
                )}
              </div>

              {/* 페이지네이션 - 개선된 버전 */}
              {totalPages > 1 && (
                <div className="bg-white px-3 sm:px-4 md:px-5 lg:px-4 xl:px-6 py-3 sm:py-4 md:px-5 lg:py-4 xl:py-5 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-700">
                      총 <span className="font-medium">{totalCount}</span>건 중{' '}
                      <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span>-
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span>건 표시
                    </div>
                    <div className="flex items-center space-x-1">
                      {/* 맨 처음 버튼 */}
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="처음 페이지"
                      >
                        &lt;&lt;
                      </button>
                      
                      {/* 이전 버튼 */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="이전 페이지"
                      >
                        &lt;
                      </button>
                      
                      {/* 페이지 번호들 */}
                      <div className="flex items-center space-x-1">
                        {getPageNumbers().map(pageNum => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 text-sm rounded ${
                              currentPage === pageNum
                                ? 'bg-blue-500 text-white'
                                : 'bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>
                      
                      {/* 다음 버튼 */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="다음 페이지"
                      >
                        &gt;
                      </button>
                      
                      {/* 맨 끝 버튼 */}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="마지막 페이지"
                      >
                        &gt;&gt;
                      </button>
                      
                      {/* 페이지 직접 이동 */}
                      <div className="ml-4 flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={pageInput}
                          onChange={(e) => setPageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handlePageJump()}
                          placeholder="페이지"
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handlePageJump}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          이동
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}