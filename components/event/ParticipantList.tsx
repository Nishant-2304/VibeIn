/**
 * ParticipantList Component
 * Displays list of event participants
 * Shows participant details, registration status, and attendance
 */

interface ParticipantListProps {
  participants: Array<any>;
  onParticipantClick?: (id: string) => void;
}

export function ParticipantList({ participants, onParticipantClick }: ParticipantListProps) {
  return (
    <div className="participant-list">
      <h3>Participants ({participants.length})</h3>
      <ul>
        {participants.map((participant) => (
          <li key={participant.id} onClick={() => onParticipantClick?.(participant.id)}>
            <span>{participant.name}</span>
            <span className="status">{participant.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
