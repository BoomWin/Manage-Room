"use client"

import Calendar from "@/components/Calendar"
import moment from 'moment'



  import { useSession, signOut } from "next-auth/react"
  import { useRouter } from "next/navigation"
  import { useEffect, useState } from "react"

  interface Reservation {
    id: string
    startTime: string
    endTime: string
    purpose: string
    user: {
      name: string
      lab: string
    }
    room: {
      name: string
    }
  }

  export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [loading, setLoading] = useState(true)
    const [rooms, setRooms] = useState<any[]>([])  // 이 줄 추가
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
      roomId: "",
      startTime: "",
      endTime: "",
      purpose: ""
    })
    const [error, setError] = useState("")

    useEffect(() => {
      if (status === "unauthenticated") {
        router.push("/login")
      }
    }, [status, router])

    useEffect(() => {
      if (status === "authenticated") {
        loadReservations()
        loadRooms()
      }
    }, [status])

    const loadReservations = async () => {
      try {
        // 캐시 방지를 위해 타임스탬프 추가
        const response = await fetch(`/api/reservations?t=${Date.now()}`, {
          cache: 'no-store'
        })
        if (response.ok) {
          const data = await response.json()
          setReservations(data)
        }
      } catch (error) {
        console.error("예약 로드 에러:", error)
      } finally {
        setLoading(false)
      }
    }

    const loadRooms = async () => {
        try {
            const response = await fetch("/api/rooms")
            if (response.ok) {
                const data = await response.json()
                setRooms(data)
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, roomId: data[0].id}))
                }
            }
        } catch(error) {
            console.error("회의실 로드 에러:", error)
        }
    }

    const handleCreateReservation = async (e: React.FormEvent) => {
      e.preventDefault()
      setError("")

      try {
        // datetime-local 값을 로컬 시간 기준 Date 객체로 변환
        const lcoalStartTime = new Date(formData.startTime)
        const localEndTime = new Date(formData.endTime)

        // ISO 문자열로 변환 
        const startTimeISO = lcoalStartTime.toISOString()
        const endTimeISO = localEndTime.toISOString()

        const response = await fetch("/api/reservations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
	  	roomId:formData.roomId,
	  	// ISO 변환 없이 그대로 전송
		startTime: formData.startTime,
	  	endTime: formData.endTime,
	  	purpose: formData.purpose
	  })
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "예약 생성에 실패했습니다")
          return
        }

        alert("예약이 완료되었습니다!")
        setShowModal(false)
        setFormData({
          roomId: "",
          startTime: "",
          endTime: "",
          purpose: ""
        })
        loadReservations()
      } catch (error) {
        setError("예약 생성 중 오류가 발생했습니다")
      }
    }

    const handleDeleteReservation = async (id: string) => {
      if (!confirm("예약을 삭제하시겠습니까?")) return

      try {
        const response = await fetch(`/api/reservations/${id}`, {
          method: "DELETE"
        })

        if (response.ok) {
          alert("예약이 삭제되었습니다")
          loadReservations()
        } else {
          const data = await response.json()
          alert(data.error || "예약 삭제에 실패했습니다")
        }
      } catch (error) {
        alert("예약 삭제 중 오류가 발생했습니다")
      }
    }

    const formatDateTime = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    }

    if (status === "loading" || loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">로딩 중...</div>
        </div>
      )
    }

    if (!session) {
      return null
    }

    // 내 예약만 필터링
    const myReservations = reservations.filter(
      (r) => r.user.name === session.user?.name
    )

    return (
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">회의실 예약 시스템</h1>
              <p className="text-sm text-gray-600 mt-1">
                {session.user?.name} ({session.user?.lab})
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
            >
              로그아웃
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* 예약 생성 버튼 */}
          <div className="mb-6">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
            >
              + 새 예약 만들기
            </button>
          </div>

        {/* 캘린더 뷰 */}
         <div className="mb-8">
            <Calendar
                reservations={reservations}
              onSelectSlot={(start, end) => {
                // Date 객체를 datetime-local 형식으로 변환
                const formatForDateTimeLocal = (date: Date) => {
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = String(date.getDate()).padStart(2, '0')
                const hours = String(date.getHours()).padStart(2, '0')
                const minutes = String(date.getMinutes()).padStart(2, '0')
                return `${year}-${month}-${day}T${hours}:${minutes}`
    }
                    setFormData({
                        ...formData,
                        startTime: moment(start).format('YYYY-MM-DDTHH:mm'),
                        endTime: moment(end).format('YYYY-MM-DDTHH:mm')
                    })
                    setShowModal(true)
                }}
                onSelectEvent={(reservation) => {
                    alert(
                        '예약 정보\n\n' +
                        `회의실: ${reservation.room.name}\n` +
                        `예약자: ${reservation.user.name} (${reservation.user.lab})\n` +
                        `시작: ${formatDateTime(reservation.startTime)}\n` +
                        `종료: ${formatDateTime(reservation.endTime)}\n` +
                        `목적: ${reservation.purpose || '없음'}`
                    )
                }}
            />
         </div>
          

          {/* 전체 예약 목록 */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">전체 예약 현황</h2>
            </div>
            <div className="p-6">
              {reservations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">예약이 없습니다</p>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {reservation.room.name}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              {reservation.user.lab}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            예약자: {reservation.user.name}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            시작: {formatDateTime(reservation.startTime)}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            종료: {formatDateTime(reservation.endTime)}
                          </p>
                          {reservation.purpose && (
                            <p className="text-sm text-gray-600">
                              목적: {reservation.purpose}
                            </p>
                          )}
                        </div>
                        {reservation.user.name === session.user?.name && (
                          <button
                            onClick={() => handleDeleteReservation(reservation.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 내 예약 목록 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">내 예약</h2>
            </div>
            <div className="p-6">
              {myReservations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">내 예약이 없습니다</p>
              ) : (
                <div className="space-y-4">
                  {myReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border border-gray-200 rounded-lg p-4 bg-blue-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-2">
                            {reservation.room.name}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            시작: {formatDateTime(reservation.startTime)}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            종료: {formatDateTime(reservation.endTime)}
                          </p>
                          {reservation.purpose && (
                            <p className="text-sm text-gray-600">
                              목적: {reservation.purpose}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteReservation(reservation.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* 예약 생성 모달 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">새 예약 만들기</h3>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateReservation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회의실
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  >
                    <option value="">선택해주세요</option>
                    {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                            {room.name}
                        </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작 시간
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료 시간
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    목적 (선택사항)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    rows={3}
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md
  hover:bg-blue-700"
                  >
                    예약하기
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setError("")
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md
  hover:bg-gray-300"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }
