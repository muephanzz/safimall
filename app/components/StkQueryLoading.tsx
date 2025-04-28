import { Loader2 } from "lucide-react";

interface STKPushQueryLoadingProps {
  number: string;
}

export default function STKPushQueryLoading({ number }: STKPushQueryLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl shadow-md max-w-md mx-auto text-gray-900">
      <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
      <h2 className="text-2xl font-semibold mb-2">Processing Your Payment</h2>
      <p className="text-md text-gray-700 mb-1">
        An STK Push has been sent to <span className="font-mono font-semibold">{number}</span>.
      </p>
      <p className="text-md text-gray-700">
        Please enter your M-Pesa PIN on your phone to authorize the transaction.
      </p>
    </div>
  );
}
