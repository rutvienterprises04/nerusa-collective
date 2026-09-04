import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, OrderStatus } from "@/types/db";

export default function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm font-medium">
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <ol className="flex flex-col gap-0">
      {ORDER_STATUS_FLOW.map((step, i) => {
        const reached = i <= currentIndex;
        const isLast = i === ORDER_STATUS_FLOW.length - 1;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`h-4 w-4 rounded-full shrink-0 ${
                  reached ? "bg-rose-600" : "bg-slate-200"
                }`}
              />
              {!isLast && (
                <div className={`w-0.5 flex-1 ${reached ? "bg-rose-300" : "bg-slate-100"}`} />
              )}
            </div>
            <div className={`pb-6 text-sm ${reached ? "text-slate-800 font-medium" : "text-slate-400"}`}>
              {ORDER_STATUS_LABELS[step]}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
