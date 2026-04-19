import { useEffect, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import homeBackground from './assets/Home.png'
import './App.css'

const STORAGE_KEY = 'travelog-mobile-mvp'
const stageTabs = ['pre', 'during', 'post']
const preTabs = ['overview', 'bookings', 'planning', 'draft']
const duringTabs = ['today', 'timeline', 'access']
const postTabs = ['archive', 'footprint', 'record']
const profileTabs = ['account', 'plan', 'settings']
const fallbackDestinationOptions = [
  'China',
  'Beijing, China',
  'Shanghai, China',
  'Chengdu, China',
  'Guangzhou, China',
  'Japan',
  'Tokyo, Japan',
  'Osaka, Japan',
  'Kyoto, Japan',
  'South Korea',
  'Seoul, South Korea',
  'Busan, South Korea',
  'France',
  'Paris, France',
  'Nice, France',
  'Lyon, France',
  'Italy',
  'Rome, Italy',
  'Milan, Italy',
  'Florence, Italy',
  'Spain',
  'Barcelona, Spain',
  'Madrid, Spain',
  'United Kingdom',
  'London, United Kingdom',
  'Edinburgh, United Kingdom',
  'Thailand',
  'Bangkok, Thailand',
  'Chiang Mai, Thailand',
  'Vietnam',
  'Hanoi, Vietnam',
  'Ho Chi Minh City, Vietnam',
  'Singapore',
  'Indonesia',
  'Bali, Indonesia',
  'Jakarta, Indonesia',
  'Malaysia',
  'Kuala Lumpur, Malaysia',
  'Taiwan',
  'Taipei, Taiwan',
  'Hong Kong',
  'Australia',
  'Sydney, Australia',
  'Melbourne, Australia',
  'Canada',
  'Toronto, Canada',
  'Vancouver, Canada',
  'New York, United States',
  'San Francisco, United States',
  'Los Angeles, United States',
]

function getDestinationSuggestions(query) {
  const trimmedQuery = query.trim().toLowerCase()

  if (!trimmedQuery) return []

  const scoredOptions = fallbackDestinationOptions
    .map((option) => {
      const normalized = option.toLowerCase()
      const parts = option.split(',').map((part) => part.trim().toLowerCase())
      const firstPart = parts[0] ?? normalized
      const score =
        normalized === trimmedQuery
          ? 0
          : firstPart === trimmedQuery
            ? 1
            : firstPart.startsWith(trimmedQuery)
              ? 2
              : normalized.startsWith(trimmedQuery)
                ? 3
                : parts.some((part) => part.startsWith(trimmedQuery))
                  ? 4
                  : normalized.includes(trimmedQuery)
                    ? 5
                    : 99

      return { option, score }
    })
    .filter((item) => item.score < 99)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      return a.option.localeCompare(b.option)
    })

  return scoredOptions.slice(0, 8).map((item) => item.option)
}

function formatSearchResultLabel(result) {
  const address = result.address ?? {}
  const country = address.country || ''
  const locality =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    address.state ||
    result.name ||
    result.display_name?.split(',')[0] ||
    ''

  if (result.addresstype === 'country' || locality === country) {
    return country || locality
  }

  return country ? `${locality}, ${country}` : locality
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createSampleTrip() {
  const tripId = createId()

  return {
    id: tripId,
    title: 'Paris Spring Week',
    destination: 'Paris',
    startDate: '2026-04-10',
    endDate: '2026-04-16',
    archived: false,
    bookings: [
      {
        id: createId(),
        tripId,
        type: 'flight',
        title: 'Air France AF011',
        provider: 'Air France',
        confirmationNumber: 'AF-AB12CD',
        startDateTime: '2026-04-10T19:30',
        endDateTime: '2026-04-11T08:20',
        address: 'JFK Terminal 1 -> Paris Charles de Gaulle Airport',
        latitude: 49.0097,
        longitude: 2.5479,
        details: {
          departureAirport: 'JFK',
          arrivalAirport: 'CDG',
          terminal: '1',
          passengerName: 'Jane Doe',
        },
        attachments: [],
      },
      {
        id: createId(),
        tripId,
        type: 'hotel',
        title: 'Hotel Louvre Rivoli',
        provider: 'Booking.com',
        confirmationNumber: 'HT-9087',
        startDateTime: '2026-04-11T15:00',
        endDateTime: '2026-04-16T11:00',
        address: '7 Rue Jean Lantier, 75001 Paris',
        latitude: 48.8597,
        longitude: 2.345,
        details: {
          checkIn: '2026-04-11',
          checkOut: '2026-04-16',
          roomType: 'Classic Double Room',
          guestName: 'Jane Doe',
        },
        attachments: [],
      },
      {
        id: createId(),
        tripId,
        type: 'ticket',
        title: 'Louvre Museum Timed Entry',
        provider: 'Official Ticketing',
        confirmationNumber: 'LV-2049',
        startDateTime: '2026-04-12T10:00',
        endDateTime: '2026-04-12T13:00',
        address: 'Rue de Rivoli, 75001 Paris',
        latitude: 48.8606,
        longitude: 2.3376,
        details: {
          entryTime: '10:00',
          guestName: 'Jane Doe',
          ticketType: 'General admission',
        },
        attachments: [],
      },
    ],
    planningItems: [
      {
        id: createId(),
        tripId,
        title: 'Musee d Orsay',
        category: 'Museum',
        locationName: 'Musee d Orsay',
        latitude: 48.8600,
        longitude: 2.3266,
        estimatedDuration: '2h',
        note: 'Good afternoon pairing after Louvre.',
        priority: 'high',
        assignedDate: '2026-04-12',
      },
      {
        id: createId(),
        tripId,
        title: 'Montmartre walk',
        category: 'Neighborhood',
        locationName: 'Montmartre',
        latitude: 48.8867,
        longitude: 2.3431,
        estimatedDuration: '3h',
        note: 'Coffee stop and sunset photos.',
        priority: 'medium',
        assignedDate: '',
      },
    ],
    itineraryItems: [
      {
        id: createId(),
        tripId,
        date: '2026-04-12',
        time: '10:00',
        title: 'Louvre Museum',
        locationName: 'Louvre Museum',
        latitude: 48.8606,
        longitude: 2.3376,
        note: 'Use timed entry ticket and start from Denon wing.',
        status: 'scheduled',
        sourceBookingId: null,
        attachments: [],
      },
      {
        id: createId(),
        tripId,
        date: '2026-04-12',
        time: '16:00',
        title: 'Musee d Orsay',
        locationName: 'Musee d Orsay',
        latitude: 48.8600,
        longitude: 2.3266,
        note: 'Flexible if Louvre runs late.',
        status: 'unfinished',
        sourceBookingId: null,
        attachments: [],
      },
    ],
  }
}

function normalizeAttachment(attachment) {
  return {
    id: attachment?.id ?? createId(),
    name: attachment?.name ?? 'Attachment.pdf',
    size: attachment?.size ?? 0,
    type: attachment?.type ?? 'application/pdf',
    dataUrl: attachment?.dataUrl ?? '',
  }
}

function normalizeTrips(input) {
  const source = Array.isArray(input) && input.length > 0 ? input : [createSampleTrip()]

  return source.map((trip) => ({
    ...trip,
    destination: trip.destination ?? '',
    archived: Boolean(trip.archived),
    bookings: (trip.bookings ?? []).map((booking) => ({
      id: booking.id ?? createId(),
      tripId: booking.tripId ?? trip.id,
      type: booking.type ?? 'ticket',
      title: booking.title ?? '',
      provider: booking.provider ?? '',
      confirmationNumber: booking.confirmationNumber ?? '',
      startDateTime: booking.startDateTime ?? '',
      endDateTime: booking.endDateTime ?? '',
      address: booking.address ?? '',
      latitude: booking.latitude ?? null,
      longitude: booking.longitude ?? null,
      details: booking.details ?? {},
      attachments: (booking.attachments ?? []).map(normalizeAttachment),
    })),
    planningItems: (trip.planningItems ?? []).map((item) => ({
      id: item.id ?? createId(),
      tripId: item.tripId ?? trip.id,
      title: item.title ?? '',
      category: item.category ?? 'Activity',
      locationName: item.locationName ?? '',
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      estimatedDuration: item.estimatedDuration ?? '',
      note: item.note ?? '',
      priority: item.priority ?? 'medium',
      assignedDate: item.assignedDate ?? '',
    })),
    itineraryItems: (trip.itineraryItems ?? []).map((item) => ({
      id: item.id ?? createId(),
      tripId: item.tripId ?? trip.id,
      date: item.date ?? '',
      time: item.time ?? '09:00',
      title: item.title ?? '',
      locationName: item.locationName ?? '',
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      note: item.note ?? '',
      status: item.status ?? 'scheduled',
      sourceBookingId: item.sourceBookingId ?? null,
      attachments: (item.attachments ?? []).map(normalizeAttachment),
    })),
  }))
}

function formatDateLabel(dateString) {
  if (!dateString) return ''

  return new Date(`${dateString}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return ''

  return new Date(dateTimeString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getTripDates(startDate, endDate) {
  if (!startDate || !endDate) return []

  const dates = []
  const cursor = new Date(`${startDate}T12:00:00`)
  const last = new Date(`${endDate}T12:00:00`)

  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

function sortItinerary(items) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.time.localeCompare(b.time)
  })
}

function hasValidCoordinates(item) {
  return (
    Number.isFinite(item.latitude) &&
    Number.isFinite(item.longitude) &&
    item.latitude >= -90 &&
    item.latitude <= 90 &&
    item.longitude >= -180 &&
    item.longitude <= 180
  )
}

function getBookingTone(type) {
  if (type === 'flight') return 'flight'
  if (type === 'hotel') return 'hotel'
  if (type === 'transport') return 'transport'
  return 'ticket'
}

function getStatusTone(status) {
  if (status === 'done') return 'done'
  if (status === 'unfinished') return 'unfinished'
  if (status === 'in-progress') return 'progress'
  return 'scheduled'
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function FitMapToItems({ items }) {
  const map = useMap()

  useEffect(() => {
    if (items.length === 0) return

    if (items.length === 1) {
      map.setView([items[0].latitude, items[0].longitude], 12, { animate: true })
      return
    }

    map.fitBounds(
      items.map((item) => [item.latitude, item.longitude]),
      { padding: [28, 28], animate: true },
    )
  }, [items, map])

  return null
}

function FocusSelectedItem({ item }) {
  const map = useMap()

  useEffect(() => {
    if (!item || !hasValidCoordinates(item)) return

    map.flyTo([item.latitude, item.longitude], Math.max(map.getZoom(), 13), {
      animate: true,
      duration: 0.7,
    })
  }, [item, map])

  return null
}

function ItemMap({ items, selectedItemId, onSelectItem, heightClass = '' }) {
  const mappableItems = items.filter(hasValidCoordinates)
  const selectedItem = mappableItems.find((item) => item.id === selectedItemId) ?? null

  if (mappableItems.length === 0) {
    return (
      <div className={`map-empty ${heightClass}`.trim()}>
        <h4>No mapped places yet</h4>
        <p>Add locations with coordinates to see the route here.</p>
      </div>
    )
  }

  return (
    <MapContainer
      center={[mappableItems[0].latitude, mappableItems[0].longitude]}
      zoom={12}
      className={`leaflet-map ${heightClass}`.trim()}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitMapToItems items={mappableItems} />
      <FocusSelectedItem item={selectedItem} />
      {mappableItems.length > 1 && (
        <Polyline
          positions={mappableItems.map((item) => [item.latitude, item.longitude])}
          pathOptions={{ color: '#ff7a18', weight: 4 }}
        />
      )}
      {mappableItems.map((item, index) => (
        <CircleMarker
          key={item.id}
          center={[item.latitude, item.longitude]}
          radius={selectedItemId === item.id ? 10 : 7}
          pathOptions={{
            color: selectedItemId === item.id ? '#c2410c' : '#0f172a',
            fillColor: selectedItemId === item.id ? '#fb923c' : '#38bdf8',
            fillOpacity: 0.95,
            weight: 2,
          }}
          eventHandlers={onSelectItem ? { click: () => onSelectItem(item.id) } : undefined}
        >
          <Popup>
            <strong>
              {index + 1}. {item.title}
            </strong>
            <br />
            {'locationName' in item ? item.locationName : item.address}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

function App() {
  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return normalizeTrips([])

    try {
      return normalizeTrips(JSON.parse(saved))
    } catch {
      return normalizeTrips([])
    }
  })
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [mainView, setMainView] = useState('home')
  const [stage, setStage] = useState('pre')
  const [tabState, setTabState] = useState({
    pre: 'overview',
    during: 'today',
    post: 'archive',
    profile: 'account',
  })
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimelineItemId, setSelectedTimelineItemId] = useState(null)
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [tripForm, setTripForm] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
  })
  const [bookingForm, setBookingForm] = useState({
    type: 'flight',
    title: '',
    provider: '',
    confirmationNumber: '',
    startDateTime: '',
    endDateTime: '',
    address: '',
    latitude: '',
    longitude: '',
    detailOne: '',
    detailTwo: '',
  })
  const [planningForm, setPlanningForm] = useState({
    title: '',
    category: 'Activity',
    locationName: '',
    latitude: '',
    longitude: '',
    estimatedDuration: '',
    note: '',
    priority: 'medium',
    assignedDate: '',
  })
  const [itineraryForm, setItineraryForm] = useState({
    date: '',
    time: '09:00',
    title: '',
    locationName: '',
    latitude: '',
    longitude: '',
    note: '',
    status: 'scheduled',
  })
  const [uploadingBookingId, setUploadingBookingId] = useState(null)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  const [destinationSuggestions, setDestinationSuggestions] = useState([])
  const [isDestinationLoading, setIsDestinationLoading] = useState(false)
  const [user, setUser] = useState({
    isLoggedIn: true,
    name: 'Avery Chen',
    email: 'avery@travelog.app',
    avatar: 'AC',
    plan: 'Free Entry',
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
  }, [trips])

  useEffect(() => {
    if (!selectedTripId && trips.length > 0) {
      setSelectedTripId(trips[0].id)
    }
  }, [selectedTripId, trips])

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) ?? null
  const tripDates = selectedTrip ? getTripDates(selectedTrip.startDate, selectedTrip.endDate) : []

  useEffect(() => {
    if (!selectedTrip) return

    if (!tripDates.includes(selectedDate)) {
      setSelectedDate(tripDates[0] ?? '')
    }
  }, [selectedTrip, selectedDate, tripDates])

  useEffect(() => {
    if (!selectedTrip) {
      setSelectedTimelineItemId(null)
      setSelectedBookingId(null)
      return
    }

    if (
      selectedTrip.itineraryItems.length > 0 &&
      !selectedTrip.itineraryItems.some((item) => item.id === selectedTimelineItemId)
    ) {
      setSelectedTimelineItemId(selectedTrip.itineraryItems[0].id)
    }

    if (
      selectedTrip.bookings.length > 0 &&
      !selectedTrip.bookings.some((booking) => booking.id === selectedBookingId)
    ) {
      setSelectedBookingId(selectedTrip.bookings[0].id)
    }
  }, [selectedBookingId, selectedTimelineItemId, selectedTrip])

  useEffect(() => {
    if (selectedDate && !planningForm.assignedDate) {
      setPlanningForm((current) => ({ ...current, assignedDate: selectedDate }))
    }

    if (selectedDate && !itineraryForm.date) {
      setItineraryForm((current) => ({ ...current, date: selectedDate }))
    }
  }, [itineraryForm.date, planningForm.assignedDate, selectedDate])

  const todayItems = selectedTrip
    ? sortItinerary(selectedTrip.itineraryItems.filter((item) => item.date === selectedDate))
    : []
  const selectedTimelineItem =
    selectedTrip?.itineraryItems.find((item) => item.id === selectedTimelineItemId) ?? null
  const selectedBooking =
    selectedTrip?.bookings.find((booking) => booking.id === selectedBookingId) ?? null
  const unfinishedItems = selectedTrip
    ? sortItinerary(selectedTrip.itineraryItems.filter((item) => item.status === 'unfinished'))
    : []
  const mappedPostItems = selectedTrip ? sortItinerary(selectedTrip.itineraryItems) : []
  const unassignedPlanning = selectedTrip
    ? selectedTrip.planningItems.filter((item) => !item.assignedDate)
    : []

  const upcomingTrips = [...trips]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3)
  const todayIso = new Date().toISOString().slice(0, 10)
  const upcomingTripGroups = trips.filter((trip) => trip.startDate > todayIso)
  const ongoingTripGroups = trips.filter(
    (trip) => trip.startDate <= todayIso && trip.endDate >= todayIso,
  )
  const pastTripGroups = trips.filter((trip) => trip.endDate < todayIso || trip.archived)
  const filteredDestinationOptions =
    destinationSuggestions.length > 0
      ? destinationSuggestions
      : getDestinationSuggestions(tripForm.destination)

  useEffect(() => {
    const query = tripForm.destination.trim()

    if (mainView !== 'create' || query.length === 0) {
      setDestinationSuggestions([])
      setIsDestinationLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setIsDestinationLoading(true)

      try {
        const params = new URLSearchParams({
          q: query,
          format: 'jsonv2',
          addressdetails: '1',
          limit: '8',
          dedupe: '1',
        })

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            signal: controller.signal,
            headers: {
              'Accept-Language': 'en',
            },
          },
        )

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`)
        }

        const results = await response.json()
        const labels = Array.from(
          new Set(results.map((result) => formatSearchResultLabel(result)).filter(Boolean)),
        )

        setDestinationSuggestions(labels)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setDestinationSuggestions([])
        }
      } finally {
        setIsDestinationLoading(false)
      }
    }, 280)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [mainView, tripForm.destination])

  function updateTrip(tripId, updater) {
    setTrips((current) =>
      current.map((trip) => (trip.id === tripId ? updater(trip) : trip)),
    )
  }

  function openTripWorkspace(tripId, nextStage = 'pre') {
    setSelectedTripId(tripId)
    setMainView('trip')
    setStage(nextStage)
  }

  function handleBack() {
    if (mainView === 'trip') {
      setMainView('trips')
      return
    }

    if (
      mainView === 'my' ||
      mainView === 'trips' ||
      mainView === 'create' ||
      mainView === 'record'
    ) {
      setMainView('home')
    }
  }

  function handleCreateTrip(event) {
    event.preventDefault()
    if (!tripForm.title || !tripForm.destination || !tripForm.startDate || !tripForm.endDate) {
      return
    }

    const newTrip = {
      id: createId(),
      title: tripForm.title,
      destination: tripForm.destination,
      startDate: tripForm.startDate,
      endDate: tripForm.endDate,
      archived: false,
      bookings: [],
      planningItems: [],
      itineraryItems: [],
    }

    setTrips((current) => [newTrip, ...current])
    setSelectedTripId(newTrip.id)
    setSelectedDate(newTrip.startDate)
    setTripForm({ title: '', destination: '', startDate: '', endDate: '' })
    setShowDestinationSuggestions(false)
    setMainView('trip')
    setStage('pre')
    setTabState({ pre: 'overview', during: 'today', post: 'archive' })
  }

  function handleAddBooking(event) {
    event.preventDefault()
    if (!selectedTrip) return
    if (!bookingForm.title || !bookingForm.startDateTime) return

    const details =
      bookingForm.type === 'flight'
        ? {
            departureAirport: bookingForm.detailOne,
            arrivalAirport: bookingForm.detailTwo,
            terminal: '',
          }
        : bookingForm.type === 'hotel'
          ? {
              checkIn: bookingForm.startDateTime.slice(0, 10),
              checkOut: bookingForm.endDateTime.slice(0, 10),
              roomType: bookingForm.detailOne,
              guestName: bookingForm.detailTwo,
            }
          : {
              ticketType: bookingForm.detailOne,
              guestName: bookingForm.detailTwo,
            }

    const booking = {
      id: createId(),
      tripId: selectedTrip.id,
      type: bookingForm.type,
      title: bookingForm.title,
      provider: bookingForm.provider,
      confirmationNumber: bookingForm.confirmationNumber,
      startDateTime: bookingForm.startDateTime,
      endDateTime: bookingForm.endDateTime,
      address: bookingForm.address,
      latitude: bookingForm.latitude === '' ? null : Number(bookingForm.latitude),
      longitude: bookingForm.longitude === '' ? null : Number(bookingForm.longitude),
      details,
      attachments: [],
    }

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      bookings: [booking, ...trip.bookings],
    }))
    setSelectedBookingId(booking.id)
    setBookingForm({
      type: 'flight',
      title: '',
      provider: '',
      confirmationNumber: '',
      startDateTime: '',
      endDateTime: '',
      address: '',
      latitude: '',
      longitude: '',
      detailOne: '',
      detailTwo: '',
    })
    setTabState((current) => ({ ...current, pre: 'bookings' }))
  }

  function handleAddPlanningItem(event) {
    event.preventDefault()
    if (!selectedTrip || !planningForm.title) return

    const planningItem = {
      id: createId(),
      tripId: selectedTrip.id,
      title: planningForm.title,
      category: planningForm.category,
      locationName: planningForm.locationName,
      latitude: planningForm.latitude === '' ? null : Number(planningForm.latitude),
      longitude: planningForm.longitude === '' ? null : Number(planningForm.longitude),
      estimatedDuration: planningForm.estimatedDuration,
      note: planningForm.note,
      priority: planningForm.priority,
      assignedDate: planningForm.assignedDate,
    }

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      planningItems: [planningItem, ...trip.planningItems],
    }))
    setPlanningForm({
      title: '',
      category: 'Activity',
      locationName: '',
      latitude: '',
      longitude: '',
      estimatedDuration: '',
      note: '',
      priority: 'medium',
      assignedDate: '',
    })
    setTabState((current) => ({ ...current, pre: 'planning' }))
  }

  function handleAddItineraryItem(event) {
    event.preventDefault()
    if (!selectedTrip || !itineraryForm.title || !itineraryForm.date) return

    const item = {
      id: createId(),
      tripId: selectedTrip.id,
      date: itineraryForm.date,
      time: itineraryForm.time,
      title: itineraryForm.title,
      locationName: itineraryForm.locationName,
      latitude: itineraryForm.latitude === '' ? null : Number(itineraryForm.latitude),
      longitude: itineraryForm.longitude === '' ? null : Number(itineraryForm.longitude),
      note: itineraryForm.note,
      status: itineraryForm.status,
      sourceBookingId: null,
      attachments: [],
    }

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      itineraryItems: [...trip.itineraryItems, item],
    }))
    setSelectedTimelineItemId(item.id)
    setItineraryForm((current) => ({
      ...current,
      title: '',
      locationName: '',
      latitude: '',
      longitude: '',
      note: '',
      status: 'scheduled',
    }))
  }

  function assignPlanningToDraft(planningItemId, assignedDate) {
    if (!selectedTrip) return

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      planningItems: trip.planningItems.map((item) =>
        item.id === planningItemId ? { ...item, assignedDate } : item,
      ),
    }))
  }

  function sendPlanningToTimeline(item) {
    if (!selectedTrip || !item.assignedDate) return

    const itineraryItem = {
      id: createId(),
      tripId: selectedTrip.id,
      date: item.assignedDate,
      time: '10:00',
      title: item.title,
      locationName: item.locationName,
      latitude: item.latitude,
      longitude: item.longitude,
      note: item.note,
      status: 'scheduled',
      sourceBookingId: null,
      attachments: [],
    }

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      itineraryItems: [...trip.itineraryItems, itineraryItem],
    }))
    setMainView('trip')
    setStage('during')
    setTabState((current) => ({ ...current, during: 'timeline' }))
    setSelectedDate(item.assignedDate)
    setSelectedTimelineItemId(itineraryItem.id)
  }

  function updateTimelineItem(itemId, changes) {
    if (!selectedTrip) return

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      itineraryItems: trip.itineraryItems.map((item) =>
        item.id === itemId ? { ...item, ...changes } : item,
      ),
    }))
  }

  function moveTimelineItem(itemId, direction) {
    if (!selectedTrip) return

    const sameDayItems = todayItems
    const index = sameDayItems.findIndex((item) => item.id === itemId)
    const targetIndex = index + direction

    if (index < 0 || targetIndex < 0 || targetIndex >= sameDayItems.length) return

    const currentItem = sameDayItems[index]
    const targetItem = sameDayItems[targetIndex]

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      itineraryItems: trip.itineraryItems.map((item) => {
        if (item.id === currentItem.id) return { ...item, time: targetItem.time }
        if (item.id === targetItem.id) return { ...item, time: currentItem.time }
        return item
      }),
    }))
  }

  async function uploadBookingPdfs(bookingId, files) {
    if (!selectedTrip || !files?.length) return

    const pdfFiles = Array.from(files).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
    )

    if (pdfFiles.length === 0) return

    setUploadingBookingId(bookingId)

    try {
      const attachments = await Promise.all(
        pdfFiles.map(async (file) => ({
          id: createId(),
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          dataUrl: await readFileAsDataUrl(file),
        })),
      )

      updateTrip(selectedTrip.id, (trip) => ({
        ...trip,
        bookings: trip.bookings.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                attachments: [...booking.attachments, ...attachments],
              }
            : booking,
        ),
      }))
    } finally {
      setUploadingBookingId(null)
    }
  }

  function removeBookingAttachment(bookingId, attachmentId) {
    if (!selectedTrip) return

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      bookings: trip.bookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              attachments: booking.attachments.filter(
                (attachment) => attachment.id !== attachmentId,
              ),
            }
          : booking,
      ),
    }))
  }

  function toggleArchive(archived) {
    if (!selectedTrip) return

    updateTrip(selectedTrip.id, (trip) => ({ ...trip, archived }))
    setStage('post')
    setTabState((current) => ({ ...current, post: 'archive' }))
  }

  function toggleLogin() {
    setUser((current) => ({
      ...current,
      isLoggedIn: !current.isLoggedIn,
    }))
  }

  function activatePlan(planName) {
    setUser((current) => ({
      ...current,
      plan: planName,
      isLoggedIn: true,
    }))
  }

  function renderPreTrip() {
    if (!selectedTrip) return null

    if (tabState.pre === 'overview') {
      return (
        <section className="screen-section">
          <div className="card hero-card">
            <p className="eyebrow">Pre-Trip</p>
            <h2>{selectedTrip.title}</h2>
            <p className="muted">
              {selectedTrip.destination} · {formatDateLabel(selectedTrip.startDate)} to{' '}
              {formatDateLabel(selectedTrip.endDate)}
            </p>
            <div className="stats-grid">
              <article>
                <strong>{selectedTrip.bookings.length}</strong>
                <span>Bookings</span>
              </article>
              <article>
                <strong>{selectedTrip.planningItems.length}</strong>
                <span>Plans</span>
              </article>
              <article>
                <strong>{selectedTrip.itineraryItems.length}</strong>
                <span>Timeline items</span>
              </article>
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <h3>Key confirmations</h3>
            </div>
            {selectedTrip.bookings.slice(0, 3).map((booking) => (
              <div className="list-card" key={booking.id}>
                <span className={`type-pill ${getBookingTone(booking.type)}`}>{booking.type}</span>
                <h4>{booking.title}</h4>
                <p>{formatDateTime(booking.startDateTime)}</p>
                <p className="muted">{booking.confirmationNumber || 'No reference yet'}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="section-head">
              <h3>Planning progress</h3>
            </div>
            <div className="progress-list">
              <p>{unassignedPlanning.length} ideas still unassigned</p>
              <p>
                {
                  selectedTrip.planningItems.filter((item) => item.assignedDate).length
                } assigned to draft days
              </p>
              <p>{unfinishedItems.length} unfinished items currently carried into trip use</p>
            </div>
          </div>
        </section>
      )
    }

    if (tabState.pre === 'bookings') {
      return (
        <section className="screen-section">
          <form className="card form-card" onSubmit={handleAddBooking}>
            <div className="section-head">
              <h3>Add booking</h3>
              <span className="mini-note">Flight, hotel, ticket, or transport</span>
            </div>
            <div className="two-up">
              <label>
                Type
                <select
                  value={bookingForm.type}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, type: event.target.value }))
                  }
                >
                  <option value="flight">Flight</option>
                  <option value="hotel">Hotel</option>
                  <option value="ticket">Ticket</option>
                  <option value="transport">Transport</option>
                </select>
              </label>
              <label>
                Provider
                <input
                  value={bookingForm.provider}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, provider: event.target.value }))
                  }
                  placeholder="Air France"
                />
              </label>
            </div>
            <label>
              Title
              <input
                value={bookingForm.title}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Air France AF011"
              />
            </label>
            <label>
              Confirmation number
              <input
                value={bookingForm.confirmationNumber}
                onChange={(event) =>
                  setBookingForm((current) => ({
                    ...current,
                    confirmationNumber: event.target.value,
                  }))
                }
                placeholder="AB12CD"
              />
            </label>
            <div className="two-up">
              <label>
                Start
                <input
                  type="datetime-local"
                  value={bookingForm.startDateTime}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      startDateTime: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                End
                <input
                  type="datetime-local"
                  value={bookingForm.endDateTime}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      endDateTime: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <label>
              Address or route
              <input
                value={bookingForm.address}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, address: event.target.value }))
                }
                placeholder="JFK Terminal 1 -> CDG"
              />
            </label>
            <div className="two-up">
              <label>
                Detail one
                <input
                  value={bookingForm.detailOne}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, detailOne: event.target.value }))
                  }
                  placeholder="JFK / room type / ticket type"
                />
              </label>
              <label>
                Detail two
                <input
                  value={bookingForm.detailTwo}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, detailTwo: event.target.value }))
                  }
                  placeholder="CDG / guest name"
                />
              </label>
            </div>
            <div className="two-up">
              <label>
                Latitude
                <input
                  type="number"
                  step="0.0001"
                  value={bookingForm.latitude}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, latitude: event.target.value }))
                  }
                />
              </label>
              <label>
                Longitude
                <input
                  type="number"
                  step="0.0001"
                  value={bookingForm.longitude}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, longitude: event.target.value }))
                  }
                />
              </label>
            </div>
            <button className="primary-button" type="submit">
              Save booking
            </button>
          </form>

          {selectedTrip.bookings.map((booking) => (
            <div className="card booking-card" key={booking.id}>
              <div className="section-head">
                <div>
                  <span className={`type-pill ${getBookingTone(booking.type)}`}>{booking.type}</span>
                  <h3>{booking.title}</h3>
                </div>
                <button
                  className="ghost-button"
                  onClick={() => setSelectedBookingId(booking.id)}
                >
                  Focus
                </button>
              </div>
              <p>{formatDateTime(booking.startDateTime)}</p>
              <p className="muted">{booking.address}</p>
              <div className="detail-list">
                <p>Provider: {booking.provider || 'Not set'}</p>
                <p>Ref: {booking.confirmationNumber || 'Not set'}</p>
              </div>
              <div className="attachment-area">
                <div className="section-head inline">
                  <span className="mini-note">Confirmation PDFs</span>
                  <label className="upload-button">
                    {uploadingBookingId === booking.id ? 'Uploading...' : 'Upload PDF'}
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple
                      onChange={(event) => {
                        uploadBookingPdfs(booking.id, event.target.files)
                        event.target.value = ''
                      }}
                    />
                  </label>
                </div>
                {(booking.attachments ?? []).length > 0 ? (
                  <div className="attachment-list">
                    {booking.attachments.map((attachment) => (
                      <div className="attachment-row" key={attachment.id}>
                        <a href={attachment.dataUrl} target="_blank" rel="noreferrer">
                          {attachment.name}
                        </a>
                        <button
                          className="inline-delete"
                          onClick={() => removeBookingAttachment(booking.id, attachment.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No PDFs yet.</p>
                )}
              </div>
            </div>
          ))}
        </section>
      )
    }

    if (tabState.pre === 'planning') {
      return (
        <section className="screen-section">
          <form className="card form-card" onSubmit={handleAddPlanningItem}>
            <div className="section-head">
              <h3>Add planning item</h3>
              <span className="mini-note">Ideas before assigning exact times</span>
            </div>
            <label>
              Title
              <input
                value={planningForm.title}
                onChange={(event) =>
                  setPlanningForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Louvre Museum"
              />
            </label>
            <div className="two-up">
              <label>
                Category
                <input
                  value={planningForm.category}
                  onChange={(event) =>
                    setPlanningForm((current) => ({ ...current, category: event.target.value }))
                  }
                />
              </label>
              <label>
                Priority
                <select
                  value={planningForm.priority}
                  onChange={(event) =>
                    setPlanningForm((current) => ({ ...current, priority: event.target.value }))
                  }
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
            </div>
            <label>
              Location
              <input
                value={planningForm.locationName}
                onChange={(event) =>
                  setPlanningForm((current) => ({
                    ...current,
                    locationName: event.target.value,
                  }))
                }
              />
            </label>
            <div className="two-up">
              <label>
                Duration
                <input
                  value={planningForm.estimatedDuration}
                  onChange={(event) =>
                    setPlanningForm((current) => ({
                      ...current,
                      estimatedDuration: event.target.value,
                    }))
                  }
                  placeholder="2h"
                />
              </label>
              <label>
                Assign day
                <select
                  value={planningForm.assignedDate}
                  onChange={(event) =>
                    setPlanningForm((current) => ({
                      ...current,
                      assignedDate: event.target.value,
                    }))
                  }
                >
                  <option value="">Unassigned</option>
                  {tripDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDateLabel(date)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="two-up">
              <label>
                Latitude
                <input
                  type="number"
                  step="0.0001"
                  value={planningForm.latitude}
                  onChange={(event) =>
                    setPlanningForm((current) => ({ ...current, latitude: event.target.value }))
                  }
                />
              </label>
              <label>
                Longitude
                <input
                  type="number"
                  step="0.0001"
                  value={planningForm.longitude}
                  onChange={(event) =>
                    setPlanningForm((current) => ({ ...current, longitude: event.target.value }))
                  }
                />
              </label>
            </div>
            <label>
              Note
              <textarea
                rows="3"
                value={planningForm.note}
                onChange={(event) =>
                  setPlanningForm((current) => ({ ...current, note: event.target.value }))
                }
              />
            </label>
            <button className="primary-button" type="submit">
              Save idea
            </button>
          </form>

          {selectedTrip.planningItems.map((item) => (
            <div className="card list-card" key={item.id}>
              <div className="section-head">
                <div>
                  <span className="type-pill planning">{item.category}</span>
                  <h3>{item.title}</h3>
                </div>
                <span className="priority-tag">{item.priority}</span>
              </div>
              <p className="muted">{item.locationName || 'Location pending'}</p>
              <p>{item.estimatedDuration || 'Flexible duration'}</p>
              <p className="muted">{item.note || 'No note yet'}</p>
              <div className="planner-actions">
                <select
                  value={item.assignedDate}
                  onChange={(event) => assignPlanningToDraft(item.id, event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {tripDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDateLabel(date)}
                    </option>
                  ))}
                </select>
                {item.assignedDate ? (
                  <button className="ghost-button" onClick={() => sendPlanningToTimeline(item)}>
                    Send to timeline
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      )
    }

    return (
      <section className="screen-section">
        <div className="card section-card">
          <div className="section-head">
            <h3>Daily draft</h3>
            <span className="mini-note">Pre-trip day planning</span>
          </div>
          {tripDates.map((date) => {
            const dayPlans = selectedTrip.planningItems.filter((item) => item.assignedDate === date)
            return (
              <div className="draft-day" key={date}>
                <div className="day-label-row">
                  <h4>{formatDateLabel(date)}</h4>
                  <span>{dayPlans.length} ideas</span>
                </div>
                {dayPlans.length > 0 ? (
                  dayPlans.map((item) => (
                    <div className="draft-item" key={item.id}>
                      <strong>{item.title}</strong>
                      <p>{item.locationName || 'Location pending'}</p>
                      <button className="ghost-button" onClick={() => sendPlanningToTimeline(item)}>
                        Push to during-trip timeline
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="muted">No assigned plans yet.</p>
                )}
              </div>
            )
          })}

          <form className="divider-top form-card compact-form" onSubmit={handleAddItineraryItem}>
            <div className="section-head">
              <h3>Add direct timeline item</h3>
            </div>
            <div className="two-up">
              <label>
                Day
                <select
                  value={itineraryForm.date}
                  onChange={(event) =>
                    setItineraryForm((current) => ({ ...current, date: event.target.value }))
                  }
                >
                  {tripDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDateLabel(date)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Time
                <input
                  type="time"
                  value={itineraryForm.time}
                  onChange={(event) =>
                    setItineraryForm((current) => ({ ...current, time: event.target.value }))
                  }
                />
              </label>
            </div>
            <label>
              Title
              <input
                value={itineraryForm.title}
                onChange={(event) =>
                  setItineraryForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>
            <label>
              Location
              <input
                value={itineraryForm.locationName}
                onChange={(event) =>
                  setItineraryForm((current) => ({
                    ...current,
                    locationName: event.target.value,
                  }))
                }
              />
            </label>
            <button className="primary-button" type="submit">
              Add to trip timeline
            </button>
          </form>
        </div>
      </section>
    )
  }

  function renderDuringTrip() {
    if (!selectedTrip) return null

    if (tabState.during === 'today') {
      return (
        <section className="screen-section">
          <div className="card hero-card small">
            <p className="eyebrow">During Trip</p>
            <h2>{selectedDate ? formatDateLabel(selectedDate) : 'Select a day'}</h2>
            <p className="muted">{selectedTrip.destination}</p>
          </div>

          <div className="card">
            <div className="section-head">
              <h3>Today timeline</h3>
              <select
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              >
                {tripDates.map((date) => (
                  <option key={date} value={date}>
                    {formatDateLabel(date)}
                  </option>
                ))}
              </select>
            </div>
            {todayItems.length > 0 ? (
              todayItems.map((item) => (
                <button
                  key={item.id}
                  className={
                    selectedTimelineItemId === item.id ? 'timeline-tile active' : 'timeline-tile'
                  }
                  onClick={() => setSelectedTimelineItemId(item.id)}
                >
                  <span className={`status-pill ${getStatusTone(item.status)}`}>{item.status}</span>
                  <strong>
                    {item.time} · {item.title}
                  </strong>
                  <p>{item.locationName}</p>
                </button>
              ))
            ) : (
              <p className="muted">Nothing on this day yet.</p>
            )}
          </div>

          <div className="card">
            <div className="section-head">
              <h3>Map</h3>
            </div>
            <ItemMap
              items={todayItems}
              selectedItemId={selectedTimelineItemId}
              onSelectItem={setSelectedTimelineItemId}
              heightClass="map-mobile"
            />
          </div>

          {selectedTimelineItem ? (
            <div className="card">
              <div className="section-head">
                <h3>Selected item</h3>
              </div>
              <h4>{selectedTimelineItem.title}</h4>
              <p>{selectedTimelineItem.locationName}</p>
              <p className="muted">{selectedTimelineItem.note || 'No note yet.'}</p>
            </div>
          ) : null}
        </section>
      )
    }

    if (tabState.during === 'timeline') {
      return (
        <section className="screen-section">
          <div className="card">
            <div className="section-head">
              <h3>Full timeline</h3>
              <button className="ghost-button" onClick={() => toggleArchive(true)}>
                Mark trip as post-trip
              </button>
            </div>
            <div className="date-pill-row">
              {tripDates.map((date) => (
                <button
                  key={date}
                  className={selectedDate === date ? 'date-pill active' : 'date-pill'}
                  onClick={() => setSelectedDate(date)}
                >
                  {formatDateLabel(date)}
                </button>
              ))}
            </div>
            {todayItems.map((item) => (
              <div className="card inset-card" key={item.id}>
                <div className="section-head">
                  <div>
                    <span className={`status-pill ${getStatusTone(item.status)}`}>{item.status}</span>
                    <h4>{item.title}</h4>
                  </div>
                  <strong>{item.time}</strong>
                </div>
                <p>{item.locationName}</p>
                <p className="muted">{item.note}</p>
                <div className="planner-actions three">
                  <button className="ghost-button" onClick={() => moveTimelineItem(item.id, -1)}>
                    Earlier
                  </button>
                  <button className="ghost-button" onClick={() => moveTimelineItem(item.id, 1)}>
                    Later
                  </button>
                  <select
                    value={item.status}
                    onChange={(event) =>
                      updateTimelineItem(item.id, { status: event.target.value })
                    }
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                    <option value="unfinished">Unfinished</option>
                  </select>
                </div>
                <div className="planner-actions">
                  <select
                    value={item.date}
                    onChange={(event) =>
                      updateTimelineItem(item.id, { date: event.target.value })
                    }
                  >
                    {tripDates.map((date) => (
                      <option key={date} value={date}>
                        {formatDateLabel(date)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={item.time}
                    onChange={(event) =>
                      updateTimelineItem(item.id, { time: event.target.value })
                    }
                  />
                </div>
              </div>
            ))}
            {unfinishedItems.length > 0 ? (
              <div className="divider-top">
                <h4>Reschedule queue</h4>
                {unfinishedItems.map((item) => (
                  <div className="queue-row" key={item.id}>
                    <span>{item.title}</span>
                    <span>{formatDateLabel(item.date)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )
    }

    return (
      <section className="screen-section">
        <div className="card">
          <div className="section-head">
            <h3>Trip access</h3>
            <span className="mini-note">No switching across apps</span>
          </div>
          {selectedTrip.bookings.map((booking) => (
            <div className="access-row" key={booking.id}>
              <div>
                <strong>{booking.title}</strong>
                <p>{booking.address}</p>
                <p className="muted">Ref: {booking.confirmationNumber || 'Not set'}</p>
              </div>
              <div className="access-links">
                {(booking.attachments ?? []).slice(0, 1).map((attachment) => (
                  <a key={attachment.id} href={attachment.dataUrl} target="_blank" rel="noreferrer">
                    PDF
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  function renderPostTrip() {
    if (!selectedTrip) return null

    if (tabState.post === 'archive') {
      return (
        <section className="screen-section">
          <div className="card hero-card small">
            <p className="eyebrow">Post-Trip</p>
            <h2>{selectedTrip.title}</h2>
            <p className="muted">
              {selectedTrip.archived ? 'Archived trip record' : 'Ready to archive when trip ends'}
            </p>
            <button className="primary-button" onClick={() => toggleArchive(!selectedTrip.archived)}>
              {selectedTrip.archived ? 'Reopen trip' : 'Archive trip'}
            </button>
          </div>

          <div className="card">
            <div className="section-head">
              <h3>Final summary</h3>
            </div>
            <div className="progress-list">
              <p>{selectedTrip.bookings.length} saved bookings</p>
              <p>{selectedTrip.itineraryItems.length} itinerary items</p>
              <p>
                {
                  new Set(selectedTrip.itineraryItems.map((item) => item.locationName)).size
                } locations captured
              </p>
            </div>
          </div>
        </section>
      )
    }

    if (tabState.post === 'footprint') {
      return (
        <section className="screen-section">
          <div className="card">
            <div className="section-head">
              <h3>Footprint</h3>
            </div>
            <ItemMap
              items={mappedPostItems}
              selectedItemId={selectedTimelineItemId}
              onSelectItem={setSelectedTimelineItemId}
              heightClass="map-mobile"
            />
          </div>
          <div className="card">
            {mappedPostItems.map((item) => (
              <div className="queue-row" key={item.id}>
                <span>{item.locationName}</span>
                <span>{formatDateLabel(item.date)}</span>
              </div>
            ))}
          </div>
        </section>
      )
    }

    return (
      <section className="screen-section">
        <div className="card">
          <div className="section-head">
            <h3>Trip record</h3>
          </div>
          {sortItinerary(selectedTrip.itineraryItems).map((item) => (
            <div className="record-row" key={item.id}>
              <strong>
                {formatDateLabel(item.date)} · {item.time}
              </strong>
              <p>{item.title}</p>
              <p className="muted">{item.locationName}</p>
            </div>
          ))}
        </div>
      </section>
    )
  }

  function renderStageContent() {
    if (!selectedTrip) return null
    if (stage === 'pre') return renderPreTrip()
    if (stage === 'during') return renderDuringTrip()
    return renderPostTrip()
  }

  function renderProfile() {
    const tripCount = trips.length
    const longestTrip = Math.max(
      ...trips.map((trip) => getTripDates(trip.startDate, trip.endDate).length),
      0,
    )
    const freeEntryUsed = tripCount >= 2 || longestTrip > 10

    if (tabState.profile === 'account') {
      return (
        <section className="screen-section">
          <div className="card profile-hero">
            <div className="profile-top">
              <div className="avatar-badge">{user.avatar}</div>
              <div>
                <p className="eyebrow">My</p>
                <h2>{user.isLoggedIn ? user.name : 'Guest traveler'}</h2>
                <p className="muted">
                  {user.isLoggedIn ? user.email : 'Log in to keep your trips synced'}
                </p>
              </div>
            </div>
            <button className="primary-button" onClick={toggleLogin}>
              {user.isLoggedIn ? 'Log out' : 'Log in'}
            </button>
          </div>

          <div className="card">
            <div className="section-head">
              <h3>Account</h3>
              <span className="mini-note">{user.plan}</span>
            </div>
            <div className="settings-list">
              <div className="settings-row">
                <span>Avatar</span>
                <button className="ghost-button">Change</button>
              </div>
              <div className="settings-row">
                <span>Trip sync</span>
                <span className="mini-note">{user.isLoggedIn ? 'On' : 'Off'}</span>
              </div>
              <div className="settings-row">
                <span>Notifications</span>
                <span className="mini-note">Enabled</span>
              </div>
            </div>
          </div>
        </section>
      )
    }

    if (tabState.profile === 'plan') {
      return (
        <section className="screen-section">
          <div className="card billing-card">
            <p className="eyebrow">Usage-based subscription</p>
            <h2>Free Entry</h2>
            <p className="muted">
              Users can fully use TraveLog for the first 2 trips of 10 days or less.
            </p>
            <div className="usage-grid">
              <article>
                <strong>{tripCount}</strong>
                <span>Total trips</span>
              </article>
              <article>
                <strong>{longestTrip}</strong>
                <span>Longest trip days</span>
              </article>
            </div>
            <div className={freeEntryUsed ? 'limit-banner warning' : 'limit-banner'}>
              {freeEntryUsed
                ? 'Free entry has been used. Continued travel usage should move to a paid plan.'
                : 'You are still inside the free entry window.'}
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <h3>Plans</h3>
              <span className="mini-note">Scaffold only for now</span>
            </div>
            <div className="plan-stack">
              <div className="plan-option">
                <div>
                  <strong>Free Entry</strong>
                  <p>2 trips up to 10 days each. Full product experience.</p>
                </div>
                <button className="ghost-button" onClick={() => activatePlan('Free Entry')}>
                  Current
                </button>
              </div>
              <div className="plan-option featured">
                <div>
                  <strong>Travel Active</strong>
                  <p>Pay when you continue active travel usage, not to unlock isolated features.</p>
                </div>
                <button className="primary-button" onClick={() => activatePlan('Travel Active')}>
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        </section>
      )
    }

    return (
      <section className="screen-section">
        <div className="card">
          <div className="section-head">
            <h3>Settings</h3>
          </div>
          <div className="settings-list">
            <div className="settings-row">
              <span>Language</span>
              <span className="mini-note">English UI</span>
            </div>
            <div className="settings-row">
              <span>Map preference</span>
              <span className="mini-note">Standard</span>
            </div>
            <div className="settings-row">
              <span>Storage</span>
              <span className="mini-note">Local prototype</span>
            </div>
            <div className="settings-row">
              <span>Support</span>
              <button className="ghost-button">Contact</button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderCreateTrip() {
    return (
      <section className="screen-section create-screen">
        <div className="create-hero">
          <h2>Plan a new trip</h2>
        </div>

        <form className="create-form" onSubmit={handleCreateTrip}>
          <label className="create-field">
            <span>Where to?</span>
            <div className="autocomplete-field">
              <input
                value={tripForm.destination}
                onChange={(event) => {
                  setTripForm((current) => ({ ...current, destination: event.target.value }))
                  setShowDestinationSuggestions(event.target.value.trim().length > 0)
                }}
                placeholder="Paris, Seoul, Japan"
              />
              {showDestinationSuggestions &&
              tripForm.destination.trim().length > 0 &&
              filteredDestinationOptions.length > 0 ? (
                <div className="suggestion-list">
                  {filteredDestinationOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="suggestion-item"
                      onClick={() => {
                        setTripForm((current) => ({ ...current, destination: option }))
                        setShowDestinationSuggestions(false)
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
              {showDestinationSuggestions &&
              tripForm.destination.trim().length > 0 &&
              filteredDestinationOptions.length === 0 &&
              isDestinationLoading ? (
                <div className="suggestion-loading">Searching places...</div>
              ) : null}
            </div>
          </label>

          <label className="create-field">
            <span>Trip name</span>
            <input
              value={tripForm.title}
              onChange={(event) =>
                setTripForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Spring in Paris"
            />
          </label>

          <div className="create-date-card">
            <p>Date</p>
            <div className="two-up">
              <label>
                <span>Start date</span>
                <input
                  type="date"
                  value={tripForm.startDate}
                  onChange={(event) =>
                    setTripForm((current) => ({ ...current, startDate: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>End date</span>
                <input
                  type="date"
                  value={tripForm.endDate}
                  onChange={(event) =>
                    setTripForm((current) => ({ ...current, endDate: event.target.value }))
                  }
                />
              </label>
            </div>
          </div>

          <button className="create-submit" type="submit">
            Start planning
          </button>
        </form>
      </section>
    )
  }

  function renderHome() {
    return (
      <section
        className="screen-section home-screen"
        style={{ '--home-bg-image': `url(${homeBackground})` }}
      >
        <div className="home-hero">
          <h1>
            Travel,
            <br />
            <span>All in one place</span>
          </h1>
          <button
            className="home-create-button"
            onClick={() => {
              setTripForm({ title: '', destination: '', startDate: '', endDate: '' })
              setMainView('create')
            }}
          >
            Create New Trip
          </button>
        </div>

        <div className="card">
          <div className="section-head">
            <h3>Upcoming Trips</h3>
          </div>
          {upcomingTrips.map((trip) => (
            <button
              key={trip.id}
              className="trip-preview-card"
              onClick={() => openTripWorkspace(trip.id, 'pre')}
            >
              <div>
                <strong>{trip.title}</strong>
                <p>{trip.destination}</p>
                <p className="muted">
                  {formatDateLabel(trip.startDate)} to {formatDateLabel(trip.endDate)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    )
  }

  function renderTripsHub() {
    const sections = [
      { key: 'upcoming', title: 'Upcoming', items: upcomingTripGroups },
      { key: 'ongoing', title: 'Ongoing', items: ongoingTripGroups },
      { key: 'past', title: 'Past', items: pastTripGroups },
    ]

    return (
      <section className="screen-section">
        {sections.map((section) => (
          <div className="card" key={section.key}>
            <div className="section-head">
              <h3>{section.title}</h3>
              <span className="mini-note">{section.items.length}</span>
            </div>
            {section.items.length > 0 ? (
              section.items.map((trip) => (
                <button
                  key={trip.id}
                  className="trip-preview-card"
                  onClick={() =>
                    openTripWorkspace(
                      trip.id,
                      section.key === 'past' ? 'post' : section.key === 'ongoing' ? 'during' : 'pre',
                    )
                  }
                >
                  <div>
                    <strong>{trip.title}</strong>
                    <p>{trip.destination}</p>
                    <p className="muted">
                      {formatDateLabel(trip.startDate)} to {formatDateLabel(trip.endDate)}
                    </p>
                  </div>
                  <span className="mini-note">Open</span>
                </button>
              ))
            ) : (
              <p className="muted">No {section.title.toLowerCase()} trips yet.</p>
            )}
          </div>
        ))}

        <button
          className="floating-add-button"
          aria-label="Create a new trip"
          onClick={() => {
            setTripForm({ title: '', destination: '', startDate: '', endDate: '' })
            setMainView('create')
          }}
        >
          +
        </button>
      </section>
    )
  }

  function renderRecordHub() {
    return (
      <section className="screen-section">
        {trips.map((trip) => (
          <div className="card" key={trip.id}>
            <div className="section-head">
              <div>
                <h3>{trip.title}</h3>
                <p className="muted">{trip.destination}</p>
              </div>
              <button className="ghost-button" onClick={() => openTripWorkspace(trip.id, 'post')}>
                Open
              </button>
            </div>
            <div className="progress-list">
              <p>
                {formatDateLabel(trip.startDate)} to {formatDateLabel(trip.endDate)}
              </p>
              <p>{trip.itineraryItems.length} timeline items</p>
              <p>
                {new Set(trip.itineraryItems.map((item) => item.locationName)).size} recorded
                locations
              </p>
            </div>
          </div>
        ))}
      </section>
    )
  }

  const currentTabs =
    mainView === 'home' ||
    mainView === 'trips' ||
    mainView === 'create' ||
    mainView === 'record'
      ? []
      : mainView === 'my'
      ? profileTabs
      : stage === 'pre'
        ? preTabs
        : stage === 'during'
          ? duringTabs
          : postTabs

  const currentLabelMap = {
    pre: {
      overview: 'Overview',
      bookings: 'Bookings',
      planning: 'Planning',
      draft: 'Daily Draft',
    },
    during: {
      today: 'Today',
      timeline: 'Timeline',
      access: 'Trip Access',
    },
    post: {
      archive: 'Archive',
      footprint: 'Footprint',
      record: 'Record',
    },
    profile: {
      account: 'Account',
      plan: 'Billing',
      settings: 'Settings',
    },
  }

  return (
    <div className="mobile-shell">
      <div className={mainView === 'home' ? 'phone-frame home-mode' : 'phone-frame'}>
        <header className="app-header">
          {mainView !== 'home' ? (
            <button className="back-button" onClick={handleBack} aria-label="Go back">
              &lt;
            </button>
          ) : null}
          <div>
            <p className="eyebrow">TraveLog</p>
            <h1 className={mainView === 'home' ? 'home-header-title' : 'app-title-small'}>
              {mainView === 'home'
                ? 'Your trips, organized.'
                : mainView === 'create'
                  ? 'Create trip'
                : mainView === 'record'
                  ? 'Record'
                : mainView === 'trips'
                  ? 'Trips'
                : mainView === 'my'
                  ? 'My'
                  : selectedTrip?.title ?? 'Trip'}
            </h1>
            <p className="muted">
              {mainView === 'trips'
                  ? 'Browse upcoming, ongoing, and past trips.'
                : mainView === 'create'
                  ? 'Start with a blank trip and fill in the basics.'
                : mainView === 'record'
                  ? 'Review saved trip records and open any trip archive.'
                : mainView === 'my'
                ? 'Account, billing, and app settings'
                : selectedTrip
                ? `${selectedTrip.destination} · ${formatDateLabel(selectedTrip.startDate)}`
                : 'Create or open a trip'}
            </p>
          </div>
          {mainView === 'trip' ? (
            <select
              className="trip-switcher"
              value={selectedTripId ?? ''}
              onChange={(event) => setSelectedTripId(event.target.value)}
            >
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </select>
          ) : null}
        </header>

        {mainView === 'trip' ? (
          <section className="stage-switcher">
            {stageTabs.map((item) => (
              <button
                key={item}
                className={stage === item ? 'stage-pill active' : 'stage-pill'}
                onClick={() => setStage(item)}
              >
                {item === 'pre' ? 'Pre-Trip' : item === 'during' ? 'During Trip' : 'Post-Trip'}
              </button>
            ))}
          </section>
        ) : null}

        {currentTabs.length > 0 ? (
          <section className="subnav-row">
            {currentTabs.map((tab) => (
              <button
                key={tab}
                className={
                  tabState[mainView === 'my' ? 'profile' : stage] === tab
                    ? 'subnav-pill active'
                    : 'subnav-pill'
                }
                onClick={() =>
                  setTabState((current) => ({
                    ...current,
                    [mainView === 'my' ? 'profile' : stage]: tab,
                  }))
                }
              >
                {currentLabelMap[mainView === 'my' ? 'profile' : stage][tab]}
              </button>
            ))}
          </section>
        ) : null}

        <main className="screen-body">
          {mainView === 'home'
            ? renderHome()
            : mainView === 'create'
              ? renderCreateTrip()
            : mainView === 'record'
              ? renderRecordHub()
            : mainView === 'trips'
              ? renderTripsHub()
            : mainView === 'my'
              ? renderProfile()
              : renderStageContent()}
        </main>

        <footer className="bottom-dock">
          <button onClick={() => setMainView('home')}>Home</button>
          <button onClick={() => setMainView('trips')}>Trips</button>
          <button onClick={() => setMainView('record')}>Record</button>
          <button onClick={() => setMainView('my')}>My</button>
        </footer>
      </div>
    </div>
  )
}

export default App
