import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
    links,
    currentPage,
    lastPage,
    paginator,
    preserveScroll = true,
    preserveState = true,
    only,
}) {
    let current = currentPage || 1;
    let totalPages = lastPage || 1;
    let totalItems = null;
    let fromItem = null;
    let toItem = null;
    let prevUrl = null;
    let nextUrl = null;
    let pageLinks = [];

    if (paginator) {
        current = paginator.current_page || 1;
        totalPages = paginator.last_page || 1;
        totalItems = paginator.total;
        fromItem = paginator.from;
        toItem = paginator.to;
        prevUrl = paginator.prev_page_url;
        nextUrl = paginator.next_page_url;
        pageLinks = paginator.links || [];
    } else if (links && links.length > 0) {
        pageLinks = links;
        const activeLink = links.find((l) => l.active);
        if (activeLink) {
            current = parseInt(activeLink.label, 10) || 1;
        }

        const numericLinks = links.filter((l) => !isNaN(parseInt(l.label, 10)));
        if (numericLinks.length > 0) {
            totalPages = parseInt(numericLinks[numericLinks.length - 1].label, 10);
        }

        prevUrl = links[0]?.url;
        nextUrl = links[links.length - 1]?.url;
    }

    if (!totalPages || totalPages <= 1) return null;

    // Generate page numbers with sliding window and ellipsis
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            let start = Math.max(2, current - 1);
            let end = Math.min(totalPages - 1, current + 1);

            if (current <= 3) {
                end = 4;
            } else if (current >= totalPages - 2) {
                start = totalPages - 3;
            }

            if (start > 2) {
                pages.push('...');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages - 1) {
                pages.push('...');
            }

            pages.push(totalPages);
        }

        return pages;
    };

    // Helper to resolve URL for a page number from Laravel links or current URL
    const getUrlForPage = (pageNum) => {
        if (typeof pageNum !== 'number') return null;
        const match = pageLinks.find((l) => parseInt(l.label, 10) === pageNum);
        if (match && match.url) return match.url;

        if (typeof window !== 'undefined') {
            const path = paginator?.path || window.location.pathname;
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.set('page', pageNum);
            return `${path}?${currentParams.toString()}`;
        }
        return `?page=${pageNum}`;
    };

    const pages = getPageNumbers();

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-white border-t border-gray-100/80 rounded-b-3xl">
            {/* Info text */}
            <div className="text-xs text-gray-500 font-medium">
                {totalItems ? (
                    <>
                        Menampilkan <span className="font-semibold text-gray-900">{fromItem || 1}</span> - <span className="font-semibold text-gray-900">{toItem || totalItems}</span> dari <span className="font-semibold text-gray-900">{totalItems}</span> data
                    </>
                ) : (
                    <>
                        Halaman <span className="font-semibold text-gray-900">{current}</span> dari <span className="font-semibold text-gray-900">{totalPages}</span>
                    </>
                )}
            </div>

            {/* Pagination Controls: < (nomor) > */}
            <div className="flex items-center gap-1">
                {/* Prev Button (<) */}
                {prevUrl ? (
                    <Link
                        href={prevUrl}
                        preserveScroll={preserveScroll}
                        preserveState={preserveState}
                        only={only}
                        className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors shadow-2xs cursor-pointer"
                        title="Halaman Sebelumnya"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Link>
                ) : (
                    <span className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-gray-300 bg-gray-50 rounded-lg border border-gray-100 cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" />
                    </span>
                )}

                {/* Numbered Page Buttons */}
                {pages.map((p, idx) => {
                    if (p === '...') {
                        return (
                            <span key={`dots-${idx}`} className="w-6 text-center text-xs font-bold text-gray-400 select-none">
                                ...
                            </span>
                        );
                    }

                    const isActive = p === current;
                    const pageUrl = getUrlForPage(p);

                    if (isActive) {
                        return (
                            <span
                                key={p}
                                className="w-8 h-8 flex items-center justify-center text-xs font-bold text-white bg-blue-600 rounded-lg shadow-xs select-none"
                            >
                                {p}
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={p}
                            href={pageUrl || '#'}
                            preserveScroll={preserveScroll}
                            preserveState={preserveState}
                            only={only}
                            className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors shadow-2xs cursor-pointer"
                        >
                            {p}
                        </Link>
                    );
                })}

                {/* Next Button (>) */}
                {nextUrl ? (
                    <Link
                        href={nextUrl}
                        preserveScroll={preserveScroll}
                        preserveState={preserveState}
                        only={only}
                        className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors shadow-2xs cursor-pointer"
                        title="Halaman Selanjutnya"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                ) : (
                    <span className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-gray-300 bg-gray-50 rounded-lg border border-gray-100 cursor-not-allowed">
                        <ChevronRight className="w-4 h-4" />
                    </span>
                )}
            </div>
        </div>
    );
}
