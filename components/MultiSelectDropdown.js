// MultiSelectDropdown 컴포넌트
// 예약 관리 페이지 파일 내부에 추가할 컴포넌트입니다

const MultiSelectDropdown = ({ 
  options, 
  value = [], 
  onChange, 
  placeholder = '선택하세요',
  label 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleSelect = (optionValue) => {
    if (value.includes(optionValue)) {
      // 이미 선택된 경우 제거
      onChange(value.filter(v => v !== optionValue))
    } else {
      // 선택되지 않은 경우 추가
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