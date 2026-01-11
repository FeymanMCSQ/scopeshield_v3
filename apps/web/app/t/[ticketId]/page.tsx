export default function PublicTicketPage({
  params,
}: {
  params: { ticketId: string };
}) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Public Ticket</h1>
      <p>ticketId: {params.ticketId}</p>
      <p>This route must remain public.</p>
    </main>
  );
}
