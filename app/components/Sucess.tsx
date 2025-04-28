export default function PaymentSuccess() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-green-50">
      <h1 className="text-4xl font-bold text-green-700 mb-4">Payment Successful!</h1>
      <p className="text-lg text-green-800 mb-8">Thank you for your purchase. Your order is being processed.</p>
      <a
        href="/"
        className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Continue Shopping
      </a>
    </div>
  );
}
