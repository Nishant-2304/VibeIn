/**
 * ProfileCard Component
 * Displays user profile information
 * Shows avatar, name, bio, rating, and stats
 */

interface ProfileCardProps {
  user: any;
  onEdit?: () => void;
}

export function ProfileCard({ user, onEdit }: ProfileCardProps) {
  return (
    <div className="profile-card">
      {user.avatar && <img src={user.avatar} alt={user.name} />}
      <h2>{user.name}</h2>
      <p className="bio">{user.bio}</p>
      <div className="stats">
        <div className="stat">
          <span className="label">Events Hosted</span>
          <span className="value">{user.eventsHosted || 0}</span>
        </div>
        <div className="stat">
          <span className="label">Events Attended</span>
          <span className="value">{user.eventsAttended || 0}</span>
        </div>
        <div className="stat">
          <span className="label">Rating</span>
          <span className="value">{user.rating || 0}/5</span>
        </div>
      </div>
      {onEdit && <button onClick={onEdit}>Edit Profile</button>}
    </div>
  );
}
