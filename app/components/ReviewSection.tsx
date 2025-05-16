import React, { useState } from "react";
import { useSwipeable } from "react-swipeable";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import moment from "moment";
import Image from "next/image";

type Review = {
  review_id: string | number;
  username: string;
  rating: number;
  comment: string;
  created_at: string; // ISO date string
  profiles?: {
    avatar_url?: string;
  };
  media_urls?: string[];
};

type SortOrder = "newest" | "oldest" | "highest" | "lowest" | undefined;

type ReviewSectionProps = {
  reviews: Review[];
  sortOrder?: SortOrder;
};

export default function ReviewSection({ reviews, sortOrder }: ReviewSectionProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);

  const sortedReviews = React.useMemo(() => {
    if (!sortOrder) return reviews;
    switch (sortOrder) {
      case "newest":
        return [...reviews].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return [...reviews].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "highest":
        return [...reviews].sort((a, b) => b.rating - a.rating);
      case "lowest":
        return [...reviews].sort((a, b) => a.rating - b.rating);
      default:
        return reviews;
    }
  }, [reviews, sortOrder]);

  const openViewer = (imgs: string[], index: number) => {
    setSelectedImages(imgs);
    setCurrentIndex(index);
    setShowModal(true);
  };

  const closeViewer = () => {
    setShowModal(false);
    setSelectedImages([]);
    setCurrentIndex(0);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () =>
      setCurrentIndex((prev) => (prev + 1) % selectedImages.length),
    onSwipedRight: () =>
      setCurrentIndex(
        (prev) => (prev - 1 + selectedImages.length) % selectedImages.length
      ),
    trackMouse: true,
  });

  return (
    <div className="max-w-2xl sm:max-w-4xl mx-auto px-2 sm:px-4 lg:px-8">
      {sortedReviews.length === 0 ? (
        <p className="text-gray-500 mb-20 text-center text-base sm:text-lg italic">
          No reviews yet. Be the first to review!
        </p>
      ) : (
        sortedReviews.map((review: Review) => (
          <div
            key={review.review_id}
            className="mb-8 sm:mb-10 border-b border-gray-200 pb-6 last:border-none"
          >
            {/* Reviewer info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <Image
                src={
                  review.profiles?.avatar_url ||
                  "https://www.gravatar.com/avatar/?d=mp"
                }
                alt={`${review.username} avatar`}
                width={44}
                height={44}
                className="rounded-full border-2 border-indigo-400 shadow-md"
              />
              <div>
                <h3 className="text-base sm:text-xl font-semibold text-gray-900">
                  {review.username}
                </h3>
                <time
                  className="text-gray-500 text-xs sm:text-sm"
                  dateTime={review.created_at}
                  title={moment(review.created_at).format(
                    "MMMM Do YYYY, h:mm a"
                  )}
                >
                  {moment(review.created_at).fromNow()}
                </time>
              </div>
            </div>

            <div className="ml-0 sm:ml-14 text-gray-700 space-y-3">
              {/* Rating */}
              <div aria-label={`Rating: ${review.rating} out of 5 stars`}>
                {Array.from({ length: review.rating }, (_, i) => (
                  <span
                    key={i}
                    className="text-yellow-400 text-xl sm:text-2xl leading-none select-none"
                    aria-hidden="true"
                  >
                    ★
                  </span>
                ))}
                {Array.from({ length: 5 - review.rating }, (_, i) => (
                  <span
                    key={i}
                    className="text-gray-300 text-xl sm:text-2xl leading-none select-none"
                    aria-hidden="true"
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Comment */}
              <p className="text-base sm:text-lg leading-relaxed">
                {review.comment}
              </p>

              {/* Image gallery */}
              {review.media_urls?.length ? (
                <div className="flex gap-2 sm:gap-4 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-gray-200 rounded-lg">
                  {review.media_urls.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => openViewer(review.media_urls!, idx)}
                      className="flex-shrink-0 rounded-lg overflow-hidden shadow-lg ring-2 ring-indigo-400 hover:ring-indigo-600 transition"
                      aria-label={`Open image ${idx + 1} of review media`}
                      type="button"
                      tabIndex={0}
                    >
                      <Image
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/review-media/${img}`}
                        alt={`Review media ${idx + 1}`}
                        width={96}
                        height={96}
                        className="object-cover w-24 h-24 sm:w-32 sm:h-32"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer modal"
          onClick={closeViewer}
        >
          <div
            {...swipeHandlers}
            className="relative w-full max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Zoom>
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/review-media/${selectedImages[currentIndex]}`}
                alt={`Review media full view ${currentIndex + 1}`}
                className="max-w-full max-h-[60vh] sm:max-h-[85vh] rounded-lg shadow-2xl"
              />
            </Zoom>
            {/* Navigation Buttons */}
            {selectedImages.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentIndex(
                      (currentIndex - 1 + selectedImages.length) %
                        selectedImages.length
                    )
                  }
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-indigo-600 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-2 sm:p-3 shadow-lg transition focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Previous image"
                  type="button"
                  tabIndex={0}
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setCurrentIndex((currentIndex + 1) % selectedImages.length)
                  }
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-indigo-600 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-2 sm:p-3 shadow-lg transition focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Next image"
                  type="button"
                  tabIndex={0}
                >
                  ›
                </button>
              </>
            )}
            {/* Close Button */}
            <button
              onClick={closeViewer}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 sm:p-3 shadow-lg transition focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close image viewer"
              type="button"
              tabIndex={0}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
