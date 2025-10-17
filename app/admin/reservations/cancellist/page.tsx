'use client'

import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../../../components/admin/admin-layout'
import * as XLSX from 'xlsx'

export default function CancelList() {
  // 상태 관리
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showExcelOptions, setShowExcelOptions] = useState(false)
  const [expandedReservations, setExpandedReservations] = useState([])
  const [showByTicket, setShowByTicket] = useState(false) // 티켓별로 보기 상태

  // 필터 상태 - 기본적으로 취소 상태만 조회
  const [filters, setFilters] = useState({
    reservationStatusList: ['취소'],
    searchKeyword: '',
    sortBy: 'cancelledAt',
    sortOrder: 'desc',
	cancelType: 'all'   
  })

  // 임시 필터 상태
  const [tempFilters, setTempFilters] = useState({ ...filters })

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage] = useState(20)
  const [pageInput, setPageInput] = useState('')

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phone) => {
    if (!phone) return phone
    const numbers = phone.replace(/[^0-9]/g, '')
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
    }
    return phone
  }

  // 날짜시간 포맷팅
  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const [datePart, timePart] = dateString.split('T')
    if (!datePart || !timePart) return dateString
    const [year, month, day] = datePart.split('-')
    const [hour, minute] = timePart.split(':')
    return `${year}-${month}-${day} ${hour}:${minute}`
  }

  // 이용월 포맷팅
  const formatYearMonth = (dateString) => {
    if (!dateString) return '-'
    const datePart = dateString.split('T')[0]
    const [year, month] = datePart.split('-')
    return `${year}-${month}`
  }

  // 금액 포맷팅
  const formatMoney = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return '0원'
    return new Intl.NumberFormat('ko-KR').format(numAmount) + '원'
  }

  // 예약을 티켓별로 펼치는 함수
  const expandReservationsByTickets = (reservations) => {
    const expandedData = []
    
    reservations.forEach(reservation => {
      if (reservation.tickets && reservation.tickets.length > 0) {
        // 티켓 정보가 있는 경우
        reservation.tickets.forEach((ticket, index) => {
          expandedData.push({
            ...reservation,
            ticketInfo: ticket,
            ticketId: ticket.id,
            ticketIndex: index,
            totalTickets: reservation.tickets.length,
            isFirstTicket: index === 0,
            ticketStatus: ticket.ticket_status || ticket.status || '취소',
            cancelledAt: ticket.cancelled_at || reservation.cancelledAt
          })
        })
      } else if (reservation.cartItems && reservation.cartItems.length > 0) {
        // cartItems로 티켓 생성
        let ticketNumber = 1
        reservation.cartItems.forEach(item => {
          for (let i = 0; i < item.count; i++) {
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
              ticketId: `temp-${reservation.id}-${ticketNumber}`,
              ticketIndex: ticketNumber - 1,
              totalTickets: reservation.cartItems.reduce((sum, itm) => sum + itm.count, 0),
              isFirstTicket: ticketNumber === 1,
              ticketStatus: '취소',
              cancelledAt: reservation.cancelledAt
            })
            ticketNumber++
          }
        })
      } else {
        // 기존 방식 (adult_count, child_count 기반)
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
            ticketId: `temp-${reservation.id}-adult-${i}`,
            ticketIndex: ticketNumber - 1,
            totalTickets: totalTickets,
            isFirstTicket: ticketNumber === 1,
            ticketStatus: '취소',
            cancelledAt: reservation.cancelledAt
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
            ticketId: `temp-${reservation.id}-child-${i}`,
            ticketIndex: ticketNumber - 1,
            totalTickets: totalTickets,
            isFirstTicket: ticketNumber === 1,
            ticketStatus: '취소',
            cancelledAt: reservation.cancelledAt
          })
          ticketNumber++
        }
        
        // 보호자 티켓
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
            ticketId: `temp-${reservation.id}-guardian-${i}`,
            ticketIndex: ticketNumber - 1,
            totalTickets: totalTickets,
            isFirstTicket: ticketNumber === 1,
            ticketStatus: '취소',
            cancelledAt: reservation.cancelledAt
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

  // 예약 데이터가 변경될 때 확장
  useEffect(() => {
    const expanded = expandReservationsByTickets(reservations)
    setExpandedReservations(expanded)
  }, [reservations])

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
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        additionalStatusList: '취소',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })

      if (filters.searchKeyword && filters.searchKeyword.trim()) {
        params.append('searchKeyword', filters.searchKeyword.trim())
      }

      if (filters.cancelType && filters.cancelType !== 'all') {
        params.append('cancelType', filters.cancelType)
      }

      const response = await fetch(`/api/admin/reservations/cancellist?${params}`)
      const data = await response.json()

      if (data.success) {
        // 각 예약의 티켓 정보 가져오기
        const reservationsWithTickets = await Promise.all((data.data || []).map(async (reservation) => {
          try {
            const ticketsResponse = await fetch(`/api/tickets?reservationId=${reservation.id}`)
            const ticketsResult = await ticketsResponse.json()
            
            // 취소된 티켓만 필터링
            const cancelledTickets = ticketsResult.success 
              ? ticketsResult.data.filter(t => t.ticket_status === '취소')
              : []
            
            return {
              ...reservation,
              tickets: cancelledTickets,
              cancelledAt: reservation.cancelledAt || (cancelledTickets[0]?.cancelled_at)
            }
          } catch (error) {
            console.error('티켓 조회 오류:', error)
            return {
              ...reservation,
              tickets: [],
              cancelledAt: reservation.cancelledAt
            }
          }
        }))
        
        setReservations(reservationsWithTickets)
        setTotalCount(data.total || 0)
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

  // 필터 변경 핸들러
  const handleFilterChange = (filterName, value) => {
    setTempFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  // 검색 실행
  const handleSearch = () => {
    setFilters({ ...tempFilters })
    setCurrentPage(1)
  }

  // 필터 초기화
  const resetFilters = () => {
    const initialFilters = {
      reservationStatusList: ['취소'],
      searchKeyword: '',
      sortBy: 'cancelledAt',
      sortOrder: 'desc',
      cancelType: 'all'
    }
    setTempFilters(initialFilters)
    setFilters(initialFilters)
    setCurrentPage(1)
  }

  // 전체 데이터 엑셀 다운로드
  const handleExportAllToExcel = async () => {
    setShowExcelOptions(false)
    
    try {
      alert('전체 데이터를 준비 중입니다...')
      
      let allData = []
      let currentPageNum = 1
      let hasMore = true
      const pageSize = 100
      
      while (hasMore) {
        const params = new URLSearchParams({
          page: currentPageNum.toString(),
          limit: pageSize.toString(),
          additionalStatusList: '취소',
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        })
        
        if (filters.searchKeyword.trim()) {
          params.append('searchKeyword', filters.searchKeyword.trim())
        }
        
        const response = await fetch(`/api/admin/reservations/cancellist?${params}`)
        const data = await response.json()
        
        if (data.success && data.data && data.data.length > 0) {
          // 티켓 정보 가져오기
          const reservationsWithTickets = await Promise.all(data.data.map(async (reservation) => {
            try {
              const ticketsResponse = await fetch(`/api/tickets?reservationId=${reservation.id}`)
              const ticketsResult = await ticketsResponse.json()
              const cancelledTickets = ticketsResult.success 
                ? ticketsResult.data.filter(t => t.ticket_status === '취소')
                : []
              return {
                ...reservation,
                tickets: cancelledTickets
              }
            } catch (error) {
              return reservation
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
      
      // 티켓별로 펼쳐서 엑셀 데이터 생성
      const expandedData = expandReservationsByTickets(allData)
      const excelData = expandedData.map(item => ({
        '예약번호': item.id,
        '고객명': item.customerName ? item.customerName.trim() : '',
        '전화번호': formatPhoneNumber(item.phone),
        '이메일': item.email,
        '이용월': formatYearMonth(item.visitDate),
        '예약일시': formatDateTime(item.createdAt),
        '이용권': item.ticketInfo.ticket_type,
        '금액': item.ticketInfo.price || 0,
        '예약상태': '예약취소',
        '취소일': item.cancelledAt ? formatDateTime(item.cancelledAt) : '-'
      }))
      
      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '취소목록_전체')
      
      XLSX.writeFile(wb, `취소목록_전체_${new Date().toISOString().slice(0,10)}.xlsx`)
      alert(`전체 ${excelData.length}건의 데이터가 다운로드되었습니다.`)
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error)
      alert('엑셀 다운로드 중 오류가 발생했습니다.')
    }
  }

  // 현재 페이지만 엑셀 다운로드
  const handleExportCurrentPageToExcel = () => {
    setShowExcelOptions(false)
    
    const excelData = expandedReservations.map(item => ({
      '예약번호': item.id,
      '고객명': item.customerName ? item.customerName.trim() : '',
      '전화번호': formatPhoneNumber(item.phone),
      '이메일': item.email,
      '이용월': formatYearMonth(item.visitDate),
      '예약일시': formatDateTime(item.createdAt),
      '이용권': item.ticketInfo.ticket_type,
      '금액': item.ticketInfo.price || 0,
      '예약상태': '예약취소',
      '취소일': item.cancelledAt ? formatDateTime(item.cancelledAt) : '-'
    }))
    
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '취소목록')
    
    XLSX.writeFile(wb, `취소목록_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const maxPages = 15
    const pageNumbers = []
    
    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2))
      let endPage = Math.min(totalPages, startPage + maxPages - 1)
      
      if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPages + 1)
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }
    }
    
    return pageNumbers
  }

  // 페이지 직접 이동
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

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <AdminLayout>
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">취소 예약 관리</h1>
          <p className="text-gray-600">취소된 예약 목록 조회 및 관리</p>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
            {/* 고객 검색 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                고객 검색
              </label>
              <input
                type="text"
                placeholder="고객명 또는 전화번호"
                value={tempFilters.searchKeyword}
                onChange={(e) => handleFilterChange('searchKeyword', e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            
            {/* 정렬 기준 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                정렬 기준
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, sortBy: e.target.value }))
                  setTempFilters(prev => ({ ...prev, sortBy: e.target.value }))
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="cancelledAt">취소시간</option>
              </select>
            </div>

            {/* 정렬 순서 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                정렬 순서
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, sortOrder: e.target.value }))
                  setTempFilters(prev => ({ ...prev, sortOrder: e.target.value }))
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="desc">최신순</option>
                <option value="asc">오래된순</option>
              </select>
            </div>

            {/* 취소처리 구분 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                취소처리 구분
              </label>
              <select
                value={filters.cancelType}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, cancelType: e.target.value }))
                  setTempFilters(prev => ({ ...prev, cancelType: e.target.value }))
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">전체</option>
                <option value="user_simple">사용자 단순취소</option>
                <option value="user_refund">사용자 환불취소</option>
                <option value="admin">관리자 취소</option>
                <option value="pg_fail">PG사 취소실패</option>
              </select>
            </div>
            
            {/* 버튼 그룹 */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 lg:invisible">
                &nbsp;
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  검색
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  필터 초기화
                </button>
                <div className="relative excel-menu-container">
                  <button
                    onClick={() => setShowExcelOptions(!showExcelOptions)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    엑셀 다운로드
                  </button>
                  {showExcelOptions && (
                    <div className="absolute top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                      <button
                        onClick={handleExportAllToExcel}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        전체 다운로드
                      </button>
                      <button
                        onClick={handleExportCurrentPageToExcel}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        현재 페이지만 다운로드
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowByTicket(!showByTicket)}
                  className={`px-4 py-2 ${showByTicket ? 'bg-purple-600' : 'bg-gray-600'} text-white rounded-md hover:${showByTicket ? 'bg-purple-700' : 'bg-gray-700'} transition-colors text-sm`}
                >
                  {showByTicket ? '티켓별 보기 ON' : '티켓별 보기 OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* 필터 정보 표시 */}
          <div className="mt-4 text-sm text-gray-600">
            총 <span className="font-medium text-blue-600">{totalCount}</span>건의 취소 예약이 있습니다.
            {showByTicket && <span className="ml-2 text-purple-600">(티켓별 표시 중)</span>}
          </div>
        </div>

        {/* 예약 목록 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">취소 예약 목록을 불러오고 있습니다...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
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
                        이메일
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이용월
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        예약일시
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이용권
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        금액
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        예약상태
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        취소일
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        취소처리
                      </th>
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
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                                <div className="font-medium text-xs">{expandedReservation.id}</div>
                              </td>
                            )}
                            {(showByTicket || isFirstTicket) && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                                <div className="text-xs text-gray-500">
                                  {expandedReservation.userId ? '회원' : '비회원'}
                                </div>
                                <div className="font-medium text-sm">{expandedReservation.customerName}</div>
                                <div className="text-xs text-gray-500">{formatPhoneNumber(expandedReservation.phone)}</div>
                              </td>
                            )}
                            {(showByTicket || isFirstTicket) && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                                <div className="text-xs">{expandedReservation.email}</div>
                              </td>
                            )}
                            {(showByTicket || isFirstTicket) && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                                <div className="text-xs">{formatYearMonth(expandedReservation.visitDate)}</div>
                              </td>
                            )}
                            {(showByTicket || isFirstTicket) && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                                <div className="text-xs">{formatDateTime(expandedReservation.createdAt)}</div>
                              </td>
                            )}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">#{ticket.ticket_number || expandedReservation.ticketIndex + 1}</span>
                                <span className="text-xs">{ticket.ticket_type}</span>
                                {/* 감면/일반 구분 표시 */}
                                {(ticket.is_discount || ticket.ticket_type?.includes('(감면)')) ? (
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
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div className="font-medium text-xs">{formatMoney(ticket.price || 0)}</div>
                            </td>
                            {(showByTicket || isFirstTicket) && (
                              <td className="px-4 py-3 whitespace-nowrap" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                                <span className="text-xs text-gray-900">예약취소</span>
                              </td>
                            )}
                            {(showByTicket || isFirstTicket) && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                                <div className="text-xs">
                                  {expandedReservation.cancelledAt ? formatDateTime(expandedReservation.cancelledAt) : '-'}
                                </div>
                              </td>
                            )}
                            {(showByTicket || isFirstTicket) && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900" rowSpan={showByTicket ? 1 : expandedReservation.totalTickets}>
                                {expandedReservation.ticketInfo.cancelled_by === 'pg_fail' ? (
                                  <span className="text-xs text-gray-700 font-medium">
                                    사용자 예약 취소 신청하였으나,<br/>
                                    PG사 취소실패
                                  </span>
                                ) : expandedReservation.ticketInfo.cancelled_by === 'admin' ? (
                                  <span className="text-xs text-gray-700">
                                    관리자 취소
                                  </span>
                                ) : expandedReservation.ticketInfo.cancelled_by === 'user_refund' ? (
                                  <span className="text-xs text-gray-700">
                                    사용자 환불취소
                                  </span>
                                ) : expandedReservation.ticketInfo.cancelled_by === 'user_simple' ? (
                                  <span className="text-xs text-gray-700">
                                    사용자 단순취소
                                  </span>
                                ) : expandedReservation.ticketInfo.cancelled_by === 'user' ? (
                                  <span className="text-xs text-gray-700">
                                    사용자 취소
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                            )}
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                          취소된 예약이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      총 <span className="font-medium">{totalCount}</span>건 중{' '}
                      <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span>-
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span>건 표시
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        처음
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      
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
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        마지막
                      </button>
                      
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