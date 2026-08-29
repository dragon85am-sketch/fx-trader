function getStatusLabel(status: string) {
  switch (status) {
    case "Approved":
      return "Zatwierdzona";
    case "Paid":
      return "Opłacona";
    case "Rejected":
      return "Odrzucona";
    case "Pending":
    default:
      return "Oczekuje";
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "Approved":
      return "border-blue-400/20 bg-blue-500/10 text-blue-300";
    case "Paid":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    case "Rejected":
      return "border-red-400/20 bg-red-500/10 text-red-300";
    case "Pending":
    default:
      return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  }
}

export default function PayoutStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}