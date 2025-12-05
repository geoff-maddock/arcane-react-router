import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SortControls from './SortControls';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemCount: number;
    totalItems: number;
    itemsPerPage: number;
    onItemsPerPageChange: (count: number) => void;
    sort: string;
    setSort: (value: string) => void;
    direction: 'asc' | 'desc';
    setDirection: (value: 'asc' | 'desc') => void;
    sortOptions: { value: string; label: string }[];
}

const itemsPerPageOptions = [
    { value: "10", label: "10 per page" },
    { value: "25", label: "25 per page" },
    { value: "50", label: "50 per page" },
    { value: "100", label: "100 per page" },
    { value: "all", label: "All" },
];

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    onItemsPerPageChange,
    sort,
    setSort,
    direction,
    setDirection,
    sortOptions
}: PaginationProps) {

    return (
        <div className="flex flex-col gap-4 md:gap-0 border-t py-3 md:px-6 !mt-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center justify-between md:justify-start gap-4">

                    <p className="text-sm text-gray-700 hidden md:block">
                        Showing{' '}
                        <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>{' '}
                        to{' '}
                        <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, totalItems)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{totalItems}</span>{' '}
                        results
                    </p>

                    <Select
                        value={itemsPerPage >= totalItems && totalItems > 100 ? 'all' : itemsPerPage.toString()}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                onItemsPerPageChange(totalItems);
                            } else {
                                onItemsPerPageChange(Number(value));
                            }
                        }}
                    >
                        <SelectTrigger className="w-[140px]" aria-label="Items per page">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {itemsPerPageOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <SortControls
                        sort={sort}
                        setSort={setSort}
                        direction={direction}
                        setDirection={setDirection}
                        sortOptions={sortOptions}
                    />
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0">
                    <div className="flex items-center justify-between w-full">
                        <Button
                            variant="outline"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            size="sm"
                            className="flex items-center gap-1"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-gray-700 px-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            size="sm"
                            className="flex items-center gap-1"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
