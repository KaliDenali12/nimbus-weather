import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, MapPin } from 'lucide-react'
import { useWeather } from '@/context/WeatherContext.tsx'
import { useDebounce } from '@/hooks/useDebounce.ts'
import type { GeocodingResult, City } from '@/types/index.ts'

export function SearchBar() {
  const { searchForCities, selectCity } = useWeather()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [searchError, setSearchError] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setSearchError(false)

    searchForCities(debouncedQuery).then((data) => {
      if (!cancelled) {
        setResults(data)
        setIsOpen(true)
        setLoading(false)
        setActiveIndex(-1)
      }
    }).catch(() => {
      if (!cancelled) {
        setResults([])
        setSearchError(true)
        setIsOpen(true)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [debouncedQuery, searchForCities])

  // Click-outside dismissal
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = useCallback(
    (result: GeocodingResult) => {
      const city: City = {
        name: result.name,
        lat: result.latitude,
        lon: result.longitude,
        country: result.country,
        admin1: result.admin1,
      }
      selectCity(city)
      setQuery('')
      setIsOpen(false)
      setResults([])
      inputRef.current?.blur()
    },
    [selectCity],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex]!)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const clear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSearchError(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          className="glass-input pl-11 pr-10"
          placeholder="Search for a city..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          aria-label="Search for a city"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="search-results"
          role="combobox"
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
            onClick={clear}
            aria-label="Clear search"
          >
            <X size={16} className="text-white/50" />
          </button>
        )}
      </div>

      {isOpen && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute top-full mt-2 w-full z-50 overflow-hidden rounded-dropdown"
          style={{
            background: 'rgba(20, 30, 50, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {results.length === 0 && !loading && (
            <li className="px-4 py-3 text-body-sm text-secondary">
              {searchError ? 'Search failed — check your connection' : 'No cities found'}
            </li>
          )}
          {results.map((result, index) => (
            <li
              key={result.id}
              role="option"
              aria-selected={index === activeIndex}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-fast
                ${index === activeIndex ? 'bg-white/10' : 'hover:bg-white/[0.08]'}
                ${index < results.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <MapPin size={14} className="text-white/40 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <span className="text-[14px] font-medium text-white/90">
                  {result.name}
                </span>
                <span className="text-body-sm text-white/50 ml-1.5">
                  {result.admin1 ? `${result.admin1}, ` : ''}{result.country}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
