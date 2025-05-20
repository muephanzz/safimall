import { useRouter } from "next/navigation";

interface ProductHeaderProps {
  isMobile: boolean;
  title: string;
}

export default function ProductHeader({ isMobile, title }: ProductHeaderProps) {
  const router = useRouter();

  return (
    isMobile && (
      <div className="sticky top-0 z-30 bg-white flex items-center px-2 py-2 shadow-md">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 mr-2"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Title */}
        <div className="flex-1 text-center font-semibold text-lg">
          {title}
        </div>

        {/* Search Icon */}
        <button
          onClick={() => router.push("/search")}
          aria-label="Search"
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 ml-2"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>
    )
  );
}
