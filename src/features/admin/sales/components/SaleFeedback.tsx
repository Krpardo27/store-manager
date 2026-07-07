type SaleFeedbackProps = {
  error: string | null;
  message: string | null;
  cameraDebugDetail: string | null;
};

export default function SaleFeedback({ error, message, cameraDebugDetail }: SaleFeedbackProps) {
  return (
    <>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
          {cameraDebugDetail && <p className="mt-1 text-xs text-red-600">Detalle tecnico: {cameraDebugDetail}</p>}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      )}
    </>
  );
}
