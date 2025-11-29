import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import { useSearchOptions, useSelectedOptions } from '../hooks/useSearchOptions';
import { ChevronDown, X } from 'lucide-react';

export interface Option {
    id: number;
    name: string;
}

interface AjaxSelectProps {
    label: string;
    endpoint: string;
    value: number | ''; // Single selected ID or empty
    onChange: (selectedId: number | '') => void;
    placeholder?: string;
    debounceMs?: number;
    extraParams?: Record<string, string | number>;
    className?: string;
    disabled?: boolean;
    clientSideFiltering?: boolean;
}

export const AjaxSelect: React.FC<AjaxSelectProps> = ({
    label,
    endpoint,
    value,
    onChange,
    placeholder = 'Type to search...',
    debounceMs = 300,
    extraParams = {},
    className = '',
    disabled = false,
    clientSideFiltering = false,
}) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Generate unique IDs for ARIA relationships
    const uniqueId = useId().replace(/:/g, '');
    const componentId = `ajax-select-${uniqueId}`;
    const listboxId = `${componentId}-listbox`;
    const statusId = `${componentId}-status`;

    // Fetch selected option by ID
    const { data: selectedOptionsData = [] } = useSelectedOptions(
        endpoint,
        value ? [value] : [],
        !!value
    );

    // Fetch search results based on user query
    const { data: searchResults = [], isLoading } = useSearchOptions(
        endpoint,
        clientSideFiltering ? '' : debouncedQuery,
        extraParams,
        clientSideFiltering ? { limit: 100 } : {}
    );

    // Merge and deduplicate options from both queries
    const allOptions = useMemo(() => {
        const optionsMap = new Map<number, Option>();

        // Add selected option first
        selectedOptionsData.forEach(option => {
            optionsMap.set(option.id, option);
        });

        // Add search results
        searchResults.forEach(option => {
            optionsMap.set(option.id, option);
        });

        return Array.from(optionsMap.values());
    }, [selectedOptionsData, searchResults]);

    // Filter out already selected option for the dropdown
    const availableOptions = useMemo(() => {
        let options = value
            ? allOptions.filter(option => option.id !== value)
            : allOptions;

        if (clientSideFiltering && query) {
            const lowerQuery = query.toLowerCase();
            options = options.filter(option => option.name.toLowerCase().includes(lowerQuery));
        }

        return options;
    }, [allOptions, value, clientSideFiltering, query]);

    // Get selected option for display
    const selectedOption = value
        ? allOptions.find(option => option.id === value) || null
        : null;

    // ARIA: Track focused option for aria-activedescendant
    const focusedOptionId = focusedIndex >= 0 && availableOptions[focusedIndex]
        ? `${componentId}-option-${availableOptions[focusedIndex].id}`
        : undefined;

    // ARIA: Status message for screen reader announcements
    const statusMessage = isLoading
        ? 'Searching...'
        : availableOptions.length > 0
            ? `${availableOptions.length} ${availableOptions.length === 1 ? 'result' : 'results'} available`
            : query.length > 0
                ? 'No results found'
                : '';

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, debounceMs);
        return () => clearTimeout(timer);
    }, [query, debounceMs]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset focused index when options change
    useEffect(() => {
        setFocusedIndex(-1);
    }, [availableOptions]);

    const handleSelect = (option: Option) => {
        onChange(option.id);
        setQuery('');
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setQuery('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setFocusedIndex(prev =>
                        prev < availableOptions.length - 1 ? prev + 1 : prev
                    );
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (isOpen && focusedIndex >= 0 && availableOptions[focusedIndex]) {
                    handleSelect(availableOptions[focusedIndex]);
                } else if (!isOpen) {
                    setIsOpen(true);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };

    // Scroll focused option into view
    useEffect(() => {
        if (isOpen && focusedIndex >= 0 && dropdownRef.current) {
            const optionElement = dropdownRef.current.children[focusedIndex] as HTMLElement;
            if (optionElement) {
                optionElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [focusedIndex, isOpen]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <label
                htmlFor={componentId}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
                {label}
            </label>

            <div
                className={`
          relative w-full border rounded-md bg-white dark:bg-black
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-700'}
        `}
                onClick={() => !disabled && inputRef.current?.focus()}
            >
                <div className="flex flex-wrap gap-2 p-2 pr-8 min-h-[42px]">
                    {selectedOption ? (
                        <div key="selected" className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
                            {selectedOption.name}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="ml-1 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                                    aria-label={`Remove ${selectedOption.name}`}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <input
                            key="input"
                            ref={inputRef}
                            id={componentId}
                            type="text"
                            className="flex-1 bg-transparent outline-none min-w-[120px] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder={placeholder}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setIsOpen(true);
                            }}
                            onFocus={() => setIsOpen(true)}
                            onKeyDown={handleKeyDown}
                            disabled={disabled}
                            role="combobox"
                            aria-autocomplete="list"
                            aria-expanded={isOpen}
                            aria-haspopup="listbox"
                            aria-controls={listboxId}
                            aria-activedescendant={focusedOptionId}
                        />
                    )}
                </div>

                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown size={16} />
                </div>
            </div>

            {/* Screen reader status updates */}
            <div
                id={statusId}
                className="sr-only"
                role="status"
                aria-live="polite"
            >
                {statusMessage}
            </div>

            {isOpen && !disabled && (
                <div
                    ref={dropdownRef}
                    id={listboxId}
                    role="listbox"
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                    {isLoading ? (
                        <div className="p-2 text-gray-500 dark:text-gray-400 text-sm text-center">
                            Loading...
                        </div>
                    ) : availableOptions.length > 0 ? (
                        availableOptions.map((option, index) => (
                            <div
                                key={option.id}
                                id={`${componentId}-option-${option.id}`}
                                role="option"
                                aria-selected={false}
                                className={`
                  px-3 py-2 cursor-pointer text-sm
                  ${index === focusedIndex ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'}
                `}
                                onClick={() => handleSelect(option)}
                                onMouseEnter={() => setFocusedIndex(index)}
                            >
                                {option.name}
                            </div>
                        ))
                    ) : (
                        <div className="p-2 text-gray-500 dark:text-gray-400 text-sm text-center">
                            {query ? 'No results found' : 'Type to search...'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AjaxSelect;
