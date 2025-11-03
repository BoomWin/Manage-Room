"use client"

import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/ko'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useState } from 'react'

moment.locale('ko')
const localizer = momentLocalizer(moment)

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

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Reservation
}

interface CalendarProps {
  reservations: Reservation[]
  onSelectSlot: (start: Date, end: Date) => void
  onSelectEvent: (reservation: Reservation) => void
}

export default function Calendar({ reservations, onSelectSlot, onSelectEvent }: CalendarProps) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  const events: CalendarEvent[] = reservations.map((reservation) => ({
    id: reservation.id,
    title: `${reservation.room.name} - ${reservation.user.name} (${reservation.user.lab})`,
    start: new Date(reservation.startTime),
    end: new Date(reservation.endTime),
    resource: reservation
  }))

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    onSelectSlot(start, end)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    onSelectEvent(event.resource)
  }

  return (
    <div className="h-[600px] bg-white p-4 rounded-lg shadow">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        messages={{
          next: "다음",
          previous: "이전",
          today: "오늘",
          month: "월",
          week: "주",
          day: "일",
          agenda: "일정",
          date: "날짜",
          time: "시간",
          event: "예약",
          noEventsInRange: "이 기간에 예약이 없습니다.",
          showMore: (total) => `+${total} 더보기`
        }}
        style={{ height: '100%' }}
      />
    </div>
  )
}