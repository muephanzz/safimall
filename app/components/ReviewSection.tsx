import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import moment from "moment";
import Image from "next/image";

export default function ReviewSection({ reviews }) {
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const openViewer = (imgs, index) => {
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {reviews.length === 0 ? (
        <p className="text-gray-500 mb-20 text-center text-lg italic">
          No reviews yet. Be the first to review!
        </p>
      ) : (
        reviews.map((review) => (
          <div
            key={review.review_id}
            className="mb-10 border-b border-gray-300 pb-6 last:border-none"
          >
            <div className="flex items-center gap-4 mb-4">
              <Image
                src={
                  review.profiles?.avatar_url ||
                  "https://www.gravatar.com/avatar/?d=mp"
                }
                alt={`${review.username} avatar`}
                width={50}
                height={50}
                className="rounded-full border-2 border-indigo-400 shadow-md"
              />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {review.username}
                </h3>
                <time
                  className="text-gray-500 text-sm"
                  dateTime={review.created_at}
                  title={moment(review.created_at).format(
                    "MMMM Do YYYY, h:mm a"
                  )}
                >
                  {moment(review.created_at).fromNow()}
                </time>
              </div>
            </div>

            <div className="ml-14 text-gray-700 space-y-3">
              <div aria-label={`Rating: ${review.rating} out of 5 stars`}>
                {Array.from({ length: review.rating }, (_, i) => (
                  <span
                    key={i}
                    className="text-yellow-400 text-2xl leading-none select-none"
                    aria-hidden="true"
                  >
                    ★
                  </span>
                ))}
                {Array.from({ length: 5 - review.rating }, (_, i) => (
                  <span
                    key={i}
                    className="text-gray-300 text-2xl leading-none select-none"
                    aria-hidden="true"
                  >
                    ★
                  </span>
                ))}
              </div>

              <p className="text-lg leading-relaxed">{review.comment}</p>

              {review.media_urls?.length > 0 && (
                <div className="ml-0 mt-4 flex space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-gray-200 rounded-lg py-2">
                  {review.media_urls.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => openViewer(review.media_urls, idx)}
                      className="flex-shrink-0 rounded-lg overflow-hidden shadow-lg ring-2 ring-indigo-400 hover:ring-indigo-600 transition"
                      aria-label={`Open image ${idx + 1} of review media`}
                      type="button"
                    >
                      <Image
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/review-media/${img}`}
                        alt={`Review media ${idx + 1}`}
                        width={120}
                        height={120}
                        className="object-cover w-32 h-32"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer modal"
          onClick={closeViewer}
        >
          <div
            {...swipeHandlers}
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Zoom>
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/review-media/${selectedImages[currentIndex]}`}
                alt={`Review media full view ${currentIndex + 1}`}
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-indigo-600 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-3 shadow-lg transition"
                  aria-label="Previous image"
                  type="button"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setCurrentIndex((currentIndex + 1) % selectedImages.length)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-3 shadow-lg transition"
                  aria-label="Next image"
                  type="button"
                >
                  ›
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={closeViewer}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg transition"
              aria-label="Close image viewer"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
