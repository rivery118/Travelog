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
const postTabs = ['footprint', 'record']
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

function createParisSampleTrip() {
  const tripId = createId()

  return {
    id: tripId,
    title: 'Paris Spring Week',
    destination: 'Paris',
    startDate: '2025-04-14',
    endDate: '2025-04-17',
    notes:
      'Real Paris trip notes: Eiffel Tower first evening, Seine cruise after arrival, then Louvre, Tuileries, Concorde, Champs-Elysees, Arc de Triomphe, Orsay, Notre-Dame, Shakespeare and Company, Montmartre, Opera, department stores, and Sacre-Coeur sunset.',
    bookings: createParisDemoBookings(tripId),
    planningItems: createParisDemoPlanning(tripId),
    itineraryItems: createParisDemoItinerary(tripId),
  }
}

function createJapanSampleTrip() {
  const tripId = createId()

  return {
    id: tripId,
    title: 'Fall Break',
    destination: 'Japan',
    startDate: '2026-06-27',
    endDate: '2026-07-09',
    notes:
      'Tokyo demo trip with bookings, hotel changes, day-by-day planning, and editable itinerary examples for product demos.',
    bookings: createJapanDemoBookings(tripId),
    planningItems: [],
    itineraryItems: createJapanDemoItinerary(tripId),
  }
}

function createSampleTrips() {
  return [createParisSampleTrip(), createJapanSampleTrip()]
}

function ensureDemoTrips(sourceTrips) {
  const trips = Array.isArray(sourceTrips) ? [...sourceTrips] : []
  const hasParisDemo = trips.some((trip) => {
    const normalizedTitle = (trip.title ?? '').toLowerCase()
    const normalizedDestination = (trip.destination ?? '').toLowerCase()
    return normalizedDestination.includes('paris') || normalizedTitle.includes('paris spring week')
  })
  const hasJapanDemo = trips.some((trip) => {
    const normalizedTitle = (trip.title ?? '').toLowerCase()
    const normalizedDestination = (trip.destination ?? '').toLowerCase()
    return normalizedDestination.includes('japan') || normalizedTitle.includes('fall break')
  })

  if (!hasParisDemo) {
    trips.push(createParisSampleTrip())
  }

  if (!hasJapanDemo) {
    trips.push(createJapanSampleTrip())
  }

  return trips
}

function createParisDemoBookings(tripId) {
  return [
    {
      id: createId(),
      tripId,
      type: 'flight',
      title: 'Air France AF011',
      provider: 'Air France',
      confirmationNumber: 'AF-PAR14',
      startDateTime: '2025-04-14T09:45',
      endDateTime: '2025-04-14T15:10',
      address: 'JFK Terminal 1 -> Paris Charles de Gaulle Airport',
      latitude: 49.0097,
      longitude: 2.5479,
      details: {
        departureAirport: 'JFK',
        arrivalAirport: 'CDG',
        terminal: '2E',
        passengerName: 'Avery Chen',
        seat: '34A',
      },
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      type: 'hotel',
      title: 'Hotel Louvre Rivoli',
      provider: 'Booking.com',
      confirmationNumber: 'HT-PAR001',
      startDateTime: '2025-04-14T14:30',
      endDateTime: '2025-04-18T11:00',
      address: '7 Rue Jean Lantier, 75001 Paris',
      latitude: 48.8597,
      longitude: 2.345,
      details: {
        checkIn: '2026-04-14',
        checkOut: '2026-04-18',
        roomType: 'Classic Double Room',
        guestName: 'Avery Chen',
      },
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      type: 'ticket',
      title: 'Louvre Museum Timed Entry',
      provider: 'Official Ticketing',
      confirmationNumber: 'LV-1509',
      startDateTime: '2025-04-15T09:00',
      endDateTime: '2025-04-15T12:30',
      address: 'Rue de Rivoli, 75001 Paris',
      latitude: 48.8606,
      longitude: 2.3376,
      details: {
        entryTime: '09:00',
        guestName: 'Avery Chen',
        ticketType: 'General admission',
      },
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      type: 'ticket',
      title: 'Musee d Orsay Entry',
      provider: 'Musee d Orsay',
      confirmationNumber: 'OR-1614',
      startDateTime: '2025-04-16T14:00',
      endDateTime: '2025-04-16T16:30',
      address: 'Esplanade Valery Giscard d Estaing, 75007 Paris',
      latitude: 48.86,
      longitude: 2.3266,
      details: {
        entryTime: '14:00',
        guestName: 'Avery Chen',
        ticketType: 'Museum admission',
      },
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      type: 'ticket',
      title: 'Seine River Cruise',
      provider: 'Bateaux Parisiens',
      confirmationNumber: 'SE-1419',
      startDateTime: '2025-04-14T19:30',
      endDateTime: '2025-04-14T20:45',
      address: 'Port de la Bourdonnais, 75007 Paris',
      latitude: 48.8624,
      longitude: 2.2875,
      details: {
        entryTime: '19:30',
        guestName: 'Avery Chen',
        ticketType: 'Sightseeing cruise',
      },
      attachments: [],
    },
  ]
}

function createParisDemoPlanning(tripId) {
  return [
    {
      id: createId(),
      tripId,
      title: 'Notre-Dame reservation slot',
      category: 'Church',
      locationName: 'Notre-Dame de Paris',
      latitude: 48.853,
      longitude: 2.3499,
      estimatedDuration: '1.5h',
      note: 'Grab the free slot a few days before visiting.',
      priority: 'high',
      assignedDate: '2025-04-16',
    },
    {
      id: createId(),
      tripId,
      title: 'Orsay ticket ready',
      category: 'Ticket',
      locationName: 'Musee d Orsay',
      latitude: 48.86,
      longitude: 2.3266,
      estimatedDuration: '15m',
      note: 'Keep the Apr 16 afternoon ticket accessible.',
      priority: 'medium',
      assignedDate: '2025-04-16',
    },
    {
      id: createId(),
      tripId,
      title: 'Department store gifts',
      category: 'Shopping',
      locationName: 'Galeries Lafayette',
      latitude: 48.872,
      longitude: 2.3324,
      estimatedDuration: '2h',
      note: 'Reserve time for gifts on the last full day.',
      priority: 'medium',
      assignedDate: '2025-04-17',
    },
  ]
}

function createParisDemoItinerary(tripId) {
  return [
    {
      id: createId(),
      tripId,
      date: '2025-04-14',
      time: '16:00',
      title: 'Eiffel Tower start',
      locationName: 'Eiffel Tower',
      latitude: 48.8584,
      longitude: 2.2945,
      note: 'Reserved the first Paris activity for 4 PM right after arrival.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-14',
      time: '18:00',
      title: 'Metro to Eiffel / river area',
      locationName: 'Bir-Hakeim',
      latitude: 48.8556,
      longitude: 2.2893,
      note: 'Simple transfer before the cruise and dinner.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-14',
      time: '19:30',
      title: 'Seine River Cruise',
      locationName: 'Port de la Bourdonnais',
      latitude: 48.8624,
      longitude: 2.2875,
      note: 'Cruise right after the Eiffel Tower works nicely on arrival day.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-14',
      time: '21:00',
      title: 'Dinner nearby',
      locationName: '7th arrondissement',
      latitude: 48.8598,
      longitude: 2.2972,
      note: 'Flexible dinner close to the cruise dock.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-15',
      time: '09:00',
      title: 'Louvre Museum',
      locationName: 'Louvre Museum',
      latitude: 48.8606,
      longitude: 2.3376,
      note: 'Do not be late for the 9 AM slot, tickets already bought.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-15',
      time: '13:30',
      title: 'Tuileries Garden',
      locationName: 'Jardin des Tuileries',
      latitude: 48.8635,
      longitude: 2.327,
      note: 'Good decompression stop after the museum.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-15',
      time: '14:30',
      title: 'Place de la Concorde',
      locationName: 'Place de la Concorde',
      latitude: 48.8656,
      longitude: 2.3212,
      note: 'Continue the central Paris walk west.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-15',
      time: '15:30',
      title: 'Champs-Elysees walk',
      locationName: 'Champs-Elysees',
      latitude: 48.8698,
      longitude: 2.3078,
      note: 'Window shopping and wide-boulevard views.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-15',
      time: '17:00',
      title: 'Arc de Triomphe',
      locationName: 'Arc de Triomphe',
      latitude: 48.8738,
      longitude: 2.295,
      note: 'Finish Day 1 at the far end of the avenue.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-16',
      time: '10:00',
      title: 'Luxembourg Gardens',
      locationName: 'Luxembourg Gardens',
      latitude: 48.8462,
      longitude: 2.3371,
      note: 'Slow morning before the museum afternoon.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-16',
      time: '11:30',
      title: 'Saint-Sulpice Church',
      locationName: 'Saint-Sulpice Church',
      latitude: 48.8516,
      longitude: 2.3338,
      note: 'Quick stop on the Left Bank.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-16',
      time: '14:00',
      title: 'Musee d Orsay',
      locationName: 'Musee d Orsay',
      latitude: 48.86,
      longitude: 2.3266,
      note: 'Use the afternoon ticket slot from the official museum site.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-16',
      time: '16:45',
      title: 'Notre-Dame de Paris',
      locationName: 'Notre-Dame de Paris',
      latitude: 48.853,
      longitude: 2.3499,
      note: 'Free reservation grabbed ahead of time.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-16',
      time: '18:00',
      title: 'Shakespeare and Company',
      locationName: 'Shakespeare and Company',
      latitude: 48.8526,
      longitude: 2.3471,
      note: 'Easy bookstore stop right after Notre-Dame.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-17',
      time: '10:00',
      title: 'Montmartre stroll',
      locationName: 'Montmartre',
      latitude: 48.8867,
      longitude: 2.3431,
      note: 'Start the last day in the neighborhood.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-17',
      time: '12:30',
      title: 'Palais Garnier',
      locationName: 'Palais Garnier',
      latitude: 48.8719,
      longitude: 2.3316,
      note: 'Midday opera house stop.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-17',
      time: '14:00',
      title: 'Galeries Lafayette gifts',
      locationName: 'Galeries Lafayette Haussmann',
      latitude: 48.872,
      longitude: 2.3324,
      note: 'Gift shopping for family and friends.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-17',
      time: '15:30',
      title: 'Le Printemps browse',
      locationName: 'Printemps Haussmann',
      latitude: 48.8723,
      longitude: 2.3285,
      note: 'Second department store stop for comparison shopping.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-17',
      time: '17:30',
      title: 'Sacre-Coeur Basilica',
      locationName: 'Sacre-Coeur Basilica',
      latitude: 48.8867,
      longitude: 2.3431,
      note: 'No reservation needed and a good pre-sunset stop.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2025-04-17',
      time: '19:00',
      title: 'Montmartre sunset overlook',
      locationName: 'Parvis du Sacre-Coeur',
      latitude: 48.8868,
      longitude: 2.343,
      note: 'End the trip with sunset and a citywide view.',
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
  ]
}

function createJapanDemoBookings(tripId) {
  return [
    {
      id: createId(),
      tripId,
      type: 'flight',
      title: 'Japan Airlines JL005',
      provider: 'Japan Airlines',
      confirmationNumber: 'JL-27TKYO',
      startDateTime: '2026-06-27T10:45',
      endDateTime: '2026-06-27T14:35',
      address: 'Taipei Taoyuan Airport (TPE) -> Tokyo Haneda Airport (HND)',
      latitude: 35.5494,
      longitude: 139.7798,
      details: {
        departureAirport: 'TPE',
        arrivalAirport: 'HND',
        terminal: '3',
        passengerName: 'Avery Chen',
        seat: '23A',
      },
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      type: 'hotel',
      title: 'Tokyu Stay Shinjuku',
      provider: 'Booking.com',
      confirmationNumber: 'HS-2701',
      startDateTime: '2026-06-27T16:30',
      endDateTime: '2026-06-29T11:00',
      address: '3-7-1 Shinjuku, Tokyo',
      latitude: 35.6917,
      longitude: 139.7036,
      details: {
        checkIn: '2026-06-27',
        checkOut: '2026-06-29',
        roomType: 'Superior Double',
        guestName: 'Avery Chen',
      },
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      type: 'hotel',
      title: 'Mitsui Garden Hotel Ginza',
      provider: 'Agoda',
      confirmationNumber: 'HS-2902',
      startDateTime: '2026-06-29T15:00',
      endDateTime: '2026-07-02T11:00',
      address: '8-13-1 Ginza, Tokyo',
      latitude: 35.669,
      longitude: 139.7634,
      details: {
        checkIn: '2026-06-29',
        checkOut: '2026-07-02',
        roomType: 'Moderate Queen',
        guestName: 'Avery Chen',
      },
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      type: 'transport',
      title: 'Narita Express reserved seat',
      provider: 'JR East',
      confirmationNumber: 'NEX-8813',
      startDateTime: '2026-06-27T15:40',
      endDateTime: '2026-06-27T16:25',
      address: 'Tokyo Haneda Airport -> Shinjuku Station',
      latitude: 35.6909,
      longitude: 139.7003,
      details: {
        ticketType: 'Airport transfer',
        guestName: 'Avery Chen',
        seat: 'Car 4 / Seat 12C',
      },
      attachments: [],
    },
  ]
}

function createJapanDemoItinerary(tripId) {
  return [
    {
      id: createId(),
      tripId,
      date: '2026-06-27',
      time: '16:45',
      title: 'Check in and coffee near hotel',
      locationName: 'Shinjuku Southern Terrace',
      latitude: 35.6875,
      longitude: 139.7004,
      note: 'Light reset stop before heading out.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-27',
      time: '17:30',
      title: 'Shinjuku evening walk',
      locationName: 'Shinjuku',
      latitude: 35.6938,
      longitude: 139.7034,
      note: 'Easy first stop after check-in and dinner nearby.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-27',
      time: '18:30',
      title: 'Tokyo Metropolitan Government Building',
      locationName: 'Tokyo Metropolitan Government Building',
      latitude: 35.6896,
      longitude: 139.6917,
      note: 'Free night view if timing works.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-27',
      time: '20:00',
      title: 'Omoide Yokocho dinner',
      locationName: 'Omoide Yokocho',
      latitude: 35.6932,
      longitude: 139.6995,
      note: 'Casual first-night dinner close to hotel.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-28',
      time: '09:00',
      title: 'Senso-ji Temple',
      locationName: 'Asakusa',
      latitude: 35.7148,
      longitude: 139.7967,
      note: 'Start early before the crowd.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-28',
      time: '10:00',
      title: 'Nakamise street snacks',
      locationName: 'Nakamise-dori Street',
      latitude: 35.7116,
      longitude: 139.7964,
      note: 'Short snack stop beside Senso-ji.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-28',
      time: '11:00',
      title: 'Tokyo Skytree',
      locationName: 'Tokyo Skytree',
      latitude: 35.7101,
      longitude: 139.8107,
      note: 'Observation deck slot around noon.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-28',
      time: '12:15',
      title: 'Sumida riverside photo stop',
      locationName: 'Sumida River Walk',
      latitude: 35.7093,
      longitude: 139.8089,
      note: 'Quick walk between Skytree and lunch.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-28',
      time: '13:00',
      title: 'Sushi lunch at Tsukiji',
      locationName: 'Tsukiji Outer Market',
      latitude: 35.6654,
      longitude: 139.7707,
      note: 'Lunch stop after crossing the city.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-28',
      time: '15:00',
      title: 'Hamarikyu Garden',
      locationName: 'Hamarikyu Gardens',
      latitude: 35.6591,
      longitude: 139.7634,
      note: 'Good reset after lunch.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-28',
      time: '16:30',
      title: 'teamLab Planets',
      locationName: 'teamLab Planets TOKYO',
      latitude: 35.6492,
      longitude: 139.7893,
      note: 'Late afternoon slot works best.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-28',
      time: '19:00',
      title: 'Tokyo Tower night view',
      locationName: 'Tokyo Tower',
      latitude: 35.6586,
      longitude: 139.7454,
      note: 'Optional evening skyline stop.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-29',
      time: '08:30',
      title: 'Yoyogi Park walk',
      locationName: 'Yoyogi Park',
      latitude: 35.6717,
      longitude: 139.6949,
      note: 'Easy morning before shrine visit.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-29',
      time: '10:00',
      title: 'Meiji Shrine',
      locationName: 'Meiji Shrine',
      latitude: 35.6764,
      longitude: 139.6993,
      note: 'Morning visit before moving hotels.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-29',
      time: '11:30',
      title: 'Omotesando browse',
      locationName: 'Omotesando',
      latitude: 35.6674,
      longitude: 139.7124,
      note: 'Window shopping before hotel switch.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-29',
      time: '14:30',
      title: 'Check in at Ginza hotel',
      locationName: 'Ginza',
      latitude: 35.6717,
      longitude: 139.765,
      note: 'Drop bags and reset before heading out.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-29',
      time: '16:00',
      title: 'Ginza six rooftop',
      locationName: 'GINZA SIX',
      latitude: 35.6694,
      longitude: 139.7613,
      note: 'Quick look after settling into the new hotel.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
    {
      id: createId(),
      tripId,
      date: '2026-06-29',
      time: '18:00',
      title: 'Ginza dinner',
      locationName: 'Ginza',
      latitude: 35.6717,
      longitude: 139.765,
      note: 'Flexible dinner reservation.',
      status: 'scheduled',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    },
  ]
}

function mergeMissingDemoBookings(existingBookings, demoBookings) {
  const existingKeys = new Set(
    existingBookings.map((booking) => `${booking.type}::${booking.title}::${booking.startDateTime}`),
  )

  return [
    ...existingBookings,
    ...demoBookings.filter(
      (booking) => !existingKeys.has(`${booking.type}::${booking.title}::${booking.startDateTime}`),
    ),
  ]
}

function mergeMissingDemoItinerary(existingItems, demoItems) {
  const existingKeys = new Set(
    existingItems.map((item) => `${item.date}::${item.time}::${item.title}`),
  )

  return [
    ...existingItems,
    ...demoItems.filter((item) => !existingKeys.has(`${item.date}::${item.time}::${item.title}`)),
  ]
}

function mergeMissingDemoPlanning(existingItems, demoItems) {
  const existingKeys = new Set(
    existingItems.map((item) => `${item.assignedDate}::${item.title}`),
  )

  return [
    ...existingItems,
    ...demoItems.filter((item) => !existingKeys.has(`${item.assignedDate}::${item.title}`)),
  ]
}

function maybeSeedParisDemoTrip(trip) {
  const normalizedTitle = (trip.title ?? '').toLowerCase()
  const normalizedDestination = (trip.destination ?? '').toLowerCase()
  const looksLikeParisDemo =
    normalizedDestination.includes('paris') || normalizedTitle.includes('paris spring week')

  if (!looksLikeParisDemo) return trip

  const demoBookings = createParisDemoBookings(trip.id)
  const demoPlanning = createParisDemoPlanning(trip.id)
  const demoItinerary = createParisDemoItinerary(trip.id)

  return {
    ...trip,
    startDate:
      trip.startDate === '2026-04-10' ||
      trip.startDate === '2026-04-14' ||
      !trip.startDate
        ? '2025-04-14'
        : trip.startDate,
    endDate:
      trip.endDate === '2026-04-16' ||
      trip.endDate === '2026-04-17' ||
      !trip.endDate
        ? '2025-04-17'
        : trip.endDate,
    notes:
      trip.notes ||
      'Real Paris trip notes: Eiffel Tower first evening, Seine cruise after arrival, then Louvre, Tuileries, Concorde, Champs-Elysees, Arc de Triomphe, Orsay, Notre-Dame, Shakespeare and Company, Montmartre, Opera, department stores, and Sacre-Coeur sunset.',
    bookings: mergeMissingDemoBookings(trip.bookings ?? [], demoBookings),
    planningItems: mergeMissingDemoPlanning(trip.planningItems ?? [], demoPlanning),
    itineraryItems: mergeMissingDemoItinerary(trip.itineraryItems ?? [], demoItinerary),
  }
}

function maybeSeedJapanDemoTrip(trip) {
  const normalizedTitle = (trip.title ?? '').toLowerCase()
  const normalizedDestination = (trip.destination ?? '').toLowerCase()
  const looksLikeJapanDemo =
    normalizedDestination.includes('japan') || normalizedTitle.includes('fall break')

  if (!looksLikeJapanDemo || (trip.bookings ?? []).length > 0) {
    if (!looksLikeJapanDemo) {
      return trip
    }
  }

  const demoBookings = createJapanDemoBookings(trip.id)
  const demoItinerary = createJapanDemoItinerary(trip.id)

  return {
    ...trip,
    bookings: mergeMissingDemoBookings(trip.bookings ?? [], demoBookings),
    itineraryItems: mergeMissingDemoItinerary(trip.itineraryItems ?? [], demoItinerary),
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
  const baseSource = Array.isArray(input) && input.length > 0 ? input : createSampleTrips()
  const source = ensureDemoTrips(baseSource)

  return source.map((rawTrip) => {
    const trip = maybeSeedJapanDemoTrip(maybeSeedParisDemoTrip(rawTrip))

    return {
      ...trip,
    destination: trip.destination ?? '',
    notes: trip.notes ?? '',
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
      hidden: Boolean(item.hidden),
      sourceBookingId: item.sourceBookingId ?? null,
      attachments: (item.attachments ?? []).map(normalizeAttachment),
    })),
    }
  })
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

function formatEditableDateInput(dateString) {
  if (!dateString) return ''
  return dateString.replaceAll('-', '/')
}

function parseEditableDateInput(value) {
  const normalized = value.trim().replaceAll('/', '-').replaceAll('.', '-')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null

  const [year, month, day] = normalized.split('-').map(Number)
  const candidate = new Date(`${normalized}T12:00:00`)
  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getFullYear() !== year ||
    candidate.getMonth() + 1 !== month ||
    candidate.getDate() !== day
  ) {
    return null
  }

  return normalized
}

function getTodayLocalIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
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

function getOverviewFlightSummary(bookings) {
  return sortItinerary(
    bookings
      .filter((booking) => booking.type === 'flight')
      .map((booking) => ({
        ...booking,
        date: booking.startDateTime.slice(0, 10),
        time: booking.startDateTime.slice(11, 16),
      })),
  )[0]
}

function getStaySummary(bookings) {
  return [...bookings]
    .filter((booking) => booking.type === 'hotel')
    .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime))
}

function getStayForDate(bookings, date) {
  return (
    [...bookings]
      .filter((booking) => {
        if (booking.type !== 'hotel') return false
        const start = booking.startDateTime.slice(0, 10)
        const end = booking.endDateTime.slice(0, 10)
        return start <= date && date < end
      })
      .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime))[0] ?? null
  )
}

function getCoordinateDistance(a, b) {
  if (!hasValidCoordinates(a) || !hasValidCoordinates(b)) return Number.POSITIVE_INFINITY

  const latDiff = a.latitude - b.latitude
  const lonDiff = a.longitude - b.longitude
  return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff)
}

function getTripDistanceKm(items) {
  const mappable = sortItinerary(items.filter((item) => !item.hidden && hasValidCoordinates(item)))
  let total = 0

  for (let index = 1; index < mappable.length; index += 1) {
    const previous = mappable[index - 1]
    const current = mappable[index]
    const latKm = (current.latitude - previous.latitude) * 111
    const lonKm =
      (current.longitude - previous.longitude) *
      111 *
      Math.cos(((current.latitude + previous.latitude) / 2) * (Math.PI / 180))
    total += Math.sqrt(latKm * latKm + lonKm * lonKm)
  }

  return Math.round(total)
}

function getTripDurationDays(startDate, endDate) {
  return getTripDates(startDate, endDate).length
}

function getTripCityCount(trip) {
  if (!trip.destination) return 0
  const parts = trip.destination
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  return Math.max(1, new Set(parts).size)
}

function getTripCountryLabel(trip) {
  const destination = (trip.destination ?? '').trim()
  if (!destination) return 'Unknown'
  const parts = destination.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length > 1) return parts[parts.length - 1]
  if (destination.toLowerCase() === 'paris') return 'France'
  if (destination.toLowerCase() === 'japan') return 'Japan'
  return destination
}

function getGoogleMapsUrl(address) {
  if (!address) return '#'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
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
    post: 'footprint',
    profile: 'account',
  })
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimelineItemId, setSelectedTimelineItemId] = useState(null)
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [selectedRecordTripId, setSelectedRecordTripId] = useState(null)
  const [selectedRecordItemId, setSelectedRecordItemId] = useState(null)
  const [showRecordExportSheet, setShowRecordExportSheet] = useState(false)
  const [shareNotice, setShareNotice] = useState('')
  const [tripDateDraft, setTripDateDraft] = useState({
    start: '',
    end: '',
  })
  const [activeDayViewDate, setActiveDayViewDate] = useState('')
  const [draggedTimelineItemId, setDraggedTimelineItemId] = useState(null)
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
  const [recordSpotForm, setRecordSpotForm] = useState({
    date: '',
    title: '',
    locationName: '',
    latitude: '',
    longitude: '',
    note: '',
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
    plan: 'Starter Pack',
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
    if (!selectedTrip) {
      setTripDateDraft({ start: '', end: '' })
      return
    }

    setTripDateDraft({
      start: formatEditableDateInput(selectedTrip.startDate),
      end: formatEditableDateInput(selectedTrip.endDate),
    })
  }, [selectedTrip?.endDate, selectedTrip?.id, selectedTrip?.startDate])

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
  const itineraryByDate = selectedTrip
    ? tripDates.map((date) => ({
        date,
        items: sortItinerary(selectedTrip.itineraryItems.filter((item) => item.date === date)),
      }))
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

  const todayIso = getTodayLocalIso()
  const upcomingTripGroups = trips
    .filter((trip) => trip.startDate > todayIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  const ongoingTripGroups = trips
    .filter((trip) => trip.startDate <= todayIso && trip.endDate >= todayIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  const pastTripGroups = trips
    .filter((trip) => trip.endDate < todayIso)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
  const upcomingTrips = upcomingTripGroups.slice(0, 3)
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
      if (activeDayViewDate) {
        setActiveDayViewDate('')
        return
      }

      const activeTabKey = stage
      const defaultStageTab =
        activeTabKey === 'pre' ? 'overview' : activeTabKey === 'during' ? 'today' : 'footprint'

      if (tabState[activeTabKey] !== defaultStageTab) {
        setTabState((current) => ({
          ...current,
          [activeTabKey]: defaultStageTab,
        }))
        return
      }

      setMainView('trips')
      return
    }

    if (
      mainView === 'my' ||
      mainView === 'trips' ||
      mainView === 'create' ||
      mainView === 'record'
    ) {
      if (mainView === 'record' && selectedRecordTripId) {
        setSelectedRecordTripId(null)
        setSelectedRecordItemId(null)
        setShowRecordExportSheet(false)
        return
      }

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
      notes: '',
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
    setTabState({ pre: 'overview', during: 'today', post: 'footprint' })
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
      hidden: false,
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
      hidden: false,
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

  function removeTimelineItem(itemId) {
    if (!selectedTrip) return

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      itineraryItems: trip.itineraryItems.filter((item) => item.id !== itemId),
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

  function openRecordTrip(tripId) {
    setSelectedRecordTripId(tripId)
    const recordTrip = trips.find((trip) => trip.id === tripId)
    const firstItem = sortItinerary(recordTrip?.itineraryItems ?? [])[0] ?? null
    setSelectedRecordItemId(firstItem?.id ?? null)
    setRecordSpotForm((current) => ({
      ...current,
      date: recordTrip?.startDate ?? '',
    }))
  }

  function triggerRecordExport(format) {
    setShowRecordExportSheet(false)
    window.alert(
      format === 'pdf'
        ? 'PDF record export will be connected next.'
        : 'Video record export will be connected next.',
    )
  }

  async function shareTripLink() {
    if (!selectedTrip) return

    const slug = `${selectedTrip.title}-${selectedTrip.id.slice(0, 8)}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const shareUrl = `https://travelog-six.vercel.app/share/${slug}`
    const shareText = `See my ${selectedTrip.title} trip on TraveLog. Open the link to preview it and download the app for the full itinerary.`

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${selectedTrip.title} on TraveLog`,
          text: shareText,
          url: shareUrl,
        })
        setShareNotice('Trip link shared.')
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        setShareNotice('Trip link copied. Friends can open it and get prompted to download TraveLog.')
        return
      }

      window.prompt('Copy and share this TraveLog trip link:', shareUrl)
      setShareNotice('Trip link ready to share.')
    } catch {
      window.prompt('Copy and share this TraveLog trip link:', shareUrl)
      setShareNotice('Trip link ready to share.')
    }
  }

  function addRecordSpot(event) {
    event.preventDefault()
    const recordTrip = trips.find((trip) => trip.id === selectedRecordTripId)
    if (!recordTrip || !recordSpotForm.title || !recordSpotForm.date) return

    const newSpot = {
      id: createId(),
      tripId: recordTrip.id,
      date: recordSpotForm.date,
      time: '18:00',
      title: recordSpotForm.title,
      locationName: recordSpotForm.locationName || recordSpotForm.title,
      latitude: recordSpotForm.latitude === '' ? null : Number(recordSpotForm.latitude),
      longitude: recordSpotForm.longitude === '' ? null : Number(recordSpotForm.longitude),
      note: recordSpotForm.note,
      status: 'done',
      hidden: false,
      sourceBookingId: null,
      attachments: [],
    }

    updateTrip(recordTrip.id, (trip) => ({
      ...trip,
      itineraryItems: [...trip.itineraryItems, newSpot],
    }))
    setSelectedRecordItemId(newSpot.id)
    setRecordSpotForm({
      date: recordSpotForm.date,
      title: '',
      locationName: '',
      latitude: '',
      longitude: '',
      note: '',
    })
  }

  async function uploadRecordPhotos(itemId, files) {
    const recordTrip = trips.find((trip) => trip.id === selectedRecordTripId)
    if (!recordTrip || !files?.length) return

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    const attachments = await Promise.all(
      imageFiles.map(async (file) => ({
        id: createId(),
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: await readFileAsDataUrl(file),
      })),
    )

    updateTrip(recordTrip.id, (trip) => ({
      ...trip,
      itineraryItems: trip.itineraryItems.map((item) =>
        item.id === itemId
          ? { ...item, attachments: [...(item.attachments ?? []), ...attachments] }
          : item,
      ),
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

  function updateTripDates(startDate, endDate) {
    if (!selectedTrip) return

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      startDate,
      endDate,
    }))
  }

  function commitTripDateDraft(field) {
    if (!selectedTrip) return

    const parsedValue = parseEditableDateInput(tripDateDraft[field])
    if (!parsedValue) {
      setTripDateDraft({
        start: formatEditableDateInput(selectedTrip.startDate),
        end: formatEditableDateInput(selectedTrip.endDate),
      })
      return
    }

    if (field === 'start') {
      updateTripDates(parsedValue, selectedTrip.endDate)
      return
    }

    updateTripDates(selectedTrip.startDate, parsedValue)
  }

  function openBookingComposer(type = 'flight') {
    setBookingForm((current) => ({
      ...current,
      type,
    }))
    setTabState((current) => ({ ...current, pre: 'bookings' }))
  }

  function openBookingDetails(bookingId) {
    if (!bookingId) return
    setSelectedBookingId(bookingId)
    setStage('pre')
    setTabState((current) => ({ ...current, pre: 'bookings' }))
  }

  function openDayByDayView() {
    setStage('during')
    setTabState((current) => ({ ...current, during: 'timeline' }))
  }

  function openAddTimelineItem(date = '') {
    setStage('pre')
    setTabState((current) => ({ ...current, pre: 'draft' }))
    if (date) {
      setSelectedDate(date)
      setItineraryForm((current) => ({ ...current, date }))
    }
  }

  function openDayDetail(date) {
    setSelectedDate(date)
    setStage('during')
    setTabState((current) => ({ ...current, during: 'timeline' }))
    setActiveDayViewDate(date)
  }

  function moveTimelineItemToDate(itemId, nextDate) {
    if (!selectedTrip || !nextDate) return

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      itineraryItems: trip.itineraryItems.map((item) =>
        item.id === itemId ? { ...item, date: nextDate } : item,
      ),
    }))
  }

  function optimizeDayRoute(date) {
    if (!selectedTrip || !date) return

    const dayItems = sortItinerary(selectedTrip.itineraryItems.filter((item) => item.date === date))
    const visibleMappableItems = dayItems.filter((item) => !item.hidden && hasValidCoordinates(item))

    if (visibleMappableItems.length < 2) return

    const remaining = [...visibleMappableItems]
    const optimized = [remaining.shift()]

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1]
      let nextIndex = 0
      let nextDistance = getCoordinateDistance(current, remaining[0])

      for (let index = 1; index < remaining.length; index += 1) {
        const distance = getCoordinateDistance(current, remaining[index])
        if (distance < nextDistance) {
          nextDistance = distance
          nextIndex = index
        }
      }

      optimized.push(remaining.splice(nextIndex, 1)[0])
    }

    const optimizedIds = optimized.map((item) => item.id)
    const untouchedItems = dayItems.filter((item) => !optimizedIds.includes(item.id))
    const finalOrder = [...optimized, ...untouchedItems]

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      itineraryItems: trip.itineraryItems.map((item) => {
        if (item.date !== date) return item

        const nextIndex = finalOrder.findIndex((entry) => entry.id === item.id)
        if (nextIndex < 0) return item

        const hour = String(9 + nextIndex).padStart(2, '0')
        const minute = nextIndex % 2 === 0 ? '00' : '30'
        return { ...item, time: `${hour}:${minute}` }
      }),
    }))
  }

  function reorderDayItemsByDrop(targetItemId) {
    if (!selectedTrip || !activeDayViewDate || !draggedTimelineItemId) return
    if (draggedTimelineItemId === targetItemId) return

    const dayItems = sortItinerary(
      selectedTrip.itineraryItems.filter((item) => item.date === activeDayViewDate),
    )
    const fromIndex = dayItems.findIndex((item) => item.id === draggedTimelineItemId)
    const toIndex = dayItems.findIndex((item) => item.id === targetItemId)

    if (fromIndex < 0 || toIndex < 0) return

    const reordered = [...dayItems]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      itineraryItems: trip.itineraryItems.map((item) => {
        if (item.date !== activeDayViewDate) return item

        const nextIndex = reordered.findIndex((entry) => entry.id === item.id)
        if (nextIndex < 0) return item

        const hour = String(9 + nextIndex).padStart(2, '0')
        return { ...item, time: `${hour}:00` }
      }),
    }))
  }

  function renderDayDetail() {
    if (!selectedTrip || !activeDayViewDate) return null

    const dayItems = sortItinerary(
      selectedTrip.itineraryItems.filter((item) => item.date === activeDayViewDate),
    )
    const visibleDayItems = dayItems.filter((item) => !item.hidden)
    const isPastTrip = selectedTrip.endDate < todayIso

    return (
      <section className="screen-section">
        <div className="card day-detail-hero">
          <p className="eyebrow">Day plan</p>
          <h2>{selectedTrip.destination || selectedTrip.title}</h2>
          <p className="trip-subtitle">{selectedTrip.title}</p>
          <p className="muted">{formatDateLabel(activeDayViewDate)}</p>
        </div>

        <div className="card">
          <div className="section-head">
            <div>
              <h3>Map</h3>
              <p className="muted">Pins update as you edit the stops below.</p>
            </div>
          </div>
          <ItemMap
            items={visibleDayItems}
            selectedItemId={selectedTimelineItemId}
            onSelectItem={setSelectedTimelineItemId}
            heightClass="map-mobile day-detail-map"
          />
        </div>

        <div className="card">
          <div className="section-head">
            <div>
              <h3>{formatDateLabel(activeDayViewDate)}</h3>
              <p className="muted">
                {dayItems.length > 0
                  ? isPastTrip
                    ? 'A read-only day record for this completed trip.'
                    : 'Drag cards to reorder, or move them to another day.'
                  : 'No itinerary items for this day yet.'}
              </p>
            </div>
            {isPastTrip ? null : (
              <button className="ghost-button" onClick={() => optimizeDayRoute(activeDayViewDate)}>
                Optimize route
              </button>
            )}
          </div>

          {dayItems.length > 0 ? (
            <div className="day-detail-list">
              {dayItems.map((item) => (
                <article
                  key={item.id}
                  className="day-detail-item"
                  draggable={!isPastTrip}
                  onDragStart={isPastTrip ? undefined : () => setDraggedTimelineItemId(item.id)}
                  onDragEnd={isPastTrip ? undefined : () => setDraggedTimelineItemId(null)}
                  onDragOver={isPastTrip ? undefined : (event) => event.preventDefault()}
                  onDrop={isPastTrip ? undefined : () => reorderDayItemsByDrop(item.id)}
                >
                  <div className="day-detail-topline">
                    <div className="day-detail-time">
                      <strong>{item.time}</strong>
                    </div>
                    <div className="day-detail-main">
                      <div className="section-head inline">
                        <div>
                          <span className={`status-pill ${getStatusTone(item.status)}`}>
                            {item.status}
                          </span>
                          <h4>{item.title}</h4>
                        </div>
                        {isPastTrip ? null : (
                          <span className="drag-handle" aria-hidden="true">
                            ≡
                          </span>
                        )}
                      </div>
                      <p>{item.locationName || 'Location pending'}</p>
                      <p className="muted">{item.note || 'No note yet.'}</p>
                      {item.hidden ? <p className="mini-note">Hidden from map and active route</p> : null}
                    </div>
                  </div>

                  {isPastTrip ? null : (
                    <>
                      <div className="planner-actions">
                        <select
                          value={item.status}
                          onChange={(event) => updateTimelineItem(item.id, { status: event.target.value })}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="in-progress">In progress</option>
                          <option value="done">Done</option>
                          <option value="unfinished">Unfinished</option>
                        </select>
                      </div>

                      <div className="planner-actions three">
                        <button
                          className="ghost-button"
                          onClick={() => updateTimelineItem(item.id, { hidden: !item.hidden })}
                        >
                          {item.hidden ? 'Show' : 'Hide'}
                        </button>
                        <button className="ghost-button" onClick={() => removeTimelineItem(item.id)}>
                          Remove
                        </button>
                        <select
                          value={item.date}
                          onChange={(event) => moveTimelineItemToDate(item.id, event.target.value)}
                        >
                          {tripDates.map((tripDate) => (
                            <option key={tripDate} value={tripDate}>
                              Move to {formatDateLabel(tripDate)}
                            </option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={item.time}
                          onChange={(event) => updateTimelineItem(item.id, { time: event.target.value })}
                        />
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="daylist-empty-card">
              <p className="muted">Add or move itinerary items here from other dates.</p>
            </div>
          )}
        </div>
      </section>
    )
  }

  function renderPreTrip() {
    if (!selectedTrip) return null

    if (tabState.pre === 'overview') {
      const overviewFlight = getOverviewFlightSummary(selectedTrip.bookings)
      const staySummary = getStaySummary(selectedTrip.bookings)
      const isPastTrip = selectedTrip.endDate < todayIso

      return (
        <section className="screen-section trip-dashboard">
          <div className="trip-cover" />

          <div className="trip-summary-card">
            <div className="trip-summary-main">
              <div>
                <p className="eyebrow">Trip</p>
                <h2>{selectedTrip.destination || selectedTrip.title}</h2>
                <p className="trip-subtitle">{selectedTrip.title}</p>
              </div>
              <div className="summary-actions">
                <button className="ghost-button small-pill" onClick={shareTripLink}>
                  Share
                </button>
              </div>
            </div>
            <div className="trip-date-editor">
              <p className="muted">
                {formatDateLabel(selectedTrip.startDate)} to {formatDateLabel(selectedTrip.endDate)}
              </p>
              {isPastTrip ? null : (
                <div className="two-up trip-date-inputs">
                  <label>
                    <span>Start</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="YYYY/MM/DD"
                      value={tripDateDraft.start}
                      onChange={(event) =>
                        setTripDateDraft((current) => ({ ...current, start: event.target.value }))
                      }
                      onBlur={() => commitTripDateDraft('start')}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.currentTarget.blur()
                        }
                      }}
                    />
                  </label>
                  <label>
                    <span>End</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="YYYY/MM/DD"
                      value={tripDateDraft.end}
                      onChange={(event) =>
                        setTripDateDraft((current) => ({ ...current, end: event.target.value }))
                      }
                      onBlur={() => commitTripDateDraft('end')}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.currentTarget.blur()
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
            {shareNotice ? <p className="mini-note share-feedback">{shareNotice}</p> : null}
          </div>

          {isPastTrip ? null : (
            <div className="overview-dual-grid">
              <article className="dashboard-action-card booking-action-card">
                <div>
                  <h3>Upload booking</h3>
                  <p>Add your confirmations and keep core travel documents in one place.</p>
                </div>
                <div className="booking-icon-row interactive">
                  <button
                    className="booking-icon-tile"
                    type="button"
                    onClick={() => openBookingComposer('flight')}
                  >
                    <span>✈</span>
                    <small>Flights</small>
                  </button>
                  <button
                    className="booking-icon-tile"
                    type="button"
                    onClick={() => openBookingComposer('hotel')}
                  >
                    <span>🛏</span>
                    <small>Hotels</small>
                  </button>
                  <button
                    className="booking-icon-tile"
                    type="button"
                    onClick={() => openBookingComposer('transport')}
                  >
                    <span>🚘</span>
                    <small>Cars</small>
                  </button>
                  <button
                    className="booking-icon-tile"
                    type="button"
                    onClick={() => openBookingComposer('ticket')}
                  >
                    <span>📎</span>
                    <small>PDFs</small>
                  </button>
                </div>
              </article>

              <article className="dashboard-action-card">
                <h3>Plan activities</h3>
                <p>Collect places, restaurants, and ideas before assigning them to a day.</p>
                <button
                  className="link-button"
                  onClick={() => setTabState((current) => ({ ...current, pre: 'planning' }))}
                >
                  Open
                </button>
              </article>
            </div>
          )}

          <div className="card compact-dashboard-card">
            <div className="section-head">
              <h3>Trip essentials</h3>
            </div>

            <div className="overview-essentials-grid">
              <button
                type="button"
                className="overview-summary-module interactive-summary-module"
                onClick={() => openBookingDetails(overviewFlight?.id)}
              >
                <p className="mini-note">Transit</p>
                {overviewFlight ? (
                  <div className="overview-summary-stack">
                    <strong>
                      {formatDateLabel(overviewFlight.startDateTime.slice(0, 10))} ·{' '}
                      {new Date(overviewFlight.startDateTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      depart
                    </strong>
                    <p>
                      {overviewFlight.details?.departureAirport || 'Origin'} to{' '}
                      {overviewFlight.details?.arrivalAirport || 'Destination'}
                    </p>
                    <p className="muted">
                      Land {new Date(overviewFlight.endDateTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      · Flight {overviewFlight.title}
                    </p>
                    <p className="muted">
                      Ref {overviewFlight.confirmationNumber || 'Pending'} · Seat{' '}
                      {overviewFlight.details?.seat || 'Not assigned'}
                    </p>
                    <span className="summary-link">Open booking details</span>
                  </div>
                ) : (
                  <p className="muted">No flight details yet.</p>
                )}
              </button>

              <div className="overview-summary-module">
                <p className="mini-note">Stay</p>
                {staySummary.length > 0 ? (
                  <div className="overview-summary-stack">
                    {staySummary.map((booking) => (
                      <button
                        key={booking.id}
                        type="button"
                        className="overview-stay-row interactive-stay-row"
                        onClick={() => openBookingDetails(booking.id)}
                      >
                        <strong>
                          {new Date(booking.startDateTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          to{' '}
                          {new Date(booking.endDateTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </strong>
                        <p>{booking.title}</p>
                        <a
                          href={getGoogleMapsUrl(booking.address)}
                          target="_blank"
                          rel="noreferrer"
                          className="address-link"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {booking.address}
                        </a>
                        <p className="muted">
                          {booking.confirmationNumber || 'No confirmation'} ·{' '}
                          {booking.details?.roomType || 'Room pending'}
                        </p>
                        <span className="summary-link">Open stay details</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No stays added yet.</p>
                )}
              </div>
            </div>
          </div>

          <button className="card daylist-entry-card" onClick={openDayByDayView}>
            <div className="section-head">
              <div>
                <h3>Day-by-day itinerary</h3>
                <p className="muted">Open the full trip plan by date.</p>
              </div>
              <span className="daylist-chevron">›</span>
            </div>
            <div className="daylist-preview-stack">
              {itineraryByDate.slice(0, 3).map(({ date, items }) => (
                <div className="daylist-preview-row" key={date}>
                  <strong>{formatDateLabel(date)}</strong>
                  <span>{items.filter((item) => !item.hidden).length} items</span>
                </div>
              ))}
            </div>
          </button>

          <div className="card compact-dashboard-card">
            <div className="section-head">
              <h3>Notes</h3>
            </div>
            <textarea
              className="trip-notes-input"
              rows="5"
              placeholder="Add trip notes, reminders, links, or anything you want to keep handy."
              value={selectedTrip.notes}
              onChange={(event) =>
                updateTrip(selectedTrip.id, (trip) => ({
                  ...trip,
                  notes: event.target.value,
                }))
              }
            />
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

    if (activeDayViewDate) {
      return renderDayDetail()
    }

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
              <div>
                <h3>Day-by-day itinerary</h3>
                <p className="muted">Browse the whole trip and adjust any item by day.</p>
              </div>
            </div>
            <div className="daylist-stack">
              {itineraryByDate.map(({ date, items }) => (
                <section className="daylist-day-block simple-day-block" key={date}>
                  <button className="daylist-day-head daylist-day-button" onClick={() => openDayDetail(date)}>
                    <div>
                      <h4>{formatDateLabel(date)}</h4>
                      {(() => {
                        const stayBooking = getStayForDate(selectedTrip.bookings, date)
                        return (
                          <div className="daylist-stay-copy">
                            <p className="muted">
                              {stayBooking ? 'Stay' : 'No stay added yet'}
                            </p>
                            {stayBooking ? (
                              <>
                                <strong>{stayBooking.title}</strong>
                                <p className="muted">{stayBooking.address}</p>
                              </>
                            ) : null}
                          </div>
                        )
                      })()}
                    </div>
                    <span className="daylist-chevron">›</span>
                  </button>
                </section>
              ))}
            </div>
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

          <button
            className="floating-add-button"
            aria-label="Add a new itinerary stop"
            onClick={() => openAddTimelineItem(selectedDate || tripDates[0] || '')}
          >
            +
          </button>
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

    if (tabState.post === 'footprint') {
      return (
        <section className="screen-section">
          <div className="card hero-card small">
            <p className="eyebrow">Post-Trip</p>
            <h2>{selectedTrip.title}</h2>
            <p className="muted">
              {selectedTrip.itineraryItems.length} recorded moments across{' '}
              {getTripDurationDays(selectedTrip.startDate, selectedTrip.endDate)} days
            </p>
          </div>

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
      const pricingOptions = [
        {
          name: 'Starter Pack',
          price: '$9.99',
          trips: '5 trips',
          rate: '$2.00 per trip',
          note: 'Best for trying TraveLog on a few upcoming getaways.',
          featured: false,
        },
        {
          name: 'Traveler Pack',
          price: '$18.99',
          trips: '10 trips',
          rate: '$1.90 per trip',
          note: 'Buy more upfront and get a better per-trip rate.',
          featured: true,
        },
        {
          name: 'Frequent Pack',
          price: '$34.99',
          trips: '20 trips',
          rate: '$1.75 per trip',
          note: 'Best value for active travelers planning throughout the year.',
          featured: false,
        },
      ]

      return (
        <section className="screen-section">
          <div className="card billing-card">
            <p className="eyebrow">Trip credit pricing</p>
            <h2>$9.99 for 5 trips</h2>
            <p className="muted">
              Pay for trip credits instead of a monthly subscription. Each new trip uses 1 credit,
              and bigger bundles bring the per-trip cost down.
            </p>
            <div className="usage-grid">
              <article>
                <strong>{tripCount}</strong>
                <span>Trips created</span>
              </article>
              <article>
                <strong>{longestTrip}</strong>
                <span>Longest trip days</span>
              </article>
            </div>
            <div className={freeEntryUsed ? 'limit-banner warning' : 'limit-banner'}>
              {freeEntryUsed
                ? 'You are already using TraveLog beyond the free sample window. Add trip credits to keep planning.'
                : 'You are still inside the sample window, but paid trip credits are ready when you need more.'}
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <h3>Credit packs</h3>
              <span className="mini-note">Charged upfront</span>
            </div>
            <div className="plan-stack">
              {pricingOptions.map((option) => (
                <div
                  key={option.name}
                  className={option.featured ? 'plan-option featured pricing-option' : 'plan-option pricing-option'}
                >
                  <div>
                    <strong>
                      {option.name} · {option.price}
                    </strong>
                    <p>{option.trips}</p>
                    <p>{option.note}</p>
                    <span className="mini-note">{option.rate}</span>
                  </div>
                  <button
                    className={option.featured ? 'primary-button' : 'ghost-button'}
                    onClick={() => activatePlan(option.name)}
                  >
                    {user.plan === option.name ? 'Selected' : 'Choose'}
                  </button>
                </div>
              ))}
            </div>
            <div className="charge-notes">
              <p>Trip credits are used when a new trip is created.</p>
              <p>Unused credits stay on the account for future planning.</p>
              <p>Bulk packs lower the effective cost per trip.</p>
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
                    openTripWorkspace(trip.id, section.key === 'ongoing' ? 'during' : 'pre')
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
    const recordTrips = trips.filter((trip) => trip.endDate < todayIso)
    const activeRecordTrip =
      recordTrips.find((trip) => trip.id === selectedRecordTripId) ?? null
    const activeRecordItems = sortItinerary(activeRecordTrip?.itineraryItems ?? [])
    const allRecordItems = sortItinerary(
      recordTrips.flatMap((trip) => trip.itineraryItems ?? []).filter((item) => !item.hidden),
    )
    const cumulativeStats = {
      trips: recordTrips.length,
      countries: new Set(recordTrips.map((trip) => getTripCountryLabel(trip))).size,
      locations: new Set(
        allRecordItems.map((item) => item.locationName || item.title).filter(Boolean),
      ).size,
      days: recordTrips.reduce(
        (sum, trip) => sum + getTripDurationDays(trip.startDate, trip.endDate),
        0,
      ),
    }
    const selectedRecordItem =
      activeRecordTrip?.itineraryItems.find((item) => item.id === selectedRecordItemId) ??
      activeRecordItems[0] ??
      null
    const tripStats = activeRecordTrip
      ? {
          days: getTripDurationDays(activeRecordTrip.startDate, activeRecordTrip.endDate),
          cities: getTripCityCount(activeRecordTrip),
          distanceKm: getTripDistanceKm(activeRecordTrip.itineraryItems),
          stops: activeRecordTrip.itineraryItems.filter((item) => !item.hidden).length,
          photos: activeRecordTrip.itineraryItems.reduce(
            (sum, item) => sum + (item.attachments?.length ?? 0),
            0,
          ),
          bookings: activeRecordTrip.bookings.length,
        }
      : null

    if (recordTrips.length === 0) {
      return (
        <section className="screen-section">
          <div className="card">
            <h3>No recorded trips yet</h3>
            <p className="muted">Finished trips will show up here as travel records.</p>
          </div>
        </section>
      )
    }

    return (
      <section className="screen-section">
        {!activeRecordTrip ? (
          <>
            <div className="card">
              <div className="section-head">
                <div>
                  <h3>Travel records</h3>
                  <p className="muted">Open one completed trip to view its detailed memory record.</p>
                </div>
              </div>
              <div className="record-trip-grid">
                {recordTrips.map((trip) => (
                  <button
                    key={trip.id}
                    className="record-trip-card"
                    onClick={() => openRecordTrip(trip.id)}
                  >
                    <p className="eyebrow">Past Trip</p>
                    <strong>{trip.title}</strong>
                    <span>{trip.destination}</span>
                    <small>
                      {formatDateLabel(trip.startDate)} to {formatDateLabel(trip.endDate)}
                    </small>
                  </button>
                ))}
              </div>
            </div>

            <div className="card record-log-hero">
              <p className="eyebrow">Travel Log</p>
              <h2>Your footprint over time</h2>
              <p className="muted">
                Automatically generated from completed trips, visited routes, and saved places.
              </p>
            </div>

            <div className="stats-grid record-overview-stats">
              <article>
                <strong>{cumulativeStats.trips}</strong>
                <span>Trips</span>
              </article>
              <article>
                <strong>{cumulativeStats.countries}</strong>
                <span>Countries</span>
              </article>
              <article>
                <strong>{cumulativeStats.locations}</strong>
                <span>Locations</span>
              </article>
              <article>
                <strong>{cumulativeStats.days}</strong>
                <span>Travel days</span>
              </article>
            </div>

            <div className="card">
              <div className="section-head">
                <div>
                  <h3>Global footprint</h3>
                  <p className="muted">A cumulative map of completed trip routes and visited places.</p>
                </div>
              </div>
              <ItemMap
                items={allRecordItems}
                selectedItemId={null}
                heightClass="map-mobile record-overview-map"
              />
            </div>
          </>
        ) : (
          <>
          <div className="card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Travel records</p>
                <h3>{activeRecordTrip.title}</h3>
                <p className="muted">{activeRecordTrip.destination}</p>
              </div>
              <button
                className="ghost-button small-pill"
                onClick={() => setShowRecordExportSheet(true)}
              >
                Share
              </button>
            </div>
          </div>

          <div className="card hero-card small">
            <p className="eyebrow">Record</p>
            <h2>{activeRecordTrip.title}</h2>
            <p className="muted">
              {formatDateLabel(activeRecordTrip.startDate)} to {formatDateLabel(activeRecordTrip.endDate)}
            </p>
          </div>

          <div className="card">
            <div className="section-head">
              <h3>Footprint</h3>
            </div>
            <ItemMap
              items={activeRecordItems.filter((item) => !item.hidden)}
              selectedItemId={selectedRecordItem?.id ?? null}
              onSelectItem={setSelectedRecordItemId}
              heightClass="map-mobile"
            />
            <p className="muted map-helper-copy">
              Tap a pin on the map to open that memory spot and attach photos.
            </p>
            <div className="divider-top">
              {selectedRecordItem ? (
                <article className="record-memory-card">
                  <div className="section-head inline">
                    <div>
                      <strong>
                        {formatDateLabel(selectedRecordItem.date)} · {selectedRecordItem.time}
                      </strong>
                      <h4>{selectedRecordItem.title}</h4>
                    </div>
                    <span className={`status-pill ${getStatusTone(selectedRecordItem.status)}`}>
                      {selectedRecordItem.status}
                    </span>
                  </div>
                  <p>{selectedRecordItem.locationName}</p>
                  <p className="muted">{selectedRecordItem.note || 'No memory note yet.'}</p>
                  <label className="upload-button">
                    Add photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => {
                        uploadRecordPhotos(selectedRecordItem.id, event.target.files)
                        event.target.value = ''
                      }}
                    />
                  </label>
                  {(selectedRecordItem.attachments ?? []).length > 0 ? (
                    <div className="record-photo-grid">
                      {selectedRecordItem.attachments.map((attachment) => (
                        <img
                          key={attachment.id}
                          src={attachment.dataUrl}
                          alt={attachment.name}
                          className="record-photo-thumb"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="muted">No photos added yet for this spot.</p>
                  )}
                </article>
              ) : (
                <p className="muted">Tap a map pin to open one memory spot here.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <div>
                <h3>Add memory spot</h3>
                <p className="muted">Drop an extra pin for a cafe, photo spot, or memory worth keeping.</p>
              </div>
            </div>
            <form className="form-card compact-form" onSubmit={addRecordSpot}>
              <div className="two-up">
                <label>
                  Day
                  <select
                    value={recordSpotForm.date}
                    onChange={(event) =>
                      setRecordSpotForm((current) => ({ ...current, date: event.target.value }))
                    }
                  >
                    {getTripDates(activeRecordTrip.startDate, activeRecordTrip.endDate).map((date) => (
                      <option key={date} value={date}>
                        {formatDateLabel(date)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Title
                  <input
                    value={recordSpotForm.title}
                    onChange={(event) =>
                      setRecordSpotForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Morning cafe in Le Marais"
                  />
                </label>
              </div>
              <label>
                Location
                <input
                  value={recordSpotForm.locationName}
                  onChange={(event) =>
                    setRecordSpotForm((current) => ({ ...current, locationName: event.target.value }))
                  }
                  placeholder="Place des Vosges"
                />
              </label>
              <div className="two-up">
                <label>
                  Latitude
                  <input
                    type="number"
                    step="0.0001"
                    value={recordSpotForm.latitude}
                    onChange={(event) =>
                      setRecordSpotForm((current) => ({ ...current, latitude: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Longitude
                  <input
                    type="number"
                    step="0.0001"
                    value={recordSpotForm.longitude}
                    onChange={(event) =>
                      setRecordSpotForm((current) => ({ ...current, longitude: event.target.value }))
                    }
                  />
                </label>
              </div>
              <label>
                Note
                <textarea
                  rows="3"
                  value={recordSpotForm.note}
                  onChange={(event) =>
                    setRecordSpotForm((current) => ({ ...current, note: event.target.value }))
                  }
                  placeholder="Why this spot matters, what happened there, what to remember."
                />
              </label>
              <button className="primary-button" type="submit">
                Save memory spot
              </button>
            </form>
          </div>

          <div className="stats-grid record-stats-grid">
            <article>
              <strong>{tripStats.days}</strong>
              <span>Days</span>
            </article>
            <article>
              <strong>{tripStats.distanceKm}</strong>
              <span>Km traveled</span>
            </article>
            <article>
              <strong>{tripStats.cities}</strong>
              <span>Cities</span>
            </article>
            <article>
              <strong>{tripStats.stops}</strong>
              <span>Stops logged</span>
            </article>
            <article>
              <strong>{tripStats.photos}</strong>
              <span>Photos saved</span>
            </article>
            <article>
              <strong>{tripStats.bookings}</strong>
              <span>Bookings kept</span>
            </article>
          </div>

          {showRecordExportSheet ? (
            <div className="export-sheet-backdrop" onClick={() => setShowRecordExportSheet(false)}>
              <div className="export-sheet" onClick={(event) => event.stopPropagation()}>
                <p className="eyebrow">Share</p>
                <h3>Export record</h3>
                <p className="muted">
                  Choose how you want to package this trip memory.
                </p>
                <button className="export-option" onClick={() => triggerRecordExport('pdf')}>
                  <strong>PDF record</strong>
                  <span>A printable travel record with maps, notes, and photos.</span>
                </button>
                <button className="export-option" onClick={() => triggerRecordExport('video')}>
                  <strong>Video record</strong>
                  <span>A short recap reel built from your route, highlights, and photos.</span>
                </button>
                <button className="ghost-button" onClick={() => setShowRecordExportSheet(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          </>
        )}
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
        {mainView !== 'trip' ? (
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
                    ? 'Review saved trip records and revisit finished trips.'
                : mainView === 'my'
                    ? 'Account, billing, and app settings'
                    : selectedTrip
                      ? `${selectedTrip.destination} · ${formatDateLabel(selectedTrip.startDate)}`
                      : 'Create or open a trip'}
              </p>
            </div>
          </header>
        ) : null}

        {mainView === 'trip' ? null : currentTabs.length > 0 ? (
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

        <main className={mainView === 'trip' ? 'screen-body trip-body' : 'screen-body'}>
          {mainView === 'trip' ? (
            <button className="back-button" onClick={handleBack} aria-label="Go back">
              &lt;
            </button>
          ) : null}
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
