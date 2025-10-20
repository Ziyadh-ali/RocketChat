import React, { useState, useRef, useEffect } from 'react';

const Autocomplete = ({ 
  options = [], 
  value = [], 
  onChange, 
  onInputChange,
  placeholder = "Type to search...", 
  label = "",
  className = "",
  renderOption = (option) => option
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(option)
  );

  const addOption = (option) => {
    const newValue = [...value, option];
    onChange(newValue);
    setInputValue('');
    setShowDropdown(false);
  };

  const removeOption = (optionToRemove) => {
    const newValue = value.filter(option => option !== optionToRemove);
    onChange(newValue);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onInputChange) onInputChange(newValue);
    if (newValue && !showDropdown && options.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue && options.includes(inputValue)) {
      e.preventDefault();
      addOption(inputValue);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <div className="flex flex-wrap gap-1 mb-2">
          {value.map(option => (
            <span
              key={option}
              className="inline-flex items-center px-2 py-1 bg-rose-500/20 text-rose-400 text-sm rounded-full border border-rose-500/50"
            >
              {option}
              <button
                type="button"
                onClick={() => removeOption(option)}
                className="ml-1 text-rose-400 hover:text-rose-300 rounded-full hover:bg-rose-500/20 w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue && options.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
        {showDropdown && filteredOptions.length > 0 && (
          <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-lg mt-1 max-h-40 overflow-y-auto">
            {filteredOptions.map(option => (
              <li
                key={option}
                onClick={() => addOption(option)}
                className="px-3 py-2 text-white hover:bg-gray-600 cursor-pointer text-sm border-b border-gray-600 last:border-b-0"
              >
                {renderOption(option)}
              </li>
            ))}
          </ul>
        )}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          Selected: {value.join(', ')}
        </p>
      )}
    </div>
  );
};

export default Autocomplete;